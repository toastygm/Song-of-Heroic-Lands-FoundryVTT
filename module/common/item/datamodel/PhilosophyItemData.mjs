import { SOHL_VARIANTS } from "../../helper/constants.mjs";
import { _l } from "../../helper/sohl-localize.mjs";
import { Utility } from "../../helper/utility.mjs";
import { fields } from "../../../sohl-common.mjs";
import { SohlItemData } from "./SohlItemData.mjs";

export class PhilosophyItemData extends SohlItemData {
    /** @inheritdoc */
    static metadata = Object.freeze(
        sohl.utils.mergeObject(
            super.metadata,
            {
                name: "philosophy",
                locId: "PHILOSOPHY",
                iconCssClass: "fas fa-sparkle",
                img: "systems/sohl/assets/icons/sparkle.svg",
                sheet: "systems/sohl/templates/item/philosophy-sheet.hbs",
                nestOnly: false,
                subTypes: SOHL_VARIANTS,
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    static CATEGORY = Object.freeze({
        ARCANE: "arcane",
        DIVINE: "divine",
        SPIRIT: "spirit",
        ASTRAL: "astral",
        NATURAL: "natural",
    });

    get categoriesLabel() {
        const formatter = game.i18n.getListFormatter();
        const list = Utility.sortStrings(
            this.constructor.CATEGORY.values().map((v) =>
                _l(`SOHL.PHILOSOPHY.CATEGORY.${v}`),
            ),
        );
        return formatter.format(list);
    }

    static DIVINE_EMBODIMENT = Object.freeze({
        DREAMS: "dreams",
        DEATH: "death",
        VIOLENCE: "violence",
        PEACE: "peace",
        FERTILITY: "fertility",
        ORDER: "order",
        KNOWLEDGE: "knowledge",
        PROSPERITY: "prosperity",
        FIRE: "fire",
        CREATION: "creation",
        VOYAGER: "voyager",
        DECAY: "decay",
    });

    static ELEMENT = Object.freeze({
        FIRE: "fire",
        WATER: "water",
        EARTH: "earth",
        SPIRIT: "spirit",
        WIND: "wind",
        METAL: "metal",
        ARCANA: "arcana",
    });

    static defineSchema() {
        return sohl.utils.mergeObject(
            super.defineSchema(),
            {
                category: new fields.StringField({
                    required: true,
                    blank: false,
                    label: _l("Category"),
                    choices: PhilosophyItemData.categories,
                }),
            },
            { inplace: false },
        );
    }
}
