---
type: doc
subType: reference
name:
  full: Mysteries
  aliases: []
shortcode: mystery
description: Esoteric knowledge and hidden lore.
---

Esoteric knowledge and hidden lore.

## Grace

```dataview allow-empty
TABLE WITHOUT ID link(file.path, name.full) AS "Name", description AS "Description"
WHERE type = "mystery" and subType = "grace"
SORT name.full ASC
```

## Piety

```dataview allow-empty
TABLE WITHOUT ID link(file.path, name.full) AS "Name", description AS "Description"
WHERE type = "mystery" and subType = "piety"
SORT name.full ASC
```

## Fate

```dataview allow-empty
TABLE WITHOUT ID link(file.path, name.full) AS "Name", description AS "Description"
WHERE type = "mystery" and subType = "fate"
SORT name.full ASC
```

## Fate Bonus

```dataview allow-empty
TABLE WITHOUT ID link(file.path, name.full) AS "Name", description AS "Description"
WHERE type = "mystery" and subType = "fateBonus"
SORT name.full ASC
```

## Fate Point Bonus

```dataview allow-empty
TABLE WITHOUT ID link(file.path, name.full) AS "Name", description AS "Description"
WHERE type = "mystery" and subType = "fatePointBonus"
SORT name.full ASC
```

## Blessing

```dataview allow-empty
TABLE WITHOUT ID link(file.path, name.full) AS "Name", description AS "Description"
WHERE type = "mystery" and subType = "blessing"
SORT name.full ASC
```

## Ancestor Spirit Power

```dataview allow-empty
TABLE WITHOUT ID link(file.path, name.full) AS "Name", description AS "Description"
WHERE type = "mystery" and subType = "ancestorSpiritPower"
SORT name.full ASC
```

## Totem Spirit Power

```dataview allow-empty
TABLE WITHOUT ID link(file.path, name.full) AS "Name", description AS "Description"
WHERE type = "mystery" and subType = "totemSpiritPower"
SORT name.full ASC
```
