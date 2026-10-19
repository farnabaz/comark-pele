---
title: Diagram catalog
summary: Every diagram type Pele supports that the design doc does not already use, each one a mermaid code block.
---

# Diagram catalog

The [design doc](/) uses ten diagram types. Here are the rest, so you can see
what each one looks like when Pele draws it. Every figure below is a code
block in `content/catalog.md`. Nothing on this page is written in TSX.

## Structure

```mermaid
classDiagram
  class Order {
    +string id
    +Status status
    +total() Money
    +cancel()
  }
  class LineItem {
    +Product product
    +int quantity
  }
  class Payment {
    <<interface>>
    +authorize(Money) Result
  }
  class CardPayment
  class WalletPayment
  Order "1" *-- "many" LineItem
  Order --> Payment
  Payment <|.. CardPayment
  Payment <|.. WalletPayment
```

```mermaid
block-beta
  columns 3
  web["Web"] mobile["Mobile"] partner["Partner API"]
  gateway["API gateway"]:3
  block:services:3
    checkout["Checkout"] catalog["Catalog"] accounts["Accounts"]
  end
  db[("Postgres")]:3
```

```mermaid
C4Context
  title Checkout in context
  Person(customer, "Customer", "Buys things")
  System(shop, "Shop", "Web and mobile storefront")
  System_Ext(psp, "Card network", "Authorizes payments")
  System_Ext(mail, "Email provider", "Sends receipts")
  Rel(customer, shop, "Checks out")
  Rel(shop, psp, "Authorizes cards")
  Rel(shop, mail, "Sends receipts")
```

```mermaid
requirementDiagram
  requirement checkout_req {
    id: 1
    text: Orders must be payable online.
    risk: high
    verifymethod: test
  }
  functionalRequirement timeout_req {
    id: 1.1
    text: A card timeout releases reserved stock.
    risk: medium
    verifymethod: test
  }
  element checkout_api {
    type: service
  }
  checkout_req - contains -> timeout_req
  checkout_api - satisfies -> timeout_req
```

## Process

```mermaid
swimlane-beta LR
  subgraph Customer
    request[Report a wrong charge]
    receive[Get a refund]
  end

  subgraph Support
    triage[Triage]
    refund[Issue refund]
  end

  subgraph Payments
    investigate[Check the ledger]
  end

  request --> triage
  triage -->|Obvious| refund
  triage -->|Unclear| investigate
  investigate --> refund
  refund --> receive
```

```mermaid
agentflow-beta TB
  flow intake["Intake"]
    receive["Receive ticket"]@{ shape: input }
  end

  flow triage["Triage"]
    classify["Classify"]@{ shape: task }
    lookup["Look up order"]@{ shape: task }
    classify --> lookup
  end

  flow reply["Reply"]
    answer["Draft answer"]@{ shape: action }
  end

  receive --> classify
  lookup --> answer
```

```mermaid
usecase-beta
direction LR
actor Customer
actor Support
Browse("Browse catalog")
Checkout("Check out")
Refund("Request refund")
Customer --> Browse
Customer --> Checkout
Customer --> Refund
Support --> Refund
```

```mermaid
journey
  title Buying a gift
  section Find it
    Search: 4: Customer
    Compare: 3: Customer
  section Pay
    Enter card: 2: Customer
    3-D Secure: 1: Customer, Bank
  section After
    Receipt: 5: Customer
    Delivery: 4: Customer, Courier
```

```mermaid
eventmodeling

timeframe 01 ui CartUI
timeframe 02 command AddItem [[AddItem01]]
timeframe 03 event ItemAdded [[ItemAdded]]
timeframe 04 command Checkout [[Checkout01]]
timeframe 05 event OrderPlaced [[OrderPlaced]]

data AddItem01 {
  sku: 'mug-blue'
  quantity: 2
}

data ItemAdded {
  sku: string
  quantity: number
}

data Checkout01 {
  card: 'visa-4242'
}

data OrderPlaced {
  orderId: string
  total: number
}
```

## Planning

```mermaid
timeline
  title Checkout over the years
  2019 : v0, a form and a cron job
  2021 : v1 : Card payments : Inventory locks
  2024 : Wallets : Gift cards
  2026 : v2 : Async reservations : Order events
```

```mermaid
kanban
  todo[Todo]
    t1[Remove v1 checkout]
    t2[Gift card refunds]@{ priority: 'Low' }
  doing[In progress]
    t3[APAC rollout]@{ assigned: 'platform', priority: 'High' }
  review[Review]
    t4[Receipt templates]@{ assigned: 'growth' }
  done[Done]
    t5[Event stream]
    t6[Async reservations]
```

## Charts

```mermaid
sankey-beta

Visits,Product page,10000
Product page,Cart,4200
Product page,Left,5800
Cart,Checkout,2600
Cart,Left,1600
Checkout,Paid,2300
Checkout,Declined,300
```

```mermaid
radar-beta
  title Payment providers
  axis cost["Cost"], speed["Speed"], coverage["Coverage"]
  axis fraud["Fraud tools"], support["Support"]

  curve a["Provider A"]{4, 3, 5, 4, 3}
  curve b["Provider B"]{3, 5, 3, 3, 4}

  graticule polygon
  max 5
```

```mermaid
treemap-beta
"Monthly spend"
    "Compute"
        "App servers": 4210
        "Search": 1880
    "Storage"
        "Postgres": 2340
        "Object store": 610
    "Network"
        "Egress": 1120
```

```mermaid
venn-beta
  title Who owns checkout
  set Platform
  set Payments
  set Growth
  union Platform,Payments["Uptime"]
  union Payments,Growth["Conversion"]
  union Platform,Growth["Speed"]
  union Platform,Payments,Growth["Checkout"]
```

```mermaid
packet-beta
  title Order event header
  0-7: "Version"
  8-15: "Type"
  16-31: "Flags"
  32-95: "Order id"
  96-127: "Timestamp"
```

## Maps

```mermaid
mindmap
  root((Checkout))
    Payments
      Cards
      Wallets
      Gift cards
    Inventory
      Reserve
      Release
    Events
      Receipts
      Warehouse
```

```mermaid
treeView-beta
    content/
        report.md
        catalog.md
        streaming.md
    src/
        app/
            page.tsx
        comark/
            components.tsx
    package.json
```

```mermaid
ishikawa-beta
    Abandoned carts
    Price
        Shipping shown late
        No free tier
    Payment
        3-D Secure fails
        Wallet missing
    Speed
        Slow inventory lock
    Trust
        No reviews
```

```mermaid
wardley-beta
title Checkout value chain

anchor Customer [0.95, 0.63]
component Checkout [0.79, 0.55]
component Payments [0.60, 0.75]
component Inventory [0.55, 0.45]
component Card network [0.35, 0.88]
component Compute [0.10, 0.85]

Customer -> Checkout
Checkout -> Payments
Checkout -> Inventory
Payments -> Card network
Inventory -> Compute

evolve Inventory 0.70
```

```mermaid
cynefin-beta
  title Checkout incidents

  complex
    "Fraud spikes"

  complicated
    "Slow card network"

  clear
    "Expired certificate"

  chaotic
    "Double charges"

  chaotic --> complex : "Stopped the bleeding"
  complex --> complicated : "Found the pattern"
  complicated --> clear : "Wrote the runbook"
```

```mermaid
railroad-ebnf-beta
title "Coupon code"

coupon = prefix "-" digits [ "-" suffix ] ;
prefix = "SAVE" | "GIFT" | "VIP" ;
digits = digit digit digit+ ;
suffix = "EU" | "US" ;
digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" ;
```

## Fence props and errors

Props on the opening fence go to the component. `{.wide}` here adds a class
to the wrapper, which this site uses to let a diagram break out of the text
column:

```mermaid {.wide}
flowchart LR
  md[".md file"] --> parse["parseMarkdown()"]
  parse --> node["pele node"]
  node --> server["SVG on the server"]
  node --> browser["mount() in the browser"]
  browser --> fit["fits the width"]
  browser --> zoom["zoom when needed"]
```

A block Pele can't draw keeps its source, so a typo never takes the page down:

```mermaid
flowchart LR
  A --> B -->
```
