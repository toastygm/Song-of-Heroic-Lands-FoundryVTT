/* eslint-disable no-unused-vars */
import * as sohl from "./sohl-common.js";

/* ====================================================================== */
/*          Constants                                                     */
/* ====================================================================== */

const fields = foundry.data.fields;

const LGND = {
    CONST: {
        // Legendary init message with ASCII Artwork (Doom font)
        initVersionMessage: ` _                               _
| |                             | |
| |     ___  __ _  ___ _ __   __| | __ _ _ __ _   _
| |    / _ \\/ _\` |/ _ \\ '_ \\ / _\` |/ _\` | '__| | | |
| |___|  __/ (_| |  __/ | | | (_| | (_| | |  | |_| |
\\_____/\\___|\\__, |\\___|_| |_|\\__,_|\\__,_|_|   \\__, |
             __/ |                             __/ |
            |___/                             |___/
===========================================================`,

        VERSETTINGS: {
            legEncIncr: {
                key: "legEncIncr",
                data: {
                    name: "Encumbrance tracking increment",
                    hint: "Calculate encumbrance by specified steps",
                    scope: "world",
                    config: true,
                    type: new fields.NumberField({
                        required: true,
                        nullable: false,
                        initial: 5,
                        min: 1,
                    }),
                },
            },
            legAttrSecModIncr: {
                key: "legAttrSecModIncr",
                data: {
                    name: "Attribute secondary modifier increment",
                    hint: "Calculate attribute secondary modifier by specified steps",
                    scope: "world",
                    config: true,
                    type: new fields.NumberField({
                        required: true,
                        nullable: false,
                        initial: 5,
                        min: 1,
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
            animateActorPacks: {
                key: "animateActorPacks",
                data: {
                    name: "Animate Actor Compendiums",
                    hint: "list of Compendiums containing Animate Actors that will be searched for template actors, comma separated, in order",
                    scope: "world",
                    config: true,
                    type: new fields.StringField({
                        nullable: false,
                        initial: "sohl.leg-characters",
                    }),
                },
            },
        },
    },
};

class LgndImpactModifier extends sohl.ImpactModifier {
    // List of possible dice for impact dice.
    static get dice() {
        return {
            0: "None",
            4: "d4",
            6: "d6",
            8: "d8",
            10: "d10",
            12: "d12",
        };
    }

    static get maxImpactDie() {
        return Object.values(this.dice).at(-1);
    }

    get impactTA() {
        switch (this.aspect) {
            case "blunt":
                return 3;
            case "edged":
                return 5;
            case "piercing":
                return 4;
            case "fire":
                return 2;
            default:
                return 0;
        }
    }

    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    calcStrikeImpact(numImpactTAs = 0, { impactTA = null } = {}) {
        // TODO - Implement Impact Calculation
        return 0;
    }
}

class LgndMasteryLevelModifier extends sohl.MasteryLevelModifier {
    constructor(parent, initProperties = {}) {
        super(
            parent,
            foundry.utils.mergeObject(
                initProperties,
                {
                    secMod: (thisVM) => {
                        return (thisVM.index - 5) * 5;
                    },
                },
                { inplace: false, recursive: false },
            ),
        );
    }

    /**
     * @typedef LgndSuccessTestResult
     * @property {object} speaker
     * @property {MasteryLevelModifier} mlMod MasteryLevelModifier for this test
     * @property {ImpactModifier} impactMod
     * @property {number} aim
     * @property {SohlItem} item
     * @property {Roll} roll Roll for this test
     * @property {number} lastDigit
     * @property {boolean} isCapped
     * @property {string} type
     * @property {string} title
     * @property {string} typeLabel
     * @property {number} rollMode
     * @property {boolean} askFate
     * @property {boolean} critAllowed
     * @property {boolean} successLevel
     * @property {boolean} isCritical
     * @property {boolean} isSuccess
     * @property {string} description
     * @property {boolean} isSuccessValue
     * @property {number} successValueMod
     * @property {number} successValue
     * @property {number} svBonus
     */

    testResultToObject(testResult) {
        const result = {};
        for (const [k, v] of Object.entries(testResult)) {
            if (["roll", "mlMod", "impactMod"].includes(k)) {
                result[`${k}Json`] = v.toJSON();
            } else if (
                k instanceof sohl.SohlItem ||
                k instanceof sohl.SohlActor
            ) {
                result[`${k}Uuid`] = v.uuid;
            }
        }
        return result;
    }

    testResultFromObject(obj) {
        const result = {};
        for (const [k, v] of Object.entries(obj)) {
            if (k.endsWith("Json")) {
                result[k.slice(0, -4)] = v.fromJSON();
            } else if (k.endsWith("Uuid")) {
                result[k.slice(0, -4)] = fromUuidSync(v);
            } else {
                result[k] = v;
            }
        }
    }

    static async successTestToChat({ speaker, testResult }) {
        if (!speaker) {
            speaker = this.parent.actor
                ? ChatMessage.getSpeaker({ actor: this.parent.actor })
                : ChatMessage.getSpeaker();
        }

        const chatData = {
            variant: sohl.SOHL.sysVer.id,
            testResult,
            testResultJson: JSON.stringify(testResult),
        };

        const chatTemplate =
            "systems/sohl/templates/chat/standard-test-card.html";

        const html = await renderTemplate(chatTemplate, chatData);

        const messageData = {
            user: game.user.id,
            speaker,
            content: html.trim(),
            sound: CONFIG.sounds.dice,
        };

        ChatMessage.applyRollMode(messageData, testResult.rollMode);

        // Create a chat message
        return await ChatMessage.create(messageData);
    }

    static async opposedTestToChat(speaker, actor, token, character, scope) {
        let { opposedTestResult } = scope;
        ({ speaker, actor, token, character } =
            sohl.SohlMacro.getExecuteDefaults({
                speaker,
                actor,
                token,
                character,
                needsToken: true,
                self: this,
            }));

        // Prepare for Chat Message
        const chatTemplate =
            "systems/sohl/templates/chat/opposed-result-card.html";

        const chatTemplateData = foundry.utils.mergeObject(
            opposedTestResult,
            {
                variant: sohl.SOHL.sysVer.id,
                title: `Opposed Roll Result`,
            },
            { inplace: false },
        );

        chatTemplateData.sourceTestResultJson = JSON.stringify(
            LgndMasteryLevelModifier.testResultToObject(
                opposedTestResult.sourceTestResult,
            ),
        );
        chatTemplateData.targetTestResultJson = JSON.stringify(
            LgndMasteryLevelModifier.testResultToObject(
                opposedTestResult.targetTestResult,
            ),
        );

        const html = await renderTemplate(chatTemplate, chatTemplateData);

        const messageData = {
            user: game.user.id,
            speaker: this.speaker,
            content: html.trim(),
            style: CONST.CHAT_MESSAGE_STYLES.DICE,
        };

        const messageOptions = {};

        // Create a chat message
        return await ChatMessage.create(messageData, messageOptions);
    }

    /**
     * Perform a success test of the MasteryLevel.
     *
     * @param {object} options Configuration options for the roll
     * @param {boolean} [options.skipDialog=false] Do not display dialog box (use defaults)
     * @param {string} [options.type] Test identifier string
     * @param {label} [options.title] Human-readable short description
     * @returns {LgndSuccessTestResult} Object containing results of the roll
     */
    async test({
        skipDialog = false,
        speaker,
        type = "Skill",
        title = "",
        successTestResult = null,
        noChat = false,
    } = {}) {
        if (!successTestResult) {
            let mlMod = this.constructor.create(this);
            let rollMode = null;
            let impactMod = null;
            let aim = this.parent.defaultAim;
            if (this.parent instanceof sohl.StrikeModeItemData) {
                impactMod = LgndImpactModifier.create(
                    this.parent.system.$impact,
                );
            }
            if (!skipDialog) {
                // Render modal dialog
                let dlgTemplate =
                    "systems/sohl/templates/dialog/standard-test-dialog.html";

                let dialogData = {
                    variant: sohl.SOHL.sysVer.id,
                    type,
                    title,
                    target: mlMod.effective,
                    base: mlMod.base,
                    mlModValue: 0,
                    askSuccessLevelMod: true,
                    successLevelModValue: mlMod.successLevelMod || 0,
                    askImpactMod: !!impactMod,
                    impactModValue: 0,
                    askAim:
                        this.parent instanceof
                        sohl.MeleeWeaponStrikeModeItemData,
                    defaultAim: aim,
                    aimChoices: this.parent.aimChoices,
                    rollMode: game.settings.get("core", "rollMode"),
                    rollModes: Object.entries(CONFIG.Dice.rollModes).map(
                        ([k, v]) => ({
                            group: "CHAT.RollDefault",
                            value: k,
                            label: v,
                        }),
                    ),
                };
                const html = await renderTemplate(dlgTemplate, dialogData);

                // Create the dialog window
                const result = await Dialog.prompt({
                    title: dialogData.title,
                    content: html.trim(),
                    label: "Roll",
                    callback: (html) => {
                        const form = html.querySelector("form");
                        const fd = new FormDataExtended(form);
                        const formData = fd.object;
                        const formMlMod =
                            Number.parseInt(formData.mlMod, 10) || 0;
                        const formImpactMod =
                            Number.parseInt(formData.impactMod, 10) || 0;
                        const formAim =
                            Number.parseInt(formData.impactMod, 10) || 0;

                        if (impactMod) {
                            impactMod.add(
                                "SituationalModifier",
                                "SitMod",
                                formImpactMod,
                            );
                        }

                        if (formMlMod) {
                            mlMod.add(
                                "Situational Modifier",
                                "SitMod",
                                formMlMod,
                            );
                        }

                        if (dialogData.askSuccessLevelMod) {
                            const formSuccessLevelMod = Number.parseInt(
                                formData.successLevelMod,
                                10,
                            );
                            mlMod.successLevelMod = formSuccessLevelMod;
                        }

                        return {
                            mlMod,
                            impactMod,
                            aim: formAim || null,
                            rollMode: formData.rollMode,
                        };
                    },
                    rejectClose: false,
                    options: { jQuery: false },
                });

                if (!result) return;
                mlMod = result.mlMod;
                rollMode = result.rollMode;
                aim = result.aim;
                impactMod = result.impactMod;
            }

            const roll = await new Roll("1d100").evaluate();
            if (!roll) {
                throw new Error(`Roll evaluation failed`);
            }

            successTestResult = {
                speaker,
                mlMod,
                impactMod,
                aim,
                item: this.parent.item,
                roll: roll,
                lastDigit: roll.total % 10,
                isCapped: mlMod.effective !== mlMod.constrainedEffective,
                type,
                title,
                typeLabel: this.parent.constructor.typeLabel,
                rollMode,
            };
        }

        successTestResult.critAllowed =
            successTestResult.mlMod.critSuccessDigits.length ||
            successTestResult.mlMod.critFailureDigits.length;
        if (successTestResult.critAllowed) {
            if (
                successTestResult.roll.total <=
                successTestResult.mlMod.constrainedEffective
            ) {
                if (
                    successTestResult.mlMod.critSuccessDigits.includes(
                        successTestResult.lastDigit,
                    )
                ) {
                    successTestResult.successLevel =
                        sohl.SOHL.CONST.SUCCESS_LEVEL.CriticalSuccess;
                } else {
                    successTestResult.successLevel =
                        sohl.SOHL.CONST.SUCCESS_LEVEL.MarginalSuccess;
                }
            } else {
                if (
                    successTestResult.mlMod.critFailureDigits.includes(
                        successTestResult.lastDigit,
                    )
                ) {
                    successTestResult.successLevel =
                        sohl.SOHL.CONST.SUCCESS_LEVEL.CriticalFailure;
                } else {
                    successTestResult.successLevel =
                        sohl.SOHL.CONST.SUCCESS_LEVEL.MarginalFailure;
                }
            }
        } else {
            if (
                successTestResult.roll.total <=
                successTestResult.mlMod.constrainedEffective
            ) {
                successTestResult.successLevel =
                    sohl.SOHL.CONST.SUCCESS_LEVEL.MarginalSuccess;
            } else {
                successTestResult.successLevel =
                    sohl.SOHL.CONST.SUCCESS_LEVEL.MarginalFailure;
            }
        }
        successTestResult.successLevel += successTestResult.successLevelMod;
        if (!successTestResult.critAllowed) {
            successTestResult.successLevel = Math.min(
                Math.max(
                    successTestResult.successLevel,
                    sohl.SOHL.CONST.SUCCESS_LEVEL.MarginalFailure,
                ),
                sohl.SOHL.CONST.SUCCESS_LEVEL.MarginalSuccess,
            );
        }

        successTestResult.isCritical =
            successTestResult.critAllowed &&
            (successTestResult.successLevel <=
                sohl.SOHL.CONST.SUCCESS_LEVEL.CriticalFailure ||
                successTestResult.successLevel >=
                    sohl.SOHL.CONST.SUCCESS_LEVEL.CriticalSuccess);
        successTestResult.isSuccess =
            successTestResult.successLevel >=
            sohl.SOHL.CONST.SUCCESS_LEVEL.MarginalSuccess;
        successTestResult.description = `${successTestResult.critAllowed ? (successTestResult.isCritical ? "Critical " : "Marginal ") : ""}${successTestResult.isSuccess ? "Success" : "Failure"}`;

        // If success level is greater than critical success or less than critical failure
        // then add the amount to the end of the description
        let successLevelIncr = 0;
        if (successTestResult.isCritical) {
            successLevelIncr =
                successTestResult.successLevel -
                (successTestResult.isSuccess
                    ? sohl.SOHL.CONST.SUCCESS_LEVEL.CriticalSuccess
                    : sohl.SOHL.CONST.SUCCESS_LEVEL.CriticalFailure);
        }
        if (successLevelIncr) {
            successTestResult.description = `${successTestResult.description} (${
                (successLevelIncr > 0 ? "+" : "") + successLevelIncr
            })`;
        }

        if (!successTestResult.isSuccessValue) {
            // If there is a table providing detailed description of
            // the results of this test, then process that table to
            // extract the detailed result descriptions.  Many tests
            // will not have these detailed descriptions, in which
            // case only generic descriptions will be given.
            if (successTestResult.mlMod.hasProperty("testDescTable")) {
                LgndMasteryLevelModifier._handleDetailedDescription(
                    successTestResult,
                    successTestResult.successLevel,
                    successTestResult.mlMod.testDescTable,
                );
            }
        } else {
            successTestResult.successValueMod =
                successTestResult.successLevel - 1;
            successTestResult.successValue =
                this.index + successTestResult.successValueMod;
            const slSign = successTestResult.successValueMod < 0 ? "-" : "+";
            successTestResult.successValueExpr = `${
                this.index
            } ${slSign} ${Math.abs(successTestResult.successValueMod)}`;

            // Each MasteryLevel item may optionally
            // have its own success value table included; if
            // so, then that one will be used, otherwise the
            // default one will be used.
            const svTable = this.parent.item.system.successValueTable;

            // The meaning of the success value bonus ("svBonus") is
            // unique to each type of success value.  Sometimes it
            // represents the number of rolls on another table, or the
            // increase in value or quality of a crafted item, or any
            // other thing.  See the description of the specific test
            // to determine the meaning of the bonus.
            successTestResult.svBonus =
                LgndMasteryLevelModifier._handleDetailedDescription(
                    successTestResult,
                    successTestResult.successValue,
                    svTable,
                );
        }

        if (!noChat) {
            await LgndMasteryLevelModifier.successTestToChat({
                speaker,
                testResult: successTestResult,
            });
        }
        return successTestResult;
    }
}

class LgndAnimateEntityActorData extends sohl.AnimateEntityActorData {
    $combatReach;
    $hasAuralShock;
    $maxZones;
    $encumbrance;
    $sunsign;

    get intrinsicActions() {
        let actions = super.intrinsicActions.map((a) => {
            if (a.contextGroup === "default") {
                a.contextGroup = "primary";
            }
            return a;
        });

        actions.push(
            // TODO - Add Lgnd Actor Actions
        );

        actions.sort((a, b) => a.contextGroup.localeCompare(b.contextGroup));
        return actions;
    }

    async damageRoll({
        targetToken,
        impactMod,
        numImpactTAs = 0,
        bodyLocationUuid,
        skipDialog = false,
        ...options
    } = {}) {
        return super.damageRoll({
            targetToken,
            impactMod,
            numImpactTAs,
            bodyLocationUuid,
            skipDialog,
            ...options,
        });
    }

    async _damageDialog({
        type,
        label,
        strikeMode,
        impactMod,
        numImpactTAs = 0,
        ...options
    }) {
        return super._damageDialog({
            type,
            label,
            strikeMode,
            impactMod,
            numImpactTAs,
            ...options,
        });
    }

    async _damageDialogCallback(html, { type, impactMod, strikeMode }) {
        const form = html[0].querySelector("form");
        const formNumImpactTAs =
            Number.parseInt(form.numImpactTAs.value, 10) || 0;
        const newImpact = impactMod
            ? this.constructor.create(impactMod)
            : {
                  die: Number.parseInt(form.impactDie.value, 10) || 0,
                  modifier: Number.parseInt(form.impactModifier.value, 10) || 0,
                  aspect: form.impactAspect.value,
              };
        if (formNumImpactTAs) {
            const impactAdd =
                (strikeMode?.system.$traits.impactTA || newImpact.impactTA) *
                formNumImpactTAs;
            newImpact.add(`${formNumImpactTAs} Impact TAs`, "ImpTA", impactAdd);
        }

        return super._damageDialogCallback(html, {
            type,
            impactMod,
            strikeMode,
        });
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
    async opposedTestResume(speaker, actor, token, character, scope) {
        let { sourceTestResult, testType = "skill" } = scope;
        ({ speaker, actor, token, character } =
            sohl.SohlMacro.getExecuteDefaults({
                speaker,
                actor,
                token,
                character,
                needsToken: true,
                self: this,
            }));

        if (testType === "ignore") {
            return await this.execute("ignoreResume", scope);
        }

        let opposedItems = [];
        let label = "Melee Strike Mode";
        switch (testType) {
            case "skill":
                label = "Skill";
                for (const it of this.actor.allItems()) {
                    if (
                        it.system instanceof sohl.TraitItemData &&
                        it.system.intensity === "attribute"
                    ) {
                        if (!it.system.$masteryLevel.disabled) {
                            opposedItems.push({
                                name: `Attribute: ${it.name} (ML:${it.system.$masteryLevel.effective})`,
                                uuid: it.uuid,
                                value: it.system.$masteryLevel,
                                item: it,
                            });
                        }
                    } else if (it.system instanceof sohl.SkillItemData) {
                        if (!it.system.$masteryLevel.disabled) {
                            opposedItems.push({
                                name: `Skill: ${it.name} (ML:${it.system.$masteryLevel.effective})`,
                                uuid: it.uuid,
                                value: it.system.$masteryLevel,
                                item: it,
                            });
                        }
                    }
                }
                opposedItems.sort((a, b) => a.localeCompare(b));
                break;

            case "block":
                opposedItems = this.actor.itemTypes.meleestrikemode.filter(
                    (it) => !it.system.$defense.block.disabled,
                );
                opposedItems.sort(
                    (a, b) =>
                        b.item.system.$defense.block.effective -
                        a.item.system.$defense.block.effective,
                );
                break;

            case "dodge":
                opposedItems = this.actor.itemTypes.skill.filter(
                    (it) =>
                        it.system.subType === "Combat" && it.name === "Dodge",
                );
                break;

            case "counterstrike":
                opposedItems = this.actor.itemTypes.meleestrikemode.filter(
                    (it) => !it.system.$defense.counterstrike.disabled,
                );
                opposedItems.sort(
                    (a, b) =>
                        b.item.system.$defense.counterstrike.effective -
                        a.item.system.$defense.counterstrike.effective,
                );
                break;
        }

        if (!opposedItems.length) {
            ui.notifications.warn("No items available for opposing test");
            return null;
        }

        const defaultItem = opposedItems[0];

        const dialogOptions = {
            variant: "legendary",
            type: "opposed-item-select",
            title: `Select ${label}`,
            opposedItems,
            defaultItem,
        };
        const compiled = Handlebars.compile(`<form id="select-token">
            <div class="form-group">
            <span>Opponent using ${sourceTestResult.item.label}</span>
            </div>
            <div class="form-group">
                <label>Select which ${label} to use:</label>
                <select name="opposedItemUuid">
                {{selectOptions opposedItems selected=defaultItem.uuid valueAttr="uuid" labelAttr="name"}}
                </select>
            </div></form>`);
        const dlgHtml = compiled(dialogOptions, {
            allowProtoMethodsByDefault: true,
            allowProtoPropertiesByDefault: true,
        });
        const item = await Dialog.prompt({
            title: `Choose ${label}`,
            content: dlgHtml,
            label: "OK",
            callback: async (html) => {
                const form = html.querySelector("form");
                const fd = new FormDataExtended(form);
                const formdata = foundry.utils.expandObject(fd.object);
                return opposedItems.find(
                    (obj) => obj.uuid === formdata.opposedItemUuid,
                );
            },
            options: { jQuery: false },
            rejectClose: false,
        });
        if (!item) return null;
        return item.system.execute("opposedTestResume", scope);
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
    async ignoreResume(speaker, actor, token, character, scope) {
        let { sourceTestResult } = scope;
        ({ speaker, actor, token, character } =
            sohl.SohlMacro.getExecuteDefaults({
                speaker,
                actor,
                token,
                character,
                needsToken: true,
                self: this,
            }));

        const targetTestResult = {
            speaker,
            mlMod: new LgndMasteryLevelModifier(this).setBase(0),
            impactMod: null,
            aim: null,
            item: null,
            roll: new Roll("5").execute(),
            lastDigit: 5,
            isCapped: true,
            type: null,
            typeLabel: null,
            rollMode: "publicroll",
            critAllowed: true,
            successLevel: sohl.SOHL.CONST.CriticalFailure,
            isCritical: true,
            isSuccess: false,
            description: "Critical Failure",
            isSuccessValue: false,
        };

        let victoryStars = Math.max(
            sourceTestResult.successLevel -
                sohl.SOHL.CONST.SUCCESS_LEVEL.CriticalFailure,
            0,
        );
        const opposedTestResult = {
            sourceTestResult,
            targetTestResult,
            victoryStars: victoryStars,
            vsText: sohl.MasteryLevelItemData.victoryStarsText(victoryStars),
            sourceWins: victoryStars > 0,
            targetWins: false,
        };

        if (victoryStars >= 2) {
            sourceTestResult.tacticalAdvantages = [];
            sourceTestResult.addlTacticalAdvantages = victoryStars - 1 + 1;
            sourceTestResult.tacticalAdvantageTypes = ["Impact", "Precision"];
        }

        if (sourceTestResult.isCritical && !sourceTestResult.isSuccess) {
            if (sourceTestResult.lastDigit === 0) {
                sourceTestResult.fumbleTest = true;
            } else {
                sourceTestResult.stumbleTest = true;
            }
        }

        return await LgndMasteryLevelModifier.opposedTestToChat(
            speaker,
            actor,
            token,
            character,
            {
                speaker,
                opposedTestResult,
            },
        );
    }

    prepareBaseData() {
        super.prepareBaseData();
        this.$maxZones = 0;
        this.$combatReach = -99;
        this.$hasAuralShock = false;
        this.$encumbrance = new sohl.ValueModifier(this, {
            total: (thisVM) => {
                const encDiv = game.settings.get(
                    "sohl",
                    LGND.CONST.VERSETTINGS.legEncIncr.key,
                );
                let result = Math.round(
                    Math.floor((thisVM.effective + Number.EPSILON) * encDiv) /
                        encDiv,
                );
                return result;
            },
        });
        this.$encumbrance.floor("Min Zero", "Min0", 0);
    }
}

class LgndProtectionItemData extends sohl.ProtectionItemData {}

function LgndStrikeModeItemDataMixin(BaseMLID) {
    return class LgndStrikeModeItemData extends BaseMLID {
        $reach;
        $heft;

        get heftBase() {
            return this.item.getFlag("sohl", "legendary.heftBase") || 0;
        }

        get zoneDie() {
            return this.item.getFlag("sohl", "legendary.zoneDie") || 0;
        }

        static get tactialAdvantages() {
            return {
                action: "Action",
                impact: "Impact",
                precision: "Precision",
            };
        }

        static get effectKeys() {
            return sohl.Utility.simpleMerge(super.effectKeys, {
                "mod:system.$impact.armorReduction": {
                    label: "Armor Reduction",
                    abbrev: "AR",
                },
                "system.$defense.block.successLevelMod": {
                    label: "Block Success Level",
                    abbrev: "BlkSL",
                },
                "system.$defense.counterstrike.successLevelMod": {
                    label: "Counterstrike Success Level",
                    abbrev: "CXSL",
                },
                "system.$traits.opponentDef": {
                    label: "Opponent Defense",
                    abbrev: "OppDef",
                },
                "system.$traits.entangle": {
                    label: "Entangle",
                    abbrev: "Entangle",
                },
                "system.$traits.envelop": {
                    label: "Envelop",
                    abbrev: "Envlp",
                },
                "system.$traits.lowAim": {
                    label: "High Strike",
                    abbrev: "HiStrike",
                },
                "system.$traits.impactTA": {
                    label: "Impact Tac Adv",
                    abbrev: "ImpTA",
                },
                "system.$traits.notInClose": {
                    label: "Not In Close",
                    abbrev: "NotInCls",
                },
                "system.$traits.onlyInClose": {
                    label: "Only In Close",
                    abbrev: "OnlyInCls",
                },
                "system.$traits.lowStrike": {
                    label: "Low Strike",
                    abbrev: "LoStrike",
                },
                "system.$traits.deflectTN": {
                    label: "Deflect TN",
                    abbrev: "DeflTN",
                },
                "system.$traits.shieldMod": {
                    label: "Shield Mod",
                    abbrev: "ShldMod",
                },
                "system.$traits.extraBleedRisk": {
                    label: "Extra Bleed Risk",
                    abbrev: "XBldRsk",
                },
                "system.$traits.noStrMod": {
                    label: "No STR Mod",
                    abbrev: "NoStrMod",
                },
                "system.$traits.halfImpact": {
                    label: "Half Impact",
                    abbrev: "HlfImp",
                },
            });
        }

        prepareBaseData() {
            super.prepareBaseData();
            this.$reach = new sohl.ValueModifier(this);
            this.$heft = new sohl.ValueModifier(this);
            foundry.utils.mergeObject(this.$traits, {
                armorReduction: 0,
                blockSLMod: 0,
                cxSLMod: 0,
                opponentDef: 0,
                entangle: false,
                envelop: false,
                lowAim: false,
                impactTA: 0,
                notInClose: false,
                onlyInClose: false,
                deflectTN: 0,
                shieldMod: 0,
                extraBleedRisk: false,
                noStrMod: false,
                halfImpact: false,
                noBlock: false,
                noAttack: false,
            });
        }

        processSiblings() {
            super.processSiblings();
            if (this.$traits.noBlock) this.$defense.block.disabled = true;
            if (this.$traits.noAttack) {
                this.$attack.disabled = true;
                this.$defense.counterstrike.disabled = true;
            }
            if (this.$traits.blockSLMod)
                this.$defense.block.successLevelMod.add(
                    "SL Modifier",
                    "SLMod",
                    this.$traits.blockSLMod,
                );

            if (this.$traits.cxSLMod)
                this.$defense.counterstrike.successLevelMod.add(
                    "SL Modifier",
                    "SLMod",
                    this.$traits.cxSLMod,
                );

            const weapon = this.item.nestedIn;
            const strength = this.actor.getTraitByAbbrev("str");

            if (weapon?.system instanceof sohl.WeaponGearItemData) {
                this.$heft.addVM(weapon.system.$heft, {
                    includeBase: true,
                });
                this.$length.addVM(weapon.system.$length, {
                    includeBase: true,
                });

                // If held in a non-favored part, attack/block/CX are at -5
                if (!weapon.system.$heldByFavoredPart) {
                    this.$heft.add("Held by non-favored limb", "NonFavLimb", 5);
                }

                // If held in two hands (for a weapon that only requires one hand)
                // reduce the HFT by 5
                if (weapon.system.$heldBy.length > this.minParts) {
                    this.$heft.add("Multi-Limb Bonus", "MultLimb", -5);

                    if (strength) {
                        // If swung and STR is greater than base unmodified heft, impact
                        // increases by 1
                        if (
                            this.$traits.swung &&
                            strength.system.$score?.base >= this.heftBase
                        ) {
                            this.$impact.add(
                                "Swung Strength Bonus",
                                "SwgStr",
                                1,
                            );
                        }
                    }
                }
            } else {
                this.$length.setBase(this.lengthBase);
                this.$heft.setBase(this.heftBase);
            }

            if (strength) {
                const strValue = strength.system.$score?.effective || 0;

                const heftPenalty =
                    Math.max(0, this.$heft.effective - strValue) * -5;

                if (heftPenalty) {
                    this.$attack.add(
                        "Heft Strength Penalty",
                        "HeftStr",
                        heftPenalty,
                    );
                    this.$defense.block.add(
                        "Heft Strength Penalty",
                        "HeftStr",
                        heftPenalty,
                    );
                    this.$defense.counterstrike.add(
                        "Heft Strength Penalty",
                        "HeftStr",
                        heftPenalty,
                    );
                }
            }

            this.$reach.floor("Min Reach", "Min", 0);
            this.$reach.addVM(this.$length, {
                includeBase: true,
            });

            const size = this.actor.getTraitByAbbrev("siz");
            if (size) {
                const sizeReachMod = size.system.$params?.reachMod || 0;
                this.$reach.add("Size Modifier", "Siz", sizeReachMod);
            }
        }
    };
}

class LgndMeleeWeaponStrikeModeItemData extends LgndStrikeModeItemDataMixin(
    sohl.MeleeWeaponStrikeModeItemData,
) {
    static get effectKeys() {
        return sohl.Utility.simpleMerge(super.effectKeys, {
            "mod:system.$heft": { label: "Heft", abbrev: "Hft" },
            "system.$traits.couched": { label: "Couched", abbrev: "Couched" },
            "system.$traits.slow": { label: "Slow", abbrev: "Slow" },
            "system.$traits.thrust": { label: "Thrust", abbrev: "Thst" },
            "system.$traits.swung": { label: "Swung", abbrev: "Swng" },
            "system.$traits.halfSword": {
                label: "Half Sword",
                abbrev: "HlfSwd",
            },
            "system.$traits.twoPartLen": {
                label: "2H Length",
                abbrev: "2HLen",
            },
        });
    }

    static get tactialAdvantages() {
        return {
            action: "Action",
            impact: "Impact",
            precision: "Precision",
            setup: "Setup",
        };
    }

    static get combatTable() {
        return {
            block: {
                "cf:cf": {
                    atkFumble: true,
                    defFumble: true,
                    atkStumble: false,
                    defStumble: false,
                    dta: false,
                    block: false,
                    miss: false,
                    atkDice: 0,
                    defDice: 0,
                },
                "mf:cf": {
                    atkFumble: false,
                    defFumble: true,
                    atkStumble: false,
                    defStumble: false,
                    dta: false,
                    block: false,
                    miss: false,
                    atkDice: 0,
                    defDice: 0,
                },
                "ms:cf": {
                    atkFumble: false,
                    defFumble: false,
                    atkStumble: false,
                    defStumble: false,
                    dta: false,
                    block: false,
                    miss: false,
                    atkDice: 2,
                    defDice: 0,
                },
                "cs:cf": {
                    atkFumble: false,
                    defFumble: false,
                    atkStumble: false,
                    defStumble: false,
                    dta: false,
                    block: false,
                    miss: false,
                    atkDice: 3,
                    defDice: 0,
                },

                "cf:mf": {
                    atkFumble: true,
                    defFumble: false,
                    atkStumble: false,
                    defStumble: false,
                    dta: false,
                    block: false,
                    miss: false,
                    atkDice: 0,
                    defDice: 0,
                },
                "mf:mf": {
                    atkFumble: false,
                    defFumble: false,
                    atkStumble: false,
                    defStumble: false,
                    dta: false,
                    block: true,
                    atkDice: 0,
                    defDice: 0,
                },
                "ms:mf": {
                    atkFumble: false,
                    defFumble: false,
                    atkStumble: false,
                    defStumble: false,
                    dta: false,
                    block: false,
                    miss: false,
                    atkDice: 1,
                    defDice: 0,
                },
                "cs:mf": {
                    atkFumble: false,
                    defFumble: false,
                    atkStumble: false,
                    defStumble: false,
                    dta: false,
                    block: false,
                    miss: false,
                    atkDice: 2,
                    defDice: 0,
                },

                "cf:ms": {
                    atkFumble: false,
                    defFumble: false,
                    atkStumble: false,
                    defStumble: false,
                    dta: true,
                    block: false,
                    miss: false,
                    atkDice: 0,
                    defDice: 0,
                },
                "mf:ms": {
                    atkFumble: false,
                    defFumble: false,
                    atkStumble: false,
                    defStumble: false,
                    dta: true,
                    block: false,
                    miss: false,
                    atkDice: 0,
                    defDice: 0,
                },
                "ms:ms": {
                    atkFumble: false,
                    defFumble: false,
                    atkStumble: false,
                    defStumble: false,
                    dta: false,
                    block: true,
                    atkDice: 0,
                    defDice: 0,
                },
                "cs:ms": {
                    atkFumble: false,
                    defFumble: false,
                    atkStumble: false,
                    defStumble: false,
                    dta: false,
                    block: false,
                    miss: false,
                    atkDice: 1,
                    defDice: 0,
                },

                "cf:cs": {
                    atkFumble: false,
                    defFumble: false,
                    atkStumble: false,
                    defStumble: false,
                    dta: true,
                    block: false,
                    miss: false,
                    atkDice: 0,
                    defDice: 0,
                },
                "mf:cs": {
                    atkFumble: false,
                    defFumble: false,
                    atkStumble: false,
                    defStumble: false,
                    dta: true,
                    block: false,
                    miss: false,
                    atkDice: 0,
                    defDice: 0,
                },
                "ms:cs": {
                    atkFumble: false,
                    defFumble: false,
                    atkStumble: false,
                    defStumble: false,
                    dta: true,
                    block: false,
                    miss: false,
                    atkDice: 0,
                    defDice: 0,
                },
                "cs:cs": {
                    atkFumble: false,
                    defFumble: false,
                    atkStumble: false,
                    defStumble: false,
                    dta: false,
                    block: true,
                    atkDice: 0,
                    defDice: 0,
                },
            },
            counterstrike: {
                "cf:cf": {
                    atkFumble: true,
                    defFumble: true,
                    atkStumble: false,
                    defStumble: false,
                    dta: false,
                    block: false,
                    miss: false,
                    atkDice: 0,
                    defDice: 0,
                },
                "mf:cf": {
                    atkFumble: false,
                    defFumble: true,
                    atkStumble: false,
                    defStumble: false,
                    dta: false,
                    block: false,
                    miss: false,
                    atkDice: 0,
                    defDice: 0,
                },
                "ms:cf": {
                    atkFumble: false,
                    defFumble: false,
                    atkStumble: false,
                    defStumble: false,
                    dta: false,
                    block: false,
                    miss: false,
                    atkDice: 3,
                    defDice: 0,
                },
                "cs:cf": {
                    atkFumble: false,
                    defFumble: false,
                    atkStumble: false,
                    defStumble: false,
                    dta: false,
                    block: false,
                    miss: false,
                    atkDice: 4,
                    defDice: 0,
                },

                "cf:mf": {
                    atkFumble: true,
                    defFumble: false,
                    atkStumble: false,
                    defStumble: false,
                    dta: false,
                    block: false,
                    miss: false,
                    atkDice: 0,
                    defDice: 0,
                },
                "mf:mf": {
                    atkFumble: false,
                    defFumble: false,
                    atkStumble: false,
                    defStumble: false,
                    dta: false,
                    block: true,
                    atkDice: 0,
                    defDice: 0,
                },
                "ms:mf": {
                    atkFumble: false,
                    defFumble: false,
                    atkStumble: false,
                    defStumble: false,
                    dta: false,
                    block: false,
                    miss: false,
                    atkDice: 2,
                    defDice: 0,
                },
                "cs:mf": {
                    atkFumble: false,
                    defFumble: false,
                    atkStumble: false,
                    defStumble: false,
                    dta: false,
                    block: false,
                    miss: false,
                    atkDice: 3,
                    defDice: 0,
                },

                "cf:ms": {
                    atkFumble: false,
                    defFumble: false,
                    atkStumble: false,
                    defStumble: false,
                    dta: false,
                    block: false,
                    miss: false,
                    atkDice: 0,
                    defDice: 2,
                },
                "mf:ms": {
                    atkFumble: false,
                    defFumble: false,
                    atkStumble: false,
                    defStumble: false,
                    dta: false,
                    block: false,
                    miss: false,
                    atkDice: 0,
                    defDice: 1,
                },
                "ms:ms": {
                    atkFumble: false,
                    defFumble: false,
                    atkStumble: false,
                    defStumble: false,
                    dta: false,
                    block: false,
                    miss: false,
                    atkDice: 1,
                    defDice: 1,
                },
                "cs:ms": {
                    atkFumble: false,
                    defFumble: false,
                    atkStumble: false,
                    defStumble: false,
                    dta: false,
                    block: false,
                    miss: false,
                    atkDice: 1,
                    defDice: 0,
                },

                "cf:cs": {
                    atkFumble: false,
                    defFumble: false,
                    atkStumble: false,
                    defStumble: false,
                    dta: false,
                    block: false,
                    miss: false,
                    atkDice: 0,
                    defDice: 3,
                },
                "mf:cs": {
                    atkFumble: false,
                    defFumble: false,
                    atkStumble: false,
                    defStumble: false,
                    dta: false,
                    block: false,
                    miss: false,
                    atkDice: 0,
                    defDice: 2,
                },
                "ms:cs": {
                    atkFumble: false,
                    defFumble: false,
                    atkStumble: false,
                    defStumble: false,
                    dta: false,
                    block: false,
                    miss: false,
                    atkDice: 0,
                    defDice: 1,
                },
                "cs:cs": {
                    atkFumble: false,
                    defFumble: false,
                    atkStumble: false,
                    defStumble: false,
                    dta: false,
                    block: false,
                    miss: false,
                    atkDice: 2,
                    defDice: 2,
                },
            },
            dodge: {
                "cf:cf": {
                    atkFumble: false,
                    defFumble: false,
                    atkStumble: true,
                    defStumble: true,
                    dta: false,
                    block: false,
                    miss: false,
                    atkDice: 0,
                    defDice: 0,
                },
                "mf:cf": {
                    atkFumble: false,
                    defFumble: false,
                    atkStumble: false,
                    defStumble: true,
                    dta: false,
                    block: false,
                    miss: false,
                    atkDice: 0,
                    defDice: 0,
                },
                "ms:cf": {
                    atkFumble: false,
                    defFumble: false,
                    atkStumble: false,
                    defStumble: false,
                    dta: false,
                    block: false,
                    miss: false,
                    atkDice: 2,
                    defDice: 0,
                },
                "cs:cf": {
                    atkFumble: false,
                    defFumble: false,
                    atkStumble: false,
                    defStumble: false,
                    dta: false,
                    block: false,
                    miss: false,
                    atkDice: 3,
                    defDice: 0,
                },

                "cf:mf": {
                    atkFumble: false,
                    defFumble: false,
                    atkStumble: true,
                    defStumble: false,
                    dta: false,
                    block: false,
                    miss: false,
                    atkDice: 0,
                    defDice: 0,
                },
                "mf:mf": {
                    atkFumble: false,
                    defFumble: false,
                    atkStumble: false,
                    defStumble: false,
                    dta: false,
                    block: false,
                    miss: true,
                    atkDice: 0,
                    defDice: 0,
                },
                "ms:mf": {
                    atkFumble: false,
                    defFumble: false,
                    atkStumble: false,
                    defStumble: false,
                    dta: false,
                    block: false,
                    miss: false,
                    atkDice: 1,
                    defDice: 0,
                },
                "cs:mf": {
                    atkFumble: false,
                    defFumble: false,
                    atkStumble: false,
                    defStumble: false,
                    dta: false,
                    block: false,
                    miss: false,
                    atkDice: 2,
                    defDice: 0,
                },

                "cf:ms": {
                    atkFumble: false,
                    defFumble: false,
                    atkStumble: false,
                    defStumble: false,
                    dta: true,
                    block: false,
                    miss: false,
                    atkDice: 0,
                    defDice: 0,
                },
                "mf:ms": {
                    atkFumble: false,
                    defFumble: false,
                    atkStumble: false,
                    defStumble: false,
                    dta: false,
                    block: false,
                    miss: true,
                    atkDice: 0,
                    defDice: 0,
                },
                "ms:ms": {
                    atkFumble: false,
                    defFumble: false,
                    atkStumble: false,
                    defStumble: false,
                    dta: false,
                    block: false,
                    miss: true,
                    atkDice: 0,
                    defDice: 0,
                },
                "cs:ms": {
                    atkFumble: false,
                    defFumble: false,
                    atkStumble: false,
                    defStumble: false,
                    dta: false,
                    block: false,
                    miss: false,
                    atkDice: 1,
                    defDice: 0,
                },

                "cf:cs": {
                    atkFumble: false,
                    defFumble: false,
                    atkStumble: false,
                    defStumble: false,
                    dta: true,
                    block: false,
                    miss: false,
                    atkDice: 0,
                    defDice: 0,
                },
                "mf:cs": {
                    atkFumble: false,
                    defFumble: false,
                    atkStumble: false,
                    defStumble: false,
                    dta: true,
                    block: false,
                    miss: false,
                    atkDice: 0,
                    defDice: 0,
                },
                "ms:cs": {
                    atkFumble: false,
                    defFumble: false,
                    atkStumble: false,
                    defStumble: false,
                    dta: false,
                    block: false,
                    miss: true,
                    atkDice: 0,
                    defDice: 0,
                },
                "cs:cs": {
                    atkFumble: false,
                    defFumble: false,
                    atkStumble: false,
                    defStumble: false,
                    dta: false,
                    block: false,
                    miss: true,
                    atkDice: 0,
                    defDice: 0,
                },
            },
            ignore: {
                cf: {
                    atkFumble: false,
                    defFumble: false,
                    atkStumble: false,
                    defStumble: false,
                    dta: true,
                    block: false,
                    miss: false,
                    atkDice: 0,
                    defDice: 0,
                },
                mf: {
                    atkFumble: false,
                    defFumble: false,
                    atkStumble: false,
                    defStumble: false,
                    dta: false,
                    block: false,
                    miss: false,
                    atkDice: 1,
                    defDice: 0,
                },
                ms: {
                    atkFumble: false,
                    defFumble: false,
                    atkStumble: false,
                    defStumble: false,
                    dta: false,
                    block: false,
                    miss: false,
                    atkDice: 3,
                    defDice: 0,
                },
                cs: {
                    atkFumble: false,
                    defFumble: false,
                    atkStumble: false,
                    defStumble: false,
                    dta: false,
                    block: false,
                    miss: false,
                    atkDice: 4,
                    defDice: 0,
                },
            },
        };
    }

    get intrinsicActions() {
        let actions = super.intrinsicActions
            .filter((a) => a.name !== "attack")
            .map((a) => {
                if (a.contextGroup === "default") {
                    a.contextGroup = "primary";
                }
                return a;
            });

        actions.push({
            functionName: "automatedAttack",
            name: "Automated Attack",
            contextIconClass: "fas fa-sword",
            contextCondition: (header) => {
                header = header instanceof HTMLElement ? header : header[0];
                const li = header.closest(".item");
                const item = fromUuidSync(li.dataset.uuid);
                return item && !item.system.$attack.disabled;
            },
            contextGroup: "default",
        });

        actions.sort((a, b) => a.contextGroup.localeCompare(b.contextGroup));
        return actions;
    }

    /**
     * Queries for the weapon to use, and additional weapon parameters (aim, aspect, range).
     *
     * options should include:
     * attackerName (String): The name of the attacker
     * defenderName (String): The name of the defender
     * type (string): either 'Block', 'Attack', or 'Counterstrike'
     * distance (number): the distance to the target
     *
     * The return value will be an object with the following keys:
     *  aim (string):       The aim location (High, Mid, Low)
     *  situationalModifier (number): Modifier to the attack roll (AML)
     *
     * @param {Object} options
     */
    async attackDialog(options) {
        let { type, sourceToken, targetToken, weaponItem } = options;
        const dlgOptions = {
            variant: "legendary",
            type,
            title: `${sourceToken.name} vs. ${targetToken.name} Melee Attack with ${this.name}`,
            weapon: weaponItem.name,
            startZone: 1,
            situationalModifier: 0,
            addlImpactModifier: 0,
            addlSuccessLevelMod: 0,
            impactMods: sohl.ImpactModifier.create(this.$impact),
            attackMods: sohl.MasteryLevelModifier.create(this.$attack),
            rollMode: game.settings.get("core", "rollMode"),
            rollModes: Object.entries(CONFIG.Dice.rollModes).map(([k, v]) => ({
                group: "CHAT.RollDefault",
                value: k,
                label: v,
            })),
        };

        const attackDialogTemplate =
            "systems/hmk/templates/dialog/attack-dialog.html";
        const dlghtml = await renderTemplate(attackDialogTemplate, dlgOptions);

        // Request weapon details
        return await Dialog.prompt({
            title: dlgOptions.title,
            content: dlghtml.trim(),
            label: options.type,
            callback: (html) => {
                const form = html[0].querySelector("form");
                const situationalModifier =
                    Number.parseInt(form.situationalModifier.value, 10) || 0;
                const addlImpactModifier =
                    Number.parseInt(form.addlImpactModifier.value, 10) || 0;
                const addlSuccessLevelMod =
                    Number.parseInt(form.addlSuccessLevelMod.value, 10) || 0;
                const rollMode = Number.parseInt(form.rollMode.value, 10) || 0;
                const startZone =
                    Number.parseInt(form.startZone.value, 10) || 0;
                const result = {
                    startZone,
                    impactMods: dlgOptions.impactMods,
                    attackMods: dlgOptions.attackMods,
                    rollMode,
                };
                if (situationalModifier) {
                    result.attackMods.add(
                        "Situational Modifier",
                        "SitMod",
                        situationalModifier,
                    );
                }
                if (addlImpactModifier) {
                    result.impactMods.add(
                        "Situational Modifier",
                        "SitMod",
                        addlImpactModifier,
                    );
                }
                if (addlSuccessLevelMod) {
                    result.attackMods.successLevelMod += addlSuccessLevelMod;
                }

                return result;
            },
        });
    }

    async blockTestResume(scope) {
        let { sourceTestResult, opposedTestResult } = scope;
        let targetTestResult = opposedTestResult?.targetTestResult;
        if (!targetTestResult) {
            targetTestResult = this.$defense.block.test({
                noChat: true,
                type: `${this.type}-${this.name}-block-test`,
                title: `${this.item.label} Block Test`,
            });
        }

        let victoryStars = LgndMasteryLevelModifier.calcVictoryStars(
            sourceTestResult,
            targetTestResult,
        );

        opposedTestResult = {
            sourceTestResult,
            targetTestResult,
            victoryStars,
            vsText: sohl.MasteryLevelItemData.victoryStarsText(victoryStars),
            sourceWins: victoryStars > 0,
            targetWins: victoryStars < 0,
        };

        return opposedTestResult;
    }

    async counterstrikeTestResume(scope) {
        let { sourceTestResult, opposedTestResult } = scope;
        let targetTestResult = opposedTestResult?.targetTestResult;
        if (!targetTestResult) {
            targetTestResult = this.$defense.block.test({
                noChat: true,
                type: `${this.type}-${this.name}-cx-test`,
                title: `${this.item.label} Counterstrike Test`,
            });
        }

        let victoryStars = LgndMasteryLevelModifier.calcVictoryStars(
            sourceTestResult,
            targetTestResult,
        );

        opposedTestResult = {
            sourceTestResult,
            targetTestResult,
            victoryStars,
            vsText: sohl.MasteryLevelItemData.victoryStarsText(victoryStars),
            sourceWins: victoryStars > 0,
            targetWins: victoryStars < 0,
        };

        return opposedTestResult;
    }

    /**
     * Continue the opposed test. Only valid testTypes are "block" and "counterstrike".
     *
     * @param {object} scope
     * @param {string} [scope.sourceTestResult]
     * @param {number} [scope.testType]
     * @returns {OpposedTestResult} result of the test
     */
    async opposedTestResume(speaker, actor, token, character, scope) {
        let { testType } = scope;
        ({ speaker, actor, token, character } =
            sohl.SohlMacro.getExecuteDefaults({
                speaker,
                actor,
                token,
                character,
                needsToken: true,
                self: this,
            }));

        let opposedTestResult;
        if (testType === "block") {
            opposedTestResult = await this.blockTestResume(scope);
        } else if (testType === "counterstrike") {
            opposedTestResult = await this.counterstrikeTestResume(scope);
        } else {
            throw new Error(`Invalid testType ${testType}`);
        }
        opposedTestResult.speaker = speaker;
        return await LgndMasteryLevelModifier.opposedTestToChat(
            speaker,
            actor,
            token,
            character,
            {
                speaker,
                opposedTestResult,
            },
        );
    }

    calcReachModifier(opponentDefStrikeMode, atkMod) {
        const opponentToken = opponentDefStrikeMode.nestedIn?.token;
        if (!opponentToken) {
            throw new Error(
                `Strike mode ${opponentDefStrikeMode.name} does not belong to a token`,
            );
        }

        let reachDiff = this.$reach - opponentDefStrikeMode.system.$reach;
        let reachPenalty = -Math.abs(reachDiff) * 5;
        const inClose =
            LgndUtility.rangeToTarget(this.actor.token, opponentToken) < 5;
        if (inClose) {
            if (reachDiff > 0) {
                // Attacker weapon reach is longer, penalty goes to attacker
                atkMod.add("In-Close Reach Penalty", "InClsRch", reachPenalty);
            } else {
                // Attacker weapon reach is shorter, thrust bonus goes to attacker
                if (this.$traits.thrust) {
                    atkMod.add(
                        "In-Close Thrust Bonus",
                        "InClsThr",
                        -reachPenalty,
                    );
                }
            }
        } else {
            if (reachDiff < 0) {
                // Attacker weapon reach is shorter, penalty goes to attacker
                atkMod.add("Reach Penalty", "Rch", reachPenalty);
            } else {
                // Attacker weapon reach is longer, thrust bonus goes to attacker
                if (this.$traits.thrust) {
                    atkMod.add("Thrust Bonus", "Thrust", -reachPenalty);
                }
            }
        }
        return atkMod;
    }

    async automatedAttack(
        speaker = null,
        actor = null,
        token = null,
        character = null,
        scope = {},
    ) {
        let { skipDialog = false } = scope;
        ({ speaker, actor, token, character } =
            sohl.SohlMacro.getExecuteDefaults({
                speaker,
                actor,
                token,
                character,
            }));

        if (!(this.item.nestedIn?.system instanceof sohl.WeaponGearItemData)) {
            ui.notification.warn(
                `Strike Mode ${this.name} must be nested in a weapon`,
            );
            return null;
        }

        const targetToken = sohl.Utility.getUserTargetedToken(token);
        if (!targetToken) return null;

        if (!token) {
            ui.notifications.warn(`No attacker token identified.`);
            return null;
        }

        if (!token.isOwner) {
            ui.notifications.warn(
                `You do not have permissions to perform this operation on ${token.name}`,
            );
            return null;
        }

        const targetRange = LgndUtility.rangeToTarget(token, targetToken);
        if (
            targetRange > LgndUtility.engagementZoneRange(this.$reach.effective)
        ) {
            const msg = `Target ${targetToken.name} is outside of engagement zone for ${this.name}; distance = ${targetRange} feet, EZ = ${LgndUtility.engagementZoneRange(this.$reach.effective)} feet.`;
            ui.notifications.warn(msg);
            return null;
        }

        // display dialog, get aspect, aim, and addl damage
        const dlgOptions = {
            type: "Attack",
            sourceToken: token,
            targetToken,
            weaponItem: this.item.nestedIn,
        };

        if (!dlgOptions.weaponItem.system.isHeld) {
            ui.notification.warn(
                `For ${token.name} ${dlgOptions.weaponItem.name} is not held.`,
            );
            return null;
        }

        let dialogResult;
        if (!skipDialog) {
            dialogResult = await this.attackDialog(dlgOptions);
        } else {
            dialogResult = {
                startZone: 1,
                impactMods: sohl.ImpactModifier.create(this.$impact),
                attackMods: sohl.MasteryLevelModifier.create(this.$attack),
                rollMode: game.settings.get("core", "rollMode"),
            };
        }

        // If user cancelled the dialog, then return immediately
        if (!dialogResult) return null;

        if (dialogResult.startZone !== 1) {
            dialogResult.attackMods.add("Chosen Start Zone", "ChZn", -10);
        }

        // Prepare for Chat Message
        const chatTemplate = "systems/sohl/templates/chat/attack-card.html";

        const chatTemplateData = {
            variant: "legendary",
            title: `${this.name} Melee Attack`,
            weaponType: "melee",
            sourceToken: token,
            targetToken,
            distance: targetRange,
            sourceItem: this,
            startZone: dialogResult.startZone,
            attackMods: dialogResult.attackMods,
            impactMods: dialogResult.impactMods,
            visibleActorUuid: targetToken.actor.uuid,
        };

        const html = await renderTemplate(chatTemplate, chatTemplateData);

        const messageData = {
            user: game.user.id,
            speaker: speaker,
            content: html.trim(),
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
        };

        ChatMessage.applyRollMode(messageData, dialogResult.rollMode);

        const messageOptions = {};

        // Create a chat message
        await ChatMessage.create(messageData, messageOptions);
        if (game.settings.get("sohl", "combatAudio")) {
            AudioHelper.play(
                { src: "sounds/drums.wav", autoplay: true, loop: false },
                true,
            );
        }

        return chatTemplateData;
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
        foundry.utils.mergeObject(this.$traits, {
            couched: false,
            noAttack: false,
            noBlock: false,
            slow: false,
            thrust: false,
            swung: false,
            halfSword: false,
            twoPartLen: 0,
        });
    }

    processSiblings() {
        super.processSiblings();

        const strength = this.actor.getTraitByAbbrev("str");
        if (strength) {
            const strValue = strength.system.$score?.effective || 0;
            const strImpactMod = LgndUtility.strImpactMod(strValue);
            if (strImpactMod && !this.$traits.noStrMod) {
                this.$impact.add(
                    "Strength Impact Modifier",
                    "StrImpMod",
                    strImpactMod,
                );
            }
        }

        if (this.actor.system.$engagedOpponents.effective > 1) {
            const outnumberedPenalty =
                this.actor.system.$engagedOpponents.effective * -10;
            this.$defense.block.add("Outnumbered", "Outn", outnumberedPenalty);
            this.$defense.counterstrike.add(
                "Outnumbered",
                "Outn",
                outnumberedPenalty,
            );
        }
    }
}

class LgndMissileWeaponStrikeModeItemData extends LgndStrikeModeItemDataMixin(
    sohl.MissileWeaponStrikeModeItemData,
) {
    $baseRange;
    $draw;
    $canDraw;
    $pull;

    static get tactialAdvantages() {
        return foundry.utils.mergeObject(
            super.tacticalAdvantages,
            {
                setup: "Setup",
            },
            { inplace: false },
        );
    }

    static get ranges() {
        return {
            pb: "PB",
            direct: "Direct",
            v2: "V2",
            v3: "V3",
            v4: "V4",
        };
    }

    get maxVolleyMult() {
        return this.item.getFlag("sohl", "legendary.maxVolleyMult") || 0;
    }

    get baseRangeBase() {
        return this.item.getFlag("sohl", "legendary.baseRangeBase") || 0;
    }

    get drawBase() {
        return this.item.getFlag("sohl", "legendary.drawBase") || 0;
    }

    get zoneDie() {
        return (
            this.item.nestedIn?.getFlag("sohl", "legendary.zoneDie") ||
            this.item.getFlag("sohl", "legendary.zoneDie") ||
            0
        );
    }

    static get combatTable() {
        return {
            block: {
                "cf:cf": { wild: true, block: false, miss: false, atkDice: 0 },
                "mf:cf": { wild: false, block: false, miss: true, atkDice: 0 },
                "ms:cf": { wild: false, block: false, miss: false, atkDice: 2 },
                "cs:cf": { wild: false, block: false, miss: false, atkDice: 3 },

                "cf:mf": { wild: true, block: false, miss: false, atkDice: 0 },
                "mf:mf": { wild: false, block: false, miss: true, atkDice: 0 },
                "ms:mf": { wild: false, block: false, miss: false, atkDice: 1 },
                "cs:mf": { wild: false, block: false, miss: false, atkDice: 2 },

                "cf:ms": { wild: true, block: false, miss: false, atkDice: 0 },
                "mf:ms": { wild: false, block: false, miss: true, atkDice: 0 },
                "ms:ms": { wild: false, block: true, miss: false, atkDice: 0 },
                "cs:ms": { wild: false, block: false, miss: false, atkDice: 1 },

                "cf:cs": { wild: true, block: false, miss: false, atkDice: 0 },
                "mf:cs": { wild: false, block: false, miss: true, atkDice: 0 },
                "ms:cs": { wild: false, block: true, miss: false, atkDice: 0 },
                "cs:cs": { wild: false, block: true, miss: false, atkDice: 0 },
            },
            dodge: {
                "cf:cf": { wild: true, block: false, miss: false, atkDice: 0 },
                "mf:cf": { wild: false, block: false, miss: true, atkDice: 0 },
                "ms:cf": { wild: false, block: false, miss: false, atkDice: 2 },
                "cs:cf": { wild: false, block: false, miss: false, atkDice: 3 },

                "cf:mf": { wild: true, block: false, miss: false, atkDice: 0 },
                "mf:mf": { wild: false, block: false, miss: true, atkDice: 0 },
                "ms:mf": { wild: false, block: false, miss: false, atkDice: 1 },
                "cs:mf": { wild: false, block: false, miss: false, atkDice: 2 },

                "cf:ms": { wild: true, block: false, miss: false, atkDice: 0 },
                "mf:ms": { wild: false, block: false, miss: true, atkDice: 0 },
                "ms:ms": { wild: false, block: false, miss: true, atkDice: 0 },
                "cs:ms": { wild: false, block: false, miss: false, atkDice: 1 },

                "cf:cs": { wild: true, block: false, miss: false, atkDice: 0 },
                "mf:cs": { wild: false, block: false, miss: true, atkDice: 0 },
                "ms:cs": { wild: false, block: false, miss: true, atkDice: 0 },
                "cs:cs": { wild: false, block: false, miss: true, atkDice: 0 },
            },
            ignore: {
                cf: { wild: true, block: false, miss: false, atkDice: 0 },
                mf: { wild: false, block: false, miss: true, atkDice: 0 },
                ms: { wild: false, block: false, miss: false, atkDice: 2 },
                cs: { wild: false, block: false, miss: false, atkDice: 3 },
            },
        };
    }

    get intrinsicActions() {
        let actions = super.intrinsicActions
            .filter((a) => a.name !== "attack")
            .map((a) => {
                if (a.contextGroup === "default") {
                    a.contextGroup = "primary";
                }
                return a;
            });

        actions.push(
            {
                functionName: "automatedAttack",
                name: "Automated Attack",
                contextIconClass: "fas fa-bow-arrow",
                contextCondition: (header) => {
                    header = header instanceof HTMLElement ? header : header[0];
                    const li = header.closest(".item");
                    const item = fromUuidSync(li.dataset.uuid);
                    return item && !item.system.$attack.disabled;
                },
                contextGroup: "default",
            },
            {
                functionName: "directAttackTest",
                name: "Direct Attack Test",
                contextIconClass: "fas fa-location-arrow-up fa-rotate-90",
                contextCondition: (header) => {
                    header = header instanceof HTMLElement ? header : header[0];
                    const li = header.closest(".item");
                    const item = fromUuidSync(li.dataset.uuid);
                    return item && !item.system.$attack.disabled;
                },
                contextGroup: "primary",
            },
            {
                functionName: "volleyAttackTest",
                name: "Volley Attack Test",
                contextIconClass: "fas fa-location-arrow",
                contextCondition: (header) => {
                    header = header instanceof HTMLElement ? header : header[0];
                    const li = header.closest(".item");
                    const item = fromUuidSync(li.dataset.uuid);
                    return item && !item.system.$attack.disabled;
                },
                contextGroup: "primary",
            },
        );

        actions.sort((a, b) => a.contextGroup.localeCompare(b.contextGroup));
        return actions;
    }

    async automatedAttack(
        speaker = null,
        actor = null,
        token = null,
        character = null,
        {
            skipDialog = false,
            noChat = false,
            type = `${this.type}-${this.name}-bleed-stop-test`,
            title = `${this.item.label} Bleeding Stoppage Test`,
            // biome-ignore lint/correctness/noUnusedVariables: <explanation>
            ...scope
        },
    ) {
        ({ speaker, actor, token, character } =
            sohl.SohlMacro.getExecuteDefaults({
                speaker,
                actor,
                token,
                character,
            }));

        // TODO - Missile Automated Attack
        ui.notifications.warn("Missile Automated Attack Not Implemented");
    }

    volleyAttack(
        speaker = null,
        actor = null,
        token = null,
        character = null,
        {
            skipDialog = false,
            noChat = false,
            type = `${this.type}-${this.name}-volley-attack`,
            title = `${this.item.label} Volley Attack`,
            // biome-ignore lint/correctness/noUnusedVariables: <explanation>
            ...scope
        },
    ) {
        ({ speaker, actor, token, character } =
            sohl.SohlMacro.getExecuteDefaults({
                speaker,
                actor,
                token,
                character,
            }));

        // TODO - Missile Volley Attack
        ui.notifications.warn("Missile Volley Attack Not Implemented");
    }

    directAttack(
        speaker = null,
        actor = null,
        token = null,
        character = null,
        {
            skipDialog = false,
            noChat = false,
            type = `${this.type}-${this.name}-direct-missile-attack`,
            title = `${this.item.label} Direct Missile Attack`,
            // biome-ignore lint/correctness/noUnusedVariables: <explanation>
            ...scope
        },
    ) {
        ({ speaker, actor, token, character } =
            sohl.SohlMacro.getExecuteDefaults({
                speaker,
                actor,
                token,
                character,
            }));

        // TODO - Missile Direct Attack
        ui.notifications.warn("Missile Direct Attack Not Implemented");
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
        foundry.utils.mergeObject(this.$traits, {
            armorReduction: 0,
            bleed: false,
        });
        this.$maxVolleyMult = new sohl.ValueModifier(this).setBase(
            this.maxVolleyMult,
        );
        this.$baseRange = new sohl.ValueModifier(this).setBase(
            this.baseRangeBase,
        );
        this.$draw = new sohl.ValueModifier(this).setBase(this.drawBase);
        this.$pull = new sohl.ValueModifier(this);
    }

    postProcess() {
        super.postProcess();
        const strength = this.actor.getTraitByAbbrev("str");
        if (strength) {
            const strML = strength.system.$masteryLevel?.effective || 0;
            this.$pull.add("Strength ML", "StrML", strML);
        }
        if (this.$assocSkill) {
            this.$pull.add(
                `${this.$assocSkill.name}`,
                "AssocSkill",
                this.$assocSkill.system.$masteryLevel.effective,
            );
        }

        this.$canDraw =
            !this.$pull.disabled &&
            this.$pull.effective >= this.$draw.effective;
        this.$attack.disabled ||= !this.$canDraw;
    }
}

class LgndCombatTechniqueStrikeModeItemData extends LgndStrikeModeItemDataMixin(
    sohl.CombatTechniqueStrikeModeItemData,
) {
    static get effectKeys() {
        return sohl.Utility.simpleMerge(super.effectKeys, {
            "system.$traits.strRoll": {
                label: "Strength Roll",
                abbrev: "StrRoll",
            },
        });
    }

    get intrinsicActions() {
        let actions = super.intrinsicActions
            .filter((a) => a.name !== "attack")
            .map((a) => {
                if (a.contextGroup === "default") {
                    a.contextGroup = "primary";
                }
                return a;
            });

        actions.push({
            functionName: "assistedAttack",
            name: "Automated Attack",
            contextIconClass: "fas fa-hand-fist fa-rotate-90",
            contextCondition: (header) => {
                header = header instanceof HTMLElement ? header : header[0];
                const li = header.closest(".item");
                const item = fromUuidSync(li.dataset.uuid);
                return item && !item.system.$attack.disabled;
            },
            contextGroup: "default",
        });

        actions.sort((a, b) => a.contextGroup.localeCompare(b.contextGroup));
        return actions;
    }

    async automatedAttack(
        speaker = null,
        actor = null,
        token = null,
        character = null,
        {
            skipDialog = false,
            noChat = false,
            type = `${this.type}-${this.name}-bleed-stop-test`,
            title = `${this.item.label} Bleeding Stoppage Test`,
            // biome-ignore lint/correctness/noUnusedVariables: <explanation>
            ...scope
        },
    ) {
        ({ speaker, actor, token, character } =
            sohl.SohlMacro.getExecuteDefaults({
                speaker,
                actor,
                token,
                character,
            }));

        // TODO - Combat Technique Automated Attack
        ui.notifications.warn(
            "Combat Technique Automated Attack Not Implemented",
        );
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
        foundry.utils.mergeObject(this.$traits, {
            strRoll: false,
        });
    }

    processSiblings() {
        super.processSiblings();
        const strength = this.actor.getTraitByAbbrev("str");
        if (strength) {
            const strValue = strength.system.$score?.effective || 0;
            const strImpactMod = LgndUtility.strImpactMod(strValue);
            if (strImpactMod && !this.$traits.noStrMod) {
                this.$impact.add(
                    "Strength Impact Modifier",
                    "StrImpMod",
                    strImpactMod,
                );
            }
        }
    }
}

/*===============================================================*/
/*      Legendary Data Model Classes                                   */
/*===============================================================*/

function LgndMasteryLevelItemDataMixin(BaseMLID) {
    return class LgndMasteryLevelItemData extends BaseMLID {
        get isFateAllowed() {
            return (
                super.isFateAllowed &&
                !this.actor.system.$hasAuralShock &&
                !this.skillBaseFormula?.includes("@aur")
            );
        }

        /** @override */
        applyPenalties() {
            // Apply Encumbrance Penalty to Mastery Level
            const sbAttrs = this.skillBase.attributes;
            if (sbAttrs.at(0) === "Agility") {
                const enc = this.actor.system.$encumbrance.total;
                if (enc) this.$masteryLevel.add("Encumbrance", "Enc", -enc);
            }
        }

        prepareBaseData() {
            super.prepareBaseData();
            this.$masteryLevel &&= LgndMasteryLevelModifier.create(
                this.$masteryLevel,
                { parent: this },
            );
        }
    };
}

class LgndDomainItemData extends sohl.DomainItemData {}

class LgndInjuryItemData extends sohl.InjuryItemData {
    static get aspectTypes() {
        return {
            blunt: "Blunt",
            edged: "Edged",
            piercing: "Piercing",
            fire: "Fire",
            frost: "Frost",
            projectile: "Projectile",
        };
    }

    get treatments() {
        return {
            blunt: {
                M: {
                    treatment: "Compress",
                    mod: {
                        name: "Treatment Bonus",
                        abbrev: "TrtBns",
                        value: 30,
                    },
                    useDexMod: false,
                    cf: {
                        hr: 4,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                    mf: {
                        hr: 5,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                    ms: {
                        hr: 6,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                    cs: {
                        hr: -1,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                },
                S: {
                    treatment: "Set & Splint",
                    mod: {
                        name: "Treatment Bonus",
                        abbrev: "TrtBns",
                        value: 10,
                    },
                    useDexMod: false,
                    cf: {
                        hr: 3,
                        infect: false,
                        impair: true,
                        bleed: false,
                        newInj: -1,
                    },
                    mf: {
                        hr: 4,
                        infect: false,
                        impair: true,
                        bleed: false,
                        newInj: -1,
                    },
                    ms: {
                        hr: 5,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                    cs: {
                        hr: 6,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                },
                G: {
                    treatment: "Clean, Dress & Surgery",
                    mod: null,
                    useDexMod: true,
                    cf: {
                        hr: 2,
                        infect: true,
                        impair: true,
                        bleed: false,
                        newInj: -1,
                    },
                    mf: {
                        hr: 3,
                        infect: false,
                        impair: true,
                        bleed: false,
                        newInj: -1,
                    },
                    ms: {
                        hr: 4,
                        infect: false,
                        impair: true,
                        bleed: false,
                        newInj: -1,
                    },
                    cs: {
                        hr: 5,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                },
            },
            piercing: {
                M: {
                    treatment: "Clean & Dress",
                    mod: {
                        name: "Treatment Bonus",
                        abbrev: "TrtBns",
                        value: 10,
                    },
                    useDexMod: false,
                    cf: {
                        hr: 4,
                        infect: true,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                    mf: {
                        hr: 5,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                    ms: {
                        hr: 6,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                    cs: {
                        hr: -1,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                },
                S: {
                    treatment: "Clean & Dress",
                    mod: null,
                    useDexMod: false,
                    cf: {
                        hr: 3,
                        infect: true,
                        impair: true,
                        bleed: false,
                        newInj: -1,
                    },
                    mf: {
                        hr: 4,
                        infect: true,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                    ms: {
                        hr: 5,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                    cs: {
                        hr: 6,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                },
                G: {
                    treatment: "Clean, Dress & Surgery",
                    mod: {
                        name: "Treatment Penalty",
                        abbrev: "TrtBns",
                        value: -10,
                    },
                    useDexMod: true,
                    cf: {
                        hr: 2,
                        infect: true,
                        impair: true,
                        bleed: false,
                        newInj: -1,
                    },
                    mf: {
                        hr: 3,
                        infect: true,
                        impair: true,
                        bleed: false,
                        newInj: -1,
                    },
                    ms: {
                        hr: 4,
                        infect: true,
                        impair: true,
                        bleed: false,
                        newInj: -1,
                    },
                    cs: {
                        hr: 5,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                },
            },
            edged: {
                M: {
                    treatment: "Clean & Dress",
                    mod: {
                        name: "Treatment Bonus",
                        abbrev: "TrtBns",
                        value: 20,
                    },
                    useDexMod: false,
                    cf: {
                        hr: 4,
                        infect: true,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                    mf: {
                        hr: 5,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                    ms: {
                        hr: 6,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                    cs: {
                        hr: -1,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                },
                S: {
                    treatment: "Clean & Dress",
                    mod: {
                        name: "Treatment Bonus",
                        abbrev: "TrtBns",
                        value: 10,
                    },
                    useDexMod: false,
                    cf: {
                        hr: 3,
                        infect: true,
                        impair: true,
                        bleed: false,
                        newInj: -1,
                    },
                    mf: {
                        hr: 4,
                        infect: true,
                        impair: true,
                        bleed: false,
                        newInj: -1,
                    },
                    ms: {
                        hr: 5,
                        infect: false,
                        impair: true,
                        bleed: false,
                        newInj: -1,
                    },
                    cs: {
                        hr: 6,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                },
                G: {
                    treatment: "Clean, Dress & Surgery",
                    mod: null,
                    useDexMod: true,
                    cf: {
                        hr: 2,
                        infect: true,
                        impair: true,
                        bleed: false,
                        newInj: -1,
                    },
                    mf: {
                        hr: 3,
                        infect: true,
                        impair: true,
                        bleed: false,
                        newInj: -1,
                    },
                    ms: {
                        hr: 4,
                        infect: true,
                        impair: true,
                        bleed: false,
                        newInj: -1,
                    },
                    cs: {
                        hr: 5,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                },
            },
            projectile: {
                M: {
                    treatment: "Clean & Dress",
                    mod: {
                        name: "Treatment Bonus",
                        abbrev: "TrtBns",
                        value: 10,
                    },
                    useDexMod: false,
                    cf: {
                        hr: 4,
                        infect: true,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                    mf: {
                        hr: 5,
                        infect: false,
                        impair: false,
                        bleed: false,
                    },
                    newInj: -1,
                    ms: {
                        hr: 6,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                    cs: {
                        hr: -1,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                },
                S: {
                    treatment: "Extract Projectile",
                    mod: null,
                    useDexMod: true,
                    cf: { hr: 3, infect: true, impair: true, bleed: false },
                    newInj: -1,
                    mf: {
                        hr: 4,
                        infect: true,
                        impair: true,
                        bleed: false,
                        newInj: -1,
                    },
                    ms: {
                        hr: 5,
                        infect: true,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                    cs: {
                        hr: 6,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                },
                G: {
                    treatment: "Extract Projectile",
                    mod: {
                        name: "Treatment Penalty",
                        abbrev: "TrtBns",
                        value: -10,
                    },
                    useDexMod: true,
                    cf: {
                        hr: 2,
                        infect: true,
                        impair: true,
                        bleed: false,
                        newInj: -1,
                    },
                    mf: {
                        hr: 3,
                        infect: true,
                        impair: true,
                        bleed: false,
                        newInj: -1,
                    },
                    ms: {
                        hr: 4,
                        infect: true,
                        impair: true,
                        bleed: false,
                        newInj: -1,
                    },
                    cs: {
                        hr: 5,
                        infect: true,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                },
            },
            fire: {
                M: {
                    treatment: "Compress",
                    mod: {
                        name: "Treatment Bonus",
                        abbrev: "TrtBns",
                        value: 20,
                    },
                    useDexMod: false,
                    cf: {
                        hr: 4,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                    mf: {
                        hr: 5,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                    ms: {
                        hr: 6,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                    cs: {
                        hr: -1,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                },
                S: {
                    treatment: "Clean & Dress",
                    mod: {
                        name: "Treatment Bonus",
                        abbrev: "TrtBns",
                        value: 10,
                    },
                    useDexMod: false,
                    cf: {
                        hr: 3,
                        infect: true,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                    mf: {
                        hr: 4,
                        infect: true,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                    ms: {
                        hr: 5,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                    cs: {
                        hr: 6,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                },
                G: {
                    treatment: "Clean & Dress",
                    mod: null,
                    useDexMod: false,
                    cf: {
                        hr: 2,
                        infect: true,
                        impair: true,
                        bleed: false,
                        newInj: -1,
                    },
                    mf: {
                        hr: 3,
                        infect: true,
                        impair: true,
                        bleed: false,
                        newInj: -1,
                    },
                    ms: {
                        hr: 4,
                        infect: true,
                        impair: true,
                        bleed: false,
                        newInj: -1,
                    },
                    cs: {
                        hr: 5,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                },
            },
            frost: {
                M: {
                    treatment: "Warm",
                    mod: {
                        name: "Treatment Bonus",
                        abbrev: "TrtBns",
                        value: 40,
                    },
                    useDexMod: false,
                    cf: {
                        hr: 4,
                        infect: false,
                        impair: false,
                        bleed: false,
                    },
                    mf: {
                        hr: 5,
                        infect: false,
                        impair: false,
                        bleed: false,
                    },
                    ms: {
                        hr: -1,
                        infect: false,
                        impair: false,
                        bleed: false,
                    },
                    cs: {
                        hr: -1,
                        infect: false,
                        impair: false,
                        bleed: false,
                    },
                },
                S: {
                    treatment: "Warm",
                    mod: {
                        name: "Treatment Bonus",
                        abbrev: "TrtBns",
                        value: 20,
                    },
                    useDexMod: false,
                    cf: {
                        hr: 3,
                        infect: false,
                        impair: true,
                        bleed: false,
                        newInj: -1,
                    },
                    mf: {
                        hr: 4,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                    ms: {
                        hr: 5,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                    cs: {
                        hr: 6,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                },
                G: {
                    treatment: "Surgery & Amputate",
                    mod: null,
                    useDexMod: true,
                    cf: {
                        hr: -1,
                        infect: true,
                        impair: false,
                        bleed: true,
                        newInj: 5,
                    },
                    mf: {
                        hr: -1,
                        infect: false,
                        impair: false,
                        bleed: true,
                        newInj: 4,
                    },
                    ms: {
                        hr: -1,
                        infect: false,
                        impair: false,
                        bleed: true,
                        newInj: 3,
                    },
                    cs: {
                        hr: -1,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: 2,
                    },
                },
            },
        };
    }

    static calcZoneDieFormula(die, offset) {
        const result =
            (die ? "d" + die + (offset < 0 ? "" : "+") : "") + offset;
        return result;
    }

    get isBarbed() {
        return this.item.getFlag("sohl", "legendary.isBarbed");
    }

    set isBarbed(val) {
        this.item.setFlag("sohl", "legendary.isBarbed", !!val);
    }

    get isGlancing() {
        return this.item.getFlag("sohl", "legendary.isGlancing");
    }

    set isGlancing(val) {
        this.item.setFlag("sohl", "legendary.isGlancing", !!val);
    }

    get extraBleedRisk() {
        return this.item.getFlag("sohl", "legendary.extraBleedRisk");
    }

    set extraBleedRisk(val) {
        this.item.setFlag("sohl", "legendary.extraBleedRisk", !!val);
    }

    get permanentImpairment() {
        return this.item.getFlag("sohl", "legendary.permanentImpairment");
    }

    set permanentImpairment(val) {
        if (typeof val === "number") {
            val = Math.max(0, val);
            this.item.setFlag("sohl", "legendary.permanentImpairment", val);
        }
    }

    get untreatedHealing() {
        let treatmt = {
            hr: 5,
            infect: true,
            impair: false,
            bleed: false,
            newInj: -1,
        };

        const treatSev = this.$injuryLevel?.severity;
        if (treatSev) {
            if (treatSev !== "0") {
                const cf =
                    this.constructor.treatments[this.aspect]?.[treatSev]?.[
                        "cf"
                    ];
                if (typeof cf === "object") treatmt = cf;
            } else {
                treatmt = {
                    hr: 6,
                    infect: false,
                    impair: false,
                    bleed: false,
                    newInj: -1,
                };
            }
        }
        return treatmt;
    }

    prepareBaseData() {
        super.prepareBaseData();
        const newIL = new sohl.ValueModifier(this, {
            severity: (thisVM) => {
                let severity;
                if (thisVM.effective <= 0) {
                    severity = "0";
                } else if (thisVM.effective == 1) {
                    severity = "M1";
                } else if (thisVM.effective <= 3) {
                    severity = `S${thisVM.effective}`;
                } else {
                    severity = `G${thisVM.effective}`;
                }
                return severity;
            },
        });
        this.$injuryLevel = newIL.addVM(this.$injuryLevel, {
            includeBase: true,
        });
    }
    /** @override */
    postProcess() {
        super.postProcess();
        if (!this.isInEffect) return;

        // Apply this injury as impairment to bodylocations
        const blItem = this.actor.items.find(
            (it) =>
                it.system instanceof sohl.BodyLocationItemData &&
                it.name === this.bodyLocation,
        );
        if (blItem) {
            const blData = blItem.system;
            if (this.injuryLevel.effective > 3) {
                blData.impairment.setProperty("unusable", true);
                blData.impairment.set(
                    `${this.item.name} Grevious Injury: Unusable`,
                    "GInjUnusable",
                    0,
                );
            } else if (this.injuryLevel.effective > 1) {
                blData.impairment.add(
                    `${this.item.name} Serious Injury`,
                    "SInj",
                    -10,
                );
            } else if (
                this.injuryLevel.effective > 0 &&
                this.healingRate.effective < 6 &&
                this.isInEffect
            ) {
                blData.impairment.add(
                    `${this.item.name} Minor Injury`,
                    "MInj",
                    -5,
                );
            }
        }

        //        const injuryDurationDays = Math.trunc((game.time.worldTime - this.item.system.createdTime) / 86400);
        if (this.alData.mayBePermanent) {
            //const permanentImpairment = Math.min(25, Math.trunc(injuryDurationDays / 20) * 5);
            // TODO - Permanent Injury
        }
    }
}

class LgndMysticalAbilityItemData extends LgndMasteryLevelItemDataMixin(
    sohl.MysticalAbilityItemData,
) {}

class LgndTraitItemData extends sohl.TraitItemData {
    get actionBodyParts() {
        return this.item.getFlag("sohl", "legendary.actionBodyParts") || [];
    }

    get diceFormula() {
        return this.item.getFlag("sohl", "legendary.diceFormula");
    }

    prepareBaseData() {
        super.prepareBaseData();
        this.$masteryLevel &&= LgndMasteryLevelModifier.create(
            this.$masteryLevel,
            {
                parent: this,
            },
        );
        if (this.abbrev === "fate") {
            this.$masteryLevel.setBase(this.$score.base);
        }
    }

    /**
     * Complete the opposed test.
     *
     * @param {object} scope
     * @param {string} [scope.sourceTestResult]
     * @param {number} [scope.testType]
     * @returns {OpposedTestResult} result of the test
     */
    async opposedTestResume(speaker, actor, token, character, scope) {
        let { sourceTestResult, targetTestResult } = scope;

        ({ speaker, actor, token, character } =
            sohl.SohlMacro.getExecuteDefaults({
                speaker,
                actor,
                token,
                character,
                needsToken: true,
                self: this,
            }));

        let opposedTestResult;
        if (this.intensity !== "attribute") {
            let victoryStars = Math.max(sourceTestResult.successLevel, 0);
            opposedTestResult = {
                sourceTestResult,
                targetTestResult,
                victoryStars: victoryStars,
                vsText: sohl.MasteryLevelItemData.victoryStarsText(
                    victoryStars,
                ),
                sourceWins: victoryStars > 0,
                targetWins: false,
            };
        } else {
            if (!targetTestResult) {
                // Roll for the target
                targetTestResult = await this.$masteryLevel.test({
                    type: "target-opposed-test",
                });
            }

            const victoryStars = sohl.MasteryLevelItemData.calcVictoryStars(
                sourceTestResult,
                targetTestResult,
            );

            opposedTestResult = {
                sourceTestResult,
                targetTestResult,
                victoryStars,
                vsText: sohl.MasteryLevelItemData.victoryStarsText(
                    victoryStars,
                ),
                sourceWins: victoryStars > 0,
                targetWins: victoryStars < 0,
            };
        }

        return await LgndMasteryLevelModifier.opposedTestToChat(
            speaker,
            actor,
            token,
            character,
            {
                speaker,
                opposedTestResult,
            },
        );
    }

    processSiblings() {
        super.processSiblings();
        if (this.isNumeric) {
            this.actionBodyParts.forEach((bp) => {
                for (const it in this.actor.allItems()) {
                    if (
                        it.system instanceof sohl.BodyPartItemData &&
                        it.name === bp
                    ) {
                        if (it.system.$impairment.unusable) {
                            this.$masteryLevel.set(
                                `${this.item.name} Unusable`,
                                `${this.abbrev}Unusable`,
                                0,
                            );
                        } else if (it.system.$impairment.value) {
                            this.$masteryLevel.add(
                                `${this.item.name} Impairment`,
                                `${this.abbrev}Imp`,
                                it.system.$impairment.value,
                            );
                        }
                        break;
                    }
                }
            });
        }

        if (this.intensity === "attribute" && this.subType === "physique") {
            for (const it of this.actor.allItems()) {
                if (
                    it.system instanceof sohl.AfflictionItemData &&
                    it.system.subType === "fatigue"
                ) {
                    this.$masteryLevel.add(
                        it.name,
                        it.system.constructor.subTypeAbbreviation[
                            it.system.subType
                        ],
                        -it.system.$level.effective,
                    );
                }
            }
        }

        if (this.abbrev === "fate") {
            const aura = this.actor.getTraitByAbbrev("aur");
            if (aura) {
                this.$masteryLevel.add(
                    "Aura Secondary Modifier",
                    "AuraSM",
                    aura.system.$masteryLevel.secMod,
                );
            }
        }
    }
}

class LgndSkillItemData extends LgndMasteryLevelItemDataMixin(
    sohl.SkillItemData,
) {
    get actionBodyParts() {
        return this.item.getFlag("sohl", "legendary.actionBodyParts") || [];
    }

    get initSM() {
        return this.item.getFlag("sohl", "legendary.initSM") || 0;
    }

    static get sunsignTypes() {
        return {
            social: "water",
            nature: "earth",
            craft: "metal",
            lore: "aura",
            language: "aura",
            script: "aura",
            ritual: "aura",
            physical: "air",
            combat: "fire",
            esoteric: null,
        };
    }

    /**
     * Complete the opposed test.
     *
     * @param {object} scope
     * @param {string} [scope.sourceTestResult]
     * @param {number} [scope.testType]
     * @returns {OpposedTestResult} result of the test
     */
    async opposedTestResume(speaker, actor, token, character, scope) {
        let { sourceTestResult, targetTestResult } = scope;

        ({ speaker, actor, token, character } =
            sohl.SohlMacro.getExecuteDefaults({
                speaker,
                actor,
                token,
                character,
                needsToken: true,
                self: this,
            }));

        if (!targetTestResult) {
            // Roll for the target
            targetTestResult = await this.$masteryLevel.test({
                type: "target-opposed-test",
            });
        }

        const victoryStars = sohl.MasteryLevelItemData.calcVictoryStars(
            sourceTestResult,
            targetTestResult,
        );

        const opposedTestResult = {
            sourceTestResult,
            targetTestResult,
            victoryStars,
            vsText: sohl.MasteryLevelItemData.victoryStarsText(victoryStars),
            sourceWins: victoryStars > 0,
            targetWins: victoryStars < 0,
        };

        return await LgndMasteryLevelModifier.opposedTestToChat(
            speaker,
            actor,
            token,
            character,
            {
                speaker,
                opposedTestResult,
            },
        );
    }

    processSiblings() {
        super.processSiblings();
        this.actionBodyParts.forEach((bp) => {
            for (const it of this.actor.allItems()) {
                if (
                    it.system instanceof sohl.BodyPartItemData &&
                    it.name === bp
                ) {
                    if (it.system.$impairment.unusable) {
                        this.$masteryLevel.set(
                            `${this.item.name} Unusable`,
                            `${this.abbrev}Unusable`,
                            0,
                        );
                    } else if (it.system.$impairment.value) {
                        this.$masteryLevel.add(
                            `${this.item.name} Impairment`,
                            `${this.abbrev}Imp`,
                            it.system.$impairment.value,
                        );
                    }
                    break;
                }
            }
        });

        if (["craft", "combat", "physical"].includes(this.subType)) {
            for (const it of this.actor.allItems()) {
                if (
                    it.system instanceof sohl.AfflictionItemData &&
                    it.system.subType === "fatigue"
                ) {
                    this.$masteryLevel.add(
                        it.name,
                        it.system.constructor.subTypeAbbreviation[
                            it.system.subType
                        ],
                        -it.system.$level.effective,
                    );
                }
            }
        }
    }
}

class LgndAfflictionItemData extends sohl.AfflictionItemData {
    /** @override */
    setupVirtualItems() {
        super.setupVirtualItems();
        if (["privation", "infection"].includes(this.subType)) {
            let weakness = 0;
            if (this.$healingRate.effective <= 2) {
                weakness = 10;
            } else if (this.$healingRate.effective <= 4) {
                weakness = 5;
            }
            if (weakness) {
                this.item.constructor.create(
                    {
                        name: `${this.item.name} Fatigue`,
                        type: sohl.AfflictionItemData.typeName,
                        "system.subType": "weakness",
                        "system.fatigueBase": weakness,
                    },
                    { cause: this.item, parent: this.actor },
                );
            }
        }
    }
}

class LgndAnatomyItemData extends sohl.AnatomyItemData {
    $maxZones;

    prepareBaseData() {
        super.prepareBaseData();
        this.$maxZones = 0;
    }
}

class LgndBodyZoneItemData extends sohl.BodyZoneItemData {
    $bodyZoneProbSum;

    // List of possible dice for Zone Dice.
    static get dice() {
        return {
            0: "None",
            1: "d1",
            2: "d2",
            3: "d3",
            4: "d4",
            5: "d5",
            6: "d6",
            8: "d8",
            10: "d10",
            12: "d12",
            16: "d16",
            20: "d20",
            24: "d24",
            32: "d32",
            40: "d40",
            48: "d48",
        };
    }

    get zoneNumbers() {
        return this.item.getFlag("sohl", "legendary.zones") || [];
    }

    set zoneNumbers(zones) {
        let result = [];
        if (Array.isArray(zones)) {
            result = zones;
        } else if (typeof zones === "string") {
            result = zones.split(/.*,.*/).reduce((ary, zone) => {
                const num = Number.parseInt(zone, 10);
                if (!Number.isNaN(num) && !ary.includes(num)) ary.push(num);
            }, result);
        } else {
            throw new Error(`Invalid zones '${zones}'`);
        }
        result.sort((a, b) => a - b);
        this.item.setFlag("sohl", "legendary.zones", result);
    }

    get zoneNumbersLabel() {
        return this.zoneNumbers.join(",");
    }

    get affectsMobility() {
        return !!this.item.getFlag("sohl", "legendary.affectsMobility");
    }

    get affectedSkills() {
        return this.item.getFlag("sohl", "legendary.affectedSkills") || [];
    }

    get affectedAttributes() {
        return this.item.getFlag("sohl", "legendary.affectedAttributes") || [];
    }

    static get maxZoneDie() {
        return Object.values(this.dice).at(-1);
    }

    prepareBaseData() {
        super.prepareBaseData();
        this.$bodyZoneProbSum = new sohl.ValueModifier(this);
    }

    /** @override */
    processSiblings() {
        super.processSiblings();
        const anatomy = this.item.nestedIn;
        if (anatomy) {
            anatomy.system.$maxZones = Math.max(
                anatomy.system.$maxZones,
                ...this.zoneNumbers,
            );
        }
    }
}

class LgndBodyPartItemData extends sohl.BodyPartItemData {
    /**
     * Represents body part impairment based on injuries.
     * If body part is injured, impairment will be less than
     * zero.  Values greater than zero are treated as zero
     * impairment.
     *
     * @type {ValueModifier}
     */
    $impairment;

    $bodyPartProbSum;

    get probWeight() {
        return this.item.getFlag("sohl", "legendary.probWeight") || 0;
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
        this.$bodyPartProbSum = new sohl.ValueModifier(this);
        this.$impairment = new sohl.ValueModifier(this, {
            unusable: false,
            value: (thisVM) => {
                Math.min(thisVM.effective, 0);
            },
        });
    }

    /** @override */
    processSiblings() {
        super.processSiblings();

        const bodyZone = this.item.nestedIn;
        bodyZone.system.$bodyZoneProbSum.add(
            this.name,
            this.abbrev,
            this.probWeight,
        );

        //        this.actor.system.$health.max += this.$health.effective;

        // Add this body part's health to overall actor health.
        // If this body part is unusable, or impairment is < -10,
        // then none of the body part health is added to the
        // actor health.
        if (!this.$impairment.unusable) {
            // if (!this.$impairment.value) {
            //     // If no impairment, then add full body part health
            //     this.actor.system.$health.add(
            //         `${this.item.name} Impairment`,
            //         "Impair",
            //         this.$health.effective,
            //     );
            // } else if (this.$impairment.effective >= -5) {
            //     // If minor impairment, then add half body part health
            //     this.actor.system.$health.add(
            //         `${this.item.name} Impairment`,
            //         "Impair",
            //         Math.floor(this.$health.effective / 2),
            //     );
            // } else if (this.$impairment.value >= -10) {
            //     // If major impairment, then add 1/4 body part health
            //     this.actor.system.$health.add(
            //         `${this.item.name} Impairment`,
            //         "Impair",
            //         Math.floor(this.$health.effective / 4),
            //     );
            // }
        } else {
            // Body parts marked "unusable" can never hold anything.
            if (this.heldItem?.system instanceof sohl.GearItemData) {
                if (this.heldItem.system.isHeldBy.includes(this.item.id)) {
                    ui.notifications.warn(
                        `${this.item.name} is unusable, so dropping everything being held in the body part`,
                    );
                    this.update({ "system.heldItem": "" });
                }
            }
        }
    }
}

class LgndBodyLocationItemData extends sohl.BodyLocationItemData {
    $impairment;

    get isFumble() {
        return !!this.item.getFlag("sohl", "legendary.isFumble");
    }

    get isStumble() {
        return !!this.item.getFlag("sohl", "legendary.isStumble");
    }

    get bleedingSevThreshold() {
        return (
            this.item.getFlag("sohl", "legendary.bleedingSevThreshold") ?? null
        );
    }

    get amputateModifier() {
        return this.item.getFlag("sohl", "legendary.amputateModifier") ?? null;
    }

    get shockValue() {
        return this.item.getFlag("sohl", "legendary.shockValue") || 0;
    }

    get probWeight() {
        return this.item.getFlag("sohl", "legendary.probWeight") || 0;
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
        this.$protection = foundry.utils.mergeObject(
            this.$protection,
            {
                blunt: new sohl.ValueModifier(this),
                edged: new sohl.ValueModifier(this),
                piercing: new sohl.ValueModifier(this),
                fire: new sohl.ValueModifier(this),
            },
            { inplace: true },
        );
        this.$impairment = new sohl.ValueModifier(this, { unusable: false });
    }

    processSiblings() {
        super.processSiblings();
        // biome-ignore lint/correctness/noUnusedVariables: <explanation>
        let thisIsUnusable = this.$impairment.unusable;

        const bpItem = this.item.nestedIn;
        if (bpItem) {
            const bpImp = bpItem.system.$impairment;
            if (this.$impairment.effective) {
                bpImp.addVM(this.$impairment);
            }

            if (this.$impairment.unusable) {
                bpImp.$impairment.unusable = true;
            }

            bpItem.system.$bodyPartProbSum.add(
                this.name,
                this.abbrev,
                this.probWeight,
            );
        }
    }
}

class LgndArmorGearItemData extends sohl.ArmorGearItemData {
    $encumbrance;

    static get effectKeys() {
        return sohl.Utility.simpleMerge(super.effectKeys, super.effectKeys, {
            "system.$encumbrance": {
                label: "Encumbrance",
                abbrev: "Enc",
            },
        });
    }

    get encumbrance() {
        return this.item.getFlag("sohl", "legendary.encumbrance") || 0;
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();

        this.$encumbrance = new sohl.ValueModifier(this);
        this.$encumbrance.setBase(this.encumbrance);

        // Armor, when equipped, is weightless
        if (this.isEquipped) {
            this.$weight.setBase(0);
        }
    }

    /** @override */
    processSiblings() {
        super.processSiblings();

        if (this.$encumbrance && this.isEquipped) {
            // Armor, when worn, may have an encumbrance effect.  If present, use it.
            this.actor.system.$encumbrance.add(
                `this.item.name Encumbrance`,
                "Enc",
                this.$encumbrance,
            );
        }
    }
}
class LgndWeaponGearItemData extends sohl.WeaponGearItemData {
    $length;
    $heft;

    get heftBase() {
        return this.item.getFlag("sohl", "legendary.heftBase") || 0;
    }

    prepareBaseData() {
        super.prepareBaseData();

        this.$length = new sohl.ValueModifier(this);
        this.$length.setBase(this.lengthBase);

        this.$heft = new sohl.ValueModifier(this);
        this.$heft.setBase(this.heftBase);
    }

    setupVirtualItems() {
        super.setupVirtualItems();
        this.items.forEach((it) => {
            if (
                !it.system.transfer &&
                it.system instanceof sohl.MissileWeaponStrikeModeItemData
            ) {
                const missileSM = it;
                if (
                    missileSM.system.projectileType &&
                    missileSM.system.projectileType !== "none"
                ) {
                    this.actor.itemTypes.projectilegear.forEach((proj, idx) => {
                        if (
                            proj.system.quantity > 0 &&
                            proj.system.subType ===
                                missileSM.system.projectileType
                        ) {
                            const itemData = missileSM.toObject();
                            itemData._id = foundry.utils.randomID();
                            itemData.sort += idx;
                            if (proj.system.impactBase.die >= 0) {
                                itemData.system.impactBase.die =
                                    proj.system.impactBase.die;
                            }
                            if (proj.system.impactBase.aspect) {
                                itemData.system.impactBase.aspect =
                                    proj.system.impactBase.aspect;
                            }
                            if (proj.system.impactBase.modifier >= 0) {
                                itemData.system.impactBase.modifier =
                                    proj.system.impactBase.modifier;
                            }
                            itemData.name = proj.name;

                            itemData.effects.push(
                                ...proj.effects.contents.map((e) =>
                                    e.toObject(),
                                ),
                            );
                            const item = new sohl.SohlItem(itemData, {
                                parent: this.item.actor,
                            });
                            item.cause = this.item;
                        }
                    });
                }
            }
        });
    }
}

export class LgndUtility extends sohl.Utility {
    static strImpactMod(str) {
        if (typeof str !== "number") return -10;
        return str > 5
            ? Math.trunc(str / 2) - 5
            : [-10, -10, -8, -6, -4, -3].at(Math.max(str, 0));
    }

    static engagementZoneRange(reach) {
        if (reach <= 7) return 5;
        const result = (Math.floor((reach - 7) / 5) + 1) * 5;
        return result;
    }

    /**
     * Calculates the distance from sourceToken to targetToken in "scene" units (e.g., feet).
     *
     * @param {Token} sourceToken
     * @param {Token} targetToken
     * @param {Boolean} gridUnits If true, return in grid units, not "scene" units
     */
    static rangeToTarget(sourceToken, targetToken, gridUnits = false) {
        if (!sourceToken || !targetToken || !canvas.scene || !canvas.scene.grid)
            return 9999;

        // If the current scene is marked "Theatre of the Mind", then range is always 0
        if (canvas.scene.getFlag("sohl", "isTotm")) return 0;

        const sToken = canvas.tokens.get(sourceToken.id);
        const tToken = canvas.tokens.get(targetToken.id);

        const segments = [];
        const source = sToken.center;
        const dest = tToken.center;
        const ray = new Ray(source, dest);
        segments.push({ ray });
        const distances = canvas.grid.measureDistances(segments, {
            gridSpaces: true,
        });
        const distance = distances[0];
        if (gridUnits) return Math.round(distance / canvas.dimensions.distance);
        return distance;
    }

    /**
     * Determine if the token is valid (must be either a 'creature' or 'character')
     *
     * @param {Token} token
     */
    static isValidToken(token) {
        if (!token) {
            ui.notifications.warn("No token selected.");
            return false;
        }

        if (!token.actor) {
            ui.notifications.warn(`Token ${token.name} is not a valid actor.`);
            return false;
        }

        if (token.actor.type === "entity") {
            return true;
        } else {
            ui.notifications.warn(
                `Token ${token.name} is not a character or creature.`,
            );
            return false;
        }
    }
}

export class LgndTour extends Tour {
    actor;
    item;

    async _preStep() {
        await super._preStep();
        const currentStep = this.currentStep;

        if (currentStep.actor) {
            this.actor = await CONFIG.Actor.documentClass.create(
                currentStep.actor,
            );
            await this.actor.sheet?._render(true);
        }

        if (currentStep.itemName) {
            if (!this.actor) {
                console.warn("No actor found for step " + currentStep.title);
            }
            this.item = this.actor?.items.getName(currentStep.itemName);
            const app = this.item.sheet;
            if (!app.rendered) {
                await app._render(true);
            }
            currentStep.selector = currentStep.selector?.replace(
                "itemSheetID",
                app.id,
            );
        }

        if (currentStep.tab) {
            switch (currentStep.tab.parent) {
                case LGND.CONST.TOUR_TAB_PARENTS.ACTOR: {
                    if (!this.actor) {
                        console.warn("No Actor Found");
                        break;
                    }
                    const app = this.actor.sheet;
                    app?.activateTab(currentStep.tab.id);
                    break;
                }

                case LGND.CONST.TOUR_TAB_PARENTS.ITEM: {
                    if (!this.item) {
                        console.warn("No Item Found");
                        break;
                    }
                    const app = this.item.sheet;
                    app?.activateTab(currentStep.tab.id);
                    break;
                }
            }
        }
        currentStep.selector = currentStep.selector?.replace(
            "actorSheetID",
            this.actor?.sheet?.id,
        );
    }
}

export class LgndCommands extends sohl.Commands {
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

        await sohl.Utility.asyncForEach(content.Actor, async (f) => {
            console.log("Processing Animate Entity ${f.name}");
            const actor = await sohl.SohlActor.create({ name: f.name });
            const updateData = [];
            const itemData = [];
            // Fill in attribute values
            Object.keys(f.system.attributes).forEach((attr) => {
                const attrItem = actor.items.find(
                    (it) =>
                        it.system instanceof sohl.TraitItemData &&
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
sohl.SOHL.cmds = LgndCommands;

const LgndActorDataModels = foundry.utils.mergeObject(
    sohl.SohlActorDataModels,
    {
        [sohl.AnimateEntityActorData.typeName]: LgndAnimateEntityActorData,
    },
    { inplace: false },
);

const LgndItemDataModels = foundry.utils.mergeObject(
    sohl.SohlItemDataModels,
    {
        [sohl.ProtectionItemData.typeName]: LgndProtectionItemData,
        [sohl.MysticalAbilityItemData.typeName]: LgndMysticalAbilityItemData,
        [sohl.TraitItemData.typeName]: LgndTraitItemData,
        [sohl.SkillItemData.typeName]: LgndSkillItemData,
        [sohl.InjuryItemData.typeName]: LgndInjuryItemData,
        [sohl.DomainItemData.typeName]: LgndDomainItemData,
        [sohl.AfflictionItemData.typeName]: LgndAfflictionItemData,
        [sohl.AnatomyItemData.typeName]: LgndAnatomyItemData,
        [sohl.BodyZoneItemData.typeName]: LgndBodyZoneItemData,
        [sohl.BodyPartItemData.typeName]: LgndBodyPartItemData,
        [sohl.BodyLocationItemData.typeName]: LgndBodyLocationItemData,
        [sohl.MeleeWeaponStrikeModeItemData.typeName]:
            LgndMeleeWeaponStrikeModeItemData,
        [sohl.MissileWeaponStrikeModeItemData.typeName]:
            LgndMissileWeaponStrikeModeItemData,
        [sohl.CombatTechniqueStrikeModeItemData.typeName]:
            LgndCombatTechniqueStrikeModeItemData,
        [sohl.ArmorGearItemData.typeName]: LgndArmorGearItemData,
        [sohl.WeaponGearItemData.typeName]: LgndWeaponGearItemData,
    },
    { inplace: false },
);

const LgndModifiers = foundry.utils.mergeObject(
    sohl.SohlModifiers,
    {
        ImpactModifier: LgndImpactModifier,
        MasteryLevelModifier: LgndMasteryLevelModifier,
    },
    { inplace: false },
);

export const verData = {
    id: "legendary",
    label: "Song of Heroic Lands: Legendary",
    CONFIG: {
        displayChatActionButtons: sohl.Utility.displayChatActionButtons,
        onChatCardAction: sohl.Utility.onChatCardAction,
        Helper: {
            modifiers: LgndModifiers,
            contextMenu: sohl.SohlContextMenu,
        },
        Actor: {
            documentClass: sohl.SohlActor,
            documentSheets: [
                {
                    cls: sohl.SohlActorSheet,
                    types: Object.keys(LgndActorDataModels),
                },
            ],
            dataModels: LgndActorDataModels,
            typeLabels: sohl.SohlActorTypeLabels,
            typeIcons: sohl.SohlActorTypeIcons,
            types: Object.keys(LgndActorDataModels),
            defaultType: sohl.AnimateEntityActorData.typeName,
            compendiums: ["sohl.leg-characters", "sohl.leg-creatures"],
        },
        Item: {
            documentClass: sohl.SohlItem,
            documentSheets: [
                {
                    cls: sohl.SohlItemSheet,
                    types: Object.keys(LgndItemDataModels).filter(
                        (t) => t !== sohl.ContainerGearItemData.typeName,
                    ),
                },
                {
                    cls: sohl.SohlContainerGearItemSheet,
                    types: [sohl.ContainerGearItemData.typeName],
                },
            ],
            dataModels: LgndItemDataModels,
            typeLabels: sohl.SohlItemTypeLabels,
            typeIcons: sohl.SohlItemTypeIcons,
            types: Object.keys(LgndItemDataModels),
            compendiums: [
                "sohl.leg-characteristics",
                "sohl.leg-possessions",
                "sohl.leg-mysteries",
            ],
        },
        ActiveEffect: {
            documentClass: sohl.SohlActiveEffect,
            dataModels: {
                [sohl.SohlActiveEffectData.typeName]: sohl.SohlActiveEffectData,
            },
            typeLabels: {
                [sohl.SohlActiveEffectData.typeName]:
                    sohl.SohlActiveEffectData.typeLabel.singular,
            },
            typeIcons: { [sohl.SohlActiveEffectData.typeName]: "fas fa-gears" },
            types: [sohl.SohlActiveEffectData.typeName],
            legacyTransferral: false,
        },
        Combatant: {
            documentClass: sohl.SohlCombatant,
        },
        Macro: {
            documentClass: sohl.SohlMacro,
            documentSheet: sohl.SohlMacroConfig,
        },
    },
    CONST: foundry.utils.mergeObject(sohl.SOHL.CONST, LGND.CONST, {
        inplace: false,
    }),
};
