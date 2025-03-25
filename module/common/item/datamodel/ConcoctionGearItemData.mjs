import { Utility } from "./utility.mjs";
import { GearItemData } from "./GearItemData.mjs";
import { fields } from "../sohl-common.mjs";
import { SubtypeMixin } from "./SubtypeMixin.mjs";

export class ConcoctionGearItemData extends SubtypeMixin(GearItemData) {
    static POTENCY = Object.freeze({
        NOT_APPLICABLE: "na",
        MILD: "mild",
        STRONG: "strong",
        GREAT: "great",
    });

    /** @inheritdoc */
    static metadata = Object.freeze(
        sohl.utils.mergeObject(
            super.metadata,
            {
                name: "concoctiongear",
                locId: "CONCOCTIONGEAR",
                iconCssClass: "fas fa-flask-round-potion",
                img: "systems/sohl/assets/icons/potion.svg",
                sheet: "systems/sohl/templates/item/concoctiongear-sheet.hbs",
                subTypes: {
                    MUNDANE: "mundane",
                    EXOTIC: "exotic",
                    ELIXIR: "elixir",
                },
                nestOnly: false,
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    static defineSchema() {
        return sohl.utils.mergeObject(super.defineSchema(), {
            potency: new fields.StringField({
                initial: this.POTENCY.NOT_APPLICABLE,
                required: true,
                choices: Utility.getChoicesMap(
                    this.POTENCY,
                    "SOHL.CONCOCTION.POTENCY",
                ),
            }),
            strength: new fields.NumberField({
                integer: true,
                initial: 0,
                min: 0,
            }),
        });
    }
}
