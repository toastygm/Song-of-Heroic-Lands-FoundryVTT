import { fields } from "../sohl-common.mjs";
import { SohlItemData } from "./SohlItemData.mjs";

export class BodyLocationItemData extends SohlItemData {
    $protection;
    $layers;
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
                name: "bodylocation",
                locId: "BODYLOCATION",
                iconCssClass: "fa-solid fa-hand",
                img: "systems/sohl/assets/icons/hand.svg",
                sheet: "systems/sohl/templates/item/bodylocation-sheet.hbs",
                effectKeys: this.genEffectKeys(
                    this.EFFECT_KEYS,
                    "BODYLOCATION",
                ),
                nestOnly: true,
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    static defineSchema() {
        return sohl.utils.mergeObject(super.defineSchema(), {
            abbrev: new fields.StringField(),
        });
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
        this.$protection = {};
        this.$layers = "";
        this.$traits = {
            isRigid: false,
        };
    }

    /** @override */
    processSiblings() {
        super.processSiblings();

        // Body Location Items should never show up under the actor's "owned" items, they should always be
        // virtual items nested within a BodyPart item.  But let's just ensure that if this is not the
        // case we abandon processing immediately.
        if (this.actor && !this.item.isNested) {
            console.warn(
                `Item ${this.uuid} is a Body Location that is not nested in a Body Part, please correct this`,
            );
        }
    }
}
