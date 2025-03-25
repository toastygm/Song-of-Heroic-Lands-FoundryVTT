export function registerSystemSettings() {
  game.settings.register("sohl", "sohlVariant", {
    name: "System Variant",
    hint: "Choose the rules variant to use.",
    scope: "world",
    config: true,
    type: String,
    default: "legendary",
    choices: {
      legendary: "Legendary",
      mistyisle: "Misty Isle"
    }
  });

  game.settings.register("sohl", "showWelcomeDialog", {
    name: "Show Welcome Dialog",
    hint: "Display a welcome message when the game starts.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });
}

export function registerSystemHooks() {
  // Register other hooks like chat cards, item interactions, etc.
  // This is a placeholder for game-specific integrations
}

export function setupSohlVersion(versionData) {
  if (!versionData) return;
  game.sohl.currentVariant = versionData.id;
  game.sohl.data = versionData;
  if (versionData.setup) versionData.setup();
}

export function patchFromUuid() {
  const originalFromUuidSync = fromUuidSync;
  fromUuidSync = function patchedFromUuidSync(uuid) {
    const result = originalFromUuidSync(uuid);
    return result || game?.sohl?.refs?.[uuid];
  };
}

export function registerHandlebarsHelpers() {
  // Register any HBS helpers here
}

export async function preloadHandlebarsTemplates() {
  // Use this if you have template preloading
  return loadTemplates([
    "templates/chat/chat-message.hbs",
    // Add other template paths here
  ]);
}

export async function welcomeDialog() {
  return await Dialog.prompt({
    title: "Welcome to SoHL",
    content: "<p>Welcome to the system!</p>",
    label: "OK",
    rejectClose: false,
    checkboxLabel: "Show this next time",
    checkbox: true
  });
}
