import Item from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/documents/item.mjs";
export class SohlItem extends Item {
    async onChatCardButton(btn: HTMLElement): Promise<void> {
        // TODO: Handle chat card button clicks here
        console.log("Button clicked:", btn);
    }
    async onChatCardEditAction(btn: HTMLElement): Promise<void> {
        // TODO: Handle chat card edit actions here
        console.log("Edit action clicked:", btn);
    }
}
