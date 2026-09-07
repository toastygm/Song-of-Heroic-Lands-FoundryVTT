---
type: doc
subType: reference
name:
  full: Armor
  aliases: []
shortcode: armorgear
description: "Defensive gear — mail, plate, shields, and more."
---

Defensive gear — mail, plate, shields, and more.

```dataview
TABLE WITHOUT ID link(file.path, name.full) AS "Name", sohl.system.valueBase as "Value", sohl.system.weightBase as "Weight", description AS "Description"
WHERE type = "armorgear"
SORT name.full ASC
```
