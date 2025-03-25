import { TextEncoder, TextDecoder } from "util";
import * as sohlUtils from "./sohl-utils.mjs"; // Adjust if needed

globalThis.sohl = globalThis.sohl ?? {};
globalThis.sohl.utils = sohlUtils;

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

