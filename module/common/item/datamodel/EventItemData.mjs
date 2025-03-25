import { Utility } from "./utility.mjs";
import { fields } from "../sohl-common.mjs";
import { SohlItemData } from "./SohlItemData.mjs";

export class EventItemData extends SohlItemData {
    static TERM = Object.freeze({
        DURATION: "duration",
        INDEFINITE: "indefinite",
        PERMANENT: "permanent",
        IMMEDIATE: "immediate",
    });

    static SCOPE = Object.freeze({
        SELF: "self",
        PARENTITEM: "parentitem",
        ACTOR: "actor",
        DOCUMENT: "document",
    });

    static RESTART = Object.freeze({
        NEVER: "never",
        ONCE: "once",
        ALWAYS: "always",
    });

    /** @inheritdoc */
    static metadata = Object.freeze(
        sohl.utils.mergeObject(
            super.metadata,
            {
                name: "event",
                locId: "EVENT",
                iconCssClass: "fas fa-gear",
                img: "systems/sohl/assets/icons/gear.svg",
                sheet: "systems/sohl/templates/item/event-sheet.hbs",
                nestOnly: false,
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    static defineSchema() {
        return sohl.utils.mergeObject(super.defineSchema(), {
            tag: new fields.StringField(),
            actionName: new fields.StringField(),
            isEnabled: new fields.BooleanField({ initial: true }),
            activation: new fields.SchemaField({
                scope: new fields.StringField({
                    initial: this.SCOPE.SELF,
                    required: true,
                    choices: Utility.getChoicesMap(
                        this.SCOPE,
                        "SOHL.EVENT.SCOPE",
                    ),
                }),
                document: new fields.ForeignDocumentField(),
                duration: new fields.NumberField({
                    integer: true,
                    nullable: true,
                    initial: null,
                    min: 0,
                }),
                startTime: new fields.NumberField({
                    integer: true,
                    initial: Number.MAX_SAFE_INTEGER,
                    min: 0,
                }),
                term: new fields.StringField({
                    initial: this.TERM.INDEFINITE,
                    required: true,
                    choices: Utility.getChoicesMap(
                        this.TERM,
                        "SOHL.EVENT.TERM",
                    ),
                }),
                autoRestart: new fields.StringField({
                    initial: this.RESTART.NEVER,
                    required: true,
                    choices: Utility.getChoicesMap(
                        this.RESTART,
                        "SOHL.EVENT.RESTART",
                    ),
                }),
            }),
        });
    }

    get target() {
        let result;
        switch (this.activation.scope) {
            case this.SCOPE.SELF:
                result = this.item;
                break;

            case this.SCOPE.PARENTITEM:
                result = this.item.nestedIn;
                break;

            case this.SCOPE.ACTOR:
                result = this.item.actor;
                break;

            case this.SCOPE.DOCUMENT:
                result = this.activation.document;
                break;
        }
        return result;
    }

    get started() {
        return (
            this.isEnabled && this.activation.startTime <= game.time.worldTime
        );
    }

    get startTime() {
        return {
            worldDate: EventItemData.getWorldDateLabel(
                this.activation.startTime,
            ),
            time: this.activation.startTime,
        };
    }

    get activateTime() {
        let worldDate;
        let time;
        if (this.activation.term === EventItemData.TERM.INDEFINITE) {
            worldDate = "Indefinite";
            time = Number.MAX_SAFE_INTEGER;
        } else if (this.activation.term === EventItemData.TERM.IMMEDIATE) {
            worldDate = EventItemData.getWorldDateLabel(game.time.worldTime);
            time = game.time.worldTime;
        } else {
            const activateTime =
                this.activation.startTime + this.activation.duration;
            worldDate = EventItemData.getWorldDateLabel(activateTime);
            time = activateTime;
        }
        return { worldDate, time };
    }

    get totalDuration() {
        let label, value;
        if (this.activation.term === EventItemData.TERM.INDEFINITE) {
            label = "Indefinite";
            value = Number.MAX_SAFE_INTEGER;
        } else if (this.activation.term === EventItemData.TERM.IMMEDIATE) {
            label = "Now";
            value = 0;
        } else {
            label = Utility.formatDuration(this.activation.duration);
            value = this.activation.duration;
        }
        return { label, value };
    }

    get remainingDuration() {
        let label, value;
        if (!this.started) {
            label = "Not Initiated";
            value = 0;
        } else if (this.activation.term === EventItemData.TERM.INDEFINITE) {
            label = "Indefinite";
            value = Number.MAX_SAFE_INTEGER;
        } else if (this.activation.term === EventItemData.TERM.IMMEDIATE) {
            label = "Now";
            value = 0;
        } else {
            const duration = Math.max(
                0,
                this.activateTime.time - game.time.worldTime,
            );
            label = Utility.formatDuration(duration);
            value = duration;
        }
        return { label, value };
    }

    get elapsedDuration() {
        const duration = game.time.worldTime - this.activation.startTime;
        let label, value;
        if (!this.started) {
            label = "Not Initiated";
            value = 0;
        } else {
            value = Math.max(0, duration);
            label = Utility.formatDuration(duration);
        }
        return { label, value };
    }

    /**
     * Encode the time using the in-world calendar, "Indefinite"
     * if time is 0, or "No Calendar" if an in-world calendar is not defined
     *
     * @param {number} time in-world seconds since the start of the game
     * @returns {string} the current calendar time formatted
     *                   like "13 Nolus TR720 13:42:10", or "Indefinite" if time is 0
     */
    static getWorldDateLabel(time) {
        let worldDateLabel = "No Calendar";
        if (game.sohl?.hasSimpleCalendar) {
            const ct = SimpleCalendar.api.timestampToDate(time);
            worldDateLabel = `${ct.display.day} ${ct.display.monthName} ${ct.display.yearPrefix}${ct.display.year}${ct.display.yearPostfix} ${ct.display.time}`;
        }
        return worldDateLabel;
    }

    static _start(item, { time = game.time.worldTime } = {}) {
        const updateData = {
            "system.activation.startTime": time,
            "system.isEnabled": true,
        };

        if (item.system.activation.autoRestart === this.RESTART.ONCE) {
            updateData["system.activation.autoRestart"] = this.RESTART.NEVER;
        }

        return updateData;
    }

    async start({ time = game.time.worldTime } = {}) {
        const updateData = EventItemData._start(this.item, { time });
        return await this.item.update(updateData);
    }

    async stop() {
        const updateData = {
            "system.isEnabled": false,
        };
        return await this.item.update(updateData);
    }

    async checkAndExecute() {
        if (!this.started || !this.isEnabled) return false;

        let isActivated = false;
        switch (EventItemData.operators[this.activation.oper]) {
            case this.constructor.TERM.DURATION:
                isActivated = !this.remainingDuration.value;
                break;

            case this.constructor.TERM.INDEFINITE:
                isActivated = false;
                break;

            case this.constructor.TERM.IMMEDIATE:
                isActivated = true;
                break;

            default:
                throw new Error(`Invalid operator ${this.activation.oper}`);
        }

        if (isActivated) {
            const target = this.target;
            if (!target) {
                throw new Error(`Target not found`);
            }
            await target.system.execute(this.actionName);
            let updateData = [];
            if (this.activation.autoRestart === EventItemData.RESTART.NEVER) {
                await this.item.delete();
            } else {
                updateData = EventItemData._start(this.item);
                if (
                    this.activation.autoRestart === EventItemData.RESTART.ONCE
                ) {
                    updateData["system.activation.autoRestart"] =
                        EventItemData.RESTART.NEVER;
                }
            }
            updateData["system.isEnabled"] = false;
            return await this.item.update(updateData);
        }

        return isActivated;
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
        switch (this.activation.scope) {
            case "self":
                this.$targetUuid = this.item.uuid;
                break;

            case "item":
                this.$targetUuid = this.item.nestedIn?.uuid;
                break;

            case "actor":
                this.$targetUuid = this.item.actor?.uuid;
                break;

            case "other":
                this.$targetUuid = this.activation.targetUuid;
                break;
        }
    }
}
