import { defineConfig } from "vite";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

export default defineConfig(({ mode }) => {
    const isRelease = mode === "release";

    return {
        root: "module",
        build: {
            outDir: resolve("build/stage"),
            emptyOutDir: false,
            target: "es2020",
            sourcemap: isRelease,
            minify: isRelease ? "esbuild" : false,
            rollupOptions: {
                input: resolve("src/foundry/index.ts"),
                output: {
                    entryFileNames: "[name].js",
                    chunkFileNames: "[name].js",
                    assetFileNames: "[name][extname]",
                },
            },
        },
        resolve: {
            extensions: [".ts", ".js", ".json"],
            alias: {
                "@src": resolve("src"),
                "@common": resolve("src/logic/common"),
                "@legendary": resolve("src/logic/legendary"),
                "@mistyisle": resolve("src/logic/mistyisle"),
                "@templates": resolve("templates"),
                "@assets": resolve("assets"),
                "@lang": resolve("lang"),
                "@packs": resolve("packs"),
                "@tests": resolve("tests"),
                "@generated": resolve("build/generated"),
                "@sohl-global": resolve("types/sohl-global.d.ts"),
            },
        },
        test: {
            globals: true,
            environment: "node",
            include: ["tests/**/*.test.ts"],
            coverage: {
                reporter: ["text", "html"],
            },
        },
    };
});
