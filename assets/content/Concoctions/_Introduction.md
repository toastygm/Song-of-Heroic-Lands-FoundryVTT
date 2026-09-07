---
type: doc
subType: reference
name:
  full: Concoctions
  aliases: []
shortcode: concoctiongear
description: "Infusions, potions, elixirs, polutices, etc."
---

Infusions, potions, elixirs, polutices, etc.

## Simples

```dataview
TABLE WITHOUT ID link(file.path, name.full) AS "Name", sohl.system.valueBase as "Value", sohl.system.weightBase as "Weight", description AS "Description"
WHERE type = "concoctiongear" and subType = "mundane"
SORT name.full ASC
```

## Potions

### Mild

```dataview
TABLE WITHOUT ID link(file.path, name.full) AS "Name", sohl.system.valueBase as "Value", sohl.system.weightBase as "Weight", description AS "Description"
WHERE type = "concoctiongear" and subType = "exotic" and sohl.system.potency = "mild"
SORT name.full ASC
```

### Strong

```dataview
TABLE WITHOUT ID link(file.path, name.full) AS "Name", sohl.system.valueBase as "Value", sohl.system.weightBase as "Weight", description AS "Description"
WHERE type = "concoctiongear" and subType = "exotic" and sohl.system.potency = "strong"
SORT name.full ASC
```

### Great

```dataview
TABLE WITHOUT ID link(file.path, name.full) AS "Name", sohl.system.valueBase as "Value", sohl.system.weightBase as "Weight", description AS "Description"
WHERE type = "concoctiongear" and subType = "exotic" and sohl.system.potency = "great"
SORT name.full ASC
```

## Elixirs

```dataview
TABLE WITHOUT ID link(file.path, name.full) AS "Name", sohl.system.valueBase as "Value", sohl.system.weightBase as "Weight", description AS "Description"
WHERE type = "concoctiongear" and subType = "elixir"
SORT name.full ASC
```
