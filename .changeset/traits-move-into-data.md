---
"sohl": patch
---

**Four being notes describe their subject in `data:`, not a `traits:` block the
format never declared** (#1847).

`Basic_Folk`, `Aldrik_Harvenar`, `Alverrik_Tarvallor` and `Brunjar_Skathhelm`
each carried a top-level `traits:` block holding the facts the content format
declares under `data:`. All four already had a `data:` block immediately above
it, holding `templatePriority` — so the fields were not merely in the wrong
place, they were beside the right one. Each block is now merged into the `data:`
the note already had, `templatePriority` intact.

Three fields change shape as well as place, because the format declares them
differently:

| authored | now |
| --- | --- |
| `traits.height.m` | `data.height` — a number in metres |
| `traits.weight.kg` | `data.weight` — a number in kilograms |
| `traits.build.frame` | `data.frame` |

`gender`, `age`, `birthday` and `appearance.*` move verbatim.

**Nothing shipped changes.** None of these fields compiles into a Foundry
document: all 3,091 compiled pack documents are byte-identical, `Basic_Folk` —
the starter being every integration spec builds on — among them.

**Why it matters.** Top level is open by design, so nothing checks a key written
there: a misspelled `wieght` under `traits:` was not a finding, it silently
became a theme parameter. `data:` is closed, so the same misspelling now names
the note and suggests the key it was meant to be. These are the reference beings
this system ships, and the example every content author copies.

_The published sidebar reads these fields through the Hugo theme, which still
reads the legacy `traits:` block. HeroicLands/heroiclands-hugo-theme#55 teaches
it to read `data:` first while continuing to read `traits:` underneath, so the
two changes can land in either order._
