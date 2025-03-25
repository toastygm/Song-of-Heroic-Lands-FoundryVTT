import { BodyLocationItemData } from "./BodyLocationItemData.mjs";
import { BodyPartItemData } from "./BodyPartItemData.mjs";
import { BodyZoneItemData } from "./BodyZoneItemData.mjs";
import { CombatManeuverItemData } from "./CombatManeuverItemData.mjs";
import { CombatTechniqueStrikeModeItemData } from "./CombatTechniqueStrikeModeItemData.mjs";
import { _l } from "../helper/sohl-localize.mjs";
import { Utility } from "../helper/utility.mjs";
import { ContainerGearItemData } from "./ContainerGearItemData.mjs";
import { DomainItemData } from "./DomainItemData.mjs";
import { GearItemData } from "./GearItemData.mjs";
import { MeleeWeaponStrikeModeItemData } from "../item/datamodel/MeleeWeaponStrikeModeItemData.mjs";
import { MissileWeaponStrikeModeItemData } from "../item/datamodel/MissileWeaponStrikeModeItemData.mjs";
import { PhilosophyItemData } from "../item/datamodel/PhilosophyItemData.mjs";
import { SohlActor } from "./SohlActor.mjs";
import { SohlItem } from "../item/SohlItem.mjs";
import { SohlSheetMixin } from "../abstract/SohlSheetMixin.mjs";
import { TraitItemData } from "../item/datamodel/TraitItemData.mjs";
import { WeaponGearItemData } from "../item/datamodel/WeaponGearItemData.mjs";

/**
 * Extend the basic ActorSheet with some common capabilities
 * @extends {ActorSheet}
 */

export class SohlActorSheet extends SohlSheetMixin(ActorSheet) {
    /** @override */
    static get defaultOptions() {
        return sohl.utils.mergeObject(super.defaultOptions, {
            classes: ["sohl", "sheet", "actor"],
            width: 900,
            height: 640,
            filters: [
                {
                    inputSelector: 'input[name="search-traits"]',
                    contentSelector: ".traits",
                },
                {
                    inputSelector: 'input[name="search-skills"]',
                    contentSelector: ".skills",
                },
                {
                    inputSelector: 'input[name="search-bodylocations"]',
                    contentSelector: ".bodylocations-list",
                },
                {
                    inputSelector: 'input[name="search-afflictions"]',
                    contentSelector: ".afflictions-list",
                },
                {
                    inputSelector: 'input[name="search-mysteries"]',
                    contentSelector: ".mysteries-list",
                },
                {
                    inputSelector: 'input[name="search-mysticalabilities"]',
                    contentSelector: ".mysticalabilities-list",
                },
                {
                    inputSelector: 'input[name="search-gear"]',
                    contentSelector: ".gear-list",
                },
                {
                    inputSelector: 'input[name="search-effects"]',
                    contentSelector: ".effects-list",
                },
            ],
        });
    }

    /** @inheritdoc */
    _getHeaderButtons() {
        let buttons = super._getHeaderButtons();
        const closeIndex = buttons.findIndex((btn) => btn.label === "Sheet");
        buttons.splice(closeIndex, 0, {
            label: "Print",
            class: "print-actor",
            icon: "fas fa-print",
            onclick: (ev) => this._onPrintActor(ev),
        });
        return buttons;
    }

    /** @override */
    getData() {
        const data = super.getData();
        (data.variant = game.sohl?.id), (data.adata = this.actor.system);
        data.labels = this.actor.labels || {};
        data.itemTypes = this.actor.itemTypes;
        data.itemSubtypes = this.actor.itemSubtypes;
        data.anatomy = this.actor.itemTypes.anatomy.at(0);
        data.effectStatus = {};
        for (const s of this.actor.statuses.values()) {
            data.effectStatus[s] = true;
        }
        data.effectStatus.auralshock = data.itemTypes.affliction.reduce(
            (b, a) => {
                if (b) return b;
                if (
                    a.system.subType === "auralshock" &&
                    a.system.$level.effective > 0
                )
                    return true;
            },
            false,
        );
        data.effectStatus.fatigue = data.itemTypes.affliction.reduce((b, a) => {
            if (b) return b;
            if (a.system.subType === "fatigue" && a.system.$level.effective > 0)
                return true;
        }, false);

        data.magicMod = this.actor.system.$magicMod;

        data.macroTypes = sohl.utils.deepClone(game.system.documentTypes.Macro);
        data.dtypes = ["String", "Number", "Boolean"];
        data.attributes = [];
        data.philosophies = [
            {
                name: "No Philosophy",
                domains: [],
            },
        ];
        data.domains = Object.keys(PhilosophyItemData.categories).reduce(
            (obj, c) => {
                obj[c] = [];
                return obj;
            },
            {},
        );
        let cmData = {};
        let wpnData = {};
        let mslData = {};
        for (const it of this.actor.allItems()) {
            if (it.system instanceof TraitItemData) {
                if (it.system.intensity === "attribute") {
                    data.attributes.push(it);
                } else if (it.system.abbrev === "mov") {
                    data.move = it.system.$score.effective;
                }
            }

            // When processing the strike modes, ignore any strike modes that aren't associated
            // with the current version.
            if (
                it.type.endsWith("strikemode") &&
                it.system.subType === game.sohl?.id
            ) {
                if (it.type === CombatTechniqueStrikeModeItemData.TYPE_NAME) {
                    const maneuver = it.cause;

                    if (maneuver?.system instanceof CombatManeuverItemData) {
                        cmData[maneuver.name] ||= {
                            item: maneuver,
                            strikeModes: [],
                        };
                        cmData[maneuver.name].strikeModes.push(it);
                    }
                } else if (
                    it.type === MeleeWeaponStrikeModeItemData.TYPE_NAME
                ) {
                    const weapon = it.cause;
                    if (
                        weapon?.system instanceof WeaponGearItemData &&
                        weapon.system.$isHeldBy?.length >= it.system.minParts
                    ) {
                        wpnData[weapon.name] ||= {
                            item: weapon,
                            strikeModes: [],
                        };
                        wpnData[weapon.name].strikeModes.push(it);
                    }
                } else if (
                    it.type === MissileWeaponStrikeModeItemData.TYPE_NAME
                ) {
                    const weapon = it.cause;
                    if (
                        weapon?.system instanceof WeaponGearItemData &&
                        weapon.system.$isHeldBy?.length >= it.system.minParts
                    ) {
                        mslData[weapon.name] ||= {
                            item: weapon,
                            strikeModes: [],
                        };
                        mslData[weapon.name].strikeModes.push(it);
                    }
                }
            }

            if (it.system instanceof DomainItemData) {
                const philName =
                    it.system.philosophy?.trim() || "No Philosophy";
                let phil = data.philosophies.find((p) => p.name === philName);
                if (!phil) {
                    phil = {
                        name: philName,
                        domains: [],
                    };
                    data.philosophies.push(phil);
                }

                phil.domains.push(it);
                if (phil) {
                    data.domains[it.system.$category].push(it);
                }
            }
        }
        data.attributes.sort((a, b) => a.sort - b.sort);
        data.philosophies.forEach((p) =>
            p.domains.sort((a, b) => a.sort - b.sort),
        );

        let smKeys = Utility.sortStrings(Object.keys(cmData));
        if (smKeys.includes("Unarmed")) {
            smKeys = smKeys.filter((k) => k !== "Unarmed");
            smKeys.unshift("Unarmed");
        }
        data.combatmaneuvers = smKeys.reduce((ary, key) => {
            cmData[key].strikeModes.sort((a, b) => a.sort - b.sort);
            ary.push(cmData[key]);
            return ary;
        }, []);

        smKeys = Utility.sortStrings(Object.keys(wpnData));
        data.meleeweapons = smKeys.reduce((ary, key) => {
            wpnData[key].strikeModes.sort((a, b) => a.sort - b.sort);
            ary.push(wpnData[key]);
            return ary;
        }, []);

        smKeys = Utility.sortStrings(Object.keys(mslData));
        data.missileweapons = smKeys.reduce((ary, key) => {
            mslData[key].strikeModes.sort((a, b) => a.sort - b.sort);
            ary.push(mslData[key]);
            return ary;
        }, []);

        data.weightCarried = game.documentTypes.Item.reduce(
            (obj, t) => {
                if (t.endsWith("gear")) {
                    obj[t] = 0;
                }
                return obj;
            },
            { total: 0 },
        );

        for (const it of this.actor.allItems()) {
            if (it.system instanceof GearItemData) {
                data.weightCarried[it.type] += it.system.totalWeight.effective;
            }
        }

        const topContainer = {
            name: "On Body",
            id: null,
            system: {
                $capacity: this.actor.system.$gearWeight,
                notes: "",
                description: "",
                quantity: 1,
                isCarried: true,
                isEquipped: true,
                qualityBase: 0,
                durabilityBase: 0,
                textReference: "",
                macros: [],
                nestedItems: [],
                maxCapacityBase: 0,
                valueBase: 0,
                weightBase: 0,
                createdTime: 0,
                abbrev: "",
            },
            items: [],
        };
        data.containers = [topContainer];

        this.actor.items.forEach((it) => {
            if (it.system instanceof GearItemData) {
                if (it.system instanceof ContainerGearItemData) {
                    data.containers.push({
                        name: it.name,
                        id: it.id,
                        system: it.system,
                        items: [],
                    });
                }
                topContainer.items.push(it);
            }
        });

        this.actor.system.virtualItems.forEach((it) => {
            if (it.system instanceof GearItemData) {
                const containerId =
                    it.nestedIn?.system instanceof ContainerGearItemData ?
                        it.nestedIn.id
                    :   null;

                const container = data.containers.find(
                    (c) => c.id === containerId,
                );
                if (container) {
                    container.items.push(it);
                }
            }
        });

        data.shock = {
            nextRerollDuration: "N/A",
        };

        return data;
    }

    async _onPrintActor() {
        // Open new window and dump HTML to it.
        const win = window.open(
            "about:blank",
            "_blank",
            "width=800,height=640,scrollbars=yes,resizable=yes,menubar=no,status=no,toolbar=no",
        );
        if (!win) {
            console.error("Failed to open print window");
            return null;
        }

        win.location.hash = "print";
        win._rootWindow = window;

        const sheetHtml = await renderTemplate(
            this.template,
            sohl.utils.mergeObject({ printable: true }, this.getData()),
        );
        win.document.write(sheetHtml);
    }

    async _onItemCreate(event) {
        if (event.preventDefault) event.preventDefault();
        const header = event.currentTarget;
        // Grab any data associated with this control.
        const dataset = header.dataset;

        const options = { parent: this.actor };
        const data = {
            name: "",
        };
        if (dataset.type) {
            if (dataset.type === "gear") {
                options.types = Utility.getChoicesMap(
                    GearItemData.TYPE,
                    "SOHL.GEAR.TYPE",
                );
                data.type = GearItemData.TYPE.MISC;
            } else if (dataset.type === "body") {
                options.types = [
                    BodyLocationItemData.TYPE_NAME,
                    BodyPartItemData.TYPE_NAME,
                    BodyZoneItemData.TYPE_NAME,
                ];
                data.type = options.types[0];
            } else {
                data.type = dataset.type;
            }
        }
        if (dataset.subType) data["system.subType"] = dataset.subType;
        const item = await SohlItem.createDialog(data, options);
        return item;
    }

    _improveToggleDialog(item) {
        const dlgHtml =
            "<p>Do you want to perform a Skill Development Roll (SDR), or just disable the flag?</p>";

        // Create the dialog window
        return new Promise((resolve) => {
            new Dialog({
                title: "Skill Development Toggle",
                content: dlgHtml.trim(),
                buttons: {
                    performSDR: {
                        label: "Perform SDR",
                        callback: async () => {
                            return await SohlActor.skillDevRoll(item);
                        },
                    },
                    disableFlag: {
                        label: "Disable Flag",
                        callback: async () => {
                            return item.update({ "system.improveFlag": false });
                        },
                    },
                },
                default: "performSDR",
                close: () => resolve(false),
            }).render(true);
        });
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        // biome-ignore lint/correctness/noUnusedVariables: <explanation>
        const element = html instanceof jQuery ? html[0] : html;

        // Everything below here is only needed if the sheet is editable
        if (!this.options.editable) return;

        // Add Inventory Item
        this.form
            .querySelector(".item-create")
            ?.addEventListener("click", this._onItemCreate.bind(this));

        // Toggle Active Effects
        this.form
            .querySelector(".toggle-status-effect")
            ?.addEventListener("click", (ev) => {
                const statusId = ev.currentTarget.dataset.statusId;
                const effect = this.actor.effects.find((e) =>
                    e.statuses.has(statusId),
                );
                if (effect) {
                    effect.delete();
                } else {
                    let effectData = CONFIG.statusEffects.find(
                        (e) => e.id === statusId,
                    );
                    const updateData = {
                        img: effectData.img,
                        name: _l(effectData.name),
                        statuses: effectData.id,
                    };
                    ActiveEffect.create(updateData, { parent: this.actor });
                }
            });

        // Hide all hideable elements
        this.form.querySelectorAll(".showhide").forEach((element) => {
            element.disabled = false;
        });

        this.form
            .querySelector(".toggle-visibility")
            ?.addEventListener("click", (ev) => {
                const filter = ".showhide";
                // (limitToClass ? `.${limitToClass}` : "") + ".showhide";
                const start = ev.currentTarget.closest(".item-list");
                const targets = start.find(filter);
                // biome-ignore lint/correctness/noUnusedVariables: <explanation>
                targets.prop("disabled", (i, val) => !val);
            });

        // Toggle carry state
        this.form
            .querySelector(".item-carry")
            ?.addEventListener("click", (ev) => {
                ev.preventDefault();
                const itemId = ev.currentTarget.closest(".item").dataset.itemId;
                const item = this.actor.getItem(itemId);

                // Only process inventory items, otherwise ignore
                if (item.system instanceof GearItemData) {
                    const attr = "system.isCarried";
                    return item.update({
                        [attr]: !sohl.utils.getProperty(item, attr),
                    });
                }

                return null;
            });

        // Toggle equip state
        this.form
            .querySelector(".item-equip")
            ?.addEventListener("click", (ev) => {
                ev.preventDefault();
                const itemId = ev.currentTarget.closest(".item").dataset.itemId;
                const item = this.actor.getItem(itemId);

                // Only process inventory items, otherwise ignore
                if (item.system instanceof GearItemData) {
                    const attr = "system.isEquipped";
                    return item.update({
                        [attr]: !sohl.utils.getProperty(item, attr),
                    });
                }

                return null;
            });

        // Toggle improve flag
        this.form
            .querySelector(".toggle-improve-flag")
            ?.addEventListener("click", (ev) => {
                ev.preventDefault();
                const itemId = ev.currentTarget.closest(".item").dataset.itemId;
                const item = this.actor.getItem(itemId);

                // Only process MasteryLevel items
                if (item?.system.isMasteryLevelItemData && !item.isVirtual) {
                    return item.system.toggleImproveFlag();
                }
                return null;
            });
    }
}
