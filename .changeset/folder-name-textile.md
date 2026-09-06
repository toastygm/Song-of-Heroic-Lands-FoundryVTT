---
"sohl": patch
---

**The `Textile` folder no longer shows as `Dye` in the journals compendium**
(#1842).

Folder `7r8WTAO2Ac8SF9tf` was declared in both folder files with two different
names — `Textile` in `item-folders.yaml` and `Dye` in `journal-folders.yaml` —
so an item and its documentation journal were filed in folders that read
differently depending on which compendium you were browsing.

`Textile` is the correct one: the folder holds 18 notes under
`Misc_Gear/Textile/`, including `Linen`, `Cloth` and `Worsted` as well as the
dyes, so `Dye` described some of its contents and mislabelled the rest.

Nothing compared the two files, which is the defect class
HeroicLands/package-build#257 closes by deriving a folder's materialisation from
a single note.
