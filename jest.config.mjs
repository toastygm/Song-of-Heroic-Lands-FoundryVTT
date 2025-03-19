export default {
    testEnvironment: "node", // ✅ Use Node instead of JSDOM
    setupFilesAfterEnv: ["./jest.setup.js"], // ✅ Ensure Jest loads FoundryVTT before tests
    transform: {}, // ✅ Prevent Jest from transforming ESM files
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1", // ✅ Fix Jest ESM import issues
    },
};
