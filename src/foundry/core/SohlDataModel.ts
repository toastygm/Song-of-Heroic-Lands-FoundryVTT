import {
    AnyLogic,
    SohlLogic,
    SohlLogicData,
} from "@module/logic/common/core/SohlLogic";
import { SohlActor } from "../actor/SohlActor";
import { SohlItem } from "../item/SohlItem";
const { ObjectField, StringField, ArrayField, DocumentIdField } =
    foundry.data.fields;

/**
 * Represents the schema for base logic data in the system.
 * This interface extends the Foundry VTT `DataSchema` and includes
 * a `logicObj` property, which can either be of type `SohlLogicData`
 * or any other type.
 *
 * @property logicObj - The logic object associated with this schema.
 *                       It can be of type `SohlLogicData` or any other type.
 */
export interface SohlLogicSchema extends foundry.data.fields.DataSchema {
    logicObj: InstanceType<typeof ObjectField>;
}

/**
 * The `SohlDataModel` class extends the Foundry VTT `TypeDataModel` to provide
 * a structured data model for items in the "Song of Heroic Lands" module. It
 * encapsulates logic and behavior associated with items, offering a schema
 * definition and initialization logic.
 *
 * @template SohlLogicSchema - The schema type for the data model.
 * @template foundry.abstract.Document.Any - The parent document type.
 *
 * @returns {SohlLogicSchema} - The schema definition for the data model.
 */
export class SohlDataModel extends foundry.abstract.TypeDataModel<
    SohlLogicSchema,
    SohlActor | SohlItem
> {
    /**
     * Represents the embedded logic associated with the item.
     */
    private _logic!: AnyLogic;

    /**
     * Represents the serialized logic data associated with the item.
     * This preoperty is not directly used, but is the data used to
     * initialize the `logic` property.
     */
    logicObj!: SohlLogicData;

    /** @inheritdoc */
    override prepareBaseData() {
        super.prepareBaseData();
        this._logic = SohlLogic.fromData(this.logicObj, {
            parent: this,
        });
        this.logic.createVirtualLogics(this.parent);
        this.logic.prepareBaseData();
    }

    override prepareDerivedData() {
        super.prepareDerivedData();
        if (this.parent instanceof SohlActor) {
            const actor: SohlActor = this.parent as SohlActor;
            this.logic.processActions(actor.actions);
            this.logic.processSiblings(actor.logics);
            this.logic.postProcess();
        }
    }

    /**
     * Returns the parent of the data model, which can be either an actor or an item.
     * this is a hack to get around the fact that the parent property from `foundry.abstract.DataModel`
     * is not reconised.
     * @returns {SohlActor | SohlItem} The parent of the data model.
     */
    get parent(): SohlActor | SohlItem {
        // @ts-expect-error: TypeDataModel does have a parent property
        return super.parent;
    }

    /**
     * SohlLogic class static schema definition.
     */
    static defineSchema(): SohlLogicSchema {
        return {
            logicObj: new ObjectField(),
        };
    }

    get logic(): AnyLogic {
        return this.logic;
    }
}
