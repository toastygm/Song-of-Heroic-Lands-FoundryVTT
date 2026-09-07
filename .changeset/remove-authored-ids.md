---
"sohl": patch
---

**A document's id derives from its address, and no note authors one** (#1841).

The `id:` field is gone from all 1,684 notes in `assets/content/`. A note's
Foundry `_id` is now derived from the canonical address it already has:

```
_id = makeId("document", "<package>-<system>-<type>-<shortcode>")
```

The authored value said nothing the address did not, could not be read or
reviewed, and was guaranteed by nothing — `content-lint` refuses a duplicate
_address_ across every pack of a document type, which is exactly the scope a
primary document's id must be unique within, while a duplicate `id` was checked
nowhere. The derived id inherits a guard the authored one never had. Same
principle as `folder: ONXsqZAIZr2qzxTb` becoming `packFolder: <path>`; this was
the last hand-maintained identity, and the largest.

**An authored `id` still wins**, and remains the escape hatch for a document
that must keep its identity across a shortcode rename. No note in this tree
pins one: every one of the 1,684 derives cleanly, with no collision.

**Every compendium UUID this package publishes changes, once.** A GM's world, a
macro, or another module that addresses a SoHL document by UUID must be
re-pointed. This is the whole cost of the change, and it is cheap now and
expensive after 1.0.

_Internal references are unaffected._ They are regenerated from the same source
in the same build, so they stay consistent with each other. Verified by
compiling `build/packs-json` before and after: all 3,091 pack files are
identical except for the identities themselves, 3,034 documents and 2,582
internal references on both sides, no duplicate `_id` in any pack, and the same
two pre-existing dangling references (to `Bestiary` and `Birthsign`) — renamed,
not multiplied.

Requires the derived-id support in `@heroiclands/package-build`
(HeroicLands/package-build#270, shipped in #277).
