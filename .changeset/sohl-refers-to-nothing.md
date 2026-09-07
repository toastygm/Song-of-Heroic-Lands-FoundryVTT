---
"sohl": patch
---

**SoHL refers to nothing outside itself, and a check keeps it that way** (#1839).

The base package addressed `sohl-thalorna` from 24 notes — 21 distinct addresses —
which made the package graph cyclic: the module referred to the system, as a module
should, and the system referred back. That mutual reference is what forced both
repositories to vendor each other's link manifests, and what would have deadlocked
any manifest format change, since neither could build until the other had published.

**The Bestiary is Terran again.** SoHL's animals are real-world animals, and their
prose now describes them in real-world terms — savanna, tropical lowlands, arid
steppe, the far north, the river lowlands — naming no place, people, or deity from
any setting. The habitat and culture sentences previously named Thalorna regions
(`Xerathia`, `K'ich'chik`, `Tānvür`, `Vedyara`, `Nordheim`, `Dunhara`, `Khazryn`,
`Kheperi`, `Ankaris`), affiliations and deities (`Itzáni Pantheon`, `Tëngvōk Vān
Lëi`, `Āsháian`, `Rásikara`, `Thōth`, `Ánubís`, `Sekhet'Neru`), and settlements
(`Amradad`, `Byzaría`, `Per-Aás`). All 212 such references across 34 notes are gone
— including 11 notes that named a setting in prose without ever linking to it, so
the tree is consistent rather than half-converted.

A giraffe is not a Thalorna concept; _where a giraffe lives in Thalorna_ is. The
animal stays here and the setting does not.

**`Rules/Bestiary.md` is animals only.** The chapters on Constructs, Dreadspawn,
Elementals, Grukar, Goblins, Helspawn, Mythic and Spirit creatures are removed —
they illustrated a base-system rules page with a setting module's creatures, and
the six Thalorna beings it cited went with them. The introduction's one-line
description of the chapter follows.

**Nothing here vendors another package.** `assets/manifests/` is deleted. It held
`thalorna.json` and a README describing how to vendor a sibling's manifest; the
directory was already inert under `@heroiclands/package-build` 18, which replaced
committed manifests with a dependency declared in `relationships` and fetched into a
local cache. This repository declares no dependency and consumes no manifest.

**The existing guard now enforces it.** `npm run lint:content-links` already fails on
an address that resolves in no package, and it is part of `npm run lint`, so it gates
every build:

```text
Bestiary/Animal/Giraffe.md:337:29: error: address [[doc-xerathia]] resolves to no note — no package publishes it.
```

No new check was needed. The vendored manifest was the reason those 21 addresses
resolved, so deleting it is what arms the guard — a reference back into a module is
now a build error rather than something review has to catch.

_Documentation._ `content-links.md`, `link-manifest.md`, `build-and-deployment.md`
and `asset-conventions.md` no longer describe this repository as vendoring or citing
another package, and no longer point readers at the deleted directory.
