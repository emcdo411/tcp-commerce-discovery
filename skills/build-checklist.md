# Agent Build Checklist
## tcp-commerce-discovery · Every new agent must pass this before commit

---

## Pre-Build

- [ ] Agent ID assigned from registry in SKILL.md
- [ ] Layer confirmed (default: Layer 1 — External Signal)
- [ ] Agent function maps to one of the five intelligence hypotheses (01–05)
- [ ] No overlap with an existing agent's scope

---

## System Prompt

- [ ] Returns **JSON only** — no markdown fences, no preamble, no explanation outside JSON
- [ ] JSON schema fully specified in the prompt
- [ ] All enum values explicitly listed (trend: up|down|flat, etc.)
- [ ] Prompt instructs: do not truncate, close all strings/objects/arrays
- [ ] Prompt ends with: "The response must be directly parseable by JSON.parse()"

---

## API Integration

- [ ] Uses `claude-sonnet-4-20250514`
- [ ] `max_tokens` set to 3500 minimum for structured JSON agents
- [ ] Header includes `"anthropic-dangerous-direct-browser-access": "true"`
- [ ] No `x-api-key` hardcoded — handled by platform
- [ ] `anthropic-version: "2023-06-01"` present

---

## JSON Parse Layer

- [ ] `extractJsonString()` strips markdown fences and slices `{...}` bounds
- [ ] Primary `JSON.parse()` attempt
- [ ] Repair fallback: strip control chars + trailing commas, retry parse
- [ ] `validateReport()` or equivalent provides safe defaults for every field
- [ ] All array fields default to `[]`, never `undefined`

---

## UI / Component Standards

- [ ] Design token object `T` at top of file — no inline hex values
- [ ] `ScoreRing` or equivalent visual score component if agent produces a score
- [ ] Nav bar: `Agent {NN} · {Function Name}` left, `Epoch Frameworks LLC` right
- [ ] Loading state with phase messages (min 4 phases, ~700ms interval)
- [ ] Error state renders inline, does not crash component
- [ ] `ClientBriefBlock` or copy-to-clipboard component for any client-facing output

---

## README Badge Block

Every agent added to the repo requires a README update with:

```markdown
## Agent {NN} — {Function Name}

![STATUS badge]
![FRAMEWORK badge]  
![CLASSIFICATION badge]
![DACR badge]

**Layer:** External Signal Layer (Layer 1)
**Framework:** MOC v4.6 + ESIL v1.0
**Built by:** Epoch Frameworks LLC
```

---

## Positioning Check (HCDG gate)

Before shipping, confirm:

- [ ] Agent output is labeled as intelligence for human decision — not autonomous action
- [ ] No AI Theater: output reflects what the data actually shows
- [ ] No capability inflation in any README copy
- [ ] actionStack items are recommendations, not directives
- [ ] Score rationale is honest — a low score is not hidden or softened

---

## File Naming

```
AgentNN_FunctionName.jsx    e.g. Agent03_ClientReporting.jsx
```

Or flat name matching the agent function:
```
ClientReportingAgent.jsx
CompetitiveMonitorAgent.jsx
ListingIntelligenceAgent.jsx
```
