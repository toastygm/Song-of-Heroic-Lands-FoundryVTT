/** @typedef {import("@league-of-foundry-developers/foundry-vtt-types")} */
/** @typedef {import("@sohl-global").MaybePromise<ItemSheet.ItemSheetData>} MaybeItemSheetData */
import { ArmorGearItemData } from "@module/common/item/datamodel/ArmorGearItemData.mjs";
import { BodyLocationItemData } from "@module/common/item/datamodel/BodyLocationItemData.mjs";
import { BodyZoneItemData } from "@module/common/item/datamodel/BodyZoneItemData.mjs";
import { Utility } from "@module/common/helper/utility.mjs";
import { ContainerGearItemData } from "@module/common/item/datamodel/ContainerGearItemData.mjs";
import { GearItemData } from "@module/common/item/datamodel/GearItemData.mjs";
import { SkillItemData } from "@module/common/item/datamodel/SkillItemData.mjs";
import { SohlItem } from "@module/common/item/SohlItem.mjs";
import { SohlMacro } from "@module/common/macro/SohlMacro.mjs";
import { SohlSheetMixin } from "@module/common/abstract/SohlSheetMixin.mjs";
import { TraitItemData } from "@module/common/item/datamodel/TraitItemData.mjs";
import { WeaponGearItemData } from "@module/common/item/datamodel/WeaponGearItemData.mjs";

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */

export class SohlItemSheet extends SohlSheetMixin(ItemSheet) {
    /** @override */
    static get defaultOptions() {
        return sohl.utils.mergeObject(super.defaultOptions, {
            classes: ["sohl", "sheet", "item"],
            width: 560,
            height: 550,
            filters: [
                {
                    inputSelector: 'input[name="search-actions"]',
                    contentSelector: ".action-list",
                },
                {
                    inputSelector: 'input[name="search-nested"]',
                    contentSelector: ".nested-item-list",
                },
                {
                    inputSelector: 'input[name="search-effects"]',
                    contentSelector: ".effects-list",
                },
            ],
        });
    }

    /**
     * @typedef {ItemSheet.ItemSheetData} BaseItemSheetData
     *
     * @typedef {BaseItemSheetData & {
     *   variant?: string,
     *   idata?: object,
     *   itemType?: string,
     *   hasActor?: boolean,
     *   hasTraitChoices?: boolean
     * }} SohlItemSheetData
     *
     * @property {string} [variant] - A UI-specific indicator for this item (e.g., "simple", "complex").
     * @property {object} [idata] - A shortcut to the item’s system data (`item.system`).
     * @property {string} [itemType] - The Foundry `item.type` value for this item.
     * @property {boolean} [hasActor] - True if this item is owned by an Actor.
     * @property {boolean} [hasTraitChoices] - True if the item has traits that can be selected or toggled.
     */
    /** @override */
    getData() {
        /** @type {SohlItemSheetData} */
        const data = /** @type {SohlItemSheetData} */ (super.getData());
        if (data instanceof Promise) {
            throw new Error("getData() returned a Promise");
        }
        data.variant = game.sohl?.id;

        // Re-define the template data references (backwards compatible)
        data.item = this.item;
        data.idata = this.item.system;
        data.itemType = this.item.type;
        data.hasActor = !!this.actor;

        data.hasTraitChoices =
            this.item.system instanceof TraitItemData &&
            !!Object.keys(this.item.system.choices).length;

        // If this is a container, then separate the nested items into two lists,
        // one for gear and the other for all other items.  If it is not a container,
        // then all nested items simply go into the items list.
        data.items = [];
        data.gear = [];

        data.inContainer = null;
        if (
            this.item.system instanceof GearItemData &&
            this.item.nestedIn instanceof ContainerGearItemData
        ) {
            data.inContainer = this.item.nestedIn;
        }

        if (this.item.system instanceof ContainerGearItemData) {
            const topContainer = {
                name: this.item.name,
                id: this.item.id,
                system: this.item.system,
                items: [],
            };
            data.containers = [topContainer];

            this.item.system.items.forEach((it) => {
                if (it.system instanceof ContainerGearItemData) {
                    data.containers.push({
                        name: it.name,
                        id: it.id,
                        system: it.system,
                        items: [],
                    });
                }
            });

            data.containers.forEach((c) => {
                c.system.items.forEach((ci) => {
                    if (ci.system instanceof GearItemData) {
                        c.items.push(ci);
                    }
                });
            });
        }

        data.traitChoices = this.item.system.choices; // this will only be defined for Traits, otherwise undefined
        data.bodyLocationChoices = {};

        if (this.item.actor) {
            data.holdableItems = { "": "Nothing" };
            data.combatSkills = {
                melee: { "": "None" },
                missile: { "": "None" },
                maneuver: { "": "None" },
            };

            // Generate a list of domains specific to this item
            data.domains = Object.entries(
                this.item.actor.system.$domains,
            ).reduce((obj, [cat, ary]) => {
                const tmpAry = ary.map((i) => [i.system.abbrev, i.name]);

                // If the current item's domain is not in the loaded set of domains, then temporarily
                // add it (so that it doesn't get reset from the current value)
                if (
                    !tmpAry.some(
                        ([abbrev]) => abbrev === this.item.system.domain,
                    )
                )
                    tmpAry.push([
                        this.item.system.domain,
                        `Unknown (${this.item.system.domain})`,
                    ]);

                Utility.sortStrings(tmpAry);
                obj[cat] = Object.fromEntries(tmpAry);
                return obj;
            }, {});

            for (const it of this.item.actor.allItems()) {
                // Fill appropriate lists for individual item sheets
                if (it.system instanceof BodyLocationItemData) {
                    data.bodyLocationChoices[it.uuid] = it.name;
                }

                if (it.system instanceof BodyZoneItemData) {
                    if (!data.zoneNames) {
                        data.zoneNames = [it.name];
                    } else {
                        if (!data.zoneNames.includes(it.name)) {
                            data.zoneNames.push(it.name);
                        }
                    }
                }

                if (it.system instanceof SkillItemData) {
                    if (it.system.weaponGroup === "melee") {
                        data.combatSkills.melee[it.system.name] =
                            it.system.name;
                    }

                    if (it.system.weaponGroup === "missile") {
                        data.combatSkills.missile[it.system.name] =
                            it.system.name;
                    }

                    if (["maneuver", "melee"].includes(it.system.weaponGroup)) {
                        data.combatSkills.maneuver[it.system.name] =
                            it.system.name;
                    }
                }

                if (
                    !it.isNested &&
                    it.system instanceof GearItemData &&
                    !(it.system instanceof ArmorGearItemData)
                ) {
                    data.holdableItems[it.id] = it.name;
                }

                if (this.item.system instanceof WeaponGearItemData) {
                    if (it.system instanceof SkillItemData) {
                        if (
                            ["melee", "missle"].includes(it.system.weaponGroup)
                        ) {
                            data.combatSkills[it.system.weaponGroup][it.name] =
                                it.name;
                        } else if (it.system.weaponGroup === "meleemissile") {
                            data.combatSkills.melee[it.name] = it.name;
                            data.combatSkills.missle[it.name] = it.name;
                        }
                    }
                }
            }
        }
        if (!Object.keys(data.bodyLocationChoices).length) {
            data.bodyLocationChoices[""] = "None";
        }

        return data;
    }

    /** @override */
    setPosition(options = {}) {
        const position = super.setPosition(options);
        const sheetBody = this.element.find(".sheet-body");
        const bodyHeight = position.height - 192;
        sheetBody.css("height", bodyHeight);
        return position;
    }

    get isEditable() {
        return !this.item.isVirtual && super.isEditable;
    }

    /** @inheritdoc */
    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    _canDragStart(selector) {
        return this.isEditable;
    }

    /* -------------------------------------------- */
    /** @inheritdoc */
    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    _canDragDrop(selector) {
        return this.isEditable;
    }

    /* -------------------------------------------- */
    /** @inheritdoc */
    _onDragStart(event) {
        const li = event.currentTarget;
        if ("link" in event.target.dataset) return;

        // Create drag data
        let dragData;

        // Embed Items
        if (li.dataset.itemId) {
            const item = this.item.getNestedItemById(li.dataset.itemId);
            dragData = item.toDragData();
        }

        // Active Effect
        if (li.dataset.effectId) {
            const effect = this.item.effects.get(li.dataset.effectId);
            dragData = effect.toDragData();
        }

        // Macros
        if (li.dataset.macroId) {
            const macro = this.item.system.macros.find(
                (m) => m._id === li.dataset.macroId,
            );
            dragData = sohl.utils.deepClone(macro);
        }

        if (!dragData) return;

        // Set data transfer
        event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    }

    async _onSortItem(event) {
        return this.item._onSortItem(event);
    }

    /** @inheritdoc */
    async _onDrop(event) {
        const data = TextEditor.getDragEventData(event);
        const allowed = Hooks.call("dropItemSheetData", this.item, this, data);
        if (allowed === false) return;

        if (data.type === "ActiveEffect") {
            return this._onDropActiveEffect(event, data);
        } else if (data.type === "Item") {
            return this._onDropItem(event, data);
        } else if (data.type === "Macro") {
            return this._onDropMacro(event, data);
        }
    }

    async _onDropMacro(event, data) {
        if (!this.item.isOwner) return false;

        const droppedMacro = await SohlMacro.fromDropData(data);
        if (droppedMacro) {
            if (
                this.item.system.macros.some((m) => m._id === droppedMacro.id)
            ) {
                // dropped macro is already in this item,
                // so we just sort it.
                return this._onSortMacro(event, droppedMacro.toObject());
            } else {
                // Item is not currently in the list of items for the item,
                // so add it.
                return await SohlMacro.create(droppedMacro.toObject(), {
                    clean: true,
                    nestedIn: this.item,
                });
            }
        }

        // We can't deal with the dropped macro, so fail
        return false;
    }

    _onSortMacro(event, macroData) {
        // Get the drag source and drop target
        const macros = this.item.system.macros;
        const source = macros.find((m) => m._id === macroData._id);
        const dropTarget = event.target.closest("[data-macro-id]");
        if (!dropTarget) return;
        const target = macros.get(dropTarget.dataset.macroId);

        // Don't sort on yourself
        if (source.id === target.id) return;

        // Identify sibling items based on adjacent HTML elements
        const siblings = [];
        for (let el of dropTarget.parentElement.children) {
            const siblingId = el.dataset.macroId;
            if (siblingId && siblingId !== source.id)
                siblings.push(macros.find((m) => m._id === el.dataset.macroId));
        }

        // Perform the sort
        const sortUpdates = SortingHelpers.performIntegerSort(source, {
            target,
            siblings,
        });

        const updateData = {
            "system.macros": sohl.utils.deepClone(this.item.system.macros),
        };

        sortUpdates.forEach((u) => {
            const target = updateData["system.macros"].find(
                (m) => m._id === u.target._id,
            );
            if (target) target.sort = u.update.sort;
        });

        // Perform the update
        return this.item.update(updateData);
    }

    async _createNestedItem(event) {
        await this._onSubmit(event); // Submit any unsaved changes
        const dataset = event.currentTarget.dataset;
        const options = { nestedIn: this.item, parent: this.item.actor };
        const data = { name: "" };
        if (dataset.type === "gear") {
            options.types = Utility.getChoicesMap(
                GearItemData.TYPE,
                "SOHL.GEAR.TYPE",
            );
            data.type = GearItemData.TYPE.MISC;
        } else if (dataset.type) {
            data.type = dataset.type;
        }
        options.items = [];
        if (this.item.actor) {
            for (const it of this.item.actor.allItems()) {
                if (it.type === dataset.type) options.items.push(it);
            }
        }
        options.items.sort((a, b) => a.sort - b.sort);
        if (dataset.subType) data["system.subType"] = dataset.subType;
        const item = await SohlItem.createDialog(data, options);
        if (item) this.render();
        return item;
    }

    async _deleteNestedItem(event) {
        event.preventDefault();
        const li = event.currentTarget.closest(".item");
        const nestedItemId = li.dataset.itemId;
        if (nestedItemId) {
            const nestedItem = this.item.getNestedItemById(nestedItemId);
            if (!nestedItem) {
                console.error(
                    `SoHL | Delete aborted, nested item ${nestedItemId} in item ${this.item.name} was not found.`,
                );
                return;
            }

            await Dialog.confirm({
                title: `Delete Nested Item: ${nestedItem.label}`,
                content:
                    "<p>Are You Sure?</p><p>This item will be deleted and cannot be recovered.</p>",
                yes: () => {
                    nestedItem.delete();
                    this.render();
                },
            });
        }
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        // biome-ignore lint/correctness/noUnusedVariables: <explanation>
        const element = html instanceof jQuery ? html[0] : html;

        this.form.addEventListener("keypress", (ev) => {
            const target = ev.target;
            // Check if the event was triggered by an element with the class 'properties'
            if (target.classList.contains("properties") && ev.key === "Enter") {
                super.close();
            }
        });

        // Create/edit/delete Nested Item
        this.form
            .querySelector(".nested-item-create")
            ?.addEventListener("click", this._createNestedItem.bind(this));

        this.form
            .querySelector(".nested-item-edit")
            ?.addEventListener("click", (ev) => {
                const li = ev.currentTarget.closest(".item");
                const itemId = li.dataset.itemId;
                const nestedItem = this.item.getNestedItemById(itemId);
                nestedItem.sheet.render(true);
            });

        this.form
            .querySelector(".nested-item-delete")
            ?.addEventListener("click", this._deleteNestedItem.bind(this));
    }
}
