---
"sohl": patch
---

**Two content tables were querying the wrong address, and eight sections
declare that they are empty on purpose.**

A content table that selects no notes fails the build, because a table silently
rendering nothing is indistinguishable from a table whose query has rotted. Seven
journals were failing that check. They were not one problem:

**Stale queries — the notes exist, the query looked in the wrong place.**

- _Afflictions._ The Fatigue and Fear tables still asked for
  `type = "affliction"`. Both moved to `type = "trauma"` and live under
  `assets/content/Trauma/`; the sections had been rendering nothing ever since.
  They now show 21 and 77 notes.
- _Miscellaneous Gear._ The Religious table filtered on the tag `religous`. Nine
  notes carry `religious`, and the misspelling appears nowhere else in the tree —
  the heading is corrected with it.

**Genuinely empty — declared rather than silenced.** Concoctions, Mysteries,
Mystical Abilities, the esoteric and ritual Skills, the remaining Affliction
subtypes, and the retired Birthsign table have no notes to show yet, so each is
fenced ```dataview allow-empty. That is the difference between _nothing to show_
and _nothing found_: the first is a statement, the second is a defect, and only
the first should survive a build.

_Not silenced elsewhere._ The repointed tables are deliberately **not**
`allow-empty`, so if either address moves again the build fails rather than the
section quietly emptying.
