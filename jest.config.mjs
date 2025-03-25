export default {
    testEnvironment: "node",
    setupFiles: ["./jest.setup.js"],
    setupFilesAfterEnv: ["./jest.setup.js"],
    transform: {},
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
    },
};
