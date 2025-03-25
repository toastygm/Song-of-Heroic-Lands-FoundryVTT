import { _l } from "./sohl-localize.mjs";
import { Utility } from "./utility.mjs";
import { fields } from "../sohl-common.mjs";
import { SuccessTestResult } from "./SuccessTestResult.mjs";
import { TestResult } from "./TestResult.mjs";

export class OpposedTestResult extends TestResult {
    /** @inheritdoc */
    static metadata = Object.freeze({
        name: "OpposedTestResult",
        locId: "OPPOSEDTESTRESULT",
        schemaVersion: "0.5.6",
    });

    static TIE_BREAK = Object.freeze({
        SOURCE: 1,
        TARGET: -1,
    });

    static defineSchema() {
        return sohl.utils.mergeObject(super.defineSchema(), {
            sourceTestResult: new fields.EmbeddedDataField(SuccessTestResult, {
                nullable: true,
            }),
            targetTestResult: new fields.EmbeddedDataField(SuccessTestResult, {
                nullable: true,
            }),
            targetToken: new fields.ForeignDocumentField(),
            rollMode: new fields.NumberField({
                integer: true,
                nullable: true,
                initial: null,
            }),
            tieBreak: new fields.NumberField({
                integer: true,
                initial: 0,
            }),
            breakTies: new fields.BooleanField({ initial: false }),
        });
    }

    _initialize(options = {}) {
        super._initialize(options);

        if (this.targetTokenUuid) {
            Object.defineProperty(this, "targetToken", {
                value:
                    this.targetTokenUuid ?
                        fromUuidSync(this.targetTokenUuid)
                    :   null,
            });
        }
    }

    constructor(data = {}, context = {}) {
        super(data, context);
        if (!data.sourceTestResult) {
            throw new Error("sourceTestResult must be provided");
        }
        if (!data.targetTokenUuid) {
            throw new Error("Target token UUID must be provided");
        }
    }

    get isTied() {
        return (
            !this.bothFail &&
            this.sourceTestResult.normSuccessLevel ===
                this.targetTestResult.normSuccessLevel
        );
    }

    get bothFail() {
        return (
            !this.sourceTestResult?.isSuccess &&
            !this.targetTestResult?.isSuccess
        );
    }

    get tieBreakOffset() {
        return !this.bothFail ? this.tieBreak : 0;
    }

    get sourceWins() {
        let result = false;
        if (
            typeof this.sourceTestResult === "object" &&
            typeof this.targetTestResult === "object"
        ) {
            result =
                !this.bothFail &&
                this.sourceTestResult.normSuccessLevel >
                    this.targetTestResult.normSuccessLevel;
        }
        return result;
    }

    get targetWins() {
        let result = false;
        if (
            typeof this.sourceTestResult === "object" &&
            typeof this.targetTestResult === "object"
        ) {
            result =
                !this.bothFail &&
                this.sourceTestResult.normSuccessLevel <
                    this.targetTestResult.normSuccessLevel;
        }
        return result;
    }

    async evaluate() {
        if (this.sourceTestResult && this.targetTestResult) {
            let allowed = await super.evaluate();
            allowed &&= !!(await this.sourceTestResult.evaluate());
            allowed &&= !!(await this.targetTestResult.evaluate());
            return allowed;
        } else {
            return false;
        }
    }

    async toChat(data = {}) {
        sohl.utils.mergeObject(
            data,
            {
                variant: game.sohl?.id,
                template:
                    "systems/sohl/templates/chat/opposed-request-card.hbs",
                title: _l("SOHL.OpposedTestResult.toChat.title"),
                opposedTestResult: this,
                opposedTestResultJson: Utility.JSON_stringify(this),
                description: _l("SOHL.OpposedTestResult.toChat.description", {
                    targetActorName: this.targetToken.name,
                }),
            },
            { overwrite: false },
        );

        const chatHtml = await renderTemplate(data.template, data);

        const messageData = {
            user: game.user.id,
            speaker: this.speaker,
            content: chatHtml.trim(),
            style: CONST.CHAT_MESSAGE_STYLES.DICE,
        };

        const messageOptions = {};

        // Create a chat message
        return await ChatMessage.create(messageData, messageOptions);
    }
}
