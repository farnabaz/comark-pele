export const sample = `# Pele in Comark

Diagrams are written in **Mermaid** syntax inside \`mermaid\` or \`pele\` code blocks.

## A \`mermaid\` block

\`\`\`mermaid
flowchart LR
  A[Markdown] --> B{comark-pele}
  B -- parse --> C([pele node])
  C -- render --> D[SVG]
\`\`\`

## A \`pele\` block

\`\`\`pele
sequenceDiagram
  participant App
  participant Comark
  participant Pele
  App->>Comark: parse(markdown)
  Comark-->>App: pele node
  App->>Pele: render(content)
  Pele-->>App: SVG
\`\`\`

## Fence props

Props on the fence go to the component, like \`.wide\` here:

\`\`\`pele {.wide}
pie title Diagrams in this page
  "Flowchart": 1
  "Sequence": 1
  "Pie": 1
\`\`\`

## Other code blocks stay as they are

\`\`\`js
import pele from 'comark-pele'
\`\`\`

## Errors

\`\`\`mermaid
this is not a diagram
\`\`\`
`
