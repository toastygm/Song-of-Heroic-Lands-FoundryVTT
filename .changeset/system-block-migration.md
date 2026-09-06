---
"sohl": patch
---

Every SoHL system field is authored under `sohl.system` (#1851).

The tree wrote its system fields directly under `sohl:`. The content format puts them
under `sohl.system`, at the paths the compiled document actually stores — so a note
says what the document holds, and a key it does not declare is an error rather than a
silent drop.

**1,474 notes, 8,286 key moves.** The move list is derived from the field
declarations the compiler itself obeys, never from a hand-written list, and three
shapes occur: the name already matches (`material`), the note authors the plain name
while the document stores the base value (`weight` → `weightBase`), or the
destination is nested (`flexloc` → `locations.flexible`, `protection.blunt` →
`protectionBase.blunt`).

**169 keys authored as `null` are dropped rather than moved.** At the legacy position
the compiler reads `value ?? default`, so `null` never reached a document; moved to
the destination it would have, because that position returns the value as authored.

**90 values are normalised on the way**, since `sohl.system` is a verbatim
passthrough and the note must state the stored form. Both cases are pre-existing
authoring defects this surfaces rather than creates: `body.weight.calc` authored as a
number where the document stores a string, and `movementProfiles[].factors`, a key
the compiler has always dropped — authored, ignored, and invisible until now.

**Eight notes' content-table queries move with the fields.** A Dataview column
naming `sohl.weight` stops resolving the moment the frontmatter moves and renders as
em-dashes, compiled and published with nothing reporting it.

_No shipped document changes._ `build/packs-json` is byte-identical across all 3,091
documents, and `content-build lint` reports the same 376 findings before and after,
identical in composition.
