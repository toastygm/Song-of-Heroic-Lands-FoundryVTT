import { fields } from "@module/sohl-common.mjs";
import { SohlLocalize } from "@module/common/helper/sohl-localize.mjs";
import * as SohlUtils from "@module/common/helper/sohl-utils.mjs";
import { MersenneTwister } from "@module/common/MersenneTwister.mjs";

export const SOHL_VARIANTS = {
    LEGENDARY: "legendary",
    MISTYISLE: "mistyisle",
}; /**
 * Base SOHL object containing various properties, constants, and configuration
 * parameters related to the SOHL system,
 */
/**
 * @typedef {Object} ModifierAtom
 * @property {string} name
 * @property {string} abbrev
 */

/**
 * The `SOHL` object serves as the primary namespace for the Song of Heroic Lands game system.
 * It contains configuration settings, constants, utility functions, and system-specific data.
 *
 * @namespace SOHL
 * @property {string} id - The unique identifier for the system.
 * @property {string} title - The title of the system.
 * @property {Record<string, class>} class - The classes used in the system.
 * @property {Record<string, ModifierAtom>} MOD - Contains various modifiers and their abbreviations.
 * @property {string} initVariantMessage - Initialization message displayed during system startup.
 * @property {PlainObject} versionsData - Stores version-related data for the system.
 * @property {PlainObject} sysVer - Stores system version information.
 * @property {Function} registerSystemVersion - Registers a system version with its associated data.
 * @property {SohlLocalize} i18n - Localization utility for the system.
 * @property {SohlUtils} utils - Utility functions for the system.
 * @property {MersenneTwister} twist - Random number generator for the system.
 * @property {boolean} ready - Indicates whether the system is ready.
 * @property {boolean} hasSimpleCalendar - Indicates if the Simple Calendar module is available.
 * @property {string} defaultVariant - The default rules variant for the system.
 * @property {PlainObject} CONFIG - Configuration settings for the system, including status effects, control icons, and modifiers.
 * @property {string} SOHL_INIT_MESSAGE - ASCII art and initialization message displayed during system startup.
 * @property {PlainObject} CHARS - Unicode character constants used in the system.
 * @property {PlainObject} SETTINGS - Configuration settings for the system, including migration version, rules variants, and user preferences.
 */
export const SOHL = {
    id: "",
    title: "",
    class: {},
    initVariantMessage: "",
    MOD: {},
    versionsData: {},
    sysVer: {},
    // @ts-ignore
    registerSystemVersion: function (verId, verData) {
        // @ts-ignore
        game.sohl?.versionsData[verId] = verData;
    },
    i18n: SohlLocalize,
    utils: SohlUtils,
    twist: MersenneTwister.instance,
    ready: false,
    hasSimpleCalendar: false,
    defaultVariant: "legendary",

    /* The 'twist' singleton will be added here later after MersenneTwister is deined. */
    CONFIG: {
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
        ],

        specialStatusEffects: {
            DEFEATED: "vanquished",
        },

        controlIcons: {
            defeated: "systems/sohl/assets/icons/surrender.svg",
        },
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
        ),
        EVENT: {
            NONE: "none",
            CREATED: "created",
            MODIFIED: "modified",
        },
    },

    // ASCII Artwork (Doom font)
    SOHL_INIT_MESSAGE: `Initializing the Song of Heroic Lands Game System
===========================================================
 _____                            __
/  ___|                          / _|
\\ \`--.  ___  _ __   __ _    ___ | |_
 \`--. \\/ _ \\| '_ \\ / _\` |  / _ \\|  _|
/\\__/ / (_) | | | | (_| | | (_) | |
\\____/ \\___/|_| |_|\\__, |  \\___/|_|
                    __/ |
                   |___/
 _   _                _        _                     _
| | | |              (_)      | |                   | |
| |_| | ___ _ __ ___  _  ___  | |     __ _ _ __   __| |___
|  _  |/ _ \\ '__/ _ \\| |/ __| | |    / _\` | '_ \\ / _\` / __|
| | | |  __/ | | (_) | | (__  | |___| (_| | | | | (_| \\__ \\
\\_| |_/\\___|_|  \\___/|_|\\___| \\_____/\\__,_|_| |_|\\__,_|___/
===========================================================`,

    /** @enum {string} */
    CHARS: {
        TIMES: "\u00D7",
        GREATERTHANOREQUAL: "\u2265",
        LESSTHANOREQUAL: "\u2264",
        INFINITY: "\u221E",
        STARF: "\u2605",
        STAR: "\u2606",
    },

    SETTINGS: {
        systemMigrationVersion: {
            key: "systemMigrationVersion",
            data: {
                name: "System Migration Version",
                scope: "world",
                config: false,
                type: new fields.StringField({
                    required: true,
                    nullable: false,
                    initial: "",
                }),
            },
        },
        sohlVariant: {
            key: "sohlVariant",
            data: {
                name: "Rules Variant",
                hint: "Which set of rules to use",
                scope: "world",
                config: true,
                requiresReload: true,
                type: new fields.StringField({
                    nullable: false,
                    initial: "legendary",
                    blank: false,
                    choices: SOHL_VARIANTS,
                }),
            },
        },
        showWelcomeDialog: {
            key: "showWelcomeDialog",
            data: {
                name: "Show welcome dialog on start",
                hint: "Display the welcome dialog box when the user logs in.",
                scope: "client",
                config: true,
                type: new fields.BooleanField({ initial: true }),
            },
        },
        initMacros: {
            key: "initMacros",
            data: {
                name: "Ask to initialize macros",
                hint: "The next time the user logs in, ask whether to install the default macros.",
                scope: "client",
                default: true,
                config: true,
                type: new fields.BooleanField({ initial: true }),
            },
        },
        combatAudio: {
            key: "combatAudio",
            data: {
                name: "Combat sounds",
                hint: "Enable combat flavor sounds",
                scope: "world",
                config: true,
                type: new fields.BooleanField({ initial: true }),
            },
        },
        recordTrauma: {
            key: "recordTrauma",
            data: {
                name: "Record trauma automatically",
                hint: "Automatically add physical and mental afflictions and injuries",
                scope: "world",
                config: true,
                default: "enable",
                type: new fields.StringField({
                    nullable: false,
                    blank: false,
                    initial: "enable",
                    choices: {
                        enable: "Record trauma automatically",
                        disable: "Don't record trauma automatically",
                        ask: "Prompt user on each injury or affliction",
                    },
                }),
            },
        },
        healingSeconds: {
            key: "healingSeconds",
            data: {
                name: "Seconds between healing checks",
                hint: "Number of seconds between healing checks. Set to 0 to disable.",
                scope: "world",
                config: true,
                type: new fields.NumberField({
                    required: true,
                    nullable: false,
                    initial: 432000, // 5 days
                }),
            },
        },
        optionProjectileTracking: {
            key: "optionProjectileTracking",
            data: {
                name: "Track Projectile/Missile Quantity",
                hint: "Reduce projectile/missile quantity when used; disallow missile attack when quantity is zero",
                scope: "world",
                config: true,
                type: new fields.BooleanField({ initial: false }),
            },
        },
        optionFate: {
            key: "optionFate",
            data: {
                name: "Fate: Use fate rules",
                scope: "world",
                config: true,
                default: "enable",
                type: new fields.StringField({
                    nullable: false,
                    blank: false,
                    initial: "pconly",
                    choices: {
                        none: "Fate rules disabled",
                        pconly: "Fate rules only apply to PCs",
                        everyone: "Fate rules apply to all animate actors",
                    },
                }),
            },
        },
        optionGearDamage: {
            key: "optionGearDamage",
            data: {
                name: "Gear Damage",
                hint: "Enable combat rule that allows gear (weapons and armor) to be damaged or destroyed on successful block",
                scope: "world",
                config: true,
                type: new fields.BooleanField({ initial: false }),
            },
        },
    },
};
