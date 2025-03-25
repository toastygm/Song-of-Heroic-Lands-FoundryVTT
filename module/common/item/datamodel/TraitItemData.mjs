/** @typedef {import("@league-of-foundry-developers/foundry-vtt-types")} */
import { Utility } from "@module/common/helper/utility.mjs";
import { ValueModifier } from "@module/common/modifier/ValueModifier.mjs";
import { MasteryLevelItemData } from "@module/common/item/datamodel/MasteryLevelItemData.mjs";
import { SkillBase } from "@module/common/abstract/SkillBase.mjs";
import { SohlItemData } from "@module/common/item/datamodel/SohlItemData.mjs";
import { SubtypeMixin } from "@module/common/item/datamodel/SubtypeMixin.mjs";
import { SohlItem } from "../SohlItem.mjs";
const {
    ObjectField,
    SchemaField,
    StringField,
    NumberField,
    BooleanField,
    ArrayField,
} = foundry.data.fields;

/**
 * @typedef {Object} ValueDesc
 * @property {string} label
 * @property {number} maxValue
 */

/**
 * @typedef {MasteryLevelItemDataSchema} TraitItemDataSchema
 * @property {string} textValue
 * @property {number} max
 * @property {boolean} isNumeric
 * @property {string} intensity
 * @property {Array<ValueDesc>} valueDesc
 * @property {Record<string, string>} choices
 */

/**
 * Represents a specialized data model for a "Trait" item in the system, extending functionality
 * from `MasteryLevelItemData` and incorporating additional properties and methods specific to traits.
 *
 * Traits can represent various attributes, impulses, disorders, or other characteristics of an entity.
 * This class provides mechanisms for defining schema, preparing data, and processing relationships
 * between traits and other game elements.
 *
 * Key Features:
 * - Defines static properties for effect keys and intensity levels.
 * - Provides schema definitions for various trait properties such as `textValue`, `max`, `isNumeric`,
 *   `intensity`, `valueDesc`, and `choices`.
 * - Implements methods for preparing base data, processing sibling items, and post-processing
 *   relationships with other game elements.
 * - Supports numeric and non-numeric traits, with additional functionality for attributes.
 * - Includes intrinsic actions and default actions based on trait intensity and numeric status.
 *
 * Properties:
 * - `$valueDesc`: Holds a sorted array of value descriptions for numeric traits.
 * - `$score`: Represents the score value of the trait, including modifiers and display logic.
 *
 * Static Properties:
 * - `EFFECT_KEYS`: Immutable object defining keys for different effects (e.g., SCORE, TEXTVALUE).
 * - `INTENSITY`: Immutable object defining intensity levels (e.g., TRAIT, IMPULSE, DISORDER, ATTRIBUTE).
 * - `metadata`: Metadata defining the trait's name, icon, schema version, and other attributes.
 *
 * Methods:
 * - `displayVal`: Computes the display value of the trait based on its type and conditions.
 * - `defaultAction`: Retrieves the default action for the trait based on its intensity and numeric status.
 * - `getIntrinsicActions`: Retrieves intrinsic actions for the trait, delegating to the superclass if necessary.
 * - `defineSchema`: Defines the schema for the trait, merging with the superclass schema.
 * - `prepareBaseData`: Prepares base data for the trait, including initializing `$valueDesc` and `$score`.
 * - `processSiblings`: Processes sibling items, handling specific logic for traits with certain abbreviations.
 * - `postProcess`: Handles post-processing logic, including updating mastery levels and handling attribute-based traits.
 *
 * Usage:
 * This class is intended to be used within the Foundry VTT system for managing traits and their interactions
 * with other game elements. It provides a robust framework for defining, modifying, and displaying traits
 * in a structured and extensible manner.
 *
 * @extends {MasteryLevelItemData}
 * @implements {TraitItemDataSchema}
 * @property {Array<ValueDesc>} $valueDesc -
 * @property {ValueModifier} $score - The score value of the trait, including modifiers and display logic.
 * @property {Record<string, EffectKey>} EFFECT_KEYS - Immutable object defining keys for different effects.
 * @property {Record<string, string>} INTENSITY - Immutable object defining intensity levels.
 * @property {DataModelMetadata} metadata - Metadata defining the trait's name, icon, schema version, and other attributes.
 */
export class TraitItemData extends SubtypeMixin(MasteryLevelItemData) {
    /** @type {Optional<string>} */ textValue;
    /** @type {Optional<number>} */ max;
    /** @type {Optional<boolean>} */ isNumeric;
    /** @type {Optional<string>} */ intensity;
    /** @type {OptArray<ValueDesc>} */ valueDesc;
    /** @type {Optional<Record<string, string>>} */ choices;

    /**
     * A sorted array of value descriptions for numeric traits.
     *
     * @type {OptArray<ValueDesc>}
     */
    $valueDesc;

    /**
     * Represents the score value of an entity.
     *
     * @type {Optional<ValueModifier>}
     */
    $score;

    static EFFECT_KEYS = Object.freeze({
        SCORE: { id: "score", path: "system.$score", abbrev: "Score" },
        TEXTVALUE: {
            id: "textValue",
            path: "system.textValue",
            abbrev: "Text",
        },
    });

    static INTENSITY = Object.freeze({
        TRAIT: "trait",
        IMPULSE: "impulse",
        DISORDER: "disorder",
        ATTRIBUTE: "attribute",
    });

    static metadata = Object.freeze(
        sohl.utils.mergeObject(
            super.metadata,
            {
                name: "trait",
                locId: "TRAIT",
                iconCssClass: "fas fa-user-gear",
                img: "systems/sohl/assets/icons/user-gear.svg",
                sheet: "systems/sohl/templates/item/trait-sheet.hbs",
                nestOnly: false,
                effectKeys: this.genEffectKeys(this.EFFECT_KEYS, "TRAIT"),
                actions: SohlItemData.metadata.actions,
                defaultAction: SohlItemData.metadata.defaultAction,
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

    /**
     * Retrieves the display value of the trait item.
     * If the item is numeric, it returns the display value of the associated score.
     * Otherwise, it checks if the text value corresponds to a valid choice and returns the associated display value.
     *
     * @returns {string} The display value of the trait item.
     */
    get displayVal() {
        let result;
        if (this.isNumeric) {
            result = String(this.$score || 0);
        } else {
            result = this.choices?.[this.textValue ?? ""] ?? "";
        }
        return result;
    }

    /**
     * @override
     * @inheritdoc
     */
    static defineSchema() {
        return sohl.utils.mergeObject(super.defineSchema(), {
            textValue: new StringField(),
            max: new NumberField({
                integer: true,
                nullable: true,
                initial: null,
            }),
            isNumeric: new BooleanField({ initial: false }),
            intensity: new StringField({
                initial: this.INTENSITY.TRAIT,
                required: true,
                choices: Utility.getChoicesMap(
                    this.INTENSITY,
                    "SOHL.TRAIT.INTENSITY",
                ),
            }),
            valueDesc: new ArrayField(
                new SchemaField({
                    label: new StringField({
                        blank: false,
                        required: true,
                    }),
                    maxValue: new NumberField({
                        integer: true,
                        required: true,
                        initial: 0,
                    }),
                }),
            ),
            choices: new ObjectField(),
        });
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
        this.$valueDesc = (this.valueDesc ?? [])
            .concat()
            .sort((a, b) => a.maxValue - b.maxValue);
        this.$score = new ValueModifier(
            {
                properties: {
                    valueDesc: this._getScoreValueDesc.bind(this),
                    max: this.max ?? 0,
                    displayVal: this._getScoreDisplayVal.bind(this),
                },
            },
            { parent: this },
        );

        if (this.isNumeric) {
            const scoreVal = Number.parseInt(this.textValue ?? "0", 10);
            this.$score.base = scoreVal;
            if (this.intensity === "attribute") {
                this.$masteryLevel.setEnabled();
                this.$masteryLevel.fate.setEnabled();
                this.$masteryLevel.setBase(scoreVal * 5);
            }
            this.$skillBase = new SkillBase(this.skillBaseFormula ?? "", [
                this,
            ]);
        } else {
            this.$score.disabled = game.sohl?.MOD.NotNumNoScore;
            this.$masteryLevel.disabled = game.sohl?.MOD.NotNumNoML;
            this.$masteryLevel.fate.disabled = game.sohl?.MOD.NotNumNoFate;
        }
    }

    _getScoreDisplayVal(thisVM) {
        let result = thisVM.effective;
        const traitDesc = thisVM.valueDesc;
        if (traitDesc) result += ` (${traitDesc})`;
        if (typeof thisVM.max === "number") {
            result += ` [max: ${thisVM.max}]`;
        }
        return result;
    }

    _getScoreValueDesc() {
        let desc = "";
        const len = this.$valueDesc.length;
        for (let i = 0; !desc && i < len; i++) {
            if (this.effective <= this.$valueDesc[i].maxValue) {
                desc = this.$valueDesc[i].label;
                break;
            }
        }
        return desc;
    }

    /** A function that processes siblings. It invokes the superclass method to process siblings and checks if the 'abbrev' property is equal to 'ss'. If 'abbrev' is 'ss', it sets the 'magicDomain' variable by finding a domain in the actor's itemTypes with a matching 'abbrev', then assigns a magicMod value to the actor's system property based on the found domain's system. */
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
                                game.sohl?.MOD.MasteryLevelAttrBoost,
                                this.$score.modifier * numOccurances * 5,
                                { attr: this.item.name },
                            );
                        }
                    }
                }
            }
        } else {
            this.$masteryLevel.disabled = game.sohl?.MOD.TraitNotAttrNoML;
        }

        if (this.abbrev === "fate") {
            if (this.actor.system.$magicMod.spirit) {
                this.$masteryLevel.add(
                    game.sohl?.MOD.SunsignModifier,
                    this.actor.system.$magicMod.spirit,
                );
            }
        }
    }
}
