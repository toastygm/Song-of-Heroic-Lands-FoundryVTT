import { NestableDocumentMixin } from "../abstract/NestableDocumentMixin.mjs";
import { _l } from "../helper/sohl-localize.mjs";
import { SohlContextMenu } from "../helper/SohlContextMenu.mjs";
import { SohlActor } from "../actor/SohlActor.mjs";
import { SohlItem } from "../item/SohlItem.mjs";

export class SohlMacro extends NestableDocumentMixin(Macro) {
    /** @override */
    _configure(options) {
        if (this.parent && !(this.parent instanceof SohlActor)) {
            throw new Error("Parent must always be an instance of SohlActor");
        }

        super._configure(options);

        Object.defineProperty(this, "nestedIn", {
            value: (() => {
                if ([null, undefined].includes(options.nestedIn)) return null;
                if (
                    options.nestedIn instanceof SohlItem ||
                    options.nestedIn instanceof SohlActor
                )
                    return options.nestedIn;
                throw new Error(
                    "The provided nestedIn must be an SohlItem or SohlActor instance",
                );
            })(),
            writable: false,
            enumerable: false,
        });
    }

    get notes() {
        return this.getFlag("sohl", "notes") || "";
    }

    set notes(value) {
        this.setFlag("sohl", "notes", value ?? "");
    }

    get description() {
        return this.getFlag("sohl", "description") || "";
    }

    set description(value) {
        this.setFlag("sohl", "description", value ?? "");
    }

    get useAsync() {
        return this.getFlag("sohl", "useAsync");
    }

    set useAsync(val) {
        this.setFlag("sohl", "useAsync", !!val);
    }

    get functionName() {
        return this.getFlag("sohl", "functionName") ?? "";
    }

    set functionName(value) {
        this.setFlag("sohl", "functionName", value);
    }

    get isIntrinsicAction() {
        return !!this.getFlag("sohl", "isIntrinsicAction");
    }

    set isIntrinsicAction(value) {
        this.setFlag("sohl", "isIntrinsicAction", !!value);
    }

    get contextIconClass() {
        return this.getFlag("sohl", "contextIconClass") ?? "";
    }

    set contextIconClass(value) {
        this.setFlag("sohl", "contextIconClass", value);
    }

    get contextCondition() {
        return this.getFlag("sohl", "contextCondition") ?? false;
    }

    set contextCondition(value) {
        this.setFlag("sohl", "contextCondition", value);
    }

    get contextGroup() {
        return this.getFlag("sohl", "contextGroup") ?? "";
    }

    set contextGroup(value) {
        this.setFlag("sohl", "contextGroup", value);
    }

    get params() {
        return this.getFlag("sohl", "params") || {};
    }

    setParam(name, value) {
        if (!name || Number.isNumeric(name)) {
            throw new Error(
                `Invalid parameter name "${name}", must be a non-numeric string`,
            );
        }

        const newParams = sohl.utils.deepClone(this.params);
        newParams[name] = value;
        this.setFlag("sohl", "params", newParams);
    }

    deleteParam(name) {
        const newParams = sohl.utils.deepClone(this.params);
        delete newParams[name];
        this.setFlag("sohl", "params", newParams);
    }

    get paramsLabel() {
        return Object.entries(this.params).reduce((str, [key, val]) => {
            if (str) str += ",";
            str += key;
            if (typeof val !== "undefined") {
                str += `=${val}`;
            }
            return str;
        }, "");
    }

    get nameParts() {
        const index = this.functionName.indexOf("$");
        if (index < 0) return { prefix: "", functionName: this.functionName };
        const prefix = this.functionName.slice(0, index);
        const fnName = this.functionName.slice(index + 1);
        return { prefix, functionName: fnName };
    }

    /** @override */
    get uuid() {
        if (!this._uuid) {
            if (this.nestedIn) {
                // If this is a nested object, we come up with a new UUID format
                // where the nested macro is defined with a hash mark
                let parts = [this.nestedIn.uuid, "NestedMacro", this.id];
                this._uuid = parts.join("#");
            } else {
                this._uuid = super.uuid;
            }
        }

        return this._uuid;
    }

    _getContextOptions() {
        const opts = [
            {
                name: "Execute",
                contextIconClass: `<i class="far fa-gears"></i>`,
                condition: this.canExecute,
                callback: (header) => {
                    header = header instanceof HTMLElement ? header : header[0];
                    const li = header.closest(".item");
                    const parent = fromUuidSync(li.dataset.parentUuid);
                    const action = parent.system.actions.get(li.dataset.itemId);
                    action.execute();
                },
                group: SohlContextMenu.SORT_GROUPS.ESSENTIAL,
            },
            {
                name: "Edit",
                contextIconClass: `<i class="fas fa-edit"></i>`,
                condition: !this.isIntrinsicAction,
                callback: (header) => {
                    header = header instanceof HTMLElement ? header : header[0];
                    const li = header.closest(".item");
                    const parent = fromUuidSync(li.dataset.parentUuid);
                    const action = parent.system.actions.get(li.dataset.itemId);
                    action.sheet.render(true);
                },
                group: SohlContextMenu.SORT_GROUPS.GENERAL,
            },
            {
                name: "Delete",
                contextIconClass: `<i class="fas fa-trash"></i>`,
                condition: !this.isIntrinsicAction && this.isOwner,
                callback: (header) => {
                    header = header instanceof HTMLElement ? header : header[0];
                    const li = header.closest(".item");
                    const parent = fromUuidSync(li.dataset.parentUuid);
                    const action = parent.system.actions.get(li.dataset.itemId);
                    return Dialog.confirm({
                        title: `Delete Action: ${action.name}`,
                        content:
                            "<p>Are You Sure?</p><p>This action will be deleted and cannot be recovered.</p>",
                        yes: () => {
                            action.delete();
                        },
                    });
                },
                group: SohlContextMenu.SORT_GROUPS.GENERAL,
            },
        ];

        return opts;
    }

    /** @override */
    async _preCreate(data, options, user) {
        const allowed = await super._preCreate(data, options, user);
        if (allowed === false) return false;

        const updateData = sohl.utils.mergeObject(
            {
                type: CONST.MACRO_TYPES.SCRIPT,
                flags: {
                    sohl: {
                        notes: "",
                        description: "",
                        params: {},
                        functionName: "",
                        contextIconClass: "",
                        contextCondition: false,
                        contextGroup: SohlContextMenu.SORT_GROUPS.HIDDEN,
                        isIntrinsicAction: false,
                        useAsync: true,
                    },
                },
            },
            data,
            { insertKeys: false, insertValues: false },
        );
        this.updateSource(updateData);
        return true;
    }

    static getExecuteDefaults({
        speaker = null,
        actor = null,
        token = null,
        character = null,
        needsActor = false,
        needsToken = false,
        self = null,
    }) {
        if (token instanceof Token) token = token.document;
        if (speaker && !speaker.scene && speaker.token) {
            const tok =
                canvas.ready ?
                    canvas.tokens.get(speaker.token)?.document
                :   null;
            speaker.scene = tok?.scene?.id;
        }
        if (speaker && actor && token && character)
            return { speaker, actor, token, character };
        actor = actor || token?.actor;
        if (!actor) {
            actor = self.actor;
            token = actor?.getToken();
        }

        // Add variables to the evaluation scope.
        speaker ||= ChatMessage.getSpeaker({ actor, token });
        character ||= game.user.character;
        token ||=
            canvas.ready ? canvas.tokens.get(speaker.token)?.document : null;
        actor ||= token?.actor || game.actors.get(speaker.actor);

        if (needsToken && !token) {
            throw new Error(`No Token defined`);
        } else if (needsActor && !actor) {
            throw new Error(`No Actor defined`);
        } else {
            return { speaker, actor, token, character };
        }
    }

    /** @override */
    execute({ self, actor, token, inPrepareData, ...scope } = {}) {
        self ||= this.parent?.system || this.nestedIn?.system || this;
        const argValues = Object.values(scope);
        let speaker, character, fn;
        if (this.type === CONST.MACRO_TYPES.CHAT) {
            ({ actor, token } = SohlMacro.getExecuteDefaults({
                actor,
                token,
                self,
            }));
            scope.token = token;
            scope.actor = actor;
            return super.execute(scope);
        } else if (this.type === CONST.MACRO_TYPES.SCRIPT) {
            if (this.isIntrinsicAction) {
                const { functionName } = this.nameParts;
                fn = self[functionName];
                if (!(fn instanceof Function)) fn = null;
            } else {
                // Unpack argument names and values
                const argNames = Object.keys(scope);
                if (argNames.some((k) => Number.isNumeric(k))) {
                    throw new Error(
                        "Illegal numeric Macro parameter passed to execution scope.",
                    );
                }

                const args = [
                    "speaker",
                    "actor",
                    "token",
                    "character",
                    "scope",
                    ...argNames,
                    `{${this.command}\n}`,
                ];

                if (this.useAsync) {
                    fn = new sohl.utils.AsyncFunction(...args);
                } else {
                    fn = new Function(...args);
                }
            }
        }
        if (fn) {
            // Attempt macro execution
            try {
                if (!inPrepareData) {
                    ({ speaker, actor, token, character } =
                        SohlMacro.getExecuteDefaults({
                            actor,
                            token,
                            self,
                        }));
                }

                return fn.call(
                    self,
                    speaker,
                    actor,
                    token,
                    character,
                    scope,
                    ...argValues,
                );
            } catch (err) {
                Hooks.onError("SohlMacro#execute", err, {
                    msg: `Error executing action ${this.name} on ${_l(self.constructor.metadata.label) || "SohlMacro"} ${self.name}`,
                    log: "error",
                });
            }
        }

        return null;
    }
}
