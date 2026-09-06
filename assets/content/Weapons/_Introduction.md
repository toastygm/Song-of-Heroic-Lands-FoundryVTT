---
id: Go1pBv5Wt8EKxaG7
type: doc
subType: reference
name:
  full: Weapons
  aliases: []
shortcode: weapongear
description: Arms used in combat.
---

Arms used in combat.

```dataview
TABLE WITHOUT ID link(file.path, name.full) AS "Name", sohl.system.valueBase as "Value", sohl.system.weightBase as "Weight", description AS "Description"
WHERE type = "weapongear"
SORT weaponType, name.full ASC
```
