import * as abstract from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/module.mjs";
import { NestableDataModelMixin } from "./abstract/NestableDataModelMixin.mjs";
import { _l } from "./sohl-localize.mjs";
import { MasteryLevelItemData } from "./item/datamodel/MasteryLevelItemData.mjs";
import { fields } from "../sohl-common.mjs";
import { SohlActor } from "./SohlActor.mjs";
import { SohlActiveEffect } from "./SohlActiveEffect.mjs";
import { SohlItem } from "./SohlItem.mjs";

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

    static TYPE_LABEL = `TYPE.ActiveEffect.${this.metadata.name}`;

    static get parentDocumentClass() {
        return SohlActiveEffect;
    }

    get targetLabel() {
        const targetType =
            this.targetType || SohlActiveEffectData.TARGET_TYPE.THIS;
        const targetName = this.targetName || "";
        const attrs = this.targetHasAttr?.split(",");
        const actor =
            this.parent.parent instanceof SohlActor ?
                this.parent.parent
            :   this.parent.parent.actor;

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
        // a group (eg {*.hbs,*.js}), and false otherwise.
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
                !flags.includes("g") ?
                    `^${GLOBSTAR_SEGMENT}$`
                :   GLOBSTAR_SEGMENT,
                flags,
            );
            result.path = path;
        }

        return result;
    }
}
