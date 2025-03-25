import { Utility } from "./utility.mjs";
import { fields } from "../sohl-common.mjs";

export class SohlFunctionField extends fields.JavaScriptField {
    constructor(options = {}, context = {}) {
        super(options, context);
        this.nullable = false;
    }

    /** @inheritdoc */
    static get _defaults() {
        return Object.assign(super._defaults, {
            validationError: "is not a valid Function",
        });
    }

    getInitialValue(_data) {
        if (typeof this.inital === "function") return this.initial;
        else return this._cast(this.initial);
    }

    /** @override */
    _cast(value) {
        if (typeof value === "string" && value)
            return Utility.safeFunctionFactory(value, this.async);
        else if (typeof value === "function") return value;
        else return Utility.safeFunctionFactory("", this.async);
    }

    toObject(value) {
        if (typeof value === "function") return value.toString();
        else return "";
    }
}
