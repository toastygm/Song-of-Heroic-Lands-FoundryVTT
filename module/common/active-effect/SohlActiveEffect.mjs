import { SOHL } from "./constants.mjs";
import { SohlContextMenu } from "./SohlContextMenu.mjs";
import { Utility } from "./utility.mjs";
import { GearItemData } from "./GearItemData.mjs";
import { fields } from "../sohl-common.mjs";
import { SohlActor } from "./SohlActor.mjs";
import { SohlActiveEffectData } from "./SohlActiveEffectData.mjs";
import { SohlItem } from "./SohlItem.mjs";
import { ValueModifier } from "../modifier/ValueModifier.mjs";

export class SohlActiveEffect extends ActiveEffect {
    static defineSchema() {
        return sohl.utils.mergeObject(
            super.defineSchema(),
            {
                type: new fields.DocumentTypeField(this, {
                    initial: SohlActiveEffectData.TYPE_NAME,
                }),
            },
            { inplace: false },
        );
    }

    get modifiesActor() {
        if (!this.active) return false;
        return this.item ?
                this.system.targetType === "actor"
            :   ["actor", "this"].includes(this.system.targetType);
    }

    /** @override */
    get isSuppressed() {
        // let hasAuralShock = false;
        // if (this.parent instanceof SohlActor) {
        //     if (!this.origin) return false;
        //     hasAuralShock = this.parent
        //         .allItems()
        //         .some(
        //             (it) =>
        //                 it.system instanceof AfflictionItemData &&
        //                 it.system.subType === "auralshock",
        //         );
        // } else {
        if (!this.origin) return true;
        // }
        const source = this.item || fromUuidSync(this.origin);

        if (
            source?.system instanceof GearItemData &&
            !source.system.isEquipped
        ) {
            return true;
        }

        if (!source) {
            console.warn(
                `Actor ${this.parent.name} effect ${this.name} has invalid origin ${this.origin}`,
            );
            return true;
        }

        // if (
        //     hasAuralShock &&
        //     source.system.skillBase.attributes.includes("Aura")
        // ) {
        //     return true;
        // }
        return false;
    }

    _getContextOptions() {
        const result = [
            {
                name: "Edit",
                icon: `<i class="fas fa-edit"></i>`,
                condition: (header) => {
                    if (game.user.isGM) return true;
                    header = header instanceof HTMLElement ? header : header[0];
                    const li = header.closest(".effect");
                    const parent = fromUuidSync(li.dataset.effectParentUuid);
                    const effect = parent?.effects.get(li.dataset.effectId);
                    return effect?.isOwner;
                },
                callback: (header) => {
                    header = header instanceof HTMLElement ? header : header[0];
                    const li = header.closest(".effect");
                    const parent = fromUuidSync(li.dataset.effectParentUuid);
                    const effect = parent?.effects.get(li.dataset.effectId);
                    if (effect) {
                        effect.sheet.render(true);
                    } else {
                        throw new Error(
                            `Effect ${li.dataset.effectUuid} not found.`,
                        );
                    }
                },
                group: SohlContextMenu.SORT_GROUPS.GENERAL,
            },
            {
                name: "Delete",
                icon: `<i class="fas fa-trash"></i>`,
                condition: (header) => {
                    if (game.user.isGM) return true;
                    header = header instanceof HTMLElement ? header : header[0];
                    const li = header.closest(".effect");
                    const parent = fromUuidSync(li.dataset.effectParentUuid);
                    const effect = parent?.effects.get(li.dataset.effectId);
                    return effect?.isOwner;
                },
                callback: (header) => {
                    header = header instanceof HTMLElement ? header : header[0];
                    const li = header.closest(".effect");
                    const parent = fromUuidSync(li.dataset.effectParentUuid);
                    const effect = parent?.effects.get(li.dataset.effectId);
                    if (effect) {
                        return Dialog.confirm({
                            title: `Delete Active Effect: ${effect.name}`,
                            content:
                                "<p>Are You Sure?</p><p>This active effect will be deleted and cannot be recovered.</p>",
                            yes: () => {
                                return effect.delete();
                            },
                        });
                    } else {
                        throw new Error(
                            `Effect ${li.dataset.effectUuid} not found.`,
                        );
                    }
                },
                group: SohlContextMenu.SORT_GROUPS.GENERAL,
            },
            {
                name: "Toggle",
                icon: `<i class="fas ${this.disabled ? "fa-toggle-on" : "fa-toggle-off"}"></i>`,
                condition: (header) => {
                    if (game.user.isGM) return true;
                    header = header instanceof HTMLElement ? header : header[0];
                    const li = header.closest(".effect");
                    const parent = fromUuidSync(li.dataset.effectParentUuid);
                    const effect = parent?.effects.get(li.dataset.effectId);
                    return effect?.isOwner;
                },
                callback: (header) => {
                    header = header instanceof HTMLElement ? header : header[0];
                    const li = header.closest(".effect");
                    const parent = fromUuidSync(li.dataset.effectParentUuid);
                    const effect = parent?.effects.get(li.dataset.effectId);
                    if (effect) {
                        effect.toggleEnabledState();
                    } else {
                        throw new Error(
                            `Effect ${li.dataset.effectUuid} not found.`,
                        );
                    }
                },
                group: SohlContextMenu.SORT_GROUPS.GENERAL,
            },
        ];
        return result;
    }

    async toggleEnabledState() {
        const updateData = {};
        if (this.disabled) {
            // Enable the Active Effect
            updateData["disabled"] = false;

            // Also set the timer to start now
            updateData["duration.startTime"] = game.time.worldTime;
            if (game.combat) {
                updateData["duration.startRound"] = game.combat.round;
                updateData["duration.startTurn"] = game.combat.turn;
            }
        } else {
            // Disable the Active Effect
            updateData["disabled"] = true;
        }
        return await this.update(updateData);
    }

    /** @override */
    _onCreate(data, options, userId) {
        super._onCreate(data, options, userId);

        // Reset the origin for this AE if it is on an item associated with an Actor
        if (
            this.parent instanceof SohlItem &&
            this.parent.parent instanceof SohlActor
        ) {
            this.origin = this.parent.uuid;
        }
    }

    /** @override */
    apply(doc, change) {
        let changes = {};
        if (change.key.startsWith("mod:")) {
            // Any change that starts with "mod:" is a modifier
            this._handleAEMods(doc, change, changes);
        } else {
            // Otherwise, handle as normal
            changes = super.apply(doc, change);
        }
        return changes;
    }

    _handleAEMods(doc, change, changes) {
        const modKey = change.key.slice(4);

        const mods = sohl.utils.getProperty(doc, modKey);
        if (!(mods instanceof ValueModifier)) {
            console.error(
                `SoHL | Invalid target: "${modKey}" is not a ValueModifier for ${doc.name}`,
            );
            return;
        }

        const effectKeyValue = this.getEffectKeyValue(change.key);

        const modName = effectKeyValue.label;
        const modAbbr = effectKeyValue.abbrev;

        switch (change.mode) {
            case CONST.ACTIVE_EFFECT_MODES.ADD:
                mods.add(modName, modAbbr, change.value);
                break;

            case CONST.ACTIVE_EFFECT_MODES.MULTIPLY:
                mods.multiply(modName, modAbbr, change.value);
                break;

            case CONST.ACTIVE_EFFECT_MODES.UPGRADE:
                mods.floor(modName, modAbbr, change.value);
                break;

            case CONST.ACTIVE_EFFECT_MODES.DOWNGRADE:
                mods.ceiling(modName, modAbbr, change.value);
                break;

            case CONST.ACTIVE_EFFECT_MODES.OVERRIDE:
                mods.set(modName, modAbbr, change.value);
                break;
        }

        return (changes[modKey] = mods);
    }

    async checkExpiredAndDisable() {
        if (!this.disabled) {
            const duration = this.duration;
            if (duration.type && duration.type !== "none") {
                if (duration.remaining <= 0) {
                    await this.update({ disabled: true });
                }
            }
        }
    }

    getEffectKeyValue(key) {
        let result;
        let targetType = this.system.targetType || "this";
        if (this.parent instanceof SohlActor) {
            if (["this", "actor"].includes(targetType)) {
                result = this.parent.system.TYPE_NAME;
            } else {
                result =
                    CONFIG.Item.dataModels?.[targetType].metadata.effectKeys?.[
                        key
                    ];
            }
        } else if (this.parent instanceof SohlItem) {
            if (targetType === "actor") {
                result = this.parent.actor?.system.effectKeys[key];
            } else if (targetType === "this") {
                result = this.parent.system.effectKeys[key];
            } else {
                result =
                    CONFIG.Item.dataModels?.[targetType].metadata.effectKeys[
                        key
                    ];
            }
        }
        return result || { label: "Unknown", abbrev: "UNKNOWN" };
    }

    getEffectKeyChoices() {
        let result = [];
        let targetType = this.system.targetType || "this";
        if (this.parent instanceof SohlActor) {
            if (["this", "actor"].includes(targetType)) {
                result = this.parent.system.effectKeys;
            } else {
                result =
                    CONFIG.Item.dataModels?.[targetType].metadata.effectKeys ||
                    [];
            }
        } else if (this.parent instanceof SohlItem) {
            if (targetType === "actor") {
                result = this.parent.actor?.system.effectKeys || [];
            } else if (targetType === "this") {
                result = this.parent.system.effectKeys;
            } else {
                result =
                    CONFIG.Item.dataModels?.[targetType].metadata.effectKeys ||
                    [];
            }
        }
        return result;
    }

    /**
     * Returns a string representation of the changes made. If there are no changes, it returns 'No Changes'. Each change is mapped to a formatted string based on the change mode. The format includes the key, value, and mode of the change. The prefix for each change is determined based on the targetType and the parent object. The format varies depending on the mode of the change, such as ADD, MULTIPLY, OVERRIDE, UPGRADE, DOWNGRADE, or default. The formatted strings for each change are joined with a comma separator and returned as a single string.
     *
     * @returns {*}
     */
    get _aeChanges() {
        if (!this.changes || !this.changes.length) {
            return "SOHL.NoChanges";
        }

        return this.changes
            .map((ch) => {
                const modes = CONST.ACTIVE_EFFECT_MODES;
                const key = ch.key;
                const val = ch.value;
                let prefix = this.getEffectKeyValue(key).abbrev;

                switch (ch.mode) {
                    case modes.ADD:
                        return `${prefix} ${val < 0 ? "-" : "+"} ${Math.abs(
                            val,
                        )}`;
                    case modes.MULTIPLY:
                        return `${prefix} ${SOHL.CHARS.TIMES} ${val}`;
                    case modes.OVERRIDE:
                        return `${prefix} = ${val}`;
                    case modes.UPGRADE:
                        return `${prefix} ${SOHL.CHARS.GREATERTHANOREQUAL} ${val}`;
                    case modes.DOWNGRADE:
                        return `${prefix} ${SOHL.CHARS.LESSTHANOREQUAL} ${val}`;
                    default:
                        return !val ? `${prefix}` : `${prefix} ~ ${val}`;
                }
            })
            .join(", ");
    }

    _prepareDuration() {
        const d = super._prepareDuration();
        if (d.type === "seconds") {
            d.endTime = d._worldTime + d.remaining;
            d.endTimeHtml = Utility.htmlWorldTime(d.endTime);
        }
        return d;
    }

    get _aeDuration() {
        const d = this.duration;

        // Time-based duration
        if (Number.isNumeric(d.seconds)) {
            const start = d.startTime || game.time.worldTime;
            const elapsed = game.time.worldTime - start;
            const remaining = Math.max(d.seconds - elapsed, 0);
            //const normDuration = toNormTime(d.seconds);
            const normRemaining = Utility.formatDuration(remaining);
            return {
                type: "seconds",
                duration: d.seconds,
                remaining: remaining,
                label: normRemaining,
            };
        }

        // Turn-based duration
        else if (d.rounds || d.turns) {
            // Determine the current combat duration
            const cbt = game.combat;
            const c = {
                round: cbt?.round ?? 0,
                turn: cbt?.turn ?? 0,
                nTurns: cbt?.turns.length ?? 1,
            };

            // Determine how many rounds and turns have elapsed
            let elapsedRounds = Math.max(c.round - (d.startRound || 0), 0);
            let elapsedTurns = c.turn - (d.startTurn || 0);
            if (elapsedTurns < 0) {
                elapsedRounds -= 1;
                elapsedTurns += c.nTurns;
            }

            // Compute the number of rounds and turns that are remaining
            let remainingRounds = (d.rounds || 0) - elapsedRounds;
            let remainingTurns = (d.turns || 0) - elapsedTurns;
            if (remainingTurns < 0) {
                remainingRounds -= 1;
                remainingTurns += c.nTurns;
            } else if (remainingTurns > c.nTurns) {
                remainingRounds += Math.floor(remainingTurns / c.nTurns);
                remainingTurns %= c.nTurns;
            }

            // Total remaining duration
            if (remainingRounds < 0) {
                remainingRounds = 0;
                remainingTurns = 0;
            }
            const duration = (c.rounds || 0) + (c.turns || 0) / 100;
            const remaining = remainingRounds + remainingTurns / 100;

            // Remaining label
            const label = [
                remainingRounds > 0 ? `${remainingRounds} Rounds` : null,
                remainingTurns > 0 ? `${remainingTurns} Turns` : null,
                remainingRounds + remainingTurns === 0 ? "None" : null,
            ].filterJoin(", ");
            return {
                type: "turns",
                duration: duration,
                remaining: remaining,
                label: label,
            };
        }

        // No duration
        else {
            return {
                type: "none",
                duration: null,
                remaining: null,
                label: "None",
            };
        }
    }

    async _preCreate(newData, options, user) {
        let origin = newData.origin || this.parent?.uuid;
        this.updateSource({
            type: SohlActiveEffectData.TYPE_NAME,
            origin: origin,
        });
        return super._preCreate(newData, options, user);
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
            if (!doc) throw new Error(`${this.documentName} creation failed`);

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
        if (!(context?.parent instanceof SohlItem))
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
            const itemIdx = newAry.findIndex((it) => it._id === update?._id);
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
        const changedDocs = collection.filter((it) => result.includes(it.id));
        changedDocs.forEach((doc) => doc.render());
        context.parent.render();
        return changedDocs;
    }

    /** @inheritdoc */
    static async deleteDocuments(ids = [], operation = {}) {
        if (!(operation?.parent instanceof SohlItem))
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

    static async create(data, options = {}) {
        let newData =
            data instanceof Document ?
                data.toObject()
            :   sohl.utils.deepClone(data);

        if (Object.keys(newData).some((k) => /\./.test(k))) {
            newData = sohl.utils.expandObject(newData);
        }

        if (options.clean) {
            delete newData.sort;
        }

        if (!newData.img) {
            newData.img = CONFIG.controlIcons.effects;
        }

        if (!("ownership" in data)) {
            newData.ownership = {
                default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER,
            };
        }

        // If nestedIn is specified, use update() on the nestedIn
        if (options.parent?.isNested) {
            const effectsAry = options.parent.effects.toObject();
            let doc = effectsAry.find((it) => (it._id = options.parent.id));
            let newAry = sohl.utils.deepClone(doc.effects);

            const effectExists = newAry.some((obj) => obj._id === newData._id);
            if (effectExists) {
                throw new Error(
                    `Effect with id ${newData._id} already exists in ${options.parent.nestedIn.label}`,
                );
            }

            let effect = new SohlActiveEffect(newData, options);
            //await item._preCreate(newData, options, game.user);
            const effectData = effect.toObject();

            // Set sort property
            let maxSort = newAry.reduce(
                (max, obj) => Math.max(max, obj.sort),
                0,
            );
            maxSort += CONST.SORT_INTEGER_DENSITY;
            effectData.sort = maxSort;
            newAry.push(effectData);

            const result = await options.parent.update({
                effects: newAry,
            });
            options.parent.sheet.render();
            return result;
        } else {
            return await super.create(newData, options);
        }
    }

    /** @override */
    update(data = [], context = {}) {
        // Note that this method will return a direct response if called
        // on an item with an nestedIn, otherwise it will return a Promise.
        let result = null;

        if (this.parent?.nestedIn) {
            this.updateSource(data);
            const newAry = this.parent.effects.contents;
            const idx = newAry.findIndex((obj) => obj._id === this.id);
            if (idx >= 0) {
                newAry[idx] = this.toObject();
                newAry.sort((a, b) => a.sort - b.sort);
                const updateData = {
                    "system.effects": newAry,
                };
                result = this.parent.nestedIn.update(updateData, context);
                if (this.parent.sheet.rendered) this.parent.sheet.render();
            }
        } else {
            result = super.update(data, context);
        }

        return result;
    }

    /** @override */
    delete(context = {}) {
        // Note that this method will return a direct response if called
        // on an item with either nestedIn or cause with a truthy value,
        // otherwise it will return a Promise.
        if (this.parent?.nestedIn) {
            const newAry = this.parent.effects.contents;
            const filtered = newAry.filter((obj) => obj._id !== this.id);
            if (filtered.length !== newAry.length) {
                this.parent.nestedIn.update(
                    { "system.effects": filtered },
                    context,
                );
            }
            this.parent.sheet.render();
            return this;
        } else {
            return super.delete(context);
        }
    }
}
