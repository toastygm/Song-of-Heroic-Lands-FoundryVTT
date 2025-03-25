import { Utility } from "../../helper/utility.mjs";
import { MasteryLevelItemData } from "./MasteryLevelItemData.mjs";
import { fields } from "../../../sohl-common.mjs";
import { SkillItemData } from "../../SkillItemData.mjs";
import { SohlItem } from "../SohlItem.mjs";

export class MysticalAbilityItemData extends MasteryLevelItemData {
    $charges;
    $maxCharges;
    $affectedSkill;
    $fatigue;
    $level;
    $canImprove;

    static EFFECT_KEYS = Object.freeze({
        CHARGES: { id: "charges", path: "system.$charges", abbrev: "Cgs" },
        CHARGESMAX: {
            id: "chargesMax",
            path: "system.$charges.max",
            abbrev: "MaxCgs",
        },
        CANIMPROVE: {
            id: "canImprove",
            path: "system.$canImprove",
            abbrev: "Imp",
        },
        LEVEL: { id: "level", path: "system.$level", abbrev: "Lvl" },
    });

    static CATEGORY = Object.freeze({
        SHAMANICRITE: "shamanicrite",
        SPIRITACTION: "spiritaction",
        SPIRITPOWER: "spiritpower",
        BENEDICTION: "benediction",
        DIVINEDEVOTION: "divinedevotion",
        DIVINEINCANTATION: "divineincantation",
        ARCANEINCANTATION: "arcaneincantation",
        ARCANEINVOCATION: "arcaneinvocation",
        ARCANETALENT: "arcanetalent",
        ALCHEMY: "alchemy",
        DIVINATION: "divination",
    });

    static DOMAIN_DEGREE = Object.freeze({
        PRIMARY: { name: "primary", value: 0 },
        SECONDARY: { name: "secondary", value: 1 },
        NEUTRAL: { name: "neutral", value: 2 },
        TERTIARY: { name: "tertiary", value: 3 },
        DIAMETRIC: { name: "diametric", value: 4 },
    });

    /** @inheritdoc */
    static metadata = Object.freeze(
        sohl.utils.mergeObject(
            super.metadata,
            {
                name: "mysticalability",
                locId: "MYSTICALABILITY",
                iconCssClass: "fas fa-hand-sparkles",
                img: "systems/sohl/assets/icons/hand-sparkles.svg",
                sheet: "systems/sohl/templates/item/mysticalability-sheet.hbs",
                nestOnly: false,
                effectKeys: this.genEffectKeys(
                    this.EFFECT_KEYS,
                    "MYSTICALABILITY",
                ),
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    get availableFate() {
        // All of the Mystical Abilities are essentially aura based, so none of them
        // may be Fated.
        return [];
    }

    /**
     * Returns whether this item can be improved by using a mystical ability.
     * Returns true if the subType of the item is one of the following: ArcaneInvocation, DivineInvocation, or ArcaneTalent.
     * Returns false otherwise.
     *
     * @readonly
     * @type {*}
     */
    get canImprove() {
        const result = super.canImprove && this.$canImprove;
        return result;
    }

    /**
     * Defines the schema for a specific entity. This function merges the base schema with additional fields including domain, level, and charges. Each field has its own specifications such as type, initial value, min value, and additional properties for charges. The function returns the merged schema object with the added fields.
     *
     * @static
     * @returns {*}
     */
    static defineSchema() {
        return sohl.utils.mergeObject(
            super.defineSchema(),
            {
                config: new fields.SchemaField({
                    isImprovable: new fields.BooleanField({ initial: false }),
                    assocSkill: new fields.StringField(),
                    category: new fields.StringField(),
                    assocPhilosophy: new fields.StringField(),
                    usesCharges: new fields.BooleanField({ initial: false }),
                }),
                domain: new fields.StringField(),
                levelBase: new fields.NumberField({
                    integer: true,
                    initial: 0,
                    min: 0,
                }),
                charges: new fields.SchemaField({
                    value: new fields.NumberField({
                        integer: true,
                        initial: 0,
                        min: 0,
                    }),
                    // Note: if max charges is 0, then there is no maximum
                    max: new fields.NumberField({
                        integer: true,
                        initial: 0,
                        min: 0,
                    }),
                }),
            },
            { inplace: false },
        );
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
        this.$charges = new CONFIG.ValueModifier(
            {
                properties: {
                    max: new CONFIG.ValueModifier({}, { parent: this }),
                },
            },
            { parent: this },
        );
        if (!this.charges.usesCharges) {
            this.$charges.disabled = game.sohl?.MOD.NoUseCharges;
            this.$charges.max.disabled = game.sohl?.MOD.NoUseCharges;
        } else {
            this.$charges.setBase(this.charges.value);
            this.$charges.max.setBase(this.charges.max);
        }
        this.$level = new CONFIG.ValueModifier(
            {
                properties: {
                    roman: (thisVM) => Utility.romanize(thisVM.effective),
                },
            },
            { parent: this },
        );
        this.$level.setBase(this.levelBase);
        this.$fatigue = new CONFIG.ValueModifier({}, { parent: this });
        this.$fatigue.setBase(this.fatigueBase);
        this.$isImprovable = this.isImprovable;
    }

    setupVirtualItems() {
        super.setupVirtualItems();
        const domain = this.domain.trim();
        if (
            this.config.category ===
                MysticalAbilityItemData.CATEGORY.ANCESTOR &&
            domain
        ) {
            /*
             * Ancestor Spirit Powers are granted as bonuses to a particular skill, whose name
             * is in the "domain" field.  We expect that such a skill must be currently available
             * as a owned item on the Actor.  If for some reason that is not the case, then we
             * we need to create a virtual skill item for that particular skill.
             */
            this.$affectedSkill = null;
            for (const it of this.actor.allItems()) {
                if (it.system instanceof SkillItemData && it.name === domain) {
                    this.$affectedSkill = it;
                    break;
                }
            }

            if (!this.$affectedSkill) {
                // The skill doesn't exist, so we need to create a stand-in skill for it.  This skill
                // will be set to ML 0.  If there is a skill already in the nested items with the exact same
                // name as requested, then we will use that as a template for the skill.
                const item = this.items.find(
                    (it) =>
                        it.system instanceof SkillItemData &&
                        it.name === domain,
                );
                let itemData = item?.toObject();

                if (!itemData) {
                    // Couldn't find the named skill in the nested items, so
                    // create a new one from scratch.
                    itemData = {
                        name: domain,
                        type: SkillItemData.TYPE_NAME,
                    };
                }

                itemData._id = sohl.utils.randomID();

                // Ensure that ML is set to 0
                sohl.utils.setProperty(itemData, "system.masteryLevelBase", 0);

                // Create a new pure virtual skill as a stand-in for the missing skill
                this.$affectedSkill = new SohlItem(itemData, {
                    parent: this.actor,
                    cause: this.item,
                });
            }
        }
    }

    /** @override */
    postProcess() {
        super.postProcess();
        if (this.category === MysticalAbilityItemData.CATEGORY.ANCESTOR) {
            if (this.$affectedSkill) {
                const ml = this.$affectedSkill.system.$masteryLevel;
                let numBoosts = this.$level.effective;
                if (!ml.base) {
                    ml.setBase(this.$affectedSkill.system.skillBase.value);
                    numBoosts--;
                }
                if (numBoosts)
                    this.$affectedSkill.system.applyBoosts(numBoosts);
            }
        }
    }
}
