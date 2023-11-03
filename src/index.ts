// src/index.ts
import { ExportedHandler, ExecutionContext, ScheduledEvent } from '@cloudflare/workers-types'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { type Env } from './types'
import { fetchAndProcessLatestQuakes, postAllToThreads, Preview } from './helper_methods'

const bot = new Hono<{ Bindings: Env }>({ strict: false })

bot
  .notFound((c) => c.json({ message: 'Not Found' }, 404))
  .onError((err, c) => {
    if ([401, 403].includes(err.status)) {
      console.debug(`${err.status ?? 500}: ${err.message}`)
      console.debug(`Authorization: ${c.req.header('Authorization')}`)
      return c.json({ message: err.message }, err.status)
    } else if (err instanceof HTTPException) {
      console.debug(`${err.status ?? 500}: ${err.message} | ${JSON.stringify(err.getResponse(), null, 2)}`)
      return c.json({ message: err.message }, err.status ?? 500)
    } else {
      console.error(`${err.status ?? 500}: ${err.message}`)
      return c.json({ message: `Error: ${err.message}` }, err.status ?? 500)
    }
  })
  .use(
    '*',
    cors({
      origin: (origin: string) => {
        if (
          origin.toLowerCase().endsWith('.threads.net') ||
          origin.toLowerCase().endsWith('.instagram.com') ||
          origin.toLowerCase().endsWith('.facebook.com') ||
          origin.toLowerCase().endsWith('.distal-labs.workers.dev')
        ) {
          return origin
        } else {
          return 'https://www.threads.net'
        }
      },
      // allowHeaders: ['Upgrade-Insecure-Requests'],
      allowMethods: ['GET'],
      exposeHeaders: [],
      maxAge: 600,
      credentials: false,
    })
  )
  .get('/', async (c) => {
    const latestQuakes = await fetchAndProcessLatestQuakes(false)
    if (latestQuakes.length === 0) {
      return c.text(
        'There have been no earthquakes of magnitude 2.5+ in the contiguous United States within the last day.'
      )
    }
    return c.html(Preview(latestQuakes[0]))
  })
  .get('/favicon.ico', (c) => {
    return c.redirect('https://earthquake.usgs.gov/favicon.ico')
  })
  .get('/health', (c) => {
    return c.text('OK', 200)
  })

const handler: ExportedHandler = {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const latestQuakes: string[] = await fetchAndProcessLatestQuakes(true)
    if (latestQuakes.length > 0) {
      const postAllQuakes = () => {
        postAllToThreads(env, latestQuakes)
          .then((didPostAllToThreads) => {
            if (!didPostAllToThreads) {
              console.error(`CRON | ${event.cron} | Posting to Threads FAILED`)
            }
            console.info(`CRON | ${event.cron} | Posting to Threads SUCCEEDED`)
          })
          .catch((e) => {
            console.error(e as Error)
          })
      }
      ctx.waitUntil(postAllQuakes()) // Post to Threads, but don't block response
    }
  },

  async fetch(request: Request, env: Env, executionCtx: ExecutionContext) {
    return await bot.fetch(request, env, executionCtx)
  },
}

export default handler
