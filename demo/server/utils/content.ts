import type { H3Event } from 'h3'

/** Read `content/<slug>.md`, bundled with the server as a Nitro server asset. */
export async function readSource(event: H3Event): Promise<string> {
  const slug = getRouterParam(event, 'slug') ?? ''
  if (!/^[a-z0-9-]+$/.test(slug)) throw createError({ statusCode: 400, statusMessage: 'Unexpected slug' })

  const source = await useStorage('assets:content').getItem<string>(`${slug}.md`)
  if (typeof source !== 'string') throw createError({ statusCode: 404, statusMessage: 'No such page' })
  return source
}
