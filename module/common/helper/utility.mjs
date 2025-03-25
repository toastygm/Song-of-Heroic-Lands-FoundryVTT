import * as utils from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/utils/module.mjs";
import { SohlLocalize, _l } from "./sohl-localize.mjs";
import { SohlActor } from "@module/common/actor/SohlActor.mjs";
import { SohlMacro } from "@module/common/macro/SohlMacro.mjs";
import { EventItemData } from "@module/common/EventItemData.mjs";
import { SohlItem } from "@module/common/item/SohlItem.mjs";
import { SuccessTestResult } from "@module/common/result/SuccessTestResult.mjs";


export class Utility {
    /**
     * Generates a mapping of values to localized keys.
     *
     * @param {Object} values - An object containing the values to map.
     * @param {string} locPrefix - The localization prefix to prepend to each value.
     * @returns {Record<string, string>} A new object where each key is a value from the input object,
     *                   and each value is a string combining the localization prefix and the key.
     */
    static getChoicesMap(values, locPrefix) {
        return Object.fromEntries(
            Object.values(values).map((i) => [i, `${locPrefix}.${i}`])
        );
    }

    /**
     * Sorts an array of strings using locale-specific collation.
     *
     * @param {...string} ary - The strings to be sorted.
     * @returns {string[]} The sorted array of strings.
     */
    static sortStrings(...ary) {
        const collator = new Intl.Collator(SohlLocalize.lang);
        ary.sort((a, b) => collator.compare(a, b));
        return ary;
    }

    /**
     * Converts a Roll instance to a JSON-compatible object.
     *
     * @param {Roll} val - The Roll instance to be converted.
     * @returns {Object} An object containing the name "Roll" and the serialized data of the Roll instance.
     * @throws {Error} Throws an error if the provided value is not an instance of Roll.
     */
    static rollToJSON(val) {
        if (!(val instanceof Roll)) {
            throw new Error("Not a roll instance");
        }

        return {
            name: "Roll",
            data: val.toJSON(),
        };
    }

    /**
     * Custom JSON stringify utility that handles Maps, Sets, Iterators, and nested objects.
     * Converts complex data structures into a JSON-like string representation.
     *
     * @param {*} val - The value to stringify. Can be of any type, including Map, Set, Iterator, or Object.
     * @param {number} [_d=0] - The current depth of recursion, used for formatting indentation.
     * @returns {string} A string representation of the input value, formatted for readability.
     */
    static JSON_stringify(val, _d = 0) {
        /** @type {(s: string) => string} */
        const pad = (s) => "  ".repeat(_d) + s;

        if (val instanceof Map) {
            const mapped = [...val.entries()].map(
                ([k, v]) => [k, Utility.JSON_stringify(v, _d + 1)]
            );
            return `{name: "Map", data: ${JSON.stringify(mapped)}}`;
        }

        if (val instanceof Set) {
            const values = [...val].map((v) => Utility.JSON_stringify(v, _d + 1));
            return `{name: "Set", values: ${JSON.stringify(values)}}`;
        }

        if (val && typeof val.next === "function" && typeof val[Symbol.iterator] === "function") {
            // Assume it's an iterator
            const iterValues = [];
            for (const v of val) {
                iterValues.push(Utility.JSON_stringify(v, _d + 1));
            }
            return `{name: "Iterator", values: ${JSON.stringify(iterValues)}}`;
        }

        if (typeof val === "object" && val !== null) {
            const entries = Object.entries(val).map(
                ([key, value]) => `\n${pad(key)}: ${Utility.JSON_stringify(value, _d + 1)}`
            );
            return `{${entries.join(",")}\n${"  ".repeat(_d)}}`;
        }

        return JSON.stringify(val);
    }

    /**
     * A custom JSON reviver function to handle special object deserialization.
     * This function supports deserializing various custom objects such as `Function`, `Roll`, `Collection`, `Map`, `Set`,
     * and other classes defined in the `game.sohl?.class` namespace. It also enforces a maximum recursion depth to prevent
     * stack overflow errors.
     *
     * @param {Object} [options] - Options for the reviver function.
     * @param {any} [options.thisArg] - The context (`this`) to be passed to certain deserialization methods.
     * @param {number} [options._d=0] - The current recursion depth (used internally).
     * @returns {function(string, any): any} A function to be used as the second argument to `JSON.parse`.
     *
     * @throws {Error} If the maximum recursion depth (20) is exceeded.
     * @example
     * const jsonString = '{"name":"bigint","data":"12345678901234567890"}';
     * const reviver = Utility.JSON_reviver();
     * const result = JSON.parse(jsonString, reviver);
     * console.log(result); // Outputs: 12345678901234567890n (BigInt)
     */
    static JSON_reviver({ thisArg, _d = 0 } = {}) {
        if (_d > 20) {
            throw new Error("Max depth exceeded");
        }

        return function (_key, value) {
            if (value == null) return value;

            if (typeof value === "object") {
                if (!Object.prototype.hasOwnProperty.call(value, "name")) {
                    if (Array.isArray(value)) {
                        return value.map((e) => Utility.JSON_reviver({ thisArg, _d: _d + 1 })("", e)
                        );
                    } else {
                        return value;
                    }
                }

                switch (value.name) {
                    case "Function":
                        return Utility.safeFunctionFactory(value.data);

                    case "Roll":
                        return Roll.fromData(value.data);

                    case "undefined":
                        return undefined;

                    case "bigint":
                        return BigInt(value.data);

                    case "Collection":
                        return new Collection(
                            Utility.JSON_reviver({ thisArg, _d: _d + 1 })("", value.data)
                        );

                    case "Map":
                        return new Map(
                            Utility.JSON_reviver({ thisArg, _d: _d + 1 })("", value.data)
                        );

                    case "Set":
                        return new Set(
                            Utility.JSON_reviver({ thisArg, _d: _d + 1 })("", value.data)
                        );

                    default:
                        if (typeof game.sohl?.class === "object" &&
                            value.name in game.sohl?.class &&
                            typeof game.sohl?.class[value.name]?.fromData === "function") {
                            return game.sohl?.class[value.name].fromData(value, {
                                parent: thisArg,
                            });
                        }
                        return value;
                }
            }

            return value;
        };
    }

    /**
     * Parses a JSON string and applies a custom reviver function during parsing.
     *
     * @param {string} val - The JSON string to parse.
     * @param {Object} [options] - Optional parameters.
     * @param {*} [options.thisArg] - The value to bind as `this` in the custom reviver function.
     * @returns {*} The parsed JavaScript value.
     * @throws {SyntaxError} If the input string is not valid JSON.
     */
    static JSON_parse(val, { thisArg } = {}) {
        return JSON.parse(val, Utility.JSON_reviver({ thisArg }));
    }

    /**
     * Safely creates a new function from a string representation, ensuring that the string
     * does not contain dangerous keywords or patterns. Supports both synchronous and asynchronous
     * function creation.
     *
     * @param {string} fnString - The string representation of the function to create.
     * @param {boolean} [async=false] - Whether to create an asynchronous function.
     * @returns {Function} - The newly created function.
     * @throws {Error} - Throws an error if the function string is invalid, contains unsafe keywords,
     *                   or if the function parsing fails.
     */
    static safeFunctionFactory(fnString, async = false) {
        // Basic regex to check if it's an arrow function or normal function
        const functionPattern = /^\s*(?:\([\w\s,]*\)|\w+)\s*=>|\bfunction\b/;

        // Reject anything that contains dangerous keywords
        const dangerousKeywords = /\b(eval|Function|document|window|globalThis|process)\b/;

        if (!functionPattern.test(fnString)) {
            throw new Error("Invalid function string");
        } else if (dangerousKeywords.test(fnString)) {
            throw new Error("Function uses unsafe keyword");
        }

        const fnStr = `"use strict"; return ${fnString}`;
        try {
            return new (async ? sohl.utils.AsyncFunction : )(fnStr);
        } catch (e) {
            throw new Error("Function parsing failed", { cause: e });
        }
    }

    /**
     * Creates a deep clone of the given object by serializing and deserializing it.
     *
     * @param {Object} obj - The object to be deeply cloned.
     * @param {Object} [options] - Optional parameters for the cloning process.
     * @param {*} [options.thisArg] - A value to use as the `this` context during deserialization.
     *                                Defaults to the `parent` property of the input object.
     * @returns {Object} - A deep clone of the input object.
     */
    static deepClone(obj, { thisArg } = {}) {
        thisArg ||= obj.parent;
        return Utility.JSON_parse(Utility.JSON_stringify(obj), { thisArg });
    }

    /**
     * Combines multiple iterators into a single generator.
     * Iterates through each provided iterator in sequence, yielding all values.
     *
     * @generator
     * @param {...Iterable<any>} iterators - One or more iterators to combine.
     * @yields {*} - The values from each iterator, in order.
     */
    static *combine(...iterators) {
        for (let it of iterators) yield* it;
    }


    /**
     * @typedef {Object} Action
     * @property {string} functionName - The name of the function.
     */
    /**
     * Ensures the resulting actions array has only unique actions. Keeps all items in newActions, and only those items in oldActions that are not already in newActions.
     *
     * @static
     * @param {{}} newActions
     * @param {{}} oldActions
     * @returns {*}
     */
    static uniqueActions(newActions, oldActions) {
        return oldActions.reduce((ary, a) => {
            if (!ary.some((i) => i.functionName === a.functionName))
                ary.push(a);
            return ary;
        }, newActions);
    }

    /**
     *
     * @param {Token} token
     */
    /**
     * Determines the identity of the current token/actor that is in combat. If token
     * is specified, tries to use token (and will allow it regardless if user is GM.),
     * otherwise returned token will be the combatant whose turn it currently is.
     *
     * @param {Token|null} [token=null] - The token to check. If provided, it will be validated against the current combatant.
     * @param {boolean} [forceAllow=false] - If true, bypasses GM checks and allows retrieval of the token.
     * @returns {{token: Token, actor: Actor}|null} - An object containing the token and actor if valid, or null if no valid combatant is found.
     *
     * @throws {Error} - Displays warnings via the UI notifications for various invalid states:
     *   - If there is no active combat.
     *   - If there are no combatants in the combat.
     *   - If the current combatant is defeated.
     *   - If the provided token does not match the current combatant.
     *   - If the user does not have permission to control the current combatant.
     */
    static getTokenInCombat(token = null, forceAllow = false) {
        if (token && (game.user?.isGM || forceAllow)) {
            if (!token.actor) {
                throw new Error("Token does not have an associated actor.");
            }
            const result = { token: token, actor: token.actor };
            return result;
        }

        if (!game.combat?.started) {
            ui.notifications?.warn("No active combat.");
            return null;
        }

        if (game.combat.combatants.size === 0) {
            ui.notifications?.warn(`No combatants.`);
            return null;
        }

        const combatant = game.combat.combatant;
        if (!combatant) {
            ui.notifications?.warn(`No current combatant.`);
            return null;
        }

        if (!combatant.token) {
            ui.notifications?.warn(
                `Combatant ${combatant.token.name} has no token`
            );
            return null;
        }

        if (combatant.isDefeated) {
            ui.notifications?.warn(
                `Combatant ${combatant.token.name} has been defeated`
            );
            return null;
        }

        if (token && token.id !== combatant.token.id) {
            ui.notifications?.warn(
                `${combatant.token.name} is not the current combatant`
            );
            return null;
        }

        if (!combatant.actor?.isOwner) {
            ui.notifications?.warn(
                `You do not have permissions to control the combatant ${combatant.token.name}.`
            );
            return null;
        }

        token = canvas.tokens.get(combatant.token.id);
        return { token: token, actor: combatant.actor };
    }

    static getUserTargetedToken(combatant) {
        const targets = game.user.targets;
        if (!targets?.size) {
            ui.notifications?.warn(
                `No targets selected, you must select exactly one target, combat aborted.`
            );
            return null;
        } else if (targets.size > 1) {
            ui.notifications?.warn(
                `${targets} targets selected, you must select exactly one target, combat aborted.`
            );
        }

        const targetToken = Array.from(game.user.targets)[0]?.document;

        if (combatant?.token && targetToken.id === combatant.token.id) {
            ui.notifications?.warn(
                `You have targetted the combatant, they cannot attack themself, combat aborted.`
            );
            return null;
        }

        return targetToken;
    }

    /**
     * Retrieves an actor based on the provided parameters, resolving it from an item,
     * an actor reference, or a speaker. Ensures the actor is accessible and owned by the user.
     *
     * @param {Object} [options={}] - The options for retrieving the actor.
     * @param {Item} [options.item] - The item associated with the actor.
     * @param {Actor|string|null} [options.actor] - The actor instance, UUID, or null.
     * @param {Object} [options.speaker] - The speaker object containing token or actor information.
     * @returns {Object|null} An object containing the resolved `item`, `actor`, and `speaker`,
     *                        or `null` if no valid actor could be determined or permissions are insufficient.
     */
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
                    // @ts-ignore
                    if (result.speaker?.token) {
                        const token = canvas?.tokens?.get(result.speaker.token);
                        result.actor = token?.actor;
                    } else {
                        result.actor = result.speaker?.actor;
                    }
                    if (!result.actor) {
                        ui.notifications?.warn(
                            `No actor selected, roll ignored.`
                        );
                        return null;
                    }
                } else {
                    const resolvedActor = fromUuidSync(result.actor);
                    result.actor = resolvedActor instanceof Actor ? resolvedActor : null;
                    result.speaker = ChatMessage.getSpeaker({
                        actor: result.actor,
                    });
                }

                if (!result.actor) {
                    ui.notifications?.warn(`No actor selected, roll ignored.`);
                    return null;
                }
            }
        }

        if (!result.actor?.isOwner) {
            ui.notifications?.warn(
                `You do not have permissions to control ${result.actor.name}.`
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
        let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
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

    /**
     * Opens a dialog to adjust the in-game time based on user input.
     *
     * @async
     * @function
     * @param {number} time - The initial time to be adjusted.
     * @param {Object} [options={}] - Options for time adjustment.
     * @param {number} [options.days=0] - Number of days to adjust.
     * @param {number} [options.hours=0] - Number of hours to adjust.
     * @param {number} [options.mins=0] - Number of minutes to adjust.
     * @param {number} [options.secs=0] - Number of seconds to adjust.
     * @returns {Promise<number>} The adjusted time after user input.
     */
    static async onAlterTime(
        time,
        { days = 0, hours = 0, mins = 0, secs = 0 } = {}
    ) {
        const currentWorldTime = game.time?.worldTime;
        const gameStartTime = 0;
        const dialogData = {
            variant: game.sohl?.id,
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

        let dlgTemplate = "systems/sohl/templates/dialog/time-dialog.hbs";
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
                        let newValue = e.target?.value === "existing" ?
                            Utility.htmlWorldTime(time)
                            : e.target?.value === "world" ?
                                Utility.htmlWorldTime(currentWorldTime)
                                : Utility.htmlWorldTime(gameStartTime);
                        time.innerHTML = newValue;
                    });
            },
            callback: (element) => {
                const form = element.querySelector("form");
                const fd = new FormDataExtended(form);
                const formData = sohl.utils.expandObject(fd.object);
                const timeBase = formData.timeBase;
                const direction = formData.direction;
                const days = Number.parseInt(formData.days, 10);
                const hours = Number.parseInt(formData.hours, 10);
                const mins = Number.parseInt(formData.mins, 10);
                const secs = Number.parseInt(formData.secs, 10);
                let newTime = timeBase === "world" ? game.time?.worldTime
                    : timeBase === "existing" ? dialogData.setTime
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
                const formdata = sohl.utils.expandObject(fd.object);
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
                const formData = sohl.utils.expandObject(fd.object);

                const hasAction = parent.system.actions.some(
                    (it) => !it.isIntrinsicAction && it.name === formData.name
                );
                if (hasAction) {
                    ui.notifications?.error(
                        `An action named ${formData.name} already exists on ${parent.label}`
                    );
                    return null;
                }

                const action = await SohlMacro.create(
                    { name: formData.name, type: formData.type },
                    { nestedIn: parent }
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
            content: "<p>Are You Sure?</p><p>This action will be deleted and cannot be recovered.</p>",
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
            value - game.time.worldTime
        );
        const fragHtml = `<span data-tooltip="${worldDateLabel}">${remainingDurationLabel}</span>`;
        return fragHtml;
    }

    /**
     * A static method that converts a given number of seconds to a
     * normalized time format. It calculates the normalized hours,
     * minutes, and seconds based on the input seconds value and
     * constructs a formatted time string. Returns an object with
     * 'label' property containing the formatted time string and
     * 'inFuture' property indicating whether the input seconds
     * value is negative.
     *
     * @static
     * @param {*} seconds
     * @returns {{ label: string; inFuture: boolean; }}
     */
    static toNormTime(seconds) {
        let abs = Math.abs(seconds);
        const duration = {};

        duration.years = Math.floor(abs / 31536000);
        abs %= 31536000;
        duration.months = Math.floor(abs / 2592000);
        abs %= 2592000;
        duration.weeks = Math.floor(abs / 604800);
        abs %= 604800;
        duration.days = Math.floor(abs / 86400);
        abs %= 86400;
        duration.hours = Math.floor(abs / 3600);
        abs %= 3600;
        duration.minutes = Math.floor(abs / 60);
        duration.seconds = Math.floor(abs % 60);

        // Clean out 0 values to reduce clutter
        for (const key in duration) {
            if (duration[key] === 0) delete duration[key];
        }

        const df = new Intl.DurationFormat(SohlLocalize.lang, { style: "narrow" });
        const durationStr = df.format(duration);
        return { text: durationStr, sign: Math.sign(seconds) };
    }

    /**
     * Formats a given age value into a human-readable duration string
     * including days, hours, minutes, and seconds along with
     * future/ago indication.
     *
     * @static
     * @param {number} age duration in seconds, positive for future, negative for past
     * @returns {string}
     */
    static formatDuration(age) {
        const duration = this.toNormTime(age);
        let result = "";
        if (duration.sign > 0) {
            result = _l("SOHL.DURATION.FUTURE", { duration: duration.text });
        } else if (duration.sign < 0) {
            result = _l("SOHL.DURATION.PAST", { duration: duration.text });
        } else {
            result = _l("SOHL.DURATION.NOW");
        }
        return result;
    }

    /**
     * Convert an integer into a roman numeral.  Taken from:
     * http://blog.stevenlevithan.com/archives/javascript-roman-numeral-converter
     *
     * @param {Integer} num
     */
    static romanize(num) {
        if (isNaN(num)) return NaN;
        var digits = String(+num).split(""), key = [
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
        ], roman = "", i = 3;
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
            ui.notifications?.warn(`No scene active`);
            return null;
        }
        if (!gridUnits && !["feet", "ft"].includes(canvas.scene.grid.units)) {
            ui.notifications?.warn(
                `Scene uses units of ${canvas.scene.grid.units} but only feet are supported, distance calculation not possible`
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
                ui.notifications?.warn(`No selected tokens on the canvas.`);
            return null;
        }

        if (numTargets > 1) {
            if (!quiet)
                ui.notifications?.warn(
                    `There are ${numTargets} selected tokens on the canvas, please select only one`
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
        { documentName = "Item", docType }
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
        { documentName = "Item", docType, keepId } = {}
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
            if (!keepId) data._id = sohl.utils.randomID();
            delete data.folder;
            delete data.sort;
            if (doc.pack)
                sohl.utils.setProperty(
                    data,
                    "_stats.compendiumSource",
                    doc.uuid
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
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
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
        const json = await sohl.utils.fetchJsonWithTimeout(
            sohl.utils.getRoute(filepath, { prefix: ROUTE_PREFIX })
        );
        return json;
    }

    static async createItemFromJson(filepath) {
        const descObj = await Utility.loadJSONFromFile(filepath);

        const createData = sohl.utils.deepClone(descObj.template);
        createData._id ||= sohl.utils.randomID();

        if (descObj.nestedItems) {
            sohl.utils.mergeObject(createData, {
                system: {
                    nestedItems: [],
                },
            });

            for (let [name, type] of descObj.nestedItems) {
                const itemData = await Utility.getItemFromPacks(
                    name,
                    CONFIG.Item.compendiums,
                    { itemType: type }
                );
                if (itemData) {
                    itemData._id = sohl.utils.randomID();
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
                    "startLocation"
                );
                const dist = startLocation ?
                    combat.getDistance(
                        startLocation,
                        combatant.token.center
                    )
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
     * Modifies the chat message HTML to conceal certain actions based on user permissions.
     *
     * This function is intended to hide edit links and action buttons in chat cards for non-GM users
     * or users who do not own the associated actor. It ensures that only authorized users can interact
     * with specific chat card elements.
     *
     * @param {ChatMessage} message - The chat message object being rendered.
     * @param {HTMLElement | jQuery} html - The HTML content of the chat message.
     * @param {Object} data - Additional data passed to the chat message rendering context.
     */
    static displayChatActions(message, html, data) {
        const element = html instanceof HTMLElement ? html : html[0];

        const chatCards = element.querySelectorAll(".chat-card");
        if (chatCards.length === 0) return;

        // If the user is the GM, no need to hide anything
        if (game.user?.isGM) return;

        Array.from(chatCards).forEach((chatCard) => {
            // Hide the edit link if present
            const editAnchor = chatCard.querySelector("a.edit-action");
            if (editAnchor) {
                editAnchor.style.display = "none";
            }

            // Hide unauthorized action buttons
            const buttons = chatCard.querySelectorAll("button[data-action]");
            Array.from(buttons).forEach((btn) => {
                const uuid = btn.dataset?.handlerActorUuid;
                if (uuid) {
                    let actor = fromUuidSync(uuid);
                    actor = actor instanceof Actor ? actor : null;

                    if (!(actor && actor.isOwner)) {
                        btn.style.display = "none";
                    }
                }
            });
        });
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
                `targetUuid ${options.targetUuid} is not a Token, TokenDocument, Actor, or Item UUID`
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
        actor, skipDialog = false, label, title, func, compareFn = (a, b) => a - b,
    } = {}) {
        if (!(actor instanceof SohlActor))
            throw new Error("Must provide actor");
        let candidates = new sohl.utils.Collection();
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
                    const formdata = sohl.utils.expandObject(fd.object);
                    const selection = candidates.find(
                        (cand) => cand.id === formdata.candidateId
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

    static async dispatchOpposedResume(
        speaker,
        actor,
        token,
        character,
        scope = {}
    ) {
        let {
            noChat = false, opposedTestResult, testType = SuccessTestResult.TEST.SKILL, item,
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
                template: "systems/sohl/templates/chat/opposed-result-card.hbs",
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
