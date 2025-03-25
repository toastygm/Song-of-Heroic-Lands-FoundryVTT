import { ImpactModifier } from "../modifier/ImpactModifier.mjs";
import { fields } from "./sohl-common.mjs";
import { TestResult } from "../TestResult.mjs";

export class ImpactResult extends TestResult {
    /** @inheritdoc */
    static metadata = Object.freeze({
        name: "ImpactResult",
        locId: "IMPACTRESULT",
        schemaVersion: "0.5.6",
    });

    get item() {
        return this.impactMod.parent.item;
    }

    constructor(data = {}, context = {}) {
        super(data, context);
        if (!data.impactMod) {
            throw new Error("impactMod is required");
        }
    }

    _initialize(options = {}) {
        if (this._source.roll) {
            Object.defineProperty(this, "roll", {
                value: Roll.fromData(this._source.roll),
                writable: false,
            });
        }

        super._initialize(options);
    }

    static defineSchema() {
        return sohl.utils.mergeObject(super.defineSchema, {
            impactMod: new fields.EmbeddedDataField(ImpactModifier),
            roll: new fields.ObjectField(),
        });
    }
}
