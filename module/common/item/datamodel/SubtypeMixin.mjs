import { _l } from "./sohl-localize.mjs";
import { Utility } from "./utility.mjs";
import { fields } from "../sohl-common.mjs";

export function SubtypeMixin(Base) {
    return class SubtypeExtension extends Base {
        /** @inheritdoc */
        static metadata = Object.freeze(
            sohl.utils.mergeObject(
                super.metadata,
                {
                    locId: "SUBTYPE",
                    subTypes: "",
                },
                { inplace: false },
            ),
        );

        static get SUBTYPE() {
            return this.metadata.subType;
        }

        get SUBTYPE() {
            return this.constructor.SUBTYPE;
        }

        get label() {
            return game.i18n.format("SOHL.SohlBaseData.labelWithSubtype", {
                name: this.parent.name,
                typeLabel: _l(this.constructor.metadata.label),
                subType: _l(
                    `SOHL.${this.constructor.metadata.locId}.SUBTYPE.${this.subType}`,
                ),
            });
        }

        static defineSchema() {
            return sohl.utils.mergeObject(
                super.defineSchema(),
                {
                    subType: new fields.StringField({
                        initial: this.metadata.defaultSubtype,
                        required: true,
                        choices: Utility.getChoicesMap(
                            this.metadata.subTypes,
                            `SOHL.${this.metadata.locId}.SUBTYPE`,
                        ),
                    }),
                },
                { inplace: false },
            );
        }
    };
}
