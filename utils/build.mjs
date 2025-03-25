import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { rollup } from "rollup";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { terser } from "@rollup/plugin-terser";
import archiver from "archiver";

export async function buildCode() {
  const BUILD_DIR = "./build";
  const TARGET_DIR = path.join(BUILD_DIR, "target");

  // Step 1: Remove existing build directory
  if (fs.existsSync(BUILD_DIR)) {
    fs.rmSync(BUILD_DIR, { recursive: true, force: true });
  }

  // Step 2: Create new build/target directory
  fs.mkdirSync(TARGET_DIR, { recursive: true });

  // Step 3: Rollup build with source map
  const bundle = await rollup({
    input: "sohl.mjs",
    plugins: [nodeResolve(), commonjs(), terser()]
  });

  await bundle.write({
    file: path.join(TARGET_DIR, "sohl.mjs"),
    format: "es",
    sourcemap: true
  });

  // Step 4: Copy required directories and files to target
  const include = [
    "assets/audio",
    "assets/icons",
    "assets/silhouette",
    "assets/ui",
    "css",
    "fonts",
    "lang",
    "packs/characteristics",
    "packs/characters",
    "packs/creatures",
    "packs/journals",
    "packs/macros",
    "packs/mysteries",
    "packs/possessions",
    "templates",
    "LICENSE.GPLv3",
    "README.md",
    "system.json",
    "template.json"
  ];

  for (const item of include) {
    const src = path.resolve(item);
    const dest = path.join(TARGET_DIR, item);
    await fsp.cp(src, dest, { recursive: true, errorOnExist: false });
  }

  // Step 5: Create zip archive with version from system.json
  const system = JSON.parse(await fsp.readFile("system.json", "utf8"));
  const version = system.version;
  const zipPath = path.join(BUILD_DIR, `system-${version}.zip`);
  const output = fs.createWriteStream(zipPath);
  const archive = archiver("zip", { zlib: { level: 9 } });

  archive.pipe(output);
  archive.directory(TARGET_DIR, false);
  await archive.finalize();

  // Step 6: Copy system.json to versioned file
  await fsp.copyFile("system.json", path.join(BUILD_DIR, `system-${version}.json`));

  console.log("✅ Build complete:", path.relative(".", zipPath));
}

// CLI support
if (process.argv[1] === path.resolve("./utils/build.mjs")) {
  buildCode().catch((err) => {
    console.error("❌ Build failed:", err);
    process.exit(1);
  });
}
