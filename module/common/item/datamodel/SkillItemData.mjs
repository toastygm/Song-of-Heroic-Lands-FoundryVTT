import { Utility } from "./utility.mjs";
import { MasteryLevelItemData } from "./item/datamodel/MasteryLevelItemData.mjs";
import { fields } from "../sohl-common.mjs";
import { SubtypeMixin } from "./SubtypeMixin.mjs";

export class SkillItemData extends SubtypeMixin(MasteryLevelItemData) {
    static COMBAT = Object.freeze({
        NONE: "none",
        ALL: "all",
        MELEE: "melee",
        MISSILE: "missile",
        MELEEMISSILE: "meleemissile",
        MANEUVER: "maneuver",
        MELEEMANEUVER: "meleemaneuver",
    });

    /** @inheritdoc */
    static metadata = Object.freeze(
        sohl.utils.mergeObject(
            super.metadata,
            {
                name: "skill",
                locId: "SKILL",
                iconCssClass: "fas fa-head-side-gear",
                img: "systems/sohl/assets/icons/head-gear.svg",
                sheet: "systems/sohl/templates/item/skill-sheet.hbs",
                nestOnly: false,
                subTypes: {
                    SOCIAL: "social",
                    NATURE: "nature",
                    CRAFT: "craft",
                    LORE: "lore",
                    LANGUAGE: "language",
                    SCRIPT: "script",
                    RITUAL: "ritual",
                    PHYSICAL: "physical",
                    COMBAT: "combat",
                    ESOTERIC: "esoteric",
                },
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    get magicMod() {
        let mod;
        switch (this.subType) {
            case this.SUBTYPE.SOCIAL:
                mod = this.actor.system.$magicMod.water;
                break;
            case this.SUBTYPE.NATURE:
                mod = this.actor.system.$magicMod.earth;
                break;
            case this.SUBTYPE.CRAFT:
                mod = this.actor.system.$magicMod.metal;
                break;
            case this.SUBTYPE.LORE:
                mod = this.actor.system.$magicMod.spirit;
                break;
            case this.SUBTYPE.LANGUAGE:
                mod = this.actor.system.$magicMod.social;
                break;
            case this.SUBTYPE.SCRIPT:
                mod = this.actor.system.$magicMod.lore;
                break;
            case this.SUBTYPE.RITUAL:
                mod = this.actor.system.$magicMod.lore;
                break;
            case this.SUBTYPE.PHYSICAL:
                mod = this.actor.system.$magicMod.air;
                break;
            case this.SUBTYPE.COMBAT:
                mod = this.actor.system.$magicMod.fire;
                break;
        }
        return mod || 0;
    }

    /**
     * weaponGroup: the type of combat weapon this skill applies to
     * actionBodyParts: Which body part impairments apply to this
     *     skill. A value of "Any" indicates all body parts affect
     *     this skill.
     *
     * @override
     */
    static defineSchema() {
        return sohl.utils.mergeObject(super.defineSchema(), {
            weaponGroup: new fields.StringField({
                initial: this.COMBAT.NONE,
                blank: false,
                choices: Utility.getChoicesMap(
                    this.COMBAT,
                    "SOHL.SKILL.COMBAT",
                ),
            }),
            baseSkill: new fields.StringField(),
            domain: new fields.StringField(),
        });
    }

    prepareBaseData() {
        super.prepareBaseData();
        if (this.abbrev === "init") {
            this.actor.system.$initiativeRank = this.masteryLevelBase || 0;
        }
    }
}
