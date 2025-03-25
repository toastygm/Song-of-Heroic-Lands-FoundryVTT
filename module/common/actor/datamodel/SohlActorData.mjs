import { SohlContextMenu } from "@module/common/helper/SohlContextMenu.mjs";
import { SohlFunctionField } from "@module/common/helper/SohlFunctionField.mjs";
import { SohlActor } from "@module/common/actor/SohlActor.mjs";
import { EventItemData } from "@module/common/item/datamodel/EventItemData.mjs";
import { ContainerGearItemData } from "@module/common/item/datamodel/ContainerGearItemData.mjs";
import { SohlBaseData } from "@module/common/abstract/SohlBaseData.mjs";

export class SohlActorData extends SohlBaseData {
    /**
     * Virtual items either inherited or synthesized
     *
     * @type {Collection}
     */
    #virtualItems;

    /**
     * Represents the weight of gear being carried by an actor.
     *
     * @type {ValueModifier}
     */
    $gearWeight;

    /**
     * Indicates whether the setup process has been completed.
     *
     * @type {boolean}
     */
    $isSetup;

    $initiativeRank;

    /** @inheritdoc */
    static ACTION = Object.freeze({
        RESOLVEIMPACT: {
            id: "resolveImpact",
            contextIconClass: "fas fa-person-burst",
            contextCondition: true,
            contextGroup: SohlContextMenu.SORT_GROUPS.GENERAL,
            useAsync: true,
        },

        DISPATCHOPPOSEDRESUME: {
            id: "dispatchOpposedResume",
            contextIconClass: "fas fa-people-arrows",
            contextCondition: false,
            contextGroup: SohlContextMenu.SORT_GROUPS.HIDDEN,
            useAsync: true,
        },
    });

    static metadata = Object.freeze({
        locId: "ACTORDATA",
        img: "icons/svg/item-bag.svg",
        sheet: "systems/sohl/templates/actor/actor-sheet.hbs",
        actions: this.genActions(this.ACTION, "ACTORDATA"),
    });

    static TYPE_LABEL = `TYPE.Actor.${this.metadata.name}`;

    /** @inheritdoc */
    static get parentDocumentClass() {
        return SohlActor;
    }

    get virtualItems() {
        if (!this.#virtualItems) this.#virtualItems = new Collection();
        return this.#virtualItems;
    }

    get initiativeRank() {
        return this.$initiativeRank;
    }

    getEvent(eventTag) {
        return this.actor.items.find(
            (it) =>
                it.system instanceof EventItemData &&
                it.system.tag === eventTag,
        );
    }

    /** @override */
    static defineSchema() {
        if (!this._sohlDataSchema) {
            this._sohlDataSchema = sohl.utils.mergeObject(
                super.defineSchema(),
                {
                    bioImage: new fields.FilePathField({
                        categories: ["IMAGE"],
                        initial: CONST.DEFAULT_TOKEN,
                    }),
                    description: new fields.HTMLField(),
                    biography: new fields.HTMLField(),
                },
            );
        }
        return this._sohlDataSchema;
    }

    /** @override */
    prepareBaseData() {
        // The maximum weights here are totally arbitrary.  To get reasonable values,
        // it is expected for the actor to have a "capacity" trait that sets these
        // values correctly.
        class GearWeightModifier extends CONFIG.ValueModifier {
            static defineSchema() {
                return sohl.utils.mergeObject(super.defineSchema(), {
                    maxFight: new fields.NumberField({
                        integer: true,
                        nullable: false,
                        min: 0,
                        initial: 50,
                    }),
                    max: new fields.NumberField({
                        integer: true,
                        nullable: false,
                        min: 0,
                        initial: 75,
                    }),
                    value: new SohlFunctionField({
                        initial: (thisVM) => {
                            return Math.round(thisVM.effective * 1000) / 1000;
                        },
                    }),
                    status: new SohlFunctionField({
                        initial: (thisVM) => {
                            if (thisVM.effective > thisVM.max.effective)
                                return ContainerGearItemData.status
                                    .OverCapacity;
                            else if (
                                thisVM.effective > thisVM.maxFight.effective
                            )
                                return ContainerGearItemData.status
                                    .OverFightCapacity;
                            else return ContainerGearItemData.status.Ok;
                        },
                    }),
                });
            }
        }

        super.prepareBaseData();
        this.$initiativeRank = 0;
        this.$collection = new Collection();
        this.$gearWeight = new GearWeightModifier({}, { parent: this });
        this.$magicMod = {};
    }

    checkExpired() {
        for (const it of this.actor.allItems()) {
            it.system.checkExpired();
        }
    }
}
