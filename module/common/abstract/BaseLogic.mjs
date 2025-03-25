/**
 * @typedef {Record<string, any>} PlainObject
 * @typedef {BaseLogic<LogicCompatibleDataModel>} AnyLogic
 * @typedef {BaseLogicOptions<LogicCompatibleDataModel>} AnyLogicOptions
 */

/**
 * Base class for all Logic classes in SOHL.
 *
 * @template {LogicCompatibleDataModel} TDataModel
 * @class
 */
export class BaseLogic {
    /** @type {StrictObject<string>} */
    static metadata = Object.freeze({
        name: "BaseLogic",
        schemaVersion: "0.5.6",
    });

    /** @type {LogicCompatibleDataModel} */
    _parent;

    /** @type {AnyLogic[]} */
    _nestedLogic;

    /** @type {AnyAction[]} */
    _actions;

    /**
     * @param {PlainObject} [data={}] - Initial logic state (typically deserialized from JSON)
     * @param {AnyLogicOptions} [options={}] - Options including parent
     */
    constructor(data = {}, { parent } = {}) {
        if (!parent) throw new Error("Logic classes require a parent");

        this._parent = parent;
        this._nestedLogic =
            data.nestedLogic ?
                data.nestedLogic.map(
                    /** @param{PlainObject} logic */
                    (logic) => BaseLogic.fromData(logic),
                )
            :   [];
        this._actions =
            data.actions ?
                data.actions.map(
                    /** @param{PlainObject} action */
                    (action) => ActionLogic.fromData(action),
                )
            :   [];
    }

    get metadata() {
        return /** @type {{ metadata: PlainObject }} */ (
            /** @type {unknown} */ (this.constructor)
        ).metadata;
    }

    /**
     * Gets the parent object associated with this instance.
     * @type {LogicCompatibleDataModel} The parent object.
     */
    get parent() {
        return this._parent;
    }

    /**
     * Push the current logic state into Foundry via update().
     * @returns {Promise<void>}
     */
    async flush() {
        const path = "system.logic";
        const data = this.toJSON();
        await this.parent.parent.update({ [path]: data });
    }

    /**
     * Convert this logic instance into a JSON-compatible object for persistence.
     * Subclasses may override this to customize which properties are saved.
     * @returns {JSONObject}
     */
    toJSON() {
        const data = {
            schemaName: this.metadata.name,
            schemaVersion: this.metadata.schemaVersion,
        };
        return data;
    }

    /**
     * Create a Logic instance from previously serialized data.
     * @param {JSONObject} data
     * @param {AnyLogicOptions} [options]
     * @returns {AnyLogic}
     */
    static fromData(data, options = {}) {
        return new this(data, options);
    }
}
