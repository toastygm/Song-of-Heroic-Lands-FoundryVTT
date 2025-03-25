import { NestableDocumentMixin } from "@module/abstract/NestableDocumentMixin.mjs";
import { _l } from "@module/helper/sohl-localize.mjs";
import { Utility } from "@module/helper/utility.mjs";
import { EventItemData } from "@module/common/item/datamodel/EventItemData.mjs";
import { GearItemData } from "@module/common/item/datamodel/GearItemData.mjs";
import { SkillBase } from "@module/helper/SkillBase.mjs";
import { SkillItemData } from "@module/common/item/datamodel/SkillItemData.mjs";
import { SohlItem } from "@module/common/item/SohlItem.mjs";
import { SohlItemData } from "@module/common/item/datamodel/SohlItemData.mjs";
import { TraitItemData } from "../item/datamodel/TraitItemData.mjs";

/**
 * The `SohlActor` class extends the Foundry VTT `Actor` class and provides additional functionality
 * for managing actors in the "Song of Heroic Lands" system. This class includes methods for handling
 * items, traits, skills, effects, and other actor-specific data. It also provides utilities for
 * managing tokens, selecting actors, and importing/exporting actor data.
 *
 * @extends {Actor}
 */
export class SohlActor extends NestableDocumentMixin(Actor) {
    $speaker;

    get speaker() {
        if (!this.$speaker) {
            this.$speaker = ChatMessage.getSpeaker({
                token: this.token,
                actor: this,
            });
        }
        return this.$speaker;
    }

    /**
     * Union of all owned items and virtual items
     */
    *allItems() {
        for (let it of this.items.values()) yield it;
        for (let it of this.system.virtualItems.values()) yield it;
    }

    /**
     * Version of the allItems generator that handles dynamically adding
     * items to the virtualItems collection.
     */
    *dynamicAllItems() {
        const yielded = new Set();

        // Yield all initial items
        for (let it of this.items.values()) {
            yield it;
            yielded.add(it.id);
        }

        // Continuously check for new items
        let newItemsFound = !!this.system.virtualItems.size;
        while (newItemsFound) {
            newItemsFound = false;

            for (let it of this.system.virtualItems.values()) {
                if (!yielded.has(it.id)) {
                    yield it;
                    yielded.add(it.id);
                    newItemsFound = true;
                }
            }
        }
    }

    /** @override */
    get itemTypes() {
        const types = Object.fromEntries(
            game.documentTypes.Item.map((t) => [t, []]),
        );
        const ary = Array.from(this.allItems()).sort((a, b) => a.sort - b.sort);
        const result = ary.reduce((obj, it) => {
            obj[it.type].push(it);
            return obj;
        }, types);

        return result;
    }

    get itemSubtypes() {
        const result = Object.values(CONFIG.Item.dataModels).reduce(
            (ist, clazz) => {
                // Only create a subtype list if there are, in fact, subtypes defined
                if (clazz.subTypes) {
                    ist[clazz.TYPE_NAME] = Object.fromEntries(
                        Object.keys(clazz.subTypes).map((key) => [
                            key,
                            { label: clazz.subTypes[key], items: [] },
                        ]),
                    );
                }
                return ist;
            },
            {},
        );

        // Load up all subtype lists
        const ary = Array.from(this.allItems()).sort((a, b) => a.sort - b.sort);
        ary.forEach((it) => {
            if (it.system instanceof TraitItemData) {
                if (it.system.intensity !== "attribute") {
                    result.trait[it.system.subType].items.push(it);
                }
            } else if (it.system.subType) {
                if (!result[it.type]?.[it.system.subType]) {
                    console.error(
                        `Item ${it.id} type ${it.type} has invalid subtype ${it.system.subType}`,
                    );
                    result[it.type][it.system.subType] = {
                        label: `!!BAD!! ${it.system.subType}`,
                        items: [],
                    };
                }
                result[it.type][it.system.subType].items.push(it);
            }
        });

        return result;
    }

    get sunsign() {
        if (!this._sunsign) {
            const sunsignTrait = this.getTraitByAbbrev("ss");
            if (!sunsignTrait) {
                console.warn(`No Sunsign trait on actor ${this.name}`);
                return "";
            } else {
                this._sunsign = sunsignTrait.system.textValue;
            }
        }
        return this._sunsign;
    }

    /**
     * Try several things to determine what the current actor is.  These include: (1) if UUID is specified, find
     * the actor with that UUID; (2) If there is a combat ongoing, and if the current combatant is owned, then
     * select that actor, or (3) if there is a character defined in the user profile, choose that actor.
     *
     * @param {string} actorUuid
     * @returns The SohlActor that was identified.
     */
    static getActor(actorUuid = null) {
        let actor = null;

        if (actorUuid) {
            actor = fromUuidSync(actorUuid);
            if (!actor) {
                ui.notifications?.warn(
                    `Cannot find actor with UUID ${actorUuid}`,
                );
                return null;
            }
        } else {
            // We have to guess which actor to select.
            // If in combat, then choose the combatant whose turn it is
            actor = game.combat?.combatant?.actor;
            if (!actor?.isOwner) {
                // If we're not an owner of the current combatant (or we are not in combat), then
                // fallback to our "user character" (if defined)
                actor = game.user.character;
                if (!actor) {
                    const msg = `Cannot identify a default character; please consider defining your default character in your user profile.`;
                    console.warn(`sohl.SoHL | ${msg}`);
                    ui.notifications?.warn(msg);
                    return null;
                }
            }
        }

        return actor;
    }

    /**
     * Finds the token associated with this actor.  If this actor is a synthetic actor,
     * then this is trivial.  But if this actor is not synthetic, then this method will
     * search through the current scene to find the appropriate token associated with this
     * actor.
     *
     * If a token in the current scene is selected, and it is linked to this actor, then it
     * is chosen.  If no token is selected, then choose one at random (in the best case there
     * will only be one linked token anyway).
     *
     * @param {*} targetTokenUuid Prospective token UUID to use if a linked token
     * @returns {TokenDocument} the TokenDocument associated with this actor
     */
    getToken(targetTokenUuid) {
        // If this is a synthetic actor, then get the token associated with the actor
        let tokenDocument = this.token;

        // Actor is a linked token
        if (!tokenDocument && targetTokenUuid) {
            tokenDocument = fromUuidSync(targetTokenUuid)?.document;
        }

        if (!tokenDocument && canvas.tokens) {
            // Case 1: A single token is selected, and it is the actor we are looking for
            if (
                canvas.tokens.controlled?.length == 1 &&
                canvas.tokens.controlled[0].actor.id === this.id
            ) {
                tokenDocument = canvas.tokens.controlled[0].document;
            }

            if (!tokenDocument) {
                // Case 2: Search all tokens on the active scene, and select the first
                // one found where the token's actor is the one we are looking for
                const token = canvas.scene?.tokens.find(
                    (t) => t.actor.id === this.id,
                );
                tokenDocument = token.document;
            }
        }

        return tokenDocument;
    }

    /**
     * Determines the actor to handle a button event, based on who pressed the button.
     * Options are the sum of:
     * User's character actor.
     * If there is an active scene, all of the tokens on the active scene owned by the user.
     * All of the global actors which are owned by the user.
     * If the result is more than one actor, display a dialog asking the user to select one.
     *
     * @returns {SohlActor|null} one SohlActor document, or null if none can be found.
     */
    static async getHandlerActor() {
        const actors = [];

        // If the user has a character defined, add it to the list of actors
        if (game.user.character) {
            actors.push(game.user.character);
        }

        // Find all of the tokens on the canvas, and if the current user has ownership permission, add them to the list.
        canvas.tokens.placeables.forEach((token) => {
            if (token.actor?.testUserPermission(game.user, "OWNER")) {
                if (!actors.some((a) => a.id === token.actor.id))
                    actors.push(token.actor);
            }
        });

        // Find all of the global actors who the current user has OWNER permission for, and add them to the list.
        game.actors.forEach((actor) => {
            if (actor.testUserPermission(game.user, "OWNER")) {
                if (!actors.some((a) => a.id === actor.id)) actors.push(actor);
            }
        });

        if (actors.length === 0) return null;
        if (actors.length === 1) return actors[0].value;

        let dlgHtml = `<form>
                <div class="form-group">
                    <label>Animate Entities:</label>
                    <select name="entity">`;

        actors.forEach((a, i) => {
            dlgHtml += `<option value="${a.uuid}"${!i ? " selected" : ""}>${a.name}</option>`;
        });
        dlgHtml += `</select></div></form>`;

        // Pop up the dialog to get the character selection
        const dlgResult = await Dialog.prompt({
            title: "Select Animate Entity",
            content: dlgHtml.trim(),
            label: "OK",
            callback: (element) => {
                const form = element.querySelector("form");
                const fd = new FormDataExtended(form);
                const formData = sohl.utils.expandObject(fd.object);
                const actor = fromUuidSync(formData.entity);
                return actor;
            },
            rejectClose: false,
            options: { jQuery: false },
        });

        return dlgResult;
    }

    static createUniqueName(baseName) {
        if (!baseName) {
            throw new Error("Must provide baseName");
        }
        const takenNames = new Set();
        for (const document of game.actors) takenNames.add(document.name);
        let name = baseName;
        let index = 1;
        while (takenNames.has(name)) name = `${baseName} (${++index})`;
        return name;
    }

    /** @override */
    async _preCreate(createData, options, user) {
        const allowed = await super._preCreate(createData, options, user);
        if (allowed === false) return false;
        let updateData = {};

        const similarActorExists =
            !this.pack &&
            game.actors.some(
                (actor) =>
                    actor.type === createData.type &&
                    actor.name === createData.name,
            );
        if (similarActorExists) {
            updateData["name"] = SohlActor.createUniqueName(createData.name);
        }

        // If the created actor has items (only applicable to duplicated actors) bypass the new actor creation logic
        if (createData.items) {
            if (options.cloneActorUuid) {
                const cloneActor = await fromUuid(options.cloneActorUuid);
                if (cloneActor) {
                    let newData = cloneActor.toObject();
                    delete newData._id;
                    delete newData.folder;
                    delete newData.sort;
                    delete newData.pack;
                    if ("ownership" in newData) {
                        newData.ownership = {
                            default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER,
                            [game.user.id]:
                                CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER,
                        };
                    }

                    updateData = sohl.utils.mergeObject(newData, createData);
                }
            }

            const artwork = this.constructor.getDefaultArtwork(this.toObject());
            if (!this.img) updateData["img"] = artwork.img;
            if (!this.prototypeToken.texture.src)
                updateData["prototypeToken.texture.src"] = artwork.texture.src;

            // If a rollFormula is provided, then we will perform the designated rolling
            // for all attributes, and then for all skills we will calculate the initial
            // mastery level based on those attributes.
            if (options.rollFormula) {
                for (const obj of updateData.items) {
                    if (
                        options.rollFormula &&
                        obj.type === "trait" &&
                        obj.system.intensity === "attribute"
                    ) {
                        const rollFormula =
                            (options.rollFormula === "default" ?
                                obj.flags?.sohl?.diceFormula
                            :   options.rollFormula) || "0";

                        let roll = Roll.create(rollFormula);
                        roll = await roll.evaluate().catch((err) => {
                            Hooks.onError("SohlActor#_preCreate", err, {
                                msg: `Roll formula "${rollFormula}" is invalid`,
                                log: "error",
                            });
                            return false;
                        });
                        obj.system.textValue = roll.total.toString();
                    }
                }

                // Calculate initial skills mastery levels
                for (const obj of updateData.items) {
                    if (obj.type === "skill") {
                        if (obj.flags?.sohl?.legendary?.initSkillMult) {
                            const sb = new SkillBase(
                                obj.system.skillBaseFormula,
                                {
                                    items: updateData.items,
                                },
                            );
                            obj.system.masteryLevelBase =
                                sb.value *
                                obj.flags.sohl.legendary.initSkillMult;
                        }
                    }
                }
            }
        }

        this.updateSource(updateData);

        return true;
    }

    _onCreate(data, options, userId) {
        super._onCreate(data, options, userId);
        this.updateEffectsOrigin();
    }

    _onSortItem(event, itemData) {
        // Get the drag source and drop target
        let source;
        for (const it of this.allItems()) {
            if (it.id === itemData._id) {
                source = it;
                break;
            }
        }

        const dropTarget = event.target.closest("[data-item-id]");
        if (!dropTarget) return;
        let target;
        for (const it of this.allItems()) {
            if (it.id === dropTarget.dataset.itemId) {
                target = it;
                break;
            }
        }

        // Don't sort on yourself
        if (source.id === target.id) return;

        // Identify sibling items based on adjacent HTML elements
        const siblings = [];
        for (let el of dropTarget.parentElement.children) {
            const siblingId = el.dataset.itemId;
            if (siblingId && siblingId !== source.id) {
                for (const it of this.allItems()) {
                    if (it.id === el.dataset.itemId) {
                        siblings.push(it);
                        break;
                    }
                }
            }
        }

        // Perform the sort
        const sortUpdates = SortingHelpers.performIntegerSort(source, {
            target,
            siblings,
        });

        sortUpdates.forEach((u) => {
            const update = u.update;
            const item = this.getItem(u.target._id);
            item.update(update);
        });
    }

    prepareEmbeddedDocuments() {
        // The Actor#prepareEmbeddedDocuments method performs Active Effect processing after
        // preparing the embedded documents, but we don't want that.  So we fully override to
        // put back in the basic implementation from ClientDocument.
        for (const collectionName of Object.keys(
            this.constructor.hierarchy || {},
        )) {
            for (let e of this.getEmbeddedCollection(collectionName)) {
                e._safePrepareData();
            }
        }

        // At this point, the virtual items list is empty.  We now go through
        // all of the "owned" items and request them to setup any virtual items they need.
        // Any of those items that setup virtual items will have "setupVirtualItems" called
        // when they are added to the Virtual Items list.
        for (const it of this.dynamicAllItems()) {
            it.system.execute("Setup Virtual Items", { inPrepareData: true });
        }

        // Apply item active effects
        for (const it of this.allItems()) {
            // If item is nested, ensure all active effects have been started
            // if (it.isNested) {
            //     it.effects.forEach((e) => {
            //         if (!e.duration.startTime) {
            //             e.update(
            //                 ActiveEffect.implementation.getInitialDuration(),
            //             );
            //         }
            //     });
            // }
            it.applyActiveEffects();
        }

        // Apply actor active effects
        this.applyActiveEffects();

        // Process any item activities that require access to sibling items
        // Prior to this point accessing item siblings is unsafe
        for (const it of this.allItems()) {
            it.system.execute("Process Siblings", { inPrepareData: true });
            if (it instanceof GearItemData) {
                Hooks.callAll(`gearProcessSiblings`, it.system);
            }
            Hooks.callAll(`${it.type}ProcessSiblings`, it.system);
        }
    }

    prepareDerivedData() {
        super.prepareDerivedData();

        // Perform final processing of all items after the actor's
        // derived data has all been completed.
        for (const it of this.allItems()) {
            it.system.execute("Post-Process", { inPrepareData: true });
            if (it instanceof GearItemData) {
                Hooks.callAll(`gearPostProcess`, it.system);
            }
            Hooks.callAll(`${it.type}PostProcess`, it.system);
        }
    }

    async updateEffectsOrigin() {
        // If we are in a compendium, do nothing
        if (this.pack) return;

        const actorUpdate = this.effects.reduce((toUpdate, e) => {
            if (e.origin !== this.uuid) {
                return toUpdate.concat({ _id: e.id, origin: this.uuid });
            }
            return toUpdate;
        }, []);
        if (actorUpdate.length) {
            await this.updateEmbeddedDocuments("ActiveEffect", actorUpdate);
        }

        for (const it of this.items) {
            const toUpdate = it.updateEffectsOrigin();
            if (toUpdate.length) {
                await it.updateEmbeddedDocuments("ActiveEffect", toUpdate);
            }
        }

        this.system.virtualItems.forEach((it) => {
            const toUpdate = it.updateEffectsOrigin();
            while (toUpdate.length) {
                const eChange = toUpdate.pop();
                const effect = it.effects.get(eChange._id);
                if (effect) {
                    effect.update({ origin: eChange.origin });
                }
            }
        });
    }

    /**
     * Get a reference to the trait item on the actor.
     *
     * @param {string} abbrev Abbreviation of trait Item to find
     * @returns {SohlItem} SohlItem of the trait.
     */
    getTraitByAbbrev(abbrev) {
        let result = null;
        for (const it of this.allItems()) {
            if (
                it.system instanceof TraitItemData &&
                it.system.abbrev === abbrev
            ) {
                result = it;
                break;
            }
        }
        return result;
    }

    /**
     * Get a reference to the trait item on the actor.
     *
     * @param {string} abbrev Abbreviation of trait Item to find
     * @returns {SohlItem} SohlItem of the trait.
     */
    getSkillByAbbrev(abbrev) {
        let result = null;
        for (const it of this.allItems()) {
            if (
                it.system instanceof SkillItemData &&
                it.system.abbrev === abbrev
            ) {
                result = it;
                break;
            }
        }
        return result;
    }

    /**
     * Finds an Item by name or UUID. If name is provided, searches within the specified actor.
     *
     * @param {String} itemName Either an item id, an item UUID, or an item name
     * @param {String} type The type of Item (e.g., "weapongear")
     * @returns {Nullable<SohlItem>} The item found, or null if not found
     */
    getItem(itemName, { types = [], isName = false } = {}) {
        if (!itemName) {
            throw new Error(`Must specify a name, id, or UUID`);
        }

        const formatter = game.i18n.getListFormatter();
        const typeNames =
            formatter.format(types.map((t) => _l(CONFIG.Item.typeLabels[t]))) ||
            _l("item");

        let item = null;
        if (itemName.includes(".")) {
            // The name may be a UUID since it contains a dot
            // First, check all items on this actor
            for (let it of this.allItems()) {
                if (it.uuid === itemName) {
                    item = it;
                    break;
                }
            }

            // If item wasn't found, then perform a more general search for the UUID
            if (!item) item = fromUuidSync(itemName);

            if (
                item &&
                !(item instanceof SohlItem && item.actor.id === this.id)
            ) {
                throw new Error(
                    `${itemName} does not refer to an item in actor ${this.name}`,
                );
            }
        }

        if (!item) {
            // Not an item UUID, so we assume it must be an item id or name.
            let items = [];
            if (types?.length) {
                // Type(s) have been specified, so we can use these as a hint as to where to look
                // for the items.
                for (const it of this.allItems()) {
                    if (types.includes(it.type)) {
                        const testVal = isName ? it.name : it.system.abbrev;
                        if (testVal === itemName) items.push(it);
                    }
                }
            } else {
                // No types have been specified, so our only option is to assume it is an item ID and look for that
                for (let candidate of this.allItems()) {
                    if (candidate.id === itemName) {
                        items = [candidate];
                        break;
                    }
                }
            }

            if (items.length > 1) {
                const msg = `Actor ${this.token?.name || this.name} has more than one ${typeNames} with name ${itemName}. The first matched item will be chosen.`;
                if (ui.notifications) {
                    ui.notifications?.warn(msg);
                } else {
                    console.warn(msg);
                }
                return null;
            }

            // Filter returns potentially multiple matches; so just choose the
            // first one as the result (there really should be only one result
            // anyway, or the name is ambiguous).
            item = items[0];
        }

        if (!item || (types.length && !types.includes(item.type))) {
            const msg = `Actor ${this.token?.name || this.name} does not have an ${typeNames} named ${itemName}`;
            if (ui.notifications) {
                ui.notifications?.warn(msg);
            } else {
                console.warn(msg);
            }
            return null;
        }

        return item;
    }

    isValidItem(item, types = []) {
        if (!(item?.system instanceof SohlItemData)) {
            throw new Error(`Provided object is not a valid Item`);
        }

        if (!types.includes(item.type)) {
            const formatter = game.i18n.getListFormatter();
            throw new Error(
                `Item ${item.system.metadata.label} must be one of "${formatter(
                    types.map((t) => _l(`TYPES.Item.${t}.label`)),
                )}")}`,
            );
        }
    }

    /**
     * Gathers all effects from all items that are targeting the Actor and returns them as an array.
     *
     * @readonly
     * @type {*}
     */
    get transferredEffects() {
        // Gather all of the effects from all items that are targeting the Actor
        const result = [];
        for (const it of this.allItems()) {
            const actorEffects = it.effects.filter(
                (e) => e.system.targetType === "actor",
            );
            result.push(...actorEffects);
        }

        return result;
    }

    *allApplicableEffects() {
        // Grab all of the effects on this actor that affect this actor
        const effects = this.effects.filter((e) =>
            ["this", "actor"].includes(e.system.targetType),
        );
        for (const effect of effects) {
            yield effect;
        }

        // Add all of the transferred effects from the items that affect this actor
        for (const effect of this.transferredEffects) {
            yield effect;
        }
    }

    /**
     * Apply all active effects to the actor, including special statuses, effects from items, and transferred effects. Update overrides and special statuses for the actor and its items accordingly.
     */
    applyActiveEffects() {
        const overrides = {
            [this.id]: {},
        };
        this.statuses.clear();

        // Organize non-disabled effects by their application priority
        const changes = [];
        for (const effect of this.allApplicableEffects()) {
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
            for (const statusId of effect.statuses) this.statuses.add(statusId);
        }
        changes.sort((a, b) => a.priority - b.priority);

        // Apply all changes
        for (let change of changes) {
            if (!change.key) continue;
            if (!change.targets?.length) continue;
            change.targets.forEach((t) => {
                const changes = change.effect.apply(t, change);
                if (Object.keys(changes).length) {
                    if (typeof overrides[t.id] === "object")
                        sohl.utils.mergeObject(overrides[t.id], changes);
                    else overrides[t.id] = changes;
                }
            });
        }

        // Expand the set of final overrides
        this.overrides = sohl.utils.expandObject(overrides[this.id]);
        for (const it of this.allItems()) {
            if (overrides[it.id])
                it.overrides = sohl.utils.expandObject(overrides[it.id]);
        }
    }

    /**
     * Executes the checkAndExecute method for EventItemData instances in the allItems array and checks and disables expired effects for each item in the allItems array as well as the effects array.
     */
    timeChangeWork() {
        for (const it of this.allItems()) {
            if (it.system instanceof EventItemData) it.checkAndExecute();
            it.effects.forEach((effect) => effect.checkExpiredAndDisable());
        }
        this.effects.forEach((effect) => effect.checkExpiredAndDisable());
    }

    /**
     * Add all of the items from a pack with the specified names to this actor
     * @param {String[]} itemNames Array of item names to include
     * @param {String} packName Name of compendium pack containing items
     * @param {Object[]} items array of ItemData elements to populate
     */
    static async _addItemsFromPack(
        itemNames,
        packNames,
        { itemType, keepId } = {},
    ) {
        let itNames = sohl.utils.deepClone(itemNames);
        const itemAry = [];
        for (let itName of itNames) {
            const data = await Utility.getItemFromPacks(itName, packNames, {
                itemType,
                keepId,
            });
            if (data) itemAry.push(data);
        }

        return itemAry;
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

    static async importActors(jsonFilename, folderName) {
        const response = await fetch(jsonFilename);
        const content = await response.json();

        let actorFolder = game.folders.find(
            (f) => f.name === folderName && f.type === "Actor",
        );
        if (actorFolder) {
            const msg = `Folder ${folderName} exists, delete it before proceeding`;
            console.error(msg);
            return;
        }

        actorFolder = await Folder.create({ type: "Actor", name: folderName });

        await Utility.asyncForEach(content.Actor, async (f) => {
            console.log("Processing Actor ${f.name}");
            const actor = await this.create({ name: f.name });
            const updateData = [];
            const itemData = [];
            // Fill in attribute values
            Object.keys(f.system.attributes).forEach((attr) => {
                const attrItem = actor.items.find(
                    (it) =>
                        it.system instanceof TraitItemData &&
                        it.name.toLowerCase() === attr,
                );
                if (attrItem)
                    itemData.push({
                        _id: attrItem.id,
                        "system.textValue": f.system.attributes[attr].base,
                    });
            });

            updateData.push({
                "system.description": f.system.description,
                "system.bioImage": f.system.bioImage,
                "system.biography": f.system.biography,
                "prototypeToken.actorLink": f.prototypeToken.actorLink,
                "prototypeToken.name": f.prototypeToken.name,
                "prototypeToken.texture.src": f.prototypeToken.texture.src,
                folder: actorFolder.id,
                items: itemData,
            });

            await actor.update(updateData);
        });
    }
}
