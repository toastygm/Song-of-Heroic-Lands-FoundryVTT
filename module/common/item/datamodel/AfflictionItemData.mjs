/** @typedef {import("@sohl-global").PlainObject} PlainObject */
/** @typedef {import("@sohl-modifiers").ValueModifier} ValueModifier */
import { SohlContextMenu } from "../../helper/SohlContextMenu.mjs";
import { Utility } from "../../helper/utility.mjs";
import { SohlMacro } from "../../macro/SohlMacro.mjs";
import { SohlItem } from "../SohlItem.mjs";
import { SohlItemData } from "./SohlItemData.mjs";
import { SubtypeMixin } from "./SubtypeMixin.mjs";

const { StringField, NumberField, BooleanField } = foundry.data.fields;

/**
 * Represents the data model for an Affliction item in the Sohl system.
 * Extends the base `SohlItemData` class and provides additional schema
 * and metadata specific to afflictions.
 *
 * @extends SohlItemData
 */
export class AfflictionItemData extends SubtypeMixin(SohlItemData) {
    /**
     * Represents the healing rate associated with the affliction item.
     * This property determines the rate at which healing occurs.
     *
     * @type {ValueModifier}
     */
    $healingRate;

    /**
     * Represents the contagion index for an affliction item.
     * This property is used to track the severity or spread level
     * of a contagion within the context of the affliction.
     *
     * @type {ValueModifier}
     */
    $contagionIndex;

    /**
     * The level of the affliction item.
     * This property represents the severity or stage of the affliction.
     *
     * @type {ValueModifier}
     */
    $level;

    /**
     * A frozen object containing key definitions for various effects related to affliction items.
     * Each key represents a specific effect with its associated metadata.
     *
     * @constant {Record<string, EffectKey>} EFFECT_KEYS
     */
    static EFFECT_KEYS = Object.freeze({
        HEALINGRATE: {
            id: "healingRate",
            path: "system.$healingRate",
            abbrev: "HRate",
        },
        CONTAGIONINDEX: {
            id: "contagionIndex",
            path: "system.$contagionIndex",
            abbrev: "CInd",
        },
        LEVEL: { id: "level", path: "system.$level", abbrev: "Lvl" },
    });

    /**
     * The number of hours required to consider an affliction defeated.
     * This constant represents the time threshold in hours.
     *
     * @constant {number}
     */
    static AFFLICTON_DEFEATED_HR = 6;

    /**
     * Represents the default value for the subject's "dead" status in hours.
     * This constant is likely used to define a baseline or initial state
     * for tracking the duration of a subject's death in hours.
     *
     * @constant {number}
     */
    static SUBJECT_DEAD_HR = 0;

    /**
     * A constant representing an undefined or uninitialized hit rate (HR) value.
     * Used as a placeholder to indicate that the HR value has not been set.
     *
     * @constant {number}
     */
    static UNDEFINED_HR = -1;

    /**
     * A static property TRANSMISSION with predefined values for different transmission types.
     *
     * @constant
     * @type {Record<string, string>}
     */
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

    /**
     * A static property named FATIGUE that stores an object with frozen properties representing various states of fatigue such as windedness, weariness, and weakness.
     *
     * @constant
     * @type {Record<string, string>}
     */
    static FATIGUE = Object.freeze({
        WINDEDNESS: "windedness",
        WEARINESS: "weariness",
        WEAKNESS: "weakness",
    });

    /**
     * Defines a static object with properties representing various forms of privation such as asphixia, cold, heat, starvation, dehydration, and sleep deprivation.
     *
     * @constant
     * @type {Record<string, string>}
     */
    static PRIVATION = Object.freeze({
        ASPHIXIA: "asphixia",
        COLD: "cold",
        HEAT: "heat",
        STARVATION: "starvation",
        DEHYDRATION: "dehydration",
        SLEEP_DEPRIVATION: "nosleep",
    });

    /**
     * Defines a static property FEAR_LEVEL that is an immutable object with different levels of fear represented by strings
     *
     * @constant
     * @type {Record<string, string>}
     */
    static FEAR_LEVEL = Object.freeze({
        NONE: "none",
        BRAVE: "brave",
        STEADY: "steady",
        AFRAID: "afraid",
        TERRIFIED: "terrified",
        CATATONIC: "catatonic",
    });

    /**
     * Defines various morale levels as a frozen object with specific key-value pairs representing different morale states.
     *
     * @constant
     * @type {Record<string, string>}
     */
    static MORALE_LEVEL = Object.freeze({
        NONE: "none",
        BRAVE: "brave",
        STEADY: "steady",
        WITHDRAWING: "withdraw",
        ROUTED: "routed",
        CATATONIC: "catatonic",
    });

    /**
     * Defines a static object with frozen properties for event names NEXT_COURSE_TEST and NEXT_RECOVERY_TEST.
     *
     * @constant
     * @type {Record<string, string>}
     */
    static EVENT = Object.freeze({
        NEXT_COURSE_TEST: "nextcoursetest",
        NEXT_RECOVERY_TEST: "nextrecoverytest",
    });

    /** @inheritdoc */
    static ACTION = Object.freeze({
        ...super.ACTION,
        TREATMENT: {
            id: "treatmentTest",
            contextIconClass: "fas fa-staff-snake",
            contextCondition: this.ctxCondTreat,
            contextGroup: SohlContextMenu.SORT_GROUPS.ESSENTIAL,
            useAsync: true,
        },
        DIAGNOSIS: {
            id: "diagnosisTest",
            contextIconClass: "fas fa-stethoscope",
            contextCondition: this.ctxCondDiagnose,
            contextGroup: SohlContextMenu.SORT_GROUPS.ESSENTIAL,
            useAsync: true,
        },
        HEAL: {
            id: "healTest",
            contextIconClass: "fas fa-heart-pulse",
            contextCondition: this.ctxCondHeal,
            contextGroup: SohlContextMenu.SORT_GROUPS.ESSENTIAL,
            useAsync: true,
        },
        TRANSMIT: {
            id: "transmitTest",
            contextIconClass: "fas fa-head-side-cough",
            contextCondition: this.ctxCondTransmit,
            contextGroup: SohlContextMenu.SORT_GROUPS.ESSENTIAL,
        },
        COURSE: {
            id: "courseTest",
            contextIconClass: "fas fa-heart-pulse",
            contextCondition: this.ctxCondCourse,
            contextGroup: SohlContextMenu.SORT_GROUPS.ESSENTIAL,
        },
    });

    /** @inheritdoc */
    static metadata = Object.freeze(
        sohl.utils.mergeObject(
            super.metadata,
            {
                name: "affliction",
                locId: "AFFLICTION",
                iconCssClass: "fas fa-face-nauseated",
                img: "systems/sohl/assets/icons/sick.svg",
                sheet: "systems/sohl/templates/item/affliction-sheet.hbs",
                nestOnly: false,
                effectKeys: this.genEffectKeys(this.EFFECT_KEYS, "AFFLICTION"),
                defaultAction: this.ACTION.HEAL.id,
                actions: this.genActions(this.ACTION, "AFFLICTION"),
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

    /**
     * Defines the schema for a specific object by merging the existing schema with additional fields for dormancy, treatment status, diagnosis bonus, base level, healing rate, contagion index, and transmission. Returns the merged schema object.
     *
     * @static
     * @returns {*}
     */
    static defineSchema() {
        return sohl.utils.mergeObject(
            super.defineSchema(),
            {
                isDormant: new BooleanField({ initial: false }),
                isTreated: new BooleanField({ initial: false }),
                diagnosisBonusBase: new NumberField({
                    integer: true,
                    initial: 0,
                }),
                levelBase: new NumberField({
                    integer: true,
                    initial: 0,
                    min: 0,
                }),
                healingRateBase: new NumberField({
                    integer: true,
                    initial: this.UNDEFINED_HR,
                    min: this.UNDEFINED_HR,
                }),
                contagionIndexBase: new NumberField({
                    integer: true,
                    initial: 0,
                    min: 0,
                }),
                transmission: new StringField({
                    initial: this.TRANSMISSION.NONE,
                    required: true,
                    // @ts-ignore
                    choices: Utility.getChoicesMap(
                        this.TRANSMISSION,
                        "SOHL.AFFLICTION.TRANSMISSION",
                    ),
                }),
            },
            { inplace: false },
        );
    }

    /**
     * @param {HTMLElement | JQuery<HTMLElement>} header
     */
    static ctxCondTreat(header) {
        header = header instanceof HTMLElement ? header : header[0];
        const li = /** @type {HTMLElement} */ header.closest(".item");
        const item = /** @type {SohlItem} */ fromUuidSync(li?.dataset?.uuid);
        if (item?.system.isBleeding) return false;
        const physician = item?.actor?.getSkillByAbbrev("pysn");
        return physician && !physician.system.$masteryLevel.disabled;
    }

    /**
     * @param {HTMLElement | JQuery<HTMLElement>} header
     */
    static ctxCondDiagnose(header) {
        header = header instanceof HTMLElement ? header : header[0];
        const li = /** @type {HTMLElement} */ header.closest(".item");
        const item = /** @type {SohlItem} */ fromUuidSync(li.dataset.uuid);
        return item && !item.system.isTreated;
    }

    /**
     * @param {HTMLElement | JQuery<HTMLElement>} header
     */
    static ctxCondHeal(header) {
        header = header instanceof HTMLElement ? header : header[0];
        const li = /** @type {HTMLElement} */ header.closest(".item");
        const item = /** @type {SohlItem} */ fromUuidSync(li.dataset.uuid);
        if (item?.system.isBleeding) return false;
        const endurance = item?.actor?.getTraitByAbbrev("end");
        return endurance && !endurance.system.$masteryLevel.disabled;
    }

    /**
     * @param {HTMLElement | JQuery<HTMLElement>} header
     */
    static ctxCondTransmit(header) {
        header = header instanceof HTMLElement ? header : header[0];
        const li = /** @type {HTMLElement} */ header.closest(".item");
        const item = /** @type {SohlItem} */ fromUuidSync(li.dataset.uuid);
        return item?.system.canTransmit;
    }

    /**
     * @param {HTMLElement | JQuery<HTMLElement>} header
     */
    static ctxCondCourse(header) {
        header = header instanceof HTMLElement ? header : header[0];
        const li = /** @type {HTMLElement} */ header.closest(".item");
        const item = /** @type {SohlItem} */ fromUuidSync(li.dataset.uuid);
        if (item.system.isDormant) return false;
        const endurance = item?.actor?.getTraitByAbbrev("end");
        return endurance && !endurance.system.$masteryLevel.disabled;
    }

    /**
     * A method that retrieves the system property of the nextCourseTest event.
     *
     * @readonly
     * @type {*}
     */
    get nextCourseTest() {
        return this.getEvent("nextCourseTest")?.system;
    }

    /**
     * A method that retrieves the system property of the event named 'nextRecoveryTest'
     *
     * @readonly
     * @type {*}
     */
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

    /**
     * Defines whether the Affliction can transmit or not.
     *
     * @readonly
     * @type {boolean}
     */
    get canTransmit() {
        // TODO - Implement Affliction canTransmit
        return true;
    }

    /**
     * Computed property that returns whether an affliction can be contracted or not.
     *
     * @readonly
     * @type {boolean}
     */
    get canContract() {
        // TODO - Implement Affliction canContract
        return true;
    }

    /**
     * A property that checks if a course is available for the affliction.
     *
     * @readonly
     * @type {boolean}
     */
    get hasCourse() {
        // TODO - Implement Affliction hasCourse
        return true;
    }

    /**
     * Getter method for checking if the Affliction can be treated.
     *
     * @readonly
     * @type {boolean}
     */
    get canTreat() {
        // TODO - Implement Affliction canTreat
        return true;
    }

    /**
     * A property that returns whether the Affliction can heal. This property is a placeholder and always returns true. It needs implementation for the healing functionality.
     *
     * @readonly
     * @type {boolean}
     */
    get canHeal() {
        // TODO - Implement Affliction canHeal
        return true;
    }

    /**
     * Transmit function that handles the interaction between a speaker, actor, token, and character. It can skip dialog, hide chat messages, and has default type and title values. Also includes a scope object with additional properties. Calls a SohlMacro method to set defaults for speaker, actor, token, and character. Displays a warning notification for 'Affliction Transmit' feature not being implemented yet.
     *
     * @param {*} speaker
     * @param {*} actor
     * @param {*} token
     * @param {*} character
     * @param {{ skipDialog?: boolean; noChat?: boolean; type?: string; title?: string; target?: any; }} [param0={}]
     * @param {boolean} [param0.skipDialog=false]
     * @param {boolean} [param0.noChat=false]
     * @param {string} [param0.type=`${this.type}-${this.name}-transmit`]
     * @param {string} [param0.title=`${this.item.label} Transmit`]
     * @param {*} [param0.target=null]
     * @param {{}} param0....scope
     */
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
        ui.notifications?.warn("Affliction Transmit Not Implemented");
    }

    /**
     * A function named contractTest that takes in parameters speaker, actor, token, character, and an object with optional properties skipDialog, noChat, type, and title. It also destructures scope from the object. The function calls SohlMacro.getExecuteDefaults with speaker, actor, token, character, needsActor, and self properties. It displays a warning using ui.notifications if Affliction Contract Test is not implemented (optional todo comment is present).
     *
     * @param {*} speaker
     * @param {*} actor
     * @param {*} token
     * @param {*} character
     * @param {{ skipDialog?: boolean; noChat?: boolean; type?: string; title?: string; }} [param0={}]
     * @param {boolean} [param0.skipDialog=false]
     * @param {boolean} [param0.noChat=false]
     * @param {string} [param0.type=`${this.type}-${this.name}-contract-test`]
     * @param {string} [param0.title=`${this.item.label} Contract Test`]
     * @param {{}} param0....scope
     */
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
        ui.notifications?.warn("Affliction Contract Test Not Implemented");
    }

    /**
     * Function that handles a course test for a character in a role-playing game, optionally skipping dialog and chat interactions. It also sets defaults for speaker, actor, token, and character. Displays a warning notification for an unimplemented feature related to Affliction Course Test.
     *
     * @param {*} speaker
     * @param {*} actor
     * @param {*} token
     * @param {*} character
     * @param {{ skipDialog?: boolean; noChat?: boolean; type?: string; title?: string; }} [param0={}]
     * @param {boolean} [param0.skipDialog=false]
     * @param {boolean} [param0.noChat=false]
     * @param {string} [param0.type=`${this.type}-${this.name}-course-test`]
     * @param {string} [param0.title=`${this.item.label} Course Test`]
     * @param {{}} param0....scope
     */
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
        ui.notifications?.warn("Affliction Course Test Not Implemented");
    }

    /**
     * Function for performing an affliction diagnosis test with optional parameters for speaker, actor, token, character, and additional settings like skipping dialog or hiding chat. Displays a warning notification if the test is not implemented.
     *
     * @param {*} speaker
     * @param {*} actor
     * @param {*} token
     * @param {*} character
     * @param {{ skipDialog?: boolean; noChat?: boolean; type?: string; title?: string; }} [param0={}]
     * @param {boolean} [param0.skipDialog=false]
     * @param {boolean} [param0.noChat=false]
     * @param {string} [param0.type=`${this.type}-${this.name}-treatment-test`]
     * @param {string} [param0.title=`${this.item.label} Treatment Test`]
     * @param {{}} param0....scope
     */
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
        ui.notifications?.warn("Affliction Diagnosis Test Not Implemented");
    }

    /**
     * A function named treatmentTest that takes multiple parameters including speaker, actor, token, character, and additional configuration options like skipDialog, noChat, type, and title. It sets default values for speaker, actor, token, and character using SohlMacro.getExecuteDefaults. It displays a warning notification for an affliction treatment test that is not implemented yet.
     *
     * @param {*} speaker
     * @param {*} actor
     * @param {*} token
     * @param {*} character
     * @param {{ skipDialog?: boolean; noChat?: boolean; type?: string; title?: string; }} [param0={}]
     * @param {boolean} [param0.skipDialog=false]
     * @param {boolean} [param0.noChat=false]
     * @param {string} [param0.type=`${this.type}-${this.name}-treatment-test`]
     * @param {string} [param0.title=`${this.item.label} Treatment Test`]
     * @param {{}} param0....scope
     */
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
        ui.notifications?.warn("Affliction Treatment Test Not Implemented");
    }

    /**
     * A function that performs a healing test for a character, potentially skipping dialogue and chat messages. It sets default values for speaker, actor, token, and character. Displays a warning notification if the affliction healing test is not implemented.
     *
     * @param {*} speaker
     * @param {*} actor
     * @param {*} token
     * @param {*} character
     * @param {{ skipDialog?: boolean; noChat?: boolean; type?: string; title?: string; }} [param0={}]
     * @param {boolean} [param0.skipDialog=false]
     * @param {boolean} [param0.noChat=false]
     * @param {string} [param0.type=`${this.type}-${this.name}-healing-test`]
     * @param {string} [param0.title=`${this.item.label} Healing Test`]
     * @param {{}} param0....scope
     */
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
        ui.notifications?.warn("Affliction Healing Test Not Implemented");
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
        this.$healingRate = new CONFIG.ValueModifier({}, { parent: this });
        if (this.healingRateBase === -1) {
            this.$healingRate.disabled = game.sohl?.MOD.NoHealRate;
        } else {
            this.$healingRate.setBase(this.healingRateBase);
        }
        this.$contagionIndex = new CONFIG.ValueModifier(
            {},
            { parent: this },
        ).setBase(this.contagionIndexBase);
        this.$level = new CONFIG.ValueModifier({}, { parent: this }).setBase(
            this.levelBase,
        );
    }
}
