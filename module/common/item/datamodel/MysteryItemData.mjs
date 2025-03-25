import { _l } from "../../helper/sohl-localize.mjs";
import { Utility } from "../../helper/utility.mjs";
import { fields } from "../../../sohl-common.mjs";
import { SohlItemData } from "./SohlItemData.mjs";

export class MysteryItemData extends SohlItemData {
    $level;
    $charges;
    $domainLabel;
    $paramLabel;

    static EFFECT_KEYS = Object.freeze({
        LEVEL: { id: "level", path: "system.$level", abbrev: "Lvl" },
        LENGTH: { id: "length", path: "system.$length", abbrev: "Len" },
        CHARGES: { id: "charges", path: "system.$charges", abbrev: "Cgs" },
        CHARGESMAX: {
            id: "chargesMax",
            path: "system.$charges.max",
            abbrev: "MaxCgs",
        },
    });

    static CATEGORY = Object.freeze({
        GRACE: "grace",
        PIETY: "piety",
        FATE: "fate",
        FATEBONUS: "fateBonus",
        FATEPOINTBONUS: "fatePointBonus",
        BLESSING: "blessing",
        ANCESTOR: "ancestor",
        TOTEM: "totem",
    });

    static DOMAIN_VALUE = Object.freeze({
        DIVINE: "divinedomain",
        SKILL: "skill",
        CREATURE: "creature",
        NONE: "none",
    });

    static DOMAINMAP = Object.freeze({
        [this.GRACE]: this.DOMAIN_VALUE.DIVINE,
        [this.PIETY]: this.DOMAIN_VALUE.DIVINE,
        [this.FATE]: this.DOMAIN_VALUE.SKILL,
        [this.FATEBONUS]: this.DOMAIN_VALUE.SKILL,
        [this.FATEPOINTBONUS]: this.DOMAIN_VALUE.NONE,
        [this.BLESSING]: this.DOMAIN_VALUE.DIVINE,
        [this.ANCESTOR]: this.DOMAIN_VALUE.SKILL,
        [this.TOTEM]: this.DOMAIN_VALUE.CREATURE,
    });

    /** @inheritdoc */
    static metadata = Object.freeze(
        sohl.utils.mergeObject(
            super.metadata,
            {
                name: "mystery",
                locId: "MYSTERY",
                iconCssClass: "fas fa-sparkles",
                img: "systems/sohl/assets/icons/sparkles.svg",
                sheet: "systems/sohl/templates/item/mystery-sheet.hbs",
                nestOnly: false,
                effectKeys: this.genEffectKeys(this.EFFECT_KEYS, "MYSTERY"),
            },
            { inplace: false },
        ),
    );

    get fieldData() {
        const domainValueKey =
            this.constructor.DOMAIN_MAP[this.config.category];

        let field = "";
        switch (domainValueKey) {
            case this.DOMAIN_VALUE.SKILLS:
                if (this.skills.size) {
                    const formatter = game.i18n.getListFormatter();

                    field = formatter.format(
                        Utility.sortStrings(Array.from(this.skills.values())),
                    );
                } else {
                    field = _l("SOHL.AllSkills");
                }
                break;

            case this.DOMAIN_VALUE.DIVINE:
                if (!this.item.actor) return this.domain;
                field = this.item.actor.system.$domains.divine.find(
                    (d) => d.system.abbrev === this.domain,
                )?.name;
                break;

            case this.DOMAIN_VALUE.CREATURE:
                if (!this.item.actor) return this.domain;
                field = this.item.actor.system.$domains.spirit.find(
                    (d) => d.system.abbrev === this.domain,
                )?.name;
                break;
        }
        return (
            field ||
            _l("SOHL.MYSTERY.UnknownDomain", { domainName: this.domain })
        );
    }

    static defineSchema() {
        return sohl.utils.mergeObject(
            super.defineSchema(),
            {
                config: new fields.SchemaField({
                    usesCharges: new fields.BooleanField({ initial: false }),
                    usesSkills: new fields.BooleanField({ initial: false }),
                    assocPhilosophy: new fields.StringField(),
                    category: new fields.StringField({
                        initial: this.CATEGORY.GRACE,
                        required: true,
                        choices: Utility.getChoicesMap(
                            this.CATEGORY,
                            "SOHL.MASTERYLEVEL.CATEGORY",
                        ),
                    }),
                }),
                domain: new fields.StringField(),
                skills: new fields.ArrayField(
                    new fields.StringField({
                        required: true,
                        blank: false,
                    }),
                ),
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
        this.$label = "";
        this.$charges = new CONFIG.ValueModifier(
            {
                properties: {
                    max: new CONFIG.ValueModifier({}, { parent: this }),
                },
            },
            { parent: this },
        );
        if (!this.charges.usesCharges) {
            this.$charges.disabled = game.sohl?.MOD.NoCharges;
            this.$charges.max.disabled = game.sohl?.MOD.NoCharges;
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
    }
}
