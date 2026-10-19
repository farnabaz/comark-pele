# comark-pele demo

Mermaid diagrams written in **plain `.md` files**, parsed by
[Comark](https://comark.dev) and drawn by [Pele](https://pele.run) through
`comark-pele`. A Nuxt app, modeled on
[comark-graphs-demo](https://comark-graphs-demo.vercel.app/).

| Route        | What it shows |
| ------------ | ------------- |
| `/`          | A design doc with ten diagram types, from `content/report.md` |
| `/catalog`   | Every other diagram type Pele supports, plus fence props and an invalid block, from `content/catalog.md` |
| `/streaming` | A write-up revealed a few characters at a time and parsed again every frame, from `content/streaming.md` |

Every page except streaming has a **Source** tab that shows its `.md` file.

## Run it

From the repo root:

```bash
pnpm install
pnpm demo
```

The app imports `comark-pele` from `../src`, so edits to the plugin show up
without a build.

## How it fits together

```
content/*.md                    the pages, with ```mermaid blocks
shared/comark.ts                [pele()], shared by the server and the streaming demo
server/api/docs/[slug].get.ts   reads a .md file and parses it, per request
app/comark.ts                   { Pele: createPeleComponent() }, the map handed to Comark
app/components/DocPage.vue      fetches a page and renders it with MarkdownDocument
```

The server route parses the Markdown and the pages render the tree with
`MarkdownDocument`, so the Comark parser stays out of the browser bundle.
`Pele` renders the SVG during SSR, so the diagrams are in the HTML. In the
browser it switches to Pele's `mount()`, which fits each diagram to its
column and adds zoom when one has to shrink. The `.md` files are Nitro server
assets, so they ship with the server on any host.

Diagram colors are Pele's CSS variables, mapped to the site's tokens in
`app/assets/main.css`. The theme toggle only changes a class, and every
diagram follows without being drawn again.
