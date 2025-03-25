import { _l } from "../helper/sohl-localize.mjs";
import { Utility } from "../helper/utility.mjs";
import { MasteryLevelModifier } from "./MasteryLevelModifier.mjs";
import { fields } from "../../sohl-common.mjs";
import { SohlMacro } from "../macro/SohlMacro.mjs";
import { MissileWeaponStrikeModeItemData } from "../item/datamodel/MissileWeaponStrikeModeItemData.mjs";
import { TestResult } from "./TestResult.mjs";

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

    static TEST = Object.freeze({
        SETIMPROVEFLAG: "setImproveFlag",
        UNSETIMPROVEFLAG: "unsetImproveFlag",
        IMPROVESDR: "improveWithSDR",
        SKILL: "successTest",
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
    });

    /** @inheritdoc */
    static metadata = Object.freeze(
        sohl.utils.mergeObject(super.metadata, {
            name: "SuccessTestResult",
            locId: "SUCCESSTESTRESULT",
            schemaVersion: "0.5.6",
        }),
    );

    static defineSchema() {
        return sohl.utils.mergeObject(super.defineSchema, {
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
                initial: this.TEST.SKILL,
                choices: Utility.getChoicesMap(
                    this.TEST,
                    "SOHL.SUCCESSTESTRESULT.TEST",
                ),
            }),
            token: new fields.ForeignDocumentField(),
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
        sohl.utils.mergeObject(
            data,
            {
                variant: game.sohl?.id,
                template:
                    "systems/sohl/templates/dialog/standard-test-dialog.hbs",
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
                        game.sohl?.MOD.Player,
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
            ui.notifications?.warn(
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
                this.testType.type === SuccessTestResult.TEST.IGNORE
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
                this._description =
                    this.isSuccess ?
                        SuccessTestResult.SUCCESS_TEXT.CRITICAL_SUCCESS
                    :   SuccessTestResult.SUCCESS_TEXT.CRITICAL_FAILURE;
            } else {
                this._description =
                    this.isSuccess ?
                        SuccessTestResult.SUCCESS_TEXT.MARGINAL_SUCCESS
                    :   SuccessTestResult.SUCCESS_TEXT.MARGINAL_FAILURE;
            }
        } else {
            this._description =
                this.isSuccess ?
                    SuccessTestResult.SUCCESS_TEXT.SUCCESS
                :   SuccessTestResult.SUCCESS_TEXT.FAILURE;
        }

        return allowed;
    }

    async toChat(data = {}) {
        sohl.utils.mergeObject(
            data,
            {
                variant: game.sohl?.id,
                template: "systems/sohl/templates/chat/standard-test-card.hbs",
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
