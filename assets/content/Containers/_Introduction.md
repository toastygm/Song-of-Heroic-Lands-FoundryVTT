---
id: RtMkTCGjBNTXWJCB
type: doc
subType: reference
name:
  full: Containers
  aliases: []
shortcode: containergear
description: "Sacks, packs, pouches, and other carriers."
---

Sacks, packs, pouches, and other carriers.

```dataview
TABLE WITHOUT ID link(file.path, name.full) AS "Name", sohl.system.valueBase as "Value", sohl.system.weightBase as "Weight", description AS "Description"
WHERE type = "containergear"
SORT name.full ASC
```
