---
"sohl": patch
---

**Content tables are now written in SQL.**

All 106 tables across 14 notes move from Dataview's query language to **SQL, run
by DuckDB over the content index** — the language the toolchain is standardising
on. Nothing about how a table is authored changes: it is still a fenced block in
the note, answered at build time, rendered into the compendium journal and the
knowledgebase page.

Of the 106, 68 emit byte-identical markdown. What a reader sees change:

| Table                          | Before                                             | After                                |
| ------------------------------ | -------------------------------------------------- | ------------------------------------ |
| The weapon catalog             | sorted by name — the `weaponType` key read nothing | grouped by weapon type, then by name |
| Eight of the _Gear_ catalogs   | rows in note-path order                            | rows in index order                  |
| The 26 deliberately-empty ones | a bare header row and a rule                       | nothing until content is written     |

The rest sort exactly as before: a table ordered by a name asks for
`COLLATE NOCASE`, which is what keeps _Horn, Hunting_ beside _Horn, fanfare_
rather than before it, as the retiring language did by default.

**The authoring guide is rewritten.** `Generated Content Tables` in the developer
knowledgebase now documents SQL — what `FROM notes` holds, the `_ref` and
`_section` aliases that decide which column links and where a section breaks, the
`:allow-empty` and `:section-level` fence arguments, and what happens when a query
names a field no note carries: an error, where the old language rendered a column
of em-dashes.
