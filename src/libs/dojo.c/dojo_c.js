import * as wasm from "./dojo_c_bg.wasm";
export * from "./dojo_c_bg.js";
import { __wbg_set_wasm } from "./dojo_c_bg.js";
__wbg_set_wasm(wasm);