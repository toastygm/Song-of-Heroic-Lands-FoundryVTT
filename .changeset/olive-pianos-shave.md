---
"sohl": patch
---

**Renamed the Create-dialog archetype marker from `system.archetype` to `system.templatePriority`** (#1836).

The field is a _priority_ — the number that decides which of several competing
archetypes the Create dialog offers — and it sat one letter from `archetypes`,
which authored content already uses for the **sort** a character is (healer,
warrior, mage). A priority and a taxonomy cannot be told apart by a plural `s`,
so the number took the name that says what it is; `HeroicLands/package-build#266`
settles the same name across the toolchain.

**Existing worlds migrate themselves.** The shared base data model now carries a
`migrateData` that moves a stored `system.archetype` onto the new key, preserving
the tri-state exactly — `0` stays `0` (the priority SoHL's own archetypes ship
at), `null` and a non-numeric value both mean "not an archetype", and an
already-migrated document is untouched. This rename needs a migration where
#1780's did not: the archetype contract's **world tier** exists so a GM can
duplicate a shipped archetype into their world to shadow it, and that copy holds
the marker in world data. Left behind, it would not error — the archetype would
simply stop being offered.

**A module's existing packs keep working.** Discovery reads a compendium index
under either spelling, preferring the new one. An index entry is raw stored data
that never passes through a data model, so a `migrateData` alone could not reach
it and those archetypes would have vanished from the picker with no error. New
packs should emit `system.templatePriority`.

Content notes are swept separately (#1837); nothing in this change reads or
writes authored frontmatter.
