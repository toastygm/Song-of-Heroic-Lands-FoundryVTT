// modules/index.mjs
import * as sohlUtils from "@module/common/helper/sohl-utils.mjs";
import * as constants from "@module/common/helper/constants.mjs";
import * as legendary from "@module/legendary/legendary.mjs";
import * as mistyisle from "@module/mistyisle.mjs";

// Attach 'sohl' to globalThis so it's accessible everywhere
globalThis.sohl = globalThis.sohl ?? constants.SOHL;
import * as sohlCmn from "./sohl-common.mjs";

import {
    registerSystemSettings,
    registerSystemHooks,
    setupSohlVersion,
    patchFromUuid,
    registerHandlebarsHelpers,
    preloadHandlebarsTemplates,
    welcomeDialog,
} from "./common/helper/setup.mjs";

// Initialize SOHL object
Hooks.once("init", async function () {
    const system = game.system ?? {};
    game.sohl = Object.assign(system, constants.SOHL);
    console.log(`SoHL | ${game.sohl.SOHL_INIT_MESSAGE}`);

    game.sohl.registerSystemVersion("legendary", legendary.verData);
    game.sohl.registerSystemVersion("mistyisle", mistyisle.verData);

    registerSystemSettings();
    registerSystemHooks();

    const settings = game.settings;

    const variant = settings.get("sohl", sohl.SETTINGS.sohlVariant.key);
    if (variant) {
        setupSohlVersion(sohl.versionsData[variant]);
    }

    CONFIG.Combat.initiative = { formula: "@initiativeRank", decimals: 2 };
    CONFIG.time.roundTime = 5;
    CONFIG.time.turnTime = 0;

    patchFromUuid();
});

// Once everything is ready
Hooks.once("ready", async function () {
    // @ts-expect-error: macros is a custom extension to CONFIG.Actor
    CONFIG.Actor.macros = Object.fromEntries(
        Object.keys(CONFIG.Actor.dataModels).map((k) => [
            k,
            game.macros.getName(`sohl.actor.${k}`),
        ]),
    );
    // @ts-expect-error: macros is a custom extension to CONFIG.Item
    CONFIG.Item.macros = Object.fromEntries(
        Object.keys(CONFIG.Item.dataModels).map((k) => [
            k,
            game.macros.getName(`sohl.item.${k}`),
        ]),
    );

    if (game.settings.get("sohl", sohl.SETTINGS.showWelcomeDialog.key)) {
        const result = await welcomeDialog();
        if (result !== null) {
            game.settings.set(
                "sohl",
                "showWelcomeDialog",
                result.showOnStartup,
            );
        }
    }

    const scMod = game.modules.get("foundryvtt-simple-calendar");
    if (scMod?.active && SimpleCalendar) {
        Hooks.on(SimpleCalendar.Hooks.Ready, () => {
            sohl.hasSimpleCalendar = true;
        });
    }
});
