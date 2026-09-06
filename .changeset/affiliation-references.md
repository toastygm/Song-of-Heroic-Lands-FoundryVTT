---
"sohl": patch
---

An affiliation records what it answers to, where its authority sits, and what it
holds sway over (#1781).

**`relation` is now `relations`.** The field is a map of standings, one per
affiliation — `AffiliationLogic.standingWith` has always read it that way — and the
singular named the many as one. A pure rename: the shape, the choices and the
behaviour are unchanged.

**Three fields are new**, and each was unexpressible before — the content format
specified them and the schema could not receive them:

- **`parents`** — the affiliations this one is subordinate to, by shortcode. A list,
  because a body may sit under more than one at once: an arcane tradition within an
  order, a religion within a pantheon.
- **`seat`** — where its authority sits, as a place shortcode. Deliberately not
  `capital` or `headquarters`: each fits about half the eleven subTypes, while a seat
  covers a polity, a guild, an order and a faith alike.
- **`domain`** — the places it holds sway over. Kept apart from `parents` because
  they are different relations, _subordinate to_ against _holds sway over_.

Both lists initialize to `[]` rather than null, since _answers to nobody_ is a value
— a sovereign polity is exactly that — while `seat` is nullable, because "has no
seat" and "nobody recorded one" are worth telling apart. A seat outside its own
domain is allowed: a government in exile is a real case.

**Localization.** Keys are added for the four fields.
`SOHL.Affiliation.FIELDS.relation.*` is kept rather than renamed — localization keys
are permanent.

**Content.** No note is affected: `relation` is authored on five notes across every
tree, all in `harn-ensemble`, and every one of them holds an empty list. The three
new fields are authored nowhere yet and arrive empty.
