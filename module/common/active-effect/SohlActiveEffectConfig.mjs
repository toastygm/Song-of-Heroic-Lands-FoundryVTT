import { _l } from "./sohl-localize.mjs";
import { Utility } from "./utility.mjs";
import { EventItemData } from "./EventItemData.mjs";

/**
 * A form designed for creating and editing an Active Effect on an Actor or Item.
 * @implements {FormApplication}
 *
 * @param {ActiveEffect} object     The target active effect being configured
 * @param {object} [options]        Additional options which modify this application instance
 */

export class SohlActiveEffectConfig extends ActiveEffectConfig {
    /** @override */
    static get defaultOptions() {
        return sohl.utils.mergeObject(super.defaultOptions, {
            template: "systems/sohl/templates/effect/active-effect-config.hbs",
        });
    }

    /* ----------------------------------------- */
    /** @override */
    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    async getData(options) {
        const context = await super.getData();
        (context.variant = game.sohl?.id),
            (context.keyChoices = this.object.getEffectKeyChoices());
        context.sourceName = await this.object.sourceName;

        // Setup Target Types
        context.targetTypes = {};
        if (this.object.parent instanceof Actor) {
            context.targetTypes["this"] = "This Actor";
        } else {
            context.targetTypes["this"] = _l("This {itemType}", {
                itemType: _l(this.object.parent.system.constructor.label),
            });
            context.targetTypes["actor"] = "Actor";
        }
        Object.entries(CONFIG.Item.dataModels).reduce((obj, [key, clazz]) => {
            obj[key] = _l(clazz.metadata.label);
            return obj;
        }, context.targetTypes);

        if (game.sohl?.hasSimpleCalendar) {
            context.startTimeText = EventItemData.getWorldDateLabel(
                context.data.duration.startTime,
            );
        } else {
            const startTimeDiff =
                game.time.worldTime - context.data.duration.startTime;
            context.startTimeText = Utility.formatDuration(startTimeDiff);
        }

        return context;
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        // biome-ignore lint/correctness/noUnusedVariables: <explanation>
        const element = html instanceof jQuery ? html[0] : html;

        // Everything below here is only needed if the sheet is editable
        if (!this.options.editable) return;

        this.form
            .querySelector(".alter-time")
            ?.addEventListener("click", (ev) => {
                const property = ev.currentTarget.dataset.property;
                let time = Number.parseInt(ev.currentTarget.dataset.time, 10);
                if (Number.isNaN(time)) time = 0;
                Utility.onAlterTime(time).then((result) => {
                    if (result !== null) {
                        const updateData = { [property]: result };
                        this.object.update(updateData);
                    }
                });
            });
    }
}
