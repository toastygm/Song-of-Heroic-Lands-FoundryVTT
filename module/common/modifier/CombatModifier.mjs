import { MasteryLevelModifier } from "./MasteryLevelModifier.mjs";

export class CombatModifier extends MasteryLevelModifier {
    /** @inheritdoc */
    static metadata = Object.freeze(
        sohl.utils.mergeObject(super.metadata, {
            name: "CombatModifier",
            locId: "COMBATMODIFIER",
            schemaVersion: "0.5.6",
        }),
    );

    /**
     * Creates an instance of CombatModifier.
     *
     * @constructor
     * @param {*} parent
     * @param {object} [initProperties={}]
     */
    constructor(data = {}, context = {}) {
        sohl.utils.mergeObject(
            data,
            {
                properties: {},
            },
            { overwrite: false },
        );
        super(data, context);
    }
}
