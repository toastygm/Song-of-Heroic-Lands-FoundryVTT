import * as abstract from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/module.mjs";
import { NestableDataModelMixin } from "./NestableDataModelMixin.mjs";
import { _l } from "../helper/sohl-localize.mjs";
import { SohlContextMenu } from "../helper/SohlContextMenu.mjs";
import { Utility } from "../helper/utility.mjs";
import { fields } from "../../sohl-common.mjs";
import { SohlActor } from "../actor/SohlActor.mjs";
import { SohlMacro } from "../macro/SohlMacro.mjs";
import { EventItemData } from "./EventItemData.mjs";
import { SkillItemData } from "./SkillItemData.mjs";
import { TraitItemData } from "../item/datamodel/TraitItemData.mjs";
import { MasteryLevelItemData } from "../item/datamodel/MasteryLevelItemData.mjs";
import { SohlItem } from "../item/SohlItem.mjs";

/**
 * @typedef {object} SohlAction
 * @property {string} name localization identifier for name of action
 * @property {string} functionName name of the function to call
 * @property {string} contextIconClass FA CSS Class for the Icon
 * @property {Function|boolean} contextCondition function to call to determine if the action is available
 * @property {string} contextGroup the group to which this action belongs
 * @property {boolean} useAsync if true, the action is async
 */

export class SohlBaseData extends NestableDataModelMixin(
    foundry.abstract.TypeDataModel,
) {
    static COMPARISON = Object.freeze({
        IDENTICAL: 0,
        SIMILAR: 1,
        DIFFERENT: 2,
    });

    /** @inheritdoc */
    static metadata = Object.freeze(
        sohl.utils.mergeObject(super.metadata, {
            locId: "BASEDATA",
            defaultAction: null,
            actions: {},
            events: {},
            effectKeys: {},
            schemaVersion: "0.5.6",
        }),
    );

    /** @override */
    static defineSchema() {
        return {
            macros: new fields.ArrayField(new fields.ObjectField()),
        };
    }

    _initialize(options = {}) {
        super._initialize(options);
        Object.defineProperty(this, "actions", {
            value: this.setupActionCache(),
            writable: false,
        });
    }

    get actions() {
        return this.constructor.metadata.actions;
    }

    get eventsx() {
        return this.constructor.metadata.events;
    }

    get effectKeys() {
        return this.constructor.metadata.effectKeys;
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

    static genEffectKeys(effectKeys, locId) {
        return Object.fromEntries(
            Object.keys(effectKeys).map((k) => [
                effectKeys[k].path,
                {
                    label: `SOHL.${locId}.effectKeys.${effectKeys[k].id}`,
                    abbrev: effectKeys[k].abbrev,
                },
            ]),
        );
    }

    static genActions(actions, locId) {
        return Object.fromEntries(
            Object.keys(actions).map((k) => [
                actions[k].path,
                {
                    name: `SOHL.${locId}.ACTION.${actions[k].id}`,
                    functionName: k,
                    contextIconClass: actions[k].contextIconClass,
                    contextCondition: actions[k].contextCondition,
                    contextGroup: actions[k].contextGroup,
                    useAsync: actions[k].useAsync || false,
                },
            ]),
        );
    }

    setupActionCache() {
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
        this.constructor.metadata.actions.forEach((intrinsicAction) => {
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
                    macro.contextGroup = SohlContextMenu.SORT_GROUPS.ESSENTIAL;
                }
            } else {
                hasDefault ||= isDefault;
            }
        });

        game.sohl?.i18n.sortObjects(ary, "contextGroup");

        // If no default was specified, then make the first element the default
        if (!hasDefault && ary.length) {
            ary[0][1].contextGroup = SohlContextMenu.SORT_GROUPS.DEFAULT;
        }

        return new Collection(ary);
    }

    /**
     * A function that retrieves events that are targeting this document,
     * both from the actor, other items within the actor, and if this is
     * an item, from nested items.
     *
     * @readonly
     * @type {object}
     */
    get targetedEvents() {
        if (!this.actor) return [];

        const result = [];
        for (const it of this.actor.allItems()) {
            // If the item is an Event and if it is targeting
            // this document or is nested within this document
            // then add the event to the result list
            if (
                it.system instanceof EventItemData &&
                it.system.started &&
                (it.system.target.uuid === this.uuid ||
                    it.nestedIn?.uuid === this.uuid)
            )
                result.push(it);
        }
        return result;
    }

    get defaultAction() {
        return this.constructor.metadata.defaultAction;
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
     * Select the appropriate item to use for the opposed test, then delegate processing
     * of the opposed request to that item.
     *
     * @param {object} scope
     * @param {string} [scope.sourceTestResult]
     * @param {number} [scope.testType]
     * @returns {OpposedTestResult} result of the test
     */
    async dispatchOpposedResume(speaker, actor, token, character, scope = {}) {
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
                "SOHL.Actor.entity.dispatchOpposedResume.getOpposedItem.label",
            ),
            title: _l(
                "SOHL.Actor.entity.dispatchOpposedResume.getOpposedItem.title",
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
                        "SOHL.Actor.entity.dispatchOpposedResume.getOpposedItem.attributeLabel",
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
            ui.notifications?.warn(
                _l(
                    "SOHL.Actor.entity.dispatchOpposedResume.getOpposedItem.noUsableSkills",
                    { name: token.name },
                ),
            );
            return null;
        } else {
            skill.system.execute(
                MasteryLevelItemData.ACTION.OPPOSEDTESTRESUME,
                scope,
            );
        }
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
