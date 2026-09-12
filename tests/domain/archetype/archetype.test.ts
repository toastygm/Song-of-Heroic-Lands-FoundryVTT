/*
 * This file is part of the Song of Heroic Lands (SoHL) system for Foundry VTT.
 * Copyright (c) 2024-2026 Tom Rodriguez ("Toasty") — <toasty@heroiclands.org>
 *
 * This work is licensed under the GNU General Public License v3.0 (GPLv3).
 * You may copy, modify, and distribute it under the terms of that license.
 *
 * For full terms, see the LICENSE.md file in the project root or visit:
 * https://www.gnu.org/licenses/gpl-3.0.html
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { describe, it, expect } from "vitest";
import {
    ARCHETYPE_TIER,
    buildArchetypeOptions,
    canMarkArchetype,
    resolveArchetypes,
    clearArchetypeMarker,
    migrateTemplatePriority,
    readTemplatePriority,
    resolveCreateIdentity,
    type ArchetypeCandidate,
} from "@src/entity/archetype/archetype";

/**
 * Build an archetype candidate with sensible defaults so a test only spells out
 * the axis it exercises.
 */
function cand(over: Partial<ArchetypeCandidate> = {}): ArchetypeCandidate {
    return {
        uuid: "Compendium.sohl.actors.aaaa",
        name: "Human",
        shortcode: "human",
        type: "being",
        subType: "",
        priority: 0,
        tier: ARCHETYPE_TIER.SYSTEM,
        ...over,
    };
}

describe("resolveArchetypes — filter", () => {
    it("keeps only candidates matching the (type, subType) selection", () => {
        const list = [
            cand({ uuid: "a", type: "being", subType: "", shortcode: "a" }),
            cand({ uuid: "b", type: "being", subType: "", shortcode: "b" }),
            cand({ uuid: "c", type: "entity", subType: "", shortcode: "c" }),
        ];
        const out = resolveArchetypes(list, "being", "");
        expect(out.map((w) => w.uuid).sort()).toEqual(["a", "b"]);
    });

    it("matches subType exactly (treats missing subType as blank)", () => {
        const list = [
            cand({ uuid: "a", type: "item", subType: "melee", shortcode: "a" }),
            cand({ uuid: "b", type: "item", subType: "", shortcode: "b" }),
            cand({
                uuid: "c",
                type: "item",
                subType: undefined,
                shortcode: "c",
            }),
        ];
        expect(resolveArchetypes(list, "item", "melee").map((w) => w.uuid)).toEqual(["a"]);
        // Blank selection matches both the explicit "" and the missing subType.
        expect(
            resolveArchetypes(list, "item", "")
                .map((w) => w.uuid)
                .sort(),
        ).toEqual(["b", "c"]);
    });
});

describe("resolveArchetypes — dedup by shortcode", () => {
    it("collapses same-shortcode candidates to one winner", () => {
        const list = [
            cand({ uuid: "x", shortcode: "john", name: "John" }),
            cand({ uuid: "y", shortcode: "john", name: "Juan" }),
        ];
        const out = resolveArchetypes(list, "being", "");
        expect(out).toHaveLength(1);
        expect(out[0].shortcode).toBe("john");
    });

    it("does not collapse blank-shortcode candidates together", () => {
        const list = [cand({ uuid: "x", shortcode: "" }), cand({ uuid: "y", shortcode: "" })];
        expect(resolveArchetypes(list, "being", "")).toHaveLength(2);
    });
});

describe("resolveArchetypes — winner selection (priority, tier, uuid)", () => {
    it("higher priority wins regardless of tier", () => {
        const sohl = cand({
            uuid: "sohl",
            shortcode: "human",
            priority: 0,
            tier: ARCHETYPE_TIER.SYSTEM,
        });
        const mod = cand({
            uuid: "mod",
            shortcode: "human",
            priority: 5,
            tier: ARCHETYPE_TIER.MODULE,
        });
        expect(resolveArchetypes([sohl, mod], "being", "")[0].uuid).toBe("mod");
    });

    it("at equal priority, lower tier (world < system < module) wins", () => {
        const world = cand({
            uuid: "world",
            shortcode: "human",
            priority: 0,
            tier: ARCHETYPE_TIER.WORLD,
        });
        const sohl = cand({
            uuid: "sohl",
            shortcode: "human",
            priority: 0,
            tier: ARCHETYPE_TIER.SYSTEM,
        });
        const mod = cand({
            uuid: "mod",
            shortcode: "human",
            priority: 0,
            tier: ARCHETYPE_TIER.MODULE,
        });
        expect(resolveArchetypes([mod, sohl, world], "being", "")[0].uuid).toBe("world");
    });

    it("a module at priority 0 does NOT shadow a system archetype", () => {
        const sohl = cand({
            uuid: "sohl",
            shortcode: "human",
            priority: 0,
            tier: ARCHETYPE_TIER.SYSTEM,
        });
        const mod = cand({
            uuid: "mod",
            shortcode: "human",
            priority: 0,
            tier: ARCHETYPE_TIER.MODULE,
        });
        expect(resolveArchetypes([mod, sohl], "being", "")[0].uuid).toBe("sohl");
    });

    it("a module needs priority > 0 to override a system archetype", () => {
        const sohl = cand({
            uuid: "sohl",
            shortcode: "human",
            priority: 0,
            tier: ARCHETYPE_TIER.SYSTEM,
        });
        const mod = cand({
            uuid: "mod",
            shortcode: "human",
            priority: 1,
            tier: ARCHETYPE_TIER.MODULE,
        });
        expect(resolveArchetypes([sohl, mod], "being", "")[0].uuid).toBe("mod");
    });

    it("equal priority and tier resolves by stable uuid ascending", () => {
        const a = cand({
            uuid: "aaa",
            shortcode: "human",
            priority: 0,
            tier: ARCHETYPE_TIER.MODULE,
        });
        const b = cand({
            uuid: "bbb",
            shortcode: "human",
            priority: 0,
            tier: ARCHETYPE_TIER.MODULE,
        });
        expect(resolveArchetypes([b, a], "being", "")[0].uuid).toBe("aaa");
    });
});

describe("resolveArchetypes — ordering of the returned winners", () => {
    it("sorts winners by the composite (priority desc, tier asc, uuid asc)", () => {
        const hi = cand({ uuid: "hi", shortcode: "hi", priority: 9 });
        const world = cand({
            uuid: "w",
            shortcode: "w",
            priority: 0,
            tier: ARCHETYPE_TIER.WORLD,
        });
        const sys = cand({
            uuid: "s",
            shortcode: "s",
            priority: 0,
            tier: ARCHETYPE_TIER.SYSTEM,
        });
        const out = resolveArchetypes([sys, world, hi], "being", "");
        expect(out.map((w) => w.uuid)).toEqual(["hi", "w", "s"]);
    });
});

describe("buildArchetypeOptions", () => {
    it("emits UUID-valued options labelled with name and shortcode, sorted by name, plus (none)", () => {
        const winners = [
            cand({ uuid: "u1", name: "Human", shortcode: "human" }),
            cand({ uuid: "u2", name: "Dwarf", shortcode: "dwarf" }),
        ];
        const { options } = buildArchetypeOptions(winners, "(none)");
        // The visible list is sorted alphabetically by label (Dwarf < Human) so a
        // user can find an archetype by name; **(none)** is always kept last.
        expect(options).toEqual([
            { value: "u2", label: "Dwarf (dwarf)", shortcode: "dwarf" },
            { value: "u1", label: "Human (human)", shortcode: "human" },
            { value: "", label: "(none)", shortcode: "" },
        ]);
    });

    it("defaults to the first (top-priority) winner when one exists", () => {
        const winners = [cand({ uuid: "u1" }), cand({ uuid: "u2" })];
        expect(buildArchetypeOptions(winners, "(none)").defaultValue).toBe("u1");
    });

    it("defaults to (none) when no archetype exists", () => {
        expect(buildArchetypeOptions([], "(none)").defaultValue).toBe("");
    });
});

describe("resolveCreateIdentity — archetype-first defaults", () => {
    const BROADSWORD = { name: "Broadsword", shortcode: "brdswd" };

    it("defaults Name and Shortcode from the chosen archetype when both blank", () => {
        expect(resolveCreateIdentity("", "", BROADSWORD, "New Weapon", "weapongear")).toEqual({
            name: "Broadsword",
            shortcodeBase: "brdswd",
        });
    });

    it("a user-typed Name overrides the archetype default (shortcode still archetype's)", () => {
        expect(
            resolveCreateIdentity("My Blade", "", BROADSWORD, "New Weapon", "weapongear"),
        ).toEqual({ name: "My Blade", shortcodeBase: "brdswd" });
    });

    it("a user-typed Shortcode overrides the archetype default (and is slugified)", () => {
        expect(
            resolveCreateIdentity("", "My Code!", BROADSWORD, "New Weapon", "weapongear"),
        ).toEqual({ name: "Broadsword", shortcodeBase: "mycode" });
    });

    it("falls back to the archetype name for the shortcode when the archetype shortcode is blank", () => {
        expect(
            resolveCreateIdentity(
                "",
                "",
                { name: "Round Shield", shortcode: "" },
                "New Shield",
                "shieldgear",
            ),
            // `round` and `shield` both abbreviate, so the suggestion fits
            // without any vowel reduction — see `slugifyShortcode`.
        ).toEqual({ name: "Round Shield", shortcodeBase: "rndshld" });
    });

    it("(none): Name defaults to the class default and Shortcode derives from it", () => {
        expect(resolveCreateIdentity("", "", undefined, "New Weapon", "weapongear")).toEqual({
            name: "New Weapon",
            shortcodeBase: "newweapon",
        });
    });

    it("(none) with a typed Name: Shortcode derives from the typed name", () => {
        expect(resolveCreateIdentity("Halberd", "", undefined, "New Weapon", "weapongear")).toEqual(
            { name: "Halberd", shortcodeBase: "halberd" },
        );
    });

    it("(none) with a blank class default and no name falls back to the type token", () => {
        expect(resolveCreateIdentity("", "", undefined, "", "weapongear")).toEqual({
            name: "weapongear",
            shortcodeBase: "weapongear",
        });
    });

    it("trims surrounding whitespace on typed values", () => {
        expect(
            resolveCreateIdentity("  Spear  ", "  spr  ", BROADSWORD, "New Weapon", "weapongear"),
        ).toEqual({ name: "Spear", shortcodeBase: "spr" });
    });
});

describe("readTemplatePriority — the tri-state on `system.templatePriority`", () => {
    it("reads a number as the archetype priority", () => {
        expect(readTemplatePriority({ templatePriority: 3 })).toBe(3);
    });

    it("reads 0 as priority 0, NOT as 'not an archetype' (the falsy trap)", () => {
        // SoHL's own archetypes ship at priority 0, so a truthiness test here
        // would hide every stock archetype from the Create dialog.
        expect(readTemplatePriority({ templatePriority: 0 })).toBe(0);
    });

    it("reads null as 'not an archetype'", () => {
        expect(readTemplatePriority({ templatePriority: null })).toBeUndefined();
    });

    it("reads an absent field as 'not an archetype'", () => {
        expect(readTemplatePriority({})).toBeUndefined();
        expect(readTemplatePriority(undefined)).toBeUndefined();
    });

    it("ignores a non-numeric value", () => {
        // A stray string/boolean never enters discovery.
        expect(readTemplatePriority({ templatePriority: "2" })).toBeUndefined();
        expect(readTemplatePriority({ templatePriority: true })).toBeUndefined();
    });
});

describe("migrateTemplatePriority — carrying a world across the #1836 rename", () => {
    // The world tier is why this rename needs a migration at all: a GM's
    // duplicated archetype carries the marker in world data, and losing it
    // would not error — the archetype would just stop being offered.
    it("moves a legacy priority onto the new key", () => {
        const system: PlainObject = { archetype: 3, shortcode: "human" };
        migrateTemplatePriority(system);
        expect(system.templatePriority).toBe(3);
        expect("archetype" in system).toBe(false);
        expect(system.shortcode).toBe("human");
    });

    it("carries priority 0 across as 0, not as 'not an archetype'", () => {
        // Every archetype SoHL ships is at 0, so a truthiness test here would
        // unmark all of them.
        const system: PlainObject = { archetype: 0 };
        migrateTemplatePriority(system);
        expect(system.templatePriority).toBe(0);
        expect(readTemplatePriority(system)).toBe(0);
    });

    it("carries a legacy null across as 'not an archetype'", () => {
        const system: PlainObject = { archetype: null };
        migrateTemplatePriority(system);
        expect(system.templatePriority).toBeNull();
        expect("archetype" in system).toBe(false);
    });

    it("does not coerce a non-numeric legacy value into a marker", () => {
        // The old reader ignored junk, so migrating it would resurrect a marker
        // that never counted.
        const system: PlainObject = { archetype: "2" };
        migrateTemplatePriority(system);
        expect(system.templatePriority).toBeNull();
        expect(readTemplatePriority(system)).toBeUndefined();
    });

    it("leaves an already-migrated block alone, dropping only the stale key", () => {
        // Re-running the migration must not undo an edit made after it: the new
        // key wins, whatever the legacy one still says.
        const system: PlainObject = { templatePriority: null, archetype: 7 };
        migrateTemplatePriority(system);
        expect(system.templatePriority).toBeNull();
        expect("archetype" in system).toBe(false);
    });

    it("is a no-op on a block that never carried the legacy key", () => {
        const system: PlainObject = { templatePriority: 2, shortcode: "x" };
        migrateTemplatePriority(system);
        expect(system).toEqual({ templatePriority: 2, shortcode: "x" });
    });

    it("does not invent the field on a document that is not an archetype", () => {
        // Absent means absent: the schema's `initial: null` supplies the value,
        // and a migration that wrote one would touch every document in a world.
        const system: PlainObject = { shortcode: "x" };
        migrateTemplatePriority(system);
        expect("templatePriority" in system).toBe(false);
    });

    it("tolerates a nullish or non-object source", () => {
        expect(migrateTemplatePriority(undefined)).toBeUndefined();
        expect(migrateTemplatePriority(null)).toBeNull();
        expect(migrateTemplatePriority("nonsense")).toBe("nonsense");
    });

    it("returns the same object, so it can be handed straight to super", () => {
        const system: PlainObject = { archetype: 1 };
        expect(migrateTemplatePriority(system)).toBe(system);
    });
});

describe("readTemplatePriority — the pre-#1836 `system.archetype` spelling", () => {
    // A compendium index entry is raw stored data: it never passes through the
    // data model, so `migrateData` cannot reach it. Without this fallback every
    // archetype in a pack built by an older toolchain would vanish from the
    // Create dialog silently — no error, just an empty picker.
    it("falls back to the legacy key when the new one is absent", () => {
        expect(readTemplatePriority({ archetype: 3 })).toBe(3);
    });

    it("falls back for priority 0 as well", () => {
        expect(readTemplatePriority({ archetype: 0 })).toBe(0);
    });

    it("ignores a non-numeric legacy value, exactly as the old reader did", () => {
        expect(readTemplatePriority({ archetype: "2" })).toBeUndefined();
        expect(readTemplatePriority({ archetype: true })).toBeUndefined();
    });

    it("prefers the new key when both are present", () => {
        expect(readTemplatePriority({ templatePriority: 1, archetype: 9 })).toBe(1);
    });

    it("does not fall back when the new key says 'not an archetype'", () => {
        // A migrated document carries `templatePriority: null` and may still
        // carry a stale legacy key; honouring the legacy one would resurrect a
        // marker the GM cleared.
        expect(readTemplatePriority({ templatePriority: null, archetype: 4 })).toBeUndefined();
    });
});

describe("clearArchetypeMarker", () => {
    it("sets system.templatePriority to null, so the instance is not an archetype", () => {
        const data = { name: "Seed", system: { templatePriority: 3, shortcode: "human" } };
        clearArchetypeMarker(data);
        expect(data.system.templatePriority).toBeNull();
        expect(data.system.shortcode).toBe("human");
    });

    it("clears a priority-0 archetype too (0 is a marker, not a blank)", () => {
        const data = { name: "Seed", system: { templatePriority: 0 } };
        clearArchetypeMarker(data);
        expect(data.system.templatePriority).toBeNull();
        expect(readTemplatePriority(data.system)).toBeUndefined();
    });

    it("drops a pre-#1836 legacy key, which the reader would otherwise honour", () => {
        const data: PlainObject = { name: "Seed", system: { archetype: 2 } };
        clearArchetypeMarker(data);
        expect(data.system.templatePriority).toBeNull();
        expect("archetype" in data.system).toBe(false);
        expect(readTemplatePriority(data.system)).toBeUndefined();
    });

    it("preserves every flag — the marker no longer lives in flags", () => {
        const data = {
            name: "Seed",
            system: { templatePriority: 1 },
            flags: { sohl: { keepMe: "yes" }, core: { x: 1 } },
        };
        clearArchetypeMarker(data);
        expect(data.flags.sohl.keepMe).toBe("yes");
        expect(data.flags.core.x).toBe(1);
    });

    it("creates the system block when the create-data has none", () => {
        const data: PlainObject = { name: "Seed" };
        clearArchetypeMarker(data);
        expect(data.system.templatePriority).toBeNull();
    });

    it("is a no-op-shaped write when the document is already not an archetype", () => {
        const data = { name: "Seed", system: { templatePriority: null } };
        expect(() => clearArchetypeMarker(data)).not.toThrow();
        expect(data.system.templatePriority).toBeNull();
    });
});

describe("canMarkArchetype — who may offer the sheet control", () => {
    it("offers it to a GM on a top-level document", () => {
        expect(canMarkArchetype(true, false)).toBe(true);
    });

    it("withholds it from a player — an archetype is world configuration", () => {
        expect(canMarkArchetype(false, false)).toBe(false);
    });

    it("withholds it on an embedded document — an embedded item is an instance", () => {
        expect(canMarkArchetype(true, true)).toBe(false);
        expect(canMarkArchetype(false, true)).toBe(false);
    });
});
