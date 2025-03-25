import * as abstract from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/module.mjs";
import { NestableDataModelMixin } from "./abstract/NestableDataModelMixin.mjs";
import { fields } from "../sohl-common.mjs";
import { SohlBaseData } from "./SohlBaseData.mjs";

/**
 * Represents a test result data model that extends a nestable data model.
 * This class is used to store and manage test result data, including speaker, title, type, and related entities.
 *
 * @extends {NestableDataModelMixin}
 */
export class TestResult extends NestableDataModelMixin(
    foundry.abstract.DataModel,
) {
    /** @inheritdoc */
    static metadata = Object.freeze(
        sohl.utils.mergeObject(super.metadata, {
            name: "TestResult",
            locId: "TESTRESULT",
            schemaVersion: "0.5.6",
        }),
    );

    /**
     * Defines the schema for the TestResult data model.
     *
     * @returns {Object} The schema definition.
     * @static
     */
    static defineSchema() {
        return {
            name: new fields.StringField({
                initial: this.constructor.baseDataModel,
                readonly: true,
            }),
            speaker: new fields.ObjectField(),
            title: new fields.StringField(),
            type: new fields.StringField(),
        };
    }

    /**
     * Constructs a new TestResult instance.
     *
     * @param {Object} [data={}] - The initial data for the model.
     * @param {Object} [options={}] - Additional options for the model.
     * @throws {Error} If the parent is not of type SohlBaseData.
     */
    constructor(data = {}, options = {}) {
        super(data, options);
        if (!(parent instanceof SohlBaseData)) {
            throw new Error("Parent must be of type SohlBaseData");
        }
    }

    /**
     * Initializes the TestResult instance.
     *
     * @param {Object} [options={}] - Initialization options.
     * @returns {void}
     * @protected
     */
    _initialize(options = {}) {
        if (!this._source.speaker) {
            Object.defineProperty(this, "speaker", {
                value: ChatMessage.getSpeaker(),
                writable: false,
            });
        }

        return super._initialize(options);
    }

    /**
     * Gets the parent document class for the TestResult model.
     *
     * @returns {typeof SohlBaseData} The parent document class.
     * @readonly
     * @static
     */
    static get parentDocumentClass() {
        return SohlBaseData;
    }

    /**
     * Gets the scene associated with the speaker.
     *
     * @returns {Scene|null} The scene object, or null if not available.
     */
    get scene() {
        return this.speaker?.scene ? game.scenes.get(this.speaker.scene) : null;
    }

    /**
     * Gets the token associated with the actor or speaker.
     *
     * @returns {Token|null} The token object, or null if not available.
     */
    get token() {
        return this.actor?.token || this.scene?.tokens.get(this.speaker.token);
    }

    /**
     * Gets the actor associated with the parent, token, or speaker.
     *
     * @returns {Actor|null} The actor object, or null if not available.
     */
    get actor() {
        return (
            this.parent?.actor ||
            this.token?.actor ||
            game.actors.get(this.speaker.actor)
        );
    }

    /**
     * Gets the item associated with the parent.
     *
     * @returns {Item|null} The item object, or null if not available.
     */
    get item() {
        return this.parent?.item;
    }

    /**
     * Evaluates the test result.
     *
     * @returns {Promise<boolean>} A promise that resolves to true.
     * @async
     */
    async evaluate() {
        return true;
    }
}
