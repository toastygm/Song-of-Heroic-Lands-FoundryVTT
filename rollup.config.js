import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { terser } from "@rollup/plugin-terser";

export default {
  input: "module/index.mjs",
  output: {
    file: "build/target/sohl.mjs",
    format: "es",
    sourcemap: true
  },
  plugins: [
    nodeResolve(),
    commonjs(),
    terser()
  ]
};
