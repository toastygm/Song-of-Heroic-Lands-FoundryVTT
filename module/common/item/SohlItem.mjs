import { NestableDocumentMixin } from "../abstract/NestableDocumentMixin.mjs";
import { _l } from "../helper/sohl-localize.mjs";
import { Utility } from "../helper/utility.mjs";
import { SohlActor } from "../actor/SohlActor.mjs";
import { ContainerGearItemData } from "./ContainerGearItemData.mjs";
import { GearItemData } from "./GearItemData.mjs";
import { BodyPartItemData } from "./BodyPartItemData.mjs";
import { TraitItemData } from "./datamodel/TraitItemData.mjs";
import { AfflictionItemData } from "./AfflictionItemData.mjs";
import { MysticalAbilityItemData } from "./datamodel/MysticalAbilityItemData.mjs";
import { MysteryItemData } from "./datamodel/MysteryItemData.mjs";

/**
 * The `SohlItem` class extends the functionality of the Foundry VTT `Item` class
 * by incorporating additional features such as nested items, active effects,
 * and custom behaviors for item creation, sorting, and merging. This class is
 * designed to work within the Song of Heroic Lands (SOHL) system for Foundry VTT.
 *
 * @extends {Item}
 */
export class SohlItem extends NestableDocumentMixin(Item) {
    /**
     * An object that tracks the changes to the data model which were applied by active effects.
     * See SohlActor.applyActiveEffects() for info on how this is set.
     * @type {object}
     */
    overrides = {};

    _uuid;

    /** @override */
    _configure(options) {
        if (this.parent && !(this.parent instanceof SohlActor)) {
            throw new Error("Parent must always be an instance of SohlActor");
        }

        super._configure(options);

        Object.defineProperty(this, "nestedIn", {
            value: (() => {
                if ([null, undefined].includes(options.nestedIn)) return null;
                if (options.nestedIn instanceof SohlItem)
                    return options.nestedIn;
                throw new Error(
                    "The provided nestedIn must be an SohlItem instance",
                );
            })(),
            writable: false,
            enumerable: false,
        });
    }

    get label() {
        return this.system.label;
    }

    get isVirtual() {
        return !this.isNested && this.actor?.system.virtualItems.get(this.id);
    }

    get fromCompendiumOrWorld() {
        return !!(this.pack || game.items.some((it) => it.id === this.id));
    }

    get permission() {
        if (this.isNested) return this.nestedIn.permission;
        return super.permission();
    }

    get transferredEffects() {
        function getTrxEffects(effects, baseItem) {
            const result = [];
            for (const e of effects) {
                // If the effect's targetType is not the same as this item, ignore it
                if (e.system.targetType !== baseItem.type) continue;
                const isTarget = e.system.targets.some(
                    (t) => t.id === baseItem.id,
                );
                if (isTarget) result.push(e);
            }
            return result;
        }

        if (!this.actor) return [];

        // Collect all of the effects in the actor that target this item
        const result = getTrxEffects(this.actor.effects, this);

        // Search through all the siblings for any effects that are targetting
        // this item.
        for (const sibling of this.actor.allItems()) {
            if (sibling.id === this.id) continue; // Not a sibling, it is this item
            const transferredSiblingEffects = getTrxEffects(
                sibling.effects,
                this,
            );
            result.push(...transferredSiblingEffects);
        }

        return result;
    }

    static defaultName({ type, parent, pack, subType } = {}) {
        const documentName = this.metadata.name;
        let collection;
        if (parent) {
            if (!(parent instanceof SohlActor)) {
                throw new Error("parent must be an actor");
            } else {
                collection = new Collection();
                for (const it of parent.allItems()) {
                    collection.set(it.id, it);
                }
            }
        } else if (pack) {
            collection = game.packs.get(pack);
        } else {
            collection = game.collections.get(documentName);
        }

        const takenNames = new Set();
        for (const document of collection) takenNames.add(document.name);
        let baseName = _l(
            subType ?
                "SOHL.ITEM.defaultName.WithSubType"
            :   "SOHL.ITEM.defaultName.NoSubType",
            {
                docLabel: _l(CONFIG.Item.typeLabels[type] || "SOHL.Unknown"),
                subType: _l(
                    CONFIG.Item.subTypeLabels[subType] || "SOHL.Unknown",
                ),
            },
        );
        let name = baseName;
        let index = 1;
        while (takenNames.has(name)) name = `${baseName} (${++index})`;
        return name;
    }

    /**
     * Creates a dialog for creating an item based on the provided data and options.
     *
     * @static
     * @async
     * @param {object} [data={}]
     * @param {object} [options={}]
     * @returns {SohlItem} the new SohlItem described by the dialog
     */
    static async createDialog(
        data = {},
        { parent = null, pack = null, types, nestedIn, ...options } = {},
    ) {
        const cls = this.implementation;

        data = sohl.utils.expandObject(data);

        // Identify allowed types
        let documentTypes = [];
        let defaultType = CONFIG[this.documentName]?.defaultType;
        let defaultTypeAllowed = false;
        // biome-ignore lint/correctness/noUnusedVariables: <explanation>
        let hasTypes = false;
        if (this.TYPES.length > 1) {
            if (types?.length === 0)
                throw new Error(
                    "The array of sub-types to restrict to must not be empty",
                );

            // Register supported types
            for (const type of this.TYPES) {
                if (type === CONST.BASE_DOCUMENT_TYPE) continue;
                if (types && !types.includes(type)) continue;
                if (
                    !nestedIn &&
                    CONFIG[this.documentName]?.dataModels[type]?.nestOnly
                )
                    continue;
                let label =
                    CONFIG[this.documentName]?.typeLabels?.[type] || type;
                label = _l(label);
                documentTypes.push({ value: type, label });
                if (type === defaultType) defaultTypeAllowed = true;
            }
            if (!documentTypes.length)
                throw new Error(
                    "No document types were permitted to be created",
                );

            if (!defaultTypeAllowed) defaultType = documentTypes[0].value;
            // Sort alphabetically
            Utility.sortStrings(documentTypes);
            hasTypes = true;
        }

        let askType =
            !!types || !documentTypes.some((t) => t.value === data.type);

        const itemClassSubtypes = CONFIG.Item.dataModels[defaultType].subTypes;
        let subTypes =
            itemClassSubtypes ?
                Object.entries(itemClassSubtypes).reduce(
                    (ary, [name, value]) => {
                        ary.push({ name, label: value });
                        return ary;
                    },
                    [],
                )
            :   [];

        let askSubType =
            askType || !subTypes.some((t) => t.name === data.system?.subType);

        let subType;
        if (subTypes.length) {
            subType = data.system?.subType || subTypes[0]?.name;
        }

        // Identify destination collection
        let collection;
        if (!parent) {
            if (pack) collection = game.packs.get(pack);
            else collection = game.collections.get(this.documentName);
        }

        // Collect data
        const folders = collection?._formatFolderSelectOptions() ?? [];
        const label = _l(this.metadata.label);
        const title = _l("DOCUMENT.Create", { type: label });
        const type = data.type || defaultType;

        const dlgHtml = await renderTemplate(
            "templates/sidebar/document-create.hbs",
            {
                variant: game.sohl?.id,
                folders,
                name: data.name,
                defaultName: cls.defaultName({ type, parent, pack, subType }),
                folder: data.folder,
                hasFolders: folders.length >= 1,
                hasTypes: this.hasTypeData,
                type,
                types: documentTypes,
                subType,
                subTypes,
                content: `<div class="form-group" id="subtypes">
            <label>Sub-Types</label>
            <select
                class="resource-value"
                name="subType"
                data-dtype="String">
                {{selectOptions subTypes selected=subType valueAttr="name" labelAttr="label" }}
            </select>
        </div>`,
            },
        );

        return await Dialog.prompt({
            title,
            content: dlgHtml,
            label: title,
            render: (element) => {
                const formTop = element.querySelector("form");
                const fd = new FormDataExtended(formTop);
                const formData = sohl.utils.mergeObject(fd.object, {
                    parent,
                    pack,
                    askType,
                    askSubType,
                });
                SohlItem._handleTypeChange(formTop, formData);
                element
                    .querySelector('[name="type"]')
                    ?.addEventListener("change", (ev) => {
                        formData.type = ev.target.value;
                        SohlItem._handleTypeChange(formTop, formData);
                    });

                element
                    .querySelector('[name="subType"]')
                    ?.addEventListener("change", (ev) => {
                        formData.subType = ev.target.value;
                        SohlItem._handleTypeChange(formTop, formData);
                    });
            },
            callback: (element) => {
                const formTop = element.querySelector("form");
                const fd = new FormDataExtended(formTop);
                const formData = sohl.utils.expandObject(fd.object);
                const formName = formData.name;
                const formType = formData.type || type;
                const formFolder = formData.folder;
                let formSubType = formData.subType || subType;
                formSubType = formSubType?.replace(" selected", "") || "";

                data.name = formName;
                if (!data.name?.trim())
                    data.name = this.defaultName({
                        type: formType,
                        parent: parent,
                        pack: pack,
                        subType: formSubType,
                    });
                if (formFolder) {
                    data.folder = formFolder;
                } else {
                    delete data.folder;
                }

                data.type = formType || type;

                const subTypes = CONFIG.Item.dataModels[data.type].subTypes;
                if (subTypes && Object.keys(subTypes)?.includes(formSubType)) {
                    data["system.subType"] = formSubType;
                }

                return this.implementation.create(data, {
                    parent,
                    pack,
                    nestedIn,
                    renderSheet: true,
                });
            },
            rejectClose: false,
            options: { jQuery: false, ...options },
        });
    }

    /**
     * Handles the type change event for the create item dialog by updating the
     * form elements based on the selected type and subtype options.
     *
     * @static
     * @param {*} formTop
     * @param {object} dlgOptions
     */
    static _handleTypeChange(
        formTop,
        { type, subType, askType, askSubType, parent, pack } = {},
    ) {
        const formSubtypes = formTop.querySelector("#subtypes");
        const formSubtypeSelect = formTop.querySelector('[name="subType"]');
        formTop.elements.type.disabled = !askType;

        // Determine if subtypes exist for this type, and if so, create the subtype dropdown
        const subTypeObj = CONFIG.Item.dataModels[type]?.subTypes;
        if (typeof subTypeObj === "object" && Object.keys(subTypeObj).length) {
            let subTypes = Object.entries(subTypeObj)?.reduce(
                (ary, [name, value]) => {
                    ary.push({ name, label: value });
                    return ary;
                },
                [],
            );

            // Create subtype dropdown
            subType =
                subTypes.some((t) => t.name === subType) ? subType : (
                    subTypes[0].name
                );
            formSubtypes.style.visibility = "visible";
            const selectOptions = subTypes.reduce((str, st) => {
                str += `<option value="${st.name}${st.name === subType ? " selected" : ""}">${st.label}</option>`;
                return str;
            }, "");
            formSubtypeSelect.innerHTML = selectOptions;
            formTop.elements.subType.value = _l(
                "SOHL.SohlItem._handleTypeChange.subTypeSelected",
                {
                    subType,
                },
            );
            formSubtypeSelect.disabled = !askSubType;
        } else {
            // Hide subtype dropdown if type doesn't support it
            formSubtypes.style.visibility = "hidden";
            subType = "";
        }

        // Update the item name field placeholder
        const nameInput = formTop.querySelector('[name="name"]');
        nameInput.placeholder = this.defaultName({
            type,
            parent,
            pack,
            subType,
        });
    }

    *allApplicableEffects() {
        // Grab all of the effects on this item that affects itself
        const effects = this.effects.filter(
            (e) => e.system.targetType === "this",
        );
        for (const effect of effects) {
            yield effect;
        }

        // Add all of the transferred effects from the items that affect this actor
        for (const effect of this.transferredEffects) {
            yield effect;
        }
    }

    applyActiveEffects() {
        if (!this.actor) return;

        const overrides = {
            [this.id]: {},
        };

        // Organize non-disabled effects by their application priority
        const changes = [];
        for (const effect of this.effects) {
            if (!effect.active) continue;
            const targets = effect.system.targets;
            if (!targets?.length) continue;
            changes.push(
                ...effect.changes.map((change) => {
                    const c = sohl.utils.deepClone(change);
                    c.targets = targets;
                    c.effect = effect;
                    c.priority = c.priority ?? c.mode * 10;
                    return c;
                }),
            );
        }
        changes.sort((a, b) => a.priority - b.priority);

        // Apply all changes
        for (let change of changes) {
            if (!change.key) continue;
            if (!change.targets?.length) continue;
            change.targets.forEach((t) => {
                const changes = change.effect.apply(t, change);
                if (Object.keys(changes).length) {
                    const obj = overrides[t.id];
                    if (typeof obj === "object") {
                        Object.entries(changes).forEach(([k, v]) => {
                            sohl.utils.setProperty(obj, k, v);
                        });
                    } else {
                        overrides[t.id] = changes;
                    }
                }
            });
        }

        // Expand the set of final overrides
        this.overrides = sohl.utils.expandObject(overrides[this.id]);
        for (const it of this.actor.allItems()) {
            if (overrides[it.id])
                it.overrides = sohl.utils.expandObject(overrides[it.id]);
        }
    }

    /**
     * Create a list of updates to the origin of all effects of this item to point to this item
     *
     * @returns an Array of updates
     */
    updateEffectsOrigin() {
        let result = [];

        result = this.effects.reduce((toUpdate, e) => {
            if (e.origin !== this.uuid) {
                const updateData = { _id: e.id, origin: this.uuid };
                return toUpdate.concat(updateData);
            }
            return toUpdate;
        }, result);

        return result;
    }

    async _onSortItem(event, itemData) {
        // Get the drag source and drop target
        const items = this.system.items;
        const source = items.get(itemData._id);
        const dropTarget = event.target.closest("[data-item-id]");
        if (!dropTarget) return;
        const target = items.get(dropTarget.dataset.itemId);

        // Don't sort on yourself
        if (source.id === target.id) return;

        // Identify sibling items based on adjacent HTML elements
        const siblings = [];
        for (let el of dropTarget.parentElement.children) {
            const siblingId = el.dataset.itemId;
            if (siblingId && siblingId !== source.id)
                siblings.push(items.get(el.dataset.itemId));
        }

        // Perform the sort
        const sortUpdates = SortingHelpers.performIntegerSort(source, {
            target,
            siblings,
        });

        const newAry = sohl.utils.deepClone(this.system.nestedItems);

        sortUpdates.forEach((u) => {
            const target = newAry.find((ent) => ent._id === u.target.id);
            target.sort = u.update.sort;
        });

        newAry.sort((a, b) => a.sort - b.sort);

        // Perform the update
        await this.update({ "system.nestedItems": newAry });
    }

    /** @override */
    async _preCreate(data, options, userId) {
        const allowed = await super._preCreate(data, options, userId);
        if (!allowed) return false;

        const updateData = {};
        // Unless specifically overriden, gear and body types have the
        // "transfer" property set to true
        if (data.type.endsWith("gear") || data.type.startsWith("body")) {
            if (sohl.utils.getProperty("system.transfer") === undefined) {
                updateData["system.transfer"] = true;
            }
        }
        this.updateSource(updateData);
        return true;
    }

    /** @override */
    _onCreate(data, options, userId) {
        super._onCreate(data, options, userId);
        const toUpdate = this.updateEffectsOrigin();
        if (toUpdate.length)
            this.updateEmbeddedDocuments("ActiveEffect", toUpdate);
    }

    /** @override */
    get uuid() {
        if (!this._uuid) {
            if (this.nestedIn) {
                // If this is a nested object, we come up with a new UUID format
                // where the nested item is defined with a hash mark
                let parts = [this.nestedIn.uuid, "NestedItem", this.id];
                this._uuid = parts.join("#");
            } else if (this.cause) {
                // If this is a virtual object, but not nested, then the UUID is
                // virtually useless; this is an ephemeral object, and cannot be usefully
                // referred to in any meaningful way.  Nevertheless, to allow for identity,
                // we construct a value that will be unique for this virtual item on this actor.
                // HOWEVER: Note that storing or referring to this ID is problematic, since the
                // _id of pure virtual items changes every time the actor is refreshed.
                let parts = [this.actor.uuid, "VirtualItem", this.id];
                this._uuid = parts.join("#");
            } else {
                this._uuid = super.uuid;
            }
        }

        return this._uuid;
    }

    /**
     * Merge sourceItem into this item. sourceItem and this item must be the same
     * type, have the same name, and if the type has subtypes, must be the same
     * subtype. If type is a gear type, then simply update the quantity instead.
     *
     * @param {SohlItem} this Item that will remain when merge is complete
     * @param {SohlItem} sourceItem Item to merge into destItem
     * @returns {boolean} true if merge succeeded, false otherwise
     */
    async merge(sourceItem, { quantity = 0 } = {}) {
        if (this.id === sourceItem.id) {
            // Cannot merge an item onto itself
            return false;
        }

        if (this.cause && !this.nestedIn) {
            // this is a pure virtual item, no merge allowed
            return false;
        }

        if (this.type !== sourceItem.type) {
            return false;
        }

        if (this.name !== sourceItem.name) {
            return false;
        }

        // Special case of gear: update the quantity
        if (this.system instanceof GearItemData) {
            // If quantity is 0, then move all of the quantity
            if (!quantity) quantity = sourceItem.system.quantity;

            let result = await this.update({
                "system.quantity": this.system.quantity + quantity,
            });
            if (result) {
                const remainingQuantity = sourceItem.system.quantity - quantity;
                if (!remainingQuantity) {
                    await sourceItem.delete();
                } else {
                    result = await sourceItem.update({
                        "system.quantity": remainingQuantity,
                    });
                    return result;
                }
            }
        }

        // If sub-types don't match, then return without change
        if (this.system.subType !== sourceItem.system.subType) {
            return false;
        }

        const updateData = sourceItem.toObject();

        // Remove standard Item fields that should not be updated
        delete updateData._id;
        delete updateData.name;
        delete updateData.type;
        delete updateData.ownership;
        delete updateData._stats;
        delete updateData.sort;

        // Don't change the creation date of the item
        delete updateData.system.createdTime;

        // Only update descriptive data if the fields are currently empty;
        // don't overwrite existing data
        if (updateData.system.subType) delete updateData.system.subType;
        if (this.system.notes) delete updateData.system.notes;
        if (this.system.textReference) delete updateData.system.textReference;
        if (this.system.description) delete updateData.system.description;

        // Only update the image if the new one is not the Default Icon
        if (updateData.img === SohlItem.DEFAULT_ICON) delete updateData.img;

        // Handle Mastery Level Items
        if (sourceItem.system.isMasteryLevelItemData) {
            delete updateData.system.masteryLevelBase;
        }

        // Generally, all fields will be updated.  Depending on the
        // specific type, some fields will be left unchanged.
        switch (sourceItem.type) {
            case MysteryItemData.TYPE_NAME:
                delete updateData.system.charges;
                break;

            case MysticalAbilityItemData.TYPE_NAME:
                delete updateData.system.charges;
                break;

            case AfflictionItemData.TYPE_NAME:
                delete updateData.system.healingRateBase;
                break;

            case TraitItemData.TYPE_NAME:
                if (sourceItem.system.textValue)
                    delete updateData.system.textValue;
                if (sourceItem.system.max) delete updateData.system.max;
                break;

            case BodyPartItemData.TYPE_NAME:
                delete updateData.system.heldItem;
                break;
        }

        const result = await this.update(updateData);
        return !!result;
    }

    getNestedItemById(itemId) {
        let found = this.system.items.get(itemId);
        if (!found && this.system instanceof ContainerGearItemData) {
            for (let it of this.system.items) {
                if (it.system instanceof ContainerGearItemData) {
                    found = it.system.items.get(itemId);
                    if (found) break;
                }
            }
        }

        return found;
    }

    async nestIn(
        nestTarget,
        { quantity = Number.MAX_SAFE_INTEGER, destructive = false } = {},
    ) {
        let newItem = null;
        if (
            !(nestTarget instanceof SohlItem || nestTarget instanceof SohlActor)
        ) {
            throw new Error("Must specify a destination item to nest into");
        }
        if (!quantity) return null;
        destructive &&= !(this.fromCompendiumOrWorld || this.isVirtual);

        const siblings =
            nestTarget instanceof SohlItem ?
                nestTarget.system.items.contents
            :   nestTarget.items.contents;
        const similarSibling = siblings.find(
            (it) =>
                it.name === this.name &&
                it.type === this.type &&
                it.system.subType === this.system.subType,
        );

        if (similarSibling) {
            if (this.fromCompendiumOrWorld) {
                /* TODO: Implement refresh items recursively
                // Ask whether to refresh the item from World/Compendium
                const overwrite = await Dialog.confirm({
                    title: "Confirm Overwrite",
                    content: `<p>Overwrite existing ${similarSibling.system.TYPE_LABEL.singlular} ${similarSibling.name}?</p>`,
                    defaultYes: false,
                    options: { jQuery: false },
                });
                */
                ui.notifications?.warn(
                    _l("SOHL.SohlItem.nestIn.IdenticalItemWarning", {
                        name: this.name,
                        targetName: nestTarget.name,
                    }),
                );
                return null;
            } else if (similarSibling.id === this.id) {
                // Item already exists here, do nothing
                return null;
            }

            if (this.system instanceof GearItemData) {
                // In the case of gear, which has quantity, we need to consider
                // how many to copy over.
                if (!this.fromCompendiumOrWorld) {
                    // Copy everything unless otherwise specified
                    quantity = Math.max(
                        0,
                        Math.min(this.system.quantity, quantity),
                    );
                    await similarSibling.update({
                        "system.quantity":
                            similarSibling.system.quantity + quantity,
                    });
                    if (destructive) {
                        if (this.system.quantity > quantity) {
                            await this.update({
                                "system.quantity":
                                    this.system.quantity - quantity,
                            });
                        } else {
                            await this.delete();
                        }
                    }
                }
            } else {
                ui.notifications?.warn(
                    _l("SOHL.SohlItem.nestIn.IdenticalItemWarning", {
                        name: this.name,
                        targetName: nestTarget.name,
                    }),
                );
                return null;
            }
        } else {
            // Nothing similar exists, so we need to nest a new item
            const newData = this.toObject();
            delete newData._id;

            const createOptions = {
                clean: true,
                nestedIn: nestTarget instanceof SohlItem ? nestTarget : null,
                parent:
                    nestTarget instanceof SohlItem ?
                        nestTarget.actor
                    :   nestTarget,
            };

            if (
                this.fromCompendiumOrWorld ||
                !(this.system instanceof GearItemData)
            ) {
                newItem = await this.constructor.create(newData, createOptions);
            } else {
                // Copy all gear unless otherwise specified
                quantity = Math.max(
                    0,
                    Math.min(this.system.quantity, quantity),
                );
                newData.system.quantity = quantity;
                newItem = await this.constructor.create(newData, createOptions);
                if (destructive) {
                    if (this.system.quantity > quantity) {
                        await this.update({
                            "system.quantity": this.system.quantity - quantity,
                        });
                    } else {
                        await this.delete();
                    }
                }
            }
        }

        return newItem;
    }

    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    static async fromDropData(data, options = {}) {
        let document = null;

        // Case 1 - Data explicitly provided
        if (data.data) document = new this(data.data);
        // Case 2 - UUID provided
        else if (data.uuid) document = await fromUuid(data.uuid);

        // Ensure that we retrieved a valid document
        if (!document) {
            throw new Error(
                "Failed to resolve Document from provided DragData. Either data or a UUID must be provided.",
            );
        }
        if (document.documentName !== this.documentName) {
            throw new Error(
                `Invalid Document type '${document.type}' provided to ${this.name}.fromDropData.`,
            );
        }

        // Flag the source UUID
        if (document.id && !document._stats?.compendiumSource) {
            let uuid = document.uuid.split("#").at(0);
            document.updateSource({ "_stats.compendiumSource": uuid });
        }
        return document;
    }

    static _resetIds(data, _i = 0) {
        if (_i > 99) {
            throw new Error("Maximum depth exceeded");
        }
        data._id = sohl.utils.randomID();
        if (data.system?.macros?.length) {
            for (let m of data.system.macros) {
                m._id = sohl.utils.randomID();
            }
        }
        if (data.system?.nestedItems?.length) {
            for (let obj of data.system.nestedItems) {
                SohlItem._resetIds(obj, _i + 1);
            }
        }
        data.effects = data.effects?.map((e) => {
            if (e instanceof ActiveEffect) e = e.toObject();
            e._id = sohl.utils.randomID();
            return e;
        });
    }
}
