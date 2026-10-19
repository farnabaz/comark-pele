---
title: Checkout v2
summary: A design doc where every diagram is a mermaid code block, drawn by Pele.
---

# Checkout v2 — design doc

This whole page is one Markdown file. The prose is CommonMark, and every
diagram in it is a plain ` ```mermaid ` code block. The
[comark-pele](https://github.com/farnabaz/comark-pele) plugin turns those
blocks into `pele` nodes while [Comark](https://comark.dev) parses the file,
and [Pele](https://pele.run) draws each one as SVG. The SVG is in the HTML the
server sends, so the diagrams show up before any JavaScript runs.

No MDX and no build step: the file is read and parsed on each request, so the
same code would serve Markdown from a database or a model.

## The request path

A checkout starts at the edge and goes to two services. Only the payment call
is on the critical path. Inventory is reserved at the same time and released
if the payment fails.

```mermaid
flowchart LR
  client([Browser]) --> edge[Edge cache]
  edge --> api{Checkout API}
  api -->|reserve| inv[(Inventory)]
  api -->|authorize| pay[Payments]
  pay --> psp[[Card network]]
  api -->|on success| queue>Order events]
  queue --> mail[Receipts]
  queue --> wh[Warehouse]
```

### Authorizing a card

The API holds the reservation until the card network answers, then confirms
or releases it. A timeout counts as a decline, so a slow network never leaves
stock reserved.

```mermaid
sequenceDiagram
  autonumber
  participant B as Browser
  participant A as Checkout API
  participant I as Inventory
  participant P as Payments
  B->>A: POST /checkout
  par
    A->>I: reserve(items)
  and
    A->>P: authorize(card, total)
  end
  alt approved
    P-->>A: approved
    A->>I: confirm()
    A-->>B: 201 order
  else declined or timeout
    P-->>A: declined
    A->>I: release()
    A-->>B: 402 try another card
  end
```

## The order lifecycle

An order is a small state machine. Every change is an event on the order
stream, so the warehouse and the receipts service never call the API.

```mermaid
stateDiagram-v2
  [*] --> Pending
  Pending --> Paid: payment approved
  Pending --> Cancelled: payment declined
  Paid --> Packed
  Packed --> Shipped
  Shipped --> Delivered
  Delivered --> [*]
  Paid --> Refunded: customer cancels
  Refunded --> [*]
  Cancelled --> [*]
```

### Data model

```mermaid
erDiagram
  CUSTOMER ||--o{ ORDER : places
  ORDER ||--|{ LINE_ITEM : contains
  PRODUCT ||--o{ LINE_ITEM : "appears in"
  ORDER ||--o| PAYMENT : "paid by"
  CUSTOMER {
    string id PK
    string email
  }
  ORDER {
    string id PK
    string customer_id FK
    string status
    int total_cents
  }
  LINE_ITEM {
    string order_id FK
    string product_id FK
    int quantity
  }
  PAYMENT {
    string id PK
    string order_id FK
    string provider
  }
```

## Where it runs

```mermaid
architecture-beta
  group edge(cloud)[Edge]
  group core(server)[Core region]

  service cdn(internet)[CDN] in edge
  service api(server)[Checkout API] in core
  service db(database)[Postgres] in core
  service queue(disk)[Event log] in core

  cdn:R --> L:api
  api:R --> L:db
  api:B --> T:queue
```

## What we expect

v1 spends most of its time waiting on the inventory lock. Moving the
reservation off the critical path should take p95 under the 400 ms budget.

```mermaid
xychart-beta
  title "p95 checkout latency (ms)"
  x-axis [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
  y-axis "ms" 0 --> 900
  bar [720, 690, 810, 760, 840, 610, 580]
  line [380, 360, 410, 390, 420, 330, 310]
```

Bars are v1 in production last week, the line is v2 under replayed traffic.
Card payments are most of the volume, so they are what the canary watches.

```mermaid
pie showData
  title Payment methods, last 30 days
  "Card" : 61
  "Wallet" : 27
  "Bank transfer" : 9
  "Gift card" : 3
```

### Risks

```mermaid
quadrantChart
  title Risks by likelihood and impact
  x-axis Unlikely --> Likely
  y-axis Minor --> Severe
  quadrant-1 Mitigate first
  quadrant-2 Plan for it
  quadrant-3 Accept
  quadrant-4 Watch
  Double charge: [0.2, 0.92]
  Stock oversold: [0.55, 0.7]
  Slow card network: [0.8, 0.45]
  Receipt delays: [0.7, 0.15]
  Currency rounding: [0.3, 0.3]
```

## Rollout

v2 ships behind a flag, one region at a time, with v1 kept warm until the
last region has run clean for a week.

```mermaid
gantt
  title Checkout v2 rollout
  dateFormat YYYY-MM-DD
  axisFormat %b %d
  section Build
    Async reservations    :done, b1, 2026-09-01, 14d
    Event stream          :done, b2, after b1, 10d
  section Rollout
    Canary 1%             :active, r1, 2026-09-28, 7d
    EU                    :r2, after r1, 7d
    US                    :r3, after r2, 7d
    APAC                  :crit, r4, after r3, 7d
  section Cleanup
    Remove v1             :c1, after r4, 5d
```

Each stage merges to `main` behind its own flag, so a rollback is a flag
flip, not a revert.

```mermaid
gitGraph
  commit id: "v1.9"
  branch checkout-v2
  commit id: "async reserve"
  commit id: "event stream"
  checkout main
  commit id: "hotfix"
  checkout checkout-v2
  merge main
  commit id: "flag: canary"
  checkout main
  merge checkout-v2 tag: "v2.0"
```

---

Every diagram type Pele supports is on the [catalog](/catalog) page.
