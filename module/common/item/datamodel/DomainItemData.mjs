import { _l } from "./sohl-localize.mjs";
import { PhilosophyItemData } from "./PhilosophyItemData.mjs";
import { fields } from "../sohl-common.mjs";
import { SohlItemData } from "./SohlItemData.mjs";

export class DomainItemData extends SohlItemData {
    $category;

    /** @inheritdoc */
    static metadata = Object.freeze(
        sohl.utils.mergeObject(
            super.metadata,
            {
                name: "domain",
                locId: "DOMAIN",
                iconCssClass: "fas fa-sparkle",
                img: "systems/sohl/assets/icons/sparkle.svg",
                sheet: "systems/sohl/templates/item/domain-sheet.hbs",
                nestOnly: true,
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    static defineSchema() {
        return sohl.utils.mergeObject(
            super.defineSchema(),
            {
                abbrev: new fields.StringField({
                    initial: "",
                    label: _l("Abbreviation"),
                }),
                cusp: new fields.StringField(),
                magicMod: new fields.ArrayField(),
                embodiments: new fields.ArrayField(),
            },
            { inplace: false },
        );
    }

    prepareBaseData() {
        super.prepareBaseData();
        if (this.item.nestedIn?.system instanceof PhilosophyItemData) {
            this.$category = this.item.nestedIn.system.category;
        }
    }

    processSiblings() {
        super.processSiblings();

        if (this.$category) {
            // Load up the domain lists
            this.actor.system.$domains[this.$category] ??= [];
            this.actor.system.$domains[this.$category].push(this.item);
        }
    }
}
