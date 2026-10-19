---
title: Incident 4412
summary: A short write-up, streamed a few characters at a time.
---

## Incident 4412: cache headers, 12 August

A config push at 14:02 UTC sent bad cache headers to two thirds of the edge
nodes. The canary caught it, and the rollback finished at 14:11.

```mermaid
timeline
  title Nine minutes
  14.02 : Config push begins
  14.04 : Canary error rate crosses 2%
  14.06 : Paged, rollback started
  14.11 : Error rate back to baseline
  14.40 : All-clear posted
```

The push skipped the canary gate because config changes went straight to
every region:

```mermaid
flowchart LR
  dev[Config change] --> ci{CI}
  ci -->|code| canary[Canary 1%]
  ci -->|config| all[All regions]
  canary --> all
  all --> edge[(Edge nodes)]
  edge --> users([Users])
```

Reads degraded. Writes never did, because they bypass the edge cache:

```mermaid
sequenceDiagram
  participant U as User
  participant E as Edge
  participant A as API
  U->>E: GET /cart
  E-->>U: stale cart (bad header)
  U->>A: POST /checkout
  A-->>U: 201 order
```

Error rate over the window, in tenths of a percent:

```mermaid
xychart-beta
  title "Error rate, 14:00 to 14:45"
  x-axis [":00", ":05", ":10", ":15", ":20", ":25", ":30", ":35", ":40", ":45"]
  y-axis "0.1%" 0 --> 45
  line [1, 38, 41, 18, 6, 2, 1, 1, 1, 1]
```

## Follow-ups

Config now goes through the same canary gate as code. That one change would
have caught this before the push instead of after.

```mermaid
gantt
  dateFormat YYYY-MM-DD
  axisFormat %b %d
  section Platform
    Canary gate for config   :active, 2026-08-13, 2026-09-05
    Rollback runbook rewrite :2026-09-05, 2026-09-19
  section Edge
    Header contract tests    :2026-08-20, 2026-09-12
```
