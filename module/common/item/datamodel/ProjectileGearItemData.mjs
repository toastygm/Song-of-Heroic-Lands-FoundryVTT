import { Utility } from "../../helper/utility.mjs";
import { GearItemData } from "./GearItemData.mjs";
import { ImpactModifier } from "../../modifier/ImpactModifier.mjs";
import { fields } from "../../../sohl-common.mjs";
import { SubtypeMixin } from "../../SubtypeMixin.mjs";

export class ProjectileGearItemData extends SubtypeMixin(GearItemData) {
    $traits;
    $attack;
    $impact;

    static EFFECT_KEYS = Object.freeze({
        BLUNT: { id: "blunt", path: "system.$traits.blunt", abbrev: "Blunt" },
        BLEED: { id: "bleed", path: "system.$traits.bleed", abbrev: "Bleed" },
    });

    /** @inheritdoc */
    static metadata = Object.freeze(
        sohl.utils.mergeObject(
            super.metadata,
            {
                name: "projectilegear",
                locId: "PROJECTILEGEAR",
                iconCssClass: "fas fa-bow-arrow",
                img: "systems/sohl/assets/icons/arrow.svg",
                sheet: "systems/sohl/templates/item/projectilegear-sheet.hbs",
                effectKeys: this.genEffectKeys(
                    this.EFFECT_KEYS,
                    "PROJECTILEGEAR",
                ),
                subTypes: {
                    NONE: "none",
                    ARROW: "arrow",
                    BOLT: "bolt",
                    BULLET: "bullet",
                    DART: "dart",
                    OTHER: "other",
                },
                nestOnly: false,
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    static defineSchema() {
        return sohl.utils.mergeObject(super.defineSchema(), {
            shortName: new fields.StringField(),
            impactBase: new fields.SchemaField({
                numDice: new fields.NumberField({
                    integer: true,
                    initial: 0,
                    min: 0,
                }),
                die: new fields.NumberField({
                    integer: true,
                    initial: 6,
                    min: 1,
                }),
                modifier: new fields.NumberField({
                    integer: true,
                    initial: -1,
                    min: -1,
                }),
                aspect: new fields.StringField({
                    initial: ImpactModifier.ASPECT.BLUNT,
                    requried: true,
                    choices: Utility.getChoicesMap(
                        ImpactModifier.ASPECT,
                        "SOHL.IMPACTMODIFIER.ASPECT",
                    ),
                }),
            }),
        });
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
        this.$traits = {
            impactTA: 0,
            halfImpact: false,
            extraBleedRisk: false,
        };
        this.$attack = new CONFIG.CombatModifier({}, { parent: this });
        this.$impact = new CONFIG.ImpactModifier(
            {
                properties: {
                    numDice: this.impactBase.numDice,
                    die: this.impactBase.die,
                    aspect: this.impactBase.aspect,
                },
            },
            { parent: this },
        );
        this.$impact.setBase(this.impactBase.modifier);
    }
}
