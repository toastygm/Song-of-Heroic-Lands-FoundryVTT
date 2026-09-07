---
"sohl": patch
---

**The release carries the content index it advertises.**

Since the move to `@heroiclands/package-build` 18, this system's manifest has
advertised a content index at `flags.metadataUrl` —
`…/releases/download/v<version>/sohl-metadata.jsonl` — and the release did not
publish it. Every consuming package that resolved against such a release failed
at `content-build deps fetch`:

```text
sohl@0.8.4: could not download its content index at
  …/releases/download/v0.8.4/sohl-metadata.jsonl: HTTP 404 Not Found
```

Nothing in this repository was wrong. The build produced the index (1,685
notes), `package-build release` staged it into `build/dist/` and fails closed
if it cannot, and the manifest advertised it correctly. The shared release
workflow attached a hardcoded two-asset list — the archive and the manifest —
and its "the assets exist" guard checked those same two files, so the omission
was invisible to the one check meant to catch an incomplete release. Fixed in
`HeroicLands/.github#29`, which reads `flags.metadataUrl` from the staged
manifest and requires the file it names.

**This version exists to be the first release that carries it.** No system code
or content changes; `v0.8.4` is complete as an installable system, since Foundry
installs from `system.zip` and never from the index. What was broken is the
cross-package edge: `sohl-thalorna` and `sohl-kethira-basic` resolve their
beings' embedded items against this package's item catalogue, and neither could
build.

_Consumers pin the tag, not `latest`._ Patch releases are prereleases and never
take the Latest badge, so a `releases/latest` URL resolves to the newest **minor**
— currently `v0.8.2`, which predates the index entirely. A dependent naming
`releases/latest` therefore cannot see this fix; it has to name the tag.
