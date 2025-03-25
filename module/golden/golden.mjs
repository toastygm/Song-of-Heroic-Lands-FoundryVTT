/* eslint-disable no-unused-vars */
import * as sohl from "./sohl-common.mjs";
import * as SohlContainerGearItemSheet from "./common/item/SohlContainerGearItemSheet.mjs";
import * as SohlItemSheet from "./common/item/SohlItemSheet.mjs";
import * as SohlActorSheet from "./common/actor/SohlActorSheet.mjs";
import * as SohlActor from "./common/actor/SohlActor.mjs";
import * as SohlMacroConfig from "./common/SohlMacroConfig.mjs";
import * as SohlMacro from "./common/macro/SohlMacro.mjs";
import * as SohlActiveEffect from "./common/SohlActiveEffect.mjs";
import * as ContainerGearItemData from "./common/ContainerGearItemData.mjs";
import * as AnimateEntityActorData from "./common/actor/datamodel/AnimateEntityActorData.mjs";
import * as SohlItem from "./common/item/SohlItem.mjs";
import * as SohlContextMenu from "./common/helper/SohlContextMenu.mjs";

/* ====================================================================== */
/*          Constants                                                     */
/* ====================================================================== */

// biome-ignore lint/correctness/noUnusedVariables: <explanation>
const fields = foundry.data.fields;

const GOLD = {
    CONST: {},
    CONFIG: {},
};

const GoldActorDataModels = sohl.utils.mergeObject(
    sohl.SohlActorDataModels,
    {},
    { inplace: false },
);

const GoldItemDataModels = sohl.utils.mergeObject(
    sohl.SohlItemDataModels,
    {},
    { inplace: false },
);

const GoldModifiers = sohl.utils.mergeObject(
    sohl.SohlModifiers,
    {},
    { inplace: false },
);

export const verData = {
    id: "legendary",
    label: "Song of Heroic Lands: Golden Edition",
    CONFIG: {
        Helper: {
            modifiers: GoldModifiers,
            contextMenu: SohlContextMenu.SohlContextMenu,
        },
        Actor: {
            documentClass: SohlActor.SohlActor,
            documentSheets: [
                {
                    cls: SohlActorSheet.SohlActorSheet,
                    types: Object.keys(GoldActorDataModels),
                },
            ],
            dataModels: GoldActorDataModels,
            typeLabels: sohl.SohlActorTypeLabels,
            typeIcons: sohl.SohlActorTypeIcons,
            types: Object.keys(GoldActorDataModels),
            defaultType: AnimateEntityActorData.AnimateEntityActorData.typeName,
            compendiums: [],
        },
        Item: {
            documentClass: SohlItem.SohlItem,
            documentSheets: [
                {
                    cls: SohlItemSheet.SohlItemSheet,
                    types: Object.keys(GoldItemDataModels).filter(
                        (t) =>
                            t !==
                            ContainerGearItemData.ContainerGearItemData
                                .typeName,
                    ),
                },
                {
                    cls: SohlContainerGearItemSheet.SohlContainerGearItemSheet,
                    types: [
                        ContainerGearItemData.ContainerGearItemData.typeName,
                    ],
                },
            ],
            dataModels: GoldItemDataModels,
            typeLabels: sohl.SohlItemTypeLabels,
            typeIcons: sohl.SohlItemTypeIcons,
            types: Object.keys(GoldItemDataModels),
            compendiums: ["sohl.golden-basic-items"],
        },
        ActiveEffect: {
            documentClass: SohlActiveEffect.SohlActiveEffect,
            legacyTransferral: false,
        },
        Macro: {
            documentClass: SohlMacro.SohlMacro,
            documentSheet: SohlMacroConfig.SohlMacroConfig,
        },
    },
    CONST: sohl.utils.mergeObject(CONFIG.SOHL.CONST, GOLD.CONST, {
        inplace: false,
    }),
};
