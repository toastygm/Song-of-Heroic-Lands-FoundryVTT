/**
 * @file BaseSystem.ts
 * @project Song of Heroic Lands (SoHL)
 * @module logic.common.core
 * @author Tom Rodriguez aka "Toasty" <toasty@heroiclands.com>
 * @contact Email: toasty@heroiclands.com
 * @contact Join the SoHL Discord: https://discord.gg/f2Qjar3Rqv
 * @license GPL-3.0 (https://www.gnu.org/licenses/gpl-3.0.html)
 * @copyright (c) 2025 Tom Rodriguez
 *
 * Permission is granted to copy, modify, and distribute this work under the
 * terms of the GNU General Public License v3.0 (GPLv3). You must provide
 * appropriate credit, state any changes made, and distribute modified versions
 * under the same license. You may not impose additional restrictions on the
 * recipients' exercise of the rights granted under this license. This is only a
 * summary of the GNU GPLv3 License. For the full terms, see the LICENSE.md
 * file in the project root or visit: https://www.gnu.org/licenses/gpl-3.0.html
 *
 * @description
 * Brief description of what this file does and its role in the system.
 *
 * @see GitHub Repository: https://github.com/toastygm/Song-of-Heroic-Lands-FoundryVTT
 * @see Foundry VTT System Page: https://foundryvtt.com/packages/sohl
 */

import { AnyLogic } from "@module/logic/common/core/SohlLogic";

type ModDescriptor = {
    name: string;
    abbrev: string;
};

/**
 * Base class for all SOHL system variants.
 * Provides common interfaces, accessors, and utilities for interacting with the game system.
 * Each variant (e.g., Legendary, Golden, MistyIsle) should subclass this and override required fields.
 */
export abstract class BaseSystem {
    /**
     * A short string ID for this system variant.
     */
    abstract readonly id: string;

    /**
     * The human-readable title of the system variant.
     */
    abstract readonly title: string;

    /**
     * The core system configuration object.
     */
    readonly CONFIG: UnknownObject = {
        statusEffects: [
            {
                id: "incapacitated",
                name: "incapacitated",
                img: "systems/sohl/assets/icons/knockout.svg",
            },
            {
                id: "vanquished",
                name: "vanquished",
                img: "systems/sohl/assets/icons/surrender.svg",
            },
        ] as PlainObject[],

        specialStatusEffects: {
            DEFEATED: "vanquished",
        } as PlainObject,

        controlIcons: {
            defeated: "systems/sohl/assets/icons/surrender.svg",
        } as PlainObject,
        MOD: Object.fromEntries(
            Object.entries({
                Player: "SitMod",
                MinimumValue: "MinVal",
                MaximumValue: "MaxVal",
                Outnumbered: "Outn",
                OffHand: "OffHnd",
                MagicModifier: "MagMod",
                MasteryLevelDisabled: "MLDsbl",
                FateBonus: "FateBns",
                NoFateAvailable: "NoFate",
                MasteryLevelAttrBoost: "MlAtrBst",
                TraitNoML: "NotAttrNoML",
                SunsignModifier: "SSMod",
                Durability: "Dur",
                ItemWeight: "ItmWt",
                NoMissileDefense: "NoMslDef",
                NoModifierNoDie: "NMND",
                NoBlocking: "NoBlk",
                NoCounterstrike: "NoCX",
                NoFateNPC: "NPC",
                NoFateSettings: "NoFateSetg",
                NoFateAura: "NoFateAura",
                NoCharges: "NoChrg",
                NoUseCharges: "NoUseChrg",
                NoHealRate: "NoHeal",
                NotNumNoScore: "NoScore",
                NotNumNoFate: "NotNumNoFate",
                NotNumNoML: "NoML",
                NotDisabled: "",
                ArmorProtection: "ArmProt",
            }).map(([k, v]) => [k, { name: `game.sohl?.MOD.${k}`, abbrev: v }]),
        ) as StrictObject<ModDescriptor>,
        EVENT: {
            NONE: "none",
            CREATED: "created",
            MODIFIED: "modified",
        } as PlainObject,
        BaseLogic: [] as AnyLogic[],
    };

    /**
     * The system initialization message, displayed during loading.
     */
    abstract readonly INIT_MESSAGE: string;
}
