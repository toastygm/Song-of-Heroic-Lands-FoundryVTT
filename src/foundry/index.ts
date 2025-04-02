/// <reference path="../../types/sohl-global.d.ts" />
import * as helpers from "@module/utils/helpers";
import { SohlLocalize } from "@module/utils/SohlLocalize";
import { SohlLogger } from "@module/utils/SohlLogger";
import { SohlActorSheet } from "./actor/SohlActorSheet";
import { SohlItemSheet } from "./item/SohlItemSheet";
import { SohlActiveEffectConfig } from "./activeeffect/SohlActiveEffectConfig";

globalThis.sohl = {
    foundry: foundry,
    i18n: SohlLocalize.getInstance(),
    utils: helpers,
    game: null as any, // Placeholder for the system game object
    ready: false,
    variants: {},
    simpleCalendar: null,
    log: SohlLogger.getInstance(),
    classRegistry: {},
};

Actors.registerSheet("sohl", SohlActorSheet, {
    types: ["sohl"],
    makeDefault: true,
});
Items.registerSheet("sohl", SohlItemSheet, {
    types: ["sohl"],
    makeDefault: true,
});
DocumentSheetConfig.registerSheet(
    CONFIG.ActiveEffect.documentClass,
    "sohl",
    SohlActiveEffectConfig,
    {
        types: ["sohl"],
        makeDefault: true,
    },
);

/**
 * Setup version-specific configuration
 */
function setupSohlVariant() {
    const variantId = game.settings?.get("sohl", "sohlVariant");
    const sohl = SohlVariant[variantId];
    foundry.utils.mergeObject(CONFIG, sohl.game.CONFIG);
    console.log(sohl.game.initVariantMessage);
}

function registerSystemSettings() {
    sohl.utils.registerSetting("systemMigrationVersion", {
        name: "System Migration Version",
        scope: "world",
        config: false,
        type: String,
        default: "",
    });
    sohl.utils.registerSetting("sohlVariant", {
        name: "Rules Variant",
        hint: "Which variant of rules to use",
        scope: "world",
        config: true,
        requiresReload: true,
        default: "legendary",
        type: String,
        choices: {
            legendary: "Legendary",
            mistyisle: "MistyIsle",
        },
    });
    sohl.utils.registerSetting("showWelcomeDialog", {
        name: "Show welcome dialog on start",
        hint: "Display the welcome dialog box when the user logs in.",
        scope: "client",
        config: true,
        type: Boolean,
        default: true,
    });
    sohl.utils.registerSetting("initMacros", {
        name: "Ask to initialize macros",
        hint: "The next time the user logs in, ask whether to install the default macros.",
        scope: "client",
        default: true,
        config: true,
        type: Boolean,
        initial: true,
    });
    sohl.utils.registerSetting("combatAudio", {
        name: "Combat sounds",
        hint: "Enable combat flavor sounds",
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
        initial: true,
    });
    sohl.utils.registerSetting("recordTrauma", {
        name: "Record trauma automatically",
        hint: "Automatically add physical and mental afflictions and injuries",
        scope: "world",
        config: true,
        default: "enable",
        type: String,
        initial: "enable",
        choices: {
            enable: "Record trauma automatically",
            disable: "Don't record trauma automatically",
            ask: "Prompt user on each injury or affliction",
        },
    });
    sohl.utils.registerSetting("healingSeconds", {
        name: "Seconds between healing checks",
        hint: "Number of seconds between healing checks. Set to 0 to disable.",
        scope: "world",
        config: true,
        type: Number,
        default: 432000, // 5 days
        initial: 432000,
    });
    sohl.utils.registerSetting("optionProjectileTracking", {
        name: "Track Projectile/Missile Quantity",
        hint: "Reduce projectile/missile quantity when used; disallow missile attack when quantity is zero",
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
        initial: false,
    });
    sohl.utils.registerSetting("optionFate", {
        name: "Fate: Use fate rules",
        scope: "world",
        config: true,
        default: "enable",
        type: String,
        initial: "pconly",
        choices: {
            none: "Fate rules disabled",
            pconly: "Fate rules only apply to PCs",
            everyone: "Fate rules apply to all animate actors",
        },
    });
    sohl.utils.registerSetting("optionGearDamage", {
        name: "Gear Damage",
        hint: "Enable combat rule that allows gear (weapons and armor) to be damaged or destroyed on successful block",
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
        initial: false,
    });
}

// /**
//  * Custom fromUuid override for nested/virtual document resolution
//  */
// globalThis.origFromUuid = globalThis.fromUuid;
// globalThis.origFromUuidSync = globalThis.fromUuidSync;

// function patchFromUuid() {
//     globalThis.fromUuidSync = function <ConcreteDocument extends foundry.abstract.Document.Any = __UnsetDocument, const Uuid extends string = string>(
//         uuid: FromUuidValidate<ConcreteDocument, Uuid> | null | undefined,
//         options?: {
//           relative?: ClientDocument;
//           invalid?: boolean;
//           strict?: boolean;
//         },
//       ): (__UnsetDocument extends ConcreteDocument ? FromUuid<Uuid> : ConcreteDocument) | PlainObject | null  {
//         try {
//             let doc = globalThis.origFromUuidSync(uuid as string, options);
//             if (doc || !uuid?.includes("#")) return doc;
//             return resolveCustomUuidSync(uuid as string, options);
//         } catch (err) {
//             console.error(err);
//             return null;
//         }
//     };

//     globalThis.fromUuid = async function <
//         ConcreteDocument extends
//             foundry.abstract.Document.Any = __UnsetDocument,
//         const Uuid extends string = string,
//     >(
//         uuid: FromUuidValidate<ConcreteDocument, Uuid> | null | undefined,
//         options?: {
//             /** A Document to resolve relative UUIDs against. */
//             relative?: ClientDocument;
//             /** Allow retrieving an invalid Document. (default: `false`) */
//             invalid?: boolean;
//         },
//     ): Promise<
//         | (__UnsetDocument extends ConcreteDocument ? FromUuid<Uuid>
//           :   ConcreteDocument)
//         | null
//     > {
//         try {
//             // Attempt to call the original fromUuid with the correct types
//             const doc = (await globalThis.origFromUuid(
//                 uuid as string,
//                 options,
//             ) as
//                 | (__UnsetDocument extends ConcreteDocument ? FromUuid<Uuid>
//                   :   ConcreteDocument)
//                 | null);

//             // Return the document if it exists or if the UUID does not contain a '#'
//             if (doc || !uuid || !uuid.includes("#")) return doc;

//             // Attempt to resolve custom UUIDs if the original resolution fails
//             return resolveCustomUuidAsync(uuid as string, options);
//         } catch (err) {
//             console.error(err);
//             return null;
//         }
//     };
// }

// /**
//  * Resolve nested/virtual UUIDs (sync)
//  */
// function resolveCustomUuidSync<ConcreteDocument extends foundry.abstract.Document.Any = __UnsetDocument, const Uuid extends string = string>  (
//     uuid: FromUuidValidate<ConcreteDocument, Uuid> | null | undefined,
//     options?: {
//       relative?: ClientDocument;
//       invalid?: boolean;
//       strict?: boolean;
//     },
//   ): (__UnsetDocument extends ConcreteDocument ? FromUuid<Uuid> : ConcreteDocument) | PlainObject | null {
//     if (!uuid || !uuid.includes("#")) return uuid as any;
//     let [base, ...parts] = uuid.split("#");
//     let doc = globalThis.origFromUuidSync(base, options) as (__UnsetDocument extends ConcreteDocument ? FromUuid<Uuid> : ConcreteDocument) | PlainObject | null;
//     for (let i = 0; i < parts.length && doc; i += 2) {
//         const type = parts[i],
//             id = parts[i + 1];
//         doc = resolveCustomPart(doc, type, id, options);
//     }
//     return doc;
// }

// /**
//  * Resolve nested/virtual UUIDs (async)
//  */
// async function resolveCustomUuidAsync<
// ConcreteDocument extends
//     foundry.abstract.Document.Any = __UnsetDocument,
// const Uuid extends string = string,
// >(
// uuid: FromUuidValidate<ConcreteDocument, Uuid> | null | undefined,
// options?: {
//     relative?: ClientDocument;
//     invalid?: boolean;
// },
// ): Promise<(__UnsetDocument extends ConcreteDocument ? FromUuid<Uuid>
//   :   ConcreteDocument)
// | null
// > {
//     if (!uuid || !uuid.includes("#")) return uuid as any;
//     let [base, ...parts] = uuid.split("#");
//     let doc = await globalThis.origFromUuid(base, options);
//     for (let i = 0; i < parts.length && doc; i += 2) {
//         const type = parts[i],
//             id = parts[i + 1];
//         doc = resolveCustomPart(doc, type, id, options);
//     }
//     return Promise.resolve(doc);
// }

// function resolveCustomPart<ConcreteDocument extends foundry.abstract.Document.Any = __UnsetDocument, const Uuid extends string = string>(
//     doc: any,
//     type: string,
//     id: string,
//     options: any,
// ): (__UnsetDocument extends ConcreteDocument ? FromUuid<Uuid>
//     :   ConcreteDocument)
//   | null {
//     switch (type) {
//         case "VirtualItem":
//             return doc instanceof SohlActor ?
//                     null // TODO: (doc.system.virtualItems?.get(id) ?? null)
//                 :   null;
//         case "NestedItem":
//             return doc instanceof SohlItem ?
//                     null // TODO: (doc.system.items?.get(id) ?? null)
//                 :   null;
//         default:
//             return null;
//     }
// }

/**
 * Register startup hooks
 */
function registerSystemHooks() {
    // Example chat message hook
    Hooks.on(
        "renderChatMessageHTML",
        (app: ChatMessage, element: HTMLElement, data: any) => {
            element.addEventListener("click", (ev) => {
                const btn = (ev.target as HTMLElement).closest("button");
                if (btn?.closest(".card-buttons")) {
                    const docUuid = btn.dataset.docUuid;
                    if (docUuid) {
                        const doc = fromUuidSync(docUuid);
                        if (
                            doc &&
                            "onChatCardButton" in doc &&
                            typeof doc.onChatCardButton === "function"
                        ) {
                            doc.onChatCardButton(btn);
                        }
                    }
                } else {
                    const edit = (ev.target as HTMLElement).closest(
                        "a.edit-action",
                    );
                    const docUuid = (edit as HTMLElement)?.dataset.docUuid;
                    if (docUuid) {
                        const doc = fromUuidSync(docUuid);
                        if (
                            doc &&
                            "onChatCardEditAction" in doc &&
                            typeof doc.onChatCardEditAction === "function"
                        ) {
                            doc.onChatCardEditAction(edit as HTMLElement);
                        }
                    }
                }
            });
        },
    );

    Hooks.on("renderSceneConfig", (app: any, element: HTMLElement) => {
        const scene = app.object;
        const isTotm = scene.getFlag("sohl", "isTotm") ?? false;
        const totmHTML = `<div class="form-group">
        <label>Theatre of the Mind</label>
        <input id="sohl-totm" type="checkbox" name="sohlTotm" data-dtype="Boolean" ${isTotm ? "checked" : ""}>
        <p class="notes">Configure scene for Theatre of the Mind.</p>
      </div>`;
        const target = element.querySelector("input[name='gridAlpha']");
        target
            ?.closest(".form-group")
            ?.insertAdjacentHTML("afterend", totmHTML);
    });

    Hooks.on("closeSceneConfig", (app: any, element: HTMLElement) => {
        const scene = app.object;
        const isTotm =
            element.querySelector<HTMLInputElement>("input[name='sohlTotm']")
                ?.checked ?? false;
        scene.setFlag("sohl", "isTotm", isTotm);
    });
}

// Register init hook
Hooks.once("init", () => {
    const initMessage = `Initializing the Song of Heroic Lands Game System
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
===========================================================`;

    console.log(`SoHL | ${initMessage}`);

    //patchFromUuid();
    registerSystemSettings();
    registerSystemHooks();
    setupSohlVariant();

    CONFIG.Combat.initiative = { formula: "@initiativeRank", decimals: 2 };
    CONFIG.time.roundTime = 5;
    CONFIG.time.turnTime = 0;
});

// Register ready hook
Hooks.once("ready", async () => {
    sohl.game.ready = true;
    await preloadHandlebarsTemplates();
    registerHandlebarsHelpers();
});

/*-------------------------------------------------------*/
/*            Handlebars FUNCTIONS                       */
/*-------------------------------------------------------*/
function registerHandlebarsHelpers() {
    /**
     * A helper to create a set of &lt;option> elements in a &lt;select> block based on a provided array.
     * This helper supports both single-select as well as multi-select input fields.
     *
     * @param {object|Array<object>>} choices      An array containing the choices
     * @param {object} options                     Helper options
     * @param {string|string[]} [options.selected] Which key is currently selected?
     * @param {string} [options.blank]             Add a blank option as the first option with this label
     * @param {boolean} [options.sort]             Sort the options by their label after localization
     * @returns {Handlebars.SafeString}
     *
     * @example The provided input data
     * ```js
     * let choices = {"Choice A", "Choice B"};
     * let value = "Choice A";
     * ```
     * The template HTML structure
     * ```hbs
     * <select name="importantChoice">
     *   {{selectArray choices selected=value}}
     * </select>
     * ```
     * The resulting HTML
     * ```html
     * <select name="importantChoice">
     *   <option value="Choice A" selected>Choice A</option>
     *   <option value="Choice B">Choice B</option>
     * </select>
     * ```
     */
    Handlebars.registerHelper("selectArray", function (choices, options) {
        let { selected = null, blank = null, sort = false } = options.hash;
        selected =
            selected instanceof Array ?
                selected.map(String)
            :   [String(selected)];

        // Prepare the choices as an array of objects
        const selectOptions = [];
        if (choices instanceof Array) {
            for (const choice of choices) {
                const label = String(choice);
                selectOptions.push({ value: label, label });
            }
        } else {
            throw new Error("You must specify an array to selectArray");
        }

        // Sort the array of options
        if (sort) selectOptions.sort((a, b) => a.label.localeCompare(b.label));

        // Prepend a blank option
        if (blank !== null) {
            selectOptions.unshift({ value: "", label: blank });
        }

        // Create the HTML
        let fragHtml = "";
        for (const option of selectOptions) {
            const label = Handlebars.escapeExpression(option.label);
            const isSelected = selected.includes(option.value);
            fragHtml += `<option value="${option.value}" ${isSelected ? "selected" : ""}>${label}</option>`;
        }
        return new Handlebars.SafeString(fragHtml);
    });

    Handlebars.registerHelper("endswith", function (op1, op2) {
        return op1.endsWith(op2);
    });

    Handlebars.registerHelper("concat", function () {
        var outStr = "";
        for (var arg in arguments) {
            if (typeof arguments[arg] != "object") {
                outStr += arguments[arg];
            }
        }
        return outStr;
    });

    Handlebars.registerHelper(
        "optionalString",
        function (cond, strTrue = "", strFalse = "") {
            if (cond) return strTrue;
            return strFalse;
        },
    );

    Handlebars.registerHelper("setHas", function (set, value) {
        return set.has(value);
    });

    Handlebars.registerHelper("contains", function (container, value, options) {
        return container.includes(value) ?
                options.fn(container)
            :   options.inverse(container);
    });

    Handlebars.registerHelper("toJSON", function (obj) {
        return JSON.stringify(obj);
    });

    Handlebars.registerHelper("toLowerCase", function (str) {
        return str.toLowerCase();
    });

    Handlebars.registerHelper("getProperty", function (object, key) {
        return sohl.utils.getProperty(object, key);
    });

    Handlebars.registerHelper("arrayToString", function (ary) {
        return ary.join(",");
    });

    Handlebars.registerHelper("injurySeverity", function (val) {
        return "NA"; // TODO: Remove this line when CONFIG.Item.dataModels.injury is available
        // if (val <= 0) return "NA";
        // return val <= 5 ?
        //         (CONFIG.Item.dataModels.injury)?.injuryLevels[val]
        //     :   `G${val}`;
    });

    Handlebars.registerHelper("object", function ({ hash }) {
        return hash;
    });

    Handlebars.registerHelper("array", function () {
        return Array.from(arguments).slice(0, arguments.length - 1);
    });

    Handlebars.registerHelper("textInput", function (value, options) {
        const { class: cssClass, ...config } = options.hash;
        config.value = value;
        const element = foundry.applications.fields.createTextInput(config);
        if (cssClass) element.className = cssClass;
        return new Handlebars.SafeString(element.outerHTML);
    });

    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    Handlebars.registerHelper("displayWorldTime", function (value, options) {
        return new Handlebars.SafeString(sohl.utils.htmlWorldTime(value));
    });
}

async function preloadHandlebarsTemplates() {
    const partials = [
        // Item Sheet Partials
        "systems/sohl/templates/item/parts/item-actions-list.hbs",
        "systems/sohl/templates/item/parts/item-active-effects.hbs",
        "systems/sohl/templates/item/parts/item-description.hbs",
        "systems/sohl/templates/item/parts/item-nesteditems-list.hbs",
        "systems/sohl/templates/item/parts/item-gear-list.hbs",
        "systems/sohl/templates/item/parts/item-gear.hbs",
        "systems/sohl/templates/item/parts/item-masterylevel.hbs",
        "systems/sohl/templates/item/parts/item-refnote.hbs",
        "systems/sohl/templates/item/parts/item-strikemode.hbs",
        "systems/sohl/templates/item/parts/item-header.hbs",
    ];

    const paths: StrictObject<string> = {};
    for (const path of partials) {
        paths[path.replace(".hbs", ".html")] = path;
        const fileName = path.split("/").pop();
        if (fileName) {
            paths[`sohl.${fileName.replace(".hbs", "")}`] = path;
        }
    }

    return loadTemplates(paths);
}
