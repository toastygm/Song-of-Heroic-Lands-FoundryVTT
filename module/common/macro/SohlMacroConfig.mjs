import { SOHL } from "./constants.mjs";
import { _l } from "./sohl-localize.mjs";
import { SohlContextMenu } from "./SohlContextMenu.mjs";

export class SohlMacroConfig extends MacroConfig {
    /** @override */
    static get defaultOptions() {
        return sohl.utils.mergeObject(super.defaultOptions, {
            template: "systems/sohl/templates/dialog/macro-config.hbs",
            tabs: [
                {
                    navSelector: ".tabs",
                    contentSelector: ".sheet-body",
                    initial: "script",
                },
            ],
            width: 560,
            height: 600,
        });
    }

    /** @override */
    getData(options = {}) {
        const data = super.getData(options);
        (data.variant = game.sohl?.id),
            (data.macroTypes = game.documentTypes.Macro.reduce((obj, t) => {
                if (
                    t === CONST.MACRO_TYPES.SCRIPT &&
                    !game.user.can("MACRO_SCRIPT")
                )
                    return obj;
                obj[t] = _l(CONFIG.Macro.typeLabels[t]);
                return obj;
            }, {}));
        data.editable = this.isEditable;
        data.const = SOHL;
        data.config = CONFIG.SOHL;
        data.flags = data.document.flags;
        data.isAction = data.document.cause;
        data.contextGroupChoices = SohlContextMenu.sortGroups;
        return data;
    }

    get isEditable() {
        return !this.isIntrinsicAction && super.isEditable;
    }

    /** @inheritdoc */
    _onDragStart(event) {
        const li = event.currentTarget;
        if ("link" in event.target.dataset) return;

        // Create drag data
        let dragData;

        // Owned Items
        if (li.dataset.uuid) {
            const item = fromUuidSync(li.dataset.uuid);
            dragData = item.toDragData();
        }

        // Active Effect
        else if (li.dataset.effectId) {
            const effect = this.actor.effects.get(li.dataset.effectId);
            dragData = effect.toDragData();
        }

        // Action
        else if (li.dataset.actionName) {
            const action = this.actor.system.actions.getName(
                li.dataset.actionName,
            );
            dragData = action.toDragData();
        }

        if (!dragData) return;

        // Set data transfer
        event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    }
}
