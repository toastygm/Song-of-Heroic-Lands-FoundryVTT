---
"sohl": minor
---

**This tree's folders are notes** (#1835).

The five `assets/content/*-folders.yaml` files are gone. Each folder is now a
`type: folder` note under `assets/content/Folders/`, and the 1,503 notes that
named a folder by its Foundry id name it by address instead:

```yaml
packFolder: possessionscooking # was: folder: ONXsqZAIZr2qzxTb
```

**Every folder keeps its authored `id`**, so a world already holding these
folders goes on resolving them — this is a build change, not a world migration.

**136 folder entries became 79 notes**, because a folder declared in two packs
was two entries and is one folder: 57 ids appeared in both `item-folders.yaml`
and `journal-folders.yaml`. Where the two disagreed about the parent — three
folders, which the journals pack files one level deeper under
`Rules/Descriptions` — the note states the parent per pack.

Two things about the compiled packs change, both deliberately:

- **Three empty folders are no longer shipped** — `Birthsigns` (the retired
  astrology concept), `Corpora` and `Local Maps`, referenced by no note. A folder
  materialises where something references it, so an empty one materialises
  nowhere.
- **Two dangling folder references are fixed.** The three map notes' documentation
  journals are filed in the map's folder, but `Battlemaps` and `Regional Maps`
  were declared only in `scene-folders.yaml` — so the journals pack emitted
  journals into folders it never declared. It now materialises them.

Everything else is byte-identical: 3,089 of 3,094 compiled documents are
unchanged, and no content document differs at all.

Requires the folder-note support in `@heroiclands/package-build`
(HeroicLands/package-build#276).
