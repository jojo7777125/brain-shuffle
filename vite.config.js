import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

// In production Vercel runs api/sort.js for us.
// In local dev, this tiny plugin does the same job so `npm run dev` just works.
function localApi() {
  return {
    name: 'local-api',
    configureServer(server) {
      server.middlewares.use('/api/sort', async (req, res) => {
        const chunks = []
        for await (const c of req) chunks.push(c)
        const request = new Request('http://localhost/api/sort', {
          method: req.method,
          headers: { 'Content-Type': 'application/json' },
          body: req.method === 'POST' ? Buffer.concat(chunks) : undefined,
        })
        const { POST } = await server.ssrLoadModule('/api/sort.js')
        const response = await POST(request)
        res.statusCode = response.status
        res.setHeader('Content-Type', 'application/json')
        res.end(await response.text())
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // Put ANTHROPIC_* from .env.local into process.env for the dev API (never sent to the browser).
  Object.assign(process.env, loadEnv(mode, process.cwd(), 'ANTHROPIC_'))
  return { plugins: [react(), tailwindcss(), localApi()] }
})
