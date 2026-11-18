// Vercel serverless function: POST /api/sort  { dump: "..." }  →  { tasks, notTasks }
// This runs on Vercel's servers, NOT in the browser, so ANTHROPIC_API_KEY stays secret.
import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import { z } from 'zod'
import { normalizePlan, PRIORITIES, CATEGORIES, NOTE_KINDS } from '../src/lib/schema.js'

const MAX_DUMP = 6000 // characters; keeps cost and speed in check

// The exact shape Claude MUST reply with. Structured outputs guarantee the JSON matches this.
const PlanSchema = z.object({
  tasks: z.array(
    z.object({
      title: z.string(),
      minutes: z.number(),
      priority: z.enum(PRIORITIES),
      category: z.enum(CATEGORIES),
    }),
  ),
  notTasks: z.array(
    z.object({
      text: z.string(),
      kind: z.enum(NOTE_KINDS),
    }),
  ),
})

const SYSTEM = `You are a calm, practical planning assistant for a busy teenager.
You turn a messy brain dump into a clean plan.

Rules:
- A task is something the person can DO. Write titles as short actions starting with a verb ("Finish history essay").
- Split combined items into separate tasks. Merge duplicates.
- minutes: a realistic estimate, one of 5, 10, 15, 30, 45, 60, 90, 120.
- priority: "now" = urgent or due very soon; "today" = should happen today; "later" = can wait.
  Use the person's current local time to judge this (e.g. late at night, something due tomorrow morning is "now";
  something for "this weekend" on a Monday is "later").
- category: school, work, personal, or errands (shopping, pickups, returns, appointments).
- Worries, feelings and ideas go in notTasks, not tasks. Keep the person's meaning; tidy the wording.
- Never invent things that are not in the dump.`

const client = new Anthropic() // reads ANTHROPIC_API_KEY from the environment

export async function POST(request) {
  let dump, localTime
  try {
    const body = await request.json()
    dump = String(body?.dump ?? '').trim()
    // e.g. "Tuesday, November 17, 10:47 PM". Capped in length since it comes from the browser.
    localTime = String(body?.localTime ?? '').slice(0, 60)
  } catch {
    return Response.json({ error: 'Body must be JSON: { "dump": "..." }' }, { status: 400 })
  }
  if (!dump) return Response.json({ error: 'Dump is empty' }, { status: 400 })

  try {
    const response = await client.beta.messages.parse(
      {
        model: 'claude-opus-5-5',
        max_tokens: 16000,
        system: SYSTEM,
        messages: [
          {
            role: 'user',
            content: `${localTime ? `Current local time: ${localTime}\n\n` : ''}BRAIN DUMP:\n"""\n${dump.slice(0, MAX_DUMP)}\n"""`,
          },
        ],
        output_config: {
          effort: 'low', // simple sorting job: low effort keeps it fast and cheap
          format: betaZodOutputFormat(PlanSchema),
        },
        // If Claude declines a request for safety reasons, retry on a fallback model automatically.
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
      },
      { timeout: 22000, maxRetries: 1 },
    )

    if (response.stop_reason === 'refusal') throw new Error('Claude declined to sort this dump')
    if (!response.parsed_output) throw new Error(`No parsed output (stop: ${response.stop_reason})`)

    // Belt and braces: our own checker still cleans it up and adds ids.
    return Response.json(normalizePlan(response.parsed_output))
  } catch (err) {
    console.error('[api/sort]', err)
    // The browser sees a 502 and switches to the offline sorter.
    return Response.json({ error: err.message }, { status: 502 })
  }
}
