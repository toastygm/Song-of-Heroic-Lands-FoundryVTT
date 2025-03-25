import * as applications from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/client-esm/applications/_module.mjs";

export class SohlContextMenu extends foundry.applications.ui.ContextMenu {
    static SORT_GROUPS = Object.freeze({
        DEFAULT: "default",
        ESSENTIAL: "essential",
        GENERAL: "general",
        HIDDEN: "hidden",
    });

    _setPosition(html, target, { event } = {}) {
        // Ensure element is a native HTMLElement
        const element = html instanceof jQuery ? html[0] : html;
        if (target instanceof jQuery) [target] = target;

        // Find the container element (equivalent to target.parents("div.app"))
        let container = target.closest("div.app");

        // Set styles on the target
        target.style.position = "relative";
        element.style.visibility = "hidden";
        element.style.width = "fit-content";

        // Append the element to the container
        container.appendChild(element);

        // Calculate context bounds
        const contextRect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const mouseX = event.pageX - containerRect.left;
        const mouseY = event.pageY - containerRect.top;

        const contextTopOffset = mouseY;
        let contextLeftOffset = Math.min(
            containerRect.width - contextRect.width,
            mouseX,
        );

        // Calculate whether the menu should expand upward
        const contextTopMax = mouseY - contextRect.height;
        const contextBottomMax = mouseY + contextRect.height;
        const canOverflowUp =
            contextTopMax > containerRect.top ||
            getComputedStyle(container).overflowY === "visible";

        // Determine if it should expand upward
        const expandUp =
            contextBottomMax > containerRect.height &&
            (contextTopMax >= 0 || canOverflowUp);

        // Calculate top and bottom positions
        const contextTop =
            expandUp ? contextTopOffset - contextRect.height : contextTopOffset;
        const contextBottom = contextTop + contextRect.height;

        // Update classes for expand-up/expand-down
        element.classList.toggle("expand-up", expandUp);
        element.classList.toggle("expand-down", !expandUp);

        // Set positioning styles
        element.style.top = `${contextTop}px`;
        element.style.bottom = `${contextBottom}px`;
        if (contextLeftOffset) {
            element.style.left = `${contextLeftOffset}px`;
        }

        // Make the element visible
        element.style.visibility = "visible";

        // Add context class to target
        target.classList.add("context");
    }
}
