---
tags: []
name:
  full: Bestiary
  aliases: []
shortcode: bestiary
type: doc
subType: rules
packFolder: rules
---

# Animals

```dataview
TABLE WITHOUT ID
  link(file.path, name.full) AS "Name",
  shortcode AS "Shortcode",
  sohl.system.body.weight.base AS "Weight",
  sohl.system.body.bodyScaleBase AS "BodyScale",
  description AS "Description"
WHERE type = "being" AND sohl.kbcat = "animal"
```
