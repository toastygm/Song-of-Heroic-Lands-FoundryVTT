import { _l } from "../../helper/sohl-localize.mjs";
import { SohlContextMenu } from "../../helper/SohlContextMenu.mjs";
import { Utility } from "../../helper/utility.mjs";
import { fields } from "../../../sohl-common.mjs";
import { SohlMacro } from "../../macro/SohlMacro.mjs";
import { EventItemData } from "./EventItemData.mjs";
import { ContainerGearItemData } from "./ContainerGearItemData.mjs";
import { GearItemData } from "./GearItemData.mjs";
import { CombatTechniqueStrikeModeItemData } from "./CombatTechniqueStrikeModeItemData.mjs";
import { MissileWeaponStrikeModeItemData } from "../../MissileWeaponStrikeModeItemData.mjs";
import { MeleeWeaponStrikeModeItemData } from "../../MeleeWeaponStrikeModeItemData.mjs";
import { ProtectionItemData } from "../../ProtectionItemData.mjs";
import { SohlBaseData } from "../../abstract/SohlBaseData.mjs";
import { SohlItem } from "../SohlItem.mjs";
import { ValueModifier } from "../../modifier/ValueModifier.mjs";

export class SohlItemData extends SohlBaseData {
    /** @typedef SohlAction
     * @property {string} id - The unique identifier for the action.
     * @property {string} contextIconClass - The CSS class for the action's icon.
     * @property {function|boolean} contextCondition - A function that checks the context condition for the action.
     * @property {string} contextGroup - The group to which the action belongs.
     * @property {boolean} [useAsync=false] - Indicates whether the action should be executed asynchronously.
     */
    /**
     * Static property containing constant actions with their identifiers, icons, context conditions, and other properties for a medical application.
     *
     * @constant
     * @type {Record<string, SohlAction>}
     */
    static ACTION = Object.freeze({
        EDIT: {
            id: "editItem",
            contextIconClass: "fas fa-edit",
            contextCondition: (header) => {
                header = header instanceof HTMLElement ? header : header[0];
                const li = header.closest(".item");
                const item = fromUuidSync(li.dataset.uuid);
                if (item.actor?.isOwner || item.isOwner) return true;
            },
            contextGroup: SohlContextMenu.SORT_GROUPS.GENERAL,
            useAsync: true,
        },

        DELETE: {
            id: "deleteItem",
            contextIconClass: "fas fa-trash",
            contextCondition: (header) => {
                header = header instanceof HTMLElement ? header : header[0];
                const li = header.closest(".item");
                const item = fromUuidSync(li.dataset.uuid);
                if (item.actor?.isOwner || item.isOwner) return true;
            },
            contextGroup: SohlContextMenu.SORT_GROUPS.GENERAL,
            useAsync: true,
        },

        SHOWDESC: {
            id: "showDescription",
            contextIconClass: "fas fa-scroll",
            contextCondition: (header) => {
                header = header instanceof HTMLElement ? header : header[0];
                const li = header.closest(".item");
                const item = fromUuidSync(li.dataset.uuid);
                if (!item) return false;
                return (
                    item &&
                    (item.system.description ||
                        item.system.notes ||
                        item.system.textReference)
                );
            },
            contextGroup: SohlContextMenu.SORT_GROUPS.GENERAL,
            useAsync: true,
        },

        SETUPVIRTUALITEMS: {
            id: "setupVirtualItems",
            contextIconClass: "far fa-gears",
            contextCondition: false,
            contextGroup: SohlContextMenu.SORT_GROUPS.HIDDEN,
            useAsync: false,
        },

        PROCESSSIBLINGS: {
            id: "processSiblings",
            contextIconClass: "far fa-gears",
            contextCondition: false,
            contextGroup: SohlContextMenu.SORT_GROUPS.HIDDEN,
            useAsync: false,
        },

        POSTPROCESS: {
            id: "postProcess",
            contextIconClass: "far fa-gears",
            contextCondition: false,
            contextGroup: SohlContextMenu.SORT_GROUPS.HIDDEN,
            useAsync: false,
        },
    });

    /** @inheritdoc */
    static metadata = Object.freeze(
        sohl.utils.mergeObject(
            super.metadata,
            {
                locId: "ITEMDATA",
                img: "",
                iconCssClass: "",
                sheet: "systems/sohl/templates/item/item-sheet.hbs",
                nestOnly: false,
                defaultAction: SohlItemData.ACTION.EDIT.id,
                actions: this.genActions(this.ACTION, "ITEMDATA"),
                schemaVersion: "0.6.5",
            },
            { inplace: false },
        ),
    );

    static defineSchema() {
        return sohl.utils.mergeObject(super.defineSchema(), {
            notes: new fields.StringField(),
            description: new fields.HTMLField(),
            textReference: new fields.StringField(),
            items: new fields.EmbeddedCollectionField(SohlItem),
            transfer: new fields.BooleanField({ initial: false }),
        });
    }

    static TYPE_LABEL = `TYPE.Item.${this.metadata.name}`;

    /** @inheritdoc */
    static get parentDocumentClass() {
        return SohlItem;
    }

    getEvent(eventTag) {
        return this.items.find(
            (it) =>
                it.system instanceof EventItemData &&
                it.system.tag === eventTag,
        );
    }

    get containers() {
        const result = this.items.reduce((ary, ei) => {
            if (ei.system instanceof ContainerGearItemData) {
                ary.push(ei);
            }
            return ary;
        }, []);
        return result;
    }

    /**
     * Returns the collection of nested, but not active, items.
     * These items do not get processed by prepareData(). These are
     * not yet true items; in order to get processed, these items must
     * be copied to the SohlActor#virtualItems collection prior to processing
     * the nested collections.
     *
     * For example, the GearItemData#prepareBaseData method will copy all
     * of the "gear" items to the SohlActor#virtualItems collection so they get
     * processed.  Similar actions occur with other items.
     */
    get items() {
        this._collections.items ||= new Collection();
        return this._collections.items;
    }

    get item() {
        if (this.parent instanceof SohlItem) {
            return this.parent;
        }
        throw new Error(
            `Invalid SohlItemData: must be associated with an SohlItem parent`,
        );
    }

    /** @override */
    get actor() {
        return this.item.actor;
    }

    get id() {
        return this.item.id;
    }

    get name() {
        return this.item.name;
    }

    get img() {
        return this.item.img;
    }

    get uuid() {
        return this.item.uuid;
    }

    get transferToActor() {
        return this.transfer;
    }

    same(other) {
        let result = super.same(other);
        if (result === SohlBaseData.comparison.DIFFERENT) return result;
        if (
            this.notes === other.notes &&
            this.description === other.description &&
            this.textReference === other.textReference &&
            this.transfer === other.transfer &&
            this.nestedItems.length === other.nestedItems.length
        ) {
            // TODO: Check that each nestedItem is identical
            return result;
        }
        return SohlBaseData.comparison.DIFFERENT;
    }

    /** @override */
    // FIXME biome-ignore lint/correctness/noUnusedVariables: <explanation>
    async _preCreate(data, options, userId) {
        super._preCreate(data, options, userId);
        return true;
    }

    async deleteItem() {
        // Create the dialog window
        const agree = await Dialog.confirm({
            title:
                this instanceof ContainerGearItemData ?
                    "SOHL.ITEMDATA.deleteItem.Container.title"
                :   "SOHL.ITEMDATA.deleteItem.NonContainer.title",
            content:
                this instanceof ContainerGearItemData ?
                    "SOHL.ITEMDATA.deleteItem.Container.queryHtml"
                :   "SOHL.ITEMDATA.deleteItem.NonContainer.queryHtml",
            yes: () => true,
        });

        if (agree) {
            await this.item.delete();
        }
    }

    async editItem() {
        await this.item.sheet.render(true);
    }

    async showDescription() {
        const chatData = {
            variant: game.sohl?.id,
            name: this.item.name,
            subtitle: this.label,
            level: this.$level.effective,
            desc: this.description,
            notes: this.notes,
            textRef: this.item.system.textReference,
        };

        const chatTemplate = "systems/sohl/templates/chat/item-desc-card.hbs";

        const chatHtml = await renderTemplate(chatTemplate, chatData);

        const messageData = {
            user: game.user.id,
            speaker: ChatMessage.getSpeaker(),
            content: chatHtml.trim(),
            sound: CONFIG.sounds.notification,
        };

        // Create a chat message
        return ChatMessage.create(messageData);
    }

    _preSuccessTestDialog(scope) {
        scope.rollMode ??= game.settings.get("core", "rollMode");
        scope.typeLabel ??= _l(this.constructor.metadata.label);
        scope.situationalModifier ??= 0;

        if (scope.testResult) {
            scope.testResult = Utility.JSON_reviver({
                thisArg: this,
            })("", scope.testResult);
        } else {
            if (!scope.mlMod)
                throw new Error("Must specify either testResult or mlMod");
            scope.testResult = new CONFIG.SuccessTestResult(scope, {
                parent: this,
            });
        }

        const sitMod = scope.testResult.mlMod.get(game.sohl?.MOD.Player.abbrev);

        if (sitMod?.op === ValueModifier.OPERATOR.ADD) {
            scope.testResult.situationalModifier = sitMod.value;
            scope.testResult.mlMod.delete(sitMod.abbrev);
        }

        const impSitMod = scope.testResult.impactMod?.get(
            game.sohl?.MOD.Player.abbrev,
        );

        if (impSitMod?.op === ValueModifier.OPERATOR.ADD) {
            scope.testResult.impactSituationalModifier = impSitMod.value;
            scope.testResult.impactMod.delete(impSitMod.abbrev);
        }

        return scope.testResult;
    }

    _postSuccessTestDialog(testResult, dlgResult) {
        if (dlgResult.situationalModifier) {
            testResult.mlMod.add(
                game.sohl?.MOD.Player,
                dlgResult.situationalModifier,
            );
        }

        testResult.mlMod.successLevelMod = dlgResult.successLevelMod;

        if (dlgResult.impactSituationalModifier) {
            testResult.impactMod.add(
                game.sohl?.MOD.Player,
                dlgResult.impactSituationalModifier,
            );
        }

        return testResult;
    }

    /**
     * Perform Success Test for this Item
     *
     * @param {object} options
     * @returns {SuccessTestChatData}
     */
    async successTest(speaker, actor, token, character, scope = {}) {
        let { skipDialog = false, noChat = false, testResult } = scope;

        ({ speaker, actor, token, character } = SohlMacro.getExecuteDefaults({
            speaker,
            actor,
            token,
            character,
            needsActor: true,
            self: this,
        }));

        scope.speaker ||= speaker;
        testResult = this._preSuccessTestDialog(scope);

        let dlgResult = null;
        if (!skipDialog) {
            // Render modal dialog
            let dlgTemplate =
                "systems/sohl/templates/dialog/standard-test-dialog.hbs";

            let { ...dialogData } = testResult;
            sohl.utils.mergeObject(dialogData, {
                variant: game.sohl?.id,
                title: `${this.actor.token ? this.actor.token.name : this.actor.name} ${testResult.title}`,
                rollModes: Object.entries(CONFIG.Dice.rollModes).map(
                    ([k, v]) => ({
                        group: "CHAT.RollDefault",
                        value: k,
                        label: v,
                    }),
                ),
            });
            const dlgHtml = await renderTemplate(dlgTemplate, dialogData);

            // Create the dialog window
            dlgResult = await Dialog.prompt({
                title: dialogData.title,
                content: dlgHtml.trim(),
                label: "Roll",
                callback: (element) => {
                    const form = element.querySelector("form");
                    const fd = new FormDataExtended(form);
                    const formData = fd.object;
                    return formData;
                },
                rejectClose: false,
                options: { jQuery: false },
            });

            if (!dlgResult) return false;
        }

        testResult = this._postSuccessTestDialog(testResult, dlgResult);

        let allowed = await testResult.evaluate();

        if (allowed && !noChat) {
            await testResult.toChat();
        }
        return allowed ? testResult : false;
    }

    /**
     * Prepare base data processing.  Cannot assume the actor exists or
     * has been setup.
     */
    prepareBaseData() {
        super.prepareBaseData();

        // Construct Nested Collection
        if (this._collections.items) delete this._collections.items;
        this.nestedItems
            .toSorted((a, b) => a.sort - b.sort)
            .forEach((ni) => {
                const ignore =
                    [
                        ProtectionItemData.metadata.name,
                        MeleeWeaponStrikeModeItemData.metadata.name,
                        MissileWeaponStrikeModeItemData.metadata.name,
                        CombatTechniqueStrikeModeItemData.metadata.name,
                    ].includes(ni.type) && ni.system.subType !== game.sohl?.id;

                if (!ignore) {
                    const data = sohl.utils.deepClone(ni);
                    const uuid = this.item.uuid;
                    data.effects?.forEach((e) => {
                        e.origin = uuid;
                    });
                    if (!data.ownership) {
                        data.ownership = {
                            default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER,
                        };
                    }
                    const item = new SohlItem(data, {
                        nestedIn: this.item,
                        keepId: true,
                    });
                    if (!item) {
                        console.error(
                            `Failure to create item ${ni.name} on ${this.nestedIn.name}`,
                        );
                    } else {
                        this.items.set(item.id, item);
                    }
                }
            });
    }

    /**
     * This method is the only place where it is safe to create new virtual items.
     * It runs after prepareDerivedData() has completed, and is only run for items
     * that are "owned" items or virtual items.
     *
     * The return value is the set of new items that were added to the Virtual Items list.
     */
    setupVirtualItems() {
        this.items.forEach((it) => {
            // Add all enabled events to the virtual items list
            if (it.system instanceof EventItemData) {
                if (it.system.isEnabled) {
                    if (!it.cause) {
                        it.cause = this.item;
                    }
                } else {
                    if (
                        !it.system.activation.enabled &&
                        it.system.activation.autoStart !== "never"
                    ) {
                        it.system.start();
                        it.cause = this.item;
                    }
                }
            } else if (
                it.system.transferToActor ||
                (it.system instanceof GearItemData &&
                    it.nestedIn?.system instanceof ContainerGearItemData)
            ) {
                it.cause = this.item;
            }
        });
    }

    /**
     * Perform processing requiring access to siblings.  It is safe to access
     * other virtual and nested items of the actor at this point.
     */
    processSiblings() {
        // Subclass provide implementation
        return;
    }

    /**
     * Final processing after all derived data has been calculated, and all
     * items have been setup.  It is safe to access other items of the actor
     * at this point.
     */
    postProcess() {
        // Subclass provide implementation
        return;
    }

    /**
     * Perform processing to check whether timers have expired
     */
    checkExpired() {
        // Subclass provide implementation
        return;
    }
}
