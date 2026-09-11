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

```sql
SELECT address.slug           AS _ref,
       name.full              AS "Name",
       sohl.system.valueBase  AS "Value",
       sohl.system.weightBase AS "Weight",
       description            AS "Description"
FROM notes
WHERE type = 'armorgear'
ORDER BY name.full COLLATE NOCASE
```
