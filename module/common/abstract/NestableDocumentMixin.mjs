import * as utils from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/utils/module.mjs";
import { HydrateMixin } from "./HydrateMixin.mjs";
import { SohlActor } from "@module/common/actor/SohlActor.mjs";
import { SohlItem } from "@module/common/item/SohlItem.mjs";

export function NestableDocumentMixin(Base) {
    return class NestableDocument extends HydrateMixin(Base) {
        _cause;

        static metadata = Object.freeze({
            name: undefined,
            locId: "",
            img: "icons/svg/item-bag.svg",
            iconCssClass: "",
            sheet: "",

            /*
             * The metadata has to include the version of this Document schema, which needs to be increased
             * whenever the schema is changed such that Document data created before this version
             * would come out different if `fromSource(data).toObject()` was applied to it so that
             * we always vend data to client that is in the schema of the current core version.
             * The schema version needs to be bumped if
             *   - a field was added or removed,
             *   - the class/type of any field was changed,
             *   - the casting or cleaning behavior of any field class was changed,
             *   - the data model of an embedded data field was changed,
             *   - certain field properties are changed (e.g. required, nullable, blank, ...), or
             *   - there have been changes to cleanData or migrateData of the Document.
             *
             * Moreover, the schema version needs to be bumped if the sanitization behavior
             * of any field in the schema was changed.
             */
            schemaVersion: undefined,
        });

        _initialize(options = {}) {
            super._initialize(options);
            this._cause = options.cause || null;
        }

        get cause() {
            return this._cause || this.nestedIn;
        }

        set cause(doc) {
            if (doc instanceof SohlActor || doc instanceof SohlItem) {
                this._cause = doc;
            } else {
                throw new Error("must provide a valid cause");
            }
        }

        get isNested() {
            return this.parent instanceof SohlItem;
        }

        get item() {
            if (this.isNested) return this.parent;
            else if (this.cause instanceof SohlItem) return this.cause;
            return null;
        }

        get actor() {
            if (this.parent instanceof SohlActor) return this.parent;
            else if (this.cause instanceof SohlActor) return this.cause;
            else return this.item?.actor;
        }

        /** @inheritdoc */
        static async createDocuments(dataAry = [], context = {}) {
            if (!context?.parent?.isNested)
                return super.createDocuments(dataAry, context);
            if (!Array.isArray(dataAry)) dataAry = [dataAry];
            const result = [];
            for (let data of dataAry) {
                if (!(data._id && context.keepId)) {
                    data._id = sohl.utils.randomID();
                }

                if (!("ownership" in data)) {
                    data.ownership = {
                        default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER,
                    };
                }
                const doc = new this.impelementation(data, context);
                if (!doc)
                    throw new Error(`${this.documentName} creation failed`);

                const collection = context.parent.system.getNestedCollection(
                    this.documentName,
                );
                const newAry = collection.toObject();

                // Set sort property
                let maxSort = newAry.reduce(
                    (max, obj) => Math.max(max, obj.sort),
                    0,
                );
                maxSort += CONST.SORT_INTEGER_DENSITY;
                doc.sort = maxSort;

                const docExists = newAry.some((obj) => obj._id === doc.id);
                if (docExists) {
                    if (!context.keepId) {
                        throw new Error(
                            `${this.documentName} with id ${doc.id} already exists in ${context.parent.label}`,
                        );
                    }
                } else {
                    newAry.push(doc.toObject());
                    const collectionName =
                        context.parent.system.constructor.getCollectionName(
                            this.documentName,
                        );
                    context.parent.updateSource({
                        [`system.${collectionName}`]: newAry,
                    });
                }
                result.push(doc);
            }
            return result;
        }

        /** @inheritdoc */
        static async updateDocuments(updates = [], context = {}) {
            if (!context?.parent?.isNested)
                return super.updateDocuments(updates, context);
            if (!Array.isArray(updates)) updates = [updates];
            const collection = context.parent.system.getNestedCollection(
                this.documentName,
            );
            const newAry = collection.map((it) => it.toObject());
            const result = [];
            for (let update of updates) {
                // Expand the object, if dot-notation keys are provided
                if (Object.keys(update).some((k) => /\./.test(k))) {
                    const expandedUpdate = sohl.utils.expandObject(update);
                    for (const key in update) delete update[key];
                    Object.assign(update, expandedUpdate);
                }
                const itemIdx = newAry.findIndex(
                    (it) => it._id === update?._id,
                );
                if (itemIdx >= 0) {
                    const id = update._id;
                    delete update._id;
                    sohl.utils.mergeObject(newAry[itemIdx], update);
                    result.push(id);
                } else {
                    console.error(
                        `Can't find item with id ${update._id} in nested collection`,
                    );
                    continue;
                }
            }
            const collectionName =
                context.parent.system.constructor.getCollectionName(
                    this.documentName,
                );
            context.parent.updateSource({
                [`system.${collectionName}`]: newAry,
            });
            const changedDocs = collection.filter((it) =>
                result.includes(it.id),
            );
            changedDocs.forEach((doc) => doc.render());
            context.parent.render();
            return changedDocs;
        }

        /** @inheritdoc */
        static async deleteDocuments(ids = [], operation = {}) {
            if (!operation?.parent?.isNested)
                return super.deleteDocuments(ids, operation);
            if (!Array.isArray(ids)) ids = [ids];
            const collection = operation.parent.system.getNestedCollection(
                this.documentName,
            );
            let newAry = collection.map((it) => it.toObject());
            newAry = newAry.filter((it) => !ids.includes(it._id));
            const collectionName =
                operation.parent.system.constructor.getCollectionName(
                    this.documentName,
                );
            operation.parent.updateSource({
                [`system.${collectionName}`]: newAry,
            });
            operation.parent.render();
            return ids;
        }
    };
}
