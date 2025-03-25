/** @typedef {import("@league-of-foundry-developers/foundry-vtt-types")} */
import { HydrateMixin } from "@module/common/abstract/HydrateMixin.mjs";

const { StringField } = foundry.data.fields;
const { EmbeddedCollection, DataModel } = foundry.abstract;
const {
    DataField,
    SchemaField,
    EmbeddedCollectionField,
    EmbeddedDocumentField,
} = foundry.data.fields;

/**
 * @template T
 * @typedef {new (...args: any[]) => T} Constructor
 */

/**
 * @typedef {DataModel} NestableDataModelInstance
 * @property {string|null} parentCollection
 * @property {Record<string, EmbeddedCollection>} collections
 * @property {boolean} isNested
 * @property {() => PlainObject | this} migrateData
 * @property {(nestedName: string) => DocumentCollection<any, nestedName>} getNestedCollection
 * @property {(nestedName: string, id: string, options?: { invalid?: boolean, strict?: boolean }) => Document | undefined} getNestedDocument
 * @property {(nestedName: string, data: object[], operation?: any) => Promise<Document[]>} createNestedDocuments
 * @property {(nestedName: string, updates: object[], operation?: any) => Promise<Document[]>} updateNestedDocuments
 * @property {(nestedName: string, ids: string[], operation?: any) => Promise<Document[]>} deleteNestedDocuments
 * @property {(parentCollection?: string | null) => string | null} _getParentCollection
 * @property {(parentPath?: string) => Generator<[string, Document]>} traverseNestedDocuments
 */

/**
 * A mixin-extended constructor for a DataModel that supports nested documents and collections.
 *
 * @template T
 * @typedef {Constructor<any> & {
 *   metadata: DataModelMetadata;
 *   TYPE_NAME: string;
 *   implementation: typeof Document;
 *   baseDataModel: typeof DataModel;
 *   dataModelName: string;
 *   parentDocumentClass: typeof Document;
 *   defineSchema(): StrictObject<DataField>;
 *   schema: SchemaField;
 *   hierarchy: Readonly<StrictObject<EmbeddedCollectionField | EmbeddedDocumentField>>;
 *   getCollectionName(name: string): Nullable<string>;
 *   _initializationOrder(): Generator<[string, DataField]>;
 * }} NestableDataModelConstructor
 */

/**
 * A mixin function that extends a base class to create a `NestableDataModel` class.
 * This class provides functionality for managing hierarchical and nested data models
 * within a parent document structure. It includes schema definition, data migration,
 * and embedded document management capabilities.
 *
 * @template {DataModel} T
 * @param {Constructor<T>} Base
 * @returns {NestableDataModelConstructor<T>} - The extended class
 */
export function NestableDataModelMixin(Base) {
    return class extends HydrateMixin(Base) {
        /** @type {Nullable<string>} */
        parentCollection = null;

        /** @type {Optional<StrictObject<EmbeddedCollection>>} */
        collections;

        /**
         * Metadata for the NestableDataModel class.
         * @type {DataModelMetadata}
         * @readonly
         * @static
         */
        static metadata = Object.freeze({
            name: "",
            locId: "NESTABLEDATAMODEL",
            iconCssClass: "",
            img: "icons/svg/item-bag.svg",
            sheet: "",
            defaultAction: null,
            actions: {},
            events: {},
            effectKeys: {},
            schemaVersion: "0.5.6",
        });

        /**
         * A static property that generates an array of localization prefixes for the class
         * and its parent classes. The prefixes are derived from the `locId` metadata property
         * of each class in the inheritance chain.
         *
         * @constant {ReadonlyArray<string>}
         * @memberof NestableDataModelMixin
         */
        static LOCALIZATION_PREFIXES = Object.freeze(
            sohl.foundry.utils.getParentClasses(this).reduce(
                /**
                 * @param {string[]} acc
                 * @param {{ metadata?: { locId?: string } }} cls
                 * @returns {string[]}
                 */
                (acc, cls) => {
                    if (cls.metadata?.locId) {
                        acc.push(`SOHL.${cls.metadata.locId}`);
                    }
                    return acc;
                },
                /** @type {string[]} */ ([]),
            ),
        );

        /**
         * A static getter that retrieves the type name of the data model.
         * The type name is derived from the `metadata.name` property of the class.
         *
         * @returns {string} The name of the type as defined in the class metadata.
         */
        static get TYPE_NAME() {
            return this.metadata.name;
        }

        /**
         * A getter that retrieves the static `TYPE_NAME` property from the constructor of the current class.
         * This is typically used to provide a consistent type identifier for instances of the class.
         *
         * @type {string} The type name associated with the class.
         */
        get TYPE_NAME() {
            return /** @type {{ TYPE_NAME: string }} */ (
                /** @type {unknown} */ (this.constructor)
            ).TYPE_NAME;
        }

        /**
         * A getter that must be overridden by subclasses to define a type label.
         * This property is intended to provide a human-readable label representing the type of the data model.
         *
         * @abstract
         * @throws {Error} Throws an error if the subclass does not define the TYPE_LABEL.
         * @returns {string} The type label for the data model.
         */
        get TYPE_LABEL() {
            throw new Error("Subclass must define TYPE_LABEL");
        }

        /**
         * Gets the parent document class associated with this data model.
         * This is typically used to define the type of document that this data model belongs to.
         *
         * @returns {typeof foundry.abstract.Document} The class of the parent document.
         */
        static get parentDocumentClass() {
            throw new Error("Subclass must define parent doccument class");
        }

        /** @inheritdoc */
        constructor(data = {}, options = {}) {
            super(data, options);
            if (!this.parent) {
                throw new Error("parent must be specified");
            }
        }

        /** @inheritdoc */
        static defineSchema() {
            return {
                schemaVersion: new StringField({
                    initial: this.metadata.schemaVersion,
                }),
            };
        }

        /** @inheritdoc */
        _initialize({ parentCollection = null } = {}) {
            /**
             * An immutable reverse-reference to the name of the collection that this Document exists in on its parent, if any.
             * @type {string|null}
             */
            Object.defineProperty(this, "parentCollection", {
                value: this._getParentCollection(parentCollection),
                writable: false,
            });

            // Construct Embedded Collections
            const collections = {};
            for (const [fieldName, field] of Object.entries(
                this.constructor.hierarchy,
            )) {
                if (!field.constructor.implementation) continue;
                const data = this._source[fieldName];
                const c = (collections[fieldName] =
                    new field.constructor.implementation(
                        fieldName,
                        this,
                        data,
                    ));
                Object.defineProperty(this, fieldName, {
                    value: c,
                    writable: false,
                });
            }

            /**
             * A mapping of embedded Document collections which exist in this model.
             * @type {Record<string, EmbeddedCollection>}
             */
            Object.defineProperty(this, "collections", {
                value: Object.seal(collections),
                writable: false,
            });
        }

        /**
         * Retrieves the schema for the current data model class. If the schema is not already defined,
         * it initializes and caches it based on the base data model's schema definition.
         *
         * @returns {SchemaField} The schema associated with the current data model class.
         */
        static get schema() {
            if (this._schema) return this._schema;
            const base = this.baseDataModel;
            if (!Object.prototype.hasOwnProperty.call(base, "_schema")) {
                const schema = new fields.SchemaField(
                    Object.freeze(base.defineSchema()),
                );
                Object.defineProperty(base, "_schema", {
                    value: schema,
                    writable: false,
                });
            }
            Object.defineProperty(this, "_schema", {
                value: base._schema,
                writable: false,
            });
            return base._schema;
        }

        /**
         * A generator method that determines the initialization order of fields
         * in the schema. Non-hierarchical fields are yielded first, followed by
         * hierarchical fields.
         *
         * @generator
         * @yields {StrictObject<DataField>} A tuple containing the field name and its schema definition.
         */
        static *_initializationOrder() {
            const hierarchy = this.hierarchy;

            // Initialize non-hierarchical fields first
            for (const [name, field] of this.schema.entries()) {
                if (name in hierarchy) continue;
                yield [name, field];
            }

            // Initialize hierarchical fields last
            for (const [name, field] of Object.entries(hierarchy)) {
                yield [name, field];
            }
        }

        /**
         * Return a reference to the configured subclass of this base SohlDataModel type.
         * @type {typeof DataModel}
         */
        static get implementation() {
            return CONFIG[this.parent.documentName]?.dataModels[
                this.metadata.name
            ];
        }

        /* -------------------------------------------- */
        /**
         * The base SohlDataModel definition that this SohlDataModel class extends from.
         * @type {typeof DataModel}
         */
        static get baseDataModel() {
            let cls;
            let parent = this;
            while (parent) {
                cls = parent;
                if (cls.name === this.metadata.name) return cls;
                parent = Object.getPrototypeOf(cls);
                if (parent.name === DataModel.name) return cls;
            }
            throw new Error(
                `Base SohlDataModel class identification failed for "${this.documentName}"`,
            );
        }

        /**
         * The canonical name of this Document type, for example "Actor".
         * @type {string}
         */
        static get dataModelName() {
            return this.metadata.name;
        }

        get dataModelName() {
            return this.constructor.dataModelName;
        }

        /**
         * The nested Document hierarchy for this Document.
         * @returns {Readonly<Record<string, EmbeddedCollectionField|EmbeddedDocumentField>>}
         */
        static get hierarchy() {
            const hierarchy = {};
            for (const [fieldName, field] of this.schema.entries()) {
                if (field.constructor.hierarchical)
                    hierarchy[fieldName] = field;
            }
            Object.defineProperty(this, "hierarchy", {
                value: Object.freeze(hierarchy),
                writable: false,
            });
            return hierarchy;
        }

        get isNested() {
            return !!this.parentCollection;
        }

        /**
         * Migrate the object to conform to its latest data model.
         * @returns {T | object}              The migrated system data object
         */
        migrateData() {
            if (
                !sohl.utils.isNewerVersion(
                    this.constructor.metadata.schemaVersion,
                    this.schemaVersion,
                )
            )
                return this;
            const model = this.schema ?? {};
            return /** @type {UnknownObject} */ (
                sohl.utils.mergeObject(model, this, {
                    insertKeys: false,
                    insertValues: true,
                    enforceTypes: false,
                    overwrite: true,
                    inplace: false,
                })
            );
        }

        static getCollectionName(name) {
            if (name in this.hierarchy) return name;
            for (const [collectionName, field] of Object.entries(
                this.hierarchy,
            )) {
                if (field.model.documentName === name) return collectionName;
            }
            return null;
        }

        /* -------------------------------------------- */
        /**
         * Obtain a reference to the Array of source data within the data object for a certain embedded Document name
         * @param {string} nestedName   The name of the embedded Document type
         * @returns {DocumentCollection}  The Collection instance of embedded Documents of the requested type
         */
        getNestedCollection(nestedName) {
            const collectionName =
                this.constructor.getCollectionName(nestedName);
            if (!collectionName) {
                throw new Error(
                    `${nestedName} is not a valid nested Document within the ${this.documentName} Document`,
                );
            }
            const field = this.constructor.hierarchy[collectionName];
            return field.getCollection(this);
        }

        /* -------------------------------------------- */
        /**
         * Get an embedded document by its id from a named collection in the parent document.
         * @param {string} nestedName              The name of the embedded Document type
         * @param {string} id                        The id of the child document to retrieve
         * @param {object} [options]                 Additional options which modify how embedded documents are retrieved
         * @param {boolean} [options.strict=false]   Throw an Error if the requested id does not exist. See Collection#get
         * @param {boolean} [options.invalid=false]  Allow retrieving an invalid Embedded Document.
         * @returns {Document}                       The retrieved embedded Document instance, or undefined
         * @throws If the embedded collection does not exist, or if strict is true and the Embedded Document could not be
         *         found.
         */
        getNestedDocument(
            nestedName,
            id,
            { invalid = false, strict = false } = {},
        ) {
            const collection = this.getNestedCollection(nestedName);
            return collection.get(id, { invalid, strict });
        }

        /* -------------------------------------------- */
        /**
         * Create multiple embedded Document instances within this parent Document using provided input data.
         * @see Document.createDocuments
         * @param {string} nestedName                     The name of the embedded Document type
         * @param {object[]} data                           An array of data objects used to create multiple documents
         * @param {DatabaseCreateOperation} [operation={}]  Parameters of the database creation workflow
         * @returns {Promise<Document[]>}                   An array of created Document instances
         */
        async createNestedDocuments(nestedName, data = [], operation = {}) {
            this.getNestedCollection(nestedName); // Validation only
            operation.parent = this;
            const cls = getDocumentClass(nestedName);
            return cls.createDocuments(data, operation);
        }

        /* -------------------------------------------- */
        /**
         * Update multiple embedded Document instances within a parent Document using provided differential data.
         * @see Document.updateDocuments
         * @param {string} nestedName                     The name of the embedded Document type
         * @param {object[]} updates                        An array of differential data objects, each used to update a
         *                                                  single Document
         * @param {DatabaseUpdateOperation} [operation={}]  Parameters of the database update workflow
         * @returns {Promise<Document[]>}                   An array of updated Document instances
         */
        async updateNestedDocuments(nestedName, updates = [], operation = {}) {
            this.getNestedCollection(nestedName); // Validation only
            operation.parent = this;
            const cls = getDocumentClass(nestedName);
            return cls.updateDocuments(updates, operation);
        }

        /* -------------------------------------------- */
        /**
         * Delete multiple embedded Document instances within a parent Document using provided string ids.
         * @see Document.deleteDocuments
         * @param {string} nestedName                     The name of the embedded Document type
         * @param {string[]} ids                            An array of string ids for each Document to be deleted
         * @param {DatabaseDeleteOperation} [operation={}]  Parameters of the database deletion workflow
         * @returns {Promise<Document[]>}                   An array of deleted Document instances
         */
        async deleteNestedDocuments(nestedName, ids, operation = {}) {
            this.getNestedCollection(nestedName); // Validation only
            operation.parent = this;
            const cls = getDocumentClass(nestedName);
            return cls.deleteDocuments(ids, operation);
        }

        _getParentCollection(parentCollection) {
            if (!this.parent) return null;
            if (parentCollection) return parentCollection;
            return this.parent.constructor.getCollectionName(
                this.dataModelName,
            );
        }

        *traverseNestedDocuments(_parentPath) {
            for (const [fieldName, field] of Object.entries(
                this.constructor.hierarchy,
            )) {
                const fieldPath =
                    _parentPath ? `${_parentPath}.${fieldName}` : fieldName;

                // Singleton embedded document
                if (
                    field instanceof foundry.data.fields.EmbeddedDocumentField
                ) {
                    const document = this[fieldName];
                    if (document) {
                        yield [fieldPath, document];
                        yield* document.traverseNestedDocuments(fieldPath);
                    }
                } else if (
                    field instanceof foundry.data.fields.EmbeddedCollectionField
                ) {
                    const collection = this[fieldName];
                    for (const document of collection.values()) {
                        yield [fieldPath, document];
                        yield* document.traverseNestedDocuments(fieldPath);
                    }
                }
            }
        }
    };
}
