---
"sohl": patch
---

**A shortcode is now lowercase.** The identity key every item and actor carries
must match `^[a-z0-9]+$` — it was previously allowed a capital.

Case was never carrying a distinction. The address and the document id built
from a shortcode were already lowercased, so `Clb` and `clb` published one
address, one id and one URL while the key itself counted as two — a difference
you could only see by looking twice, and one nothing reported. Requiring
lowercase makes the key equal the thing derived from it.

**Nothing in the shipped content changes**, because it is already lowercase
throughout. A world carried forward from 0.8 has its stored keys folded for it:
the repair that already rewrote a key holding a hyphen or an ampersand now folds
a capital too, so `Clb` becomes `clb`. That is a respelling of the same entity,
not a change of identity, so a world copy keeps pointing at the compendium
document it came from.

A shortcode typed with a capital is refused rather than silently rewritten, the
same way punctuation always was. Where a key is being repaired instead of
refused — an import, or a duplicate — it is folded.
