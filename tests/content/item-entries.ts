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

/**
 * Reading a being note's `sohl.items` entries the way the pack build does.
 *
 * Shared by the content specifications that check a being carries the item a
 * printed table calls for, so the one rule for an entry's identity is stated
 * once rather than restated per spec.
 */

/**
 * One entry of a being note's `sohl.items` list, in either shape.
 *
 * A **copy** names the catalogue item it is made from with `model:`, a
 * wikilink address whose segments run `<package>-<system>-<type>-<shortcode>`
 * and may be written as any suffix of that — so the type and shortcode are its
 * last two segments, and neither is written again beside it. A **custom**
 * entry names no model and states its own `name`, `type` and
 * `system.shortcode`.
 */
export interface ItemEntry {
    model?: string;
    type?: string;
    system?: { shortcode?: string };
}

/** The segments of an entry's `model:` address, or `[]` if it names none. */
function modelSegments(entry: ItemEntry): string[] {
    return entry?.model ? entry.model.split("-") : [];
}

/**
 * The shortcode a `sohl.items` entry compiles to.
 *
 * `system.shortcode` is checked first whichever shape the entry has: it is the
 * identity that reaches the document, and a copy may override the code of the
 * model it was made from with it.
 *
 * @param entry One entry of a being note's `sohl.items` list.
 * @returns The entry's shortcode, or `undefined` if it states neither.
 */
export function entryShortcode(entry: ItemEntry): string | undefined {
    return entry?.system?.shortcode ?? modelSegments(entry).at(-1);
}

/**
 * The item type a `sohl.items` entry compiles to.
 *
 * A custom entry writes `type:` itself; a copy takes the type from its model's
 * address, where it is the segment before the shortcode.
 *
 * @param entry One entry of a being note's `sohl.items` list.
 * @returns The entry's item type, or `undefined` if it states neither.
 */
export function entryType(entry: ItemEntry): string | undefined {
    const segments = modelSegments(entry);
    return entry?.type ?? (segments.length > 1 ? segments.at(-2) : undefined);
}
