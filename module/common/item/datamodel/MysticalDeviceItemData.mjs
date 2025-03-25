import { Utility } from "../../helper/utility.mjs";
import { fields } from "../../../sohl-common.mjs";
import { SohlItemData } from "./SohlItemData.mjs";

export class MysticalDeviceItemData extends SohlItemData {
    static CATEGORY = Object.freeze({
        ARTIFACT: "artifact",
        ANCESTOR_TALISMAN: "ancestortalisman",
        TOTEM_TALISMAN: "totemtalisman",
        REMNANT: "remnant",
        RELIC: "relic",
    });

    /** @inheritdoc */
    static metadata = Object.freeze(
        sohl.utils.mergeObject(
            super.metadata,
            {
                name: "mysticaldevice",
                locId: "MYSTICALDEVICE",
                iconCssClass: "fas fa-wand-sparkles",
                img: "systems/sohl/assets/icons/magic-wand.svg",
                sheet: "systems/sohl/templates/item/mysticaldevice-sheet.hbs",
                nestOnly: true,
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    static defineSchema() {
        return sohl.utils.mergeObject(super.defineSchema(), {
            config: new fields.SchemaField({
                requiresAttunement: new fields.BooleanField({ initial: false }),
                usesVolition: new fields.BooleanField({ initial: false }),
                category: new fields.StringField({
                    required: true,
                    initial: this.CATEGORY.ARTIFACT,
                    choices: Utility.getChoicesMap(
                        this.CATEGORY,
                        "SOHL.MYSTICALDEVICE.CATEGORY",
                    ),
                }),
                assocPhilosophy: new fields.StringField(),
            }),
            domain: new fields.StringField(),
            isAttuned: new fields.BooleanField({ initial: false }),
            volition: new fields.SchemaField({
                ego: new fields.NumberField({
                    integer: true,
                    initial: 0,
                    min: 0,
                }),
                morality: new fields.NumberField({
                    integer: true,
                    initial: 0,
                    min: 0,
                }),
                purpose: new fields.StringField(),
            }),
        });
    }
}
