import { _l } from "./sohl-localize.mjs";
import { Utility } from "./utility.mjs";
import { fields } from "../sohl-common.mjs";
import { ValueModifier } from "./ValueModifier.mjs";

export class MasteryLevelModifier extends ValueModifier {
    /** @inheritdoc */
    static metadata = Object.freeze(
        sohl.utils.mergeObject(super.metadata, {
            name: "MasteryLevelModifier",
            locId: "MASTERYLEVELMODIFIER",
            schemaVersion: "0.5.6",
        }),
    );

    static defineSchema() {
        return sohl.utils.mergeObject(super.defineSchema(), {
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
            testResult = new CONFIG.SuccessTestResult(
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
                "systems/sohl/templates/dialog/standard-test-dialog.hbs";

            let dialogData = {
                variant: game.sohl?.id,
                type: testResult.type,
                title: _l("SOHL.MasteryLevelModifier.successTest.dialogTitle", {
                    name:
                        testResult.token ?
                            testResult.token.name
                        :   testResult.actor.name,
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
                            game.sohl?.MOD.Player,
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
    /**
     *
     * @param {object} chatData Data that will be passed to the chat
     * @param {number} target The target value
     * @param {TestDetailedDescription[]} testDescTable The table of test descriptions
     * @returns
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
                        limitedDesc.label instanceof Function ?
                            limitedDesc.label(chatData)
                        :   limitedDesc.label;
                    const desc =
                        limitedDesc.description instanceof Function ?
                            limitedDesc.description(chatData)
                        :   limitedDesc.description;
                    chatData.resultText = label || "";
                    chatData.resultDesc = desc || "";
                    chatData.svSuccess = limitedDesc.success;
                    result = limitedDesc.result;
                }
            } else {
                const label =
                    testDesc.label instanceof Function ?
                        testDesc.label(chatData)
                    :   testDesc.label;
                const desc =
                    testDesc.description instanceof Function ?
                        testDesc.description(chatData)
                    :   testDesc.description;
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
