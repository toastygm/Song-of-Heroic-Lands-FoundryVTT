/* eslint-disable no-unused-vars */
/*===============================================================*/
/*      SOHL Common Classes                                        */
/*===============================================================*/
/**
 * The fields property is a shortcut for foundry FieldData definitions
 *
 * @type {object}
 */
const fields = foundry.data.fields;

export class SohlLocalize {
    static _messageCache = new Map();

    static _fnv1a64(str) {
        const FNV_PRIME = 0x100000001b3n;
        const OFFSET_BASIS = 0xcbf29ce484222325n;
        let hash = OFFSET_BASIS;
        for (let i = 0; i < str.length; i++) {
            hash ^= BigInt(str.charCodeAt(i));
            hash *= FNV_PRIME;
        }
        return hash;
    }

    static format(key, values = {}) {
        const template = game.i18n.localize(key);
        const cacheKey = SohlLocalize._fnv1a64(template);
        let formatter = this._messageCache.get(cacheKey);
        if (!formatter) {
            formatter = new IntlMessageFormat(template, game.i18n.lang);
            Utility._messageCache.set(cacheKey, formatter);
        }
        return formatter.format(values);
    }
}

function _l(stringId, data = {}) {
    return SohlLocalize.format(stringId, data);
}

export const SOHL_VARIANTS = {
    LEGENDARY: "legendary",
    MISTYISLE: "mistyisle",
};

/**
 * Base SOHL object containing various properties, constants, and configuration
 * parameters related to the SOHL system,
 */
export const SOHL = {
    versionsData: {},
    sysVer: {},
    registerSystemVersion: function (verId, verData) {
        SOHL.versionsData[verId] = verData;
    },
    /* The 'twist' singleton will be added here later after MersenneTwister is deined. */

    CONFIG: {
        ready: false,
        hasSimpleCalendar: false,
        defaultVariant: "legendary",
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
                PLAYER: "SitMod",
                MINVALUE: "MinVal",
                MAXVALUE: "MaxVal",
                OUTNUMBERED: "Outn",
                OFFHAND: "OffHnd",
                MAGIC: "Magic",
                MLDSBL: "MLDsbl",
                MAGICMOD: "MagicMod",
                FATEBNS: "FateBns",
                NOFATE: "NoFateAvail",
                MLATTRBOOST: "MlAtrBst",
                NOTATTRNOML: "NotAttrNoML",
                SSMOD: "Sunsign Modifier",
                Durability: "Dur",
                ITEMWT: "ItmWt",
            }).map(([k, v]) => [k, { name: `SOHL.MOD.${k}`, abbrev: v }]),
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

    /** @enum */
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

export class Utility {
    static getChoicesMap(values, locPrefix) {
        return Object.fromEntries(
            Object.values(values).map((i) => [i, `${locPrefix}.${i}`]),
        );
    }

    static sortStrings(...ary) {
        const collator = new Intl.Collator(game.intl.lang);
        ary.sort((a, b) => collator.compare(a, b));
        return ary;
    }

    static rollToJSON(val) {
        if (!(val instanceof Roll)) {
            throw new Error("Not a roll instance");
        }

        return {
            name: "Roll",
            data: val.toJSON(),
        };
    }

    static JSON_stringify(val, _d = 0) {
        if (_d > 20) {
            throw new Error("Maximum depth exceeded");
        }

        switch (typeof val) {
            case "function":
                return `{name: "Function", data: "${val.toString()}"}`;

            case "object":
                if (val === null) return "null";
                if (val instanceof Roll) {
                    return JSON.stringify(Utility.rollToJSON(val));
                } else if (
                    val instanceof ValueModifier ||
                    val instanceof TestResult
                ) {
                    return JSON.stringify(val.toJSON());
                } else if (val instanceof Collection) {
                    return `{name: "Collection", data: ${Utility.JSON_stringify(val.toJSON(), _d + 1)}}`;
                } else if (val instanceof Map) {
                    return `{name: "Map", data: ${JSON.stringify(val.entries().map(([k, v]) => [k, Utility.JSON_stringify(v, _d + 1)]))}}`;
                } else if (val instanceof Set) {
                    return `{name: "Set", data: ${JSON.stringify(val.map((e) => Utility.JSON_stringify(e, _d + 1)))}}`;
                } else if (Array.isArray(val)) {
                    return JSON.stringify(
                        val.map((e) => Utility.JSON_stringify(e, _d + 1)),
                    );
                } else {
                    return JSON.stringify(val);
                }

            case "undefined":
                return `{name: "undefined"}`;

            case "bigint":
                return `{name: "bigint", data: "${val.toString()}"}`;

            default:
                return JSON.stringify(val);
        }
    }

    static JSON_reviver({ thisArg, _d = 0 } = {}) {
        if (_d > 20) {
            throw new Error("Max depth exceeded");
        }

        return function (_key, value) {
            if (!value) return value;
            if (typeof value === "object") {
                if (!Object.hasOwn(value, "name")) {
                    if (Array.isArray(value)) {
                        return value.map((e) =>
                            Utility.JSON_reviver({
                                thisArg,
                                _d: _d + 1,
                            })("", e),
                        );
                    } else {
                        return value;
                    }
                } else {
                    switch (value.name) {
                        case "Function":
                            return Utility.safeFunctionFactory(value.data);

                        case "Roll":
                            return Roll.fromData(value.data, {
                                parent: thisArg,
                            });

                        case "undefined":
                            return undefined;

                        case "bigint":
                            return BigInt(value.data);

                        case "Collection":
                            return new Collection(
                                Utility.JSON_reviver({
                                    thisArg,
                                    _d: _d + 1,
                                })("", value.data),
                            );

                        case "Map":
                            return new Map(
                                Utility.JSON_reviver({
                                    thisArg,
                                    _d: _d + 1,
                                })("", value.data),
                            );

                        case "Set":
                            return new Set(
                                Utility.JSON_reviver({
                                    thisArg,
                                    _d: _d + 1,
                                })("", value.data),
                            );

                        default:
                            if (CONFIG.SOHL.class[value.name]) {
                                return CONFIG.SOHL.class[value.name].fromData(
                                    value,
                                    { parent: thisArg },
                                );
                            } else {
                                return value;
                            }
                    }
                }
            }
            return value;
        };
    }

    static JSON_parse(val, { thisArg } = {}) {
        return JSON.parse(val, Utility.JSON_reviver({ thisArg }));
    }

    static safeFunctionFactory(fnString, async = false) {
        // Basic regex to check if it's an arrow function or normal function
        const functionPattern = /^\s*(?:\([\w\s,]*\)|\w+)\s*=>|\bfunction\b/;

        // Reject anything that contains dangerous keywords
        const dangerousKeywords =
            /\b(eval|Function|document|window|globalThis|process)\b/;

        if (!functionPattern.test(fnString)) {
            throw new Error("Invalid function string");
        } else if (dangerousKeywords.test(fnString)) {
            throw new Error("Function uses unsafe keyword");
        }

        const fnStr = `"use strict"; return ${fnString}`;
        try {
            return new (async ? foundry.utils.AsyncFunction : Function)(fnStr);
        } catch (e) {
            throw new Error("Function parsing failed", { cause: e });
        }
    }

    static deepClone(obj, { thisArg } = {}) {
        thisArg ||= obj.parent;
        return Utility.JSON_parse(Utility.JSON_stringify(obj), { thisArg });
    }

    static *combine(...iterators) {
        for (let it of iterators) yield* it;
    }

    /**
     * Ensures the resulting actions array has only unique actions.
     * Keeps all items in newActions, and only those items in oldActions that are not already in newActions.
     * @param {*} oldActions Array of actions to only keep if it is not already in newActions
     * @param {*} newActions Array of actions to keep
     * @returns
     */
    static uniqueActions(newActions, oldActions) {
        return oldActions.reduce((ary, a) => {
            if (!ary.some((i) => i.functionName === a.functionName))
                ary.push(a);
            return ary;
        }, newActions);
    }

    /**
     * Determines the identity of the current token/actor that is in combat. If token
     * is specified, tries to use token (and will allow it regardless if user is GM.),
     * otherwise returned token will be the combatant whose turn it currently is.
     *
     * @param {Token} token
     */
    static getTokenInCombat(token = null, forceAllow = false) {
        if (token && (game.user.isGM || forceAllow)) {
            const result = { token: token, actor: token.actor };
            return result;
        }

        if (!game.combat?.started) {
            ui.notifications.warn("No active combat.");
            return null;
        }

        if (game.combat.combatants.size === 0) {
            ui.notifications.warn(`No combatants.`);
            return null;
        }

        const combatant = game.combat.combatant;

        if (combatant.isDefeated) {
            ui.notifications.warn(
                `Combatant ${combatant.token.name} has been defeated`,
            );
            return null;
        }

        if (token && token.id !== combatant.token.id) {
            ui.notifications.warn(
                `${combatant.token.name} is not the current combatant`,
            );
            return null;
        }

        if (!combatant.actor.isOwner) {
            ui.notifications.warn(
                `You do not have permissions to control the combatant ${combatant.token.name}.`,
            );
            return null;
        }

        token = canvas.tokens.get(combatant.token.id);
        return { token: token, actor: combatant.actor };
    }

    static getUserTargetedToken(combatant) {
        const targets = game.user.targets;
        if (!targets?.size) {
            ui.notifications.warn(
                `No targets selected, you must select exactly one target, combat aborted.`,
            );
            return null;
        } else if (targets.size > 1) {
            ui.notifications.warn(
                `${targets} targets selected, you must select exactly one target, combat aborted.`,
            );
        }

        const targetToken = Array.from(game.user.targets)[0]?.document;

        if (combatant?.token && targetToken.id === combatant.token.id) {
            ui.notifications.warn(
                `You have targetted the combatant, they cannot attack themself, combat aborted.`,
            );
            return null;
        }

        return targetToken;
    }

    static getActor({ item, actor, speaker } = {}) {
        const result = { item, actor, speaker };
        if (item?.actor) {
            result.actor = item.actor;
            result.speaker = ChatMessage.getSpeaker({ actor: result.actor });
        } else {
            // If actor is an Actor, just return it
            if (result.actor instanceof Actor) {
                result.speaker ||= ChatMessage.getSpeaker({
                    actor: result.actor,
                });
            } else {
                if (!result.actor) {
                    // If actor was null, lets try to figure it out from the Speaker
                    result.speaker = ChatMessage.getSpeaker();
                    if (result.speaker?.token) {
                        const token = canvas.tokens.get(result.speaker.token);
                        result.actor = token.actor;
                    } else {
                        result.actor = result.speaker?.actor;
                    }
                    if (!result.actor) {
                        ui.notifications.warn(
                            `No actor selected, roll ignored.`,
                        );
                        return null;
                    }
                } else {
                    result.actor = fromUuidSync(result.actor);
                    result.speaker = ChatMessage.getSpeaker({
                        actor: result.actor,
                    });
                }

                if (!result.actor) {
                    ui.notifications.warn(`No actor selected, roll ignored.`);
                    return null;
                }
            }
        }

        if (!result.actor.isOwner) {
            ui.notifications.warn(
                `You do not have permissions to control ${result.actor.name}.`,
            );
            return null;
        }

        return result;
    }

    /*
    cyrb53 (c) 2018 bryc (github.com/bryc)
    License: Public domain (or MIT if needed). Attribution appreciated.
    A fast and simple 53-bit string hash function with decent collision resistance.
    Largely inspired by MurmurHash2/3, but with a focus on speed/simplicity.
    https://github.com/bryc/code/blob/master/jshash/experimental/cyrb53.js
    */
    static cyrb53(str, seed = 0) {
        let h1 = 0xdeadbeef ^ seed,
            h2 = 0x41c6ce57 ^ seed;
        for (let i = 0, ch; i < str.length; i++) {
            ch = str.charCodeAt(i);
            h1 = Math.imul(h1 ^ ch, 2654435761);
            h2 = Math.imul(h2 ^ ch, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
        h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
        h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
        return 4294967296 * (2097151 & h2) + (h1 >>> 0);
    }

    static async onAlterTime(
        time,
        { days = 0, hours = 0, mins = 0, secs = 0 } = {},
    ) {
        const currentWorldTime = game.time.worldTime;
        const gameStartTime = 0;
        const dialogData = {
            variant: CONFIG.SOHL.id,
            timeBases: {
                world: "Current World Time",
                existing: "From Existing Time",
                epoch: "From Game Start Time",
            },
            timeDirections: {
                future: "Toward the Future",
                past: "Toward the Past",
            },
            timeBase: "world",
            setTime: time,
            days,
            hours,
            mins,
            secs,
        };

        let dlgTemplate = "systems/sohl/templates/dialog/time-dialog.html";
        const dlgHtml = await renderTemplate(dlgTemplate, dialogData);

        const dlgResult = await Dialog.prompt({
            title: "Adjust Time",
            content: dlgHtml.trim(),
            label: `Adjust Time`,
            render: (element) => {
                element
                    .querySelector('[name="timeBase"]')
                    ?.addEventListener("change", (e) => {
                        const time = element.querySelector("#time");
                        let newValue =
                            e.target.value === "existing"
                                ? Utility.htmlWorldTime(time)
                                : e.target.value === "world"
                                  ? Utility.htmlWorldTime(currentWorldTime)
                                  : Utility.htmlWorldTime(gameStartTime);
                        time.innerHTML = newValue;
                    });
            },
            callback: (element) => {
                const form = element.querySelector("form");
                const fd = new FormDataExtended(form);
                const formData = foundry.utils.expandObject(fd.object);
                const timeBase = formData.timeBase;
                const direction = formData.direction;
                const days = Number.parseInt(formData.days, 10);
                const hours = Number.parseInt(formData.hours, 10);
                const mins = Number.parseInt(formData.mins, 10);
                const secs = Number.parseInt(formData.secs, 10);
                let newTime =
                    timeBase === "world"
                        ? game.time.worldTime
                        : timeBase === "existing"
                          ? dialogData.setTime
                          : 0;
                const diff = days * 86400 + hours * 3600 + mins * 60 + secs;
                newTime += direction === "future" ? diff : -diff;
                return newTime;
            },
            rejectClose: false,
            options: { jQuery: false },
        });

        return dlgResult;
    }

    /**
     * Coerces value to the specified maximum precision.  If the value has greater than
     * the specified precision, then rounds the value to the specified precision.  If
     * the value has less than or equal to the specified precision, the value is unchanged.
     *
     * @param {number} value Source value to be evaluated
     * @param {number} [precision=0] Maximum number of characters after decimal point
     * @returns {number} value rounded to the specified precision
     */
    static maxPrecision(value, precision = 0) {
        return +parseFloat(value).toFixed(precision);
    }

    static async moveQtyDialog(item, dest) {
        // Render modal dialog
        let dlgData = {
            itemName: item.name,
            targetName: dest.name || this.actor.name,
            maxItems: item.system.quantity,
        };

        if (item.nestedIn) {
            dlgData.sourceName = `${item.nestedIn.label}`;
        } else {
            dlgData.sourceName = this.actor.name;
        }

        const compiled = Handlebars.compile(`<form id="items-to-move">
            <p>Moving ${dlgData.itemName} from ${dlgData.sourceName} to ${dlgData.targetName}</p>
            <div class="form-group">
                <label>How many (0-${dlgData.maxItems})?</label>
                {{numberInput ${dlgData.maxItems} name="itemstomove" step=1 min=0 max=${dlgData.maxItems}}}
            </div>
            </form>`);
        const dlgHtml = compiled(dlgData, {
            allowProtoMethodsByDefault: true,
            allowProtoPropertiesByDefault: true,
        });

        // Create the dialog window
        const result = await Dialog.prompt({
            title: "Move Items",
            content: dlgHtml,
            label: "OK",
            callback: async (element) => {
                const form = element.querySelector("form");
                const fd = new FormDataExtended(form);
                const formdata = foundry.utils.expandObject(fd.object);
                let formQtyToMove = Number.parseInt(formdata.itemstomove) || 0;

                return formQtyToMove;
            },
            options: { jQuery: false },
            rejectClose: false,
        });

        return result || 0;
    }

    static createAction(event, parent) {
        if (event.preventDefault) event.preventDefault();
        const dataset = event.currentTarget.dataset;
        const isChat = dataset.type === "chat";

        let dlgHtml = `<form>
            <div class="form-group">
                <label>Action Name:</label>
                <input name="name" type="text" placeholder="Action Name"/>
            </div>
            <div class="form-group">
                <label>Macro Type:</label>
                <select name="type">
                    <option value="script" ${!isChat ? "selected" : ""}>Script</option>
                    <option value="chat" ${isChat ? "selected" : ""}>Chat</option>
                </select>
            </div>
        </form>`;

        // Create the dialog window
        return Dialog.prompt({
            title: "Create Action",
            content: dlgHtml,
            label: "Create",
            callback: async (element) => {
                const form = element.querySelector("form");
                const fd = new FormDataExtended(form);
                const formData = foundry.utils.expandObject(fd.object);

                const hasAction = parent.system.actions.some(
                    (it) => !it.isIntrinsicAction && it.name === formData.name,
                );
                if (hasAction) {
                    ui.notifications.error(
                        `An action named ${formData.name} already exists on ${parent.label}`,
                    );
                    return null;
                }

                const action = await SohlMacro.create(
                    { name: formData.name, type: formData.type },
                    { nestedIn: parent },
                );
                action.sheet.render(true);
                return action;
            },
            options: { jQuery: false },
            rejectClose: false,
        });
    }

    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    static deleteAction(event, action) {
        if (!action) {
            console.error(`SoHL | Delete aborted, action not specified.`);
            return null;
        }

        return Dialog.confirm({
            title: `Delete Action: ${action.name}`,
            content:
                "<p>Are You Sure?</p><p>This action will be deleted and cannot be recovered.</p>",
            yes: () => {
                return action.delete();
            },
        });
    }

    /**
     * Generates a unique name by appending numerical suffixes to the specified prefix if necessary. Iterates over the provided items to ensure the generated name does not already exist in the list.
     *
     * @static
     * @param {*} prefix
     * @param {*} items
     * @returns {*}
     */
    static uniqueName(prefix, items) {
        let candidate = prefix;
        if (items instanceof Map || items instanceof Array) {
            let ord = 0;
            while (items.some((n) => n.name === candidate)) {
                ord++;
                candidate = `${prefix} ${ord}`;
            }
        }

        return candidate;
    }

    static htmlWorldTime(value) {
        const worldDateLabel = EventItemData.getWorldDateLabel(value);
        const remainingDurationLabel = Utility.formatDuration(
            value - game.time.worldTime,
        );
        const fragHtml = `<span data-tooltip="${worldDateLabel}">${remainingDurationLabel}</span>`;
        return fragHtml;
    }

    static formatDuration(age) {
        const duration = Math.abs(age);
        const days = Math.floor(duration / 86400);
        const hours = Math.floor((duration % 86400) / 3600);
        const min = Math.floor((duration % 3600) / 60);
        const sec = duration % 60;
        let result = days ? `${days}d ` : "";
        result += hours ? `${hours}h ` : "";
        result += min ? `${min}m ` : "";
        result += !result || sec ? `${sec}s` : "";
        result += age > 0 ? " in the future" : age < 0 ? " ago" : "";
        return result;
    }

    /**
     * A static method that converts a given number of seconds to a normalized time format. It calculates the normalized hours, minutes, and seconds based on the input seconds value and constructs a formatted time string. Returns an object with 'label' property containing the formatted time string and 'inFuture' property indicating whether the input seconds value is negative.
     *
     * @static
     * @param {*} seconds
     * @returns {{ label: string; inFuture: boolean; }}
     */
    static toNormTime(seconds) {
        const asecs = Math.abs(seconds);
        const normHours = Math.floor(asecs / 3600);
        const remSeconds = asecs % 3600;
        const normMinutes = Number(Math.floor(remSeconds / 60))
            .toString()
            .padStart(2, "0");
        const normSeconds = Number(remSeconds % 60)
            .toString()
            .padStart(2, "0");
        return {
            label: `${normHours}:${normMinutes}:${normSeconds}`,
            inFuture: seconds < 0,
        };
    }

    /**
     * Convert an integer into a roman numeral.  Taken from:
     * http://blog.stevenlevithan.com/archives/javascript-roman-numeral-converter
     *
     * @param {Integer} num
     */
    static romanize(num) {
        if (isNaN(num)) return NaN;
        var digits = String(+num).split(""),
            key = [
                "",
                "C",
                "CC",
                "CCC",
                "CD",
                "D",
                "DC",
                "DCC",
                "DCCC",
                "CM",
                "",
                "X",
                "XX",
                "XXX",
                "XL",
                "L",
                "LX",
                "LXX",
                "LXXX",
                "XC",
                "",
                "I",
                "II",
                "III",
                "IV",
                "V",
                "VI",
                "VII",
                "VIII",
                "IX",
            ],
            roman = "",
            i = 3;
        while (i--) roman = (key[+digits.pop() + i * 10] || "") + roman;
        return Array(+digits.join("") + 1).join("M") + roman;
    }

    /**
     * Calculates the distance from sourceToken to targetToken in "scene" units (e.g., feet).
     *
     * @param {Token} sourceToken
     * @param {Token} targetToken
     * @param {Boolean} gridUnits If true, return in grid units, not "scene" units
     */
    static rangeToTarget(sourceToken, targetToken, gridUnits = false) {
        if (sourceToken instanceof Token) {
            sourceToken = sourceToken.document;
        } else if (!(sourceToken instanceof TokenDocument)) {
            throw new Error(`invalid sourceToken`);
        }
        if (targetToken instanceof Token) {
            targetToken = targetToken.document;
        } else if (!(targetToken instanceof TokenDocument)) {
            throw new Error(`invalid targetToken`);
        }
        if (!canvas.scene?.grid) {
            ui.notifications.warn(`No scene active`);
            return null;
        }
        if (!gridUnits && !["feet", "ft"].includes(canvas.scene.grid.units)) {
            ui.notifications.warn(
                `Scene uses units of ${canvas.scene.grid.units} but only feet are supported, distance calculation not possible`,
            );
            return 0;
        }

        // If the current scene is marked "Theatre of the Mind", then range is always 0
        if (canvas.scene.getFlag("sohl", "isTotm")) return 0;

        const result = canvas.grid.measurePath([
            sourceToken.object.center,
            targetToken.object.center,
        ]);

        return gridUnits ? result.spaces : result.distance;
    }

    /**
     * Returns the single selected token if there is exactly one token selected
     * on the canvas, otherwise issue a warning.
     *
     * @static
     * @param {object} [options]
     * @param {boolean} [options.quiet=false] suppress warning messages
     * @returns {Token|null} The currently selected token, or null if there is not exactly one selected token
     */
    static getSingleSelectedToken({ quiet = false } = {}) {
        const numTargets = canvas.tokens?.controlled?.length;
        if (!numTargets) {
            if (!quiet)
                ui.notifications.warn(`No selected tokens on the canvas.`);
            return null;
        }

        if (numTargets > 1) {
            if (!quiet)
                ui.notifications.warn(
                    `There are ${numTargets} selected tokens on the canvas, please select only one`,
                );
            return null;
        }

        return canvas.tokens.controlled[0].document;
    }

    static async asyncForEach(array, callback) {
        for (let index = 0; index < array.length; index++) {
            await callback(array[index], index, array);
        }
    }

    static async getDocsFromPacks(
        packNames,
        { documentName = "Item", docType },
    ) {
        let allDocs = [];
        for (let packName of packNames) {
            const pack = game.packs.get(packName);
            if (!pack) continue;
            if (pack.documentName !== documentName) continue;
            const query = {};
            if (docType) {
                query["type"] = docType;
            }
            const items = await pack.getDocuments(query);
            allDocs.push(...items.map((it) => it.toObject()));
        }
        return allDocs;
    }

    /**
     * A static asynchronous function that retrieves an item from the specified
     * packs based on the item name, pack names, and optionally item type.
     * It iterates over each pack name, gets the pack object from the game data,
     * constructs a query object based on the item name and optional item type,
     * and fetches documents that match the query from the pack. If any results
     * are found, the first result is assigned to the variable 'result' and the
     * iteration stops. Finally, it returns the found item or null if no item is found.
     *
     * @static
     * @async
     * @param {string} docName
     * @param {string[]} packNames
     * @param {object} options
     * @param {string} [options.itemType]
     * @param {boolean} [options.keepId]
     * @returns {object} data representing a document from the compendium
     */
    static async getDocumentFromPacks(
        docName,
        packNames,
        { documentName = "Item", docType, keepId } = {},
    ) {
        let data = null;
        const allDocs = await Utility.getDocsFromPacks(packNames, {
            documentName,
            docType,
        });
        const doc = allDocs?.find((it) => it.name === docName);
        if (doc) {
            // Cleanup item data
            data = doc.toObject();
            if (!keepId) data._id = foundry.utils.randomID();
            delete data.folder;
            delete data.sort;
            if (doc.pack)
                foundry.utils.setProperty(
                    data,
                    "_stats.compendiumSource",
                    doc.uuid,
                );
            if ("ownership" in data) {
                data.ownership = {
                    default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER,
                    [game.user.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER,
                };
            }
            if (doc.effects) {
                data.effects = doc.effects.contents.map((e) => e.toObject());
            }
        }

        return data;
    }

    /**
     * Creates a 16-digit sequence of hexadecimal digits, suitable for use as
     * an ID, but such that the same input string will produce the same output
     * every time.
     *
     * @param {string} str Input string to convert to hash
     * @returns Sequence of 16 hexadecimal digits as a string
     */
    static createHash16(str) {
        const chars =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        const ary = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (let i = 0; i < str.length; i++) {
            ary[i % 16] += str.codePointAt(i);
        }
        let id = "";
        for (let i = 0; i < 16; i++) id += chars[ary[i] % chars.length];
        return id;
    }

    /**
     * Loads a JSON file and returns an object representing the JSON structure.
     *
     * @param {string} filepath path to the JSON file
     * @returns {object} The parsed JSON structure
     */
    static async loadJSONFromFile(filepath) {
        const json = await foundry.utils.fetchJsonWithTimeout(
            foundry.utils.getRoute(filepath, { prefix: ROUTE_PREFIX }),
        );
        return json;
    }

    static async createItemFromJson(filepath) {
        const descObj = await Utility.loadJSONFromFile(filepath);

        const createData = foundry.utils.deepClone(descObj.template);
        createData._id ||= foundry.utils.randomID();

        if (descObj.nestedItems) {
            foundry.utils.mergeObject(createData, {
                system: {
                    nestedItems: [],
                },
            });

            for (let [name, type] of descObj.nestedItems) {
                const itemData = await Utility.getItemFromPacks(
                    name,
                    CONFIG.Item.compendiums,
                    { itemType: type },
                );
                if (itemData) {
                    itemData._id = foundry.utils.randomID();
                    delete itemData.folder;
                    delete itemData.sort;
                    delete itemData._stats;
                    delete itemData.pack;
                    createData.system.nestedItems.push(itemData);
                }
            }
        }
        const result = await SohlItem.create(createData, { clean: true });
        console.log(`Item with name ${descObj.name} created`);
        return result;
    }

    /**
     * Handles combat fatigue for each combatant in a combat. Calculates the distance a combatant has moved since the start of combat and applies combat fatigue to the combatant's actor. Updates flags to mark that the combatant has not participated in combat and sets the start location for the next combat round.
     *
     * @static
     * @param {*} combat
     */
    static handleCombatFatigue(combat) {
        combat.turns.forEach((combatant) => {
            const actor = combatant.token.actor;
            const didCombat = combatant.getFlag("sohl", "didCombat");

            if (didCombat) {
                // Calculate distance combatant has moved
                const startLocation = combatant.getFlag(
                    "sohl",
                    "startLocation",
                );
                const dist = startLocation
                    ? combat.getDistance(startLocation, combatant.token.center)
                    : 0;

                actor?.system.applyCombatFatigue(dist);
            }

            combatant.update({
                "flags.sohl.didCombat": false,
                "flags.sohl.startLocation": combatant.token.center,
            });
        });
    }

    /**
     * Optionally hide the display of chat card action buttons which cannot be performed by the user
     */

    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    static displayChatActions(message, html, data) {
        const element = html instanceof jQuery ? html[0] : html;

        const chatCard = element.querySelectorAll(".chat-card");
        if (chatCard.length > 0) {
            // If the user is the GM, proceed
            if (game.user.isGM) return;

            // Conceal edit link
            const editAnchor = chatCard.querySelector("a.edit-action");
            editAnchor.style.display = "none";

            // Conceal action buttons
            const buttons = chatCard.querySelectorAll("button[data-action]");
            // biome-ignore lint/correctness/noUnusedVariables: <explanation>
            buttons.each((i, btn) => {
                if (btn.dataset?.handlerActorUuid) {
                    let actor = fromUuidSync(btn.dataset.handlerActorUuid);
                    if (!actor || !actor.isOwner) {
                        btn.style.display = "none";
                    }
                }
            });
        }
    }

    static async onChatCardEditAction(editAction) {
        return await Utility._executeAction(editAction.dataset);
    }

    static async onChatCardButton(button) {
        button.disabled = true;
        const result = await Utility._executeAction(button.dataset);
        button.disabled = false;
        return result;
    }

    static async _executeAction(dataset) {
        const options = {};
        let thisArg;
        let doc = await fromUuid(dataset.actionHandlerUuid);
        if (doc instanceof Token) {
            options.token = doc.document;
            options.actor = doc.actor;
            thisArg = doc.actor?.system;
            doc = options.actor;
        } else if (doc instanceof TokenDocument) {
            options.token = doc;
            options.actor = doc.actor;
            thisArg = doc.actor?.system;
            doc = options.actor;
        } else if (doc instanceof SohlActor) {
            options.token = doc.getToken(options.defTokenUuid);
            options.actor = doc;
            thisArg = doc.system;
        } else if (doc instanceof SohlItem) {
            options.actor = doc.actor;
            options.token = doc.actor.getToken(options.defTokenUuid);
            thisArg = doc.system;
        } else {
            throw new Error(
                `targetUuid ${options.targetUuid} is not a Token, TokenDocument, Actor, or Item UUID`,
            );
        }

        for (const key in dataset) {
            if (key.endsWith("Json")) {
                const newKey = key.slice(0, -4);
                options[newKey] = Utility.JSON_parse(dataset[key], { thisArg });
            } else {
                options[key] = dataset[key];
            }
        }

        return await doc.system.execute(options.action, options);
    }

    static async getOpposedItem({
        actor,
        skipDialog = false,
        label,
        title,
        func,
        compareFn = (a, b) => a - b,
    } = {}) {
        if (!(actor instanceof SohlActor))
            throw new Error("Must provide actor");
        let candidates = new foundry.utils.Collection();
        for (let it of actor.allItems()) {
            const result = func instanceof Function ? func(it) : null;
            if (result) candidates.set(result.key, result.value);
        }

        if (!candidates.size) {
            return false; // False means no candidates found
        } else if (candidates.size === 1) {
            return candidates.contents[0]; // If only one candidate, simply return it, no dialog needed
        }

        candidates = Array.from(candidates.values());
        candidates.sort(compareFn);

        // get the strikemode with the highest median impact as default
        let candidate = candidates[0];

        if (!skipDialog) {
            let dlgHtml = `<form id="select-candidate">
                <div class="form-group">
                    <label>${label}</label>
                    <select name="candidateId">`;
            candidates.forEach((cand, idx) => {
                dlgHtml += `<option value=${cand.id}${!idx ? " selected" : ""}>${cand.nestedIn.name} ${cand.name}`;
                if (cand.system.$impact) {
                    dlgHtml += ` (${cand.system.$impact.label})`;
                }
                dlgHtml += `</option>`;
            });
            dlgHtml += `</select></div></form>`;
            candidate = await Dialog.prompt({
                title,
                content: dlgHtml,
                label: "OK",
                callback: async (element) => {
                    const form = element.querySelector("form");
                    const fd = new FormDataExtended(form);
                    const formdata = foundry.utils.expandObject(fd.object);
                    const selection = candidates.find(
                        (cand) => cand.id === formdata.candidateId,
                    );
                    return selection;
                },
                options: { jQuery: false },
                rejectClose: false,
            });
            if (!candidate) return null; // Null means dialog was cancelled, closed without selection
        }
        return candidate;
    }

    static async opposedTestResume(
        speaker,
        actor,
        token,
        character,
        scope = {},
    ) {
        let {
            noChat = false,
            opposedTestResult,
            testType = SuccessTestResult.TEST_TYPE.SKILL,
            item,
        } = scope;

        if (!opposedTestResult) {
            throw new Error("Must supply opposedTestResult");
        }

        if (!item) {
            throw new Error("Must supply item");
        }

        ({ speaker, actor, token, character } = SohlMacro.getExecuteDefaults({
            speaker,
            actor,
            token,
            character,
            needsToken: true,
            self: this,
        }));

        if (!opposedTestResult.targetTestResult) {
            opposedTestResult.targetTestResult = item.successTest({
                noChat: true,
                testType,
            });
            if (!opposedTestResult.targetTestResult) return null;
        } else {
            // In this situation, where the targetTestResult is provided,
            // the GM is modifying the result of a prior opposedTest.
            // Therefore, we re-display the dialog for each of the prior
            // successTests.
            opposedTestResult.sourceTestResult =
                opposedTestResult.sourceTestResult.item.successTest({
                    noChat: true,
                    successTestResult: opposedTestResult.sourceTestResult,
                });
            opposedTestResult.targetTestResult =
                opposedTestResult.targetTestResult.item.successTest({
                    noChat: true,
                    successTestResult: opposedTestResult.targetTestResult,
                });
        }

        let allowed = await opposedTestResult.evaluate();

        if (allowed && !noChat) {
            opposedTestResult.toChat({
                template:
                    "systems/sohl/templates/chat/opposed-result-card.html",
                title: `Opposed Action Result`,
            });
        }

        return allowed ? opposedTestResult : false;
    }

    static stringParse(val) {
        if (typeof val !== "string") throw new Error("not a string");
        if (val === "true") return true;
        else if (val === "false") return false;
        else if (val === "null") return null;
        else if (val === "undefined") return undefined;

        let tmpVal = Number(val);
        if (!Number.isNaN(tmpVal)) return tmpVal;

        try {
            tmpVal = Utility.safeFunctionFactory(val);
        } catch (_err) {
            tmpVal = undefined;
        }
        if (tmpVal !== undefined) return tmpVal;

        try {
            tmpVal = JSON.parse(val);
        } catch (_err) {
            /* empty */
        }

        return val;
    }
}

class SohlFunctionField extends fields.JavaScriptField {
    constructor(options = {}, context = {}) {
        super(options, context);
        this.nullable = false;
    }

    /** @inheritdoc */
    static get _defaults() {
        return Object.assign(super._defaults, {
            validationError: "is not a valid Function",
        });
    }

    getInitialValue(_data) {
        if (typeof this.inital === "function") return this.initial;
        else return this._cast(this.initial);
    }

    /** @override */
    _cast(value) {
        if (typeof value === "string" && value)
            return Utility.safeFunctionFactory(value, this.async);
        else if (typeof value === "function") return value;
        else return Utility.safeFunctionFactory("", this.async);
    }

    toObject(value) {
        if (typeof value === "function") return value.toString();
        else return "";
    }
}

export class SohlContextMenu extends foundry.applications.ui.ContextMenu {
    static get SORT_GROUPS() {
        return {
            DEFAULT: "default",
            ESSENTIAL: "essential",
            GENERAL: "general",
            HIDDEN: "hidden",
        };
    }

    static get sortGroups() {
        return {
            [SohlContextMenu.SORT_GROUPS.DEFAULT]: "Default",
            [SohlContextMenu.SORT_GROUPS.ESSENTIAL]: "Essential",
            [SohlContextMenu.SORT_GROUPS.GENERAL]: "General",
            [SohlContextMenu.SORT_GROUPS.DEFAULT]: "Hidden",
        };
    }

    _setPosition(html, target, { event } = {}) {
        // Ensure element is a native HTMLElement
        const element = html instanceof jQuery ? html[0] : html;
        if (target instanceof jQuery) [target] = target;

        // Find the container element (equivalent to target.parents("div.app"))
        let container = target.closest("div.app");

        // Set styles on the target
        target.style.position = "relative";
        element.style.visibility = "hidden";
        element.style.width = "fit-content";

        // Append the element to the container
        container.appendChild(element);

        // Calculate context bounds
        const contextRect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const mouseX = event.pageX - containerRect.left;
        const mouseY = event.pageY - containerRect.top;

        const contextTopOffset = mouseY;
        let contextLeftOffset = Math.min(
            containerRect.width - contextRect.width,
            mouseX,
        );

        // Calculate whether the menu should expand upward
        const contextTopMax = mouseY - contextRect.height;
        const contextBottomMax = mouseY + contextRect.height;
        const canOverflowUp =
            contextTopMax > containerRect.top ||
            getComputedStyle(container).overflowY === "visible";

        // Determine if it should expand upward
        const expandUp =
            contextBottomMax > containerRect.height &&
            (contextTopMax >= 0 || canOverflowUp);

        // Calculate top and bottom positions
        const contextTop = expandUp
            ? contextTopOffset - contextRect.height
            : contextTopOffset;
        const contextBottom = contextTop + contextRect.height;

        // Update classes for expand-up/expand-down
        element.classList.toggle("expand-up", expandUp);
        element.classList.toggle("expand-down", !expandUp);

        // Set positioning styles
        element.style.top = `${contextTop}px`;
        element.style.bottom = `${contextBottom}px`;
        if (contextLeftOffset) {
            element.style.left = `${contextLeftOffset}px`;
        }

        // Make the element visible
        element.style.visibility = "visible";

        // Add context class to target
        target.classList.add("context");
    }
}

function NestableDataModelMixin(Base) {
    return class NestableDataModel extends Base {
        static metadata = Object.freeze({
            name: undefined,
            locId: "",
            iconCssClass: "",
            label: "",
            labelPlural: "",
            img: "icons/svg/item-bag.svg",
            sheet: "",

            /*
             * The metadata has to include the version of this Document schema, which needs to be increased
             * whenever the schema is changed such that Document data created before this version
             * would come out different if `fromSource(data).toObject()` was applied to it so that
             * we always vend data to client that is in the schema of the current core version.
             * The schema version needs to be bumped if
             *   - a field was added or removed,
             *   - the class/type of any field was changed,
             *   - the casting or cleaning behavior of any field class was changed,
             *   - the data model of an embedded data field was changed,
             *   - certain field properties are changed (e.g. required, nullable, blank, ...), or
             *   - there have been changes to cleanData or migrateData of the Document.
             *
             * Moreover, the schema version needs to be bumped if the sanitization behavior
             * of any field in the schema was changed.
             */
            schemaVersion: undefined,
        });

        static get TYPE_NAME() {
            return this.metadata.name;
        }

        get TYPE_NAME() {
            return this.constructor.TYPE_NAME;
        }

        static get TYPE_LABEL() {
            return {
                SINGULAR: this.metadata.label,
                PLURAL: this.metadata.labelPlural,
            };
        }

        get TYPE_LABEL() {
            return this.constructor.TYPE_LABEL;
        }

        static get parentDocumentClass() {
            throw new Error("Subclass must define parent doccument class");
        }

        constructor(data = {}, options = {}) {
            super(data, options);
            if (!this.parent) {
                throw new Error("parent must be specified");
            }
        }

        static defineSchema() {
            return {
                schemaVersion: new fields.StringField({
                    initial: this.metadata.schemaVersion,
                }),
            };
        }

        _configure({ parentCollection = null } = {}) {
            /**
             * An immutable reverse-reference to the name of the collection that this Document exists in on its parent, if any.
             * @type {string|null}
             */
            Object.defineProperty(this, "parentCollection", {
                value: this._getParentCollection(parentCollection),
                writable: false,
            });

            // Construct Embedded Collections
            const collections = {};
            for (const [fieldName, field] of Object.entries(
                this.constructor.hierarchy,
            )) {
                if (!field.constructor.implementation) continue;
                const data = this._source[fieldName];
                const c = (collections[fieldName] =
                    new field.constructor.implementation(
                        fieldName,
                        this,
                        data,
                    ));
                Object.defineProperty(this, fieldName, {
                    value: c,
                    writable: false,
                });
            }

            /**
             * A mapping of embedded Document collections which exist in this model.
             * @type {Record<string, EmbeddedCollection>}
             */
            Object.defineProperty(this, "collections", {
                value: Object.seal(collections),
                writable: false,
            });
        }

        /**
         * Ensure that all SohlDataModel classes share the same schema of their base declaration.
         * @type {SchemaField}
         * @override
         */
        static get schema() {
            if (this._schema) return this._schema;
            const base = this.baseDataModel;
            if (!Object.prototype.hasOwnProperty.call(base, "_schema")) {
                const schema = new fields.SchemaField(
                    Object.freeze(base.defineSchema()),
                );
                Object.defineProperty(base, "_schema", {
                    value: schema,
                    writable: false,
                });
            }
            Object.defineProperty(this, "_schema", {
                value: base._schema,
                writable: false,
            });
            return base._schema;
        }

        /** @override */
        static *_initializationOrder() {
            const hierarchy = this.hierarchy;

            // Initialize non-hierarchical fields first
            for (const [name, field] of this.schema.entries()) {
                if (name in hierarchy) continue;
                yield [name, field];
            }

            // Initialize hierarchical fields last
            for (const [name, field] of Object.entries(hierarchy)) {
                yield [name, field];
            }
        }

        /**
         * Return a reference to the configured subclass of this base SohlDataModel type.
         * @type {typeof NestableDataModel}
         */
        static get implementation() {
            return CONFIG[
                this.baseDataModel.parentDocumentClass.documentName
            ]?.[this.dataModelName]?.documentClass;
        }

        /* -------------------------------------------- */

        /**
         * The base SohlDataModel definition that this SohlDataModel class extends from.
         * @type {typeof Document}
         */
        static get baseDataModel() {
            let cls;
            let parent = this;
            while (parent) {
                cls = parent;
                if (cls.name === this.metadata.name) return cls;
                parent = Object.getPrototypeOf(cls);
                if (parent === NestableDataModel) return cls;
            }
            throw new Error(
                `Base SohlDataModel class identification failed for "${this.documentName}"`,
            );
        }

        /**
         * The canonical name of this Document type, for example "Actor".
         * @type {string}
         */
        static get dataModelName() {
            return this.metadata.name;
        }

        get dataModelName() {
            return this.constructor.dataModelName;
        }

        /**
         * The nested Document hierarchy for this Document.
         * @returns {Readonly<Record<string, EmbeddedCollectionField|EmbeddedDocumentField>>}
         */
        static get hierarchy() {
            const hierarchy = {};
            for (const [fieldName, field] of this.schema.entries()) {
                if (field.constructor.hierarchical)
                    hierarchy[fieldName] = field;
            }
            Object.defineProperty(this, "hierarchy", {
                value: Object.freeze(hierarchy),
                writable: false,
            });
            return hierarchy;
        }

        get isNested() {
            return !!this.parentCollection;
        }

        /**
         * Migrate the object to conform to its latest data model.
         * @returns {object}              The migrated system data object
         */
        migrateData() {
            if (
                !foundry.utils.isNewerVersion(
                    this.constructor.metadata.schemaVersion,
                    this.schemaVersion,
                )
            )
                return this;
            const model = this.schema ?? {};
            return foundry.utils.mergeObject(model, this, {
                insertKeys: false,
                insertValues: true,
                enforceTypes: false,
                overwrite: true,
                inplace: false,
            });
        }

        static getCollectionName(name) {
            if (name in this.hierarchy) return name;
            for (const [collectionName, field] of Object.entries(
                this.hierarchy,
            )) {
                if (field.model.documentName === name) return collectionName;
            }
            return null;
        }

        /* -------------------------------------------- */

        /**
         * Obtain a reference to the Array of source data within the data object for a certain embedded Document name
         * @param {string} nestedName   The name of the embedded Document type
         * @returns {DocumentCollection}  The Collection instance of embedded Documents of the requested type
         */
        getNestedCollection(nestedName) {
            const collectionName =
                this.constructor.getCollectionName(nestedName);
            if (!collectionName) {
                throw new Error(
                    `${nestedName} is not a valid nested Document within the ${this.documentName} Document`,
                );
            }
            const field = this.constructor.hierarchy[collectionName];
            return field.getCollection(this);
        }

        /* -------------------------------------------- */

        /**
         * Get an embedded document by its id from a named collection in the parent document.
         * @param {string} nestedName              The name of the embedded Document type
         * @param {string} id                        The id of the child document to retrieve
         * @param {object} [options]                 Additional options which modify how embedded documents are retrieved
         * @param {boolean} [options.strict=false]   Throw an Error if the requested id does not exist. See Collection#get
         * @param {boolean} [options.invalid=false]  Allow retrieving an invalid Embedded Document.
         * @returns {Document}                       The retrieved embedded Document instance, or undefined
         * @throws If the embedded collection does not exist, or if strict is true and the Embedded Document could not be
         *         found.
         */
        getNestedDocument(
            nestedName,
            id,
            { invalid = false, strict = false } = {},
        ) {
            const collection = this.getNestedCollection(nestedName);
            return collection.get(id, { invalid, strict });
        }

        /* -------------------------------------------- */

        /**
         * Create multiple embedded Document instances within this parent Document using provided input data.
         * @see Document.createDocuments
         * @param {string} nestedName                     The name of the embedded Document type
         * @param {object[]} data                           An array of data objects used to create multiple documents
         * @param {DatabaseCreateOperation} [operation={}]  Parameters of the database creation workflow
         * @returns {Promise<Document[]>}                   An array of created Document instances
         */
        async createNestedDocuments(nestedName, data = [], operation = {}) {
            this.getNestedCollection(nestedName); // Validation only
            operation.parent = this;
            const cls = getDocumentClass(nestedName);
            return cls.createDocuments(data, operation);
        }

        /* -------------------------------------------- */

        /**
         * Update multiple embedded Document instances within a parent Document using provided differential data.
         * @see Document.updateDocuments
         * @param {string} nestedName                     The name of the embedded Document type
         * @param {object[]} updates                        An array of differential data objects, each used to update a
         *                                                  single Document
         * @param {DatabaseUpdateOperation} [operation={}]  Parameters of the database update workflow
         * @returns {Promise<Document[]>}                   An array of updated Document instances
         */
        async updateNestedDocuments(nestedName, updates = [], operation = {}) {
            this.getNestedCollection(nestedName); // Validation only
            operation.parent = this;
            const cls = getDocumentClass(nestedName);
            return cls.updateDocuments(updates, operation);
        }

        /* -------------------------------------------- */

        /**
         * Delete multiple embedded Document instances within a parent Document using provided string ids.
         * @see Document.deleteDocuments
         * @param {string} nestedName                     The name of the embedded Document type
         * @param {string[]} ids                            An array of string ids for each Document to be deleted
         * @param {DatabaseDeleteOperation} [operation={}]  Parameters of the database deletion workflow
         * @returns {Promise<Document[]>}                   An array of deleted Document instances
         */
        async deleteNestedDocuments(nestedName, ids, operation = {}) {
            this.getNestedCollection(nestedName); // Validation only
            operation.parent = this;
            const cls = getDocumentClass(nestedName);
            return cls.deleteDocuments(ids, operation);
        }

        _getParentCollection(parentCollection) {
            if (!this.parent) return null;
            if (parentCollection) return parentCollection;
            return this.parent.constructor.getCollectionName(
                this.dataModelName,
            );
        }

        *traverseNestedDocuments(_parentPath) {
            for (const [fieldName, field] of Object.entries(
                this.constructor.hierarchy,
            )) {
                const fieldPath = _parentPath
                    ? `${_parentPath}.${fieldName}`
                    : fieldName;

                // Singleton embedded document
                if (
                    field instanceof foundry.data.fields.EmbeddedDocumentField
                ) {
                    const document = this[fieldName];
                    if (document) {
                        yield [fieldPath, document];
                        yield* document.traverseNestedDocuments(fieldPath);
                    }
                } else if (
                    field instanceof foundry.data.fields.EmbeddedCollectionField
                ) {
                    const collection = this[fieldName];
                    for (const document of collection.values()) {
                        yield [fieldPath, document];
                        yield* document.traverseNestedDocuments(fieldPath);
                    }
                }
            }
        }
    };
}

function NestableDocumentMixin(Base) {
    return class NestableDocument extends Base {
        _cause;

        static metadata = Object.freeze({
            name: undefined,
            locId: "",
            label: "",
            labelPlural: "",
            img: "icons/svg/item-bag.svg",
            iconCssClass: "",
            sheet: "",

            /*
             * The metadata has to include the version of this Document schema, which needs to be increased
             * whenever the schema is changed such that Document data created before this version
             * would come out different if `fromSource(data).toObject()` was applied to it so that
             * we always vend data to client that is in the schema of the current core version.
             * The schema version needs to be bumped if
             *   - a field was added or removed,
             *   - the class/type of any field was changed,
             *   - the casting or cleaning behavior of any field class was changed,
             *   - the data model of an embedded data field was changed,
             *   - certain field properties are changed (e.g. required, nullable, blank, ...), or
             *   - there have been changes to cleanData or migrateData of the Document.
             *
             * Moreover, the schema version needs to be bumped if the sanitization behavior
             * of any field in the schema was changed.
             */
            schemaVersion: undefined,
        });

        _initialize(options = {}) {
            super._initialize(options);
            this._cause = options.cause || null;
        }

        get cause() {
            return this._cause || this.nestedIn;
        }

        set cause(doc) {
            if (doc instanceof SohlActor || doc instanceof SohlItem) {
                this._cause = doc;
            } else {
                throw new Error("must provide a valid cause");
            }
        }

        get isNested() {
            return this.parent instanceof SohlItem;
        }

        get item() {
            if (this.isNested) return this.parent;
            else if (this.cause instanceof SohlItem) return this.cause;
            return null;
        }

        get actor() {
            if (this.parent instanceof SohlActor) return this.parent;
            else if (this.cause instanceof SohlActor) return this.cause;
            else return this.item?.actor;
        }

        /** @inheritdoc */
        static async createDocuments(dataAry = [], context = {}) {
            if (!context?.parent?.isNested)
                return super.createDocuments(dataAry, context);
            if (!Array.isArray(dataAry)) dataAry = [dataAry];
            const result = [];
            for (let data of dataAry) {
                if (!(data._id && context.keepId)) {
                    data._id = foundry.utils.randomID();
                }

                if (!("ownership" in data)) {
                    data.ownership = {
                        default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER,
                    };
                }
                const doc = new this.impelementation(data, context);
                if (!doc)
                    throw new Error(`${this.documentName} creation failed`);

                const collection = context.parent.system.getNestedCollection(
                    this.documentName,
                );
                const newAry = collection.toObject();

                // Set sort property
                let maxSort = newAry.reduce(
                    (max, obj) => Math.max(max, obj.sort),
                    0,
                );
                maxSort += CONST.SORT_INTEGER_DENSITY;
                doc.sort = maxSort;

                const docExists = newAry.some((obj) => obj._id === doc.id);
                if (docExists) {
                    if (!context.keepId) {
                        throw new Error(
                            `${this.documentName} with id ${doc.id} already exists in ${context.parent.label}`,
                        );
                    }
                } else {
                    newAry.push(doc.toObject());
                    const collectionName =
                        context.parent.system.constructor.getCollectionName(
                            this.documentName,
                        );
                    context.parent.updateSource({
                        [`system.${collectionName}`]: newAry,
                    });
                }
                result.push(doc);
            }
            return result;
        }

        /** @inheritdoc */
        static async updateDocuments(updates = [], context = {}) {
            if (!context?.parent?.isNested)
                return super.updateDocuments(updates, context);
            if (!Array.isArray(updates)) updates = [updates];
            const collection = context.parent.system.getNestedCollection(
                this.documentName,
            );
            const newAry = collection.map((it) => it.toObject());
            const result = [];
            for (let update of updates) {
                // Expand the object, if dot-notation keys are provided
                if (Object.keys(update).some((k) => /\./.test(k))) {
                    const expandedUpdate = foundry.utils.expandObject(update);
                    for (const key in update) delete update[key];
                    Object.assign(update, expandedUpdate);
                }
                const itemIdx = newAry.findIndex(
                    (it) => it._id === update?._id,
                );
                if (itemIdx >= 0) {
                    const id = update._id;
                    delete update._id;
                    foundry.utils.mergeObject(newAry[itemIdx], update);
                    result.push(id);
                } else {
                    console.error(
                        `Can't find item with id ${update._id} in nested collection`,
                    );
                    continue;
                }
            }
            const collectionName =
                context.parent.system.constructor.getCollectionName(
                    this.documentName,
                );
            context.parent.updateSource({
                [`system.${collectionName}`]: newAry,
            });
            const changedDocs = collection.filter((it) =>
                result.includes(it.id),
            );
            changedDocs.forEach((doc) => doc.render());
            context.parent.render();
            return changedDocs;
        }

        /** @inheritdoc */
        static async deleteDocuments(ids = [], operation = {}) {
            if (!operation?.parent?.isNested)
                return super.deleteDocuments(ids, operation);
            if (!Array.isArray(ids)) ids = [ids];
            const collection = operation.parent.system.getNestedCollection(
                this.documentName,
            );
            let newAry = collection.map((it) => it.toObject());
            newAry = newAry.filter((it) => !ids.includes(it._id));
            const collectionName =
                operation.parent.system.constructor.getCollectionName(
                    this.documentName,
                );
            operation.parent.updateSource({
                [`system.${collectionName}`]: newAry,
            });
            operation.parent.render();
            return ids;
        }
    };
}

/**
 * A class representing a value and associated modifications. It includes methods
 * to set and get properties, add named modifiers to the data, and determine
 * effective value.
 *
 * @export
 * @class ValueModifier
 * @typedef {ValueModifier}
 */
export class ValueModifier extends NestableDataModelMixin(
    foundry.abstract.DataModel,
) {
    _effective;
    _abbrev;

    static OPERATOR = Object.freeze({
        CUSTOM: 0,
        MULTIPLY: 1,
        ADD: 2,
        DOWNGRADE: 3,
        UPGRADE: 4,
        OVERRIDE: 5,
    });

    static MOD = Object.freeze({
        DISABLED: {
            name: "Disabled",
            abbrev: "DSBL",
            op: this.OPERATOR.CUSTOM,
            value: "disabled",
        },
    });

    /** @inheritdoc */
    static metadata = Object.freeze({
        label: "SOHL.VALUEMODIFIER.entity",
        labelPlural: "SOHL.VALUEMODIFIER.entityPl",
        schemaVersion: "0.5.6",
        reservedWords: [],
    });

    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema, {
            modifiers: new fields.ArrayField(
                new fields.SchemaField({
                    name: new fields.StringField({
                        blank: false,
                        required: true,
                        label: "Name",
                    }),
                    abbrev: new fields.StringField({
                        blank: false,
                        required: true,
                        label: "Abbreviation",
                    }),
                    op: new fields.NumberField({
                        required: true,
                        initial: this.OPERATOR.ADD,
                        choices: Utility.getChoicesMap(
                            ValueModifier.OPERATOR,
                            "SOHL.VALUEMODIFIER.OPERATOR",
                        ),
                        validationError:
                            "must be a value in ValueModifier.OPERATOR",
                        label: "Operator",
                    }),
                    value: new fields.StringField({
                        label: "Value",
                    }),
                }),
                {
                    label: "Modifiers",
                },
            ),
            disabledReason: new fields.StringField({
                label: "Disabled Reason",
            }),
            baseValue: new fields.NumberField({
                nullable: true,
                integer: true,
                initial: null,
                label: "Base Value",
            }),
        });
    }

    /** @override */
    static LOCALIZATION_PREFIXES = ["VALUEMODIFIER"];

    /**
     * Constructs a new ValueModifier using the data supplied in the {@link data} plain object. Note that although
     * this can take an object created by {@link #toJSON}, this is not required, and appropriate default values will
     * be supplied for missing parameters.
     *
     * @param {object} data A plain object that was created with a corresponding {@link #toJSON} method
     * @param {object} context Contextual information relating to the object
     * @param {string} context.parent {@link SohlItemData} associated with the object
     */
    constructor(data = {}, context = {}) {
        if (!(context.parent instanceof SohlBaseData)) {
            throw new Error("parent must be a subclass of SohlBaseData");
        }
        super(data, context);
    }

    get effective() {
        return this._effective;
    }

    get modifier() {
        return this.effective - (this.base || 0);
    }

    get abbrev() {
        return this._abbrev;
    }

    get index() {
        return Math.trunc((this.base || 0) / 10);
    }

    get disabled() {
        return (
            this.disabledReason ||
            _l("SOHL.VALUEMODIFIER.DISABLED_REASON_UNSPECIFIED")
        );
    }

    set disabled(reason) {
        this.updateSource({ disabledReason: reason || null });
    }

    get base() {
        return this.baseValue || 0;
    }

    set base(value) {
        if (value !== null) {
            value = Number(value);
            if (Number.isNaN(value))
                throw new TypeError("value must be numeric or null");
        }
        this.updateSource({ disabledReason: value });
    }

    get hasBase() {
        return this.baseValue !== null;
    }

    get empty() {
        return !this.modifiers.length;
    }

    _oper(name, abbrev, value, op) {
        name = game.i18n.localize(name);

        if (typeof value === "string") {
            value = Utility.stringParse(value);
        }
        const existingOverride = this.modifiers.find(
            (m) => m.op === this.OPERATOR.OVERRIDE,
        );
        if (existingOverride) {
            // If the operation is not override, then ignore it (leave current override in place)
            if (op === this.OPERATOR.OVERRIDE) {
                // If this ValueModifier already been overriden to zero, all other modifications are ignored.
                if (existingOverride.value !== 0) {
                    // If this ValueModifier is being overriden, throw out all other modifications
                    this.updateSource({
                        modifiers: [{ name, abbrev, op, value }],
                    });
                }
            }
        } else {
            const mods = this.modifiers.filter((m) => m.abbrev !== abbrev);
            mods.push({
                name: name,
                abbrev: abbrev,
                op: op,
                value: value,
            });
            this.updateSource({ modifiers: mods });
            this._dirty = true;
        }

        return this;
    }

    get(abbrev) {
        if (typeof abbrev !== "string") return false;
        return this.modifiers.find((m) => m.abbrev === abbrev);
    }

    has(abbrev) {
        if (typeof abbrev !== "string") return false;
        return this.modifiers.some((m) => m.abbrev === abbrev) || false;
    }

    delete(abbrev) {
        if (typeof abbrev !== "string") return;
        const newMods = this.modifiers.filter((m) => m.abbrev !== abbrev) || [];
        this.updateSource({ modifiers: newMods });
    }

    add(...args) {
        let name, abbrev, value, data;
        if (typeof args[0] === "object") {
            [{ name, abbrev }, value, data = {}] = args;
        } else {
            [name, abbrev, value, data = {}] = args;
        }
        if (!Number.isNumeric(value))
            throw new TypeError("value is not numeric");
        return this._oper(name, abbrev, value, this.OPERATOR.ADD, data);
    }

    multiply(...args) {
        let name, abbrev, value, data;
        if (typeof args[0] === "object") {
            [{ name, abbrev }, value, data = {}] = args;
        } else {
            [name, abbrev, value, data = {}] = args;
        }
        if (!Number.isNumeric(value))
            throw new TypeError("value is not numeric");
        return this._oper(
            name,
            abbrev,
            value,
            ValueModifier.OPERATOR.MULTIPLY,
            data,
        );
    }

    set(...args) {
        let name, abbrev, value, data;
        if (typeof args[0] === "object") {
            [{ name, abbrev }, value, data = {}] = args;
        } else {
            [name, abbrev, value, data = {}] = args;
        }
        return this._oper(
            name,
            abbrev,
            value,
            ValueModifier.OPERATOR.OVERRIDE,
            data,
        );
    }

    floor(...args) {
        let name, abbrev, value, data;
        if (typeof args[0] === "object") {
            [{ name, abbrev }, value, data = {}] = args;
        } else {
            [name, abbrev, value, data = {}] = args;
        }
        if (!Number.isNumeric(value))
            throw new TypeError("value is not numeric");
        return this._oper(
            name,
            abbrev,
            value,
            ValueModifier.OPERATOR.UPGRADE,
            data,
        );
    }

    ceiling(...args) {
        let name, abbrev, value, data;
        if (typeof args[0] === "object") {
            [{ name, abbrev }, value, data = {}] = args;
        } else {
            [name, abbrev, value, data = {}] = args;
        }
        if (!Number.isNumeric(value))
            throw new TypeError("value is not numeric");
        return this._oper(
            name,
            abbrev,
            value,
            ValueModifier.OPERATOR.DOWNGRADE,
            data,
        );
    }

    get chatHtml() {
        function getValue(mod) {
            switch (mod.op) {
                case ValueModifier.OPERATOR.ADD:
                    return `${mod.value >= 0 ? "+" : ""}${mod.value}`;

                case ValueModifier.OPERATOR.MULTIPLY:
                    return `${SOHL.CHARS.TIMES}${mod.value}`;

                case ValueModifier.OPERATOR.DOWNGRADE:
                    return `${SOHL.CHARS.LESSTHANOREQUAL}${mod.value}`;

                case ValueModifier.OPERATOR.UPGRADE:
                    return `${SOHL.CHARS.GREATERTHANOREQUAL}${mod.value}`;

                case ValueModifier.OPERATOR.OVERRIDE:
                    return `=${mod.value}`;

                case ValueModifier.OPERATOR.CUSTOM:
                    return `${SOHL.CHARS.STAR}${mod.value}`;

                default:
                    throw Error(
                        `SoHL | Specified mode "${mod.op}" not recognized while processing ${mod.abbrev}`,
                    );
            }
        }

        if (this.disabled) return "";
        const fragHtml = `<div class="adjustment">
        <div class="flexrow">
            <span class="label adj-name">${_l("SOHL.ValueModifier.Adjustment")}</span>
            <span class="label adj-value">${_l("SOHL.ValueModifier.Value")}</span>    
        </div>${this.modifiers
            .map((m) => {
                return `<div class="flexrow">
            <span class="adj-name">${m.name}</span>
            <span class="adj-value">${getValue(m)}</span></div>`;
            })
            .join("")}</div>`;

        return fragHtml;
    }

    _calcAbbrev() {
        this._abbrev = "";
        if (this.disabled) {
            this._abbrev = ValueModifier.DISABLED_ABBREV;
        } else {
            this.modifiers.forEach((adj) => {
                if (this._abbrev) {
                    this._abbrev += ", ";
                }

                switch (adj.op) {
                    case ValueModifier.OPERATOR.ADD:
                        this._abbrev += `${adj.abbrev} ${adj.value > 0 ? "+" : ""}${
                            adj.value
                        }`;
                        break;

                    case ValueModifier.OPERATOR.MULTIPLY:
                        this._abbrev += `${adj.abbrev} ${SOHL.CHARS.TIMES}${adj.value}`;
                        break;

                    case ValueModifier.OPERATOR.DOWNGRADE:
                        this._abbrev += `${adj.abbrev} ${SOHL.CHARS.LESSTHANOREQUAL}${adj.value}`;
                        break;

                    case ValueModifier.OPERATOR.UPGRADE:
                        this._abbrev += `${adj.abbrev} ${SOHL.CHARS.GREATERTHANOREQUAL}${adj.value}`;
                        break;

                    case ValueModifier.OPERATOR.OVERRIDE:
                        this._abbrev += `${adj.abbrev} =${adj.value}`;
                        break;

                    case ValueModifier.OPERATOR.CUSTOM:
                        if (adj.value === "disabled")
                            this._abbrev += `${adj.abbrev}`;
                        break;
                }
            });
        }
    }

    _initialize() {
        if (this.disabled) {
            this._effective = 0;
        } else {
            const mods = this.modifiers.concat();

            // Sort modifiers so that we process Adds first, then Mults, then Floor, then Ceil
            mods.sort((a, b) => (a.op < b.op ? -1 : a.op > b.op ? 1 : 0));

            let minVal = null;
            let maxVal = null;
            let overrideVal;

            this._effective = 0;

            // Process each modifier
            mods.forEach((adj) => {
                let value = adj.value;

                if (typeof value === "number") {
                    value ||= 0;
                    switch (adj.op) {
                        case ValueModifier.OPERATOR.ADD:
                            this._effective += value;
                            break;

                        case ValueModifier.OPERATOR.MULTIPLY:
                            this._effective *= value;
                            break;

                        case ValueModifier.OPERATOR.UPGRADE:
                            // set minVal to the largest minimum value
                            minVal = Math.max(
                                minVal ?? Number.MIN_SAFE_INTEGER,
                                value,
                            );
                            break;

                        case ValueModifier.OPERATOR.DOWNGRADE:
                            // set maxVal to the smallest maximum value
                            maxVal = Math.min(
                                maxVal ?? Number.MAX_SAFE_INTEGER,
                                value,
                            );
                            break;

                        case ValueModifier.OPERATOR.OVERRIDE:
                            overrideVal = value;
                            break;
                    }
                } else if (typeof value === "boolean") {
                    switch (adj.op) {
                        case ValueModifier.OPERATOR.ADD:
                            this._effective ||= value ? 1 : 0;
                            break;

                        case ValueModifier.OPERATOR.MULTIPLY:
                            this._effective = value && this._effective ? 1 : 0;
                            break;

                        case ValueModifier.OPERATOR.UPGRADE:
                            // set minVal to the largest minimum value
                            minVal = 0;
                            break;

                        case ValueModifier.OPERATOR.DOWNGRADE:
                            // set maxVal to the smallest maximum value
                            maxVal = 1;
                            break;

                        case ValueModifier.OPERATOR.OVERRIDE:
                            overrideVal = value ? 1 : 0;
                            break;
                    }
                } else if (typeof value === "string") {
                    switch (adj.op) {
                        case ValueModifier.OPERATOR.CUSTOM:
                            if (value === ValueModifier.MOD.DISABLED.value) {
                                // disabled VMs always have an effective value of 0
                                overrideVal = 0;
                            }
                    }
                }
            });

            this._effective =
                minVal === null
                    ? this._effective
                    : Math.max(minVal, this._effective);
            this._effective =
                maxVal === null
                    ? this._effective
                    : Math.min(maxVal, this._effective);
            this._effective = overrideVal ?? this._effective;
            this._effective ||= 0;

            // All values must be rounded to no more than 3 significant digits.
            this._effective = Utility.maxPrecision(this._effective, 3);
        }

        this._calcAbbrev();
    }
}

/**
 * Specialized ValueModifier for Impacts
 */
export class ImpactModifier extends ValueModifier {
    /** @inheritdoc */
    static metadata = Object.freeze({
        name: "ImpactModifier",
        label: "SOHL.IMPACTMODIFIER.entity",
        labelPlural: "SOHL.IMPACTMODIFIER.entityPl",
        schemaVersion: "0.5.6",
    });

    get disabled() {
        let disabled =
            this._disabled || (this.die === 0 && this.effective === 0);
        return disabled;
    }

    static get ASPECT() {
        return {
            BLUNT: "blunt",
            EDGED: "edged",
            PIERCING: "piercing",
            FIRE: "fire",
        };
    }

    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), {
            aspect: new fields.StringField({
                initial: ImpactModifier.ASPECT.BLUNT,
                choices: Utility.getChoicesMap(
                    ImpactModifier.ASPECT,
                    "SOHL.IMPACTMODIFIER.ASPECT",
                ),
            }),
            die: new fields.NumberField({
                integer: true,
                min: 0,
                initial: 6,
            }),
            numDice: new fields.NumberField({
                integer: true,
                min: 0,
                initial: 1,
            }),
            rollObj: new fields.ObjectField(),
        });
    }

    _initialize(options = {}) {
        super._initialize(options);
        Object.defineProperty(this, "roll", {
            value: () => {
                if (!this.rollObj) return null;
                else {
                    let roll;
                    try {
                        roll = Roll.fromData(this.rollObj);
                    } catch (_e) {
                        roll = null;
                    }
                    return !roll && null;
                }
            },
            writable: false,
            enumerable: false,
        });
    }

    /**
     * Returns the statistical median impact. Result is an integer.
     *
     * @readonly
     * @type {void}
     * @returns {number} an integer representing the median impact
     */
    get median() {
        let diceMedian = 0;
        if (this.numDice > 0 && this.die > 0) {
            diceMedian = this.numDice * ((1 + this.die) / 2);
            if (this.die % 2 === 0) {
                diceMedian = this.numDice * (this.die / 2 + 0.5);
            } else {
                diceMedian = this.numDice * ((this.die + 1) / 2);
            }
        }

        return diceMedian + this.effective;
    }

    get diceFormula() {
        if (!this.numDice && !this.effective) return "0";
        const result =
            (this.numDice
                ? `${this.numDice > 1 ? this.numDice : ""}d${this.die}${
                      this.effective >= 0 ? "+" : ""
                  }`
                : "") + this.effective;
        return result;
    }

    get label() {
        const aspectChar = this.aspect?.length
            ? this.aspect.charAt(0).toLowerCase()
            : "";
        return `${this.diceFormula}${aspectChar}`;
    }

    async evaluate() {
        if (this.roll) return false;
        const roll = await Roll.create(this.diceFormula);
        const allowed = await roll.evaluate();
        if (allowed) {
            this.updateSource({ roll: roll.toJSON() });
        }
        return allowed;
    }
}

export class MasteryLevelModifier extends ValueModifier {
    /** @inheritdoc */
    static metadata = Object.freeze({
        name: "MasteryLevelModifier",
        label: "SOHL.MASTERYLEVELMODIFIER.entity",
        labelPlural: "SOHL.MASTERYLEVELMODIFIER.entityPl",
        schemaVersion: "0.5.6",
    });

    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), {
            minTarget: new fields.NumberField({
                integer: true,
                nullable: false,
                min: 0,
                initial: 5,
            }),
            maxTarget: new fields.NumberField({
                integer: true,
                nullable: false,
                min: 0,
                initial: 95,
            }),
            successLevelMod: new fields.NumberField({
                integer: true,
                nullable: false,
                min: 0,
                initial: 0,
            }),
            critFailureDigits: new fields.ArrayField(
                new fields.NumberField({
                    integer: true,
                    nullable: false,
                    required: true,
                    min: 0,
                    max: 9,
                }),
            ),
            critSuccessDigits: new fields.ArrayField(
                new fields.NumberField({
                    integer: true,
                    nullable: false,
                    required: true,
                    min: 0,
                    max: 9,
                }),
            ),
        });
    }

    get constrainedEffective() {
        return Math.min(
            this.maxTarget,
            Math.max(this.minTarget, this.effective),
        );
    }

    /**
     * Perform Success Test for this Item
     *
     * @param {object} options
     * @returns {SuccessTestChatData}
     */
    async createSuccessTest({
        speaker = ChatMessage.getSpeaker(),
        skipDialog = false,
        noChat = false,
        type = `${this.parent.item.type}-${this.parent.item.name}-test`,
        title = _l("SOHL.MasteryLevelModifier.successTest.title", {
            label: this.parent.item.label,
        }),
        testResult,
    } = {}) {
        if (testResult) {
            testResult = Utility.JSON_reviver(testResult, {
                thisArg: this.parent,
            });
        } else {
            testResult = new CONFIG.SOHL.class.SuccessTestResult(
                {
                    speaker,
                    type,
                    title,
                    mlMod: Utility.deepClone(this.$masteryLevel),
                },
                { parent: this.parent },
            );
        }

        if (!skipDialog) {
            // Render modal dialog
            let dlgTemplate =
                "systems/sohl/templates/dialog/standard-test-dialog.html";

            let dialogData = {
                variant: CONFIG.SOHL.id,
                type: testResult.type,
                title: _l("SOHL.MasteryLevelModifier.successTest.dialogTitle", {
                    name: testResult.token
                        ? testResult.token.name
                        : testResult.actor.name,
                    title: testResult.title,
                }),
                mlMod: testResult.mlMod,
                situationalModifier: testResult.situationalModifier,
                rollMode: testResult.rollMode,
                rollModes: Object.entries(CONFIG.Dice.rollModes).map(
                    ([k, v]) => ({
                        group: "CHAT.RollDefault",
                        value: k,
                        label: v,
                    }),
                ),
            };
            const dlgHtml = await renderTemplate(dlgTemplate, dialogData);

            // Create the dialog window
            const result = await Dialog.prompt({
                title: dialogData.title,
                content: dlgHtml.trim(),
                label: _l("SOHL.MasteryLevelModifier.successTest.dialogLabel"),
                callback: (element) => {
                    const form = element.querySelector("form");
                    const fd = new FormDataExtended(form);
                    const formData = fd.object;
                    const formSituationalModifier =
                        Number.parseInt(formData.situationalModifier, 10) || 0;

                    if (formSituationalModifier) {
                        testResult.mlMod.add(
                            CONFIG.SOHL.MOD.PLAYER,
                            formSituationalModifier,
                        );
                        testResult.situationalModifier =
                            formSituationalModifier;
                    }

                    const formSuccessLevelMod = Number.parseInt(
                        formData.successLevelMod,
                        10,
                    );
                    testResult.mlMod.successLevelMod = formSuccessLevelMod;
                    testResult.rollMode = formData.rollMode;
                    return true;
                },
                rejectClose: false,
                options: { jQuery: false },
            });

            if (!result) return;
        }

        let allowed = await testResult.evaluate();

        if (allowed && !noChat) {
            await testResult.toChat({
                speaker,
                testResult,
            });
        }
        return allowed ? testResult : false;
    }

    /**
     * @typedef TestDetailedDescription
     * @property {number} maxValue maximum value that applies to this description
     * @property {number[]} lastDigit array of last digits that applies to this description
     * @property {string} label The short text of the description
     * @property {string} description The long text of the description
     */

    static _handleDetailedDescription(chatData, target, testDescTable) {
        let result = null;
        testDescTable.sort((a, b) => a.maxValue - b.maxValue);
        const testDesc = testDescTable.find(
            (entry) => entry.maxValue >= target,
        );
        if (testDesc) {
            // If the test description has a limitation based on
            // the last digit, find the one that applies.
            if (testDesc.limited?.length) {
                const limitedDesc = testDesc.limited.find((d) =>
                    d.lastDigits.includes(chatData.lastDigit),
                );
                if (limitedDesc) {
                    const label =
                        limitedDesc.label instanceof Function
                            ? limitedDesc.label(chatData)
                            : limitedDesc.label;
                    const desc =
                        limitedDesc.description instanceof Function
                            ? limitedDesc.description(chatData)
                            : limitedDesc.description;
                    chatData.resultText = label || "";
                    chatData.resultDesc = desc || "";
                    chatData.svSuccess = limitedDesc.success;
                    result = limitedDesc.result;
                }
            } else {
                const label =
                    testDesc.label instanceof Function
                        ? testDesc.label(chatData)
                        : testDesc.label;
                const desc =
                    testDesc.description instanceof Function
                        ? testDesc.description(chatData)
                        : testDesc.description;
                chatData.resultText = label || "";
                chatData.resultDesc = desc || "";
                chatData.svSuccess = testDesc.success;
                result = testDesc.result;
            }
        }

        if (result instanceof Function) result = result(chatData);

        return result;
    }
}

export class CombatModifier extends MasteryLevelModifier {
    /** @inheritdoc */
    static metadata = Object.freeze({
        name: "CombatModifier",
        label: "SOHL.COMBATMODIFIER.entity",
        labelPlural: "SOHL.COMBATMODIFIER.entityPl",
        schemaVersion: "0.5.6",
    });
    /**
     * Creates an instance of CombatModifier.
     *
     * @constructor
     * @param {*} parent
     * @param {object} [initProperties={}]
     */
    constructor(data = {}, context = {}) {
        foundry.utils.mergeObject(
            data,
            {
                properties: {},
            },
            { overwrite: false },
        );
        super(data, context);
    }

    static get baseClassName() {
        return "CombatModifier";
    }
}

class TestResult extends NestableDataModelMixin(foundry.abstract.DataModel) {
    /** @inheritdoc */
    static metadata = Object.freeze({
        name: "TestResult",
        label: "SOHL.TESTRESULT.entity",
        labelPlural: "SOHL.TESTRESULT.entityPl",
        schemaVersion: "0.5.6",
    });

    static defineSchema() {
        return {
            name: new fields.StringField({
                initial: this.constructor.baseDataModel,
                readonly: true,
            }),
            speaker: new fields.ObjectField(),
            title: new fields.StringField(),
            type: new fields.StringField(),
        };
    }

    constructor(data = {}, options = {}) {
        super(data, options);
        if (!(parent instanceof SohlBaseData)) {
            throw new Error("Parent must be of type SohlBaseData");
        }
    }

    _initialize(options = {}) {
        if (!this._source.speaker) {
            Object.defineProperty(this, "speaker", {
                value: ChatMessage.getSpeaker(),
                writable: false,
            });
        }

        return super._initialize(options);
    }

    static get parentDocumentClass() {
        return SohlBaseData;
    }

    get scene() {
        return this.speaker?.scene ? game.scenes.get(this.speaker.scene) : null;
    }

    get token() {
        return this.actor?.token || this.scene?.tokens.get(this.speaker.token);
    }

    get actor() {
        return (
            this.parent?.actor ||
            this.token?.actor ||
            game.actors.get(this.speaker.actor)
        );
    }

    get item() {
        return this.parent?.item;
    }

    async evaluate() {
        return true;
    }
}

export class SuccessTestResult extends TestResult {
    _resultText;
    _resultDesc;
    _description;
    _targetMovement;
    _successLevel;

    static SUCCESS_LEVEL = Object.freeze({
        CRITICAL_FAILURE: -1,
        MARGINAL_FAILURE: 0,
        MARGINAL_SUCCESS: 1,
        CRITICAL_SUCCESS: 2,
    });

    static ROLL = Object.freeze({
        CRITICAL_FAILURE: Roll.create("100").evaluateSync(),
        MARGINAL_FAILURE: Roll.create("99").evaluateSync(),
        CRITICAL_SUCCESS: Roll.create("5").evaluateSync(),
        MARGINAL_SUCCESS: Roll.create("1").evaluateSync(),
    });

    static TEST_TYPE = Object.freeze({
        SETIMPROVEFLAG: "setImproveFlag",
        UNSETIMPROVEFLAG: "unsetImproveFlag",
        IMPROVESDR: "improveWithSDR",
        SKILL: "successTest",
        OPPOSEDSKILL: "opposedTestStart",
        SHOCK: "shockTest",
        STUMBLE: "stumbleTest",
        FUMBLE: "fumbleTest",
        MORALE: "moraleTest",
        FEAR: "fearTest",
        AFFLICTIONCONTRACT: "contractAfflictionTest",
        AFFLICTIONTRANSMIT: "transmitAffliction",
        AFFLICTIONCOURSE: "courseTest",
        FATIGUE: "fatigueTest",
        TREATMENT: "treatmentTest",
        DIAGNOSIS: "diagnosisTest",
        HEAL: "healingTest",
        BLEEDINGSTOPPAGE: "bleedingStoppageTest",
        BLOODLOSSADVANCE: "bloodlossAdvanceTest",
        OPPOSEDSKILLRESUME: "opposedTestResume",
        RESOLVEIMPACT: "resolveImpact",
    });

    static MOVEMENT_OPTION = Object.freeze({
        STILL: "still",
        MOVING: "moving",
    });

    /** @inheritdoc */
    static metadata = Object.freeze({
        name: "SuccessTestResult",
        label: "SOHL.SUCCESSTESTRESULT.entity",
        labelPlural: "SOHL.SUCCESSTESTRESULT.entityPl",
        testTypes: {
            setImproveFlag: {
                name: "SOHL.SUCCESSTESTRESULT.TESTTYPE.setImproveFlag",
                functionName: "setImproveFlag",
                contextIconClass: "fas fa-star",
                contextCondition: (header) => {
                    header = header instanceof HTMLElement ? header : header[0];
                    const li = header.closest(".item");
                    const item = fromUuidSync(li.dataset.uuid);
                    return (
                        item &&
                        item.system.canImprove &&
                        !item.system.improveFlag
                    );
                },
                contextGroup: SohlContextMenu.SORT_GROUPS.GENERAL,
            },
            unsetImproveFlag: {
                name: "SOHL.SUCCESSTESTRESULT.TESTTYPE.unsetImproveFlag",
                functionName: "unsetImproveFlag",
                contextIconClass: "far fa-star",
                contextCondition: (header) => {
                    header = header instanceof HTMLElement ? header : header[0];
                    const li = header.closest(".item");
                    const item = fromUuidSync(li.dataset.uuid);
                    return (
                        item &&
                        item.system.canImprove &&
                        item.system.improveFlag
                    );
                },
                contextGroup: SohlContextMenu.SORT_GROUPS.GENERAL,
            },
            improveWithSDR: {
                name: "SOHL.SUCCESSTESTRESULT.TESTTYPE.improveWithSDR",
                functionName: "improveWithSDR",
                contextIconClass: "fas fa-star",
                contextCondition: (header) => {
                    header = header instanceof HTMLElement ? header : header[0];
                    const li = header.closest(".item");
                    const item = fromUuidSync(li.dataset.uuid);
                    return item?.system.canImprove && item.system.improveFlag;
                },
                contextGroup: SohlContextMenu.SORT_GROUPS.GENERAL,
            },
            successTest: {
                name: "SOHL.SUCCESSTESTRESULT.TESTTYPE.successTest",
                functionName: "successTest",
                contextIconClass: "fas fa-person",
                contextCondition: (header) => {
                    header = header instanceof HTMLElement ? header : header[0];
                    const li = header.closest(".item");
                    const item = fromUuidSync(li.dataset.uuid);
                    return item && !item.system.$masteryLevel.disabled;
                },
                contextGroup: SohlContextMenu.SORT_GROUPS.ESSENTIAL,
            },
            opposedTestStart: {
                name: "SOHL.SUCCESSTESTRESULT.TESTTYPE.opposedTestStart",
                functionName: "opposedTestStart",
                contextIconClass:
                    "fas fa-arrow-down-left-and-arrow-up-right-to-center",
                contextCondition: (header) => {
                    header = header instanceof HTMLElement ? header : header[0];
                    const li = header.closest(".item");
                    const item = fromUuidSync(li.dataset.uuid);
                    if (!item) return false;
                    const token = item.actor?.getToken();
                    return token && !item.system.$masteryLevel.disabled;
                },
                contextGroup: SohlContextMenu.SORT_GROUPS.ESSENTIAL,
            },
            shockTest: {
                name: "SOHL.SUCCESSTESTRESULT.TESTTYPE.shockTest",
                functionName: "shockTest",
                contextIconClass: "far fa-face-eyes-xmarks",
                contextCondition: true,
                contextGroup: SohlContextMenu.SORT_GROUPS.GENERAL,
            },
            stumbleTest: {
                name: "SOHL.SUCCESSTESTRESULT.TESTTYPE.stumbleTest",
                functionName: "stumbleTest",
                contextIconClass: "far fa-person-falling",
                contextCondition: true,
                contextGroup: SohlContextMenu.SORT_GROUPS.GENERAL,
            },
            fumbleTest: {
                name: "SOHL.SUCCESSTESTRESULT.TESTTYPE.fumbleTest",
                functionName: "fumbleTest",
                contextIconClass: "far fa-ball-pile",
                contextCondition: true,
                contextGroup: SohlContextMenu.SORT_GROUPS.GENERAL,
            },
            moraleTest: {
                name: "SOHL.SUCCESSTESTRESULT.TESTTYPE.moraleTest",
                functionName: "moraleTest",
                contextIconClass: "far fa-people-group",
                contextCondition: true,
                contextGroup: SohlContextMenu.SORT_GROUPS.GENERAL,
            },
            fearTest: {
                name: "SOHL.SUCCESSTESTRESULT.TESTTYPE.fearTest",
                functionName: "fearTest",
                contextIconClass: "far fa-face-scream",
                contextCondition: true,
                contextGroup: SohlContextMenu.SORT_GROUPS.GENERAL,
            },
            transmitAffliction: {
                name: "SOHL.SUCCESSTESTRESULT.TESTTYPE.transmitAffliction",
                functionName: "transmitAffliction",
                contextIconClass: "fas fa-head-side-cough",
                contextCondition: (header) => {
                    header = header instanceof HTMLElement ? header : header[0];
                    const li = header.closest(".item");
                    const item = fromUuidSync(li.dataset.uuid);
                    return item?.system.canTransmit;
                },
                contextGroup: SohlContextMenu.SORT_GROUPS.ESSENTIAL,
            },
            contractAfflictionTest: {
                name: "SOHL.SUCCESSTESTRESULT.TESTTYPE.contractAfflictionTest",
                functionName: "contractAfflictionTest",
                contextIconClass: "fas fa-virus",
                contextCondition: true,
                contextGroup: SohlContextMenu.SORT_GROUPS.GENERAL,
            },
            courseTest: {
                name: "SOHL.SUCCESSTESTRESULT.TESTTYPE.courseTest",
                functionName: "courseTest",
                contextIconClass: "fas fa-heart-pulse",
                contextCondition: (header) => {
                    header = header instanceof HTMLElement ? header : header[0];
                    const li = header.closest(".item");
                    const item = fromUuidSync(li.dataset.uuid);
                    if (item.system.isDormant) return false;
                    const endurance = item?.actor?.getTraitByAbbrev("end");
                    return (
                        endurance && !endurance.system.$masteryLevel.disabled
                    );
                },
                contextGroup: SohlContextMenu.SORT_GROUPS.ESSENTIAL,
            },
            fatigueTest: {
                name: "SOHL.SUCCESSTESTRESULT.TESTTYPE.fatigueTest",
                functionName: "fatigueTest",
                contextIconClass: "fas fa-face-downcast-sweat",
                contextCondition: true,
                contextGroup: SohlContextMenu.SORT_GROUPS.GENERAL,
            },
            treatmentTest: {
                name: "SOHL.SUCCESSTESTRESULT.TESTTYPE.treatmentTest",
                functionName: "treatmentTest",
                contextIconClass: "fas fa-staff-snake",
                contextCondition: (header) => {
                    header = header instanceof HTMLElement ? header : header[0];
                    const li = header.closest(".item");
                    const item = fromUuidSync(li.dataset.uuid);
                    if (item?.system.isBleeding) return false;
                    const physician = item?.actor?.getSkillByAbbrev("pysn");
                    return (
                        physician && !physician.system.$masteryLevel.disabled
                    );
                },
                contextGroup: SohlContextMenu.SORT_GROUPS.ESSENTIAL,
            },
            diagnosisTest: {
                name: "SOHL.SUCCESSTESTRESULT.TESTTYPE.diagnosisTest",
                functionName: "diagnosisTest",
                contextIconClass: "fas fa-stethoscope",
                contextCondition: (header) => {
                    header = header instanceof HTMLElement ? header : header[0];
                    const li = header.closest(".item");
                    const item = fromUuidSync(li.dataset.uuid);
                    return item && !item.system.isTreated;
                },
                contextGroup: SohlContextMenu.SORT_GROUPS.ESSENTIAL,
            },
            healingTest: {
                name: "SOHL.SUCCESSTESTRESULT.TESTTYPE.healingTest",
                functionName: "healingTest",
                contextIconClass: "fas fa-heart-pulse",
                contextCondition: (header) => {
                    header = header instanceof HTMLElement ? header : header[0];
                    const li = header.closest(".item");
                    const item = fromUuidSync(li.dataset.uuid);
                    if (item?.system.isBleeding) return false;
                    const endurance = item?.actor?.getTraitByAbbrev("end");
                    return (
                        endurance && !endurance.system.$masteryLevel.disabled
                    );
                },
                contextGroup: SohlContextMenu.SORT_GROUPS.ESSENTIAL,
            },
            bleedingStoppageTest: {
                name: "SOHL.SUCCESSTESTRESULT.TESTTYPE.bleedingStoppageTest",
                functionName: "bleedingStoppageTest",
                contextIconClass: "fas fa-droplet-slash",
                contextCondition: (header) => {
                    header = header instanceof HTMLElement ? header : header[0];
                    const li = header.closest(".item");
                    const item = fromUuidSync(li.dataset.uuid);
                    if (!item?.system.isBleeding) return false;
                    const physician = item?.actor?.getSkillByAbbrev("pysn");
                    return (
                        physician && !physician.system.$masteryLevel.disabled
                    );
                },
                contextGroup: SohlContextMenu.SORT_GROUPS.ESSENTIAL,
            },
            bloodlossAdvanceTest: {
                name: "SOHL.SUCCESSTESTRESULT.TESTTYPE.bloodlossAdvanceTest",
                functionName: "bloodlossAdvanceTest",
                contextIconClass: "fas fa-droplet",
                contextCondition: (header) => {
                    header = header instanceof HTMLElement ? header : header[0];
                    const li = header.closest(".item");
                    const item = fromUuidSync(li.dataset.uuid);
                    if (!item || !item.system.isBleeding) return false;
                    const strength = item?.actor?.getTraitByAbbrev("str");
                    return strength && !strength.system.$masteryLevel?.disabled;
                },
                contextGroup: SohlContextMenu.SORT_GROUPS.ESSENTIAL,
            },
            opposedTestResume: {
                name: "SOHL.SUCCESSTESTRESULT.TESTTYPE.opposedTestResume",
                functionName: "opposedTestResume",
                contextIconClass: "fas fa-people-arrows",
                contextCondition: false,
                contextGroup: SohlContextMenu.SORT_GROUPS.HIDDEN,
            },
            resolveImpact: {
                name: "SOHL.SUCCESSTESTRESULT.TESTTYPE.resolveImpact",
                functionName: "resolveImpact",
                contextIconClass: "fas fa-person-burst",
                contextCondition: true,
                contextGroup: SohlContextMenu.SORT_GROUPS.GENERAL,
            },
        },
        schemaVersion: "0.5.6",
    });

    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema, {
            mlMod: new fields.EmbeddedDataField(MasteryLevelModifier),
            situationalModifier: new fields.NumberField({
                integer: true,
                initial: 0,
            }),
            roll: new fields.ObjectField(),
            rollMode: new fields.NumberField({
                integer: true,
                nullable: true,
                initial: null,
            }),
            testType: new fields.NumberField({
                integer: true,
                required: true,
                initial: this.TEST_TYPE.SKILL,
                choices: Utility.getChoicesMap(
                    this.TEST_TYPE,
                    "SOHL.SUCCESSTESTRESULT.TESTTYPE",
                ),
            }),
            tokenUuid: new fields.DocumentUUIDField(),
        });
    }

    constructor(data = {}, context = {}) {
        super(data, context);
        if (!data.mlMod) {
            throw new Error("mlMod is required");
        }
    }

    _initialize(options = {}) {
        if (this._source.roll) {
            Object.defineProperty(this, "roll", {
                value: Roll.fromData(this._source.roll),
                writable: false,
            });
        }

        if (!this._source.rollMode) {
            Object.defineProperty(this, "rollMode", {
                value: game.settings.get("core", "rollMode"),
                writable: false,
            });
        }

        super._initialize(options);
        if (this.roll) this.evaluate();
    }

    get resultText() {
        return this._resultText;
    }

    get resultDesc() {
        return this._resultDesc;
    }

    get targetMovement() {
        return this._targetMovement;
    }

    get successLevel() {
        return this._successLevel;
    }

    get description() {
        return this._description;
    }

    get item() {
        return this.mlMod.parent.item;
    }

    get availResponses() {
        const result = [];
        if (this.testType.type === SuccessTestResult.TEST_TYPE.OPPOSEDSKILL) {
            result.push(
                SuccessTestResult.testTypes[
                    SuccessTestResult.TEST_TYPE.OPPOSEDSKILLRESUME
                ],
            );
        }

        return result;
    }

    get normSuccessLevel() {
        let result;
        if (this.isSuccess) {
            if (this.isCritical) {
                result = SuccessTestResult.SUCCESS_LEVEL.CRITICAL_SUCCESS;
            } else {
                result = SuccessTestResult.SUCCESS_LEVEL.MARGINAL_SUCCESS;
            }
        } else {
            if (this.isCritical) {
                result = SuccessTestResult.SUCCESS_LEVEL.CRITICAL_FAILURE;
            } else {
                result = SuccessTestResult.SUCCESS_LEVEL.MARGINAL_FAILURE;
            }
        }
        return result;
    }

    get lastDigit() {
        return this.roll?.total % 10;
    }

    get isCapped() {
        return this.mlMod.effective !== this.mlMod.constrainedEffective;
    }

    get critAllowed() {
        return !!(
            this.mlMod.critSuccessDigits.length ||
            this.mlMod.critFailureDigits.length
        );
    }

    get isCritical() {
        return (
            this.critAllowed &&
            (this.successLevel <=
                SuccessTestResult.SUCCESS_LEVEL.CRITICAL_FAILURE ||
                this.successLevel >=
                    SuccessTestResult.SUCCESS_LEVEL.CRITICAL_SUCCESS)
        );
    }

    get isSuccess() {
        return (
            this.successLevel >=
            SuccessTestResult.SUCCESS_LEVEL.MARGINAL_SUCCESS
        );
    }

    static async createMacroTest(speaker, actor, token, character, scope = {}) {
        let { skipDialog = false, noChat = false, testResult, mlMod } = scope;

        ({ speaker, actor, token, character } = SohlMacro.getExecuteDefaults({
            speaker,
            actor,
            token,
            character,
            needsActor: true,
            self: this,
        }));

        if (testResult) {
            testResult = Utility.JSON_reviver({
                thisArg: mlMod?.parent,
            })("", testResult);
        } else {
            scope.speaker ||= speaker;
            testResult = new this(scope, { parent: mlMod?.parent });
        }
        if (!skipDialog) {
            if (!(await testResult.testDialog())) return null;
        }

        let allowed = testResult.evaluate();

        if (allowed && !noChat) {
            testResult.toChat();
        }

        return allowed ? testResult : false;
    }

    async testDialog(data = {}, callback) {
        foundry.utils.mergeObject(
            data,
            {
                variant: CONFIG.SOHL.id,
                template:
                    "systems/sohl/templates/dialog/standard-test-dialog.html",
                type: this.type,
                title: _l("SOHL.SuccessTestResult.testDialog.title", {
                    name: this.token ? this.token.name : this.actor.name,
                    title: this.title,
                }),
                testType: this._testType,
                mlMod: this.mlMod,
                situationalModifier: this.situationalModifier,
                impactMod: this.impactMod,
                impactSituationalModifier: this.impactSituationalModifier,
                defaultAim: this.defaultAim,
                aimChoices: this.aimChoices,
                targetMovement: this._targetMovement,
                movementOptions:
                    MissileWeaponStrikeModeItemData.movementOptions,
                cxBothOption: this.cxBothOption,
                askCXBothOption: game.settings.get(
                    "sohl",
                    "optionBothOnCounterstrike",
                ),
                rollMode: this.rollMode,
                rollModes: Object.entries(CONFIG.Dice.rollModes).map(
                    ([k, v]) => ({
                        group: "CHAT.RollDefault",
                        value: k,
                        label: v,
                    }),
                ),
            },
            { overwrite: false },
        );
        const dlgHtml = await renderTemplate(data.template, data);

        // Create the dialog window
        return await Dialog.prompt({
            title: data.title,
            content: dlgHtml.trim(),
            label: "SOHL.SuccessTestResult.testDialog.label",
            callback: (element) => {
                const form = element.querySelector("form");
                const fd = new FormDataExtended(form);
                const formData = fd.object;
                const formSituationalModifier =
                    Number.parseInt(formData.situationalModifier, 10) || 0;

                if (formSituationalModifier) {
                    this.mlMod.add(
                        CONFIG.SOHL.MOD.PLAYER,
                        formSituationalModifier,
                    );
                    this.situationalModifier = formSituationalModifier;
                }

                const formSuccessLevelMod = Number.parseInt(
                    formData.successLevelMod,
                    10,
                );
                this.mlMod.successLevelMod = formSuccessLevelMod;
                this.rollMode = formData.rollMode;
                if (data.targetMovement)
                    this._targetMovement = formData.targetMovement;
                if (callback instanceof Function) callback(this, formData);
                return true;
            },
            rejectClose: false,
            options: { jQuery: false },
        });
    }

    async evaluate() {
        let allowed = await super.evaluate();
        if (allowed === false) return false;

        if ((this.token && !this.token.isOwner) || !this.actor?.isOwner) {
            ui.notifications.warn(
                _l("SOHL.SUCCESSTESTRESULT.evaluate.NoPerm", {
                    name: this.token ? this.token.name : this.actor.name,
                }),
            );
            return false;
        }

        if (!this.roll) {
            let rollData;
            if (
                this.mlMod.disabled ||
                this.testType.type === SuccessTestResult.TEST_TYPE.IGNORE
            ) {
                // Ignore tests always return critical failure (Roll = 100)
                rollData = SuccessTestResult.ROLL.CRITICAL_FAILURE.toObject();
            } else if (!this.roll?._evaluated) {
                const roll = await Roll.create("1d100");
                try {
                    await roll.evaluate();
                    rollData = roll.toObject();
                } catch (err) {
                    Hooks.onError("SuccessTestResult#evaluate", err, {
                        msg: _l("SOHL.SuccessTestResult.evaluate.RollFail"),
                        log: "error",
                    });
                    return false;
                }
            }
            this.updateSource(rollData);
        }

        if (this.critAllowed) {
            if (this.roll.total <= this.mlMod.constrainedEffective) {
                if (this.mlMod.critSuccessDigits.includes(this.lastDigit)) {
                    this._successLevel =
                        SuccessTestResult.SUCCESS_LEVEL.CRITICAL_SUCCESS;
                } else {
                    this._successLevel =
                        SuccessTestResult.SUCCESS_LEVEL.MARGINAL_SUCCESS;
                }
            } else {
                if (this.mlMod.critFailureDigits.includes(this.lastDigit)) {
                    this._successLevel =
                        SuccessTestResult.SUCCESS_LEVEL.CRITICAL_FAILURE;
                } else {
                    this._successLevel =
                        SuccessTestResult.SUCCESS_LEVEL.MARGINAL_FAILURE;
                }
            }
        } else {
            if (this.roll.total <= this.mlMod.constrainedEffective) {
                this._successLevel =
                    SuccessTestResult.SUCCESS_LEVEL.MARGINAL_SUCCESS;
            } else {
                this._successLevel =
                    SuccessTestResult.SUCCESS_LEVEL.MARGINAL_FAILURE;
            }
        }

        this._successLevel += this.mlMod.successLevelMod;
        if (!this.critAllowed) {
            this._successLevel = Math.min(
                Math.max(
                    this._successLevel,
                    SuccessTestResult.SUCCESS_LEVEL.MARGINAL_FAILURE,
                ),
                SuccessTestResult.SUCCESS_LEVEL.MARGINAL_SUCCESS,
            );
        }

        if (this.critAllowed) {
            if (this.isCritical) {
                this._description = this.isSuccess
                    ? SuccessTestResult.SUCCESS_TEXT.CRITICAL_SUCCESS
                    : SuccessTestResult.SUCCESS_TEXT.CRITICAL_FAILURE;
            } else {
                this._description = this.isSuccess
                    ? SuccessTestResult.SUCCESS_TEXT.MARGINAL_SUCCESS
                    : SuccessTestResult.SUCCESS_TEXT.MARGINAL_FAILURE;
            }
        } else {
            this._description = this.isSuccess
                ? SuccessTestResult.SUCCESS_TEXT.SUCCESS
                : SuccessTestResult.SUCCESS_TEXT.FAILURE;
        }

        return allowed;
    }

    async toChat(data = {}) {
        foundry.utils.mergeObject(
            data,
            {
                variant: CONFIG.SOHL.id,
                template: "systems/sohl/templates/chat/standard-test-card.html",
                testResultJson: Utility.JSON_stringify(this),
                speaker: this.speaker,
                mlMod: this.mlMod,
                aim: this.aim,
                defaultAim: this.defaultAim,
                item: this.item,
                typeLabel: this.item?.system.constructor.metadata.label,
                roll: this.roll,
                type: this.type,
                title: this.title,
                successValue: this.successValue,
                svBonus: this.svBonus,
                situationalModifier: this.situationalModifier,
                successLevel: this.successLevel,
                isCritical: this.isCritical,
                isSuccess: this.isSuccess,
                resultText: this._resultText,
                resultDesc: this._resultDesc,
                description: this.description,
                rollMode: this.rollMode,
                rollModes: Object.entries(CONFIG.Dice.rollModes).map(
                    ([k, v]) => ({
                        group: "CHAT.RollDefault",
                        value: k,
                        label: v,
                    }),
                ),
            },
            { overwrite: false },
        );

        const chatHtml = await renderTemplate(data.template, data);

        const messageData = {
            user: game.user.id,
            speaker: this.speaker,
            content: chatHtml.trim(),
            sound: CONFIG.sounds.dice,
        };

        ChatMessage.applyRollMode(messageData, this.rollMode);

        // Create a chat message
        return await ChatMessage.create(messageData);
    }
}

export class OpposedTestResult extends TestResult {
    /** @inheritdoc */
    static metadata = Object.freeze({
        name: "OpposedTestResult",
        label: "SOHL.OPPOSEDTESTRESULT.entity",
        labelPlural: "SOHL.OPPOSEDTESTRESULT.entityPl",
        schemaVersion: "0.5.6",
    });

    static TIE_BREAK = Object.freeze({
        SOURCE: 1,
        TARGET: -1,
    });

    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), {
            sourceTestResult: new fields.EmbeddedDataField(SuccessTestResult, {
                nullable: true,
            }),
            targetTestResult: new fields.EmbeddedDataField(SuccessTestResult, {
                nullable: true,
            }),
            targetTokenUuid: new fields.DocumentUUIDField(),
            rollMode: new fields.NumberField({
                integer: true,
                nullable: true,
                initial: null,
            }),
            tieBreak: new fields.NumberField({
                integer: true,
                initial: 0,
            }),
            breakTies: new fields.BooleanField({ initial: false }),
        });
    }

    _initialize(options = {}) {
        super._initialize(options);

        if (this.targetTokenUuid) {
            Object.defineProperty(this, "targetToken", {
                value: this.targetTokenUuid
                    ? fromUuidSync(this.targetTokenUuid)
                    : null,
            });
        }
    }

    constructor(data = {}, context = {}) {
        super(data, context);
        if (!data.sourceTestResult) {
            throw new Error("sourceTestResult must be provided");
        }
        if (!data.targetTokenUuid) {
            throw new Error("Target token UUID must be provided");
        }
    }

    get isTied() {
        return (
            !this.bothFail &&
            this.sourceTestResult.normSuccessLevel ===
                this.targetTestResult.normSuccessLevel
        );
    }

    get bothFail() {
        return (
            !this.sourceTestResult?.isSuccess &&
            !this.targetTestResult?.isSuccess
        );
    }

    get tieBreakOffset() {
        return !this.bothFail ? this.tieBreak : 0;
    }

    get sourceWins() {
        let result = false;
        if (
            typeof this.sourceTestResult === "object" &&
            typeof this.targetTestResult === "object"
        ) {
            result =
                !this.bothFail &&
                this.sourceTestResult.normSuccessLevel >
                    this.targetTestResult.normSuccessLevel;
        }
        return result;
    }

    get targetWins() {
        let result = false;
        if (
            typeof this.sourceTestResult === "object" &&
            typeof this.targetTestResult === "object"
        ) {
            result =
                !this.bothFail &&
                this.sourceTestResult.normSuccessLevel <
                    this.targetTestResult.normSuccessLevel;
        }
        return result;
    }

    async evaluate() {
        if (this.sourceTestResult && this.targetTestResult) {
            let allowed = await super.evaluate();
            allowed &&= !!(await this.sourceTestResult.evaluate());
            allowed &&= !!(await this.targetTestResult.evaluate());
            return allowed;
        } else {
            return false;
        }
    }

    async toChat(data = {}) {
        foundry.utils.mergeObject(
            data,
            {
                variant: CONFIG.SOHL.id,
                template:
                    "systems/sohl/templates/chat/opposed-request-card.html",
                title: _l("SOHL.OpposedTestResult.toChat.title"),
                opposedTestResult: this,
                opposedTestResultJson: Utility.JSON_stringify(this),
                description: _l("SOHL.OpposedTestResult.toChat.description", {
                    targetActorName: this.targetToken.name,
                }),
            },
            { overwrite: false },
        );

        const chatHtml = await renderTemplate(data.template, data);

        const messageData = {
            user: game.user.id,
            speaker: this.speaker,
            content: chatHtml.trim(),
            style: CONST.CHAT_MESSAGE_STYLES.DICE,
        };

        const messageOptions = {};

        // Create a chat message
        return await ChatMessage.create(messageData, messageOptions);
    }
}

export class CombatTestResult extends SuccessTestResult {
    static TEST_TYPE = Object.freeze(
        foundry.utils.mergeObject(super.TEST_TYPE, {
            AUTOCOMBATMELEE: "autoCombatMelee",
            AUTOCOMBATMISSILE: "autoCombatMissile",
            MISSILEATTACK: "missileAttackTest",
            MELEEATTACK: "meleeAttackTest",
            DODGE: "dodgeTest",
            BLOCK: "blockTest",
            COUNTERSTRIKE: "counterstrikeTest",
            DODGEDEFENSE: "dodgeResume",
            BLOCKDEFENSE: "blockResume",
            CXDEFENSE: "counterstrikeResume",
            IGNOREDEFENSE: "ignoreResume",
            CALCIMPACT: "calcImpact",
        }),
    );

    static availResponses = Object.freeze(
        super.availResponses.concat([
            CombatTestResult.TEST_TYPE.BLOCKDEFENSE,
            CombatTestResult.TEST_TYPE.DODGEDEFENSE,
            CombatTestResult.TEST_TYPE.CXDEFENSE,
            CombatTestResult.TEST_TYPE.IGNOREDEFENSE,
        ]),
    );

    /** @inheritdoc */
    static metadata = Object.freeze({
        name: "CombatTestResult",
        label: "SOHL.COMBATTESTRESULT.entity",
        labelPlural: "SOHL.COMBATTESTRESULT.entityPl",
        schemaVersion: "0.5.6",
        testTypes: {
            autoCombatMelee: {
                name: "SOHL.COMBATTESTRESULT.TESTTYPE.autoCombatMelee",
                functionName: "autoCombatMelee",
                contextIconClass: "fas fa-swords",
                contextCondition: (header) => {
                    header = header instanceof HTMLElement ? header : header[0];
                    const li = header.closest(".item");
                    const item = fromUuidSync(li.dataset.uuid);
                    return item && !item.system.$attack.disabled;
                },
                contextGroup: SohlContextMenu.SORT_GROUPS.ESSENTIAL,
            },
            autoCombatMissile: {
                name: "SOHL.COMBATTESTRESULT.TESTTYPE.autoCombatMissile",
                functionName: "autoCombatMissile",
                contextIconClass: "fas fa-bow-arrow",
                contextCondition: (header) => {
                    header = header instanceof HTMLElement ? header : header[0];
                    const li = header.closest(".item");
                    const item = fromUuidSync(li.dataset.uuid);
                    return item && !item.system.$attack.disabled;
                },
                contextGroup: SohlContextMenu.SORT_GROUPS.ESSENTIAL,
            },
            meleeAttackTest: {
                name: "SOHL.COMBATTESTRESULT.TESTTYPE.meleeAttackTest",
                functionName: "meleeAttackTest",
                contextIconClass: "fas fa-sword",
                contextCondition: (header) => {
                    header = header instanceof HTMLElement ? header : header[0];
                    const li = header.closest(".item");
                    const item = fromUuidSync(li.dataset.uuid);
                    return item && !item.system.$attack.disabled;
                },
                contextGroup: SohlContextMenu.SORT_GROUPS.ESSENTIAL,
            },
            missileAttackTest: {
                name: "SOHL.COMBATTESTRESULT.TESTTYPE.missileAttackTest",
                functionName: "missileAttackTest",
                contextIconClass: "fas fa-bow-arrow",
                contextCondition: (header) => {
                    header = header instanceof HTMLElement ? header : header[0];
                    const li = header.closest(".item");
                    const item = fromUuidSync(li.dataset.uuid);
                    return item && !item.system.$attack.disabled;
                },
                contextGroup: SohlContextMenu.SORT_GROUPS.ESSENTIAL,
            },
            blockTest: {
                name: "SOHL.COMBATTESTRESULT.TESTTYPE.blockTest",
                functionName: "blockTest",
                contextIconClass: "fas fa-shield",
                contextCondition: (header) => {
                    header = header instanceof HTMLElement ? header : header[0];
                    const li = header.closest(".item");
                    const item = fromUuidSync(li.dataset.uuid);
                    return item && !item.system.$defense.block.disabled;
                },
                contextGroup: SohlContextMenu.SORT_GROUPS.ESSENTIAL,
            },
            counterstrikeTest: {
                name: "SOHL.COMBATTESTRESULT.TESTTYPE.counterstrikeTest",
                functionName: "counterstrikeTest",
                contextIconClass: "fas fa-circle-half-stroke",
                contextCondition: (header) => {
                    header = header instanceof HTMLElement ? header : header[0];
                    const li = header.closest(".item");
                    const item = fromUuidSync(li.dataset.uuid);
                    return item && !item.system.$defense.counterstrike.disabled;
                },
                contextGroup: SohlContextMenu.SORT_GROUPS.ESSENTIAL,
            },
            blockResume: {
                name: "SOHL.COMBATTESTRESULT.TESTTYPE.blockResume",
                functionName: "blockResume",
                contextIconClass: "fas fa-shield",
                contextCondition: false,
                contextGroup: SohlContextMenu.SORT_GROUPS.HIDDEN,
            },
            dodgeResume: {
                name: "SOHL.COMBATTESTRESULT.TESTTYPE.dodgeResume",
                functionName: "dodgeResume",
                contextIconClass: "fas fa-person-walking-arrow-loop-left",
                contextCondition: false,
                contextGroup: SohlContextMenu.SORT_GROUPS.HIDDEN,
            },
            counterstrikeResume: {
                name: "SOHL.COMBATTESTRESULT.TESTTYPE.counterstrikeResume",
                functionName: "counterstrikeResume",
                contextIconClass: "fas fa-circle-half-stroke",
                contextCondition: false,
                contextGroup: SohlContextMenu.SORT_GROUPS.HIDDEN,
            },
            ignoreResume: {
                name: "SOHL.COMBATTESTRESULT.TESTTYPE.ignoreResume",
                functionName: "ignoreResume",
                contextIconClass: "fas fa-ban",
                contextCondition: false,
                contextGroup: SohlContextMenu.SORT_GROUPS.HIDDEN,
            },
            calcImpact: {
                name: "SOHL.COMBATTESTRESULT.TESTTYPE.calcImpact",
                functionName: "calcImpact",
                contextIconClass: "fas fa-bullseye-arrow",
                contextCondition: (header) => {
                    header = header instanceof HTMLElement ? header : header[0];
                    const li = header.closest(".item");
                    const item = fromUuidSync(li.dataset.uuid);
                    return item && !item.system.$impact.disabled;
                },
                contextGroup: SohlContextMenu.SORT_GROUPS.GENERAL,
            },
        },
    });

    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), {
            impactMod: new fields.EmbeddedDataField(ImpactModifier),
            situationalModifier: new fields.NumberField({
                integer: true,
                initial: 0,
            }),
            deliversImpact: new fields.BooleanField({ initial: false }),
            testFumble: new fields.BooleanField({ initial: false }),
            testStumble: new fields.BooleanField({ initial: false }),
            weaponBreak: new fields.BooleanField({ initial: false }),
        });
    }

    constructor(data = {}, context = {}) {
        super(data, context);
        if (!data.impactMod) {
            throw new Error("impactMod must be specified");
        }
    }

    calcMeleeCombatResult(opposedTestResult) {
        const attacker = opposedTestResult.sourceTestResult;
        const defender = opposedTestResult.targetTestResult;

        this.testFumble =
            this.isCritical && !this.isSuccess && this.lastDigit === 0;
        this.testStumble =
            this.isCritical && !this.isSuccess && this.lastDigit === 5;
        this.deliversImpact = false;

        if (this.testType.type === CombatTestResult.TEST_TYPE.IGNOREDEFENSE) {
            this.testStumble = false;
        }

        switch (this.testType.type) {
            case CombatTestResult.TEST_TYPE.IGNOREDEFENSE:
                defender.testStumble = false;
                defender.testFumble = false;
                if (
                    attacker.successLevel >=
                    SuccessTestResult.SUCCESS_LEVEL.MARGINAL_FAILURE
                ) {
                    opposedTestResult.winner(
                        OpposedTestResult.TIE_BREAK.SOURCE,
                    );
                    attacker.deliversImpact = true;
                }
                break;

            case CombatTestResult.TEST_TYPE.BLOCKDEFENSE:
                if (opposedTestResult.sourceWins) {
                    attacker.deliversImpact = true;
                } else {
                    if (opposedTestResult.isTied)
                        opposedTestResult.winner(
                            OpposedTestResult.TIE_BREAK.TARGET,
                        );
                }
                break;

            case CombatTestResult.TEST_TYPE.CXDEFENSE:
                if (defender.mlMod.has("CXBoth"))
                    if (opposedTestResult.isTied) {
                        if (defender.mlMod.has("CXBoth")) {
                            opposedTestResult.breakTies(true);
                            if (opposedTestResult.targetWins)
                                defender.deliversImpact = true;
                        } else {
                            opposedTestResult.winner(
                                OpposedTestResult.TIE_BREAK.SOURCE,
                            );
                        }
                        attacker.deliversImpact = true;
                    } else if (opposedTestResult.sourceWins) {
                        attacker.deliversImpact = true;
                    } else {
                        defender.deliversImpact = true;
                    }
                break;
        }
    }

    calcDodgeCombatResult(opposedTestResult) {
        const attacker = opposedTestResult.sourceTestResult;
        const defender = opposedTestResult.targetTestResult;

        attacker.deliversImpact = false;
        attacker.testFumble =
            attacker.isCritical &&
            !attacker.isSuccess &&
            attacker.lastDigit === 0;
        attacker.testStumble =
            attacker.isCritical &&
            !attacker.isSuccess &&
            attacker.lastDigit === 5;
        defender.deliversImpact = false;
        defender.testFumble = false;
        defender.testStumble = defender.isCritical && !defender.isSuccess;

        if (opposedTestResult.sourceWins) {
            attacker.deliversImpact = true;
        }
    }

    opposedTestEvaluate(opposedTestResult) {
        super.opposedTestEvaluate(opposedTestResult);
        if (opposedTestResult.targetTestResult === this) {
            if (
                [
                    CombatTestResult.TEST_TYPE.BLOCKDEFENSE,
                    CombatTestResult.TEST_TYPE.CXDEFENSE,
                    CombatTestResult.TEST_TYPE.IGNOREDEFENSE,
                ].includes(opposedTestResult.testType.type)
            ) {
                this.calcMeleeCombatResult(opposedTestResult);
            } else if (
                this.testType.type === CombatTestResult.TEST_TYPE.DODGEDEFENSE
            ) {
                this.calcDodgeCombatResult(opposedTestResult);
            }
        }
        return;
    }

    async testDialog(data = {}, callback) {
        foundry.utils.mergeObject(
            data,
            {
                impactMod: this.impactMod,
                impactSituationalModifier: this.situationalModifier,
                deliversImpact: this.deliversImpact,
                testFumble: this.testFumble,
                testStumble: this.testStumble,
                weaponBreak: this.weaponBreak,
            },
            { overwrite: false },
        );

        return await super.testDialog(data, (thisArg, formData) => {
            const formImpactSituationalModifier =
                Number.parseInt(formData.impactSituationalModifier, 10) || 0;

            if (thisArg.impactMod && formImpactSituationalModifier) {
                thisArg.impactMod.add(
                    CONFIG.SOHL.MOD.PLAYER,
                    formImpactSituationalModifier,
                );
                thisArg.impactSituationalModifier =
                    formImpactSituationalModifier;
            }

            if (callback) callback(this, formData);
        });
    }

    async toChat(data = {}) {
        return super.toChat(
            foundry.utils.mergeObject(
                data,
                {
                    impactSituationalModifier: this.situationalModifier,
                    impactMod: this.impactMod,
                    deliversImpact: this.deliversImpact,
                    testFumble: this.testFumble,
                    testStumble: this.testStumble,
                    weaponBreak: this.weaponBreak,
                },
                { overwrite: false },
            ),
        );
    }
}

export class ImpactResult extends TestResult {
    /** @inheritdoc */
    static metadata = Object.freeze({
        name: "ImpactResult",
        label: "SOHL.IMPACTRESULT.entity",
        labelPlural: "SOHL.IMPACTRESULT.entityPl",
        schemaVersion: "0.5.6",
    });

    get item() {
        return this.impactMod.parent.item;
    }

    constructor(data = {}, context = {}) {
        super(data, context);
        if (!data.impactMod) {
            throw new Error("impactMod is required");
        }
    }

    _initialize(options = {}) {
        if (this._source.roll) {
            Object.defineProperty(this, "roll", {
                value: Roll.fromData(this._source.roll),
                writable: false,
            });
        }

        super._initialize(options);
    }

    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema, {
            impactMod: new fields.EmbeddedDataField(ImpactModifier),
            roll: new fields.ObjectField(),
        });
    }
}

export class SohlItem extends NestableDocumentMixin(Item) {
    /**
     * An object that tracks the changes to the data model which were applied by active effects.
     * See SohlActor.applyActiveEffects() for info on how this is set.
     * @type {object}
     */
    overrides = {};

    _uuid;

    /** @override */
    _configure(options) {
        if (this.parent && !(this.parent instanceof SohlActor)) {
            throw new Error("Parent must always be an instance of SohlActor");
        }

        super._configure(options);

        Object.defineProperty(this, "nestedIn", {
            value: (() => {
                if ([null, undefined].includes(options.nestedIn)) return null;
                if (options.nestedIn instanceof SohlItem)
                    return options.nestedIn;
                throw new Error(
                    "The provided nestedIn must be an SohlItem instance",
                );
            })(),
            writable: false,
            enumerable: false,
        });
    }

    get label() {
        return this.system.label;
    }

    get isVirtual() {
        return !this.isNested && this.actor?.system.virtualItems.get(this.id);
    }

    get fromCompendiumOrWorld() {
        return !!(this.pack || game.items.some((it) => it.id === this.id));
    }

    get permission() {
        if (this.isNested) return this.nestedIn.permission;
        return super.permission();
    }

    get transferredEffects() {
        function getTrxEffects(effects, baseItem) {
            const result = [];
            for (const e of effects) {
                // If the effect's targetType is not the same as this item, ignore it
                if (e.system.targetType !== baseItem.type) continue;
                const isTarget = e.system.targets.some(
                    (t) => t.id === baseItem.id,
                );
                if (isTarget) result.push(e);
            }
            return result;
        }

        if (!this.actor) return [];

        // Collect all of the effects in the actor that target this item
        const result = getTrxEffects(this.actor.effects, this);

        // Search through all the siblings for any effects that are targetting
        // this item.
        for (const sibling of this.actor.allItems()) {
            if (sibling.id === this.id) continue; // Not a sibling, it is this item
            const transferredSiblingEffects = getTrxEffects(
                sibling.effects,
                this,
            );
            result.push(...transferredSiblingEffects);
        }

        return result;
    }

    static defaultName({ type, parent, pack, subType } = {}) {
        const documentName = this.metadata.name;
        let collection;
        if (parent) {
            if (!(parent instanceof SohlActor)) {
                throw new Error("parent must be an actor");
            } else {
                collection = new Collection();
                for (const it of parent.allItems()) {
                    collection.set(it.id, it);
                }
            }
        } else if (pack) {
            collection = game.packs.get(pack);
        } else {
            collection = game.collections.get(documentName);
        }

        const takenNames = new Set();
        for (const document of collection) takenNames.add(document.name);
        let baseName = _l(
            subType
                ? "SOHL.ITEM.defaultName.WithSubType"
                : "SOHL.ITEM.defaultName.NoSubType",
            {
                docLabel: _l(CONFIG.Item.typeLabels[type] || "SOHL.Unknown"),
                subType: _l(
                    CONFIG.Item.subTypeLabels[subType] || "SOHL.Unknown",
                ),
            },
        );
        let name = baseName;
        let index = 1;
        while (takenNames.has(name)) name = `${baseName} (${++index})`;
        return name;
    }

    /**
     * Creates a dialog for creating an item based on the provided data and options.
     *
     * @static
     * @async
     * @param {object} [data={}]
     * @param {object} [options={}]
     * @returns {SohlItem} the new SohlItem described by the dialog
     */
    static async createDialog(
        data = {},
        { parent = null, pack = null, types, nestedIn, ...options } = {},
    ) {
        const cls = this.implementation;

        data = foundry.utils.expandObject(data);

        // Identify allowed types
        let documentTypes = [];
        let defaultType = CONFIG[this.documentName]?.defaultType;
        let defaultTypeAllowed = false;
        // biome-ignore lint/correctness/noUnusedVariables: <explanation>
        let hasTypes = false;
        if (this.TYPES.length > 1) {
            if (types?.length === 0)
                throw new Error(
                    "The array of sub-types to restrict to must not be empty",
                );

            // Register supported types
            for (const type of this.TYPES) {
                if (type === CONST.BASE_DOCUMENT_TYPE) continue;
                if (types && !types.includes(type)) continue;
                if (
                    !nestedIn &&
                    CONFIG[this.documentName]?.dataModels[type]?.nestOnly
                )
                    continue;
                let label =
                    CONFIG[this.documentName]?.typeLabels?.[type] || type;
                label = _l(label);
                documentTypes.push({ value: type, label });
                if (type === defaultType) defaultTypeAllowed = true;
            }
            if (!documentTypes.length)
                throw new Error(
                    "No document types were permitted to be created",
                );

            if (!defaultTypeAllowed) defaultType = documentTypes[0].value;
            // Sort alphabetically
            Utility.sortStrings(documentTypes);
            hasTypes = true;
        }

        let askType =
            !!types || !documentTypes.some((t) => t.value === data.type);

        const itemClassSubtypes = CONFIG.Item.dataModels[defaultType].subTypes;
        let subTypes = itemClassSubtypes
            ? Object.entries(itemClassSubtypes).reduce((ary, [name, value]) => {
                  ary.push({ name, label: value });
                  return ary;
              }, [])
            : [];

        let askSubType =
            askType || !subTypes.some((t) => t.name === data.system?.subType);

        let subType;
        if (subTypes.length) {
            subType = data.system?.subType || subTypes[0]?.name;
        }

        // Identify destination collection
        let collection;
        if (!parent) {
            if (pack) collection = game.packs.get(pack);
            else collection = game.collections.get(this.documentName);
        }

        // Collect data
        const folders = collection?._formatFolderSelectOptions() ?? [];
        const label = _l(this.metadata.label);
        const title = _l("DOCUMENT.Create", { type: label });
        const type = data.type || defaultType;

        const dlgHtml = await renderTemplate(
            "templates/sidebar/document-create.html",
            {
                variant: CONFIG.SOHL.id,
                folders,
                name: data.name,
                defaultName: cls.defaultName({ type, parent, pack, subType }),
                folder: data.folder,
                hasFolders: folders.length >= 1,
                hasTypes: this.hasTypeData,
                type,
                types: documentTypes,
                subType,
                subTypes,
                content: `<div class="form-group" id="subtypes">
            <label>Sub-Types</label>
            <select
                class="resource-value"
                name="subType"
                data-dtype="String">
                {{selectOptions subTypes selected=subType valueAttr="name" labelAttr="label" }}
            </select>
        </div>`,
            },
        );

        return await Dialog.prompt({
            title,
            content: dlgHtml,
            label: title,
            render: (element) => {
                const formTop = element.querySelector("form");
                const fd = new FormDataExtended(formTop);
                const formData = foundry.utils.mergeObject(fd.object, {
                    parent,
                    pack,
                    askType,
                    askSubType,
                });
                SohlItem._handleTypeChange(formTop, formData);
                element
                    .querySelector('[name="type"]')
                    ?.addEventListener("change", (ev) => {
                        formData.type = ev.target.value;
                        SohlItem._handleTypeChange(formTop, formData);
                    });

                element
                    .querySelector('[name="subType"]')
                    ?.addEventListener("change", (ev) => {
                        formData.subType = ev.target.value;
                        SohlItem._handleTypeChange(formTop, formData);
                    });
            },
            callback: (element) => {
                const formTop = element.querySelector("form");
                const fd = new FormDataExtended(formTop);
                const formData = foundry.utils.expandObject(fd.object);
                const formName = formData.name;
                const formType = formData.type || type;
                const formFolder = formData.folder;
                let formSubType = formData.subType || subType;
                formSubType = formSubType?.replace(" selected", "") || "";

                data.name = formName;
                if (!data.name?.trim())
                    data.name = this.defaultName({
                        type: formType,
                        parent: parent,
                        pack: pack,
                        subType: formSubType,
                    });
                if (formFolder) {
                    data.folder = formFolder;
                } else {
                    delete data.folder;
                }

                data.type = formType || type;

                const subTypes = CONFIG.Item.dataModels[data.type].subTypes;
                if (subTypes && Object.keys(subTypes)?.includes(formSubType)) {
                    data["system.subType"] = formSubType;
                }

                return this.implementation.create(data, {
                    parent,
                    pack,
                    nestedIn,
                    renderSheet: true,
                });
            },
            rejectClose: false,
            options: { jQuery: false, ...options },
        });
    }

    /**
     * Handles the type change event for the create item dialog by updating the
     * form elements based on the selected type and subtype options.
     *
     * @static
     * @param {*} formTop
     * @param {object} dlgOptions
     */
    static _handleTypeChange(
        formTop,
        { type, subType, askType, askSubType, parent, pack } = {},
    ) {
        const formSubtypes = formTop.querySelector("#subtypes");
        const formSubtypeSelect = formTop.querySelector('[name="subType"]');
        formTop.elements.type.disabled = !askType;

        // Determine if subtypes exist for this type, and if so, create the subtype dropdown
        const subTypeObj = CONFIG.Item.dataModels[type]?.subTypes;
        if (typeof subTypeObj === "object" && Object.keys(subTypeObj).length) {
            let subTypes = Object.entries(subTypeObj)?.reduce(
                (ary, [name, value]) => {
                    ary.push({ name, label: value });
                    return ary;
                },
                [],
            );

            // Create subtype dropdown
            subType = subTypes.some((t) => t.name === subType)
                ? subType
                : subTypes[0].name;
            formSubtypes.style.visibility = "visible";
            const selectOptions = subTypes.reduce((str, st) => {
                str += `<option value="${st.name}${
                    st.name === subType ? " selected" : ""
                }">${st.label}</option>`;
                return str;
            }, "");
            formSubtypeSelect.innerHTML = selectOptions;
            formTop.elements.subType.value = _l(
                "SOHL.SohlItem._handleTypeChange.subTypeSelected",
                {
                    subType,
                },
            );
            formSubtypeSelect.disabled = !askSubType;
        } else {
            // Hide subtype dropdown if type doesn't support it
            formSubtypes.style.visibility = "hidden";
            subType = "";
        }

        // Update the item name field placeholder
        const nameInput = formTop.querySelector('[name="name"]');
        nameInput.placeholder = this.defaultName({
            type,
            parent,
            pack,
            subType,
        });
    }

    *allApplicableEffects() {
        // Grab all of the effects on this item that affects itself
        const effects = this.effects.filter(
            (e) => e.system.targetType === "this",
        );
        for (const effect of effects) {
            yield effect;
        }

        // Add all of the transferred effects from the items that affect this actor
        for (const effect of this.transferredEffects) {
            yield effect;
        }
    }

    applyActiveEffects() {
        if (!this.actor) return;

        const overrides = {
            [this.id]: {},
        };

        // Organize non-disabled effects by their application priority
        const changes = [];
        for (const effect of this.effects) {
            if (!effect.active) continue;
            const targets = effect.system.targets;
            if (!targets?.length) continue;
            changes.push(
                ...effect.changes.map((change) => {
                    const c = foundry.utils.deepClone(change);
                    c.targets = targets;
                    c.effect = effect;
                    c.priority = c.priority ?? c.mode * 10;
                    return c;
                }),
            );
        }
        changes.sort((a, b) => a.priority - b.priority);

        // Apply all changes
        for (let change of changes) {
            if (!change.key) continue;
            if (!change.targets?.length) continue;
            change.targets.forEach((t) => {
                const changes = change.effect.apply(t, change);
                if (Object.keys(changes).length) {
                    const obj = overrides[t.id];
                    if (typeof obj === "object") {
                        Object.entries(changes).forEach(([k, v]) => {
                            foundry.utils.setProperty(obj, k, v);
                        });
                    } else {
                        overrides[t.id] = changes;
                    }
                }
            });
        }

        // Expand the set of final overrides
        this.overrides = foundry.utils.expandObject(overrides[this.id]);
        for (const it of this.actor.allItems()) {
            if (overrides[it.id])
                it.overrides = foundry.utils.expandObject(overrides[it.id]);
        }
    }

    /**
     * Create a list of updates to the origin of all effects of this item to point to this item
     *
     * @returns an Array of updates
     */
    updateEffectsOrigin() {
        let result = [];

        result = this.effects.reduce((toUpdate, e) => {
            if (e.origin !== this.uuid) {
                const updateData = { _id: e.id, origin: this.uuid };
                return toUpdate.concat(updateData);
            }
            return toUpdate;
        }, result);

        return result;
    }

    async _onSortItem(event, itemData) {
        // Get the drag source and drop target
        const items = this.system.items;
        const source = items.get(itemData._id);
        const dropTarget = event.target.closest("[data-item-id]");
        if (!dropTarget) return;
        const target = items.get(dropTarget.dataset.itemId);

        // Don't sort on yourself
        if (source.id === target.id) return;

        // Identify sibling items based on adjacent HTML elements
        const siblings = [];
        for (let el of dropTarget.parentElement.children) {
            const siblingId = el.dataset.itemId;
            if (siblingId && siblingId !== source.id)
                siblings.push(items.get(el.dataset.itemId));
        }

        // Perform the sort
        const sortUpdates = SortingHelpers.performIntegerSort(source, {
            target,
            siblings,
        });

        const newAry = foundry.utils.deepClone(this.system.nestedItems);

        sortUpdates.forEach((u) => {
            const target = newAry.find((ent) => ent._id === u.target.id);
            target.sort = u.update.sort;
        });

        newAry.sort((a, b) => a.sort - b.sort);

        // Perform the update
        await this.update({ "system.nestedItems": newAry });
    }

    /** @override */
    async _preCreate(data, options, userId) {
        const allowed = await super._preCreate(data, options, userId);
        if (!allowed) return false;

        const updateData = {};
        // Unless specifically overriden, gear and body types have the
        // "transfer" property set to true
        if (data.type.endsWith("gear") || data.type.startsWith("body")) {
            if (foundry.utils.getProperty("system.transfer") === undefined) {
                updateData["system.transfer"] = true;
            }
        }
        this.updateSource(updateData);
        return true;
    }

    /** @override */
    _onCreate(data, options, userId) {
        super._onCreate(data, options, userId);
        const toUpdate = this.updateEffectsOrigin();
        if (toUpdate.length)
            this.updateEmbeddedDocuments("ActiveEffect", toUpdate);
    }

    /** @override */
    get uuid() {
        if (!this._uuid) {
            if (this.nestedIn) {
                // If this is a nested object, we come up with a new UUID format
                // where the nested item is defined with a hash mark
                let parts = [this.nestedIn.uuid, "NestedItem", this.id];
                this._uuid = parts.join("#");
            } else if (this.cause) {
                // If this is a virtual object, but not nested, then the UUID is
                // virtually useless; this is an ephemeral object, and cannot be usefully
                // referred to in any meaningful way.  Nevertheless, to allow for identity,
                // we construct a value that will be unique for this virtual item on this actor.
                // HOWEVER: Note that storing or referring to this ID is problematic, since the
                // _id of pure virtual items changes every time the actor is refreshed.
                let parts = [this.actor.uuid, "VirtualItem", this.id];
                this._uuid = parts.join("#");
            } else {
                this._uuid = super.uuid;
            }
        }

        return this._uuid;
    }

    /**
     * Merge sourceItem into this item. sourceItem and this item must be the same
     * type, have the same name, and if the type has subtypes, must be the same
     * subtype. If type is a gear type, then simply update the quantity instead.
     *
     * @param {SohlItem} this Item that will remain when merge is complete
     * @param {SohlItem} sourceItem Item to merge into destItem
     * @returns {boolean} true if merge succeeded, false otherwise
     */
    async merge(sourceItem, { quantity = 0 } = {}) {
        if (this.id === sourceItem.id) {
            // Cannot merge an item onto itself
            return false;
        }

        if (this.cause && !this.nestedIn) {
            // this is a pure virtual item, no merge allowed
            return false;
        }

        if (this.type !== sourceItem.type) {
            return false;
        }

        if (this.name !== sourceItem.name) {
            return false;
        }

        // Special case of gear: update the quantity
        if (this.system instanceof GearItemData) {
            // If quantity is 0, then move all of the quantity
            if (!quantity) quantity = sourceItem.system.quantity;

            let result = await this.update({
                "system.quantity": this.system.quantity + quantity,
            });
            if (result) {
                const remainingQuantity = sourceItem.system.quantity - quantity;
                if (!remainingQuantity) {
                    await sourceItem.delete();
                } else {
                    result = await sourceItem.update({
                        "system.quantity": remainingQuantity,
                    });
                    return result;
                }
            }
        }

        // If sub-types don't match, then return without change
        if (this.system.subType !== sourceItem.system.subType) {
            return false;
        }

        const updateData = sourceItem.toObject();

        // Remove standard Item fields that should not be updated
        delete updateData._id;
        delete updateData.name;
        delete updateData.type;
        delete updateData.ownership;
        delete updateData._stats;
        delete updateData.sort;

        // Don't change the creation date of the item
        delete updateData.system.createdTime;

        // Only update descriptive data if the fields are currently empty;
        // don't overwrite existing data
        if (updateData.system.subType) delete updateData.system.subType;
        if (this.system.notes) delete updateData.system.notes;
        if (this.system.textReference) delete updateData.system.textReference;
        if (this.system.description) delete updateData.system.description;

        // Only update the image if the new one is not the Default Icon
        if (updateData.img === SohlItem.DEFAULT_ICON) delete updateData.img;

        // Handle Mastery Level Items
        if (sourceItem.system.isMasteryLevelItemData) {
            delete updateData.system.masteryLevelBase;
        }

        // Generally, all fields will be updated.  Depending on the
        // specific type, some fields will be left unchanged.
        switch (sourceItem.type) {
            case MysteryItemData.TYPE_NAME:
                delete updateData.system.charges;
                break;

            case MysticalAbilityItemData.TYPE_NAME:
                delete updateData.system.charges;
                break;

            case AfflictionItemData.TYPE_NAME:
                delete updateData.system.healingRateBase;
                break;

            case TraitItemData.TYPE_NAME:
                if (sourceItem.system.textValue)
                    delete updateData.system.textValue;
                if (sourceItem.system.max) delete updateData.system.max;
                break;

            case BodyPartItemData.TYPE_NAME:
                delete updateData.system.heldItem;
                break;
        }

        const result = await this.update(updateData);
        return !!result;
    }

    getNestedItemById(itemId) {
        let found = this.system.items.get(itemId);
        if (!found && this.system instanceof ContainerGearItemData) {
            for (let it of this.system.items) {
                if (it.system instanceof ContainerGearItemData) {
                    found = it.system.items.get(itemId);
                    if (found) break;
                }
            }
        }

        return found;
    }

    async nestIn(
        nestTarget,
        { quantity = Number.MAX_SAFE_INTEGER, destructive = false } = {},
    ) {
        let newItem = null;
        if (
            !(nestTarget instanceof SohlItem || nestTarget instanceof SohlActor)
        ) {
            throw new Error("Must specify a destination item to nest into");
        }
        if (!quantity) return null;
        destructive &&= !(this.fromCompendiumOrWorld || this.isVirtual);

        const siblings =
            nestTarget instanceof SohlItem
                ? nestTarget.system.items.contents
                : nestTarget.items.contents;
        const similarSibling = siblings.find(
            (it) =>
                it.name === this.name &&
                it.type === this.type &&
                it.system.subType === this.system.subType,
        );

        if (similarSibling) {
            if (this.fromCompendiumOrWorld) {
                /* TODO: Implement refresh items recursively
                // Ask whether to refresh the item from World/Compendium
                const overwrite = await Dialog.confirm({
                    title: "Confirm Overwrite",
                    content: `<p>Overwrite existing ${similarSibling.system.TYPE_LABEL.singlular} ${similarSibling.name}?</p>`,
                    defaultYes: false,
                    options: { jQuery: false },
                });
                */
                ui.notifications.warn(
                    _l("SOHL.SohlItem.nestIn.IdenticalItemWarning", {
                        name: this.name,
                        targetName: nestTarget.name,
                    }),
                );
                return null;
            } else if (similarSibling.id === this.id) {
                // Item already exists here, do nothing
                return null;
            }

            if (this.system instanceof GearItemData) {
                // In the case of gear, which has quantity, we need to consider
                // how many to copy over.
                if (!this.fromCompendiumOrWorld) {
                    // Copy everything unless otherwise specified
                    quantity = Math.max(
                        0,
                        Math.min(this.system.quantity, quantity),
                    );
                    await similarSibling.update({
                        "system.quantity":
                            similarSibling.system.quantity + quantity,
                    });
                    if (destructive) {
                        if (this.system.quantity > quantity) {
                            await this.update({
                                "system.quantity":
                                    this.system.quantity - quantity,
                            });
                        } else {
                            await this.delete();
                        }
                    }
                }
            } else {
                ui.notifications.warn(
                    _l("SOHL.SohlItem.nestIn.IdenticalItemWarning", {
                        name: this.name,
                        targetName: nestTarget.name,
                    }),
                );
                return null;
            }
        } else {
            // Nothing similar exists, so we need to nest a new item
            const newData = this.toObject();
            delete newData._id;

            const createOptions = {
                clean: true,
                nestedIn: nestTarget instanceof SohlItem ? nestTarget : null,
                parent:
                    nestTarget instanceof SohlItem
                        ? nestTarget.actor
                        : nestTarget,
            };

            if (
                this.fromCompendiumOrWorld ||
                !(this.system instanceof GearItemData)
            ) {
                newItem = await this.constructor.create(newData, createOptions);
            } else {
                // Copy all gear unless otherwise specified
                quantity = Math.max(
                    0,
                    Math.min(this.system.quantity, quantity),
                );
                newData.system.quantity = quantity;
                newItem = await this.constructor.create(newData, createOptions);
                if (destructive) {
                    if (this.system.quantity > quantity) {
                        await this.update({
                            "system.quantity": this.system.quantity - quantity,
                        });
                    } else {
                        await this.delete();
                    }
                }
            }
        }

        return newItem;
    }

    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    static async fromDropData(data, options = {}) {
        let document = null;

        // Case 1 - Data explicitly provided
        if (data.data) document = new this(data.data);
        // Case 2 - UUID provided
        else if (data.uuid) document = await fromUuid(data.uuid);

        // Ensure that we retrieved a valid document
        if (!document) {
            throw new Error(
                "Failed to resolve Document from provided DragData. Either data or a UUID must be provided.",
            );
        }
        if (document.documentName !== this.documentName) {
            throw new Error(
                `Invalid Document type '${document.type}' provided to ${this.name}.fromDropData.`,
            );
        }

        // Flag the source UUID
        if (document.id && !document._stats?.compendiumSource) {
            let uuid = document.uuid.split("#").at(0);
            document.updateSource({ "_stats.compendiumSource": uuid });
        }
        return document;
    }

    static _resetIds(data, _i = 0) {
        if (_i > 99) {
            throw new Error("Maximum depth exceeded");
        }
        data._id = foundry.utils.randomID();
        if (data.system?.macros?.length) {
            for (let m of data.system.macros) {
                m._id = foundry.utils.randomID();
            }
        }
        if (data.system?.nestedItems?.length) {
            for (let obj of data.system.nestedItems) {
                SohlItem._resetIds(obj, _i + 1);
            }
        }
        data.effects = data.effects?.map((e) => {
            if (e instanceof ActiveEffect) e = e.toObject();
            e._id = foundry.utils.randomID();
            return e;
        });
    }
}

export class SohlBaseData extends NestableDataModelMixin(
    foundry.abstract.TypeDataModel,
) {
    /**
     * An object containing collections, including macros and nested items
     *
     * @type {object}
     */
    _collections = {};

    static COMPARISON = Object.freeze({
        IDENTICAL: 0,
        SIMILAR: 1,
        DIFFERENT: 2,
    });

    static LOCALIZATION_PREFIXES = ["SOHL.BASEDATA"];

    /** @override */
    static defineSchema() {
        return {
            macros: new fields.ArrayField(new fields.ObjectField()),
        };
    }

    get label() {
        return game.i18n.format("SOHL.BASEDATA.label", {
            name: this.parent.name,
            typeLabel: _l(this.constructor.metadata.label),
        });
    }

    same(other) {
        if (
            this.constructor === other?.constructor &&
            this.macros.length === other.macros.length
        ) {
            // TODO: Compare macros are identical
            return SohlBaseData.comparison.IDENTICAL;
        }
        return SohlBaseData.comparison.DIFFERENT;
    }

    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    getEvent(eventTag) {
        throw new Error("Subclass must define getEvent");
    }

    get created() {
        return this.getEvent(SohlBaseData.EVENT.CREATED)?.system;
    }

    get modified() {
        return this.getEvent(SohlBaseData.EVENT.MODIFIED)?.system;
    }

    get availableFate() {
        return [];
    }

    get actor() {
        if (this.parent instanceof SohlActor) {
            return this.parent;
        } else if (this.parent instanceof SohlItem) {
            return this.parent.actor;
        } else {
            return null;
        }
    }

    async setupActionCache() {
        let ary = [];
        this.macros.forEach((m) => {
            const macro = new SohlMacro(m, {
                nestedIn: this.parent,
                keepId: true,
            });
            if (!macro) {
                console.error(
                    `Failure to create macro ${m.name} on ${this.parent.name}`,
                );
            } else {
                macro.$contextGroup = macro.contextGroup;
                ary.push([macro.id, macro]);
            }
        });

        // Finally, add in the intrinsic actions (unless an action with same
        // name has already been added).  All of these macros will have the
        // flag "flags.sohl.isIntrinsicAction" set to true.
        this.getIntrinsicActions().forEach((intrinsicAction) => {
            if (!ary.some(([, m]) => m.name === intrinsicAction.name)) {
                let contextCondition;
                const condType = typeof intrinsicAction.contextCondition;
                if (intrinsicAction.contextCondition instanceof Function) {
                    contextCondition = intrinsicAction.contextCondition;
                } else if (condType === "boolean") {
                    contextCondition = intrinsicAction.contextCondition;
                } else {
                    contextCondition = false;
                }
                const macro = new SohlMacro(
                    {
                        name: intrinsicAction.name,
                        _id: Utility.createHash16(
                            this.parent.uuid + intrinsicAction.name,
                        ),
                        type: CONST.MACRO_TYPES.SCRIPT,
                        img: "systems/sohl/assets/icons/default-action.svg",
                        flags: {
                            sohl: {
                                notes: "",
                                description: "",
                                params: {},
                                functionName: intrinsicAction.functionName,
                                contextLabel: intrinsicAction.name,
                                contextIconClass:
                                    intrinsicAction.contextIconClass,
                                contextCondition,
                                contextGroup: intrinsicAction.contextGroup,
                                isIntrinsicAction: true,
                                useAsync: intrinsicAction.useAsync !== false,
                            },
                        },
                    },
                    { cause: this.parent },
                );
                macro.$contextGroup = macro.contextGroup;
                ary.push([macro.id, macro]);
            }
        });

        // Only accept the first default, all others set to Primary
        let hasDefault = false;
        ary.forEach(([, macro]) => {
            const isDefault =
                macro.contextGroup === SohlContextMenu.SORT_GROUPS.DEFAULT;
            if (hasDefault) {
                if (isDefault) {
                    macro.$contextGroup = SohlContextMenu.SORT_GROUPS.ESSENTIAL;
                }
            } else {
                hasDefault ||= isDefault;
            }
        });

        const collator = new Intl.Collator(this.lang);
        ary.sort(([, macroA], [, macroB]) => {
            const contextGroupA =
                macroA.$contextGroup || SohlContextMenu.SORT_GROUPS.GENERAL;
            const contextGroupB =
                macroB.$contextGroup || SohlContextMenu.SORT_GROUPS.GENERAL;
            return collator.compare(contextGroupA, contextGroupB);
        });

        // If no default was specified, then make the first element the default
        if (!hasDefault && ary.length) {
            ary[0][1].$contextGroup = SohlContextMenu.SORT_GROUPS.DEFAULT;
        }

        if (this._collections.actions) delete this._collections.actions;
        ary.forEach(([id, macro]) => this.actions.set(id, macro));
    }

    get actions() {
        this._collections.actions ||= new Collection();
        return this._collections.actions;
    }

    get defaultAction() {
        return "";
    }

    /**
     * Returns an array of predefined action descriptors for this item.  These
     * actions are already implemented in code, so they are always available.  These
     * can be specifically overridden by a macro with the same name.
     */
    getIntrinsicActions(_data = this, defaultAction = null, actions = []) {
        defaultAction ||= _data.defaultAction;
        let result = actions.map((a) => {
            if (a.type === defaultAction) {
                a.contextGroup = SohlContextMenu.SORT_GROUPS.DEFAULT;
            } else if (a.contextGroup === SohlContextMenu.SORT_GROUPS.DEFAULT) {
                a.contextGroup = SohlContextMenu.SORT_GROUPS.ESSENTIAL;
            }
            return a;
        });
        return game.i18n.sortObjects(result, "contextGroup");
    }

    get events() {
        const result = [];
        if (this.actor) {
            for (const it of this.actor.allItems()) {
                if (it.system instanceof EventItemData && it.system.started) {
                    // First, get all events targetting this item.
                    if (it.system.$targetUuid === this.uuid) {
                        const evt = {
                            name: it.name,
                            uuid: it.uuid,
                            source: it.nestedIn || this.actor,
                            sourceName:
                                it.nestedIn?.label || this.actor?.label || "",
                            target: this.item,
                            targetName: this.item.label,
                            when: it.system.activation.endTime,
                            remaining: it.system.remainingDuration,
                            oper:
                                EventItemData.operators[
                                    it.system.activation.oper
                                ] || "",
                            actionName: it.system.actionName,
                            item: it,
                        };
                        result.push(evt);
                    }

                    // Next, add any event that are nested in this item.
                    if (
                        it.nestedIn?.uuid === this.uuid &&
                        !Object.hasOwn(it.uuid)
                    ) {
                        const evt = {
                            name: it.name,
                            uuid: it.uuid,
                            source: it.nestedIn || this.actor,
                            sourceName:
                                it.nestedIn?.label || this.actor?.label || "",
                            target: it.system.target,
                            targetName:
                                it.system.target.uuid === it.uuid
                                    ? _l("SOHL.SohlBaseData.events.self")
                                    : it.system.target?.label || "",
                            when: it.system.activation.endTime,
                            remaining: it.system.remainingDuration,
                            oper:
                                EventItemData.operators[
                                    it.system.activation.oper
                                ] || "",
                            actionName: it.system.actionName,
                            item: it,
                        };
                        result.push(evt);
                    }
                }
            }
        }
        return result;
    }

    getDefaultAction(html) {
        const element = html instanceof jQuery ? html[0] : html;

        const contextOptions = this._getContextOptions();
        const defAction = contextOptions.find(
            (co) =>
                co.group === SohlContextMenu.SORT_GROUPS.DEFAULT &&
                (co.condition instanceof Function
                    ? co.condition(element)
                    : co.condition),
        );
        return defAction;
    }

    _getContextOptions() {
        let result = this.actions.reduce((ary, a) => {
            const contextCondition = a.contextCondition;
            let cond = contextCondition;
            if (typeof contextCondition === "string") {
                if (!contextCondition || /^true$/i.test(contextCondition)) {
                    cond = true;
                } else if (/^false$/i.test(contextCondition)) {
                    cond = false;
                } else if (
                    a.$contextGroup === SohlContextMenu.SORT_GROUPS.HIDDEN
                ) {
                    cond = false;
                } else {
                    cond = function (header) {
                        const fn = new Function(
                            "header",
                            `{${contextCondition}}`,
                        );

                        try {
                            return fn.call(header);
                        } catch (err) {
                            Hooks.onError(
                                "SohlBaseData#_getContextOptions",
                                err,
                                {
                                    msg: _l(
                                        "SOHL.SohlBaseData._getContextOptions.ContextConditionError",
                                        {
                                            name: a.name,
                                            parentName: this.parent.name,
                                        },
                                    ),
                                    log: "error",
                                },
                            );
                        }
                    };
                }
            }

            if (cond) {
                const newAction = {
                    name: a.name,
                    icon: `<i class="${a.contextIconClass}${a.contextGroup === SohlContextMenu.SORT_GROUPS.DEFAULT ? " fa-beat-fade" : ""}"></i>`,
                    condition: cond,
                    callback: () => {
                        this.execute(a.name);
                    },
                    group: a.$contextGroup,
                };
                ary.push(newAction);
            }
            return ary;
        }, []);
        return result;
    }

    /**
     * Execute an action.  Executes a macro if available, otherwise executes any
     * default implementation.  Executes synchronously unless otherwise specified.
     *
     * @param {string} actionName Name of the action to perform
     * @param {object} options Execution parameters which are passed to the action
     * @param {boolean} [options.async=false] Whether to execute this action as an async function
     * @param {object[]} [options.scope] additional parameters
     *
     * @returns false if no further processing should occur, undefined if no such
     * action was found on this object, or the value returned by the execution of
     * the action (which may or may not be a promise).
     */
    execute(
        actionName,
        { inPrepareData = false, sync = false, ...scope } = {},
    ) {
        if (!actionName)
            throw new Error("Must provide an actionName to execute()");

        let typeActionHandler =
            CONFIG.SOHL[this.parent.documentName]?.macros[this.parent.type];
        let action = this.actions.find(
            (a) => a.name === actionName || a.functionName === actionName,
        );
        if (action || typeActionHandler) {
            let useAsync = action?.useAsync ?? !!typeActionHandler?.useAsync;
            scope.actionName = actionName;
            scope.self = this;
            scope.inPrepareData = inPrepareData;

            let result;
            if (typeActionHandler) result = typeActionHandler.execute(scope);
            // If the action exists on this item, then process the action
            if (action) {
                if (useAsync) {
                    if (action.useAsync)
                        Promise.resolve(result).then((newResult) => {
                            // If the return from the Type Action Handler is boolean false (not falsy,
                            // but specifically false), then abandon all further processing, and return
                            // false (meaning all ancestors should stop further processing).
                            if (newResult === false) return false;

                            // Otherwise add the return value as the "priorResult" key in the scope,
                            // and execute the local action, returning the result.
                            scope.priorResult = newResult;

                            // This is going to return a promise
                            return action.execute(scope);
                        });
                } else {
                    // If the return from the Type Action Handler is boolean false (not falsy,
                    // but specifically false), then abandon all further processing, and return
                    // false (meaning all ancestors should stop further processing).
                    if (result === false) return false;

                    // Otherwise add the return value as the "priorResult" key in the scope,
                    // and execute the local action, returning the result.
                    scope.priorResult = result;

                    // This is going to return a direct value, not a promise.
                    return action.execute(scope);
                }
            }

            return result;
        }

        return;
    }

    prepareBaseData() {
        super.prepareBaseData();
        this.setupActionCache();
    }
}

export class SohlActorData extends SohlBaseData {
    /**
     * Virtual items either inherited or synthesized
     *
     * @type {Collection}
     */
    #virtualItems;

    /**
     * Represents the weight of gear being carried by an actor.
     *
     * @type {ValueModifier}
     */
    $gearWeight;

    /**
     * Indicates whether the setup process has been completed.
     *
     * @type {boolean}
     */
    $isSetup;

    $initiativeRank;

    static metadata = Object.freeze({
        img: "icons/svg/item-bag.svg",
        sheet: "systems/sohl/templates/actor/actor-sheet.html",
    });

    static get parentDocumentClass() {
        return SohlActor;
    }

    get virtualItems() {
        if (!this.#virtualItems) this.#virtualItems = new Collection();
        return this.#virtualItems;
    }

    get initiativeRank() {
        return this.$initiativeRank;
    }

    getEvent(eventTag) {
        return this.actor.items.find(
            (it) =>
                it.system instanceof EventItemData &&
                it.system.tag === eventTag,
        );
    }

    /** @override */
    static defineSchema() {
        if (!this._sohlDataSchema) {
            this._sohlDataSchema = foundry.utils.mergeObject(
                super.defineSchema(),
                {
                    bioImage: new fields.FilePathField({
                        categories: ["IMAGE"],
                        initial: CONST.DEFAULT_TOKEN,
                    }),
                    description: new fields.HTMLField(),
                    biography: new fields.HTMLField(),
                },
            );
        }
        return this._sohlDataSchema;
    }

    /** @override */
    prepareBaseData() {
        // The maximum weights here are totally arbitrary.  To get reasonable values,
        // it is expected for the actor to have a "capacity" trait that sets these
        // values correctly.
        class GearWeightModifier extends CONFIG.SOHL.class.ValueModifier {
            static defineSchema() {
                return foundry.utils.mergeObject(super.defineSchema(), {
                    maxFight: new fields.NumberField({
                        integer: true,
                        nullable: false,
                        min: 0,
                        initial: 50,
                    }),
                    max: new fields.NumberField({
                        integer: true,
                        nullable: false,
                        min: 0,
                        initial: 75,
                    }),
                    value: new SohlFunctionField({
                        initial: (thisVM) => {
                            return Math.round(thisVM.effective * 1000) / 1000;
                        },
                    }),
                    status: new SohlFunctionField({
                        initial: (thisVM) => {
                            if (thisVM.effective > thisVM.max.effective)
                                return ContainerGearItemData.status
                                    .OverCapacity;
                            else if (
                                thisVM.effective > thisVM.maxFight.effective
                            )
                                return ContainerGearItemData.status
                                    .OverFightCapacity;
                            else return ContainerGearItemData.status.Ok;
                        },
                    }),
                });
            }
        }

        super.prepareBaseData();
        this.$initiativeRank = 0;
        this.$collection = new Collection();
        this.$gearWeight = new GearWeightModifier({}, { parent: this });
        this.$magicMod = {};
    }

    checkExpired() {
        for (const it of this.actor.allItems()) {
            it.system.checkExpired();
        }
    }
}

export class SohlItemData extends SohlBaseData {
    static ACTION_TYPE = Object.freeze({
        EDIT: "editItem",
        DELETE: "deleteItem",
        SHOWDESC: "showDescription",
        SETUPVIRTUALITEMS: "setupVirtualItems",
        PROCESSSIBLINGS: "processSiblings",
        POSTPROCESS: "postProcess",
    });

    /** @inheritdoc */
    static metadata = Object.freeze(
        foundry.utils.mergeObject(
            super.metadata,
            {
                name: "",
                label: "",
                labelPlural: "",
                img: "",
                iconCssClass: "",
                sheet: "systems/sohl/templates/item/item-sheet.html",
                nestOnly: false,
                defaultAction: SohlItemData.ACTION_TYPE.EDIT,
                actionTypes: Object.fromEntries(
                    [
                        {
                            type: SohlItemData.ACTION_TYPE.EDIT,
                            contextIconClass: "fas fa-edit",
                            contextCondition: (header) => {
                                header =
                                    header instanceof HTMLElement
                                        ? header
                                        : header[0];
                                const li = header.closest(".item");
                                const item = fromUuidSync(li.dataset.uuid);
                                if (item.actor?.isOwner || item.isOwner)
                                    return true;
                            },
                            contextGroup: SohlContextMenu.SORT_GROUPS.GENERAL,
                        },
                        {
                            type: SohlItemData.ACTION_TYPE.DELETE,
                            contextIconClass: "fas fa-trash",
                            contextCondition: (header) => {
                                header =
                                    header instanceof HTMLElement
                                        ? header
                                        : header[0];
                                const li = header.closest(".item");
                                const item = fromUuidSync(li.dataset.uuid);
                                if (item.actor?.isOwner || item.isOwner)
                                    return true;
                            },
                            contextGroup: SohlContextMenu.SORT_GROUPS.GENERAL,
                        },
                        {
                            type: SohlItemData.ACTION_TYPE.SHOWDESC,
                            contextIconClass: "fas fa-scroll",
                            contextCondition: (header) => {
                                header =
                                    header instanceof HTMLElement
                                        ? header
                                        : header[0];
                                const li = header.closest(".item");
                                const item = fromUuidSync(li.dataset.uuid);
                                if (!item) return false;
                                return (
                                    item &&
                                    (item.system.description ||
                                        item.system.notes ||
                                        item.system.textReference)
                                );
                            },
                            contextGroup: SohlContextMenu.SORT_GROUPS.GENERAL,
                        },
                        {
                            type: SohlItemData.ACTION_TYPE.SETUPVIRTUALITEMS,
                            contextIconClass: "far fa-gears",
                            contextCondition: false,
                            contextGroup: SohlContextMenu.SORT_GROUPS.HIDDEN,
                            useAsync: false,
                        },
                        {
                            type: SohlItemData.ACTION_TYPE.PROCESSSIBLINGS,
                            contextIconClass: "far fa-gears",
                            contextCondition: false,
                            contextGroup: SohlContextMenu.SORT_GROUPS.HIDDEN,
                            useAsync: false,
                        },
                        {
                            type: SohlItemData.ACTION_TYPE.PROCESSSIBLINGS,
                            contextIconClass: "far fa-gears",
                            contextCondition: false,
                            contextGroup: SohlContextMenu.SORT_GROUPS.HIDDEN,
                            useAsync: false,
                        },
                    ].map((t) => [
                        t.type,
                        foundry.utils.mergeObject(
                            t,
                            {
                                functionName: t.type,
                                name: `SOHL.ITEMDATA.actionTypes.${t.type}`,
                            },
                            { inplace: false },
                        ),
                    ]),
                ),
                schemaVersion: "0.6.5",
            },
            { inplace: false },
        ),
    );

    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), {
            notes: new fields.StringField(),
            description: new fields.HTMLField(),
            textReference: new fields.StringField(),
            items: new fields.EmbeddedCollectionField(SohlItem),
            transfer: new fields.BooleanField({ initial: false }),
        });
    }

    static get parentDocumentClass() {
        return SohlItem;
    }

    getEvent(eventTag) {
        return this.items.find(
            (it) =>
                it.system instanceof EventItemData &&
                it.system.tag === eventTag,
        );
    }

    get containers() {
        const result = this.items.reduce((ary, ei) => {
            if (ei.system instanceof ContainerGearItemData) {
                ary.push(ei);
            }
            return ary;
        }, []);
        return result;
    }

    /**
     * Returns the collection of nested, but not active, items.
     * These items do not get processed by prepareData(). These are
     * not yet true items; in order to get processed, these items must
     * be copied to the SohlActor#virtualItems collection prior to processing
     * the nested collections.
     *
     * For example, the GearItemData#prepareBaseData method will copy all
     * of the "gear" items to the SohlActor#virtualItems collection so they get
     * processed.  Similar actions occur with other items.
     */
    get items() {
        this._collections.items ||= new Collection();
        return this._collections.items;
    }

    get item() {
        if (this.parent instanceof SohlItem) {
            return this.parent;
        }
        throw new Error(
            `Invalid SohlItemData: must be associated with an SohlItem parent`,
        );
    }

    /** @override */
    get actor() {
        return this.item.actor;
    }

    get id() {
        return this.item.id;
    }

    get name() {
        return this.item.name;
    }

    get img() {
        return this.item.img;
    }

    get uuid() {
        return this.item.uuid;
    }

    get transferToActor() {
        return this.transfer;
    }

    same(other) {
        let result = super.same(other);
        if (result === SohlBaseData.comparison.DIFFERENT) return result;
        if (
            this.notes === other.notes &&
            this.description === other.description &&
            this.textReference === other.textReference &&
            this.transfer === other.transfer &&
            this.nestedItems.length === other.nestedItems.length
        ) {
            // TODO: Check that each nestedItem is identical
            return result;
        }
        return SohlBaseData.comparison.DIFFERENT;
    }

    /** @override */
    // FIXME biome-ignore lint/correctness/noUnusedVariables: <explanation>
    async _preCreate(data, options, userId) {
        super._preCreate(data, options, userId);
        return true;
    }

    async deleteItem() {
        // Create the dialog window
        const agree = await Dialog.confirm({
            title:
                this instanceof ContainerGearItemData
                    ? "SOHL.ITEMDATA.deleteItem.Container.title"
                    : "SOHL.ITEMDATA.deleteItem.NonContainer.title",
            content:
                this instanceof ContainerGearItemData
                    ? "SOHL.ITEMDATA.deleteItem.Container.queryHtml"
                    : "SOHL.ITEMDATA.deleteItem.NonContainer.queryHtml",
            yes: () => true,
        });

        if (agree) {
            await this.item.delete();
        }
    }

    async editItem() {
        await this.item.sheet.render(true);
    }

    getIntrinsicActions(_data = this, defaultAction = null, actions = []) {
        return super.getIntrinsicActions(
            _data,
            defaultAction,
            Utility.uniqueActions(
                actions,
                [
                    SohlItemData.ACTION_TYPE.EDIT,
                    SohlItemData.ACTION_TYPE.DELETE,
                    SohlItemData.ACTION_TYPE.SHOWDESC,
                    SohlItemData.ACTION_TYPE.SETUPVIRTUALITEMS,
                    SohlItemData.ACTION_TYPE.PROCESSSIBLINGS,
                    SohlItemData.ACTION_TYPE.POSTPROCESS,
                ].map((a) => SohlItemData.metadata.actionTypes[a]),
            ),
        );
    }

    async showDescription() {
        const chatData = {
            variant: CONFIG.SOHL.id,
            name: this.item.name,
            subtitle: this.label,
            level: this.$level.effective,
            desc: this.description,
            notes: this.notes,
            textRef: this.item.system.textReference,
        };

        const chatTemplate = "systems/sohl/templates/chat/item-desc-card.html";

        const chatHtml = await renderTemplate(chatTemplate, chatData);

        const messageData = {
            user: game.user.id,
            speaker: ChatMessage.getSpeaker(),
            content: chatHtml.trim(),
            sound: CONFIG.sounds.notification,
        };

        // Create a chat message
        return ChatMessage.create(messageData);
    }

    _preSuccessTestDialog(scope) {
        scope.rollMode ??= game.settings.get("core", "rollMode");
        scope.typeLabel ??= _l(this.constructor.metadata.label);
        scope.situationalModifier ??= 0;

        if (scope.testResult) {
            scope.testResult = Utility.JSON_reviver({
                thisArg: this,
            })("", scope.testResult);
        } else {
            if (!scope.mlMod)
                throw new Error("Must specify either testResult or mlMod");
            scope.testResult = new CONFIG.SOHL.class.SuccessTestResult(scope, {
                parent: this,
            });
        }

        const sitMod = scope.testResult.mlMod.get(
            SohlBaseData.MODS.PLAYER.abbrev,
        );

        if (sitMod?.op === ValueModifier.OPERATOR.ADD) {
            scope.testResult.situationalModifier = sitMod.value;
            scope.testResult.mlMod.delete(sitMod.abbrev);
        }

        const impSitMod = scope.testResult.impactMod?.get(
            SohlBaseData.MODS.PLAYER.abbrev,
        );

        if (impSitMod?.op === ValueModifier.OPERATOR.ADD) {
            scope.testResult.impactSituationalModifier = impSitMod.value;
            scope.testResult.impactMod.delete(impSitMod.abbrev);
        }

        return scope.testResult;
    }

    _postSuccessTestDialog(testResult, dlgResult) {
        if (dlgResult.situationalModifier) {
            testResult.mlMod.add(
                CONFIG.SOHL.MOD.PLAYER,
                dlgResult.situationalModifier,
            );
        }

        testResult.mlMod.successLevelMod = dlgResult.successLevelMod;

        if (dlgResult.impactSituationalModifier) {
            testResult.impactMod.add(
                CONFIG.SOHL.MOD.PLAYER,
                dlgResult.impactSituationalModifier,
            );
        }

        return testResult;
    }

    /**
     * Perform Success Test for this Item
     *
     * @param {object} options
     * @returns {SuccessTestChatData}
     */
    async successTest(speaker, actor, token, character, scope = {}) {
        let { skipDialog = false, noChat = false, testResult } = scope;

        ({ speaker, actor, token, character } = SohlMacro.getExecuteDefaults({
            speaker,
            actor,
            token,
            character,
            needsActor: true,
            self: this,
        }));

        scope.speaker ||= speaker;
        testResult = this._preSuccessTestDialog(scope);

        let dlgResult = null;
        if (!skipDialog) {
            // Render modal dialog
            let dlgTemplate =
                "systems/sohl/templates/dialog/standard-test-dialog.html";

            let { ...dialogData } = testResult;
            foundry.utils.mergeObject(dialogData, {
                variant: CONFIG.SOHL.id,
                title: `${this.actor.token ? this.actor.token.name : this.actor.name} ${testResult.title}`,
                rollModes: Object.entries(CONFIG.Dice.rollModes).map(
                    ([k, v]) => ({
                        group: "CHAT.RollDefault",
                        value: k,
                        label: v,
                    }),
                ),
            });
            const dlgHtml = await renderTemplate(dlgTemplate, dialogData);

            // Create the dialog window
            dlgResult = await Dialog.prompt({
                title: dialogData.title,
                content: dlgHtml.trim(),
                label: "Roll",
                callback: (element) => {
                    const form = element.querySelector("form");
                    const fd = new FormDataExtended(form);
                    const formData = fd.object;
                    return formData;
                },
                rejectClose: false,
                options: { jQuery: false },
            });

            if (!dlgResult) return false;
        }

        testResult = this._postSuccessTestDialog(testResult, dlgResult);

        let allowed = await testResult.evaluate();

        if (allowed && !noChat) {
            await testResult.toChat();
        }
        return allowed ? testResult : false;
    }

    /**
     * Prepare base data processing.  Cannot assume the actor exists or
     * has been setup.
     */
    prepareBaseData() {
        super.prepareBaseData();

        // Construct Nested Collection
        if (this._collections.items) delete this._collections.items;
        this.nestedItems
            .toSorted((a, b) => a.sort - b.sort)
            .forEach((ni) => {
                const ignore =
                    [
                        ProtectionItemData.metadata.name,
                        MeleeWeaponStrikeModeItemData.metadata.name,
                        MissileWeaponStrikeModeItemData.metadata.name,
                        CombatTechniqueStrikeModeItemData.metadata.name,
                    ].includes(ni.type) && ni.system.subType !== CONFIG.SOHL.id;

                if (!ignore) {
                    const data = foundry.utils.deepClone(ni);
                    const uuid = this.item.uuid;
                    data.effects?.forEach((e) => {
                        e.origin = uuid;
                    });
                    if (!data.ownership) {
                        data.ownership = {
                            default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER,
                        };
                    }
                    const item = new SohlItem(data, {
                        nestedIn: this.item,
                        keepId: true,
                    });
                    if (!item) {
                        console.error(
                            `Failure to create item ${ni.name} on ${this.nestedIn.name}`,
                        );
                    } else {
                        this.items.set(item.id, item);
                    }
                }
            });
    }

    /**
     * This method is the only place where it is safe to create new virtual items.
     * It runs after prepareDerivedData() has completed, and is only run for items
     * that are "owned" items or virtual items.
     *
     * The return value is the set of new items that were added to the Virtual Items list.
     */
    setupVirtualItems() {
        this.items.forEach((it) => {
            // Add all enabled events to the virtual items list
            if (it.system instanceof EventItemData) {
                if (it.system.isEnabled) {
                    if (!it.cause) {
                        it.cause = this.item;
                    }
                } else {
                    if (
                        !it.system.activation.enabled &&
                        it.system.activation.autoStart !== "never"
                    ) {
                        it.system.start();
                        it.cause = this.item;
                    }
                }
            } else if (
                it.system.transferToActor ||
                (it.system instanceof GearItemData &&
                    it.nestedIn?.system instanceof ContainerGearItemData)
            ) {
                it.cause = this.item;
            }
        });
    }

    /**
     * Perform processing requiring access to siblings.  It is safe to access
     * other virtual and nested items of the actor at this point.
     */
    processSiblings() {
        // Subclass provide implementation
        return;
    }

    /**
     * Final processing after all derived data has been calculated, and all
     * items have been setup.  It is safe to access other items of the actor
     * at this point.
     */
    postProcess() {
        // Subclass provide implementation
        return;
    }

    /**
     * Perform processing to check whether timers have expired
     */
    checkExpired() {
        // Subclass provide implementation
        return;
    }
}

export class AnimateEntityActorData extends SohlActorData {
    /**
     * Represents the health of a entity.
     *
     * @type {ValueModifier}
     */
    $health;

    /**
     * Represents the base healing rate
     */
    $healingBase;

    /**
     * Represents the sum of all zones.
     *
     * @type {number}
     */
    $zoneSum;

    /**
     * Represents the base body weight of a entity without any gear
     *
     * @type {ValueModifier}
     */
    $bodyWeight;

    /**
     * Represents the level of shock the character is experiencing.
     *
     * @type {number}
     */
    $shockState;

    $fate;

    $engagedOpponents;

    $domains;

    $magicMod;

    /** @inheritdoc */
    static metadata = Object.freeze(
        foundry.utils.mergeObject(
            super.metadata,
            {
                name: "entity",
                locId: "ENTITY",
                iconCssClass: "fas fa-person",
                label: "TYPES.Actor.entity",
                labelPlural: "TYPES.Actor.entityPl",
                img: "icons/svg/item-bag.svg",
                sheet: "systems/sohl/templates/actor/actor-sheet.html",
                effectKeys: {
                    "mod:system.$engagedOpponents": {
                        label: "SOHL.ENTITY.effectKeys.engagedOpponents",
                        abbrev: "EngOpp",
                    },
                },
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    getIntrinsicActions(_data = this, defaultAction = null, actions = []) {
        return super.getIntrinsicActions(
            _data,
            defaultAction,
            Utility.uniqueActions(
                actions,
                [
                    SuccessTestResult.TEST_TYPE.IMPROVESDR,
                    SuccessTestResult.TEST_TYPE.SKILL,
                    SuccessTestResult.TEST_TYPE.SHOCK,
                    SuccessTestResult.TEST_TYPE.STUMBLE,
                    SuccessTestResult.TEST_TYPE.FUMBLE,
                    SuccessTestResult.TEST_TYPE.MORALE,
                    SuccessTestResult.TEST_TYPE.FEAR,
                    SuccessTestResult.TEST_TYPE.AFFLICTIONCONTRACT,
                    SuccessTestResult.TEST_TYPE.FATIGUE,
                    SuccessTestResult.TEST_TYPE.AFFLICTIONCOURSE,
                    SuccessTestResult.TEST_TYPE.TREATMENT,
                    SuccessTestResult.TEST_TYPE.DIAGNOSIS,
                    SuccessTestResult.TEST_TYPE.HEAL,
                    SuccessTestResult.TEST_TYPE.BLEEDINGSTOPPAGE,
                    SuccessTestResult.TEST_TYPE.BLOODLOSSADVANCE,
                ].map((a) => SuccessTestResult.testTypes[a]),
            ),
        );
    }

    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    async improveWithSDR(speaker, actor, token, character, scope = {}) {
        return;
    }

    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    async successTest(speaker, actor, token, character, scope = {}) {
        return;
    }

    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    async fatigueTest(speaker, actor, token, character, scope = {}) {
        return;
    }

    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    async courseTest(speaker, actor, token, character, scope = {}) {
        return;
    }

    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    async treatmentTest(speaker, actor, token, character, scope = {}) {
        return;
    }

    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    async diagnosisTest(speaker, actor, token, character, scope = {}) {
        return;
    }

    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    async healingTest(speaker, actor, token, character, scope = {}) {
        return;
    }

    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    async bleedingStoppageTest(speaker, actor, token, character, scope = {}) {
        return;
    }

    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    async bloodLossAdvanceTest(speaker, actor, token, character, scope = {}) {
        return;
    }

    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    async calcImpact(speaker, actor, token, character, scope = {}) {
        let { impactResult, itemId } = scope;
        if (!(impactResult instanceof ImpactResult)) {
            if (!itemId) {
                throw new Error("must provide either impactResult or itemId");
            }
            const item = this.actor.getItem(itemId, {
                types: [
                    MeleeWeaponStrikeModeItemData.TYPE_NAME,
                    MissileWeaponStrikeModeItemData.TYPE_NAME,
                    CombatTechniqueStrikeModeItemData.TYPE_NAME,
                ],
            });
            impactResult = Utility.JSON_reviver({
                thisArg: item.system,
            })("", impactResult);
        }
        return impactResult.item?.system.execute("calcImpact", {
            impactResult,
        });
    }

    async shockTest(speaker, actor, token, character, scope = {}) {
        let { testResult } = scope;
        ({ speaker, actor, token, character } = SohlMacro.getExecuteDefaults({
            speaker,
            actor,
            token,
            character,
            needsActor: true,
            self: this,
        }));

        if (!testResult) {
            const shockSkill = this.actor.getItem("shk", { types: ["skill"] });
            if (!shockSkill) return null;
            testResult = new CONFIG.SOHL.class.SuccessTestResult(
                {
                    speaker,
                    testType: SuccessTestResult.TEST_TYPE.SHOCK,
                    mlMod: Utility.deepClone(shockSkill.system.$masteryLevel),
                },
                { parent: shockSkill.system },
            );
            // For the shock test, the test should not include the impairment penalty
            testResult.mlMod.delete("BPImp");
        }

        testResult = testResult.item.system.successTest(scope);

        testResult.shockMod = 1 - testResult.successLevel;
        return testResult;
    }

    async stumbleTest(speaker, actor, token, character, scope = {}) {
        ({ speaker, actor, token, character } = SohlMacro.getExecuteDefaults({
            speaker,
            actor,
            token,
            character,
            needsActor: true,
            self: this,
        }));

        if (!scope.testResult) {
            const agility = this.actor.getItem("agl", { types: ["trait"] });
            const acrobatics = this.actor.getItem("acro", { types: ["skill"] });
            const item =
                agility?.system.$masteryLevel.effective >
                acrobatics?.system.$masteryLevel.effective
                    ? agility
                    : acrobatics;
            if (!item) return null;

            scope.testResult = new CONFIG.SOHL.class.SuccessTestResult(
                {
                    speaker,
                    testType: SuccessTestResult.TEST_TYPE.STUMBLE,
                    mlMod: Utility.deepClone(item.system.$masteryLevel),
                },
                { parent: item.system },
            );
        }

        return scope.testResult.item.system.successTest(scope);
    }

    async fumbleTest(speaker, actor, token, character, scope = {}) {
        ({ speaker, actor, token, character } = SohlMacro.getExecuteDefaults({
            speaker,
            actor,
            token,
            character,
            needsActor: true,
            self: this,
        }));

        if (!scope.testResult) {
            const dexterity = this.actor.getItem("dex", { types: ["trait"] });
            const legerdemain = this.actor.getItem("lgdm", {
                types: ["skill"],
            });
            const item =
                dexterity?.system.$masteryLevel.effective >
                legerdemain?.system.$masteryLevel.effective
                    ? dexterity
                    : legerdemain;
            if (!item) return null;

            scope.testResult = new CONFIG.SOHL.class.SuccessTestResult(
                {
                    speaker,
                    testType: SuccessTestResult.TEST_TYPE.FUMBLE,
                    mlMod: Utility.deepClone(item.system.$masteryLevel),
                },
                { parent: item.system },
            );
        }

        return scope.testResult.item.system.successTest(scope);
    }

    async moraleTest(speaker, actor, token, character, scope = {}) {
        ({ speaker, actor, token, character } = SohlMacro.getExecuteDefaults({
            speaker,
            actor,
            token,
            character,
            needsActor: true,
            self: this,
        }));

        if (!scope.testResult) {
            const initSkill = this.actor.getItem("init", { types: ["skill"] });
            if (!initSkill) return null;
            scope.testResult = new CONFIG.SOHL.class.SuccessTestResult(
                {
                    speaker,
                    testType: SuccessTestResult.TEST_TYPE.MORALE,
                    mlMod: Utility.deepClone(initSkill.system.$masteryLevel),
                },
                { parent: initSkill.system },
            );
        }

        scope.testResult = scope.testResult.item.system.successTest(scope);
        return this._createTestItem(scope);
    }

    async fearTest(speaker, actor, token, character, scope = {}) {
        ({ speaker, actor, token, character } = SohlMacro.getExecuteDefaults({
            speaker,
            actor,
            token,
            character,
            needsActor: true,
            self: this,
        }));

        if (!scope.testResult) {
            const initSkill = this.actor.getItem("init", { types: ["skill"] });
            if (!initSkill) return null;
            scope.testResult = new CONFIG.SOHL.class.SuccessTestResult(
                {
                    speaker,
                    testType: SuccessTestResult.TEST_TYPE.FEAR,
                    mlMod: Utility.deepClone(initSkill.system.$masteryLevel),
                },
                { parent: initSkill.system },
            );
        }

        scope.testResult = scope.testResult.item.system.successTest(scope);
        return this._createTestItem(scope);
    }

    async _createTestItem(scope) {
        let createItem = game.settings.get("sohl", "recordTrauma");
        if (!scope.testResult.isSuccess && createItem !== "disable") {
            if (createItem === "ask") {
                createItem = await Dialog.confirm({
                    title: _l(
                        "SOHL.Actor.entity._createTestItem.dialog.title",
                        {
                            label: scope.testResult.item.label,
                        },
                    ),
                    content: _l(
                        "SOHL.Actor.entity._createTestItem.dialog.content",
                        {
                            label: scope.testResult.item.label,
                            name: this.name,
                        },
                    ),
                    yes: () => {
                        return "enable";
                    },
                });
            }

            if (createItem === "enable") {
                await SohlItem.create(scope.testResult.item.toObject(), {
                    parent: this.item,
                    clean: true,
                });
            }
        }
        return scope.testResult;
    }

    async contractAfflictionTest(speaker, actor, token, character, scope = {}) {
        let { afflictionObj } = scope;
        ({ speaker, actor, token, character } = SohlMacro.getExecuteDefaults({
            speaker,
            actor,
            token,
            character,
            needsActor: true,
            self: this,
        }));

        if (!scope.testResult) {
            if (!afflictionObj) return null;

            const item = new SohlItem(afflictionObj);
            if (!item) return null;

            scope.testResult = new CONFIG.SOHL.class.SuccessTestResult(
                {
                    speaker,
                    testType: SuccessTestResult.TEST_TYPE.AFFLICTIONCONTRACT,
                    mlMod: Utility.deepClone(item.system.$masteryLevel),
                },
                { parent: item.system },
            );
        }

        scope.testResult = scope.testResult.item.system.successTest(scope);
        return this._createTestItem(scope);
    }

    /**
     * Select the appropriate item to use for the opposed test, then delegate processing
     * of the opposed request to that item.
     *
     * @param {object} scope
     * @param {string} [scope.sourceTestResult]
     * @param {number} [scope.testType]
     * @returns {OpposedTestResult} result of the test
     */
    async opposedTestResume(speaker, actor, token, character, scope = {}) {
        let { opposedTestResult } = scope;
        if (!opposedTestResult) {
            throw new Error("Must supply opposedTestResult");
        }

        ({ speaker, actor, token, character } = SohlMacro.getExecuteDefaults({
            speaker,
            actor,
            token,
            character,
            needsToken: true,
            self: this,
        }));

        const sourceItem = opposedTestResult.sourceTestResult.item;

        const skill = await Utility.getOpposedItem({
            actor: this.parent,
            label: _l(
                "SOHL.Actor.entity.opposedTestResume.getOpposedItem.label",
            ),
            title: _l(
                "SOHL.Actor.entity.opposedTestResume.getOpposedItem.title",
                {
                    name: token.name,
                },
            ),
            func: (it) => {
                let result = false;
                if (
                    (it.system instanceof TraitItemData &&
                        it.system.intensity === "attribute" &&
                        !it.system.$masteryLevel.disabled) ||
                    it.system instanceof SkillItemData
                ) {
                    const name = _l(
                        "SOHL.Actor.entity.opposedTestResume.getOpposedItem.attributeLabel",
                        {
                            name: it.name,
                            ml: it.system.$masteryLevel.effective,
                        },
                    );
                    result = {
                        key: name,
                        value: {
                            name,
                            uuid: it.uuid,
                            value: it.system.$masteryLevel,
                            item: it,
                        },
                    };
                }
                return result;
            },
            compareFn: (a, b) => {
                if (
                    a.value.item.type === sourceItem.type &&
                    a.value.item.name === sourceItem.name
                )
                    return -1; // Move item to the front
                if (
                    b.value.item.type === sourceItem.type &&
                    b.value.item.name === sourceItem.name
                )
                    return -1; // Move item to the front
                return 0; // Keep relative order for other items
            },
        });

        if (skill === null) {
            return null;
        } else if (skill === false) {
            ui.notifications.warn(
                _l(
                    "SOHL.Actor.entity.opposedTestResume.getOpposedItem.noUsableSkills",
                    { name: token.name },
                ),
            );
            return null;
        } else {
            skill.system.execute("opposedTestResume", scope);
        }
    }

    prepareBaseData() {
        class HealthModifier extends CONFIG.SOHL.class.ValueModifier {
            static defineSchema() {
                return foundry.utils.mergeObject(super.defineSchema(), {
                    max: new fields.NumberField({
                        integer: true,
                        nullable: false,
                        initial: 0,
                        min: 0,
                    }),
                    pct: new SohlFunctionField({
                        initial: (thisVM) =>
                            Math.round(
                                (thisVM.effective /
                                    (thisVM.max || Number.EPSILON)) *
                                    100,
                            ),
                    }),
                });
            }
        }
        super.prepareBaseData();
        this.$health = new HealthModifier({}, { parent: this });
        this.$healingBase = new CONFIG.SOHL.class.ValueModifier(
            {},
            { parent: this },
        );
        this.$zoneSum = 0;
        this.$isSetup = true;
        this.$shockState = InjuryItemData.SHOCK.NONE;
        this.$engagedOpponents = new CONFIG.SOHL.class.ValueModifier(
            {},
            { parent: this },
        );
        this.$engagedOpponents.setBase(0);
        this.$domains = Object.fromEntries(
            Object.keys(PhilosophyItemData.categories).map((c) => [c, []]),
        );
    }
}

export class InanimateObjectActorData extends SohlActorData {
    /** @inheritdoc */
    static metadata = Object.freeze(
        foundry.utils.mergeObject(
            super.metadata,
            {
                name: "object",
                locId: "OBJECT",
                label: "TYPES.Actor.object",
                labelPlural: "TYPES.Actor.objectPl",
                iconCssClass: "fas fa-treasure-chest",
                img: "icons/svg/item-bag.svg",
                sheet: "systems/sohl/templates/actor/actor-sheet.html",
                effectKeys: {},
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    static defineSchema() {
        return foundry.utils.mergeObject(
            super.defineSchema(),
            {
                maxCapacity: new fields.NumberField({
                    integer: true,
                    initial: 0,
                }),
            },
            { inplace: false },
        );
    }

    prepareBaseData() {
        super.prepareBaseData();
        this.$isSetup = true;
    }
}

function SubtypeMixin(Base) {
    return class SubtypeExtension extends Base {
        /** @inheritdoc */
        static metadata = Object.freeze(
            foundry.utils.mergeObject(
                super.metadata,
                {
                    subTypes: "",
                },
                { inplace: false },
            ),
        );
        static get SUBTYPE() {
            return this.metadata.subType;
        }

        get SUBTYPE() {
            return this.constructor.SUBTYPE;
        }

        get label() {
            return game.i18n.format("SOHL.SohlBaseData.labelWithSubtype", {
                name: this.parent.name,
                typeLabel: _l(this.constructor.metadata.label),
                subType: _l(
                    `SOHL.${this.constructor.metadata.locId}.SUBTYPE.${this.subType}`,
                ),
            });
        }

        static defineSchema() {
            return foundry.utils.mergeObject(
                super.defineSchema(),
                {
                    subType: new fields.StringField({
                        initial: this.metadata.defaultSubtype,
                        required: true,
                        choices: Utility.getChoicesMap(
                            this.metadata.subTypes,
                            `SOHL.${this.metadata.locId}.SUBTYPE`,
                        ),
                    }),
                },
                { inplace: false },
            );
        }
    };
}

export class ProtectionItemData extends SubtypeMixin(SohlItemData) {
    $protection;
    $bodyLocations;

    /** @inheritdoc */
    static metadata = Object.freeze(
        foundry.utils.mergeObject(
            super.metadata,
            {
                name: "protection",
                locId: "PROTECTION",
                label: "TYPES.Item.protection",
                labelPlural: "TYPES.Item.protectionPl",
                iconCssClass: "fas fa-shield",
                img: "systems/sohl/assets/icons/shield.svg",
                sheet: "systems/sohl/templates/item/protection-sheet.html",
                nestOnly: true,
                effectKeys: {},
                defaultSubType: SOHL_VARIANTS.legendary,
                subTypes: SOHL_VARIANTS,
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    get transferToActor() {
        return this.subType === CONFIG.SOHL.id && super.transferToActor;
    }

    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), {
            protectionBase: new fields.SchemaField({
                blunt: new fields.NumberField({
                    integer: true,
                    initial: 0,
                    min: 0,
                }),
                edged: new fields.NumberField({
                    integer: true,
                    initial: 0,
                    min: 0,
                }),
                piercing: new fields.NumberField({
                    integer: true,
                    initial: 0,
                    min: 0,
                }),
                fire: new fields.NumberField({
                    integer: true,
                    initial: 0,
                    min: 0,
                }),
            }),
        });
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
        this.$bodyLocations = [];
        this.$protection = {
            blunt: new CONFIG.SOHL.class.ValueModifier(
                {},
                { parent: this },
            ).setBase(this.protectionBase.blunt),
            edged: new CONFIG.SOHL.class.ValueModifier(
                {},
                { parent: this },
            ).setBase(this.protectionBase.edged),
            piercing: new CONFIG.SOHL.class.ValueModifier(
                {},
                { parent: this },
            ).setBase(this.protectionBase.piercing),
            fire: new CONFIG.SOHL.class.ValueModifier(
                {},
                { parent: this },
            ).setBase(this.protectionBase.fire),
        };
    }

    processSiblings() {
        super.processSiblings();
        if (!this.item.nestedIn || this.subType !== CONFIG.SOHL.id) return;

        let armorGearData = null;
        if (
            this.item.nestedIn.system instanceof ArmorGearItemData &&
            this.item.nestedIn.system.isEquipped
        ) {
            armorGearData = this.item.nestedIn.system;
            this.$bodyLocations = this.actor.itemTypes[
                BodyLocationItemData.TYPE_NAME
            ].filter(
                (i) =>
                    armorGearData.locations.flexible.includes(i.name) ||
                    armorGearData.locations.rigid.includes(i.name),
            );
        } else if (this.item.nestedIn.system instanceof BodyLocationItemData) {
            this.$bodyLocations.push(this.item.nestedIn);
        }

        this.$bodyLocations.forEach((bl) => {
            const blData = bl.system;
            Object.keys(this.$protection).forEach((aspect) => {
                if (this.$protection[aspect].effective)
                    blData.$protection[aspect]?.add(
                        this.item.name,
                        this.abbrev,
                        this.$protection[aspect].effective,
                    );
            });

            if (armorGearData) {
                // if a material has been specified, add it to the layers
                if (armorGearData.material) {
                    if (blData.$layers) blData.$layers += ",";
                    blData.$layers += armorGearData.material;
                }

                // If any of the armor is rigid, then flag the whole bodylocation as rigid.
                blData.$traits.isRigid ||=
                    armorGearData.locations.rigid.includes(bl.name);
            }
        });
    }
}
export class StrikeModeItemData extends SubtypeMixin(SohlItemData) {
    $traits;
    $assocSkill;
    $impact;
    $attack;
    $defense;
    $durability;

    /** @inheritdoc */
    static metadata = Object.freeze(
        foundry.utils.mergeObject(
            super.metadata,
            {
                locId: "STRIKEMODE",
                nestOnly: true,
                effectKeys: {
                    "mod:system.$impact": {
                        label: "SOHL.STRIKEMODE.effectKeys.impact",
                        abbrev: "Imp",
                    },
                    "mod:system.$attack": {
                        label: "SOHL.STRIKEMODE.effectKeys.attack",
                        abbrev: "Atk",
                    },
                    "system.$defense.block": {
                        label: "SOHL.STRIKEMODE.effectKeys.block",
                        abbrev: "Blk",
                    },
                    "system.$defense.counterstrike": {
                        label: "SOHL.STRIKEMODE.effectKeys.counterstrike",
                        abbrev: "CXMod",
                    },
                    "system.$traits.noAttack": {
                        label: "SOHL.STRIKEMODE.effectKeys.noAttack",
                        abbrev: "NoAtk",
                    },
                    "system.$traits.noBlock": {
                        label: "SOHL.STRIKEMODE.effectKeys.noBlock",
                        abbrev: "NoBlk",
                    },
                },
                subTypes: SOHL_VARIANTS,
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    get transferToActor() {
        return this.subType === CONFIG.SOHL.id && super.transferToActor;
    }

    get group() {
        throw new Error("Subclass must define group");
    }

    get strikeModeLabel() {
        return `${this.item.nestedIn?.name} ${this.name}`;
    }

    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), {
            mode: new fields.StringField(),
            minParts: new fields.NumberField({
                integer: true,
                initial: 1,
                min: 0,
            }),
            assocSkillName: new fields.StringField(),
            impactBase: new fields.SchemaField({
                numDice: new fields.NumberField({
                    integer: true,
                    initial: 0,
                    min: 0,
                }),
                die: new fields.NumberField({
                    integer: true,
                    initial: 6,
                    min: 0,
                }),
                modifier: new fields.NumberField({
                    integer: true,
                    initial: 0,
                }),
                aspect: new fields.StringField({
                    initial: ImpactModifier.ASPECT.BLUNT,
                    required: true,
                    choices: Utility.getChoicesMap(
                        ImpactModifier.ASPECT,
                        "SOHL.IMPACTMODIFIER.ASPECT",
                    ),
                }),
            }),
        });
    }

    async _preOpposedSuccessTest(speaker, actor, token, character, scope = {}) {
        ({ speaker, actor, token, character } = SohlMacro.getExecuteDefaults({
            speaker,
            actor,
            token,
            character,
            needsToken: true,
            self: this,
        }));

        let { targetToken, sourceTestResult } = scope;

        return {
            speaker,
            sourceTestResult,
            targetToken,
        };
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
        this.$durability = new CONFIG.SOHL.class.ValueModifier(
            {},
            { parent: this },
        );
        this.$length = new CONFIG.SOHL.class.ValueModifier(
            {},
            { parent: this },
        );
        this.$attack = new CONFIG.SOHL.class.CombatModifier(
            {},
            { parent: this },
        );
        this.$defense = {
            block: new CONFIG.SOHL.class.CombatModifier({}, { parent: this }),
            counterstrike: new CONFIG.SOHL.class.CombatModifier(
                {},
                { parent: this },
            ),
        };
        this.$impact = new CONFIG.SOHL.class.ImpactModifier(
            {
                properties: {
                    numDice: this.impactBase.numDice,
                    aspect: this.impactBase.aspect,
                    die: this.impactBase.die,
                },
            },
            { parent: this },
        );
        if (!this.impactBase.modifier && !this.impactBase.die) {
            this.$impact.setDisabled(
                "SOHL.StrikeModeItemData.NoModifierNoDieDisabled",
                "NMND",
            );
        } else {
            this.$impact.setBase(this.impactBase.modifier);
        }
        this.$traits = {
            noAttack: false,
            noBlock: false,
        };
    }

    setupVirtualItems() {
        super.setupVirtualItems();
        this.$assocSkill = this.actor.getItem(this.assocSkillName, {
            types: [SkillItemData.TYPE_NAME],
            isName: true,
        });
        if (!this.$assocSkill) {
            ui.notifications?.warn(
                _l("SOHL.StrikeModeItemData.NoAssocSkillWarning", {
                    label: _l(this.constructor.metadata.label),
                    skillName: this.assocSkillName,
                }),
            );
            this.$assocSkill = new SohlItem(
                {
                    name: this.assocSkillName,
                    type: SkillItemData.TYPE_NAME,
                    _id: foundry.utils.randomID(),
                    system: {
                        masteryLevelBase: 0,
                    },
                },
                { parent: this.actor },
            );
            this.$assocSkill.cause = this.item;
        }
    }

    postProcess() {
        super.postProcess();
        if (this.item.nestedIn?.system instanceof GearItemData) {
            this.$durability.addVM(this.item.nestedIn.system.$durability, {
                includeBase: true,
            });
        } else {
            this.$durability.setDisabled(
                "SOHL.StrikeModeItemData.NoAssocSkillWarning",
                "NNiG",
            );
        }
        this.$assocSkill = this.actor.getItem(this.assocSkillName, {
            types: [SkillItemData.TYPE_NAME],
            isName: true,
        });
        if (this.$assocSkill) {
            this.$attack.addVM(this.$assocSkill.system.$masteryLevel, {
                includeBase: true,
            });
            this.$attack.fate.addVM(
                this.$assocSkill.system.$masteryLevel.fate,
                {
                    includeBase: true,
                },
            );
        } else {
            this.$attack.setDisabled(
                "SOHL.StrikeModeItemData.NoAssocSkillWarning",
                "NoSkill",
            );
        }
    }
}

export class MeleeWeaponStrikeModeItemData extends StrikeModeItemData {
    $length;

    /** @inheritdoc */
    static metadata = Object.freeze(
        foundry.utils.mergeObject(
            super.metadata,
            {
                name: "meleestrikemode",
                locId: "MELEESTRIKEMODE",
                label: "TYPES.Item.meleestrikemode",
                labelPlural: "TYPES.Item.meleestrikemodePl",
                iconCssClass: "fas fa-sword",
                img: "systems/sohl/assets/icons/sword.svg",
                sheet: "systems/sohl/templates/item/meleestrikemode-sheet.html",
                nestOnly: true,
                group: "melee",
                effectKeys: foundry.utils.mergeObject(super.effectKeys, {
                    "mod:system.$length": {
                        label: "SOHL.Length",
                        abbrev: "Len",
                    },
                    "mod:system.$defense.block": {
                        label: "SOHL.Block",
                        abbrev: "Blk",
                    },
                    "mod:system.$defense.counterstrike": {
                        label: "SOHL.Counterstrike",
                        abbrev: "CX",
                    },
                }),
                subTypes: SOHL_VARIANTS,
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    getIntrinsicActions(_data = this, defaultAction = null, actions = []) {
        return super.getIntrinsicActions(
            _data,
            defaultAction,
            Utility.uniqueActions(
                actions,
                [
                    CombatTestResult.TEST_TYPE.MELEEATTACK,
                    CombatTestResult.TEST_TYPE.BLOCK,
                    CombatTestResult.TEST_TYPE.COUNTERSTRIKE,
                ].map((a) => CombatTestResult.testTypes[a]),
            ),
        );
    }

    async attackTest(speaker, actor, token, character, scope = {}) {
        scope.mlMod = Utility.deepClone(this.$attack);
        scope.impactMod = Utility.deepClone(this.$impact);
        scope.testType = CombatTestResult.TEST_TYPE.MELEEATTACK;
        scope.title = _l("{weapon} {strikeModeName} Melee Attack Test", {
            weapon: this.item.nestedIn.name,
            strikeModeName: this.name,
        });
        return await CONFIG.SOHL.class.SuccessTestResult.createMacroTest(
            speaker,
            actor,
            token,
            character,
            scope,
        );
    }

    async blockTest(speaker, actor, token, character, scope = {}) {
        scope.mlMod = Utility.deepClone(this.$defense.block);
        scope.testType = CombatTestResult.TEST_TYPE.BLOCK;
        scope.title = _l("{weapon} {strikeModeName} Block Test", {
            weapon: this.item.nestedIn.name,
            strikeModeName: this.name,
        });
        return await CONFIG.SOHL.class.SuccessTestResult.createMacroTest(
            speaker,
            actor,
            token,
            character,
            scope,
        );
    }

    async counterstrikeTest(speaker, actor, token, character, scope = {}) {
        scope.mlMod = Utility.deepClone(this.$defense.counterstrike);
        scope.impactMod = Utility.deepClone(this.$impact);
        scope.testType = CombatTestResult.TEST_TYPE.COUNTERSTRIKE;
        scope.title = _l("{weapon} {strikeModeName} Counterstrike Test", {
            weapon: this.item.nestedIn.name,
            strikeModeName: this.name,
        });
        return await CONFIG.SOHL.class.SuccessTestResult.createMacroTest(
            speaker,
            actor,
            token,
            character,
            scope,
        );
    }

    prepareBaseData() {
        super.prepareBaseData();
        this.$length = new CONFIG.SOHL.class.ValueModifier(
            {},
            { parent: this },
        );

        // Length is only set if this Strike Mode is nested in a WeaponGear
        if (this.item.nestedIn instanceof WeaponGearItemData) {
            this.$length.setBase(this.item.nestedIn.system.lengthBase);
        }
    }

    processSiblings() {
        super.processSiblings();
        this.$defense.block.addVM(this.$assocSkill.system.$masteryLevel, {
            includeBase: true,
        });
        this.$defense.block.fate.addVM(
            this.$assocSkill.system.$masteryLevel.fate,
            { includeBase: true },
        );
        this.$defense.counterstrike.addVM(
            this.$assocSkill.system.$masteryLevel,
            { includeBase: true },
        );
        this.$defense.counterstrike.fate.addVM(
            this.$assocSkill.system.$masteryLevel.fate,
            { includeBase: true },
        );

        // If outnumbered, then add the outnumbered penalty to the defend "bonus" (in this case a penalty)
        if (this.outnumberedPenalty) {
            this.$defense.block.add(
                CONFIG.SOHL.MOD.OUTNUMBERED,
                this.outnumberedPenalty,
            );
            this.$defense.counterstrike.add(
                CONFIG.SOHL.MOD.OUTNUMBERED,
                this.outnumberedPenalty,
            );
        }
    }
}

export class MissileWeaponStrikeModeItemData extends StrikeModeItemData {
    /** @inheritdoc */
    static metadata = Object.freeze(
        foundry.utils.mergeObject(
            super.metadata,
            {
                name: "missilestrikemode",
                locId: "MISSLESTRIKEMODE",
                label: "TYPES.Item.missilestrikemode",
                labelPlural: "TYPES.Item.missilestrikemodePl",
                iconCssClass: "fas fa-bow-arrow",
                img: "systems/sohl/assets/icons/longbow.svg",
                sheet: "systems/sohl/templates/item/missilestrikemode-sheet.html",
                nestOnly: true,
                group: "missile",
                effectKeys: {},
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), {
            projectileType: new fields.StringField({
                initial: ProjectileGearItemData.SUBTYPE.NONE,
                required: true,
                choices: Utility.getChoicesMap(
                    ProjectileGearItemData.SUBTYPE,
                    "SOHL.PROJECTILEGEAR.SUBTYPE",
                ),
            }),
        });
    }

    getIntrinsicActions(_data = this, defaultAction = null, actions = []) {
        return super.getIntrinsicActions(
            _data,
            defaultAction,
            Utility.uniqueActions(
                actions,
                [CombatTestResult.TEST_TYPE.MISSILEATTACK].map(
                    (a) => CombatTestResult.testTypes[a],
                ),
            ),
        );
    }

    async attackTest(speaker, actor, token, character, scope = {}) {
        scope.mlMod = Utility.deepClone(this.$attack);
        scope.testType = CombatTestResult.TEST_TYPE.MISSILEATTACK;
        scope.title = _l("{weapon} {strikeModeName} Block Test", {
            weapon: this.item.nestedIn.name,
            strikeModeName: this.name,
        });
        return await CONFIG.SOHL.class.SuccessTestResult.createMacroTest(
            speaker,
            actor,
            token,
            character,
            scope,
        );
    }

    prepareBaseData() {
        super.prepareBaseData();
        this.$defense.block.setDisabled(_l("No Blocking Allowed"), "NoBlk");
        this.$defense.counterstrike.setDisabled(
            _l("No Counterstrike Allowed"),
            "NoCX",
        );
    }
}

export class CombatTechniqueStrikeModeItemData extends StrikeModeItemData {
    $length;

    /** @inheritdoc */
    static metadata = Object.freeze(
        foundry.utils.mergeObject(
            super.metadata,
            {
                name: "combattechniquestrikemode",
                locId: "COMBATTECHNIQUE",
                label: "TYPES.Item.combattechniquestrikemode",
                labelPlural: "TYPES.Item.combattechniquestrikemodePl",
                iconCssClass: "fas fa-hand-fist",
                img: "systems/sohl/assets/icons/punch.svg",
                sheet: "systems/sohl/templates/item/combattechniquestrikemode-sheet.html",
                nestOnly: true,
                group: "melee",
                effectKeys: {
                    "mod:system.$length": {
                        label: "SOHL.Length",
                        abbrev: "Len",
                    },
                    "mod:system.$defense.block": {
                        label: "SOHL.Block",
                        abbrev: "Blk",
                    },
                    "mod:system.$defense.counterstrike": {
                        label: "SOHL.Counterstrike",
                        abbrev: "CX",
                    },
                },
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    getIntrinsicActions(_data = this, defaultAction = null, actions = []) {
        return super.getIntrinsicActions(
            _data,
            defaultAction,
            Utility.uniqueActions(
                actions,
                [
                    CombatTestResult.TEST_TYPE.MELEEATTACK,
                    CombatTestResult.TEST_TYPE.BLOCK,
                    CombatTestResult.TEST_TYPE.COUNTERSTRIKE,
                ].map((a) => CombatTestResult.testTypes[a]),
            ),
        );
    }

    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), {
            lengthBase: new fields.NumberField({
                integer: true,
                initial: 0,
                min: 0,
            }),
        });
    }

    async attackTest(speaker, actor, token, character, scope = {}) {
        scope.mlMod = Utility.deepClone(this.$attack);
        scope.testType = CombatTestResult.TEST_TYPE.MELEEATTACK;
        scope.title = _l("{weapon} {strikeModeName} Melee Attack Test", {
            weapon: this.item.nestedIn.name,
            strikeModeName: this.name,
        });
        return await CONFIG.SOHL.class.SuccessTestResult.createMacroTest(
            speaker,
            actor,
            token,
            character,
            scope,
        );
    }

    async blockTest(speaker, actor, token, character, scope = {}) {
        scope.mlMod = Utility.deepClone(this.$defense.block);
        scope.testType = CombatTestResult.TEST_TYPE.BLOCK;
        scope.title = _l("{weapon} {strikeModeName} Block Test", {
            weapon: this.item.nestedIn.name,
            strikeModeName: this.name,
        });
        return await CONFIG.SOHL.class.SuccessTestResult.createMacroTest(
            speaker,
            actor,
            token,
            character,
            scope,
        );
    }

    async counterstrikeTest(speaker, actor, token, character, scope = {}) {
        scope.mlMod = Utility.deepClone(this.$defense.counterstrike);
        scope.testType = CombatTestResult.TEST_TYPE.COUNTERSTRIKE;
        scope.title = _l("{weapon} {strikeModeName} Counterstrike Test", {
            weapon: this.item.nestedIn.name,
            strikeModeName: this.name,
        });
        return await CONFIG.SOHL.class.SuccessTestResult.createMacroTest(
            speaker,
            actor,
            token,
            character,
            scope,
        );
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
        this.$length = new CONFIG.SOHL.class.ValueModifier(
            {},
            { parent: this },
        );
        this.$length.setBase(this.lengthBase);
    }

    processSiblings() {
        super.processSiblings();
        this.$attack.addVM(this.$assocSkill.system.$masteryLevel, {
            includeBase: true,
        });
        this.$defense.block.addVM(this.$assocSkill.system.$masteryLevel, {
            includeBase: true,
        });
        this.$defense.counterstrike.addVM(
            this.$assocSkill.system.$masteryLevel,
            { includeBase: true },
        );

        // If outnumbered, then add the outnumbered penalty to the defend "bonus" (in this case a penalty)
        if (this.outnumberedPenalty) {
            this.$defense.block.add(
                CONFIG.SOHL.MOD.OUTNUMBERED,
                this.outnumberedPenalty,
            );
            this.$defense.counterstrike.add(
                CONFIG.SOHL.MOD.OUTNUMBERED,
                this.outnumberedPenalty,
            );
        }
    }
}

export class CombatManeuverItemData extends SohlItemData {
    /** @inheritdoc */
    static metadata = Object.freeze(
        foundry.utils.mergeObject(
            super.metadata,
            {
                name: "combatmaneuver",
                locId: "COMBATMANEUVER",
                label: "TYPES.Item.combatmaneuver",
                labelPlural: "TYPES.Item.combatmaneuverPl",
                iconCssClass: "fas fa-hand-fist",
                img: "systems/sohl/assets/icons/sparkle.svg",
                sheet: "systems/sohl/templates/item/combatmaneuver-sheet.html",
                nestOnly: false,
                effectKeys: {},
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );
}

export class MasteryLevelItemData extends SohlItemData {
    $boosts;
    $skillBase;
    $masteryLevel;

    /** @inheritdoc */
    static metadata = Object.freeze(
        foundry.utils.mergeObject(
            super.metadata,
            {
                locId: "MASTERYLEVEL",
                effectKeys: {
                    "system.$boosts": {
                        label: "SOHL.MasteryBoost",
                        abbrev: "MBoost",
                    },
                    "mod:system.$masteryLevel": {
                        label: "SOHL.MasteryLevel",
                        abbrev: "ML",
                    },
                    "mod:system.$masteryLevel.fate": {
                        label: "SOHL.Fate",
                        abbrev: "Fate",
                    },
                    "system.$masteryLevel.successLevelMod": {
                        label: "SOHL.SuccessLevel",
                        abbrev: "SL",
                    },
                },
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    get fateSkills() {
        return this.item.getFlag("sohl", "fateSkills") || [];
    }

    get magicMod() {
        return 0;
    }

    get boosts() {
        return this.$boosts;
    }

    /**
     * Searches through all of the Fate mysteries on the actor, gathering any that
     * are applicable to this skill, and returns them.
     *
     * @readonly
     * @type {SohlItem[]} An array of Mystery fate items that apply to this skill.
     */
    get availableFate() {
        let result = [];
        if (!this.$masteryLevel.disabled) {
            for (const it of this.actor.allItems()) {
                if (
                    it.system instanceof MysteryItemData &&
                    it.system.subType === MysteryItemData.CATEGORY.FATE
                ) {
                    const fateSkills = this.fateSkills;
                    // If a fate item has a list of fate skills, then that fate
                    // item is only applicable to those skills.  If the fate item
                    // has no list of skills, then the fate item is applicable
                    // to all skills.
                    if (
                        !fateSkills.length ||
                        fateSkills.includes(this.item.name)
                    ) {
                        if (it.system.$level.effective > 0) result.push(it);
                    }
                }
            }
        }
        return result;
    }

    get fateBonusItems() {
        let result = [];
        if (this.actor) {
            for (const it of this.actor.allItems()) {
                if (
                    it.system instanceof MysteryItemData &&
                    it.system.config.category ===
                        MysteryItemData.CATEGORY.FATEBONUS
                ) {
                    const skills = it.fateSkills;
                    if (!skills || skills.includes(this.item.name)) {
                        if (
                            !it.system.$charges.disabled ||
                            it.system.$charges.effective > 0
                        ) {
                            result.push(it);
                        }
                    }
                }
            }
        }
        return result;
    }

    get canImprove() {
        return (
            !this.item.isVirtual &&
            (game.user.isGM || this.item.isOwner) &&
            !this.$masteryLevel.disabled
        );
    }

    get valid() {
        return this.skillBase.valid;
    }

    get skillBase() {
        return this.$skillBase;
    }

    get sdrIncr() {
        return 1;
    }

    get defaultAction() {
        return SuccessTestResult.TEST_TYPE.SKILL;
    }

    getIntrinsicActions(_data = this, defaultAction = null, actions = []) {
        return super.getIntrinsicActions(
            _data,
            defaultAction,
            Utility.uniqueActions(
                actions,
                [
                    SuccessTestResult.TEST_TYPE.SKILL,
                    SuccessTestResult.TEST_TYPE.SETIMPROVEFLAG,
                    SuccessTestResult.TEST_TYPE.UNSETIMPROVEFLAG,
                    SuccessTestResult.TEST_TYPE.IMPROVESDR,
                ].map((a) => SuccessTestResult.testTypes[a]),
            ),
        );
    }

    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), {
            abbrev: new fields.StringField(),
            skillBaseFormula: new fields.StringField(),
            masteryLevelBase: new fields.NumberField({
                initial: 0,
                min: 0,
            }),
            improveFlag: new fields.BooleanField({ initial: false }),
        });
    }

    async successTest(speaker, actor, token, character, scope = {}) {
        scope.mlMod = Utility.deepClone(this.$masteryLevel);
        scope.type = `${this.item.type}-${this.item.name}-success-test`;
        scope.title = _l("{label} Test", { label: this.item.label });
        return await super.successTest(speaker, actor, token, character, scope);
    }

    /**
     * Perform an opposed test
     * @param {object} options
     * @returns {SuccessTestChatData}
     */
    async opposedTestStart(speaker, actor, token, character, scope = {}) {
        ({ speaker, actor, token, character } = SohlMacro.getExecuteDefaults({
            speaker,
            actor,
            token,
            character,
            needsToken: true,
            self: this,
        }));
        let {
            skipDialog = false,
            type = `${this.item.type}-${this.item.name}-source-opposedtest`,
            title = _l("{label} Opposed Test", { label: this.item.label }),
            targetToken,
        } = scope;

        targetToken ||= Utility.getUserTargetedToken(token);
        if (!targetToken) return null;

        if (!token) {
            ui.notifications.warn(_l("No attacker token identified."));
            return null;
        }

        if (!token.isOwner) {
            ui.notifications.warn(
                _l(
                    "You do not have permissions to perform this operation on {name}",
                    { name: token.name },
                ),
            );
            return null;
        }

        let sourceTestResult = new CONFIG.SOHL.class.SuccessTestResult(
            {
                speaker,
                item: this.item,
                rollMode: game.settings.get("core", "rollMode"),
                type,
                title:
                    title ||
                    _l("{name} {label} Test", {
                        name: token?.name || actor?.name,
                        label: this.item.label,
                    }),
                situationalModifier: 0,
                mlMod: Utility.deepClone(this.$masteryLevel),
            },
            { parent: this },
        );

        sourceTestResult = await this.successTest(
            speaker,
            actor,
            token,
            character,
            {
                skipDialog,
                type,
                title,
                noChat: true,
            },
        );

        const opposedTest = new CONFIG.SOHL.class.OpposedTestResult(
            {
                speaker,
                targetToken,
                sourceTestResult,
            },
            { parent: this },
        );

        return opposedTest.toRequestChat();
    }

    async opposedTestResume(speaker, actor, token, character, scope = {}) {
        let {
            noChat = false,
            opposedTestResult,
            testType = SuccessTestResult.TEST_TYPE.SKILL,
        } = scope;

        if (!opposedTestResult) {
            throw new Error("Must supply opposedTestResult");
        }

        ({ speaker, actor, token, character } = SohlMacro.getExecuteDefaults({
            speaker,
            actor,
            token,
            character,
            needsToken: true,
            self: this,
        }));

        if (!opposedTestResult.targetTestResult) {
            opposedTestResult.targetTestResult =
                new CONFIG.SOHL.class.SuccessTestResult(
                    {
                        speaker,
                        item: this.item,
                        rollMode: game.settings.get("core", "rollMode"),
                        type: SuccessTestResult.TEST_TYPE.SKILL,
                        title: _l("Opposed {label} Test", {
                            label: this.item.label,
                        }),
                        situationalModifier: 0,
                        mlMod: Utility.deepClone(
                            this.item.system.$masteryLevel,
                        ),
                    },
                    { parent: this },
                );

            opposedTestResult.targetTestResult = this.successTest({
                noChat: true,
                testType,
            });
            if (!opposedTestResult.targetTestResult) return null;
        } else {
            // In this situation, where the targetTestResult is provided,
            // the GM is modifying the result of a prior opposedTest.
            // Therefore, we re-display the dialog for each of the prior
            // successTests.
            opposedTestResult.sourceTestResult =
                opposedTestResult.sourceTestResult.item.successTest({
                    noChat: true,
                    successTestResult: opposedTestResult.sourceTestResult,
                });
            opposedTestResult.targetTestResult =
                opposedTestResult.targetTestResult.item.successTest({
                    noChat: true,
                    successTestResult: opposedTestResult.targetTestResult,
                });
        }

        let allowed = await opposedTestResult.evaluate();

        if (allowed && !noChat) {
            opposedTestResult.toChat({
                template:
                    "systems/sohl/templates/chat/opposed-result-card.html",
                title: _l("Opposed Action Result"),
            });
        }

        return allowed ? opposedTestResult : false;
    }

    async improveWithSDR(speaker) {
        const updateData = { "system.improveFlag": false };
        let roll = await Roll.create(`1d100 + ${this.skillBase.value}`);
        const isSuccess = roll.total > this.$masteryLevel.base;

        if (isSuccess) {
            updateData["system.masteryLevelBase"] =
                this.masteryLevelBase + this.sdrIncr;
        }
        let prefix = _l("{subType} {label}", {
            subType: this.constructor.subTypes[this.subType],
            label: _l(this.constructor.metadata.label),
        });
        const chatTemplate =
            "systems/sohl/templates/chat/standard-test-card.html";
        const chatTemplateData = {
            variant: CONFIG.SOHL.id,
            type: `${this.type}-${this.name}-improve-sdr`,
            title: _l("{label} Development Roll", { label: this.item.label }),
            effTarget: this.$masteryLevel.base,
            isSuccess: isSuccess,
            rollValue: roll.total,
            rollResult: roll.result,
            showResult: true,
            resultText: isSuccess
                ? _l("{prefix} Increase", { prefix })
                : _l("No {prefix} Increase", { prefix }),
            resultDesc: isSuccess
                ? _l("{label} increased by {incr} to {final}", {
                      label: this.item.label,
                      incr: this.sdrIncr,
                      final: this.$masteryLevel.base + this.sdrIncr,
                  })
                : "",
            description: isSuccess
                ? SuccessTestResult.SUCCESS_TEXT.SUCCESS
                : SuccessTestResult.SUCCESS_TEXT.FAILURE,
            notes: "",
            sdrIncr: this.sdrIncr,
        };

        const chatHtml = await renderTemplate(chatTemplate, chatTemplateData);

        const messageData = {
            user: game.user.id,
            speaker,
            content: chatHtml.trim(),
            sound: CONFIG.sounds.dice,
        };

        ChatMessage.applyRollMode(messageData, "roll");

        // Create a chat message
        await ChatMessage.create(messageData);
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
        this.$boosts = 0;
        this.$masteryLevel = new CONFIG.SOHL.class.MasteryLevelModifier(
            {
                properties: {
                    fate: new CONFIG.SOHL.class.MasteryLevelModifier(
                        {},
                        { parent: this },
                    ),
                },
            },
            { parent: this },
        );
        this.$masteryLevel.setBase(this.masteryLevelBase);
        if (this.actor) {
            const fateSetting = game.settings.get("sohl", "optionFate");

            if (fateSetting === "everyone") {
                this.$masteryLevel.fate.setBase(50);
            } else if (fateSetting === "pconly") {
                if (this.actor.hasPlayerOwner) {
                    this.$masteryLevel.fate.setBase(50);
                } else {
                    this.$masteryLevel.fate.setDisabled(
                        _l("Non-Player Character/Creature"),
                        "NPC",
                    );
                }
            } else {
                this.$masteryLevel.fate.setDisabled(
                    _l("Fate Disabled in Settings"),
                    "NoFate",
                );
            }
        }
        this.$skillBase ||= new SkillBase(this.skillBaseFormula, {
            items: this.actor?.items,
        });
    }

    processSiblings() {
        super.processSiblings();
        this.$skillBase.setAttributes(this.actor.allItems());

        if (this.$masteryLevel.base > 0) {
            let newML = this.$masteryLevel.base;

            for (let i = 0; i < this.boosts; i++) {
                newML += this.constructor.calcMasteryBoost(newML);
            }

            this.$masteryLevel.setBase(newML);
        }

        // Ensure base ML is not greater than MaxML
        if (this.$masteryLevel.base > this.$masteryLevel.max) {
            this.$masteryLevel.setBase(this.$masteryLevel.max);
        }

        if (this.skillBase.attributes.includes("Aura")) {
            // Any skill that has Aura in its SB formula cannot use fate
            this.$masteryLevel.fate.setDisabled(
                _l("Aura-Based, No Fate"),
                "AurBsd",
            );
        }
    }

    /** @override */
    postProcess() {
        super.postProcess();
        if (this.$masteryLevel.disabled) {
            this.$masteryLevel.fate.setDisabled(
                CONFIG.SOHL.MOD.MLDSBL.name,
                CONFIG.SOHL.MOD.MLDSBL.abbrev,
            );
        }
        if (!this.$masteryLevel.fate.disabled) {
            const fate = this.actor.getTraitByAbbrev("fate");
            if (fate) {
                this.$masteryLevel.fate.addVM(fate.system.$score, {
                    includeBase: true,
                });
            } else {
                this.$masteryLevel.fate.setBase(50);
            }

            // Apply magic modifiers
            if (this.magicMod) {
                this.$masteryLevel.fate.add(
                    CONFIG.SOHL.MOD.MAGICMOD,
                    this.magicMod,
                );
            }

            this.fateBonusItems.forEach((it) => {
                this.$masteryLevel.fate.add(
                    CONFIG.SOHL.MOD.FATEBNS,
                    it.system.$level.effective,
                    { skill: it.label },
                );
            });
            if (!this.availableFate.length) {
                this.$masteryLevel.fate.setDisabled(CONFIG.SOHL.MOD.NOFATE);
            }
        }
    }
}

export class MysteryItemData extends SohlItemData {
    $level;
    $charges;
    $domainLabel;
    $paramLabel;

    static CATEGORY = Object.freeze({
        GRACE: "grace",
        PIETY: "piety",
        FATE: "fate",
        FATEBONUS: "fateBonus",
        FATEPOINTBONUS: "fatePointBonus",
        BLESSING: "blessing",
        ANCESTOR: "ancestor",
        TOTEM: "totem",
    });

    static DOMAIN_VALUE = Object.freeze({
        DIVINE: "divinedomain",
        SKILL: "skill",
        CREATURE: "creature",
        NONE: "none",
    });

    static DOMAINMAP = Object.freeze({
        [this.GRACE]: this.DOMAIN_VALUE.DIVINE,
        [this.PIETY]: this.DOMAIN_VALUE.DIVINE,
        [this.FATE]: this.DOMAIN_VALUE.SKILL,
        [this.FATEBONUS]: this.DOMAIN_VALUE.SKILL,
        [this.FATEPOINTBONUS]: this.DOMAIN_VALUE.NONE,
        [this.BLESSING]: this.DOMAIN_VALUE.DIVINE,
        [this.ANCESTOR]: this.DOMAIN_VALUE.SKILL,
        [this.TOTEM]: this.DOMAIN_VALUE.CREATURE,
    });

    /** @inheritdoc */
    static metadata = Object.freeze(
        foundry.utils.mergeObject(
            super.metadata,
            {
                name: "mystery",
                locId: "MYSTERY",
                label: "TYPES.Item.mystery",
                labelPlural: "TYPES.Item.mysteryPl",
                iconCssClass: "fas fa-sparkles",
                img: "systems/sohl/assets/icons/sparkles.svg",
                sheet: "systems/sohl/templates/item/mystery-sheet.html",
                nestOnly: false,
                effectKeys: {
                    "system.$charges": { label: "SOHL.Charges", abbrev: "Cgs" },
                    "system.$charges.max": {
                        label: "SOHL.MaximumCharges",
                        abbrev: "MaxCgs",
                    },
                },
            },
            { inplace: false },
        ),
    );

    get fieldData() {
        const domainValueKey =
            this.constructor.DOMAIN_MAP[this.config.category];

        let field = "";
        switch (domainValueKey) {
            case this.DOMAIN_VALUE.SKILLS:
                if (this.skills.size) {
                    const formatter = game.i18n.getListFormatter();

                    field = formatter.format(
                        Utility.sortStrings(Array.from(this.skills.values())),
                    );
                } else {
                    field = _l("SOHL.AllSkills");
                }
                break;

            case this.DOMAIN_VALUE.DIVINE:
                if (!this.item.actor) return this.domain;
                field = this.item.actor.system.$domains.divine.find(
                    (d) => d.system.abbrev === this.domain,
                )?.name;
                break;

            case this.DOMAIN_VALUE.CREATURE:
                if (!this.item.actor) return this.domain;
                field = this.item.actor.system.$domains.spirit.find(
                    (d) => d.system.abbrev === this.domain,
                )?.name;
                break;
        }
        return (
            field ||
            _l("SOHL.MYSTERY.UnknownDomain", { domainName: this.domain })
        );
    }

    static LOCALIZATION_PREFIXES = [
        ...super.LOCALIZATION_PREFIXES,
        "SOHL.MYSTERY",
    ];

    static defineSchema() {
        return foundry.utils.mergeObject(
            super.defineSchema(),
            {
                config: new fields.SchemaField({
                    usesCharges: new fields.BooleanField({ initial: false }),
                    usesSkills: new fields.BooleanField({ initial: false }),
                    assocPhilosophy: new fields.StringField(),
                    category: new fields.StringField({
                        initial: this.CATEGORY.GRACE,
                        required: true,
                        choices: Utility.getChoicesMap(
                            this.CATEGORY,
                            "SOHL.MASTERYLEVEL.CATEGORY",
                        ),
                    }),
                }),
                domain: new fields.StringField(),
                skills: new fields.ArrayField(
                    new fields.StringField({
                        required: true,
                        blank: false,
                    }),
                ),
                levelBase: new fields.NumberField({
                    integer: true,
                    initial: 0,
                    min: 0,
                }),
                charges: new fields.SchemaField({
                    value: new fields.NumberField({
                        integer: true,
                        initial: 0,
                        min: 0,
                    }),
                    // Note: if max charges is 0, then there is no maximum
                    max: new fields.NumberField({
                        integer: true,
                        initial: 0,
                        min: 0,
                    }),
                }),
            },
            { inplace: false },
        );
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
        this.$label = "";
        this.$charges = new CONFIG.SOHL.class.ValueModifier(
            {
                properties: {
                    max: new CONFIG.SOHL.class.ValueModifier(
                        {},
                        { parent: this },
                    ),
                },
            },
            { parent: this },
        );
        if (!this.charges.usesCharges) {
            this.$charges.setDisabled(
                "SOHL.MYSTERY.DoesNotUseCharges",
                "NoChrg",
            );
            this.$charges.max.setDisabled(
                "SOHL.MYSTERY.DoesNotUseCharges",
                "NoChrg",
            );
        } else {
            this.$charges.setBase(this.charges.value);
            this.$charges.max.setBase(this.charges.max);
        }
        this.$level = new CONFIG.SOHL.class.ValueModifier(
            {
                properties: {
                    roman: (thisVM) => Utility.romanize(thisVM.effective),
                },
            },
            { parent: this },
        );
        this.$level.setBase(this.levelBase);
    }
}

export class MysticalAbilityItemData extends MasteryLevelItemData {
    $charges;
    $maxCharges;
    $affectedSkill;
    $fatigue;
    $level;
    $canImprove;

    static CATEGORY = Object.freeze({
        SHAMANICRITE: "shamanicrite",
        SPIRITACTION: "spiritaction",
        SPIRITPOWER: "spiritpower",
        BENEDICTION: "benediction",
        DIVINEDEVOTION: "divinedevotion",
        DIVINEINCANTATION: "divineincantation",
        ARCANEINCANTATION: "arcaneincantation",
        ARCANEINVOCATION: "arcaneinvocation",
        ARCANETALENT: "arcanetalent",
        ALCHEMY: "alchemy",
        DIVINATION: "divination",
    });

    static DOMAIN_DEGREE = Object.freeze({
        PRIMARY: { name: "primary", value: 0 },
        SECONDARY: { name: "secondary", value: 1 },
        NEUTRAL: { name: "neutral", value: 2 },
        TERTIARY: { name: "tertiary", value: 3 },
        DIAMETRIC: { name: "diametric", value: 4 },
    });

    /** @inheritdoc */
    static metadata = Object.freeze(
        foundry.utils.mergeObject(
            super.metadata,
            {
                name: "mysticalability",
                locId: "MYSTICALABILITY",
                label: "TYPES.Item.mysticalability",
                labelPlural: "TYPES.Item.mysticalabilityPl",
                iconCssClass: "fas fa-hand-sparkles",
                img: "systems/sohl/assets/icons/hand-sparkles.svg",
                sheet: "systems/sohl/templates/item/mysticalability-sheet.html",
                nestOnly: false,
                effectKeys: {
                    "system.$charges": { label: "SOHL.Charges", abbrev: "Cgs" },
                    "system.$charges.max": {
                        label: "SOHL.MaximumCharges",
                        abbrev: "MaxCgs",
                    },
                    "system.$canImprove": {
                        label: "SOHL.CanImproveMastery",
                        abbrev: "Imp",
                    },
                },
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    get availableFate() {
        // All of the Mystical Abilities are essentially aura based, so none of them
        // may be Fated.
        return [];
    }

    /**
     * Returns whether this item can be improved by using a mystical ability.
     * Returns true if the subType of the item is one of the following: ArcaneInvocation, DivineInvocation, or ArcaneTalent.
     * Returns false otherwise.
     *
     * @readonly
     * @type {*}
     */
    get canImprove() {
        const result = super.canImprove && this.$canImprove;
        return result;
    }

    /**
     * Defines the schema for a specific entity. This function merges the base schema with additional fields including domain, level, and charges. Each field has its own specifications such as type, initial value, min value, and additional properties for charges. The function returns the merged schema object with the added fields.
     *
     * @static
     * @returns {*}
     */
    static defineSchema() {
        return foundry.utils.mergeObject(
            super.defineSchema(),
            {
                config: new fields.SchemaField({
                    isImprovable: new fields.BooleanField({ initial: false }),
                    assocSkill: new fields.StringField(),
                    category: new fields.StringField(),
                    assocPhilosophy: new fields.StringField(),
                    usesCharges: new fields.BooleanField({ initial: false }),
                }),
                domain: new fields.StringField(),
                levelBase: new fields.NumberField({
                    integer: true,
                    initial: 0,
                    min: 0,
                }),
                charges: new fields.SchemaField({
                    value: new fields.NumberField({
                        integer: true,
                        initial: 0,
                        min: 0,
                    }),
                    // Note: if max charges is 0, then there is no maximum
                    max: new fields.NumberField({
                        integer: true,
                        initial: 0,
                        min: 0,
                    }),
                }),
            },
            { inplace: false },
        );
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
        this.$charges = new CONFIG.SOHL.class.ValueModifier(
            {
                properties: {
                    max: new CONFIG.SOHL.class.ValueModifier(
                        {},
                        { parent: this },
                    ),
                },
            },
            { parent: this },
        );
        if (!this.charges.usesCharges) {
            this.$charges.setDisabled("SOHL.DoesNotUseCharges", "NoChrg");
            this.$charges.max.setDisabled("SOHL.DoesNotUseCharges", "NoChrg");
        } else {
            this.$charges.setBase(this.charges.value);
            this.$charges.max.setBase(this.charges.max);
        }
        this.$level = new CONFIG.SOHL.class.ValueModifier(
            {
                properties: {
                    roman: (thisVM) => Utility.romanize(thisVM.effective),
                },
            },
            { parent: this },
        );
        this.$level.setBase(this.levelBase);
        this.$fatigue = new CONFIG.SOHL.class.ValueModifier(
            {},
            { parent: this },
        );
        this.$fatigue.setBase(this.fatigueBase);
        this.$isImprovable = this.isImprovable;
    }

    setupVirtualItems() {
        super.setupVirtualItems();
        const domain = this.domain.trim();
        if (
            this.config.category ===
                MysticalAbilityItemData.CATEGORY.ANCESTOR &&
            domain
        ) {
            /*
             * Ancestor Spirit Powers are granted as bonuses to a particular skill, whose name
             * is in the "domain" field.  We expect that such a skill must be currently available
             * as a owned item on the Actor.  If for some reason that is not the case, then we
             * we need to create a virtual skill item for that particular skill.
             */

            this.$affectedSkill = null;
            for (const it of this.actor.allItems()) {
                if (it.system instanceof SkillItemData && it.name === domain) {
                    this.$affectedSkill = it;
                    break;
                }
            }

            if (!this.$affectedSkill) {
                // The skill doesn't exist, so we need to create a stand-in skill for it.  This skill
                // will be set to ML 0.  If there is a skill already in the nested items with the exact same
                // name as requested, then we will use that as a template for the skill.
                const item = this.items.find(
                    (it) =>
                        it.system instanceof SkillItemData &&
                        it.name === domain,
                );
                let itemData = item?.toObject();

                if (!itemData) {
                    // Couldn't find the named skill in the nested items, so
                    // create a new one from scratch.
                    itemData = {
                        name: domain,
                        type: SkillItemData.TYPE_NAME,
                    };
                }

                itemData._id = foundry.utils.randomID();

                // Ensure that ML is set to 0
                foundry.utils.setProperty(
                    itemData,
                    "system.masteryLevelBase",
                    0,
                );

                // Create a new pure virtual skill as a stand-in for the missing skill
                this.$affectedSkill = new SohlItem(itemData, {
                    parent: this.actor,
                    cause: this.item,
                });
            }
        }
    }

    /** @override */
    postProcess() {
        super.postProcess();
        if (this.category === MysticalAbilityItemData.CATEGORY.ANCESTOR) {
            if (this.$affectedSkill) {
                const ml = this.$affectedSkill.system.$masteryLevel;
                let numBoosts = this.$level.effective;
                if (!ml.base) {
                    ml.setBase(this.$affectedSkill.system.skillBase.value);
                    numBoosts--;
                }
                if (numBoosts)
                    this.$affectedSkill.system.applyBoosts(numBoosts);
            }
        }
    }
}

export class PhilosophyItemData extends SohlItemData {
    /** @inheritdoc */
    static metadata = Object.freeze(
        foundry.utils.mergeObject(
            super.metadata,
            {
                name: "philosophy",
                locId: "PHILOSOPHY",
                label: "TYPES.Item.philosophy",
                labelPlural: "TYPES.Item.philosophyPl",
                iconCssClass: "fas fa-sparkle",
                img: "systems/sohl/assets/icons/sparkle.svg",
                sheet: "systems/sohl/templates/item/philosophy-sheet.html",
                nestOnly: false,
                effectKeys: {},
                subTypes: SOHL_VARIANTS,
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    static CATEGORY = Object.freeze({
        ARCANE: "arcane",
        DIVINE: "divine",
        SPIRIT: "spirit",
        ASTRAL: "astral",
        NATURAL: "natural",
    });

    get categoriesLabel() {
        const formatter = game.i18n.getListFormatter();
        const list = Utility.sortStrings(
            this.constructor.CATEGORY.values().map((v) =>
                _l(`SOHL.PHILOSOPHY.CATEGORY.${v}`),
            ),
        );
        return formatter.format(list);
    }

    static DIVINE_EMBODIMENT = Object.freeze({
        DREAMS: "dreams",
        DEATH: "death",
        VIOLENCE: "violence",
        PEACE: "peace",
        FERTILITY: "fertility",
        ORDER: "order",
        KNOWLEDGE: "knowledge",
        PROSPERITY: "prosperity",
        FIRE: "fire",
        CREATION: "creation",
        VOYAGER: "voyager",
        DECAY: "decay",
    });

    static get ELEMENT() {
        return {
            FIRE: "fire",
            WATER: "water",
            EARTH: "earth",
            SPIRIT: "spirit",
            WIND: "wind",
            METAL: "metal",
            ARCANA: "arcana",
        };
    }

    static defineSchema() {
        return foundry.utils.mergeObject(
            super.defineSchema(),
            {
                category: new fields.StringField({
                    required: true,
                    blank: false,
                    label: _l("Category"),
                    choices: PhilosophyItemData.categories,
                }),
            },
            { inplace: false },
        );
    }
}

export class DomainItemData extends SohlItemData {
    $category;

    /** @inheritdoc */
    static metadata = Object.freeze(
        foundry.utils.mergeObject(
            super.metadata,
            {
                name: "domain",
                locId: "DOMAIN",
                label: "TYPES.Item.domain",
                labelPlural: "TYPES.Item.domainPl",
                iconCssClass: "fas fa-sparkle",
                img: "systems/sohl/assets/icons/sparkle.svg",
                sheet: "systems/sohl/templates/item/domain-sheet.html",
                nestOnly: true,
                effectKeys: {},
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    static defineSchema() {
        return foundry.utils.mergeObject(
            super.defineSchema(),
            {
                abbrev: new fields.StringField({
                    initial: "",
                    label: _l("Abbreviation"),
                }),
                cusp: new fields.StringField(),
                magicMod: new fields.ArrayField(),
                embodiments: new fields.ArrayField(),
            },
            { inplace: false },
        );
    }

    prepareBaseData() {
        super.prepareBaseData();
        if (this.item.nestedIn?.system instanceof PhilosophyItemData) {
            this.$category = this.item.nestedIn.system.category;
        }
    }

    processSiblings() {
        super.processSiblings();

        if (this.$category) {
            // Load up the domain lists
            this.actor.system.$domains[this.$category] ??= [];
            this.actor.system.$domains[this.$category].push(this.item);
        }
    }
}

export class InjuryItemData extends SohlItemData {
    $healingRate;
    $bleeding;
    $injuryLevel;
    $bodyLocation;

    /** @enum */
    static SHOCK = Object.freeze({
        NONE: 0,
        STUNNED: 1,
        INCAPACITATED: 2,
        UNCONCIOUS: 3,
        KILLED: 4,
    });

    static EVENT = Object.freeze({
        NEXT_HEALING_TEST: "nexthealingtest",
    });

    static UNTREATED = Object.freeze({
        hr: 4,
        infect: true,
        impair: false,
        bleed: false,
        newInj: -1,
    });

    static INJURY_LEVELS = Object.freeze(["NA", "M1", "S2", "S3", "G4", "G5"]);

    /** @inheritdoc */
    static metadata = Object.freeze(
        foundry.utils.mergeObject(
            super.metadata,
            {
                name: "injury",
                locId: "INJURY",
                label: "TYPES.Item.injury",
                labelPlural: "TYPES.Item.injuryPl",
                iconCssClass: "fas fa-user-injured",
                img: "systems/sohl/assets/icons/injury.svg",
                sheet: "systems/sohl/templates/item/injury-sheet.html",
                nestOnly: false,
                defaultAction: SuccessTestResult.TEST_TYPE.HEAL,
                actionTypes: Object.fromEntries(
                    [
                        SuccessTestResult.TEST_TYPE.TREATMENT,
                        SuccessTestResult.TEST_TYPE.HEAL,
                        SuccessTestResult.TEST_TYPE.BLEEDINGSTOPPAGE,
                        SuccessTestResult.TEST_TYPE.BLOODLOSSADVANCE,
                    ].map((a) => SuccessTestResult.testTypes[a]),
                ),
                events: [this.EVENT.NEXT_HEALING_TEST],
                effectKeys: {
                    "system._healingRate": {
                        label: "Healing Rate",
                        abbrev: "HR",
                    },
                    "system._injuryLevel": {
                        label: "Injury Level",
                        abbrev: "InjLvl",
                    },
                },
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    static defineSchema() {
        return foundry.utils.mergeObject(
            super.defineSchema(),
            {
                injuryLevelBase: new fields.NumberField({
                    integer: true,
                    initial: 0,
                    min: 0,
                }),
                healingRateBase: new fields.NumberField({
                    integer: true,
                    initial: 0,
                    min: 0,
                }),
                aspect: new fields.StringField({
                    initial: ImpactModifier.IMPACT.BLUNT,
                    choices: Utility.getChoicesMap(
                        ImpactModifier.ASPECT,
                        "SOHL.IMPACTMODIFIER.ASPECT",
                    ),
                }),
                isTreated: new fields.BooleanField({ initial: false }),
                isBleeding: new fields.BooleanField({ initial: false }),
                bodyLocationUuid: new fields.StringField(),
            },
            { inplace: false },
        );
    }

    get nextHealingTest() {
        return this.getEvent("nextHealingTest")?.system;
    }

    treatmentTest(
        speaker,
        actor,
        token,
        character,
        {
            skipDialog = false,
            noChat = false,
            type = `${this.type}-${this.name}-treatment-test`,
            title = `${this.item.label} Treatment Test`,
            // biome-ignore lint/correctness/noUnusedVariables: <explanation>
            ...scope
        } = {},
    ) {
        ({ speaker, actor, token, character } = SohlMacro.getExecuteDefaults({
            speaker,
            actor,
            token,
            character,
            needsToken: true,
            self: this,
        }));

        // TODO - Injury Treatment Test
        ui.notifications.warn("Injury Treatment Test Not Implemented");
    }

    healTest(
        speaker,
        actor,
        token,
        character,
        {
            skipDialog = false,
            noChat = false,
            type = `${this.type}-${this.name}-heal-test`,
            title = `${this.item.label} Heal Test`,
            // biome-ignore lint/correctness/noUnusedVariables: <explanation>
            ...scope
        } = {},
    ) {
        ({ speaker, actor, token, character } = SohlMacro.getExecuteDefaults({
            speaker,
            actor,
            token,
            character,
            needsActor: true,
            self: this,
        }));

        // TODO - Injury Heal Test
        ui.notifications.warn("Injury Heal Test Not Implemented");
    }

    /** @override */
    async _preCreate(data, options, user) {
        const allowed = await super._preCreate(data, options, user);
        if (!allowed) return false;

        // Create a new event to represent the create time of the injury
        const createdItem = new SohlItem({
            name: "Created",
            type: "event",
            system: {
                tag: "created",
                transfer: false,
                activation: {
                    scope: "self",
                    startTime: game.time.worldTime,
                    oper: "indefinite",
                },
            },
        });

        const updateData = {
            nestedItems: this.nestedItems.concat(createdItem.toObject()),
        };

        if (!Object.hasOwn(options, "healTestDuration")) {
            options.healTestDuration = game.settings.get(
                "sohl",
                "healingSeconds",
            );
        }

        if (options.healTestDuration) {
            // Create a new event to represent the next heal test
            const nextHealTest = new SohlItem({
                name: "Next Heal Test",
                type: "event",
                system: {
                    tag: "nextHealingTest",
                    actionName: "healTest",
                    transfer: true,
                    activation: {
                        scope: "item",
                        startTime: game.time.worldTime,
                        duration: options.healTestDuration,
                        oper: "duration",
                    },
                },
            });
            updateData["nestedItems"].push(nextHealTest.toObject());
        }

        await this.updateSource(updateData);
        return true;
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();

        this.$healingRate = new CONFIG.SOHL.class.ValueModifier(
            {},
            { parent: this },
        );
        this.$injuryLevel = new CONFIG.SOHL.class.ValueModifier(
            {
                properties: {
                    severity: () => {
                        return "0";
                    },
                },
            },
            { parent: this },
        );

        this.$injuryLevel.setBase(this.injuryLevelBase);
        this.$healingRate.setBase(
            this.isTreated ? this.healingRateBase : this.untreatedHealing.hr,
        );
    }

    processSiblings() {
        this.$bodyLocation = this.actor.getItem(this.bodyLocationUuid);
    }

    postProcess() {
        super.postProcess();
        if (this.$healingRate.effective <= 0) this.$healingRate.disabled;
    }
}

export class AfflictionItemData extends SubtypeMixin(SohlItemData) {
    $healingRate;
    $contagionIndex;
    $level;

    static AFFLICTON_DEFEATED_HR = 6;
    static SUBJECT_DEAD_HR = 0;
    static UNDEFINED_HR = -1;
    static TRANSMISSION = Object.freeze({
        NONE: "none",
        AIRBORNE: "airborne",
        CONTACT: "contact",
        BODYFLUID: "bodyfluid",
        INJESTED: "injested",
        PROXIMITY: "proximity",
        VECTOR: "vector",
        PERCEPTION: "perception",
        ARCANE: "arcane",
        DIVINE: "divine",
        SPIRIT: "spirit",
    });

    static FATIGUE = Object.freeze({
        WINDEDNESS: "windedness",
        WEARINESS: "weariness",
        WEAKNESS: "weakness",
    });

    static PRIVATION = Object.freeze({
        ASPHIXIA: "asphixia",
        COLD: "cold",
        HEAT: "heat",
        STARVATION: "starvation",
        DEHYDRATION: "dehydration",
        SLEEP_DEPRIVATION: "nosleep",
    });

    static FEAR_LEVEL = Object.freeze({
        NONE: "none",
        BRAVE: "brave",
        STEADY: "steady",
        AFRAID: "afraid",
        TERRIFIED: "terrified",
        CATATONIC: "catatonic",
    });

    static MORALE_LEVEL = Object.freeze({
        NONE: "none",
        BRAVE: "brave",
        STEADY: "steady",
        WITHDRAWING: "withdraw",
        ROUTED: "routed",
        CATATONIC: "catatonic",
    });

    static EVENT = Object.freeze({
        NEXT_COURSE_TEST: "nextcoursetest",
        NEXT_RECOVERY_TEST: "nextrecoverytest",
    });

    /** @inheritdoc */
    static metadata = Object.freeze(
        foundry.utils.mergeObject(
            super.metadata,
            {
                name: "affliction",
                locId: "AFFLICTION",
                label: "TYPES.Item.affliction",
                labelPlural: "TYPES.Item.afflictionPl",
                iconCssClass: "fas fa-face-nauseated",
                img: "systems/sohl/assets/icons/sick.svg",
                sheet: "systems/sohl/templates/item/affliction-sheet.html",
                nestOnly: false,
                effectKeys: {},
                defaultAction: SuccessTestResult.TEST_TYPE.AFFLICTIONTRANSMIT,
                actionTypes: Object.fromEntries(
                    [
                        SuccessTestResult.TEST_TYPE.AFFLICTIONTRANSMIT,
                        SuccessTestResult.TEST_TYPE.AFFLICTIONCOURSE,
                        SuccessTestResult.TEST_TYPE.DIAGNOSIS,
                        SuccessTestResult.TEST_TYPE.TREATMENT,
                        SuccessTestResult.TEST_TYPE.HEAL,
                    ].map((a) => SuccessTestResult.testTypes[a]),
                ),
                events: [
                    this.EVENT.NEXT_COURSE_TEST,
                    this.EVENT.NEXT_RECOVERY_TEST,
                ],
                subTypes: {
                    PRIVATION: "privation",
                    FATIGUE: "fatigue",
                    DISEASE: "disease",
                    INFECTION: "infection",
                    POISONTOXIN: "poisontoxin",
                    FEAR: "fear",
                    MORALE: "morale",
                    SHADOW: "shadow",
                    PSYCHE: "psyche",
                    AURALSHOCK: "auralshock",
                },
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    static defineSchema() {
        return foundry.utils.mergeObject(
            super.defineSchema(),
            {
                isDormant: new fields.BooleanField({ initial: false }),
                isTreated: new fields.BooleanField({ initial: false }),
                diagnosisBonusBase: new fields.NumberField({
                    integer: true,
                    initial: 0,
                }),
                levelBase: new fields.NumberField({
                    integer: true,
                    initial: 0,
                    min: 0,
                }),
                healingRateBase: new fields.NumberField({
                    integer: true,
                    initial: this.UNDEFINED_HR,
                    min: this.UNDEFINED_HR,
                }),
                contagionIndexBase: new fields.NumberField({
                    integer: true,
                    initial: 0,
                    min: 0,
                }),
                transmission: new fields.StringField({
                    initial: this.TRANSMISSION.NONE,
                    required: true,
                    choices: Utility.getChoicesMap(
                        this.TRANSMISSION,
                        "SOHL.AFFLICTION.TRANSMISSION",
                    ),
                }),
            },
            { inplace: false },
        );
    }

    get nextCourseTest() {
        return this.getEvent("nextCourseTest")?.system;
    }

    get nextRecoveryTest() {
        return this.getEvent("nextRecoveryTest")?.system;
    }

    /** @override */
    async _preCreate(data, options, user) {
        const allowed = await super._preCreate(data, options, user);
        if (!allowed) return false;

        // Create a new event to represent the create time of the affliction
        const createdItem = new SohlItem({
            name: "Created",
            type: "event",
            system: {
                tag: "created",
                transfer: false,
                activation: {
                    scope: "self",
                    startTime: game.time.worldTime,
                    oper: "indefinite",
                },
            },
        });

        const updateData = {
            nestedItems: this.nestedItems.concat(createdItem.toObject()),
        };

        if (data.system.subType === "infection") {
            // Create a new event to represent the next heal test
            const nextInfectionCourseTest = new SohlItem({
                name: "Next Infection Course Test",
                type: "event",
                system: {
                    tag: "nextCourseTest",
                    actionName: "infectionCourseTest",
                    transfer: true,
                    activation: {
                        scope: "item",
                        startTime: game.time.worldTime,
                        duration: 86400, // one day
                        oper: "duration",
                    },
                },
            });
            updateData["nestedItems"].push(nextInfectionCourseTest.toObject());
        }

        if (data.system.subType === "disease") {
            // Create a new event to represent the next heal test
            const nextDiseaseCourseTest = new SohlItem({
                name: "Next Disease Course Test",
                type: "event",
                system: {
                    tag: "nextCourseTest",
                    actionName: "courseTest",
                    transfer: true,
                    activation: {
                        scope: "item",
                        startTime: game.time.worldTime,
                        duration: 86400, // one day
                        oper: "duration",
                    },
                },
            });
            updateData["nestedItems"].push(nextDiseaseCourseTest.toObject());
        }

        if (data.system.subType === "poisontoxin") {
            // Create a new event to represent the next heal test
            const nextCourseTest = new SohlItem({
                name: "Next Poison/Toxin Course Test",
                type: "event",
                system: {
                    tag: "nextCourseTest",
                    actionName: "courseTest",
                    transfer: true,
                    activation: {
                        scope: "item",
                        startTime: game.time.worldTime,
                        duration: 600, // 10 minutes
                        oper: "duration",
                    },
                },
            });
            updateData["nestedItems"].push(nextCourseTest.toObject());
        }

        await this.updateSource(updateData);
        return true;
    }

    get canTransmit() {
        // TODO - Implement Affliction canTransmit
        return true;
    }

    get canContract() {
        // TODO - Implement Affliction canContract
        return true;
    }

    get hasCourse() {
        // TODO - Implement Affliction hasCourse
        return true;
    }

    get canTreat() {
        // TODO - Implement Affliction canTreat
        return true;
    }

    get canHeal() {
        // TODO - Implement Affliction canHeal
        return true;
    }

    transmit(
        speaker,
        actor,
        token,
        character,
        {
            skipDialog = false,
            noChat = false,
            type = `${this.type}-${this.name}-transmit`,
            title = `${this.item.label} Transmit`,
            target = null,
            // biome-ignore lint/correctness/noUnusedVariables: <explanation>
            ...scope
        } = {},
    ) {
        ({ speaker, actor, token, character } = SohlMacro.getExecuteDefaults({
            speaker,
            actor,
            token,
            character,
            needsToken: true,
            self: this,
        }));
        // TODO - Affliction Transmit
        ui.notifications.warn("Affliction Transmit Not Implemented");
    }

    contractTest(
        speaker,
        actor,
        token,
        character,
        {
            skipDialog = false,
            noChat = false,
            type = `${this.type}-${this.name}-contract-test`,
            title = `${this.item.label} Contract Test`,
            // biome-ignore lint/correctness/noUnusedVariables: <explanation>
            ...scope
        } = {},
    ) {
        ({ speaker, actor, token, character } = SohlMacro.getExecuteDefaults({
            speaker,
            actor,
            token,
            character,
            needsActor: true,
            self: this,
        }));

        // TODO - Affliction Contract Test
        ui.notifications.warn("Affliction Contract Test Not Implemented");
    }

    courseTest(
        speaker,
        actor,
        token,
        character,
        {
            skipDialog = false,
            noChat = false,
            type = `${this.type}-${this.name}-course-test`,
            title = `${this.item.label} Course Test`,
            // biome-ignore lint/correctness/noUnusedVariables: <explanation>
            ...scope
        } = {},
    ) {
        ({ speaker, actor, token, character } = SohlMacro.getExecuteDefaults({
            speaker,
            actor,
            token,
            character,
            needsActor: true,
            self: this,
        }));

        // TODO - Affliction Course Test
        ui.notifications.warn("Affliction Course Test Not Implemented");
    }

    diagnosisTest(
        speaker,
        actor,
        token,
        character,
        {
            skipDialog = false,
            noChat = false,
            type = `${this.type}-${this.name}-treatment-test`,
            title = `${this.item.label} Treatment Test`,
            // biome-ignore lint/correctness/noUnusedVariables: <explanation>
            ...scope
        } = {},
    ) {
        ({ speaker, actor, token, character } = SohlMacro.getExecuteDefaults({
            speaker,
            actor,
            token,
            character,
            needsToken: true,
            self: this,
        }));

        // TODO - Affliction Diagnosis Test
        ui.notifications.warn("Affliction Diagnosis Test Not Implemented");
    }

    treatmentTest(
        speaker,
        actor,
        token,
        character,
        {
            skipDialog = false,
            noChat = false,
            type = `${this.type}-${this.name}-treatment-test`,
            title = `${this.item.label} Treatment Test`,
            // biome-ignore lint/correctness/noUnusedVariables: <explanation>
            ...scope
        } = {},
    ) {
        ({ speaker, actor, token, character } = SohlMacro.getExecuteDefaults({
            speaker,
            actor,
            token,
            character,
            needsToken: true,
            self: this,
        }));

        // TODO - Affliction Treatment Test
        ui.notifications.warn("Affliction Treatment Test Not Implemented");
    }

    healingTest(
        speaker,
        actor,
        token,
        character,
        {
            skipDialog = false,
            noChat = false,
            type = `${this.type}-${this.name}-healing-test`,
            title = `${this.item.label} Healing Test`,
            // biome-ignore lint/correctness/noUnusedVariables: <explanation>
            ...scope
        } = {},
    ) {
        ({ speaker, actor, token, character } = SohlMacro.getExecuteDefaults({
            speaker,
            actor,
            token,
            character,
            needsActor: true,
            self: this,
        }));

        // TODO - Affliction Healing Test
        ui.notifications.warn("Affliction Healing Test Not Implemented");
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
        this.$healingRate = new CONFIG.SOHL.class.ValueModifier(
            {},
            { parent: this },
        );
        if (this.healingRateBase === -1) {
            this.$healingRate.setDisabled("No Healing Rate", "NoHeal");
        } else {
            this.$healingRate.setBase(this.healingRateBase);
        }
        this.$contagionIndex = new CONFIG.SOHL.class.ValueModifier(
            {},
            { parent: this },
        ).setBase(this.contagionIndexBase);
        this.$level = new CONFIG.SOHL.class.ValueModifier(
            {},
            { parent: this },
        ).setBase(this.levelBase);
    }
}

export class TraitItemData extends SubtypeMixin(MasteryLevelItemData) {
    $valueDesc;
    $score;

    static INTENSITY = Object.freeze({
        TRAIT: "trait",
        IMPULSE: "impulse",
        DISORDER: "disorder",
        ATTRIBUTE: "attribute",
    });

    /** @inheritdoc */
    static metadata = Object.freeze(
        foundry.utils.mergeObject(
            super.metadata,
            {
                name: "trait",
                locId: "TRAIT",
                label: "TYPES.Item.trait",
                labelPlural: "TYPES.Item.traitPl",
                iconCssClass: "fas fa-user-gear",
                img: "systems/sohl/assets/icons/user-gear.svg",
                sheet: "systems/sohl/templates/item/trait-sheet.html",
                nestOnly: false,
                effectKeys: {
                    "system.$score": { label: "Score", abbrev: "Score" },
                    "system.$masteryLevel": {
                        label: "Mastery Level",
                        abbrev: "ML",
                    },
                    "system.textValue": { label: "Text", abbrev: "Text" },
                },
                subTypes: {
                    PHYSIQUE: "physique",
                    PERSONALITY: "personality",
                    TRANSCENDENT: "transcendent",
                },
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    get displayVal() {
        let result = this.textValue;
        if (this.isNumeric) {
            result = this.$score.displayVal;
        } else if (this.choices[this.textValue]) {
            result = this.choices[this.textValue];
        }
        return result;
    }

    get defaultAction() {
        if (!(this.intensity === "attribute" && this.isNumeric)) {
            return SohlItemData.prototype.defaultAction;
        }
        return super.defaultAction;
    }

    getIntrinsicActions(_data = this, defaultAction = null, actions = []) {
        if (!(this.intensity === "attribute" && this.isNumeric)) {
            return SohlItemData.prototype.getIntrinsicActions(
                _data,
                defaultAction,
                actions,
            );
        }
        return super.getIntrinsicActions(_data, defaultAction, actions);
    }

    /**
     * abbrev: short abbreviation for this trait
     * textValue: the value of this trait.  Boolean and numeric values
     *     are coerced into strings.
     * max: for numeric values, this represents the maximum value of
     *     the trait.  Not applicable to any other type.
     * isNumeric: whether the textValue should be evaluated as a number
     * intensity: the severity of the trait.  If set to "attribute", the
     *     trait is instead considered to be an attribute.
     * actionBodyParts: Which body part impairments apply to this
     *     trait. A value of "Any" indicates all body parts affect
     *     this trait.
     * valueDesc: an array defining labels describing the values of this
     *     trait.  Only applicable to numeric traits.
     * choices: A set of values representing valid choices for this trait.
     *     The textValue should be one of these choice values.
     *
     * @override
     */
    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), {
            textValue: new fields.StringField(),
            max: new fields.NumberField({
                integer: true,
                nullable: true,
                initial: null,
            }),
            isNumeric: new fields.BooleanField({ initial: false }),
            intensity: new fields.StringField({
                initial: this.INTENSITY.TRAIT,
                required: true,
                choices: Utility.getChoicesMap(
                    this.INTENSITY,
                    "SOHL.TRAIT.INTENSITY",
                ),
            }),
            valueDesc: new fields.ArrayField(
                new fields.SchemaField({
                    label: new fields.StringField({
                        blank: false,
                        required: true,
                    }),
                    maxValue: new fields.NumberField({
                        integer: true,
                        required: true,
                        initial: 0,
                    }),
                }),
            ),
            choices: new fields.ObjectField(),
        });
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
        this.$valueDesc = this.valueDesc
            .concat()
            .sort((a, b) => a.maxValue - b.maxValue);
        this.$score = new CONFIG.SOHL.class.ValueModifier(
            {
                properties: {
                    valueDesc: (thisVM) => {
                        let desc = "";
                        const len = this.$valueDesc.length;
                        for (let i = 0; !desc && i < len; i++) {
                            if (
                                thisVM.effective <= this.$valueDesc[i].maxValue
                            ) {
                                desc = this.$valueDesc[i].label;
                                break;
                            }
                        }
                        return desc;
                    },
                    max: this.max,
                    displayVal: (thisVM) => {
                        let result = thisVM.effective;
                        const traitDesc = thisVM.valueDesc;
                        if (traitDesc) result += ` (${traitDesc})`;
                        if (typeof thisVM.max === "number") {
                            result += ` [max: ${thisVM.max}]`;
                        }
                        return result;
                    },
                },
            },
            { parent: this },
        );

        if (this.isNumeric) {
            const scoreVal = Number.parseInt(this.textValue, 10);
            this.$score.setBase(scoreVal);
            if (this.intensity === "attribute") {
                this.$masteryLevel.setEnabled();
                this.$masteryLevel.fate.setEnabled();
                this.$masteryLevel.setBase(scoreVal * 5);
            }
            this.$skillBase = new SkillBase(this.skillBaseFormula, [this]);
        } else {
            this.$score.setDisabled(
                "Non-numeric traits don't have Score",
                "NoScr",
            );
            this.$masteryLevel.setDisabled(
                "Non-numeric traits don't have ML",
                "NoML",
            );
            this.$masteryLevel.fate.setDisabled(
                "Non-numeric traits don't have Fate",
                "NoFate",
            );
        }
    }

    processSiblings() {
        super.processSiblings();
        if (this.abbrev === "ss") {
            const magicDomain = this.actor.itemTypes.domain.find(
                (it) => it.system.abbrev === this.textValue,
            );
            this.actor.system.$magicMod = magicDomain?.system.magicMod || {};
        }
    }

    /** @override */
    postProcess() {
        super.postProcess();
        if (this.intensity === "attribute") {
            // Various conditions (e.g., spells) can change the attribute score.
            // If the score has been modified, then update
            // all of the skills depending on that score in their SB formula.
            if (this.$score.modifier) {
                const newBase = Math.max(
                    0,
                    Math.trunc(this.$score.effective) * 5,
                );
                this.$masteryLevel.setBase(newBase);

                // For each occurrence of an attribute in the SB Formula, increase the ML
                // by 5 x the score difference from the base score.
                for (const it of this.actor.allItems()) {
                    if (it.system.isMasteryLevelItemData) {
                        const attributes = it.system.skillBase.attributes;
                        if (attributes.includes(this.item.name)) {
                            const numOccurances = attributes.filter(
                                (a) => a === this.item.name,
                            ).length;
                            it.system.$masteryLevel.add(
                                CONST.SOHL.MOD.MLATTRBOOST
                                    .name`${this.abbr}Inc`,
                                this.$score.modifier * numOccurances * 5,
                                { attr: this.item.name },
                            );
                        }
                    }
                }
            }
        } else {
            this.$masteryLevel.setDisabled(CONST.SOHL.MOD.NOTATTRNOML);
        }

        if (this.abbrev === "fate") {
            if (this.actor.system.$magicMod.spirit) {
                this.$masteryLevel.add(
                    CONFIG.SOHL.MOD.SSMOD,
                    this.actor.system.$magicMod.spirit,
                );
            }
        }
    }
}

export class SkillItemData extends SubtypeMixin(MasteryLevelItemData) {
    static COMBAT = Object.freeze({
        NONE: "none",
        ALL: "all",
        MELEE: "melee",
        MISSILE: "missile",
        MELEEMISSILE: "meleemissile",
        MANEUVER: "maneuver",
        MELEEMANEUVER: "meleemaneuver",
    });

    /** @inheritdoc */
    static metadata = Object.freeze(
        foundry.utils.mergeObject(
            super.metadata,
            {
                name: "skill",
                locId: "SKILL",
                label: "TYPES.Item.skill",
                labelPlural: "TYPES.Item.skillPl",
                iconCssClass: "fas fa-head-side-gear",
                img: "systems/sohl/assets/icons/head-gear.svg",
                sheet: "systems/sohl/templates/item/skill-sheet.html",
                nestOnly: false,
                effectKeys: {},
                subTypes: {
                    SOCIAL: "social",
                    NATURE: "nature",
                    CRAFT: "craft",
                    LORE: "lore",
                    LANGUAGE: "language",
                    SCRIPT: "script",
                    RITUAL: "ritual",
                    PHYSICAL: "physical",
                    COMBAT: "combat",
                    ESOTERIC: "esoteric",
                },
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    get magicMod() {
        let mod;
        switch (this.subType) {
            case this.SUBTYPE.SOCIAL:
                mod = this.actor.system.$magicMod.water;
                break;
            case this.SUBTYPE.NATURE:
                mod = this.actor.system.$magicMod.earth;
                break;
            case this.SUBTYPE.CRAFT:
                mod = this.actor.system.$magicMod.metal;
                break;
            case this.SUBTYPE.LORE:
                mod = this.actor.system.$magicMod.spirit;
                break;
            case this.SUBTYPE.LANGUAGE:
                mod = this.actor.system.$magicMod.social;
                break;
            case this.SUBTYPE.SCRIPT:
                mod = this.actor.system.$magicMod.lore;
                break;
            case this.SUBTYPE.RITUAL:
                mod = this.actor.system.$magicMod.lore;
                break;
            case this.SUBTYPE.PHYSICAL:
                mod = this.actor.system.$magicMod.air;
                break;
            case this.SUBTYPE.COMBAT:
                mod = this.actor.system.$magicMod.fire;
                break;
        }
        return mod || 0;
    }

    /**
     * weaponGroup: the type of combat weapon this skill applies to
     * actionBodyParts: Which body part impairments apply to this
     *     skill. A value of "Any" indicates all body parts affect
     *     this skill.
     *
     * @override
     */
    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), {
            weaponGroup: new fields.StringField({
                initial: this.COMBAT.NONE,
                blank: false,
                choices: Utility.getChoicesMap(
                    this.COMBAT,
                    "SOHL.SKILL.COMBAT",
                ),
            }),
            baseSkill: new fields.StringField(),
            domain: new fields.StringField(),
        });
    }

    prepareBaseData() {
        super.prepareBaseData();
        if (this.abbrev === "init") {
            this.actor.system.$initiativeRank = this.masteryLevelBase || 0;
        }
    }
}

export class AffiliationItemData extends SohlItemData {
    /** @inheritdoc */
    static metadata = Object.freeze(
        foundry.utils.mergeObject(
            super.metadata,
            {
                name: "affiliation",
                locId: "AFFILIATION",
                label: "TYPES.Item.affiliation",
                labelPlural: "TYPES.Item.affiliationPl",
                iconCssClass: "fa-duotone fa-people-group",
                img: "systems/sohl/assets/icons/people-group.svg",
                sheet: "systems/sohl/templates/item/affiliation-sheet.html",
                nestOnly: false,
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    static defineSchema() {
        return foundry.utils.mergeObject(
            super.defineSchema(),
            {
                society: new fields.StringField(),
                office: new fields.StringField(),
                title: new fields.StringField(),
                level: new fields.NumberField({
                    integer: true,
                    initial: 0,
                    min: 0,
                }),
            },
            { inplace: false },
        );
    }
}

export class AnatomyItemData extends SohlItemData {
    $sum;

    /** @inheritdoc */
    static metadata = Object.freeze(
        foundry.utils.mergeObject(
            super.metadata,
            {
                name: "anatomy",
                locId: "ANATOMY",
                label: "TYPES.Item.anatomy",
                labelPlural: "TYPES.Item.anatomyPl",
                iconCssClass: "fas fa-person",
                img: "systems/sohl/assets/icons/person.svg",
                sheet: "systems/sohl/templates/item/anatomy-sheet.html",
                nestOnly: false,
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );
}

export class BodyZoneItemData extends SohlItemData {
    $bodyParts;

    /** @inheritdoc */
    static metadata = Object.freeze(
        foundry.utils.mergeObject(
            super.metadata,
            {
                name: "bodyzone",
                locId: "BODYZONE",
                label: "TYPES.Item.bodyzone",
                labelPlural: "TYPES.Item.bodyzonePl",
                iconCssClass: "fa-duotone fa-person",
                img: "systems/sohl/assets/icons/person.svg",
                sheet: "systems/sohl/templates/item/bodyzone-sheet.html",
                nestOnly: true,
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), {
            abbrev: new fields.StringField(),
        });
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
        this.$bodyParts = [];
    }

    processSiblings() {
        super.processSiblings();

        // Body Zone Items should never show up under the actor's "owned" items, they should always be
        // virtual items nested within an Anatomy item.  But let's just ensure that if this is not the
        // case we abandon processing immediately.
        if (this.actor && !this.item.isNested) {
            console.warn(
                `Item ${this.uuid} is a BodyZone that is not nested in an Anatomy, please correct this`,
            );
        }

        this.$bodyParts = [];
        for (const it of this.actor.allItems()) {
            if (it.system instanceof BodyPartItemData) {
                if (it.nestedIn?.id === this.id) {
                    this.$bodyParts.push(it);
                }
            }
        }
    }
}

export class BodyPartItemData extends SohlItemData {
    $heldItem;
    $bodyLocations;
    $health;

    /** @inheritdoc */
    static metadata = Object.freeze(
        foundry.utils.mergeObject(
            super.metadata,
            {
                name: "bodypart",
                locId: "BODYPART",
                label: "TYPES.Item.bodypart",
                labelPlural: "TYPES.Item.bodypartPl",
                iconCssClass: "fa-duotone fa-skeleton-ribs",
                img: "systems/sohl/assets/icons/ribcage.svg",
                sheet: "systems/sohl/templates/item/bodypart-sheet.html",
                nestOnly: true,
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), {
            abbrev: new fields.StringField(),
            canHoldItem: new fields.BooleanField({ initial: false }),
            heldItemId: new fields.StringField(),
        });
    }

    /** @override */
    processSiblings() {
        super.processSiblings();

        // Body Part Items should never show up under the actor's "owned" items, they should always be
        // virtual items nested within a BodyZone item.  But let's just ensure that if this is not the
        // case we abandon processing immediately.
        if (this.actor && !this.item.isNested) {
            console.warn(
                `Item ${this.uuid} is a BodyPart that is not nested in a BodyZone, please correct this`,
            );
        }

        this.$bodyLocations = [];
        for (const it of this.actor.allItems()) {
            if (it.system instanceof BodyLocationItemData) {
                if (it.cause?.id === this.id) {
                    this.$bodyLocations.push(it);
                }
            }
        }

        this.$heldItem =
            this.canHoldItem &&
            this.heldItemId &&
            this.actor.items.find((it) => it.id === this.heldItemId);

        if (this.$heldItem) {
            this.$heldItem.system.$isHeldBy.push(this.item);
        }
    }

    /** @override */
    postProcess() {
        super.postProcess();
        /*
         * Check all held items to ensure they still exist and are carried,
         * otherwise drop the item from the body part.
         */
        if (this.$heldItem?.system instanceof GearItemData) {
            if (this.$heldItem.system.isCarried) {
                this.$heldItem.system.$isHeldBy.push(this.item.id);
            } else {
                const heldItemType =
                    SohlItem.types[this.$heldItem.type].constructor.metadata
                        .label;
                ui.notifications.warn(
                    _l("SOHL.BODYPART.NotCarriedWarning", {
                        heldItemType,
                        heldItemName: this.$heldItem.name,
                        itemName: this.item.name,
                    }),
                );
                this.update({ "system.heldItem": "" });
            }
        }
    }
}

export class BodyLocationItemData extends SohlItemData {
    $protection;
    $layers;
    $traits;

    /** @inheritdoc */
    static metadata = Object.freeze(
        foundry.utils.mergeObject(
            super.metadata,
            {
                name: "bodylocation",
                locId: "BODYLOCATION",
                label: "TYPES.Item.bodylocation",
                labelPlural: "TYPES.Item.bodylocationPl",
                iconCssClass: "fa-solid fa-hand",
                img: "systems/sohl/assets/icons/hand.svg",
                sheet: "systems/sohl/templates/item/bodylocation-sheet.html",
                effectKeys: Object.fromEntries(
                    Object.values(ImpactModifier.ASPECT).map((v) => [
                        `system.armorBase.${v}`,
                        { label: `SOHL.IMPACTMODIFIER.ASPECT.${v}`, abbrev: v },
                    ]),
                ),
                nestOnly: true,
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), {
            abbrev: new fields.StringField(),
        });
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
        this.$protection = {};
        this.$layers = "";
        this.$traits = {
            isRigid: false,
        };
    }

    /** @override */
    processSiblings() {
        super.processSiblings();

        // Body Location Items should never show up under the actor's "owned" items, they should always be
        // virtual items nested within a BodyPart item.  But let's just ensure that if this is not the
        // case we abandon processing immediately.
        if (this.actor && !this.item.isNested) {
            console.warn(
                `Item ${this.uuid} is a Body Location that is not nested in a Body Part, please correct this`,
            );
        }
    }
}

export class MysticalDeviceItemData extends SohlItemData {
    static CATEGORY = Object.freeze({
        ARTIFACT: "artifact",
        ANCESTOR_TALISMAN: "ancestortalisman",
        TOTEM_TALISMAN: "totemtalisman",
        REMNANT: "remnant",
        RELIC: "relic",
    });

    /** @inheritdoc */
    static metadata = Object.freeze(
        foundry.utils.mergeObject(
            super.metadata,
            {
                name: "mysticaldevice",
                locId: "MYSTICALDEVICE",
                label: "TYPES.Item.mysticaldevice",
                labelPlural: "TYPES.Item.mysticaldevicePl",
                iconCssClass: "fas fa-wand-sparkles",
                img: "systems/sohl/assets/icons/magic-wand.svg",
                sheet: "systems/sohl/templates/item/mysticaldevice-sheet.html",
                effectKeys: {},
                nestOnly: true,
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), {
            config: new fields.SchemaField({
                requiresAttunement: new fields.BooleanField({ initial: false }),
                usesVolition: new fields.BooleanField({ initial: false }),
                category: new fields.StringField({
                    required: true,
                    initial: this.CATEGORY.ARTIFACT,
                    choices: Utility.getChoicesMap(
                        this.CATEGORY,
                        "SOHL.MYSTICALDEVICE.CATEGORY",
                    ),
                }),
                assocPhilosophy: new fields.StringField(),
            }),
            domain: new fields.StringField(),
            isAttuned: new fields.BooleanField({ initial: false }),
            volition: new fields.SchemaField({
                ego: new fields.NumberField({
                    integer: true,
                    initial: 0,
                    min: 0,
                }),
                morality: new fields.NumberField({
                    integer: true,
                    initial: 0,
                    min: 0,
                }),
                purpose: new fields.StringField(),
            }),
        });
    }
}

export class GearItemData extends SohlItemData {
    _totalWeight;
    $weight;
    $value;
    $quality;
    $durability;
    $isHeldBy;
    $skillItem;
    $traits;

    static TYPE = Object.freeze({
        MISC: MiscGearItemData.TYPE_NAME,
        CONTAINER: ContainerGearItemData.TYPE_NAME,
        ARMOR: ArmorGearItemData.TYPE_NAME,
        WEAPON: WeaponGearItemData.TYPE_NAME,
        PROJECTILE: ProjectileGearItemData.TYPE_NAME,
        CONCOCTION: ConcoctionGearItemData.TYPE_NAME,
    });

    /** @inheritdoc */
    static metadata = Object.freeze(
        foundry.utils.mergeObject(
            super.metadata,
            {
                locId: "GEAR",
                effectKeys: {
                    "system.$value": { label: "Value", abbrev: "Val" },
                    "system.$weight": { label: "Weight", abbrev: "Wt" },
                    "system.$quality": { label: "Quality", abbrev: "Qal" },
                    "system.$durability": {
                        label: "Durability",
                        abbrev: "Dur",
                    },
                },
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    static get mods() {
        return foundry.utils.mergeObject(super.mods, {
            Durability: { name: "Durability", abbrev: "Dur" },
        });
    }

    get container() {
        return this.nestedIn instanceof ContainerGearItemData
            ? this.nestedIn
            : null;
    }

    get totalWeight() {
        return this._totalWeight;
    }

    get equipped() {
        return false;
    }

    get isHeld() {
        return !!this.$isHeldBy.length;
    }

    static defineSchema() {
        return foundry.utils.mergeObject(
            super.defineSchema(),
            {
                abbrev: new fields.StringField(),
                quantity: new fields.NumberField({
                    integer: true,
                    initial: 1,
                    min: 0,
                }),
                weightBase: new fields.NumberField({
                    initial: 0,
                    min: 0,
                }),
                valueBase: new fields.NumberField({
                    initial: 0,
                    min: 0,
                }),
                isCarried: new fields.BooleanField({ initial: true }),
                isEquipped: new fields.BooleanField({ initial: false }),
                qualityBase: new fields.NumberField({
                    integer: true,
                    initial: 0,
                    min: 0,
                }),
                durabilityBase: new fields.NumberField({
                    integer: true,
                    initial: 0,
                    min: 0,
                }),
            },
            { inplace: false },
        );
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
        this.$isHeldBy = [];
        this.$skillItem = null;
        this.$value = new CONFIG.SOHL.class.ValueModifier({}, { parent: this });
        this.$value.setBase(this.valueBase);
        this.$weight = new CONFIG.SOHL.class.ValueModifier(
            {},
            { parent: this },
        );
        this.$weight.setBase(this.weightBase);
        this.$quality = new CONFIG.SOHL.class.ValueModifier(
            {},
            { parent: this },
        );
        this.$quality.setBase(this.qualityBase);
        this.$durability = new CONFIG.SOHL.class.ValueModifier(
            {},
            { parent: this },
        );
        this.$durability.setBase(this.durabilityBase);
        this._totalWeight = new CONFIG.SOHL.class.ValueModifier(
            {},
            { parent: this },
        );

        // If the gear is inside of a container, then the "carried"
        // flag is inherited from the container.
        if (this.nestedIn) {
            this.isCarried = this.nestedIn.system.isCarried;

            // Anything in a container is unequipped automatically
            this.isEquipped = false;
        }

        this.isEquipped &&= this.isCarried;
    }

    /** @override */
    prepareDerivedData() {
        super.prepareDerivedData();
        const baseWeight = this.isCarried
            ? Utility.maxPrecision(this.quantity * this.$weight.effective, 2)
            : 0;
        this._totalWeight.setBase(baseWeight);

        // Add quality to durability
        if (this.$quality.effective) {
            this.$durability.add(
                GearItemData.mods.Durability.name,
                GearItemData.mods.Durability.abbrev,
                this.$quality.effective,
            );
        }
    }
}

export class ConcoctionGearItemData extends SubtypeMixin(GearItemData) {
    static POTENCY = Object.freeze({
        NOT_APPLICABLE: "na",
        MILD: "mild",
        STRONG: "strong",
        GREAT: "great",
    });

    /** @inheritdoc */
    static metadata = Object.freeze(
        foundry.utils.mergeObject(
            super.metadata,
            {
                name: "concoctiongear",
                locId: "CONCOCTIONGEAR",
                label: "TYPES.Item.concoctiongear",
                labelPlural: "TYPES.Item.concoctiongearPl",
                iconCssClass: "fas fa-flask-round-potion",
                img: "systems/sohl/assets/icons/potion.svg",
                sheet: "systems/sohl/templates/item/concoctiongear-sheet.html",
                effectKeys: {},
                subTypes: {
                    MUNDANE: "mundane",
                    EXOTIC: "exotic",
                    ELIXIR: "elixir",
                },
                nestOnly: false,
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), {
            potency: new fields.StringField({
                initial: this.POTENCY.NOT_APPLICABLE,
                required: true,
                choices: Utility.getChoicesMap(
                    this.POTENCY,
                    "SOHL.CONCOCTION.POTENCY",
                ),
            }),
            strength: new fields.NumberField({
                integer: true,
                initial: 0,
                min: 0,
            }),
        });
    }
}

export class MiscGearItemData extends GearItemData {
    /** @inheritdoc */
    static metadata = Object.freeze(
        foundry.utils.mergeObject(
            super.metadata,
            {
                name: "miscgear",
                locId: "MISCGEAR",
                label: "TYPES.Item.miscgear",
                labelPlural: "TYPES.Item.miscgearPl",
                iconCssClass: "fas fa-ball-pile",
                img: "systems/sohl/assets/icons/miscgear.svg",
                sheet: "systems/sohl/templates/item/miscgear-sheet.html",
                effectKeys: {},
                nestOnly: false,
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );
}

export class ContainerGearItemData extends GearItemData {
    $capacity;

    static STATUS = Object.freeze({
        OK: 0,
        OVER_ENCUMBERED: 1,
        OVER_MAX: 2,
    });

    /** @inheritdoc */
    static metadata = Object.freeze(
        foundry.utils.mergeObject(
            super.metadata,
            {
                name: "containergear",
                locId: "CONTAINERGEAR",
                label: "TYPES.Item.containergear",
                labelPlural: "TYPES.Item.containergearPl",
                iconCssClass: "fas fa-sack",
                img: "systems/sohl/assets/icons/sack.svg",
                sheet: "systems/sohl/templates/item/containergear-sheet.html",
                effectKeys: {},
                nestOnly: false,
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), {
            maxCapacityBase: new fields.NumberField({
                integer: true,
                initial: 0,
                min: 0,
            }),
        });
    }

    /** @override */
    prepareBaseData() {
        class CapacityModifier extends ValueModifier {
            static defineSchema() {
                return foundry.utils.mergeObject(super.defineSchema(), {
                    max: new fields.NumberField({
                        initial: 0,
                        min: 0,
                    }),
                    value: new SohlFunctionField({
                        initial: (thisVM) => {
                            return Math.round(thisVM.effective * 1000) / 1000;
                        },
                    }),
                    status: new SohlFunctionField({
                        initial: (thisVM) => {
                            if (
                                thisVM.parent.totalWeight.modifier >
                                thisVM.max.effective
                            ) {
                                return this.STATUS.OVER_MAX;
                            } else {
                                return this.STATUS.OK;
                            }
                        },
                    }),
                });
            }
        }

        super.prepareBaseData();
        this.$capacity = new CapacityModifier({}, { parent: this });
        this.$capacity.max.setBase(this.maxCapacityBase);
    }

    calcContentWeight() {
        this.items.forEach((it) => {
            if (it.system instanceof GearItemData) {
                if (it.system instanceof ContainerGearItemData) {
                    it.system.calcContentWeight();
                }

                this.totalWeight.add(
                    CONFIG.SOHL.MOD.ITEMWT.name`${this.abbrev}Wt`,
                    it.system.totalWeight.effective,
                    { item: this.name },
                );
            }
        });
    }

    /** @override */
    postProcess() {
        super.postProcess();
        this.calcContentWeight();
    }
}

export class ArmorGearItemData extends GearItemData {
    $protection;
    $traits;

    /** @inheritdoc */
    static metadata = Object.freeze(
        foundry.utils.mergeObject(
            super.metadata,
            {
                name: "armorgear",
                locId: "ARMORGEAR",
                label: "TYPES.Item.armorgear",
                labelPlural: "TYPES.Item.armorgearPl",
                iconCssClass: "fas fa-shield-halved",
                img: "systems/sohl/assets/icons/armor.svg",
                sheet: "systems/sohl/templates/item/armorgear-sheet.html",
                effectKeys: {},
                nestOnly: false,
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    get equipped() {
        return this.isEquipped;
    }

    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), {
            material: new fields.StringField(),
            locations: new fields.SchemaField({
                flexible: new fields.ArrayField(new fields.StringField()),
                rigid: new fields.ArrayField(new fields.StringField()),
            }),
        });
    }

    processSiblings() {
        super.processSiblings();
        this.$protection = {};
        this.$traits = {};
    }
}

export class WeaponGearItemData extends GearItemData {
    $heldBy;
    $heldByFavoredPart;

    /** @inheritdoc */
    static metadata = Object.freeze(
        foundry.utils.mergeObject(
            super.metadata,
            {
                name: "weapongear",
                locId: "WEAPONGEAR",
                label: "TYPES.Item.weapongear",
                labelPlural: "TYPES.Item.weapongearPl",
                iconCssClass: "fas fa-sword",
                img: "systems/sohl/assets/icons/sword.svg",
                sheet: "systems/sohl/templates/item/weapongear-sheet.html",
                effectKeys: {},
                nestOnly: false,
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), {
            lengthBase: new fields.NumberField({
                integer: true,
                initial: 0,
                min: 0,
            }),
        });
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
        this.$heldBy = [];
        this.$heldByFavoredPart = false;
    }

    /** @override */
    processSiblings() {
        super.processSiblings();
        let favParts = this.actor.getTraitByAbbrev("favparts");
        favParts &&= favParts.system.textValue.split(",").map((v) => v.trim());
        this.$heldByFavoredPart = false;
        this.$heldBy = this.actor.itemTypes[BodyPartItemData.TYPE_NAME].reduce(
            (ary, it) => {
                if (it.system.heldItemId === this.item.id) {
                    ary.push(it);
                    this.$heldByFavoredPart ||= favParts.includes(it.name);
                }
                return ary;
            },
            [],
        );
    }
}

export class ProjectileGearItemData extends SubtypeMixin(GearItemData) {
    $traits;
    $attack;
    $impact;

    /** @inheritdoc */
    static metadata = Object.freeze(
        foundry.utils.mergeObject(
            super.metadata,
            {
                name: "projectilegear",
                locId: "PROJECTILEGEAR",
                label: "TYPES.Item.projectilegear",
                labelPlural: "TYPES.Item.projectilegearPl",
                iconCssClass: "fas fa-bow-arrow",
                img: "systems/sohl/assets/icons/arrow.svg",
                sheet: "systems/sohl/templates/item/projectilegear-sheet.html",
                effectKeys: {
                    "system.$traits.blunt": {
                        label: "Blunt Impact",
                        abbrev: "ProjBlunt",
                    },
                    "system.$traits.bleed": {
                        label: "Bleeding",
                        abbrev: "ProjBld",
                    },
                },
                subTypes: {
                    NONE: "none",
                    ARROW: "arrow",
                    BOLT: "bolt",
                    BULLET: "bullet",
                    DART: "dart",
                    OTHER: "other",
                },
                nestOnly: false,
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), {
            shortName: new fields.StringField(),
            impactBase: new fields.SchemaField({
                numDice: new fields.NumberField({
                    integer: true,
                    initial: 0,
                    min: 0,
                }),
                die: new fields.NumberField({
                    integer: true,
                    initial: 6,
                    min: 1,
                }),
                modifier: new fields.NumberField({
                    integer: true,
                    initial: -1,
                    min: -1,
                }),
                aspect: new fields.StringField({
                    initial: ImpactModifier.ASPECT.BLUNT,
                    requried: true,
                    choices: Utility.getChoicesMap(
                        ImpactModifier.ASPECT,
                        "SOHL.IMPACTMODIFIER.ASPECT",
                    ),
                }),
            }),
        });
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
        this.$traits = {
            impactTA: 0,
            halfImpact: false,
            extraBleedRisk: false,
        };
        this.$attack = new CONFIG.SOHL.class.CombatModifier(
            {},
            { parent: this },
        );
        this.$impact = new CONFIG.SOHL.class.ImpactModifier(
            {
                properties: {
                    numDice: this.impactBase.numDice,
                    die: this.impactBase.die,
                    aspect: this.impactBase.aspect,
                },
            },
            { parent: this },
        );
        this.$impact.setBase(this.impactBase.modifier);
    }
}

export class EventItemData extends SohlItemData {
    $targetUuid;

    static TERM = Object.freeze({
        DURATION: "duration",
        INDEFINITE: "indefinite",
        PERMANENT: "permanent",
        IMMEDIATE: "immediate",
    });

    static ACTION_SCOPE = Object.freeze({
        SELF: "self",
        ITEM: "item",
        ACTOR: "actor",
        OTHER: "other",
    });

    /** @inheritdoc */
    static metadata = Object.freeze(
        foundry.utils.mergeObject(
            super.metadata,
            {
                name: "event",
                locId: "EVENT",
                label: "TYPES.Item.event",
                labelPlural: "TYPES.Item.eventPl",
                iconCssClass: "fas fa-gear",
                img: "systems/sohl/assets/icons/gear.svg",
                sheet: "systems/sohl/templates/item/event-sheet.html",
                effectKeys: {},
                nestOnly: false,
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    static AUTO_RESTART = Object.freeze({
        NEVER: "never",
        ONCE: "once",
        ALWAYS: "always",
    });

    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), {
            tag: new fields.StringField(),
            actionName: new fields.StringField(),
            isEnabled: new fields.BooleanField({ initial: true }),
            activation: new fields.SchemaField({
                scope: new fields.StringField({
                    initial: this.ACTION_SCOPE.SELF,
                    required: true,
                    choices: Utility.getChoicesMap(
                        this.ACTION_SCOPE,
                        "SOHL.EVENT.ACTION_SCOPE",
                    ),
                }),
                targetUuid: new fields.StringField(),
                duration: new fields.NumberField({
                    integer: true,
                    nullable: true,
                    initial: null,
                    min: 0,
                }),
                startTime: new fields.NumberField({
                    integer: true,
                    initial: Number.MAX_SAFE_INTEGER,
                    min: 0,
                }),
                term: new fields.StringField({
                    initial: this.TERM.INDEFINITE,
                    required: true,
                    choices: Utility.getChoicesMap(
                        this.TERM,
                        "SOHL.EVENT.TERM",
                    ),
                }),
                autoRestart: new fields.StringField({
                    initial: this.AUTO_RESTART.NEVER,
                    required: true,
                    choices: Utility.getChoicesMap(
                        this.AUTO_RESTART,
                        "SOHL.EVENT.AUTO_RESTART",
                    ),
                }),
            }),
        });
    }

    get target() {
        let result;
        switch (this.activation.scope) {
            case "self":
                result = this.item;
                break;

            case "item":
                result = this.item.nestedIn;
                break;

            case "actor":
                result = this.item.actor;
                break;

            case "other":
                result = fromUuidSync(this.$targetUuid);
                break;
        }
        return result;
    }

    get started() {
        return (
            this.isEnabled && this.activation.startTime <= game.time.worldTime
        );
    }

    get startTime() {
        return {
            worldDate: EventItemData.getWorldDateLabel(
                this.activation.startTime,
            ),
            time: this.activation.startTime,
        };
    }

    get activateTime() {
        let worldDate;
        let time;
        if (this.activation.term === EventItemData.TERM.INDEFINITE) {
            worldDate = "Indefinite";
            time = Number.MAX_SAFE_INTEGER;
        } else if (this.activation.term === EventItemData.TERM.IMMEDIATE) {
            worldDate = EventItemData.getWorldDateLabel(game.time.worldTime);
            time = game.time.worldTime;
        } else {
            const activateTime =
                this.activation.startTime + this.activation.duration;
            worldDate = EventItemData.getWorldDateLabel(activateTime);
            time = activateTime;
        }
        return { worldDate, time };
    }

    get totalDuration() {
        let label, value;
        if (this.activation.term === EventItemData.TERM.INDEFINITE) {
            label = "Indefinite";
            value = Number.MAX_SAFE_INTEGER;
        } else if (this.activation.term === EventItemData.TERM.IMMEDIATE) {
            label = "Now";
            value = 0;
        } else {
            label = Utility.formatDuration(this.activation.duration);
            value = this.activation.duration;
        }
        return { label, value };
    }

    get remainingDuration() {
        let label, value;
        if (!this.started) {
            label = "Not Initiated";
            value = 0;
        } else if (this.activation.term === EventItemData.TERM.INDEFINITE) {
            label = "Indefinite";
            value = Number.MAX_SAFE_INTEGER;
        } else if (this.activation.term === EventItemData.TERM.IMMEDIATE) {
            label = "Now";
            value = 0;
        } else {
            const duration = Math.max(
                0,
                this.activateTime.time - game.time.worldTime,
            );
            label = Utility.formatDuration(duration);
            value = duration;
        }
        return { label, value };
    }

    get elapsedDuration() {
        const duration = game.time.worldTime - this.activation.startTime;
        let label, value;
        if (!this.started) {
            label = "Not Initiated";
            value = 0;
        } else {
            value = Math.max(0, duration);
            label = Utility.formatDuration(duration);
        }
        return { label, value };
    }

    /**
     * Encode the time using the in-world calendar, "Indefinite"
     * if time is 0, or "No Calendar" if an in-world calendar is not defined
     *
     * @param {number} time in-world seconds since the start of the game
     * @returns {string} the current calendar time formatted
     *                   like "13 Nolus TR720 13:42:10", or "Indefinite" if time is 0
     */
    static getWorldDateLabel(time) {
        let worldDateLabel = "No Calendar";
        if (SOHL.hasSimpleCalendar) {
            const ct = SimpleCalendar.api.timestampToDate(time);
            worldDateLabel = `${ct.display.day} ${ct.display.monthName} ${ct.display.yearPrefix}${ct.display.year}${ct.display.yearPostfix} ${ct.display.time}`;
        }
        return worldDateLabel;
    }

    static _start(item, { time = game.time.worldTime } = {}) {
        const updateData = {
            "system.activation.startTime": time,
            "system.isEnabled": true,
        };

        if (item.system.activation.autoRestart === this.AUTO_RESTART.ONCE) {
            updateData["system.activation.autoRestart"] =
                this.AUTO_RESTART.NEVER;
        }

        return updateData;
    }

    async start({ time = game.time.worldTime } = {}) {
        const updateData = EventItemData._start(this.item, { time });
        return await this.item.update(updateData);
    }

    async stop() {
        const updateData = {
            "system.isEnabled": false,
        };
        return await this.item.update(updateData);
    }

    async checkAndExecute() {
        if (!this.started || !this.isEnabled) return false;

        let isActivated = false;
        switch (EventItemData.operators[this.activation.oper]) {
            case this.constructor.TERM.DURATION:
                isActivated = !this.remainingDuration.value;
                break;

            case this.constructor.TERM.INDEFINITE:
                isActivated = false;
                break;

            case this.constructor.TERM.IMMEDIATE:
                isActivated = true;
                break;

            default:
                throw new Error(`Invalid operator ${this.activation.oper}`);
        }

        if (isActivated) {
            const target = this.target;
            if (!target) {
                throw new Error(`Target not found`);
            }
            await target.system.execute(this.actionName);
            let updateData = [];
            if (
                this.activation.autoRestart === EventItemData.AUTO_RESTART.NEVER
            ) {
                await this.item.delete();
            } else {
                updateData = EventItemData._start(this.item);
                if (
                    this.activation.autoRestart ===
                    EventItemData.AUTO_RESTART.ONCE
                ) {
                    updateData["system.activation.autoRestart"] =
                        EventItemData.AUTO_RESTART.NEVER;
                }
            }
            updateData["system.isEnabled"] = false;
            return await this.item.update(updateData);
        }

        return isActivated;
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
        switch (this.activation.scope) {
            case "self":
                this.$targetUuid = this.item.uuid;
                break;

            case "item":
                this.$targetUuid = this.item.nestedIn?.uuid;
                break;

            case "actor":
                this.$targetUuid = this.item.actor?.uuid;
                break;

            case "other":
                this.$targetUuid = this.activation.targetUuid;
                break;
        }
    }
}

export class SkillBase {
    _attrs;
    _formula;
    _sunsigns;
    _parsedFormula;
    _value;

    constructor(formula, { items = null, sunsign = null } = {}) {
        if (!formula) {
            this._formula = null;
            this._attrs = {};
            this._sunsigns = [];
        }

        if (items && !(Symbol.iterator in Object(items))) {
            throw new Error("items must be iterable");
        }

        this._formula = formula || null;
        this._attrs = {};
        this._sunsigns = sunsign?.system.textValue.split("-") || [];
        this._parsedFormula = formula ? this._parseFormula : [];
        this._value = 0;
        if (items) {
            this.setAttributes(items);
        }
    }

    setAttributes(items) {
        const attributes = [];
        for (const it of items) {
            if (
                it.type === TraitItemData.DATA_TYPE &&
                it.system.intensity === TraitItemData.INTENSITY.ATTRIBUTE &&
                it.system.isNumeric
            )
                attributes.push(it);
        }
        this._parsedFormula.forEach((param) => {
            const type = typeof param;

            if (type === "string") {
                const [subType, name, mult = 1] = param.split(":");
                if (subType === "attr") {
                    const attr = attributes.find(
                        (obj) => obj.system.abbrev === name,
                    );

                    if (attr) {
                        const score = Number.parseInt(
                            attr.system.textValue,
                            10,
                        );
                        if (Number.isInteger(score)) {
                            this._attrs[attr.system.abbrev] = {
                                name: attr.name,
                                value: score * mult,
                            };
                        } else {
                            throw new Error(
                                "invalid attribute value not number",
                            );
                        }
                    }
                }
            }
        });
        this._value = this.formula ? this._calcValue() : 0;
    }

    get valid() {
        return !!this.parsedFormula.length;
    }

    get formula() {
        return this._formula;
    }

    get parsedFormula() {
        return this._parsedFormula;
    }

    get sunsigns() {
        return this._sunsigns;
    }

    get attributes() {
        return Object.values(this._attrs).map((a) => a.name);
    }

    get value() {
        return this._value;
    }

    /**
     * Parses a skill base formula.
     *
     * A valid SB formula looks like this:
     *
     *   "@str, @int, @sta, hirin:2, ahnu, 5"
     *
     * meaning
     *   average STR, INT, and STA
     *   add 2 if sunsign hirin (modifier after colon ":")
     *   add 1 if sunsign ahnu (1 since no modifier specified)
     *   add 5 to result
     *
     * A valid formula must have exactly 2 or more attributes, everything else is optional.
     *
     * @returns {object[]} A parsed skill base formula
     */
    get _parseFormula() {
        const parseResult = [];
        let modifier = 0;

        let isFormulaValid = true;
        // All parts of the formula are separated by commas,
        // and we lowercase here since the string is processed
        // case-insensitive.
        const sbParts = this._formula.toLowerCase().split(",");

        for (let param of sbParts) {
            if (!isFormulaValid) break;

            param = param.trim();
            if (param != "") {
                if (param.startsWith("@")) {
                    // This is a reference to an attribute

                    // Must have more than just the "@" sign
                    if (param.length === 1) {
                        isFormulaValid = false;
                        break;
                    }

                    const paramName = param.slice(1);
                    parseResult.push(`attr:${paramName}`);
                    continue;
                }

                if (param.match(/^\W/)) {
                    // This is a sunsign

                    let ssParts = param.split(":");

                    // if more than 2 parts, it's invalid
                    if (ssParts.length > 2) {
                        isFormulaValid = false;
                        break;
                    }

                    const ssName = ssParts[0].trim;
                    let ssCount = 1;
                    // if second part provided, must be a number
                    if (ssParts.length === 2) {
                        const ssNumber = ssParts[1].trim().match(/^[-+]?\d+/);
                        if (ssNumber) {
                            ssCount = Number.parseInt(ssNumber[0], 10);
                        } else {
                            isFormulaValid = false;
                        }
                        break;
                    }

                    parseResult.push(`ss:${ssName}:${ssCount}`);

                    continue;
                }

                // The only valid possibility left is a number.
                // If it"s not a number, it's invalid.
                if (param.match(/^[-+]?\d+$/)) {
                    modifier += Number.parseInt(param, 10);
                    parseResult.push(modifier);
                } else {
                    isFormulaValid = false;
                    break;
                }
            }
        }

        return isFormulaValid ? parseResult : null;
    }

    /**
     * Calculates a skill base value.
     *
     * @returns A number representing the calculated skill base
     */
    _calcValue() {
        if (!this.valid) return 0;
        let attrScores = [];
        let ssBonus = Number.MIN_SAFE_INTEGER;
        let modifier = 0;
        this.parsedFormula.forEach((param) => {
            const type = typeof param;

            if (type === "number") {
                modifier += param;
            } else if (type === "string") {
                const [subType, name, mult = 1] = param.split(":");
                if (subType === "attr") {
                    attrScores.push(this._attrs[name]?.value || 0);
                } else if (subType === "ss") {
                    if (this.sunsigns.includes(name)) {
                        // We matched a character's sunsign, apply modifier
                        // Character only gets the largest sunsign bonus
                        ssBonus = Math.max(Number.parseInt(mult, 10), ssBonus);
                    }
                }
            }
        });

        ssBonus = ssBonus > Number.MIN_SAFE_INTEGER ? ssBonus : 0;
        let result = attrScores.reduce((acc, cur) => acc + cur, 0);
        result = result / attrScores.length;

        if (attrScores.length === 2) {
            // Special rounding rule: if only two attributes, and
            // primary attr > secondary attr, round up, otherwise round down
            result =
                attrScores[0] > attrScores[1]
                    ? Math.ceil(result)
                    : Math.floor(result);
        } else {
            // Otherwise use normal rounding rules
            result = Math.round(result);
        }

        result += ssBonus + modifier;

        result = Math.max(0, result); // Make sure result is >= 0

        return result;
    }
}

export class SohlActiveEffectData extends NestableDataModelMixin(
    foundry.abstract.TypeDataModel,
) {
    static TARGET_TYPE = Object.freeze({
        THIS: "this",
        ACTOR: "actor",
    });

    static metadata = Object.freeze({
        name: "sohlactiveeffect",
        locId: "ACTIVEEFFECT",
        label: "SOHL.ACTIVEEFFECT.label",
        labelPlural: "SOHL.ACTIVEEFFECT.labelPl",
        img: "icons/svg/aura.svg",
        iconCssClass: "",
        sheet: "",
        schemaVersion: "0.5.6",
    });

    /** @override */
    static defineSchema() {
        return {
            targetName: new fields.StringField(),
            targetType: new fields.StringField({
                initial: this.TARGET_TYPE.THIS,
                blank: false,
                required: true,
            }),
        };
    }

    static get parentDocumentClass() {
        return SohlActiveEffect;
    }

    get targetLabel() {
        const targetType =
            this.targetType || SohlActiveEffectData.TARGET_TYPE.THIS;
        const targetName = this.targetName || "";
        const attrs = this.targetHasAttr?.split(",");
        const actor =
            this.parent.parent instanceof SohlActor
                ? this.parent.parent
                : this.parent.parent.actor;

        let result;
        if (targetType === SohlActiveEffectData.TARGET_TYPE.ACTOR) {
            const actorName = actor.isToken ? actor.token.name : actor.name;
            result = _l("SOHL.ACTIVE_EFFECT.targetLabel.ThisActor", {
                actorName,
            });
        } else if (targetType === SohlActiveEffectData.TARGET_TYPE.THIS) {
            if (this.parent.parent instanceof SohlItem) {
                result = _l("SOHL.ACTIVE_EFFECT.targetLabel.ThisItem", {
                    itemName: _l(
                        `TYPE.Item.${this.parent.parent.system.constructor.name}.labelPl`,
                    ),
                });
            } else if (actor) {
                const actorName = actor.isToken ? actor.token.name : actor.name;
                result = _l("SOHL.ACTIVE_EFFECT.targetLabel.ThisActor", {
                    actorName,
                });
            }
        } else if (attrs?.length) {
            const formatter = game.i18n.getListFormatter();

            result = _l("SOHL.ACTIVE_EFFECT.targetLabel.HasAttr", {
                attributes: formatter(attrs),
            });
        } else if (this.targetNameRE === ".+") {
            result = _l("SOHL.ACTIVE_EFFECT.targetLabel.AllOfSpecificItem", {
                targetItemPlural: _l(`TYPES.Item.${targetType}.labelPl`),
            });
        } else {
            result = _l("SOHL.ACTIVE_EFFECT.targetLabel.ItemsMatching", {
                targetItemSingular: _l(`TYPES.Item.${targetType}.label`),
                targetName,
            });
        }
        return result;
    }

    get targetNameRE() {
        let name = this.targetName;
        // CASE 1: name is empty or starts with "attr:" means all names are valid
        if (!name || name.startsWith("attr:") || name.startsWith("primeattr:"))
            return ".+";
        // CASE 2: name starts with "regex:" means remainder is already a regular expression
        if (name.startsWith("regex:")) return name.slice(6).trim();
        // CASE 3: name is assumed to be in extended "glob" format, convert to RegEx
        return this.constructor._globrex(name, { extended: true }).regex.source;
    }

    get targetHasAttr() {
        if (!this.targetName) return null;

        if (this.targetName.startsWith("attr:")) {
            return this.targetName.slice(5).trim();
        }
        return null;
    }

    get targetHasPrimaryAttr() {
        if (!this.targetName) return null;

        if (this.targetName.startsWith("primeattr:")) {
            return this.targetName.slice(10).trim();
        }
        return null;
    }

    /* Return the single target of this one active effect */
    get target() {
        // This really doesn't make sense, since AE in SOHL can have multiple targets,
        // but this method is used in a number of places so we make it kinda work
        const targets = this.targets;
        return targets.length ? this.targets[0] : null;
    }

    /* Return all of the documents (Items and Actors) targeted by this Active Effect */
    get targets() {
        let targets = [];
        if (this.targetType === "uuid") {
            const target = fromUuidSync(this.targetName, {
                strict: false,
            });
            if (!target) {
                console.warn(
                    `Effect target with UUID ${this.targetName} not found`,
                );
            } else {
                targets.push(target);
            }
        } else if (this.parent.parent instanceof SohlItem) {
            const item = this.parent.parent;
            const itemActor = item.actor;
            if (this.targetType === "actor")
                return itemActor ? [itemActor] : [];
            if (this.targetType === "this") return [item];

            // If there is no parent actor, then we are done
            if (!itemActor) return [];

            // If "target has an attribute" is defined, find all of the sibling items with that attribute in their SB Formula
            const targetHasAttr = this.targetHasAttr;
            const targetDM = CONFIG.Item.dataModels[this.targetType];
            const targetDMIsML = targetDM.isMasteryLevelItemData;
            if (targetHasAttr && targetDMIsML) {
                const targetAttrNames = this.targetHasAttr.split(",");
                targetAttrNames.forEach((attrName) => {
                    targets = itemActor.itemTypes[this.targetType].filter(
                        (it) =>
                            it.system.skillBase.attributes.includes(attrName),
                    );
                });
            } else if (
                this.targetHasPrimaryAttr &&
                CONFIG.Item.dataModels[this.targetType] instanceof
                    MasteryLevelItemData
            ) {
                const targetAttrNames = this.targetHasPrimaryAttr.split(",");
                targetAttrNames.forEach((attrName) => {
                    targets = itemActor.itemTypes[this.targetType].filter(
                        (it) =>
                            it.system.skillBase.attributes.at(0) === attrName,
                    );
                });
            } else {
                // Find all of the sibling items matching the target name
                const re = new RegExp(this.targetNameRE);
                targets = itemActor.itemTypes[this.targetType].filter((it) =>
                    re.test(it.name),
                );
            }
        } else if (this.parent.parent instanceof SohlActor) {
            const actor = this.parent.parent;
            if (["actor", "this"].includes(this.targetType)) return [actor];

            // Find all actor's item targets
            if (
                this.targetHasAttr &&
                CONFIG.Item.dataModels[this.targetType] instanceof
                    MasteryLevelItemData
            ) {
                const targetAttrNames = this.targetHasAttr.split(",");
                targetAttrNames.forEach((attrName) => {
                    targets = actor.itemTypes[this.targetType].filter((it) =>
                        it.system.skillBase.attributes.includes(attrName),
                    );
                });
            } else if (
                this.targetHasPrimaryAttr &&
                CONFIG.Item.dataModels[this.targetType] instanceof
                    MasteryLevelItemData
            ) {
                const targetAttrNames = this.targetHasPrimaryAttr.split(",");
                targetAttrNames.forEach((attrName) => {
                    targets = actor.itemTypes[this.targetType].filter(
                        (it) =>
                            it.system.skillBase.attributes.at(0) === attrName,
                    );
                });
            } else {
                const re = new RegExp(this.targetNameRE);
                targets = actor.itemTypes[this.targetType].filter((it) =>
                    re.test(it.name),
                );
            }
        }

        return targets;
    }

    /**
     * Convert any glob pattern to a JavaScript Regexp object.
     *
     * Taken from https://github.com/terkelg/globrex
     *
     * @author Terkel Gjervig Nielsen
     * @license MIT
     *
     * @param {String} glob Glob pattern to convert
     * @param {Object} opts Configuration object
     * @param {Boolean} [opts.extended=false] Support advanced ext globbing
     * @param {Boolean} [opts.globstar=false] Support globstar
     * @param {Boolean} [opts.strict=true] be laissez faire about mutiple slashes
     * @param {Boolean} [opts.filepath=""] Parse as filepath for extra path related features
     * @param {String} [opts.flags=""] RegExp globs
     * @returns {Object} converted object with string, segments and RegExp object
     */
    static _globrex(
        glob,
        {
            extended = false,
            globstar = false,
            strict = false,
            filepath = false,
            flags = "",
        } = {},
    ) {
        const isWin = navigator.platform.indexOf("Win") > -1;
        const SEP = isWin ? `\\\\+` : `\\/`;
        const SEP_ESC = isWin ? `\\\\` : `/`;
        const GLOBSTAR = `((?:[^/]*(?:/|$))*)`;
        const WILDCARD = `([^/]*)`;
        const GLOBSTAR_SEGMENT = `((?:[^${SEP_ESC}]*(?:${SEP_ESC}|$))*)`;
        const WILDCARD_SEGMENT = `([^${SEP_ESC}]*)`;

        let regex = "";
        let segment = "";
        let path = { regex: "", segments: [] };

        // If we are doing extended matching, this boolean is true when we are inside
        // a group (eg {*.html,*.js}), and false otherwise.
        let inGroup = false;
        let inRange = false;

        // extglob stack. Keep track of scope
        const ext = [];

        // Helper static to build string and segments
        function add(str, { split, last, only } = {}) {
            if (only !== "path") regex += str;
            if (filepath && only !== "regex") {
                path.regex += str === "\\/" ? SEP : str;
                if (split) {
                    if (last) segment += str;
                    if (segment !== "") {
                        if (!flags.includes("g")) segment = `^${segment}$`; // change it "includes"
                        path.segments.push(new RegExp(segment, flags));
                    }
                    segment = "";
                } else {
                    segment += str;
                }
            }
        }

        let c, n;
        for (let i = 0; i < glob.length; i++) {
            c = glob[i];
            n = glob[i + 1];

            if (["\\", "$", "^", ".", "="].includes(c)) {
                add(`\\${c}`);
                continue;
            }

            if (c === "/") {
                add(`\\${c}`, { split: true });
                if (n === "/" && !strict) regex += "?";
                continue;
            }

            if (c === "(") {
                if (ext.length) {
                    add(c);
                    continue;
                }
                add(`\\${c}`);
                continue;
            }

            if (c === ")") {
                if (ext.length) {
                    add(c);
                    let type = ext.pop();
                    if (type === "@") {
                        add("{1}");
                    } else if (type === "!") {
                        add("([^/]*)");
                    } else {
                        add(type);
                    }
                    continue;
                }
                add(`\\${c}`);
                continue;
            }

            if (c === "|") {
                if (ext.length) {
                    add(c);
                    continue;
                }
                add(`\\${c}`);
                continue;
            }

            if (c === "+") {
                if (n === "(" && extended) {
                    ext.push(c);
                    continue;
                }
                add(`\\${c}`);
                continue;
            }

            if (c === "@" && extended) {
                if (n === "(") {
                    ext.push(c);
                    continue;
                }
            }

            if (c === "!") {
                if (extended) {
                    if (inRange) {
                        add("^");
                        continue;
                    }
                    if (n === "(") {
                        ext.push(c);
                        add("(?!");
                        i++;
                        continue;
                    }
                    add(`\\${c}`);
                    continue;
                }
                add(`\\${c}`);
                continue;
            }

            if (c === "?") {
                if (extended) {
                    if (n === "(") {
                        ext.push(c);
                    } else {
                        add(".");
                    }
                    continue;
                }
                add(`\\${c}`);
                continue;
            }

            if (c === "[") {
                if (inRange && n === ":") {
                    i++; // skip [
                    let value = "";
                    while (glob[++i] !== ":") value += glob[i];
                    if (value === "alnum") add("(\\w|\\d)");
                    else if (value === "space") add("\\s");
                    else if (value === "digit") add("\\d");
                    i++; // skip last ]
                    continue;
                }
                if (extended) {
                    inRange = true;
                    add(c);
                    continue;
                }
                add(`\\${c}`);
                continue;
            }

            if (c === "]") {
                if (extended) {
                    inRange = false;
                    add(c);
                    continue;
                }
                add(`\\${c}`);
                continue;
            }

            if (c === "{") {
                if (extended) {
                    inGroup = true;
                    add("(");
                    continue;
                }
                add(`\\${c}`);
                continue;
            }

            if (c === "}") {
                if (extended) {
                    inGroup = false;
                    add(")");
                    continue;
                }
                add(`\\${c}`);
                continue;
            }

            if (c === ",") {
                if (inGroup) {
                    add("|");
                    continue;
                }
                add(`\\${c}`);
                continue;
            }

            if (c === "*") {
                if (n === "(" && extended) {
                    ext.push(c);
                    continue;
                }
                // Move over all consecutive "*""s.
                // Also store the previous and next characters
                let prevChar = glob[i - 1];
                let starCount = 1;
                while (glob[i + 1] === "*") {
                    starCount++;
                    i++;
                }
                let nextChar = glob[i + 1];
                if (!globstar) {
                    // globstar is disabled, so treat any number of "*" as one
                    add(".*");
                } else {
                    // globstar is enabled, so determine if this is a globstar segment
                    let isGlobstar =
                        starCount > 1 && // multiple "*""s
                        (prevChar === "/" || prevChar === undefined) && // from the start of the segment
                        (nextChar === "/" || nextChar === undefined); // to the end of the segment
                    if (isGlobstar) {
                        // it"s a globstar, so match zero or more path segments
                        add(GLOBSTAR, { only: "regex" });
                        add(GLOBSTAR_SEGMENT, {
                            only: "path",
                            last: true,
                            split: true,
                        });
                        i++; // move over the "/"
                    } else {
                        // it"s not a globstar, so only match one path segment
                        add(WILDCARD, { only: "regex" });
                        add(WILDCARD_SEGMENT, { only: "path" });
                    }
                }
                continue;
            }

            add(c);
        }

        // When regexp "g" flag is specified don"t
        // constrain the regular expression with ^ & $
        if (!flags.includes("g")) {
            regex = `^${regex}$`;
            segment = `^${segment}$`;
            if (filepath) path.regex = `^${path.regex}$`;
        }

        const result = { regex: new RegExp(regex, flags) };

        // Push the last segment
        if (filepath) {
            path.segments.push(new RegExp(segment, flags));
            path.regex = new RegExp(path.regex, flags);
            path.globstar = new RegExp(
                !flags.includes("g")
                    ? `^${GLOBSTAR_SEGMENT}$`
                    : GLOBSTAR_SEGMENT,
                flags,
            );
            result.path = path;
        }

        return result;
    }
}

export class SohlActiveEffect extends ActiveEffect {
    static defineSchema() {
        return foundry.utils.mergeObject(
            super.defineSchema(),
            {
                type: new fields.DocumentTypeField(this, {
                    initial: SohlActiveEffectData.TYPE_NAME,
                }),
            },
            { inplace: false },
        );
    }

    get modifiesActor() {
        if (!this.active) return false;
        return this.item
            ? this.system.targetType === "actor"
            : ["actor", "this"].includes(this.system.targetType);
    }

    /** @override */
    get isSuppressed() {
        // let hasAuralShock = false;
        // if (this.parent instanceof SohlActor) {
        //     if (!this.origin) return false;
        //     hasAuralShock = this.parent
        //         .allItems()
        //         .some(
        //             (it) =>
        //                 it.system instanceof AfflictionItemData &&
        //                 it.system.subType === "auralshock",
        //         );
        // } else {
        if (!this.origin) return true;
        // }

        const source = this.item || fromUuidSync(this.origin);

        if (
            source?.system instanceof GearItemData &&
            !source.system.isEquipped
        ) {
            return true;
        }

        if (!source) {
            console.warn(
                `Actor ${this.parent.name} effect ${this.name} has invalid origin ${this.origin}`,
            );
            return true;
        }

        // if (
        //     hasAuralShock &&
        //     source.system.skillBase.attributes.includes("Aura")
        // ) {
        //     return true;
        // }

        return false;
    }

    _getContextOptions() {
        const result = [
            {
                name: "Edit",
                icon: `<i class="fas fa-edit"></i>`,
                condition: (header) => {
                    if (game.user.isGM) return true;
                    header = header instanceof HTMLElement ? header : header[0];
                    const li = header.closest(".effect");
                    const parent = fromUuidSync(li.dataset.effectParentUuid);
                    const effect = parent?.effects.get(li.dataset.effectId);
                    return effect?.isOwner;
                },
                callback: (header) => {
                    header = header instanceof HTMLElement ? header : header[0];
                    const li = header.closest(".effect");
                    const parent = fromUuidSync(li.dataset.effectParentUuid);
                    const effect = parent?.effects.get(li.dataset.effectId);
                    if (effect) {
                        effect.sheet.render(true);
                    } else {
                        throw new Error(
                            `Effect ${li.dataset.effectUuid} not found.`,
                        );
                    }
                },
                group: SohlContextMenu.SORT_GROUPS.GENERAL,
            },
            {
                name: "Delete",
                icon: `<i class="fas fa-trash"></i>`,
                condition: (header) => {
                    if (game.user.isGM) return true;
                    header = header instanceof HTMLElement ? header : header[0];
                    const li = header.closest(".effect");
                    const parent = fromUuidSync(li.dataset.effectParentUuid);
                    const effect = parent?.effects.get(li.dataset.effectId);
                    return effect?.isOwner;
                },
                callback: (header) => {
                    header = header instanceof HTMLElement ? header : header[0];
                    const li = header.closest(".effect");
                    const parent = fromUuidSync(li.dataset.effectParentUuid);
                    const effect = parent?.effects.get(li.dataset.effectId);
                    if (effect) {
                        return Dialog.confirm({
                            title: `Delete Active Effect: ${effect.name}`,
                            content:
                                "<p>Are You Sure?</p><p>This active effect will be deleted and cannot be recovered.</p>",
                            yes: () => {
                                return effect.delete();
                            },
                        });
                    } else {
                        throw new Error(
                            `Effect ${li.dataset.effectUuid} not found.`,
                        );
                    }
                },
                group: SohlContextMenu.SORT_GROUPS.GENERAL,
            },
            {
                name: "Toggle",
                icon: `<i class="fas ${this.disabled ? "fa-toggle-on" : "fa-toggle-off"}"></i>`,
                condition: (header) => {
                    if (game.user.isGM) return true;
                    header = header instanceof HTMLElement ? header : header[0];
                    const li = header.closest(".effect");
                    const parent = fromUuidSync(li.dataset.effectParentUuid);
                    const effect = parent?.effects.get(li.dataset.effectId);
                    return effect?.isOwner;
                },
                callback: (header) => {
                    header = header instanceof HTMLElement ? header : header[0];
                    const li = header.closest(".effect");
                    const parent = fromUuidSync(li.dataset.effectParentUuid);
                    const effect = parent?.effects.get(li.dataset.effectId);
                    if (effect) {
                        effect.toggleEnabledState();
                    } else {
                        throw new Error(
                            `Effect ${li.dataset.effectUuid} not found.`,
                        );
                    }
                },
                group: SohlContextMenu.SORT_GROUPS.GENERAL,
            },
        ];
        return result;
    }

    async toggleEnabledState() {
        const updateData = {};
        if (this.disabled) {
            // Enable the Active Effect
            updateData["disabled"] = false;

            // Also set the timer to start now
            updateData["duration.startTime"] = game.time.worldTime;
            if (game.combat) {
                updateData["duration.startRound"] = game.combat.round;
                updateData["duration.startTurn"] = game.combat.turn;
            }
        } else {
            // Disable the Active Effect
            updateData["disabled"] = true;
        }
        return await this.update(updateData);
    }

    /** @override */
    _onCreate(data, options, userId) {
        super._onCreate(data, options, userId);

        // Reset the origin for this AE if it is on an item associated with an Actor
        if (
            this.parent instanceof SohlItem &&
            this.parent.parent instanceof SohlActor
        ) {
            this.origin = this.parent.uuid;
        }
    }

    /** @override */
    apply(doc, change) {
        let changes = {};
        if (change.key.startsWith("mod:")) {
            // Any change that starts with "mod:" is a modifier
            this._handleAEMods(doc, change, changes);
        } else {
            // Otherwise, handle as normal
            changes = super.apply(doc, change);
        }
        return changes;
    }

    _handleAEMods(doc, change, changes) {
        const modKey = change.key.slice(4);

        const mods = foundry.utils.getProperty(doc, modKey);
        if (!(mods instanceof ValueModifier)) {
            console.error(
                `SoHL | Invalid target: "${modKey}" is not a ValueModifier for ${doc.name}`,
            );
            return;
        }

        const effectKeyValue = this.getEffectKeyValue(change.key);

        const modName = effectKeyValue.label;
        const modAbbr = effectKeyValue.abbrev;

        switch (change.mode) {
            case CONST.ACTIVE_EFFECT_MODES.ADD:
                mods.add(modName, modAbbr, change.value);
                break;

            case CONST.ACTIVE_EFFECT_MODES.MULTIPLY:
                mods.multiply(modName, modAbbr, change.value);
                break;

            case CONST.ACTIVE_EFFECT_MODES.UPGRADE:
                mods.floor(modName, modAbbr, change.value);
                break;

            case CONST.ACTIVE_EFFECT_MODES.DOWNGRADE:
                mods.ceiling(modName, modAbbr, change.value);
                break;

            case CONST.ACTIVE_EFFECT_MODES.OVERRIDE:
                mods.set(modName, modAbbr, change.value);
                break;
        }

        return (changes[modKey] = mods);
    }

    async checkExpiredAndDisable() {
        if (!this.disabled) {
            const duration = this.duration;
            if (duration.type && duration.type !== "none") {
                if (duration.remaining <= 0) {
                    await this.update({ disabled: true });
                }
            }
        }
    }

    getEffectKeyValue(key) {
        let result;
        let targetType = this.system.targetType || "this";
        if (this.parent instanceof SohlActor) {
            if (["this", "actor"].includes(targetType)) {
                result = this.parent.system.TYPE_NAME;
            } else {
                result = CONFIG.Item.dataModels?.[targetType].effectKeys?.[key];
            }
        } else if (this.parent instanceof SohlItem) {
            if (targetType === "actor") {
                result = this.parent.actor?.system.constructor.effectKeys[key];
            } else if (targetType === "this") {
                result = this.parent.system.constructor.effectKeys[key];
            } else {
                result = CONFIG.Item.dataModels?.[targetType].effectKeys?.[key];
            }
        }
        return result || { label: "Unknown", abbrev: "UNKNOWN" };
    }

    getEffectKeyChoices() {
        let result = [];
        let targetType = this.system.targetType || "this";
        if (this.parent instanceof SohlActor) {
            if (["this", "actor"].includes(targetType)) {
                result = this.parent.system.constructor.effectKeys;
            } else {
                result = CONFIG.Item.dataModels?.[targetType].effectKeys || [];
            }
        } else if (this.parent instanceof SohlItem) {
            if (targetType === "actor") {
                result = this.parent.actor?.system.constructor.effectKeys || [];
            } else if (targetType === "this") {
                result = this.parent.system.constructor.effectKeys;
            } else {
                result = CONFIG.Item.dataModels?.[targetType].effectKeys || [];
            }
        }
        return result;
    }

    /**
     * Returns a string representation of the changes made. If there are no changes, it returns 'No Changes'. Each change is mapped to a formatted string based on the change mode. The format includes the key, value, and mode of the change. The prefix for each change is determined based on the targetType and the parent object. The format varies depending on the mode of the change, such as ADD, MULTIPLY, OVERRIDE, UPGRADE, DOWNGRADE, or default. The formatted strings for each change are joined with a comma separator and returned as a single string.
     *
     * @returns {*}
     */
    get _aeChanges() {
        if (!this.changes || !this.changes.length) {
            return "No Changes";
        }

        return this.changes
            .map((ch) => {
                const modes = CONST.ACTIVE_EFFECT_MODES;
                const key = ch.key;
                const val = ch.value;
                let prefix = this.getEffectKeyValue(key).abbrev;

                switch (ch.mode) {
                    case modes.ADD:
                        return `${prefix} ${val < 0 ? "-" : "+"} ${Math.abs(
                            val,
                        )}`;
                    case modes.MULTIPLY:
                        return `${prefix} ${SOHL.CHARS.TIMES} ${val}`;
                    case modes.OVERRIDE:
                        return `${prefix} = ${val}`;
                    case modes.UPGRADE:
                        return `${prefix} ${SOHL.CHARS.GREATERTHANOREQUAL} ${val}`;
                    case modes.DOWNGRADE:
                        return `${prefix} ${SOHL.CHARS.LESSTHANOREQUAL} ${val}`;
                    default:
                        return !val ? `${prefix}` : `${prefix} ~ ${val}`;
                }
            })
            .join(", ");
    }

    _prepareDuration() {
        const d = super._prepareDuration();
        if (d.type === "seconds") {
            d.endTime = d._worldTime + d.remaining;
            d.endTimeHtml = Utility.htmlWorldTime(d.endTime);
        }
        return d;
    }

    get _aeDuration() {
        const d = this.duration;

        // Time-based duration
        if (Number.isNumeric(d.seconds)) {
            const start = d.startTime || game.time.worldTime;
            const elapsed = game.time.worldTime - start;
            const remaining = Math.max(d.seconds - elapsed, 0);
            //const normDuration = toNormTime(d.seconds);
            const normRemaining = Utility.formatDuration(remaining);
            return {
                type: "seconds",
                duration: d.seconds,
                remaining: remaining,
                label: normRemaining,
            };
        }

        // Turn-based duration
        else if (d.rounds || d.turns) {
            // Determine the current combat duration
            const cbt = game.combat;
            const c = {
                round: cbt?.round ?? 0,
                turn: cbt?.turn ?? 0,
                nTurns: cbt?.turns.length ?? 1,
            };

            // Determine how many rounds and turns have elapsed
            let elapsedRounds = Math.max(c.round - (d.startRound || 0), 0);
            let elapsedTurns = c.turn - (d.startTurn || 0);
            if (elapsedTurns < 0) {
                elapsedRounds -= 1;
                elapsedTurns += c.nTurns;
            }

            // Compute the number of rounds and turns that are remaining
            let remainingRounds = (d.rounds || 0) - elapsedRounds;
            let remainingTurns = (d.turns || 0) - elapsedTurns;
            if (remainingTurns < 0) {
                remainingRounds -= 1;
                remainingTurns += c.nTurns;
            } else if (remainingTurns > c.nTurns) {
                remainingRounds += Math.floor(remainingTurns / c.nTurns);
                remainingTurns %= c.nTurns;
            }

            // Total remaining duration
            if (remainingRounds < 0) {
                remainingRounds = 0;
                remainingTurns = 0;
            }
            const duration = (c.rounds || 0) + (c.turns || 0) / 100;
            const remaining = remainingRounds + remainingTurns / 100;

            // Remaining label
            const label = [
                remainingRounds > 0 ? `${remainingRounds} Rounds` : null,
                remainingTurns > 0 ? `${remainingTurns} Turns` : null,
                remainingRounds + remainingTurns === 0 ? "None" : null,
            ].filterJoin(", ");
            return {
                type: "turns",
                duration: duration,
                remaining: remaining,
                label: label,
            };
        }

        // No duration
        else {
            return {
                type: "none",
                duration: null,
                remaining: null,
                label: "None",
            };
        }
    }

    async _preCreate(newData, options, user) {
        let origin = newData.origin || this.parent?.uuid;
        this.updateSource({
            type: SohlActiveEffectData.TYPE_NAME,
            origin: origin,
        });
        return super._preCreate(newData, options, user);
    }

    /** @inheritdoc */
    static async createDocuments(dataAry = [], context = {}) {
        if (!context?.parent?.isNested)
            return super.createDocuments(dataAry, context);
        if (!Array.isArray(dataAry)) dataAry = [dataAry];
        const result = [];
        for (let data of dataAry) {
            if (!(data._id && context.keepId)) {
                data._id = foundry.utils.randomID();
            }

            if (!("ownership" in data)) {
                data.ownership = {
                    default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER,
                };
            }
            const doc = new this.impelementation(data, context);
            if (!doc) throw new Error(`${this.documentName} creation failed`);

            const collection = context.parent.system.getNestedCollection(
                this.documentName,
            );
            const newAry = collection.toObject();

            // Set sort property
            let maxSort = newAry.reduce(
                (max, obj) => Math.max(max, obj.sort),
                0,
            );
            maxSort += CONST.SORT_INTEGER_DENSITY;
            doc.sort = maxSort;

            const docExists = newAry.some((obj) => obj._id === doc.id);
            if (docExists) {
                if (!context.keepId) {
                    throw new Error(
                        `${this.documentName} with id ${doc.id} already exists in ${context.parent.label}`,
                    );
                }
            } else {
                newAry.push(doc.toObject());
                const collectionName =
                    context.parent.system.constructor.getCollectionName(
                        this.documentName,
                    );
                context.parent.updateSource({
                    [`system.${collectionName}`]: newAry,
                });
            }
            result.push(doc);
        }
        return result;
    }

    /** @inheritdoc */
    static async updateDocuments(updates = [], context = {}) {
        if (!(context?.parent instanceof SohlItem))
            return super.updateDocuments(updates, context);
        if (!Array.isArray(updates)) updates = [updates];
        const collection = context.parent.system.getNestedCollection(
            this.documentName,
        );
        const newAry = collection.map((it) => it.toObject());
        const result = [];
        for (let update of updates) {
            // Expand the object, if dot-notation keys are provided
            if (Object.keys(update).some((k) => /\./.test(k))) {
                const expandedUpdate = foundry.utils.expandObject(update);
                for (const key in update) delete update[key];
                Object.assign(update, expandedUpdate);
            }
            const itemIdx = newAry.findIndex((it) => it._id === update?._id);
            if (itemIdx >= 0) {
                const id = update._id;
                delete update._id;
                foundry.utils.mergeObject(newAry[itemIdx], update);
                result.push(id);
            } else {
                console.error(
                    `Can't find item with id ${update._id} in nested collection`,
                );
                continue;
            }
        }
        const collectionName =
            context.parent.system.constructor.getCollectionName(
                this.documentName,
            );
        context.parent.updateSource({
            [`system.${collectionName}`]: newAry,
        });
        const changedDocs = collection.filter((it) => result.includes(it.id));
        changedDocs.forEach((doc) => doc.render());
        context.parent.render();
        return changedDocs;
    }

    /** @inheritdoc */
    static async deleteDocuments(ids = [], operation = {}) {
        if (!(operation?.parent instanceof SohlItem))
            return super.deleteDocuments(ids, operation);
        if (!Array.isArray(ids)) ids = [ids];
        const collection = operation.parent.system.getNestedCollection(
            this.documentName,
        );
        let newAry = collection.map((it) => it.toObject());
        newAry = newAry.filter((it) => !ids.includes(it._id));
        const collectionName =
            operation.parent.system.constructor.getCollectionName(
                this.documentName,
            );
        operation.parent.updateSource({
            [`system.${collectionName}`]: newAry,
        });
        operation.parent.render();
        return ids;
    }

    static async create(data, options = {}) {
        let newData =
            data instanceof Document
                ? data.toObject()
                : foundry.utils.deepClone(data);

        if (Object.keys(newData).some((k) => /\./.test(k))) {
            newData = foundry.utils.expandObject(newData);
        }

        if (options.clean) {
            delete newData.sort;
        }

        if (!newData.img) {
            newData.img = CONFIG.controlIcons.effects;
        }

        if (!("ownership" in data)) {
            newData.ownership = {
                default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER,
            };
        }

        // If nestedIn is specified, use update() on the nestedIn
        if (options.parent?.isNested) {
            const effectsAry = options.parent.effects.toObject();
            let doc = effectsAry.find((it) => (it._id = options.parent.id));
            let newAry = foundry.utils.deepClone(doc.effects);

            const effectExists = newAry.some((obj) => obj._id === newData._id);
            if (effectExists) {
                throw new Error(
                    `Effect with id ${newData._id} already exists in ${options.parent.nestedIn.label}`,
                );
            }

            let effect = new SohlActiveEffect(newData, options);
            //await item._preCreate(newData, options, game.user);
            const effectData = effect.toObject();

            // Set sort property
            let maxSort = newAry.reduce(
                (max, obj) => Math.max(max, obj.sort),
                0,
            );
            maxSort += CONST.SORT_INTEGER_DENSITY;
            effectData.sort = maxSort;
            newAry.push(effectData);

            const result = await options.parent.update({
                effects: newAry,
            });
            options.parent.sheet.render();
            return result;
        } else {
            return await super.create(newData, options);
        }
    }

    /** @override */
    update(data = [], context = {}) {
        // Note that this method will return a direct response if called
        // on an item with an nestedIn, otherwise it will return a Promise.

        let result = null;

        if (this.parent?.nestedIn) {
            this.updateSource(data);
            const newAry = this.parent.effects.contents;
            const idx = newAry.findIndex((obj) => obj._id === this.id);
            if (idx >= 0) {
                newAry[idx] = this.toObject();
                newAry.sort((a, b) => a.sort - b.sort);
                const updateData = {
                    "system.effects": newAry,
                };
                result = this.parent.nestedIn.update(updateData, context);
                if (this.parent.sheet.rendered) this.parent.sheet.render();
            }
        } else {
            result = super.update(data, context);
        }

        return result;
    }

    /** @override */
    delete(context = {}) {
        // Note that this method will return a direct response if called
        // on an item with either nestedIn or cause with a truthy value,
        // otherwise it will return a Promise.
        if (this.parent?.nestedIn) {
            const newAry = this.parent.effects.contents;
            const filtered = newAry.filter((obj) => obj._id !== this.id);
            if (filtered.length !== newAry.length) {
                this.parent.nestedIn.update(
                    { "system.effects": filtered },
                    context,
                );
            }
            this.parent.sheet.render();
            return this;
        } else {
            return super.delete(context);
        }
    }
}

/**
 * A form designed for creating and editing an Active Effect on an Actor or Item.
 * @implements {FormApplication}
 *
 * @param {ActiveEffect} object     The target active effect being configured
 * @param {object} [options]        Additional options which modify this application instance
 */
export class SohlActiveEffectConfig extends ActiveEffectConfig {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: "systems/sohl/templates/effect/active-effect-config.html",
        });
    }

    /* ----------------------------------------- */

    /** @override */
    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    async getData(options) {
        const context = await super.getData();
        (context.variant = CONFIG.SOHL.id),
            (context.keyChoices = this.object.getEffectKeyChoices());
        context.sourceName = await this.object.sourceName;

        // Setup Target Types
        context.targetTypes = {};
        if (this.object.parent instanceof Actor) {
            context.targetTypes["this"] = "This Actor";
        } else {
            context.targetTypes["this"] = _l("This {itemType}", {
                itemType: _l(this.object.parent.system.constructor.label),
            });
            context.targetTypes["actor"] = "Actor";
        }
        Object.entries(CONFIG.Item.dataModels).reduce((obj, [key, clazz]) => {
            obj[key] = _l(clazz.metadata.label);
            return obj;
        }, context.targetTypes);

        if (SOHL.hasSimpleCalendar) {
            context.startTimeText = EventItemData.getWorldDateLabel(
                context.data.duration.startTime,
            );
        } else {
            const startTimeDiff =
                game.time.worldTime - context.data.duration.startTime;
            context.startTimeText = Utility.formatDuration(startTimeDiff);
        }

        return context;
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        // biome-ignore lint/correctness/noUnusedVariables: <explanation>
        const element = html instanceof jQuery ? html[0] : html;

        // Everything below here is only needed if the sheet is editable
        if (!this.options.editable) return;

        this.form
            .querySelector(".alter-time")
            ?.addEventListener("click", (ev) => {
                const property = ev.currentTarget.dataset.property;
                let time = Number.parseInt(ev.currentTarget.dataset.time, 10);
                if (Number.isNaN(time)) time = 0;
                Utility.onAlterTime(time).then((result) => {
                    if (result !== null) {
                        const updateData = { [property]: result };
                        this.object.update(updateData);
                    }
                });
            });
    }
}

export class SohlMacro extends NestableDocumentMixin(Macro) {
    /** @override */
    _configure(options) {
        if (this.parent && !(this.parent instanceof SohlActor)) {
            throw new Error("Parent must always be an instance of SohlActor");
        }

        super._configure(options);

        Object.defineProperty(this, "nestedIn", {
            value: (() => {
                if ([null, undefined].includes(options.nestedIn)) return null;
                if (
                    options.nestedIn instanceof SohlItem ||
                    options.nestedIn instanceof SohlActor
                )
                    return options.nestedIn;
                throw new Error(
                    "The provided nestedIn must be an SohlItem or SohlActor instance",
                );
            })(),
            writable: false,
            enumerable: false,
        });
    }

    get notes() {
        return this.getFlag("sohl", "notes") || "";
    }

    set notes(value) {
        this.setFlag("sohl", "notes", value ?? "");
    }

    get description() {
        return this.getFlag("sohl", "description") || "";
    }

    set description(value) {
        this.setFlag("sohl", "description", value ?? "");
    }

    get useAsync() {
        return this.getFlag("sohl", "useAsync");
    }

    set useAsync(val) {
        this.setFlag("sohl", "useAsync", !!val);
    }

    get functionName() {
        return this.getFlag("sohl", "functionName") ?? "";
    }

    set functionName(value) {
        this.setFlag("sohl", "functionName", value);
    }

    get isIntrinsicAction() {
        return !!this.getFlag("sohl", "isIntrinsicAction");
    }

    set isIntrinsicAction(value) {
        this.setFlag("sohl", "isIntrinsicAction", !!value);
    }

    get contextIconClass() {
        return this.getFlag("sohl", "contextIconClass") ?? "";
    }

    set contextIconClass(value) {
        this.setFlag("sohl", "contextIconClass", value);
    }

    get contextCondition() {
        return this.getFlag("sohl", "contextCondition") ?? false;
    }

    set contextCondition(value) {
        this.setFlag("sohl", "contextCondition", value);
    }

    get contextGroup() {
        return this.getFlag("sohl", "contextGroup") ?? "";
    }

    set contextGroup(value) {
        this.setFlag("sohl", "contextGroup", value);
    }

    get params() {
        return this.getFlag("sohl", "params") || {};
    }

    setParam(name, value) {
        if (!name || Number.isNumeric(name)) {
            throw new Error(
                `Invalid parameter name "${name}", must be a non-numeric string`,
            );
        }

        const newParams = foundry.utils.deepClone(this.params);
        newParams[name] = value;
        this.setFlag("sohl", "params", newParams);
    }

    deleteParam(name) {
        const newParams = foundry.utils.deepClone(this.params);
        delete newParams[name];
        this.setFlag("sohl", "params", newParams);
    }

    get paramsLabel() {
        return Object.entries(this.params).reduce((str, [key, val]) => {
            if (str) str += ",";
            str += key;
            if (typeof val !== "undefined") {
                str += `=${val}`;
            }
            return str;
        }, "");
    }

    get nameParts() {
        const index = this.functionName.indexOf("$");
        if (index < 0) return { prefix: "", functionName: this.functionName };
        const prefix = this.functionName.slice(0, index);
        const fnName = this.functionName.slice(index + 1);
        return { prefix, functionName: fnName };
    }

    /** @override */
    get uuid() {
        if (!this._uuid) {
            if (this.nestedIn) {
                // If this is a nested object, we come up with a new UUID format
                // where the nested macro is defined with a hash mark
                let parts = [this.nestedIn.uuid, "NestedMacro", this.id];
                this._uuid = parts.join("#");
            } else {
                this._uuid = super.uuid;
            }
        }

        return this._uuid;
    }

    _getContextOptions() {
        const opts = [
            {
                name: "Execute",
                contextIconClass: `<i class="far fa-gears"></i>`,
                condition: this.canExecute,
                callback: (header) => {
                    header = header instanceof HTMLElement ? header : header[0];
                    const li = header.closest(".item");
                    const parent = fromUuidSync(li.dataset.parentUuid);
                    const action = parent.system.actions.get(li.dataset.itemId);
                    action.execute();
                },
                group: SohlContextMenu.SORT_GROUPS.ESSENTIAL,
            },
            {
                name: "Edit",
                contextIconClass: `<i class="fas fa-edit"></i>`,
                condition: !this.isIntrinsicAction,
                callback: (header) => {
                    header = header instanceof HTMLElement ? header : header[0];
                    const li = header.closest(".item");
                    const parent = fromUuidSync(li.dataset.parentUuid);
                    const action = parent.system.actions.get(li.dataset.itemId);
                    action.sheet.render(true);
                },
                group: SohlContextMenu.SORT_GROUPS.GENERAL,
            },
            {
                name: "Delete",
                contextIconClass: `<i class="fas fa-trash"></i>`,
                condition: !this.isIntrinsicAction && this.isOwner,
                callback: (header) => {
                    header = header instanceof HTMLElement ? header : header[0];
                    const li = header.closest(".item");
                    const parent = fromUuidSync(li.dataset.parentUuid);
                    const action = parent.system.actions.get(li.dataset.itemId);
                    return Dialog.confirm({
                        title: `Delete Action: ${action.name}`,
                        content:
                            "<p>Are You Sure?</p><p>This action will be deleted and cannot be recovered.</p>",
                        yes: () => {
                            action.delete();
                        },
                    });
                },
                group: SohlContextMenu.SORT_GROUPS.GENERAL,
            },
        ];

        return opts;
    }

    /** @override */
    async _preCreate(data, options, user) {
        const allowed = await super._preCreate(data, options, user);
        if (allowed === false) return false;

        const updateData = foundry.utils.mergeObject(
            {
                type: CONST.MACRO_TYPES.SCRIPT,
                flags: {
                    sohl: {
                        notes: "",
                        description: "",
                        params: {},
                        functionName: "",
                        contextIconClass: "",
                        contextCondition: false,
                        contextGroup: SohlContextMenu.SORT_GROUPS.HIDDEN,
                        isIntrinsicAction: false,
                        useAsync: true,
                    },
                },
            },
            data,
            { insertKeys: false, insertValues: false },
        );
        this.updateSource(updateData);
        return true;
    }

    static getExecuteDefaults({
        speaker = null,
        actor = null,
        token = null,
        character = null,
        needsActor = false,
        needsToken = false,
        self = null,
    }) {
        if (token instanceof Token) token = token.document;
        if (speaker && !speaker.scene && speaker.token) {
            const tok = canvas.ready
                ? canvas.tokens.get(speaker.token)?.document
                : null;
            speaker.scene = tok?.scene?.id;
        }
        if (speaker && actor && token && character)
            return { speaker, actor, token, character };
        actor = actor || token?.actor;
        if (!actor) {
            actor = self.actor;
            token = actor?.getToken();
        }

        // Add variables to the evaluation scope.
        speaker ||= ChatMessage.getSpeaker({ actor, token });
        character ||= game.user.character;
        token ||= canvas.ready
            ? canvas.tokens.get(speaker.token)?.document
            : null;
        actor ||= token?.actor || game.actors.get(speaker.actor);

        if (needsToken && !token) {
            throw new Error(`No Token defined`);
        } else if (needsActor && !actor) {
            throw new Error(`No Actor defined`);
        } else {
            return { speaker, actor, token, character };
        }
    }

    /** @override */
    execute({ self, actor, token, inPrepareData, ...scope } = {}) {
        self ||= this.parent?.system || this.nestedIn?.system || this;
        const argValues = Object.values(scope);
        let speaker, character, fn;
        if (this.type === CONST.MACRO_TYPES.CHAT) {
            ({ actor, token } = SohlMacro.getExecuteDefaults({
                actor,
                token,
                self,
            }));
            scope.token = token;
            scope.actor = actor;
            return super.execute(scope);
        } else if (this.type === CONST.MACRO_TYPES.SCRIPT) {
            if (this.isIntrinsicAction) {
                const { functionName } = this.nameParts;
                fn = self[functionName];
                if (!(fn instanceof Function)) fn = null;
            } else {
                // Unpack argument names and values
                const argNames = Object.keys(scope);
                if (argNames.some((k) => Number.isNumeric(k))) {
                    throw new Error(
                        "Illegal numeric Macro parameter passed to execution scope.",
                    );
                }

                const args = [
                    "speaker",
                    "actor",
                    "token",
                    "character",
                    "scope",
                    ...argNames,
                    `{${this.command}\n}`,
                ];

                if (this.useAsync) {
                    fn = new foundry.utils.AsyncFunction(...args);
                } else {
                    fn = new Function(...args);
                }
            }
        }
        if (fn) {
            // Attempt macro execution
            try {
                if (!inPrepareData) {
                    ({ speaker, actor, token, character } =
                        SohlMacro.getExecuteDefaults({
                            actor,
                            token,
                            self,
                        }));
                }

                return fn.call(
                    self,
                    speaker,
                    actor,
                    token,
                    character,
                    scope,
                    ...argValues,
                );
            } catch (err) {
                Hooks.onError("SohlMacro#execute", err, {
                    msg: `Error executing action ${this.name} on ${
                        _l(self.constructor.metadata.label) || "SohlMacro"
                    } ${self.name}`,
                    log: "error",
                });
            }
        }

        return null;
    }
}

export class SohlMacroConfig extends MacroConfig {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: "systems/sohl/templates/dialog/macro-config.html",
            tabs: [
                {
                    navSelector: ".tabs",
                    contentSelector: ".sheet-body",
                    initial: "script",
                },
            ],
            width: 560,
            height: 600,
        });
    }

    /** @override */
    getData(options = {}) {
        const data = super.getData(options);
        (data.variant = CONFIG.SOHL.id),
            (data.macroTypes = game.documentTypes.Macro.reduce((obj, t) => {
                if (
                    t === CONST.MACRO_TYPES.SCRIPT &&
                    !game.user.can("MACRO_SCRIPT")
                )
                    return obj;
                obj[t] = _l(CONFIG.Macro.typeLabels[t]);
                return obj;
            }, {}));
        data.editable = this.isEditable;
        data.const = SOHL;
        data.config = CONFIG.SOHL;
        data.flags = data.document.flags;
        data.isAction = data.document.cause;
        data.contextGroupChoices = SohlContextMenu.sortGroups;
        return data;
    }

    get isEditable() {
        return !this.isIntrinsicAction && super.isEditable;
    }

    /** @inheritdoc */
    _onDragStart(event) {
        const li = event.currentTarget;
        if ("link" in event.target.dataset) return;

        // Create drag data
        let dragData;

        // Owned Items
        if (li.dataset.uuid) {
            const item = fromUuidSync(li.dataset.uuid);
            dragData = item.toDragData();
        }

        // Active Effect
        else if (li.dataset.effectId) {
            const effect = this.actor.effects.get(li.dataset.effectId);
            dragData = effect.toDragData();
        }

        // Action
        else if (li.dataset.actionName) {
            const action = this.actor.system.actions.getName(
                li.dataset.actionName,
            );
            dragData = action.toDragData();
        }

        if (!dragData) return;

        // Set data transfer
        event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    }
}

export class SohlCombatant extends Combatant {
    async _preCreate(createData, options, user) {
        let allowed = await super._preCreate(createData, options, user);
        if (allowed === false) return false;
        if (!createData.initiative) {
            this.updateSource({
                initiative: this.actor?.system.initiativeRank || 0,
            });
        }
    }
}

export class SohlActor extends NestableDocumentMixin(Actor) {
    $speaker;

    get speaker() {
        if (!this.$speaker) {
            this.$speaker = ChatMessage.getSpeaker({
                token: this.token,
                actor: this,
            });
        }
        return this.$speaker;
    }

    /**
     * Union of all owned items and virtual items
     */
    *allItems() {
        for (let it of this.items.values()) yield it;
        for (let it of this.system.virtualItems.values()) yield it;
    }

    /**
     * Version of the allItems generator that handles dynamically adding
     * items to the virtualItems collection.
     */
    *dynamicAllItems() {
        const yielded = new Set();

        // Yield all initial items
        for (let it of this.items.values()) {
            yield it;
            yielded.add(it.id);
        }

        // Continuously check for new items
        let newItemsFound = !!this.system.virtualItems.size;
        while (newItemsFound) {
            newItemsFound = false;

            for (let it of this.system.virtualItems.values()) {
                if (!yielded.has(it.id)) {
                    yield it;
                    yielded.add(it.id);
                    newItemsFound = true;
                }
            }
        }
    }

    /** @override */
    get itemTypes() {
        const types = Object.fromEntries(
            game.documentTypes.Item.map((t) => [t, []]),
        );
        const ary = Array.from(this.allItems()).sort((a, b) => a.sort - b.sort);
        const result = ary.reduce((obj, it) => {
            obj[it.type].push(it);
            return obj;
        }, types);

        return result;
    }

    get itemSubtypes() {
        const result = Object.values(CONFIG.Item.dataModels).reduce(
            (ist, clazz) => {
                // Only create a subtype list if there are, in fact, subtypes defined
                if (clazz.subTypes) {
                    ist[clazz.TYPE_NAME] = Object.fromEntries(
                        Object.keys(clazz.subTypes).map((key) => [
                            key,
                            { label: clazz.subTypes[key], items: [] },
                        ]),
                    );
                }
                return ist;
            },
            {},
        );

        // Load up all subtype lists
        const ary = Array.from(this.allItems()).sort((a, b) => a.sort - b.sort);
        ary.forEach((it) => {
            if (it.system instanceof TraitItemData) {
                if (it.system.intensity !== "attribute") {
                    result.trait[it.system.subType].items.push(it);
                }
            } else if (it.system.subType) {
                if (!result[it.type]?.[it.system.subType]) {
                    console.error(
                        `Item ${it.id} type ${it.type} has invalid subtype ${it.system.subType}`,
                    );
                    result[it.type][it.system.subType] = {
                        label: `!!BAD!! ${it.system.subType}`,
                        items: [],
                    };
                }
                result[it.type][it.system.subType].items.push(it);
            }
        });

        return result;
    }

    get sunsign() {
        if (!this._sunsign) {
            const sunsignTrait = this.getTraitByAbbrev("ss");
            if (!sunsignTrait) {
                console.warn(`No Sunsign trait on actor ${this.name}`);
                return "";
            } else {
                this._sunsign = sunsignTrait.system.textValue;
            }
        }
        return this._sunsign;
    }

    /**
     * Try several things to determine what the current actor is.  These include: (1) if UUID is specified, find
     * the actor with that UUID; (2) If there is a combat ongoing, and if the current combatant is owned, then
     * select that actor, or (3) if there is a character defined in the user profile, choose that actor.
     *
     * @param {string} actorUuid
     * @returns The SohlActor that was identified.
     */
    static getActor(actorUuid = null) {
        let actor = null;

        if (actorUuid) {
            actor = fromUuidSync(actorUuid);
            if (!actor) {
                ui.notifications.warn(
                    `Cannot find actor with UUID ${actorUuid}`,
                );
                return null;
            }
        } else {
            // We have to guess which actor to select.
            // If in combat, then choose the combatant whose turn it is
            actor = game.combat?.combatant?.actor;
            if (!actor?.isOwner) {
                // If we're not an owner of the current combatant (or we are not in combat), then
                // fallback to our "user character" (if defined)
                actor = game.user.character;
                if (!actor) {
                    const msg = `Cannot identify a default character; please consider defining your default character in your user profile.`;
                    console.warn(`sohl.SoHL | ${msg}`);
                    ui.notifications.warn(msg);
                    return null;
                }
            }
        }

        return actor;
    }

    /**
     * Finds the token associated with this actor.  If this actor is a synthetic actor,
     * then this is trivial.  But if this actor is not synthetic, then this method will
     * search through the current scene to find the appropriate token associated with this
     * actor.
     *
     * If a token in the current scene is selected, and it is linked to this actor, then it
     * is chosen.  If no token is selected, then choose one at random (in the best case there
     * will only be one linked token anyway).
     *
     * @param {*} targetTokenUuid Prospective token UUID to use if a linked token
     * @returns {TokenDocument} the TokenDocument associated with this actor
     */

    getToken(targetTokenUuid) {
        // If this is a synthetic actor, then get the token associated with the actor
        let tokenDocument = this.token;

        // Actor is a linked token
        if (!tokenDocument && targetTokenUuid) {
            tokenDocument = fromUuidSync(targetTokenUuid)?.document;
        }

        if (!tokenDocument && canvas.tokens) {
            // Case 1: A single token is selected, and it is the actor we are looking for
            if (
                canvas.tokens.controlled?.length == 1 &&
                canvas.tokens.controlled[0].actor.id === this.id
            ) {
                tokenDocument = canvas.tokens.controlled[0].document;
            }

            if (!tokenDocument) {
                // Case 2: Search all tokens on the active scene, and select the first
                // one found where the token's actor is the one we are looking for
                const token = canvas.scene?.tokens.find(
                    (t) => t.actor.id === this.id,
                );
                tokenDocument = token.document;
            }
        }

        return tokenDocument;
    }

    /**
     * Determines the actor to handle a button event, based on who pressed the button.
     * Options are the sum of:
     * User's character actor.
     * If there is an active scene, all of the tokens on the active scene owned by the user.
     * All of the global actors which are owned by the user.
     * If the result is more than one actor, display a dialog asking the user to select one.
     *
     * @returns {SohlActor|null} one SohlActor document, or null if none can be found.
     */
    static async getHandlerActor() {
        const actors = [];

        // If the user has a character defined, add it to the list of actors
        if (game.user.character) {
            actors.push(game.user.character);
        }

        // Find all of the tokens on the canvas, and if the current user has ownership permission, add them to the list.
        canvas.tokens.placeables.forEach((token) => {
            if (token.actor?.testUserPermission(game.user, "OWNER")) {
                if (!actors.some((a) => a.id === token.actor.id))
                    actors.push(token.actor);
            }
        });

        // Find all of the global actors who the current user has OWNER permission for, and add them to the list.
        game.actors.forEach((actor) => {
            if (actor.testUserPermission(game.user, "OWNER")) {
                if (!actors.some((a) => a.id === actor.id)) actors.push(actor);
            }
        });

        if (actors.length === 0) return null;
        if (actors.length === 1) return actors[0].value;

        let dlgHtml = `<form>
                <div class="form-group">
                    <label>Animate Entities:</label>
                    <select name="entity">`;

        actors.forEach((a, i) => {
            dlgHtml += `<option value="${a.uuid}"${!i ? " selected" : ""}>${
                a.name
            }</option>`;
        });
        dlgHtml += `</select></div></form>`;

        // Pop up the dialog to get the character selection
        const dlgResult = await Dialog.prompt({
            title: "Select Animate Entity",
            content: dlgHtml.trim(),
            label: "OK",
            callback: (element) => {
                const form = element.querySelector("form");
                const fd = new FormDataExtended(form);
                const formData = foundry.utils.expandObject(fd.object);
                const actor = fromUuidSync(formData.entity);
                return actor;
            },
            rejectClose: false,
            options: { jQuery: false },
        });

        return dlgResult;
    }

    static createUniqueName(baseName) {
        if (!baseName) {
            throw new Error("Must provide baseName");
        }
        const takenNames = new Set();
        for (const document of game.actors) takenNames.add(document.name);
        let name = baseName;
        let index = 1;
        while (takenNames.has(name)) name = `${baseName} (${++index})`;
        return name;
    }

    /** @override */
    async _preCreate(createData, options, user) {
        const allowed = await super._preCreate(createData, options, user);
        if (allowed === false) return false;
        let updateData = {};

        const similarActorExists =
            !this.pack &&
            game.actors.some(
                (actor) =>
                    actor.type === createData.type &&
                    actor.name === createData.name,
            );
        if (similarActorExists) {
            updateData["name"] = SohlActor.createUniqueName(createData.name);
        }

        // If the created actor has items (only applicable to duplicated actors) bypass the new actor creation logic
        if (createData.items) {
            if (options.cloneActorUuid) {
                const cloneActor = await fromUuid(options.cloneActorUuid);
                if (cloneActor) {
                    let newData = cloneActor.toObject();
                    delete newData._id;
                    delete newData.folder;
                    delete newData.sort;
                    delete newData.pack;
                    if ("ownership" in newData) {
                        newData.ownership = {
                            default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER,
                            [game.user.id]:
                                CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER,
                        };
                    }

                    updateData = foundry.utils.mergeObject(newData, createData);
                }
            }

            const artwork = this.constructor.getDefaultArtwork(this.toObject());
            if (!this.img) updateData["img"] = artwork.img;
            if (!this.prototypeToken.texture.src)
                updateData["prototypeToken.texture.src"] = artwork.texture.src;

            // If a rollFormula is provided, then we will perform the designated rolling
            // for all attributes, and then for all skills we will calculate the initial
            // mastery level based on those attributes.
            if (options.rollFormula) {
                for (const obj of updateData.items) {
                    if (
                        options.rollFormula &&
                        obj.type === "trait" &&
                        obj.system.intensity === "attribute"
                    ) {
                        const rollFormula =
                            (options.rollFormula === "default"
                                ? obj.flags?.sohl?.diceFormula
                                : options.rollFormula) || "0";

                        let roll = Roll.create(rollFormula);
                        roll = await roll.evaluate().catch((err) => {
                            Hooks.onError("SohlActor#_preCreate", err, {
                                msg: `Roll formula "${rollFormula}" is invalid`,
                                log: "error",
                            });
                            return false;
                        });
                        obj.system.textValue = roll.total.toString();
                    }
                }

                // Calculate initial skills mastery levels
                for (const obj of updateData.items) {
                    if (obj.type === "skill") {
                        if (obj.flags?.sohl?.legendary?.initSkillMult) {
                            const sb = new SkillBase(
                                obj.system.skillBaseFormula,
                                {
                                    items: updateData.items,
                                },
                            );
                            obj.system.masteryLevelBase =
                                sb.value *
                                obj.flags.sohl.legendary.initSkillMult;
                        }
                    }
                }
            }
        }

        this.updateSource(updateData);

        return true;
    }

    _onCreate(data, options, userId) {
        super._onCreate(data, options, userId);
        this.updateEffectsOrigin();
    }

    _onSortItem(event, itemData) {
        // Get the drag source and drop target
        let source;
        for (const it of this.allItems()) {
            if (it.id === itemData._id) {
                source = it;
                break;
            }
        }

        const dropTarget = event.target.closest("[data-item-id]");
        if (!dropTarget) return;
        let target;
        for (const it of this.allItems()) {
            if (it.id === dropTarget.dataset.itemId) {
                target = it;
                break;
            }
        }

        // Don't sort on yourself
        if (source.id === target.id) return;

        // Identify sibling items based on adjacent HTML elements
        const siblings = [];
        for (let el of dropTarget.parentElement.children) {
            const siblingId = el.dataset.itemId;
            if (siblingId && siblingId !== source.id) {
                for (const it of this.allItems()) {
                    if (it.id === el.dataset.itemId) {
                        siblings.push(it);
                        break;
                    }
                }
            }
        }

        // Perform the sort
        const sortUpdates = SortingHelpers.performIntegerSort(source, {
            target,
            siblings,
        });

        sortUpdates.forEach((u) => {
            const update = u.update;
            const item = this.getItem(u.target._id);
            item.update(update);
        });
    }

    prepareEmbeddedDocuments() {
        // The Actor#prepareEmbeddedDocuments method performs Active Effect processing after
        // preparing the embedded documents, but we don't want that.  So we fully override to
        // put back in the basic implementation from ClientDocument.
        for (const collectionName of Object.keys(
            this.constructor.hierarchy || {},
        )) {
            for (let e of this.getEmbeddedCollection(collectionName)) {
                e._safePrepareData();
            }
        }

        // At this point, the virtual items list is empty.  We now go through
        // all of the "owned" items and request them to setup any virtual items they need.
        // Any of those items that setup virtual items will have "setupVirtualItems" called
        // when they are added to the Virtual Items list.
        for (const it of this.dynamicAllItems()) {
            it.system.execute("Setup Virtual Items", { inPrepareData: true });
        }

        // Apply item active effects
        for (const it of this.allItems()) {
            // If item is nested, ensure all active effects have been started
            // if (it.isNested) {
            //     it.effects.forEach((e) => {
            //         if (!e.duration.startTime) {
            //             e.update(
            //                 ActiveEffect.implementation.getInitialDuration(),
            //             );
            //         }
            //     });
            // }
            it.applyActiveEffects();
        }

        // Apply actor active effects
        this.applyActiveEffects();

        // Process any item activities that require access to sibling items
        // Prior to this point accessing item siblings is unsafe
        for (const it of this.allItems()) {
            it.system.execute("Process Siblings", { inPrepareData: true });
            if (it instanceof GearItemData) {
                Hooks.callAll(`gearProcessSiblings`, it.system);
            }
            Hooks.callAll(`${it.type}ProcessSiblings`, it.system);
        }
    }

    prepareDerivedData() {
        super.prepareDerivedData();

        // Perform final processing of all items after the actor's
        // derived data has all been completed.
        for (const it of this.allItems()) {
            it.system.execute("Post-Process", { inPrepareData: true });
            if (it instanceof GearItemData) {
                Hooks.callAll(`gearPostProcess`, it.system);
            }
            Hooks.callAll(`${it.type}PostProcess`, it.system);
        }
    }

    async updateEffectsOrigin() {
        // If we are in a compendium, do nothing
        if (this.pack) return;

        const actorUpdate = this.effects.reduce((toUpdate, e) => {
            if (e.origin !== this.uuid) {
                return toUpdate.concat({ _id: e.id, origin: this.uuid });
            }
            return toUpdate;
        }, []);
        if (actorUpdate.length) {
            await this.updateEmbeddedDocuments("ActiveEffect", actorUpdate);
        }

        for (const it of this.items) {
            const toUpdate = it.updateEffectsOrigin();
            if (toUpdate.length) {
                await it.updateEmbeddedDocuments("ActiveEffect", toUpdate);
            }
        }

        this.system.virtualItems.forEach((it) => {
            const toUpdate = it.updateEffectsOrigin();
            while (toUpdate.length) {
                const eChange = toUpdate.pop();
                const effect = it.effects.get(eChange._id);
                if (effect) {
                    effect.update({ origin: eChange.origin });
                }
            }
        });
    }

    /**
     * Get a reference to the trait item on the actor.
     *
     * @param {string} abbrev Abbreviation of trait Item to find
     * @returns {SohlItem} SohlItem of the trait.
     */
    getTraitByAbbrev(abbrev) {
        let result = null;
        for (const it of this.allItems()) {
            if (
                it.system instanceof TraitItemData &&
                it.system.abbrev === abbrev
            ) {
                result = it;
                break;
            }
        }
        return result;
    }

    /**
     * Get a reference to the trait item on the actor.
     *
     * @param {string} abbrev Abbreviation of trait Item to find
     * @returns {SohlItem} SohlItem of the trait.
     */
    getSkillByAbbrev(abbrev) {
        let result = null;
        for (const it of this.allItems()) {
            if (
                it.system instanceof SkillItemData &&
                it.system.abbrev === abbrev
            ) {
                result = it;
                break;
            }
        }
        return result;
    }

    /**
     * Finds an Item by name or UUID. If name is provided, searches within the specified actor.
     *
     * @param {String} itemName Either an item id, an item UUID, or an item name
     * @param {String} type The type of Item (e.g., "weapongear")
     */
    getItem(itemName, { types = [], isName = false } = {}) {
        if (!itemName) {
            throw new Error(`Must specify a name, id, or UUID`);
        }

        const formatter = game.i18n.getListFormatter();
        const typeNames =
            formatter.format(types.map((t) => _l(CONFIG.Item.typeLabels[t]))) ||
            _l("item");

        let item = null;
        if (itemName.includes(".")) {
            // The name may be a UUID since it contains a dot

            // First, check all items on this actor
            for (let it of this.allItems()) {
                if (it.uuid === itemName) {
                    item = it;
                    break;
                }
            }

            // If item wasn't found, then perform a more general search for the UUID
            if (!item) item = fromUuidSync(itemName);

            if (
                item &&
                !(item instanceof SohlItem && item.actor.id === this.id)
            ) {
                throw new Error(
                    `${itemName} does not refer to an item in actor ${this.name}`,
                );
            }
        }

        if (!item) {
            // Not an item UUID, so we assume it must be an item id or name.

            let items = [];
            if (types?.length) {
                // Type(s) have been specified, so we can use these as a hint as to where to look
                // for the items.
                for (const it of this.allItems()) {
                    if (types.includes(it.type)) {
                        const testVal = isName ? it.name : it.system.abbrev;
                        if (testVal === itemName) items.push(it);
                    }
                }
            } else {
                // No types have been specified, so our only option is to assume it is an item ID and look for that
                for (let candidate of this.allItems()) {
                    if (candidate.id === itemName) {
                        items = [candidate];
                        break;
                    }
                }
            }

            if (items.length > 1) {
                const msg = `Actor ${this.token?.name || this.name} has more than one ${typeNames} with name ${itemName}. The first matched item will be chosen.`;
                if (ui.notifications) {
                    ui.notifications.warn(msg);
                } else {
                    console.warn(msg);
                }
                return null;
            }

            // Filter returns potentially multiple matches; so just choose the
            // first one as the result (there really should be only one result
            // anyway, or the name is ambiguous).
            item = items[0];
        }

        if (!item || (types.length && !types.includes(item.type))) {
            const msg = `Actor ${this.token?.name || this.name} does not have an ${typeNames} named ${itemName}`;
            if (ui.notifications) {
                ui.notifications.warn(msg);
            } else {
                console.warn(msg);
            }
            return null;
        }

        return item;
    }

    isValidItem(item, types = []) {
        if (!(item?.system instanceof SohlItemData)) {
            throw new Error(`Provided object is not a valid Item`);
        }

        if (!types.includes(item.type)) {
            const formatter = game.i18n.getListFormatter();
            throw new Error(
                `Item ${item.system.metadata.label} must be one of "${formatter(
                    types.map((t) => _l(`TYPES.Item.${t}.label`)),
                )}")}`,
            );
        }
    }

    /**
     * Gathers all effects from all items that are targeting the Actor and returns them as an array.
     *
     * @readonly
     * @type {*}
     */
    get transferredEffects() {
        // Gather all of the effects from all items that are targeting the Actor
        const result = [];
        for (const it of this.allItems()) {
            const actorEffects = it.effects.filter(
                (e) => e.system.targetType === "actor",
            );
            result.push(...actorEffects);
        }

        return result;
    }

    *allApplicableEffects() {
        // Grab all of the effects on this actor that affect this actor
        const effects = this.effects.filter((e) =>
            ["this", "actor"].includes(e.system.targetType),
        );
        for (const effect of effects) {
            yield effect;
        }

        // Add all of the transferred effects from the items that affect this actor
        for (const effect of this.transferredEffects) {
            yield effect;
        }
    }

    /**
     * Apply all active effects to the actor, including special statuses, effects from items, and transferred effects. Update overrides and special statuses for the actor and its items accordingly.
     */
    applyActiveEffects() {
        const overrides = {
            [this.id]: {},
        };
        this.statuses.clear();

        // Organize non-disabled effects by their application priority
        const changes = [];
        for (const effect of this.allApplicableEffects()) {
            if (!effect.active) continue;
            const targets = effect.system.targets;
            if (!targets?.length) continue;
            changes.push(
                ...effect.changes.map((change) => {
                    const c = foundry.utils.deepClone(change);
                    c.targets = targets;
                    c.effect = effect;
                    c.priority = c.priority ?? c.mode * 10;
                    return c;
                }),
            );
            for (const statusId of effect.statuses) this.statuses.add(statusId);
        }
        changes.sort((a, b) => a.priority - b.priority);

        // Apply all changes
        for (let change of changes) {
            if (!change.key) continue;
            if (!change.targets?.length) continue;
            change.targets.forEach((t) => {
                const changes = change.effect.apply(t, change);
                if (Object.keys(changes).length) {
                    if (typeof overrides[t.id] === "object")
                        foundry.utils.mergeObject(overrides[t.id], changes);
                    else overrides[t.id] = changes;
                }
            });
        }

        // Expand the set of final overrides
        this.overrides = foundry.utils.expandObject(overrides[this.id]);
        for (const it of this.allItems()) {
            if (overrides[it.id])
                it.overrides = foundry.utils.expandObject(overrides[it.id]);
        }
    }

    /**
     * Executes the checkAndExecute method for EventItemData instances in the allItems array and checks and disables expired effects for each item in the allItems array as well as the effects array.
     */
    timeChangeWork() {
        for (const it of this.allItems()) {
            if (it.system instanceof EventItemData) it.checkAndExecute();
            it.effects.forEach((effect) => effect.checkExpiredAndDisable());
        }
        this.effects.forEach((effect) => effect.checkExpiredAndDisable());
    }

    /**
     * Add all of the items from a pack with the specified names to this actor
     * @param {String[]} itemNames Array of item names to include
     * @param {String} packName Name of compendium pack containing items
     * @param {Object[]} items array of ItemData elements to populate
     */
    static async _addItemsFromPack(
        itemNames,
        packNames,
        { itemType, keepId } = {},
    ) {
        let itNames = foundry.utils.deepClone(itemNames);
        const itemAry = [];
        for (let itName of itNames) {
            const data = await Utility.getItemFromPacks(itName, packNames, {
                itemType,
                keepId,
            });
            if (data) itemAry.push(data);
        }

        return itemAry;
    }

    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    static async fromDropData(data, options = {}) {
        let document = null;

        // Case 1 - Data explicitly provided
        if (data.data) document = new this(data.data);
        // Case 2 - UUID provided
        else if (data.uuid) document = await fromUuid(data.uuid);

        // Ensure that we retrieved a valid document
        if (!document) {
            throw new Error(
                "Failed to resolve Document from provided DragData. Either data or a UUID must be provided.",
            );
        }
        if (document.documentName !== this.documentName) {
            throw new Error(
                `Invalid Document type '${document.type}' provided to ${this.name}.fromDropData.`,
            );
        }

        // Flag the source UUID
        if (document.id && !document._stats?.compendiumSource) {
            let uuid = document.uuid.split("#").at(0);
            document.updateSource({ "_stats.compendiumSource": uuid });
        }
        return document;
    }

    static async importActors(jsonFilename, folderName) {
        const response = await fetch(jsonFilename);
        const content = await response.json();

        let actorFolder = game.folders.find(
            (f) => f.name === folderName && f.type === "Actor",
        );
        if (actorFolder) {
            const msg = `Folder ${folderName} exists, delete it before proceeding`;
            console.error(msg);
            return;
        }

        actorFolder = await Folder.create({ type: "Actor", name: folderName });

        await Utility.asyncForEach(content.Actor, async (f) => {
            console.log("Processing Actor ${f.name}");
            const actor = await this.create({ name: f.name });
            const updateData = [];
            const itemData = [];
            // Fill in attribute values
            Object.keys(f.system.attributes).forEach((attr) => {
                const attrItem = actor.items.find(
                    (it) =>
                        it.system instanceof TraitItemData &&
                        it.name.toLowerCase() === attr,
                );
                if (attrItem)
                    itemData.push({
                        _id: attrItem.id,
                        "system.textValue": f.system.attributes[attr].base,
                    });
            });

            updateData.push({
                "system.description": f.system.description,
                "system.bioImage": f.system.bioImage,
                "system.biography": f.system.biography,
                "prototypeToken.actorLink": f.prototypeToken.actorLink,
                "prototypeToken.name": f.prototypeToken.name,
                "prototypeToken.texture.src": f.prototypeToken.texture.src,
                folder: actorFolder.id,
                items: itemData,
            });

            await actor.update(updateData);
        });
    }
}

function SohlSheetMixin(Base) {
    return class SohlSheet extends Base {
        /** @override */
        static get defaultOptions() {
            return foundry.utils.mergeObject(super.defaultOptions, {
                tabs: [
                    {
                        navSelector: ".sheet-tabs",
                        contentSelector: ".sheet-body",
                        initial: "properties",
                    },
                ],
                dragDrop: [
                    { dragSelector: ".item-list .item", dropSelector: null },
                ],
            });
        }

        get template() {
            return this.document.system.constructor.sheet;
        }

        getData() {
            const data = super.getData();
            data.variant = CONFIG.SOHL.id;
            data.const = SOHL;
            data.config = CONFIG.SOHL;
            data.owner = this.document.isOwner;
            data.limited = this.document.limited;
            data.options = this.options;
            data.editable = this.isEditable;
            data.cssClass = data.owner ? "editable" : "locked";
            data.variant = CONFIG.SOHL.id;
            data.isAnimateEntity =
                this.document.system instanceof AnimateEntityActorData;
            data.isInanimateObject =
                this.document.system instanceof InanimateObjectActorData;
            data.actor =
                this.document instanceof SohlActor
                    ? this.document
                    : this.document.actor;
            data.flags = this.document.flags;
            data.system = this.document.system;
            data.isGM = game.user.isGM;
            data.fields = this.document.system.schema.fields;

            data.effects = this.document.effects;

            // Collect all effects from other Items/Actors that are affecting this item
            data.trxEffects = {};
            this.document.transferredEffects.forEach((effect) => {
                if (!effect.disabled) {
                    data.trxEffects[effect.id] = effect;
                }
            });

            return data;
        }

        /** @override */
        // biome-ignore lint/correctness/noUnusedVariables: <explanation>
        _onSearchFilter(event, query, rgx, html) {
            if (!html) return;
            const element = html instanceof jQuery ? html[0] : html;

            const visibleCategories = new Set();

            for (const entry of element.querySelectorAll(".item")) {
                if (!query) {
                    entry.classList.remove("hidden");
                    continue;
                }

                const name = entry.dataset.itemName;
                const match = name && rgx.test(SearchFilter.cleanQuery(name));
                entry.classList.toggle("hidden", !match);
                if (match)
                    visibleCategories.add(
                        entry.parentElement.parentElement.dataset.category,
                    );
            }

            for (const category of element.querySelectorAll(".category")) {
                category.classList.toggle(
                    "hidden",
                    query && !visibleCategories.has(category.dataset.category),
                );
            }
        }

        _contextMenu(element) {
            new SohlContextMenu(element, ".item", [], {
                onOpen: this._onItemContextMenuOpen.bind(this),
                jQuery: false,
            });
            new SohlContextMenu(element, ".item-contextmenu", [], {
                eventName: "click",
                onOpen: this._onItemContextMenuOpen.bind(this),
                jQuery: false,
            });
            new SohlContextMenu(element, ".effect", [], {
                onOpen: this._onEffectContextMenuOpen.bind(this),
                jQuery: false,
            });
            new SohlContextMenu(element, ".effect-contextmenu", [], {
                eventName: "click",
                onOpen: this._onEffectContextMenuOpen.bind(this),
                jQuery: false,
            });
        }

        _onItemContextMenuOpen(element) {
            let ele = element.closest("[data-item-id]");
            if (!ele) return;
            const actionName = ele?.dataset.actionName;
            const docId = ele?.dataset.itemId;
            let doc;
            if (actionName) {
                doc = this.document.system.actions.get(docId);
            } else {
                doc =
                    this.document instanceof SohlItem
                        ? this.document.getNestedItemById(docId)
                        : this.document instanceof SohlActor
                          ? this.document.getItem(docId)
                          : null;
            }
            ui.context.menuItems = doc
                ? this.constructor._getContextOptions(doc)
                : [];
        }

        _onEffectContextMenuOpen(element) {
            let ele = element.closest("[data-effect-id]");
            if (!ele) return;
            const effectId = ele?.dataset.effectId;
            const effect = this.document.effects.get(effectId);
            ui.context.menuItems = effect
                ? this.constructor._getContextOptions(effect)
                : [];
        }

        /**
         * Retrieve the context options for the given item. Sort the menu items based on groups, with items having no group at the top, items in the 'primary' group in the middle, and items in the 'secondary' group at the bottom.
         *
         * @static
         * @param {*} doc
         * @returns {*}
         */
        static _getContextOptions(doc) {
            let result =
                doc.system instanceof SohlBaseData
                    ? doc.system._getContextOptions()
                    : doc._getContextOptions();

            result = result.filter(
                (co) => co.group !== SohlContextMenu.SORT_GROUPS.HIDDEN,
            );

            // Sort the menu items according to group.  Expect items with no group
            // at the top, items in the "primary" group next, and items in the
            // "secondary" group last.
            Utility.sortStrings(result);
            return result;
        }

        async _onEffectToggle(event) {
            const li = event.currentTarget.closest(".effect");
            const effect = this.document.effects.get(li.dataset.effectId);
            return await effect.toggleEnabledState();
        }

        async _onEffectCreate() {
            let name = "New Effect";
            let i = 0;
            while (this.document.effects.some((e) => e.name === name)) {
                name = `New Effect ${++i}`;
            }
            const aeData = {
                name,
                type: SohlActiveEffectData.TYPE_NAME,
                icon: SohlActiveEffectData.defaultImage,
                origin: this.document.uuid,
            };

            return SohlActiveEffect.create(aeData, {
                parent: this.document,
            });
        }

        /** @inheritdoc */
        _onDragStart(event) {
            const li = event.currentTarget;
            if ("link" in event.target.dataset) return;

            // Create drag data
            let dragData;

            // Owned Items
            if (li.dataset.uuid) {
                const item = fromUuidSync(li.dataset.uuid);
                dragData = item.toDragData();
            }

            // Active Effect
            else if (li.dataset.effectId) {
                const effect = this.actor.effects.get(li.dataset.effectId);
                dragData = effect.toDragData();
            }

            // Action
            else if (li.dataset.actionName) {
                const action = this.actor.system.actions.getName(
                    li.dataset.actionName,
                );
                dragData = action.toDragData();
            }

            if (!dragData) return;

            // Set data transfer
            event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
        }

        /** @override */
        async _onDropItem(event, data) {
            if (!this.document.isOwner) return false;

            const droppedItem = await SohlItem.fromDropData(data);
            if (!droppedItem) return false;

            if (droppedItem.system instanceof GearItemData) {
                return this._onDropGear(event, droppedItem);
            } else {
                return this._onDropNonGear(event, droppedItem);
            }
        }

        /** @override */
        async _onDropItemCreate(data, event) {
            if (!this.document.isOwner) return false;

            const isActor = this.document instanceof SohlActor;
            const items = isActor
                ? this.document.items
                : this.document.system.items;

            const itemList = data instanceof Array ? data : [data];
            const toCreate = [];
            for (let itemData of itemList) {
                // Body items cannot be placed directly on actor; these must always be
                // in an Anatomy object instead
                if (isActor && itemData.type.startsWith("body")) {
                    ui.notifications.warn(
                        _l("You may not drop a {itemType} onto an Actor", {
                            itemType: _l(`TYPES.Item.${itemData.type}.label`),
                        }),
                    );
                    return false;
                }

                // Determine if a similar item exists
                let similarItem;
                if (isActor && itemData.type === AnatomyItemData.TYPE_NAME) {
                    // Only one Anatomy item is allowed to be on an actor at any time,
                    // so any existing one will be considered "similar".
                    similarItem = items.find(
                        (it) => it.type === AnatomyItemData.TYPE_NAME,
                    );
                }

                if (!similarItem) {
                    similarItem = items.find(
                        (it) =>
                            it.name === itemData.name &&
                            it.type === itemData.type &&
                            it.system.subType === itemData.system.subType,
                    );
                }

                if (similarItem) {
                    const confirm = await Dialog.confirm({
                        title: `Confirm Overwrite: ${similarItem.label}`,
                        content: `<p>Are You Sure?</p><p>This item will be overwritten and cannot be recovered.</p>`,
                        options: { jQuery: false },
                    });
                    if (confirm) {
                        delete itemData._id;
                        delete itemData.pack;
                        let result = await similarItem.delete();
                        if (result) {
                            result = await this.document.constructor.create(
                                itemData,
                                {
                                    parent: isActor
                                        ? this.document
                                        : this.document.actor,
                                    clean: true,
                                },
                            );
                        } else {
                            ui.notifications.warn("Overwrite failed");
                            continue;
                        }
                        toCreate.push(itemData);
                    }
                } else {
                    toCreate.push(itemData);
                }
            }

            return super._onDropItemCreate(toCreate, event);
        }

        async _onDropGear(event, droppedItem) {
            const destContainerId = event.target.closest("[data-container-id]")
                ?.dataset.containerId;

            // If no other container is specified, use this item
            let destContainer;
            if (this.document instanceof SohlItem) {
                destContainer = !destContainerId
                    ? this.document
                    : this.document.actor?.items.get(destContainerId) ||
                      this.document.getNestedItemById(destContainerId) ||
                      this.document;
            } else {
                destContainer = !destContainerId
                    ? this.document
                    : this.document.items.get(destContainerId);
            }

            if (
                (destContainer instanceof SohlItem &&
                    destContainer.id === droppedItem.nestedIn?.id) ||
                (destContainer instanceof SohlActor &&
                    destContainer.id === droppedItem.parent?.id)
            ) {
                // If dropped item is already in a container and
                // source and dest containers are the same,
                // then we are simply rearranging
                return await destContainer._onSortItem(
                    event,
                    droppedItem.toObject(),
                );
            }

            if (droppedItem.id === destContainer.id) {
                // Prohibit moving a container into itself
                ui.notifications.warn("Can't move a container into itself");
                return false;
            }

            const items =
                destContainer instanceof SohlItem
                    ? destContainer.system.items
                    : destContainer.items;
            const similarItem = items.find(
                (it) =>
                    droppedItem.id === it.id ||
                    (droppedItem.name === it.name &&
                        droppedItem.type === it.type),
            );

            if (similarItem) {
                ui.notifications.error(
                    `Similar item exists in ${destContainer.name}`,
                );
                return false;
            }

            let quantity = droppedItem.system.quantity;
            if (quantity > 1 && !droppedItem.parent) {
                // Ask how many to move
                quantity = await Utility.moveQtyDialog(
                    droppedItem,
                    destContainer,
                );
            }

            return await droppedItem.nestIn(destContainer, {
                quantity,
                destructive: true,
            });
        }

        async _onDropNonGear(event, droppedItem) {
            if (
                droppedItem.nestedIn?.id === this.document.id ||
                droppedItem.parent?.id === this.document.id
            ) {
                // Sort items
                return this.document._onSortItem(event, droppedItem.toObject());
            } else {
                if (this.document instanceof SohlActor) {
                    const newItem = await SohlItem.create(
                        droppedItem.toObject(),
                        {
                            parent: this.document,
                        },
                    );
                    if (!droppedItem.fromCompendiumOrWorld) {
                        await droppedItem.delete();
                    }
                    return newItem;
                } else {
                    const result = this._onDropItemCreate(
                        droppedItem.toObject(),
                        event,
                    );
                    return result;
                }
            }
        }

        async _addPrimitiveArrayItem(event, { allowDuplicates = false } = {}) {
            const dataset = event.currentTarget.dataset;
            let oldArray = foundry.utils.getProperty(
                this.document,
                dataset.array,
            );
            let newArray = foundry.utils.deepClone(oldArray);
            let defaultValue = dataset.defaultValue;
            const datatype = dataset.dtype;
            const choices = dataset.choices;
            if (["Number", "String"].includes(dataset.dtype)) {
                if (dataset.dtype === "Number")
                    defaultValue = Number.parseFloat(defaultValue) || 0;
                const dialogData = {
                    valueName: dataset.title,
                    newValue: defaultValue,
                    choices,
                };

                const compiled = Handlebars.compile(`<form id="value">
                <div class="form-group">
                    <label>{{valueName}}</label>
                    {{#if choices}}
                    <select name="newValue">
                        {{selectOptions choices selected=newValue}}
                    </select>
                    {{else}}
                    <input
                        type="{{#if (eq type 'Number')}}number{{else}}text{{/if}}"
                        name="newValue"
                        value="{{newValue}}" />
                    {{/if}}
                </div>
                </form>`);
                const dlgHtml = compiled(dialogData, {
                    allowProtoMethodsByDefault: true,
                    allowProtoPropertiesByDefault: true,
                });

                const dlgResult = await Dialog.prompt({
                    title: dataset.title,
                    content: dlgHtml.trim(),
                    label: `Add ${dataset.title}`,
                    callback: (element) => {
                        const form = element.querySelector("form");
                        const fd = new FormDataExtended(form);
                        const formData = foundry.utils.expandObject(fd.object);
                        let formValue = formData.newValue;
                        if (datatype === "Number") {
                            formValue = Number.parseFloat(formValue);
                            if (Number.isNaN(formValue))
                                formValue = dataset.defaultValue;
                        }
                        return formValue;
                    },
                    rejectClose: false,
                    options: { jQuery: false },
                });

                // if dialog was closed, do nothing
                if (!dlgResult) return;

                if (!allowDuplicates && newArray.includes(dlgResult)) return;

                newArray.push(dlgResult);
                const updateData = { [dataset.array]: newArray };
                const result = await this.item.update(updateData);
                if (result) this.render();
            }
        }

        async _addChoiceArrayItem(event) {
            const dataset = event.currentTarget.dataset;
            let array = foundry.utils
                .getProperty(this.document, dataset.array)
                .concat();
            const choices = dataset.choices.split(";");
            let formTemplate =
                '<form id="get-choice"><div class="form-group"><select name="choice">';
            choices.forEach((c) => {
                let [label, val] = c.split(":").map((v) => v.trim());
                formTemplate += `<option name="${val}">${label}</option>`;
            });
            formTemplate += `</select></div></form>`;
            const compiled = Handlebars.compile(formTemplate);
            const dlgHtml = compiled(
                {},
                {
                    allowProtoMethodsByDefault: true,
                    allowProtoPropertiesByDefault: true,
                },
            );

            const dlgResult = await Dialog.prompt({
                title: dataset.title,
                content: dlgHtml.trim(),
                label: `Add ${dataset.title}`,
                callback: (element) => {
                    const form = element.querySelector("form");
                    const fd = new FormDataExtended(form);
                    const formData = foundry.utils.expandObject(fd.object);
                    return formData.choice;
                },
                rejectClose: false,
                options: { jQuery: false },
            });

            // if dialog was closed, do nothing
            if (!dlgResult) return null;

            if (array.some((a) => a === dlgResult)) {
                ui.notifications.warn(
                    `Choice with value "${dlgResult} already exists, ignoring`,
                );
                return null;
            }

            array.push(dlgResult);
            const updateData = { [dataset.array]: array };
            const result = await this.item.update(updateData);
            return result;
        }

        async _addAimArrayItem(event) {
            const dataset = event.currentTarget.dataset;
            let array = foundry.utils
                .getProperty(this.document, dataset.array)
                .concat();
            const compiled = Handlebars.compile(`<form id="aim">
        <div class="form-group flexrow">
            <div class="flexcol">
                <label>Name</label>
                <input type="text" name="name" />
            </div><div class="flexcol">
                <label>Prob Weight Base</label>
                {{numberInput 0 name="probWeightBase" min=0 step=1}}
            </div></div></form>`);
            const dlgHtml = compiled(
                {},
                {
                    allowProtoMethodsByDefault: true,
                    allowProtoPropertiesByDefault: true,
                },
            );

            const dlgResult = await Dialog.prompt({
                title: dataset.title,
                content: dlgHtml.trim(),
                label: `Add ${dataset.title}`,
                callback: (element) => {
                    const form = element.querySelector("form");
                    const fd = new FormDataExtended(form);
                    const formData = foundry.utils.expandObject(fd.object);
                    const result = {
                        name: formData.name,
                        probWeightBase:
                            Number.parseInt(formData.probWeightBase, 10) || 0,
                    };
                    return result;
                },
                rejectClose: false,
                options: { jQuery: false },
            });

            // if dialog was closed, do nothing
            if (!dlgResult) return null;

            if (array.some((a) => a.name === dlgResult.name)) {
                ui.notifications.warn(
                    `Aim with name "${dlgResult.name} already exists, ignoring`,
                );
                return null;
            }

            array.push(dlgResult);
            const updateData = { [dataset.array]: array };
            const result = await this.item.update(updateData);
            return result;
        }

        async _addValueDescArrayItem(event) {
            const dataset = event.currentTarget.dataset;
            let array = foundry.utils
                .getProperty(this.document, dataset.array)
                .concat();
            const compiled = Handlebars.compile(`<form id="aim">
                <div class="form-group flexrow">
                    <div class="flexcol">
                        <label>Label</label>
                        <input type="text" name="label" />
                    </div><div class="flexcol">
                        <label>Max Value</label>
                        {{numberInput 0 name="maxValue" min=0 step=1}}
                    </div></div></form>`);
            const dlgHtml = compiled(
                {},
                {
                    allowProtoMethodsByDefault: true,
                    allowProtoPropertiesByDefault: true,
                },
            );

            const dlgResult = await Dialog.prompt({
                title: dataset.title,
                content: dlgHtml.trim(),
                label: `Add ${dataset.title}`,
                callback: (element) => {
                    const form = element.querySelector("form");
                    const fd = new FormDataExtended(form);
                    const formData = foundry.utils.expandObject(fd.object);
                    const result = {
                        label: formData.label,
                        maxValue: Number.parseInt(formData.maxValue, 10) || 0,
                    };
                    return result;
                },
                rejectClose: false,
                options: { jQuery: false },
            });

            // if dialog was closed, do nothing
            if (!dlgResult) return null;

            if (array.some((a) => a.label === dlgResult.label)) {
                ui.notifications.warn(
                    `Aim with name "${dlgResult.name} already exists, ignoring`,
                );
                return null;
            }

            array.push(dlgResult);
            array.sort((a, b) => a.maxValue - b.maxValue);
            const updateData = { [dataset.array]: array };
            const result = await this.item.update(updateData);
            if (result) this.render();
            return result;
        }

        async _addArrayItem(event) {
            const dataset = event.currentTarget.dataset;
            await this._onSubmit(event); // Submit any unsaved changes

            let result;
            if (dataset.objectType === "Aim") {
                result = await this._addAimArrayItem(event);
            } else if (dataset.objectType === "ValueDesc") {
                result = await this._valueDescArrayItem(event);
            } else if (dataset.choices) {
                result = await this._addChoiceArrayItem(event);
            } else if (["Number", "String"].includes(dataset.dtype)) {
                result = await this._addPrimitiveArrayItem(event, {
                    allowDuplicates: dataset.allowDuplicates,
                });
            }
            if (result) this.render();
            return result;
        }

        async _deleteArrayItem(event) {
            const dataset = event.currentTarget.dataset;
            if (!dataset.array) return null;
            await this._onSubmit(event); // Submit any unsaved changes
            let array = foundry.utils.getProperty(this.document, dataset.array);
            array = array.filter((a) => a !== dataset.value);
            const result = await this.document.update({
                [dataset.array]: array,
            });
            if (result) this.render();
            return result;
        }

        async _addObjectKey(event) {
            const dataset = event.currentTarget.dataset;

            await this._onSubmit(event); // Submit any unsaved changes

            let object = foundry.utils.getProperty(
                this.document,
                dataset.object,
            );

            const dialogData = {
                variant: CONFIG.SOHL.id,
                newKey: "",
                newValue: "",
            };

            let dlgTemplate =
                "systems/sohl/templates/dialog/keyvalue-dialog.html";
            const dlgHtml = await renderTemplate(dlgTemplate, dialogData);

            const dlgResult = await Dialog.prompt({
                title: dataset.title,
                content: dlgHtml.trim(),
                label: `Add ${dataset.title}`,
                callback: (element) => {
                    const form = element.querySelector("form");
                    const fd = new FormDataExtended(form);
                    const formData = foundry.utils.expandObject(fd.object);
                    let formKey = formData.newKey;
                    let formValue = formData.newValue;
                    let value = Number.parseFloat(formValue);
                    if (Number.isNaN(value)) {
                        if (formValue === "true") value = true;
                        else if (formValue === "false") value = false;
                        else if (formValue === "null") value = null;
                        else value = formValue;
                    }
                    return { key: formKey, value: value };
                },
                rejectClose: false,
                options: { jQuery: false },
            });

            // if dialog was closed, or key is empty, do nothing
            if (!dlgResult || !dlgResult.key) return null;

            object[dlgResult.key] = dlgResult.value;
            const updateData = { [dataset.object]: object };
            const result = await this.item.update(updateData);
            if (result) this.render();
            return result;
        }

        /**
         * Asynchronously deletes a key from an object. Retrieves the dataset from the current event, submits any unsaved changes, gets the object using the dataset, deletes the specified key from the object, and updates the list on the server with the modified object.
         *
         * @async
         * @param {*} event
         * @returns {unknown}
         */
        async _deleteObjectKey(event) {
            const dataset = event.currentTarget.dataset;
            await this._onSubmit(event); // Submit any unsaved changes
            // Update the list on the server
            const result = await this.item.update({
                [dataset.object]: {
                    [`-=${dataset.key}`]: null,
                },
            });

            if (result) {
                this.render();
            }
            return result;
        }

        /** @override */
        activateListeners(html) {
            super.activateListeners(html);
            const element = html instanceof jQuery ? html[0] : html;

            // Everything below here is only needed if the sheet is editable
            if (!this.options.editable) return;

            // Ensure all text is selected when entering text input field
            this.form
                .querySelector("input[type='text']")
                ?.addEventListener("click", (ev) => {
                    const target = ev.target;
                    if (!target.dataset?.type) {
                        target.select();
                    }
                });

            this.form
                .querySelector(".effect-create")
                ?.addEventListener("click", this._onEffectCreate.bind(this));

            this.form
                .querySelector(".effect-toggle")
                ?.addEventListener("click", this._onEffectToggle.bind(this));

            this.form
                .querySelector(".alter-time")
                ?.addEventListener("click", (ev) => {
                    const property = ev.currentTarget.dataset.property;
                    let time = Number.parseInt(
                        ev.currentTarget.dataset.time,
                        10,
                    );
                    if (Number.isNaN(time)) time = 0;
                    Utility.onAlterTime(time).then((result) => {
                        if (result !== null) {
                            const updateData = { [property]: result };
                            this.item.update(updateData);
                        }
                    });
                });

            // Add/delete Object Key
            this.form
                .querySelector(".add-array-item")
                ?.addEventListener("click", this._addArrayItem.bind(this));
            this.form
                .querySelector(".delete-array-item")
                ?.addEventListener("click", this._deleteArrayItem.bind(this));

            // Add/delete Object Key
            this.form
                .querySelector(".add-object-key")
                ?.addEventListener("click", this._addObjectKey.bind(this));
            this.form
                .querySelector(".delete-object-key")
                ?.addEventListener("click", this._deleteObjectKey.bind(this));

            this.form
                .querySelector(".action-create")
                ?.addEventListener("click", (ev) => {
                    return Utility.createAction(ev, this.document);
                });

            this.form
                .querySelector(".action-execute")
                ?.addEventListener("click", (ev) => {
                    const li = ev.currentTarget.closest(".action-item");
                    const itemId = li.dataset.itemId;
                    const action = this.document.system.actions.get(itemId);
                    action.execute({ event: ev, dataset: li.dataset });
                });

            this.form
                .querySelector(".action-edit")
                ?.addEventListener("click", (ev) => {
                    const li = ev.currentTarget.closest(".action-item");
                    const itemId = li.dataset.itemId;
                    const action = this.document.system.actions.get(itemId);
                    if (!action) {
                        throw new Error(
                            `Action ${itemId} not found on ${this.document.name}.`,
                        );
                    }
                    action.sheet.render(true);
                });

            this.form
                .querySelector(".action-delete")
                ?.addEventListener("click", (ev) => {
                    const li = ev.currentTarget.closest(".action-item");
                    const itemId = li.dataset.itemId;
                    const action = this.document.system.actions.get(itemId);
                    if (!action) {
                        throw new Error(
                            `Action ${itemId} not found on ${this.document.name}.`,
                        );
                    }
                    return Utility.deleteAction(ev, action);
                });

            this.form
                .querySelector(".default-action")
                ?.addEventListener("click", (ev) => {
                    const li = ev.currentTarget.closest(".item");
                    const itemId = li.dataset.itemId;
                    let item;
                    if (this.document instanceof SohlActor) {
                        item = this.actor.getItem(itemId);
                    } else {
                        item = this.item.system.items.get(itemId);
                    }
                    if (item) {
                        const defaultAction = item.system.getDefaultAction(li);
                        if (defaultAction?.callback instanceof Function) {
                            defaultAction.callback();
                        } else {
                            ui.notifications.warn(
                                `${item.label} has no available default action`,
                            );
                        }
                    }
                });

            // Activate context menu
            this._contextMenu(element);
        }
    };
}

/**
 * Extend the basic ActorSheet with some common capabilities
 * @extends {ActorSheet}
 */
export class SohlActorSheet extends SohlSheetMixin(ActorSheet) {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["sohl", "sheet", "actor"],
            width: 900,
            height: 640,
            filters: [
                {
                    inputSelector: 'input[name="search-traits"]',
                    contentSelector: ".traits",
                },
                {
                    inputSelector: 'input[name="search-skills"]',
                    contentSelector: ".skills",
                },
                {
                    inputSelector: 'input[name="search-bodylocations"]',
                    contentSelector: ".bodylocations-list",
                },
                {
                    inputSelector: 'input[name="search-afflictions"]',
                    contentSelector: ".afflictions-list",
                },
                {
                    inputSelector: 'input[name="search-mysteries"]',
                    contentSelector: ".mysteries-list",
                },
                {
                    inputSelector: 'input[name="search-mysticalabilities"]',
                    contentSelector: ".mysticalabilities-list",
                },
                {
                    inputSelector: 'input[name="search-gear"]',
                    contentSelector: ".gear-list",
                },
                {
                    inputSelector: 'input[name="search-effects"]',
                    contentSelector: ".effects-list",
                },
            ],
        });
    }

    /** @inheritdoc */
    _getHeaderButtons() {
        let buttons = super._getHeaderButtons();
        const closeIndex = buttons.findIndex((btn) => btn.label === "Sheet");
        buttons.splice(closeIndex, 0, {
            label: "Print",
            class: "print-actor",
            icon: "fas fa-print",
            onclick: (ev) => this._onPrintActor(ev),
        });
        return buttons;
    }

    /** @override */
    getData() {
        const data = super.getData();
        (data.variant = CONFIG.SOHL.id), (data.adata = this.actor.system);
        data.labels = this.actor.labels || {};
        data.itemTypes = this.actor.itemTypes;
        data.itemSubtypes = this.actor.itemSubtypes;
        data.anatomy = this.actor.itemTypes.anatomy.at(0);
        data.effectStatus = {};
        for (const s of this.actor.statuses.values()) {
            data.effectStatus[s] = true;
        }
        data.effectStatus.auralshock = data.itemTypes.affliction.reduce(
            (b, a) => {
                if (b) return b;
                if (
                    a.system.subType === "auralshock" &&
                    a.system.$level.effective > 0
                )
                    return true;
            },
            false,
        );
        data.effectStatus.fatigue = data.itemTypes.affliction.reduce((b, a) => {
            if (b) return b;
            if (a.system.subType === "fatigue" && a.system.$level.effective > 0)
                return true;
        }, false);

        data.magicMod = this.actor.system.$magicMod;

        data.macroTypes = foundry.utils.deepClone(
            game.system.documentTypes.Macro,
        );
        data.dtypes = ["String", "Number", "Boolean"];
        data.attributes = [];
        data.philosophies = [
            {
                name: "No Philosophy",
                domains: [],
            },
        ];
        data.domains = Object.keys(PhilosophyItemData.categories).reduce(
            (obj, c) => {
                obj[c] = [];
                return obj;
            },
            {},
        );
        let cmData = {};
        let wpnData = {};
        let mslData = {};
        for (const it of this.actor.allItems()) {
            if (it.system instanceof TraitItemData) {
                if (it.system.intensity === "attribute") {
                    data.attributes.push(it);
                } else if (it.system.abbrev === "mov") {
                    data.move = it.system.$score.effective;
                }
            }

            // When processing the strike modes, ignore any strike modes that aren't associated
            // with the current version.
            if (
                it.type.endsWith("strikemode") &&
                it.system.subType === CONFIG.SOHL.id
            ) {
                if (it.type === CombatTechniqueStrikeModeItemData.TYPE_NAME) {
                    const maneuver = it.cause;

                    if (maneuver?.system instanceof CombatManeuverItemData) {
                        cmData[maneuver.name] ||= {
                            item: maneuver,
                            strikeModes: [],
                        };
                        cmData[maneuver.name].strikeModes.push(it);
                    }
                } else if (
                    it.type === MeleeWeaponStrikeModeItemData.TYPE_NAME
                ) {
                    const weapon = it.cause;
                    if (
                        weapon?.system instanceof WeaponGearItemData &&
                        weapon.system.$isHeldBy?.length >= it.system.minParts
                    ) {
                        wpnData[weapon.name] ||= {
                            item: weapon,
                            strikeModes: [],
                        };
                        wpnData[weapon.name].strikeModes.push(it);
                    }
                } else if (
                    it.type === MissileWeaponStrikeModeItemData.TYPE_NAME
                ) {
                    const weapon = it.cause;
                    if (
                        weapon?.system instanceof WeaponGearItemData &&
                        weapon.system.$isHeldBy?.length >= it.system.minParts
                    ) {
                        mslData[weapon.name] ||= {
                            item: weapon,
                            strikeModes: [],
                        };
                        mslData[weapon.name].strikeModes.push(it);
                    }
                }
            }

            if (it.system instanceof DomainItemData) {
                const philName =
                    it.system.philosophy?.trim() || "No Philosophy";
                let phil = data.philosophies.find((p) => p.name === philName);
                if (!phil) {
                    phil = {
                        name: philName,
                        domains: [],
                    };
                    data.philosophies.push(phil);
                }

                phil.domains.push(it);
                if (phil) {
                    data.domains[it.system.$category].push(it);
                }
            }
        }
        data.attributes.sort((a, b) => a.sort - b.sort);
        data.philosophies.forEach((p) =>
            p.domains.sort((a, b) => a.sort - b.sort),
        );

        let smKeys = Utility.sortStrings(Object.keys(cmData));
        if (smKeys.includes("Unarmed")) {
            smKeys = smKeys.filter((k) => k !== "Unarmed");
            smKeys.unshift("Unarmed");
        }
        data.combatmaneuvers = smKeys.reduce((ary, key) => {
            cmData[key].strikeModes.sort((a, b) => a.sort - b.sort);
            ary.push(cmData[key]);
            return ary;
        }, []);

        smKeys = Utility.sortStrings(Object.keys(wpnData));
        data.meleeweapons = smKeys.reduce((ary, key) => {
            wpnData[key].strikeModes.sort((a, b) => a.sort - b.sort);
            ary.push(wpnData[key]);
            return ary;
        }, []);

        smKeys = Utility.sortStrings(Object.keys(mslData));
        data.missileweapons = smKeys.reduce((ary, key) => {
            mslData[key].strikeModes.sort((a, b) => a.sort - b.sort);
            ary.push(mslData[key]);
            return ary;
        }, []);

        data.weightCarried = game.documentTypes.Item.reduce(
            (obj, t) => {
                if (t.endsWith("gear")) {
                    obj[t] = 0;
                }
                return obj;
            },
            { total: 0 },
        );

        for (const it of this.actor.allItems()) {
            if (it.system instanceof GearItemData) {
                data.weightCarried[it.type] += it.system.totalWeight.effective;
            }
        }

        const topContainer = {
            name: "On Body",
            id: null,
            system: {
                $capacity: this.actor.system.$gearWeight,
                notes: "",
                description: "",
                quantity: 1,
                isCarried: true,
                isEquipped: true,
                qualityBase: 0,
                durabilityBase: 0,
                textReference: "",
                macros: [],
                nestedItems: [],
                maxCapacityBase: 0,
                valueBase: 0,
                weightBase: 0,
                createdTime: 0,
                abbrev: "",
            },
            items: [],
        };
        data.containers = [topContainer];

        this.actor.items.forEach((it) => {
            if (it.system instanceof GearItemData) {
                if (it.system instanceof ContainerGearItemData) {
                    data.containers.push({
                        name: it.name,
                        id: it.id,
                        system: it.system,
                        items: [],
                    });
                }
                topContainer.items.push(it);
            }
        });

        this.actor.system.virtualItems.forEach((it) => {
            if (it.system instanceof GearItemData) {
                const containerId =
                    it.nestedIn?.system instanceof ContainerGearItemData
                        ? it.nestedIn.id
                        : null;

                const container = data.containers.find(
                    (c) => c.id === containerId,
                );
                if (container) {
                    container.items.push(it);
                }
            }
        });

        data.shock = {
            nextRerollDuration: "N/A",
        };

        return data;
    }

    async _onPrintActor() {
        // Open new window and dump HTML to it.
        const win = window.open(
            "about:blank",
            "_blank",
            "width=800,height=640,scrollbars=yes,resizable=yes,menubar=no,status=no,toolbar=no",
        );
        if (!win) {
            console.error("Failed to open print window");
            return null;
        }

        win.location.hash = "print";
        win._rootWindow = window;

        const sheetHtml = await renderTemplate(
            this.template,
            foundry.utils.mergeObject({ printable: true }, this.getData()),
        );
        win.document.write(sheetHtml);
    }

    async _onItemCreate(event) {
        if (event.preventDefault) event.preventDefault();
        const header = event.currentTarget;
        // Grab any data associated with this control.
        const dataset = header.dataset;

        const options = { parent: this.actor };
        const data = {
            name: "",
        };
        if (dataset.type) {
            if (dataset.type === "gear") {
                options.types = Utility.getChoicesMap(
                    GearItemData.TYPE,
                    "SOHL.GEAR.TYPE",
                );
                data.type = GearItemData.TYPE.MISC;
            } else if (dataset.type === "body") {
                options.types = [
                    BodyLocationItemData.TYPE_NAME,
                    BodyPartItemData.TYPE_NAME,
                    BodyZoneItemData.TYPE_NAME,
                ];
                data.type = options.types[0];
            } else {
                data.type = dataset.type;
            }
        }
        if (dataset.subType) data["system.subType"] = dataset.subType;
        const item = await SohlItem.createDialog(data, options);
        return item;
    }

    _improveToggleDialog(item) {
        const dlgHtml =
            "<p>Do you want to perform a Skill Development Roll (SDR), or just disable the flag?</p>";

        // Create the dialog window
        return new Promise((resolve) => {
            new Dialog({
                title: "Skill Development Toggle",
                content: dlgHtml.trim(),
                buttons: {
                    performSDR: {
                        label: "Perform SDR",
                        callback: async () => {
                            return await SohlActor.skillDevRoll(item);
                        },
                    },
                    disableFlag: {
                        label: "Disable Flag",
                        callback: async () => {
                            return item.update({ "system.improveFlag": false });
                        },
                    },
                },
                default: "performSDR",
                close: () => resolve(false),
            }).render(true);
        });
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        // biome-ignore lint/correctness/noUnusedVariables: <explanation>
        const element = html instanceof jQuery ? html[0] : html;

        // Everything below here is only needed if the sheet is editable
        if (!this.options.editable) return;

        // Add Inventory Item
        this.form
            .querySelector(".item-create")
            ?.addEventListener("click", this._onItemCreate.bind(this));

        // Toggle Active Effects
        this.form
            .querySelector(".toggle-status-effect")
            ?.addEventListener("click", (ev) => {
                const statusId = ev.currentTarget.dataset.statusId;
                const effect = this.actor.effects.find((e) =>
                    e.statuses.has(statusId),
                );
                if (effect) {
                    effect.delete();
                } else {
                    let effectData = CONFIG.statusEffects.find(
                        (e) => e.id === statusId,
                    );
                    const updateData = {
                        img: effectData.img,
                        name: _l(effectData.name),
                        statuses: effectData.id,
                    };
                    ActiveEffect.create(updateData, { parent: this.actor });
                }
            });

        // Hide all hideable elements
        this.form.querySelectorAll(".showhide").forEach((element) => {
            element.disabled = false;
        });

        this.form
            .querySelector(".toggle-visibility")
            ?.addEventListener("click", (ev) => {
                const filter = ".showhide";
                // (limitToClass ? `.${limitToClass}` : "") + ".showhide";
                const start = ev.currentTarget.closest(".item-list");
                const targets = start.find(filter);
                // biome-ignore lint/correctness/noUnusedVariables: <explanation>
                targets.prop("disabled", (i, val) => !val);
            });

        // Toggle carry state
        this.form
            .querySelector(".item-carry")
            ?.addEventListener("click", (ev) => {
                ev.preventDefault();
                const itemId = ev.currentTarget.closest(".item").dataset.itemId;
                const item = this.actor.getItem(itemId);

                // Only process inventory items, otherwise ignore
                if (item.system instanceof GearItemData) {
                    const attr = "system.isCarried";
                    return item.update({
                        [attr]: !foundry.utils.getProperty(item, attr),
                    });
                }

                return null;
            });

        // Toggle equip state
        this.form
            .querySelector(".item-equip")
            ?.addEventListener("click", (ev) => {
                ev.preventDefault();
                const itemId = ev.currentTarget.closest(".item").dataset.itemId;
                const item = this.actor.getItem(itemId);

                // Only process inventory items, otherwise ignore
                if (item.system instanceof GearItemData) {
                    const attr = "system.isEquipped";
                    return item.update({
                        [attr]: !foundry.utils.getProperty(item, attr),
                    });
                }

                return null;
            });

        // Toggle improve flag
        this.form
            .querySelector(".toggle-improve-flag")
            ?.addEventListener("click", (ev) => {
                ev.preventDefault();
                const itemId = ev.currentTarget.closest(".item").dataset.itemId;
                const item = this.actor.getItem(itemId);

                // Only process MasteryLevel items
                if (item?.system.isMasteryLevelItemData && !item.isVirtual) {
                    return item.system.toggleImproveFlag();
                }
                return null;
            });
    }
}

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class SohlItemSheet extends SohlSheetMixin(ItemSheet) {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["sohl", "sheet", "item"],
            width: 560,
            height: 550,
            filters: [
                {
                    inputSelector: 'input[name="search-actions"]',
                    contentSelector: ".action-list",
                },
                {
                    inputSelector: 'input[name="search-nested"]',
                    contentSelector: ".nested-item-list",
                },
                {
                    inputSelector: 'input[name="search-effects"]',
                    contentSelector: ".effects-list",
                },
            ],
        });
    }

    /* -------------------------------------------- */

    /** @override */
    getData() {
        const data = super.getData();
        data.variant = CONFIG.SOHL.id;

        // Re-define the template data references (backwards compatible)
        data.item = this.item;
        data.idata = this.item.system;
        data.itemType = this.item.type;
        data.hasActor = !!this.actor;

        data.hasTraitChoices =
            this.item.system instanceof TraitItemData &&
            Object.keys(this.item.system.choices).length;

        // If this is a container, then separate the nested items into two lists,
        // one for gear and the other for all other items.  If it is not a container,
        // then all nested items simply go into the items list.
        data.items = [];
        data.gear = [];

        data.inContainer = null;
        if (
            this.item.system instanceof GearItemData &&
            this.item.nestedIn instanceof ContainerGearItemData
        ) {
            data.inContainer = this.item.nestedIn;
        }

        if (this.item.system instanceof ContainerGearItemData) {
            const topContainer = {
                name: this.item.name,
                id: this.item.id,
                system: this.item.system,
                items: [],
            };
            data.containers = [topContainer];

            this.item.system.items.forEach((it) => {
                if (it.system instanceof ContainerGearItemData) {
                    data.containers.push({
                        name: it.name,
                        id: it.id,
                        system: it.system,
                        items: [],
                    });
                }
            });

            data.containers.forEach((c) => {
                c.system.items.forEach((ci) => {
                    if (ci.system instanceof GearItemData) {
                        c.items.push(ci);
                    }
                });
            });
        }

        data.traitChoices = this.item.system.choices; // this will only be defined for Traits, otherwise undefined
        data.bodyLocationChoices = {};

        if (this.item.actor) {
            data.holdableItems = { "": "Nothing" };
            data.combatSkills = {
                melee: { "": "None" },
                missile: { "": "None" },
                maneuver: { "": "None" },
            };

            // Generate a list of domains specific to this item
            data.domains = Object.entries(
                this.item.actor.system.$domains,
            ).reduce((obj, [cat, ary]) => {
                const tmpAry = ary.map((i) => [i.system.abbrev, i.name]);

                // If the current item's domain is not in the loaded set of domains, then temporarily
                // add it (so that it doesn't get reset from the current value)
                if (
                    !tmpAry.some(
                        ([abbrev]) => abbrev === this.item.system.domain,
                    )
                )
                    tmpAry.push([
                        this.item.system.domain,
                        `Unknown (${this.item.system.domain})`,
                    ]);

                Utility.sortStrings(tmpAry);
                obj[cat] = Object.fromEntries(tmpAry);
                return obj;
            }, {});

            for (const it of this.item.actor.allItems()) {
                // Fill appropriate lists for individual item sheets
                if (it.system instanceof BodyLocationItemData) {
                    data.bodyLocationChoices[it.uuid] = it.name;
                }

                if (it.system instanceof BodyZoneItemData) {
                    if (!data.zoneNames) {
                        data.zoneNames = [it.name];
                    } else {
                        if (!data.zoneNames.includes(it.name)) {
                            data.zoneNames.push(it.name);
                        }
                    }
                }

                if (it.system instanceof SkillItemData) {
                    if (it.system.weaponGroup === "melee") {
                        data.combatSkills.melee[it.system.name] =
                            it.system.name;
                    }

                    if (it.system.weaponGroup === "missile") {
                        data.combatSkills.missile[it.system.name] =
                            it.system.name;
                    }

                    if (["maneuver", "melee"].includes(it.system.weaponGroup)) {
                        data.combatSkills.maneuver[it.system.name] =
                            it.system.name;
                    }
                }

                if (
                    !it.isNested &&
                    it.system instanceof GearItemData &&
                    !(it.system instanceof ArmorGearItemData)
                ) {
                    data.holdableItems[it.id] = it.name;
                }

                if (this.item.system instanceof WeaponGearItemData) {
                    if (it.system instanceof SkillItemData) {
                        if (
                            ["melee", "missle"].includes(it.system.weaponGroup)
                        ) {
                            data.combatSkills[it.system.weaponGroup][it.name] =
                                it.name;
                        } else if (it.system.weaponGroup === "meleemissile") {
                            data.combatSkills.melee[it.name] = it.name;
                            data.combatSkills.missle[it.name] = it.name;
                        }
                    }
                }
            }
        }
        if (!Object.keys(data.bodyLocationChoices).length) {
            data.bodyLocationChoices[""] = "None";
        }

        return data;
    }

    /** @override */
    setPosition(options = {}) {
        const position = super.setPosition(options);
        const sheetBody = this.element.find(".sheet-body");
        const bodyHeight = position.height - 192;
        sheetBody.css("height", bodyHeight);
        return position;
    }

    get isEditable() {
        return !this.item.isVirtual && super.isEditable;
    }

    /** @inheritdoc */
    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    _canDragStart(selector) {
        return this.isEditable;
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    _canDragDrop(selector) {
        return this.isEditable;
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    _onDragStart(event) {
        const li = event.currentTarget;
        if ("link" in event.target.dataset) return;

        // Create drag data
        let dragData;

        // Embed Items
        if (li.dataset.itemId) {
            const item = this.item.getNestedItemById(li.dataset.itemId);
            dragData = item.toDragData();
        }

        // Active Effect
        if (li.dataset.effectId) {
            const effect = this.item.effects.get(li.dataset.effectId);
            dragData = effect.toDragData();
        }

        // Macros
        if (li.dataset.macroId) {
            const macro = this.item.system.macros.find(
                (m) => m._id === li.dataset.macroId,
            );
            dragData = foundry.utils.deepClone(macro);
        }

        if (!dragData) return;

        // Set data transfer
        event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    }

    async _onSortItem(event) {
        return this.item._onSortItem(event);
    }

    /** @inheritdoc */
    async _onDrop(event) {
        const data = TextEditor.getDragEventData(event);
        const allowed = Hooks.call("dropItemSheetData", this.item, this, data);
        if (allowed === false) return;

        if (data.type === "ActiveEffect") {
            return this._onDropActiveEffect(event, data);
        } else if (data.type === "Item") {
            return this._onDropItem(event, data);
        } else if (data.type === "Macro") {
            return this._onDropMacro(event, data);
        }
    }

    async _onDropMacro(event, data) {
        if (!this.item.isOwner) return false;

        const droppedMacro = await SohlMacro.fromDropData(data);
        if (droppedMacro) {
            if (
                this.item.system.macros.some((m) => m._id === droppedMacro.id)
            ) {
                // dropped macro is already in this item,
                // so we just sort it.
                return this._onSortMacro(event, droppedMacro.toObject());
            } else {
                // Item is not currently in the list of items for the item,
                // so add it.
                return await SohlMacro.create(droppedMacro.toObject(), {
                    clean: true,
                    nestedIn: this.item,
                });
            }
        }

        // We can't deal with the dropped macro, so fail
        return false;
    }

    _onSortMacro(event, macroData) {
        // Get the drag source and drop target
        const macros = this.item.system.macros;
        const source = macros.find((m) => m._id === macroData._id);
        const dropTarget = event.target.closest("[data-macro-id]");
        if (!dropTarget) return;
        const target = macros.get(dropTarget.dataset.macroId);

        // Don't sort on yourself
        if (source.id === target.id) return;

        // Identify sibling items based on adjacent HTML elements
        const siblings = [];
        for (let el of dropTarget.parentElement.children) {
            const siblingId = el.dataset.macroId;
            if (siblingId && siblingId !== source.id)
                siblings.push(macros.find((m) => m._id === el.dataset.macroId));
        }

        // Perform the sort
        const sortUpdates = SortingHelpers.performIntegerSort(source, {
            target,
            siblings,
        });

        const updateData = {
            "system.macros": foundry.utils.deepClone(this.item.system.macros),
        };

        sortUpdates.forEach((u) => {
            const target = updateData["system.macros"].find(
                (m) => m._id === u.target._id,
            );
            if (target) target.sort = u.update.sort;
        });

        // Perform the update
        return this.item.update(updateData);
    }

    async _createNestedItem(event) {
        await this._onSubmit(event); // Submit any unsaved changes
        const dataset = event.currentTarget.dataset;
        const options = { nestedIn: this.item, parent: this.item.actor };
        const data = { name: "" };
        if (dataset.type === "gear") {
            options.types = Utility.getChoicesMap(
                GearItemData.TYPE,
                "SOHL.GEAR.TYPE",
            );
            data.type = GearItemData.TYPE.MISC;
        } else if (dataset.type) {
            data.type = dataset.type;
        }
        options.items = [];
        if (this.item.actor) {
            for (const it of this.item.actor.allItems()) {
                if (it.type === dataset.type) options.items.push(it);
            }
        }
        options.items.sort((a, b) => a.sort - b.sort);
        if (dataset.subType) data["system.subType"] = dataset.subType;
        const item = await SohlItem.createDialog(data, options);
        if (item) this.render();
        return item;
    }

    async _deleteNestedItem(event) {
        event.preventDefault();
        const li = event.currentTarget.closest(".item");
        const nestedItemId = li.dataset.itemId;
        if (nestedItemId) {
            const nestedItem = this.item.getNestedItemById(nestedItemId);
            if (!nestedItem) {
                console.error(
                    `SoHL | Delete aborted, nested item ${nestedItemId} in item ${this.item.name} was not found.`,
                );
                return;
            }

            await Dialog.confirm({
                title: `Delete Nested Item: ${nestedItem.label}`,
                content:
                    "<p>Are You Sure?</p><p>This item will be deleted and cannot be recovered.</p>",
                yes: () => {
                    nestedItem.delete();
                    this.render();
                },
            });
        }
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        // biome-ignore lint/correctness/noUnusedVariables: <explanation>
        const element = html instanceof jQuery ? html[0] : html;

        this.form.addEventListener("keypress", (ev) => {
            const target = ev.target;
            // Check if the event was triggered by an element with the class 'properties'
            if (target.classList.contains("properties") && ev.key === "Enter") {
                super.close();
            }
        });

        // Create/edit/delete Nested Item
        this.form
            .querySelector(".nested-item-create")
            ?.addEventListener("click", this._createNestedItem.bind(this));

        this.form
            .querySelector(".nested-item-edit")
            ?.addEventListener("click", (ev) => {
                const li = ev.currentTarget.closest(".item");
                const itemId = li.dataset.itemId;
                const nestedItem = this.item.getNestedItemById(itemId);
                nestedItem.sheet.render(true);
            });

        this.form
            .querySelector(".nested-item-delete")
            ?.addEventListener("click", this._deleteNestedItem.bind(this));
    }
}

export class SohlContainerGearItemSheet extends SohlItemSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            width: 725,
        });
    }
}

export class NestedItemSheet extends ItemSheet {
    /**
     * Updates an object with new data.
     * @param event The event triggering the update
     * @param formData The new data to update the object with
     * @returns A Promise that resolves to the updated object after the update operation is complete
     *
     * @async
     * @param {*} event
     * @param {*} formData
     * @returns {unknown}
     */

    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    async _updateObject(event, formData) {
        const newAry = foundry.utils.deepClone(this.item.system.items);
        const index = newAry.findIndex((obj) => obj._id === formData._id);
        if (index < 0) {
            newAry.push(formData);
        } else {
            foundry.utils.mergeObject(newAry[index], formData);
            newAry.splice(index, 1, formData);
        }

        return this.item.update({ "system.items": newAry });
    }
}

/**
 * A standalone, pure JavaScript implementation of the Mersenne Twister pseudo random number generator.
 *
 * @author Raphael Pigulla <pigulla@four66.com>
 * @version 0.2.3
 * @license
 * Copyright (C) 1997 - 2002, Makoto Matsumoto and Takuji Nishimura,
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1. Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright
 * notice, this list of conditions and the following disclaimer in the
 * documentation and/or other materials provided with the distribution.
 *
 * 3. The names of its contributors may not be used to endorse or promote
 * products derived from this software without specific prior written
 * permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT OWNER OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
export class MersenneTwister {
    /**
     * Instantiates a new Mersenne Twister.
     * @param {number} [seed]   The initial seed value, if not provided the current timestamp will be used.
     * @constructor
     */
    constructor(seed) {
        // Initial values
        this.MAX_INT = 4294967296.0;
        this.N = 624;
        this.M = 397;
        this.UPPER_MASK = 0x80000000;
        this.LOWER_MASK = 0x7fffffff;
        this.MATRIX_A = 0x9908b0df;

        // Initialize sequences
        this.mt = new Array(this.N);
        this.mti = this.N + 1;
        this.SEED = this.seed(seed ?? new Date().getTime());
    }

    /**
     * Initializes the state vector by using one unsigned 32-bit integer "seed", which may be zero.
     *
     * @since 0.1.0
     * @param {number} seed The seed value.
     */
    seed(seed) {
        this.SEED = seed;
        let s;
        this.mt[0] = seed >>> 0;

        for (this.mti = 1; this.mti < this.N; this.mti++) {
            s = this.mt[this.mti - 1] ^ (this.mt[this.mti - 1] >>> 30);
            this.mt[this.mti] =
                ((((s & 0xffff0000) >>> 16) * 1812433253) << 16) +
                (s & 0x0000ffff) * 1812433253 +
                this.mti;
            this.mt[this.mti] >>>= 0;
        }
        return seed;
    }

    /**
     * Initializes the state vector by using an array key[] of unsigned 32-bit integers of the specified length. If
     * length is smaller than 624, then each array of 32-bit integers gives distinct initial state vector. This is
     * useful if you want a larger seed space than 32-bit word.
     *
     * @since 0.1.0
     * @param {array} vector The seed vector.
     */
    seedArray(vector) {
        let i = 1,
            j = 0,
            k = this.N > vector.length ? this.N : vector.length,
            s;
        this.seed(19650218);
        for (; k > 0; k--) {
            s = this.mt[i - 1] ^ (this.mt[i - 1] >>> 30);

            this.mt[i] =
                (this.mt[i] ^
                    (((((s & 0xffff0000) >>> 16) * 1664525) << 16) +
                        (s & 0x0000ffff) * 1664525)) +
                vector[j] +
                j;
            this.mt[i] >>>= 0;
            i++;
            j++;
            if (i >= this.N) {
                this.mt[0] = this.mt[this.N - 1];
                i = 1;
            }
            if (j >= vector.length) {
                j = 0;
            }
        }

        for (k = this.N - 1; k; k--) {
            s = this.mt[i - 1] ^ (this.mt[i - 1] >>> 30);
            this.mt[i] =
                (this.mt[i] ^
                    (((((s & 0xffff0000) >>> 16) * 1566083941) << 16) +
                        (s & 0x0000ffff) * 1566083941)) -
                i;
            this.mt[i] >>>= 0;
            i++;
            if (i >= this.N) {
                this.mt[0] = this.mt[this.N - 1];
                i = 1;
            }
        }
        this.mt[0] = 0x80000000;
    }

    /**
     * Generates a random unsigned 32-bit integer.
     *
     * @since 0.1.0
     * @returns {number}
     */
    int() {
        let y,
            kk,
            mag01 = [0, this.MATRIX_A];

        if (this.mti >= this.N) {
            if (this.mti === this.N + 1) {
                this.seed(5489);
            }

            for (kk = 0; kk < this.N - this.M; kk++) {
                y =
                    (this.mt[kk] & this.UPPER_MASK) |
                    (this.mt[kk + 1] & this.LOWER_MASK);
                this.mt[kk] = this.mt[kk + this.M] ^ (y >>> 1) ^ mag01[y & 1];
            }

            for (; kk < this.N - 1; kk++) {
                y =
                    (this.mt[kk] & this.UPPER_MASK) |
                    (this.mt[kk + 1] & this.LOWER_MASK);
                this.mt[kk] =
                    this.mt[kk + (this.M - this.N)] ^ (y >>> 1) ^ mag01[y & 1];
            }

            y =
                (this.mt[this.N - 1] & this.UPPER_MASK) |
                (this.mt[0] & this.LOWER_MASK);
            this.mt[this.N - 1] =
                this.mt[this.M - 1] ^ (y >>> 1) ^ mag01[y & 1];
            this.mti = 0;
        }

        y = this.mt[this.mti++];

        y ^= y >>> 11;
        y ^= (y << 7) & 0x9d2c5680;
        y ^= (y << 15) & 0xefc60000;
        y ^= y >>> 18;

        return y >>> 0;
    }

    /**
     * Generates a random unsigned 31-bit integer.
     *
     * @since 0.1.0
     * @returns {number}
     */
    int31() {
        return this.int() >>> 1;
    }

    /**
     * Generates a random real in the interval [0;1] with 32-bit resolution.
     *
     * @since 0.1.0
     * @returns {number}
     */
    real() {
        return this.int() * (1.0 / (this.MAX_INT - 1));
    }

    /**
     * Generates a random real in the interval ]0;1[ with 32-bit resolution.
     *
     * @since 0.1.0
     * @returns {number}
     */
    realx() {
        return (this.int() + 0.5) * (1.0 / this.MAX_INT);
    }

    /**
     * Generates a random real in the interval [0;1[ with 32-bit resolution.
     *
     * @since 0.1.0
     * @returns {number}
     */
    rnd() {
        return this.int() * (1.0 / this.MAX_INT);
    }

    /**
     * Generates a random real in the interval [0;1[ with 32-bit resolution.
     *
     * Same as .rnd() method - for consistency with Math.random() interface.
     *
     * @since 0.2.0
     * @returns {number}
     */
    random() {
        return this.rnd();
    }

    /**
     * Generates a random real in the interval [0;1[ with 53-bit resolution.
     *
     * @since 0.1.0
     * @returns {number}
     */
    rndHiRes() {
        const a = this.int() >>> 5;
        const b = this.int() >>> 6;
        return (a * 67108864.0 + b) * (1.0 / 9007199254740992.0);
    }

    /**
     * A pseudo-normal distribution using the Box-Muller transform.
     * @param {number} mu     The normal distribution mean
     * @param {number} sigma  The normal distribution standard deviation
     * @returns {number}
     */
    normal(mu, sigma) {
        let u = 0;
        while (u === 0) u = this.random(); // Converting [0,1) to (0,1)
        let v = 0;
        while (v === 0) v = this.random(); // Converting [0,1) to (0,1)
        let n = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        return n * sigma + mu;
    }

    /**
     * A factory method for generating a random 32-bit signed integer
     * @returns {number}
     */
    static int() {
        return SOHL.TWIST.int();
    }

    /**
     * A factory method for generating random uniform rolls
     * @returns {number}
     */
    static random() {
        return SOHL.TWIST.random();
    }

    /**
     * A factory method for generating random normal rolls
     * @return {number}
     */
    static normal(...args) {
        return SOHL.TWIST.normal(...args);
    }
}

// Create Global Singleton
Object.defineProperty(SOHL, "TWIST", {
    value: new MersenneTwister(Date.now()),
    writeable: false,
    enumerable: false,
});

export const SohlActorDataModels = Object.freeze({
    [AnimateEntityActorData.TYPE_NAME]: AnimateEntityActorData,
    [InanimateObjectActorData.TYPE_NAME]: InanimateObjectActorData,
});

export const SohlItemDataModels = Object.freeze({
    [AffiliationItemData.TYPE_NAME]: AffiliationItemData,
    [AfflictionItemData.TYPE_NAME]: AffiliationItemData,
    [AnatomyItemData.TYPE_NAME]: AnatomyItemData,
    [ArmorGearItemData.TYPE_NAME]: ArmorGearItemData,
    [BodyLocationItemData.TYPE_NAME]: BodyLocationItemData,
    [BodyPartItemData.TYPE_NAME]: BodyPartItemData,
    [BodyZoneItemData.TYPE_NAME]: BodyZoneItemData,
    [CombatTechniqueStrikeModeItemData.TYPE_NAME]:
        CombatTechniqueStrikeModeItemData,
    [CombatManeuverItemData.TYPE_NAME]: CombatManeuverItemData,
    [ConcoctionGearItemData.TYPE_NAME]: ConcoctionGearItemData,
    [ContainerGearItemData.TYPE_NAME]: ContainerGearItemData,
    [EventItemData.TYPE_NAME]: EventItemData,
    [InjuryItemData.TYPE_NAME]: InjuryItemData,
    [MeleeWeaponStrikeModeItemData.TYPE_NAME]: MeleeWeaponStrikeModeItemData,
    [MiscGearItemData.TYPE_NAME]: MiscGearItemData,
    [MissileWeaponStrikeModeItemData.TYPE_NAME]:
        MissileWeaponStrikeModeItemData,
    [MysteryItemData.TYPE_NAME]: MysteryItemData,
    [MysticalAbilityItemData.TYPE_NAME]: MysticalAbilityItemData,
    [PhilosophyItemData.TYPE_NAME]: PhilosophyItemData,
    [DomainItemData.TYPE_NAME]: DomainItemData,
    [MysticalDeviceItemData.TYPE_NAME]: MysticalDeviceItemData,
    [ProjectileGearItemData.TYPE_NAME]: ProjectileGearItemData,
    [SkillItemData.TYPE_NAME]: SkillItemData,
    [TraitItemData.TYPE_NAME]: TraitItemData,
    [WeaponGearItemData.TYPE_NAME]: WeaponGearItemData,
});

SOHL.classes = Object.freeze({
    SohlActor,
    SohlItem,
    SohlMacro,
    SohlMacroConfig,
    SohlActiveEffect,
    SohlActiveEffectConfig,
    SkillBase,
    Utility,
    SohlActorSheet,
    SohlItemSheet,
    NestedItemSheet,
    ValueModifier,
    ImpactModifier,
    MasteryLevelModifier,
    CombatModifier,
    SuccessTestResult,
    OpposedTestResult,
    CombatTestResult,
    ImpactResult,
});
