import globals from "globals";
import pluginJs from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintPluginJest from "eslint-plugin-jest";

export default [
    pluginJs.configs.recommended,
    eslintConfigPrettier, // ✅ Keep Prettier integration
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                ...globals.browser,
                // ✅ FoundryVTT Globals (as in your original config)
                $: "readonly",
                ActiveEffect: "readonly",
                ActiveEffects: "readonly",
                ActiveEffectConfig: "readonly",
                Actor: "readonly",
                Actors: "readonly",
                ActorSheet: "readonly",
                AudioHelper: "readonly",
                BaseItem: "readonly",
                ChatMessage: "readonly",
                Collection: "readonly",
                ContextMenu: "readonly",
                Combatant: "readonly",
                Dialog: "readonly",
                DocumentSheet: "readonly",
                DocumentSheetConfig: "readonly",
                Folder: "readonly",
                FormDataExtended: "readonly",
                getDocumentClass: "readonly",
                Handlebars: "readonly",
                HandlebarsHelpers: "readonly",
                Hooks: "readonly",
                Item: "readonly",
                Items: "readonly",
                ItemSheet: "readonly",
                IntlMessageFormat: "readonly",
                jQuery: "readonly",
                LRUMap: "readonly",
                Macro: "readonly",
                Macros: "readonly",
                MacroConfig: "readonly",
                MersenneTwister: "readonly",
                Ray: "readonly",
                Roll: "readonly",
                SearchFilter: "readonly",
                SettingsConfig: "readonly",
                SortingHelpers: "readonly",
                TextEditor: "readonly",
                Token: "readonly",
                TokenDocument: "readonly",
                Tour: "readonly",
                CONFIG: "readonly",
                CONST: "readonly",
                foundry: "readonly",
                game: "readonly",
                canvas: "readonly",
                ui: "readonly",
                fromUuid: "readonly",
                fromUuidSync: "readonly",
                renderTemplate: "readonly",
                loadTemplates: "readonly",
                SimpleCalendar: "readonly",
                ROUTE_PREFIX: "readonly",
            },
        },
        plugins: {
            jest: eslintPluginJest,
        },
    },
    {
        // ✅ Jest-Specific Rules (Applies Only to Test Files)
        files: ["tests/**/*.test.js"],
        languageOptions: {
            globals: {
                beforeAll: "readonly",
                afterAll: "readonly",
                beforeEach: "readonly",
                afterEach: "readonly",
                describe: "readonly",
                test: "readonly",
                expect: "readonly",
                jest: "readonly",
            },
        },
        plugins: {
            jest: eslintPluginJest,
        },
        extends: ["plugin:jest/recommended"], // ✅ Enables Jest-specific linting rules
        rules: {
            "jest/no-disabled-tests": "warn",
            "jest/no-focused-tests": "error",
            "jest/no-identical-title": "error",
            "jest/prefer-to-have-length": "warn",
            "jest/valid-expect": "error",
        },
    },
];
