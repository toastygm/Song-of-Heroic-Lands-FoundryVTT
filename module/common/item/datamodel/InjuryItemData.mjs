import { SohlContextMenu } from "../../helper/SohlContextMenu.mjs";
import { Utility } from "../../helper/utility.mjs";
import { ImpactModifier } from "../../modifier/ImpactModifier.mjs";
import { fields } from "../../../sohl-common.mjs";
import { SohlMacro } from "../../macro/SohlMacro.mjs";
import { SohlItem } from "../SohlItem.mjs";
import { SohlItemData } from "./SohlItemData.mjs";

export class InjuryItemData extends SohlItemData {
    $healingRate;
    $bleeding;
    $injuryLevel;
    $bodyLocation;

    static EFFECT_KEYS = Object.freeze({
        HEALINGRATE: {
            id: "healingRate",
            path: "system.$healingRate",
            abbrev: "HRate",
        },
        INJURYLEVEL: {
            id: "injuryLevel",
            path: "system.$injuryLevel",
            abbrev: "InjLvl",
        },
    });

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

    static ACTIONS = Object.freeze({
        TREATMENT: {
            id: "treatmentTest",
            contextIconClass: "fas fa-staff-snake",
            contextCondition: (header) => {
                header = header instanceof HTMLElement ? header : header[0];
                const li = header.closest(".item");
                const item = fromUuidSync(li.dataset.uuid);
                if (item?.system.isBleeding) return false;
                const physician = item?.actor?.getSkillByAbbrev("pysn");
                return physician && !physician.system.$masteryLevel.disabled;
            },
            contextGroup: SohlContextMenu.SORT_GROUPS.ESSENTIAL,
            useAsync: true,
        },
        DIAGNOSIS: {
            id: "diagnosisTest",
            contextIconClass: "fas fa-stethoscope",
            contextCondition: (header) => {
                header = header instanceof HTMLElement ? header : header[0];
                const li = header.closest(".item");
                const item = fromUuidSync(li.dataset.uuid);
                return item && !item.system.isTreated;
            },
            contextGroup: SohlContextMenu.SORT_GROUPS.ESSENTIAL,
            useAsync: true,
        },
        HEAL: {
            id: "healTest",
            contextIconClass: "fas fa-heart-pulse",
            contextCondition: (header) => {
                header = header instanceof HTMLElement ? header : header[0];
                const li = header.closest(".item");
                const item = fromUuidSync(li.dataset.uuid);
                if (item?.system.isBleeding) return false;
                const endurance = item?.actor?.getTraitByAbbrev("end");
                return endurance && !endurance.system.$masteryLevel.disabled;
            },
            contextGroup: SohlContextMenu.SORT_GROUPS.ESSENTIAL,
            useAsync: true,
        },
        BLEEDINGSTOPPAGE: {
            id: "bleedingStoppageTest",
            contextIconClass: "fas fa-droplet-slash",
            contextCondition: (header) => {
                header = header instanceof HTMLElement ? header : header[0];
                const li = header.closest(".item");
                const item = fromUuidSync(li.dataset.uuid);
                if (!item?.system.isBleeding) return false;
                const physician = item?.actor?.getSkillByAbbrev("pysn");
                return physician && !physician.system.$masteryLevel.disabled;
            },
            contextGroup: SohlContextMenu.SORT_GROUPS.ESSENTIAL,
            useAsync: true,
        },
        BLOODLOSSADVANCE: {
            id: "bloodLossAdvanceTest",
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
            useAsync: true,
        },
    });

    /** @inheritdoc */
    static metadata = Object.freeze(
        sohl.utils.mergeObject(
            super.metadata,
            {
                name: "injury",
                locId: "INJURY",
                iconCssClass: "fas fa-user-injured",
                img: "systems/sohl/assets/icons/injury.svg",
                sheet: "systems/sohl/templates/item/injury-sheet.hbs",
                nestOnly: false,
                defaultAction: this.ACTION.HEAL.id,
                actions: this.genActions(this.ACTIONS, "INJURY"),
                events: [this.EVENT.NEXT_HEALING_TEST],
                effectKeys: this.genEffectKeys(this.EFFECT_KEYS, "INJURY"),
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    static defineSchema() {
        return sohl.utils.mergeObject(
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
                bodyLocation: new fields.ForeignDocumentField(),
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
        ui.notifications?.warn("Injury Treatment Test Not Implemented");
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
        ui.notifications?.warn("Injury Heal Test Not Implemented");
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

        this.$healingRate = new CONFIG.ValueModifier({}, { parent: this });
        this.$injuryLevel = new CONFIG.ValueModifier(
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
