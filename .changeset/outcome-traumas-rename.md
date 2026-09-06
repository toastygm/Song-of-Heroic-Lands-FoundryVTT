---
"sohl": patch
---

`outcomeTrauma` is now `outcomeTraumas` (#1782).

An affliction's outcome field holds **a trauma shortcode, or an array of them** — an
affliction whose resolution inflicts two traumas is an ordinary case, and
`AfflictionLogic` has always resolved both shapes. The singular name misdescribed it.

**A pure rename.** The field is still a `SafeExpressionField` that may evaluate to one
shortcode or several; nothing about its shape, its bindings or its behaviour changes.
The schema field, the TypeScript property, the `SafeExpression` scope id
(`affliction.outcomeTraumas`) and the published `schema.json` move together.

**No content or world migration.** Nothing in any tree authors the field — it is
declared and unused — which is what makes this the cheapest moment to rename it. The
cost only grows once afflictions start carrying it.

It is the same defect as `relation` → `relations` in #1781: a field holding many, named
as one. That one costs 199 notes; this one costs nothing.

**Localization.** `SOHL.Affliction.FIELDS.outcomeTraumas.label` is added.
`SOHL.Affliction.FIELDS.outcomeTrauma.label` is **kept**, not renamed — localization
keys are permanent, and translations already carry it.
