/** A page's `.md` file, unparsed, for the streaming demo, which parses in the browser. */
export default defineEventHandler(async event => ({ source: await readSource(event) }))
