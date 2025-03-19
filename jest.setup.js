import { TextEncoder, TextDecoder } from "util";
import { jest } from "@jest/globals";

// ✅ Ensure `TextEncoder` and `TextDecoder` are globally available
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
