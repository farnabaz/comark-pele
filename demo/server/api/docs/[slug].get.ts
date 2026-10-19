import { parseMarkdown } from 'comark'
import { plugins } from '#shared/comark'

/**
 * A page's `.md` file and its parsed tree. Parsed on each request, so the same
 * route would serve Markdown from a database or a model.
 */
export default defineEventHandler(async (event) => {
  const source = await readSource(event)
  return { source, document: await parseMarkdown(source, { plugins }) }
})
