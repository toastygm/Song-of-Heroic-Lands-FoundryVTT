import { GearItemData } from "./GearItemData.mjs";
import { fields } from "../sohl-common.mjs";

export class ArmorGearItemData extends GearItemData {
    $protection;
    $traits;

    static EFFECT_KEYS = Object.freeze({
        BLUNT: {
            id: "blunt",
            path: "system.$protection.blunt",
            abbrev: "Blunt",
        },
        PIERCING: {
            id: "piercing",
            path: "system.$protection.piercing",
            abbrev: "Piercing",
        },
        EDGED: {
            id: "edged",
            path: "system.$protection.edged",
            abbrev: "Edged",
        },
        FIRE: { id: "fire", path: "system.$protection.fire", abbrev: "Fire" },
    });

    /** @inheritdoc */
    static metadata = Object.freeze(
        sohl.utils.mergeObject(
            super.metadata,
            {
                name: "armorgear",
                locId: "ARMORGEAR",
                iconCssClass: "fas fa-shield-halved",
                img: "systems/sohl/assets/icons/armor.svg",
                sheet: "systems/sohl/templates/item/armorgear-sheet.hbs",
                effectKeys: this.genEffectKeys(this.EFFECT_KEYS, "ARMORGEAR"),
                nestOnly: false,
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    get equipped() {
        return this.isEquipped;
    }

    static defineSchema() {
        return sohl.utils.mergeObject(super.defineSchema(), {
            material: new fields.StringField(),
            locations: new fields.SchemaField({
                flexible: new fields.ArrayField(new fields.StringField()),
                rigid: new fields.ArrayField(new fields.StringField()),
            }),
        });
    }

    processSiblings() {
        super.processSiblings();
        this.$protection = {};
        this.$traits = {};
    }
}
