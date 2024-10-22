let wasm;
export function __wbg_set_wasm(val) {
    wasm = val;
}


const heap = new Array(128).fill(undefined);

heap.push(undefined, null, true, false);

function getObject(idx) { return heap[idx]; }

let heap_next = heap.length;

function dropObject(idx) {
    if (idx < 132) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

const lTextDecoder = typeof TextDecoder === 'undefined' ? (0, module.require)('util').TextDecoder : TextDecoder;

let cachedTextDecoder = new lTextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

let cachedUint8ArrayMemory0 = null;

function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

let WASM_VECTOR_LEN = 0;

const lTextEncoder = typeof TextEncoder === 'undefined' ? (0, module.require)('util').TextEncoder : TextEncoder;

let cachedTextEncoder = new lTextEncoder('utf-8');

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

let cachedDataViewMemory0 = null;

function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

const CLOSURE_DTORS = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(state => {
    wasm.__wbindgen_export_2.get(state.dtor)(state.a, state.b)
});

function makeMutClosure(arg0, arg1, dtor, f) {
    const state = { a: arg0, b: arg1, cnt: 1, dtor };
    const real = (...args) => {
        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        const a = state.a;
        state.a = 0;
        try {
            return f(a, state.b, ...args);
        } finally {
            if (--state.cnt === 0) {
                wasm.__wbindgen_export_2.get(state.dtor)(a, state.b);
                CLOSURE_DTORS.unregister(state);
            } else {
                state.a = a;
            }
        }
    };
    real.original = state;
    CLOSURE_DTORS.register(real, state, state);
    return real;
}
function __wbg_adapter_50(arg0, arg1) {
    wasm._dyn_core__ops__function__FnMut_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__ha1c2e76c7f369435(arg0, arg1);
}

function __wbg_adapter_53(arg0, arg1, arg2) {
    wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h28637a88d600fa6c(arg0, arg1, addHeapObject(arg2));
}

function __wbg_adapter_60(arg0, arg1, arg2) {
    wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h1537074453be3496(arg0, arg1, addHeapObject(arg2));
}

function __wbg_adapter_67(arg0, arg1) {
    wasm._dyn_core__ops__function__FnMut_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h8bf6076e0cc42da7(arg0, arg1);
}

function __wbg_adapter_70(arg0, arg1, arg2) {
    wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h6aa14d1d092fcc26(arg0, arg1, addHeapObject(arg2));
}

function __wbg_adapter_73(arg0, arg1, arg2) {
    wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__hd8134763e75b0d77(arg0, arg1, addHeapObject(arg2));
}

/**
* @param {string} typed_data
* @param {string} address
* @returns {string}
*/
export function typedDataEncode(typed_data, address) {
    let deferred4_0;
    let deferred4_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(typed_data, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(address, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        wasm.typedDataEncode(retptr, ptr0, len0, ptr1, len1);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        var ptr3 = r0;
        var len3 = r1;
        if (r3) {
            ptr3 = 0; len3 = 0;
            throw takeObject(r2);
        }
        deferred4_0 = ptr3;
        deferred4_1 = len3;
        return getStringFromWasm0(ptr3, len3);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
    }
}

/**
* @returns {string}
*/
export function signingKeyNew() {
    let deferred1_0;
    let deferred1_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.signingKeyNew(retptr);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred1_0 = r0;
        deferred1_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
* @param {string} private_key
* @param {string} hash
* @returns {Signature}
*/
export function signingKeySign(private_key, hash) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(private_key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(hash, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        wasm.signingKeySign(retptr, ptr0, len0, ptr1, len1);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        if (r2) {
            throw takeObject(r1);
        }
        return takeObject(r0);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
* @param {string} signing_key
* @returns {string}
*/
export function verifyingKeyNew(signing_key) {
    let deferred3_0;
    let deferred3_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(signing_key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.verifyingKeyNew(retptr, ptr0, len0);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        var ptr2 = r0;
        var len2 = r1;
        if (r3) {
            ptr2 = 0; len2 = 0;
            throw takeObject(r2);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
* @param {string} verifying_key
* @param {string} hash
* @param {Signature} signature
* @returns {boolean}
*/
export function verifyingKeyVerify(verifying_key, hash, signature) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(verifying_key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(hash, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        wasm.verifyingKeyVerify(retptr, ptr0, len0, ptr1, len1, addHeapObject(signature));
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        if (r2) {
            throw takeObject(r1);
        }
        return r0 !== 0;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
* @param {string} rpc_url
* @returns {Provider}
*/
export function createProvider(rpc_url) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(rpc_url, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.createProvider(retptr, ptr0, len0);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        if (r2) {
            throw takeObject(r1);
        }
        return Provider.__wrap(r0);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

function passArrayJsValueToWasm0(array, malloc) {
    const ptr = malloc(array.length * 4, 4) >>> 0;
    const mem = getDataViewMemory0();
    for (let i = 0; i < array.length; i++) {
        mem.setUint32(ptr + 4 * i, addHeapObject(array[i]), true);
    }
    WASM_VECTOR_LEN = array.length;
    return ptr;
}
/**
* @param {string} class_hash
* @param {string} salt
* @param {(string)[]} constructor_calldata
* @param {string} deployer_address
* @returns {string}
*/
export function hashGetContractAddress(class_hash, salt, constructor_calldata, deployer_address) {
    let deferred6_0;
    let deferred6_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(class_hash, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(salt, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArrayJsValueToWasm0(constructor_calldata, wasm.__wbindgen_malloc);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passStringToWasm0(deployer_address, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len3 = WASM_VECTOR_LEN;
        wasm.hashGetContractAddress(retptr, ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        var ptr5 = r0;
        var len5 = r1;
        if (r3) {
            ptr5 = 0; len5 = 0;
            throw takeObject(r2);
        }
        deferred6_0 = ptr5;
        deferred6_1 = len5;
        return getStringFromWasm0(ptr5, len5);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_free(deferred6_0, deferred6_1, 1);
    }
}

/**
* @param {string} tag
* @returns {string}
*/
export function getSelectorFromTag(tag) {
    let deferred2_0;
    let deferred2_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(tag, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.getSelectorFromTag(retptr, ptr0, len0);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred2_0 = r0;
        deferred2_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
}

function getArrayJsValueFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    const mem = getDataViewMemory0();
    const result = [];
    for (let i = ptr; i < ptr + 4 * len; i += 4) {
        result.push(takeObject(mem.getUint32(i, true)));
    }
    return result;
}
/**
* @param {string} str
* @returns {(string)[]}
*/
export function byteArraySerialize(str) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(str, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.byteArraySerialize(retptr, ptr0, len0);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        if (r3) {
            throw takeObject(r2);
        }
        var v2 = getArrayJsValueFromWasm0(r0, r1).slice();
        wasm.__wbindgen_free(r0, r1 * 4, 4);
        return v2;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
* @param {(string)[]} felts
* @returns {string}
*/
export function byteArrayDeserialize(felts) {
    let deferred3_0;
    let deferred3_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArrayJsValueToWasm0(felts, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.byteArrayDeserialize(retptr, ptr0, len0);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        var ptr2 = r0;
        var len2 = r1;
        if (r3) {
            ptr2 = 0; len2 = 0;
            throw takeObject(r2);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
* @param {(string)[]} inputs
* @returns {string}
*/
export function poseidonHash(inputs) {
    let deferred3_0;
    let deferred3_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArrayJsValueToWasm0(inputs, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.poseidonHash(retptr, ptr0, len0);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        var ptr2 = r0;
        var len2 = r1;
        if (r3) {
            ptr2 = 0; len2 = 0;
            throw takeObject(r2);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
* @param {string} name
* @returns {string}
*/
export function getSelectorFromName(name) {
    let deferred3_0;
    let deferred3_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.getSelectorFromName(retptr, ptr0, len0);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        var ptr2 = r0;
        var len2 = r1;
        if (r3) {
            ptr2 = 0; len2 = 0;
            throw takeObject(r2);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
* @param {Uint8Array} inputs
* @returns {string}
*/
export function starknetKeccak(inputs) {
    let deferred2_0;
    let deferred2_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.starknetKeccak(retptr, addHeapObject(inputs));
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        var ptr1 = r0;
        var len1 = r1;
        if (r3) {
            ptr1 = 0; len1 = 0;
            throw takeObject(r2);
        }
        deferred2_0 = ptr1;
        deferred2_1 = len1;
        return getStringFromWasm0(ptr1, len1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
}

/**
* @param {string} str
* @returns {string}
*/
export function cairoShortStringToFelt(str) {
    let deferred3_0;
    let deferred3_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(str, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.cairoShortStringToFelt(retptr, ptr0, len0);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        var ptr2 = r0;
        var len2 = r1;
        if (r3) {
            ptr2 = 0; len2 = 0;
            throw takeObject(r2);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
* @param {string} str
* @returns {string}
*/
export function parseCairoShortString(str) {
    let deferred3_0;
    let deferred3_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(str, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.parseCairoShortString(retptr, ptr0, len0);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        var ptr2 = r0;
        var len2 = r1;
        if (r3) {
            ptr2 = 0; len2 = 0;
            throw takeObject(r2);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
    return instance.ptr;
}
/**
* Create the a client with the given configurations.
* @param {ClientConfig} config
* @returns {Promise<ToriiClient>}
*/
export function createClient(config) {
    const ret = wasm.createClient(addHeapObject(config));
    return takeObject(ret);
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        wasm.__wbindgen_exn_store(addHeapObject(e));
    }
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}
function __wbg_adapter_391(arg0, arg1, arg2, arg3) {
    wasm.wasm_bindgen__convert__closures__invoke2_mut__hb202c1809efe5a31(arg0, arg1, addHeapObject(arg2), addHeapObject(arg3));
}

const AccountFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_account_free(ptr >>> 0, 1));
/**
*/
export class Account {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Account.prototype);
        obj.__wbg_ptr = ptr;
        AccountFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AccountFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_account_free(ptr, 0);
    }
    /**
    * @returns {string}
    */
    address() {
        let deferred2_0;
        let deferred2_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.account_address(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            var ptr1 = r0;
            var len1 = r1;
            if (r3) {
                ptr1 = 0; len1 = 0;
                throw takeObject(r2);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
    * @returns {string}
    */
    chainId() {
        let deferred2_0;
        let deferred2_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.account_chainId(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            var ptr1 = r0;
            var len1 = r1;
            if (r3) {
                ptr1 = 0; len1 = 0;
                throw takeObject(r2);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
    * @param {string} block_id
    */
    setBlockId(block_id) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(block_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            wasm.account_setBlockId(retptr, this.__wbg_ptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {(Call)[]} calldata
    * @returns {Promise<string>}
    */
    executeRaw(calldata) {
        const ptr0 = passArrayJsValueToWasm0(calldata, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.account_executeRaw(this.__wbg_ptr, ptr0, len0);
        return takeObject(ret);
    }
    /**
    * @param {string} private_key
    * @returns {Promise<Account>}
    */
    deployBurner(private_key) {
        const ptr0 = passStringToWasm0(private_key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.account_deployBurner(this.__wbg_ptr, ptr0, len0);
        return takeObject(ret);
    }
    /**
    * @returns {Promise<string>}
    */
    nonce() {
        const ret = wasm.account_nonce(this.__wbg_ptr);
        return takeObject(ret);
    }
}

const IntoUnderlyingByteSourceFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_intounderlyingbytesource_free(ptr >>> 0, 1));
/**
*/
export class IntoUnderlyingByteSource {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        IntoUnderlyingByteSourceFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_intounderlyingbytesource_free(ptr, 0);
    }
    /**
    * @returns {string}
    */
    get type() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.intounderlyingbytesource_type(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
    * @returns {number}
    */
    get autoAllocateChunkSize() {
        const ret = wasm.intounderlyingbytesource_autoAllocateChunkSize(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * @param {ReadableByteStreamController} controller
    */
    start(controller) {
        wasm.intounderlyingbytesource_start(this.__wbg_ptr, addHeapObject(controller));
    }
    /**
    * @param {ReadableByteStreamController} controller
    * @returns {Promise<any>}
    */
    pull(controller) {
        const ret = wasm.intounderlyingbytesource_pull(this.__wbg_ptr, addHeapObject(controller));
        return takeObject(ret);
    }
    /**
    */
    cancel() {
        const ptr = this.__destroy_into_raw();
        wasm.intounderlyingbytesource_cancel(ptr);
    }
}

const IntoUnderlyingSinkFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_intounderlyingsink_free(ptr >>> 0, 1));
/**
*/
export class IntoUnderlyingSink {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        IntoUnderlyingSinkFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_intounderlyingsink_free(ptr, 0);
    }
    /**
    * @param {any} chunk
    * @returns {Promise<any>}
    */
    write(chunk) {
        const ret = wasm.intounderlyingsink_write(this.__wbg_ptr, addHeapObject(chunk));
        return takeObject(ret);
    }
    /**
    * @returns {Promise<any>}
    */
    close() {
        const ptr = this.__destroy_into_raw();
        const ret = wasm.intounderlyingsink_close(ptr);
        return takeObject(ret);
    }
    /**
    * @param {any} reason
    * @returns {Promise<any>}
    */
    abort(reason) {
        const ptr = this.__destroy_into_raw();
        const ret = wasm.intounderlyingsink_abort(ptr, addHeapObject(reason));
        return takeObject(ret);
    }
}

const IntoUnderlyingSourceFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_intounderlyingsource_free(ptr >>> 0, 1));
/**
*/
export class IntoUnderlyingSource {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        IntoUnderlyingSourceFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_intounderlyingsource_free(ptr, 0);
    }
    /**
    * @param {ReadableStreamDefaultController} controller
    * @returns {Promise<any>}
    */
    pull(controller) {
        const ret = wasm.intounderlyingsource_pull(this.__wbg_ptr, addHeapObject(controller));
        return takeObject(ret);
    }
    /**
    */
    cancel() {
        const ptr = this.__destroy_into_raw();
        wasm.intounderlyingsource_cancel(ptr);
    }
}

const ProviderFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_provider_free(ptr >>> 0, 1));
/**
*/
export class Provider {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Provider.prototype);
        obj.__wbg_ptr = ptr;
        ProviderFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ProviderFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_provider_free(ptr, 0);
    }
    /**
    * @param {string} private_key
    * @param {string} address
    * @returns {Promise<Account>}
    */
    createAccount(private_key, address) {
        const ptr0 = passStringToWasm0(private_key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(address, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.provider_createAccount(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return takeObject(ret);
    }
    /**
    * @param {Call} call
    * @param {BlockId} block_id
    * @returns {Promise<Array<any>>}
    */
    call(call, block_id) {
        const ret = wasm.provider_call(this.__wbg_ptr, addHeapObject(call), addHeapObject(block_id));
        return takeObject(ret);
    }
    /**
    * @param {string} txn_hash
    * @returns {Promise<boolean>}
    */
    waitForTransaction(txn_hash) {
        const ptr0 = passStringToWasm0(txn_hash, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.provider_waitForTransaction(this.__wbg_ptr, ptr0, len0);
        return takeObject(ret);
    }
}

const SubscriptionFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_subscription_free(ptr >>> 0, 1));
/**
*/
export class Subscription {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Subscription.prototype);
        obj.__wbg_ptr = ptr;
        SubscriptionFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SubscriptionFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_subscription_free(ptr, 0);
    }
    /**
    */
    cancel() {
        const ptr = this.__destroy_into_raw();
        wasm.subscription_cancel(ptr);
    }
}

const ToriiClientFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_toriiclient_free(ptr >>> 0, 1));
/**
*/
export class ToriiClient {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(ToriiClient.prototype);
        obj.__wbg_ptr = ptr;
        ToriiClientFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ToriiClientFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_toriiclient_free(ptr, 0);
    }
    /**
    * @param {Query} query
    * @returns {Promise<Entities>}
    */
    getEntities(query) {
        const ret = wasm.toriiclient_getEntities(this.__wbg_ptr, addHeapObject(query));
        return takeObject(ret);
    }
    /**
    * @param {number} limit
    * @param {number} offset
    * @returns {Promise<Entities>}
    */
    getAllEntities(limit, offset) {
        const ret = wasm.toriiclient_getAllEntities(this.__wbg_ptr, limit, offset);
        return takeObject(ret);
    }
    /**
    * @param {Query} query
    * @returns {Promise<Entities>}
    */
    getEventMessages(query) {
        const ret = wasm.toriiclient_getEventMessages(this.__wbg_ptr, addHeapObject(query));
        return takeObject(ret);
    }
    /**
    * @param {(EntityKeysClause)[]} clauses
    * @param {Function} callback
    * @returns {Promise<Subscription>}
    */
    onEntityUpdated(clauses, callback) {
        const ptr0 = passArrayJsValueToWasm0(clauses, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.toriiclient_onEntityUpdated(this.__wbg_ptr, ptr0, len0, addHeapObject(callback));
        return takeObject(ret);
    }
    /**
    * @param {Subscription} subscription
    * @param {(EntityKeysClause)[]} clauses
    * @returns {Promise<void>}
    */
    updateEntitySubscription(subscription, clauses) {
        _assertClass(subscription, Subscription);
        const ptr0 = passArrayJsValueToWasm0(clauses, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.toriiclient_updateEntitySubscription(this.__wbg_ptr, subscription.__wbg_ptr, ptr0, len0);
        return takeObject(ret);
    }
    /**
    * @param {(EntityKeysClause)[]} clauses
    * @param {Function} callback
    * @returns {Promise<Subscription>}
    */
    onEventMessageUpdated(clauses, callback) {
        const ptr0 = passArrayJsValueToWasm0(clauses, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.toriiclient_onEventMessageUpdated(this.__wbg_ptr, ptr0, len0, addHeapObject(callback));
        return takeObject(ret);
    }
    /**
    * @param {Subscription} subscription
    * @param {(EntityKeysClause)[]} clauses
    * @returns {Promise<void>}
    */
    updateEventMessageSubscription(subscription, clauses) {
        _assertClass(subscription, Subscription);
        const ptr0 = passArrayJsValueToWasm0(clauses, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.toriiclient_updateEventMessageSubscription(this.__wbg_ptr, subscription.__wbg_ptr, ptr0, len0);
        return takeObject(ret);
    }
    /**
    * @param {string | undefined} contract_address
    * @param {Function} callback
    * @returns {Promise<Subscription>}
    */
    onIndexerUpdated(contract_address, callback) {
        var ptr0 = isLikeNone(contract_address) ? 0 : passStringToWasm0(contract_address, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        const ret = wasm.toriiclient_onIndexerUpdated(this.__wbg_ptr, ptr0, len0, addHeapObject(callback));
        return takeObject(ret);
    }
    /**
    * @param {string} message
    * @param {(string)[]} signature
    * @returns {Promise<Uint8Array>}
    */
    publishMessage(message, signature) {
        const ptr0 = passStringToWasm0(message, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArrayJsValueToWasm0(signature, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.toriiclient_publishMessage(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return takeObject(ret);
    }
}

export function __wbindgen_object_drop_ref(arg0) {
    takeObject(arg0);
};

export function __wbg_subscription_new(arg0) {
    const ret = Subscription.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbindgen_string_new(arg0, arg1) {
    const ret = getStringFromWasm0(arg0, arg1);
    return addHeapObject(ret);
};

export function __wbindgen_object_clone_ref(arg0) {
    const ret = getObject(arg0);
    return addHeapObject(ret);
};

export function __wbg_account_new(arg0) {
    const ret = Account.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_toriiclient_new(arg0) {
    const ret = ToriiClient.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbindgen_cb_drop(arg0) {
    const obj = takeObject(arg0).original;
    if (obj.cnt-- == 1) {
        obj.a = 0;
        return true;
    }
    const ret = false;
    return ret;
};

export function __wbindgen_string_get(arg0, arg1) {
    const obj = getObject(arg1);
    const ret = typeof(obj) === 'string' ? obj : undefined;
    var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};

export function __wbindgen_is_string(arg0) {
    const ret = typeof(getObject(arg0)) === 'string';
    return ret;
};

export function __wbindgen_error_new(arg0, arg1) {
    const ret = new Error(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
};

export function __wbindgen_is_bigint(arg0) {
    const ret = typeof(getObject(arg0)) === 'bigint';
    return ret;
};

export function __wbindgen_bigint_from_i64(arg0) {
    const ret = arg0;
    return addHeapObject(ret);
};

export function __wbindgen_jsval_eq(arg0, arg1) {
    const ret = getObject(arg0) === getObject(arg1);
    return ret;
};

export function __wbindgen_bigint_from_u64(arg0) {
    const ret = BigInt.asUintN(64, arg0);
    return addHeapObject(ret);
};

export function __wbindgen_is_object(arg0) {
    const val = getObject(arg0);
    const ret = typeof(val) === 'object' && val !== null;
    return ret;
};

export function __wbindgen_is_undefined(arg0) {
    const ret = getObject(arg0) === undefined;
    return ret;
};

export function __wbindgen_in(arg0, arg1) {
    const ret = getObject(arg0) in getObject(arg1);
    return ret;
};

export function __wbindgen_boolean_get(arg0) {
    const v = getObject(arg0);
    const ret = typeof(v) === 'boolean' ? (v ? 1 : 0) : 2;
    return ret;
};

export function __wbindgen_number_new(arg0) {
    const ret = arg0;
    return addHeapObject(ret);
};

export function __wbindgen_as_number(arg0) {
    const ret = +getObject(arg0);
    return ret;
};

export function __wbg_clearTimeout_541ac0980ffcef74(arg0) {
    const ret = clearTimeout(takeObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_setTimeout_7d81d052875b0f4f() { return handleError(function (arg0, arg1) {
    const ret = setTimeout(getObject(arg0), arg1);
    return addHeapObject(ret);
}, arguments) };

export function __wbindgen_jsval_loose_eq(arg0, arg1) {
    const ret = getObject(arg0) == getObject(arg1);
    return ret;
};

export function __wbindgen_number_get(arg0, arg1) {
    const obj = getObject(arg1);
    const ret = typeof(obj) === 'number' ? obj : undefined;
    getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
};

export function __wbg_getwithrefkey_edc2c8960f0f1191(arg0, arg1) {
    const ret = getObject(arg0)[getObject(arg1)];
    return addHeapObject(ret);
};

export function __wbg_set_f975102236d3c502(arg0, arg1, arg2) {
    getObject(arg0)[takeObject(arg1)] = takeObject(arg2);
};

export function __wbg_String_b9412f8799faab3e(arg0, arg1) {
    const ret = String(getObject(arg1));
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};

export function __wbg_WorkerGlobalScope_c44775816e379c0e(arg0) {
    const ret = getObject(arg0).WorkerGlobalScope;
    return addHeapObject(ret);
};

export function __wbg_clearTimeout_76877dbc010e786d(arg0) {
    const ret = clearTimeout(takeObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_setTimeout_75cb9b6991a4031d() { return handleError(function (arg0, arg1) {
    const ret = setTimeout(getObject(arg0), arg1);
    return addHeapObject(ret);
}, arguments) };

export function __wbg_performance_a1b8bde2ee512264(arg0) {
    const ret = getObject(arg0).performance;
    return addHeapObject(ret);
};

export function __wbg_now_abd80e969af37148(arg0) {
    const ret = getObject(arg0).now();
    return ret;
};

export function __wbg_fetch_38acb46318f7afdb(arg0, arg1) {
    const ret = fetch(getObject(arg0), getObject(arg1));
    return addHeapObject(ret);
};

export function __wbg_done_2ffa852272310e47(arg0) {
    const ret = getObject(arg0).done;
    return ret;
};

export function __wbg_value_9f6eeb1e2aab8d96(arg0) {
    const ret = getObject(arg0).value;
    return addHeapObject(ret);
};

export function __wbg_getReader_ab94afcb5cb7689a() { return handleError(function (arg0) {
    const ret = getObject(arg0).getReader();
    return addHeapObject(ret);
}, arguments) };

export function __wbg_fetch_bc7c8e27076a5c84(arg0) {
    const ret = fetch(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_queueMicrotask_48421b3cc9052b68(arg0) {
    const ret = getObject(arg0).queueMicrotask;
    return addHeapObject(ret);
};

export function __wbindgen_is_function(arg0) {
    const ret = typeof(getObject(arg0)) === 'function';
    return ret;
};

export function __wbg_queueMicrotask_12a30234db4045d3(arg0) {
    queueMicrotask(getObject(arg0));
};

export function __wbg_instanceof_Window_5012736c80a01584(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof Window;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_document_8554450897a855b9(arg0) {
    const ret = getObject(arg0).document;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_navigator_6210380287bf8581(arg0) {
    const ret = getObject(arg0).navigator;
    return addHeapObject(ret);
};

export function __wbg_clearInterval_df3409c32c572e85(arg0, arg1) {
    getObject(arg0).clearInterval(arg1);
};

export function __wbg_setInterval_d4a371ef4db258a7() { return handleError(function (arg0, arg1, arg2, arg3) {
    const ret = getObject(arg0).setInterval(getObject(arg1), arg2, ...getObject(arg3));
    return ret;
}, arguments) };

export function __wbg_location_1f2e0caa4be15a0f(arg0) {
    const ret = getObject(arg0).location;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_clearInterval_26e463ce3f550c4b(arg0, arg1) {
    getObject(arg0).clearInterval(arg1);
};

export function __wbg_fetch_ba7fe179e527d942(arg0, arg1) {
    const ret = getObject(arg0).fetch(getObject(arg1));
    return addHeapObject(ret);
};

export function __wbg_fetch_cb9aad23a79a40a1(arg0, arg1, arg2) {
    const ret = getObject(arg0).fetch(getObject(arg1), getObject(arg2));
    return addHeapObject(ret);
};

export function __wbg_setInterval_1758524273ba5b22() { return handleError(function (arg0, arg1, arg2, arg3) {
    const ret = getObject(arg0).setInterval(getObject(arg1), arg2, ...getObject(arg3));
    return ret;
}, arguments) };

export function __wbg_setid_94bb4b8f06f4c112(arg0, arg1) {
    getObject(arg0).id = arg1;
};

export function __wbg_setnegotiated_6d7d9d9c79933de4(arg0, arg1) {
    getObject(arg0).negotiated = arg1 !== 0;
};

export function __wbg_read_e48a676fb81ea800(arg0) {
    const ret = getObject(arg0).read();
    return addHeapObject(ret);
};

export function __wbg_releaseLock_1d2d93e9dc8d76e2(arg0) {
    getObject(arg0).releaseLock();
};

export function __wbg_cancel_97a2795574a4f522(arg0) {
    const ret = getObject(arg0).cancel();
    return addHeapObject(ret);
};

export function __wbg_readyState_68e64385d26c8728(arg0) {
    const ret = getObject(arg0).readyState;
    return {"connecting":0,"open":1,"closing":2,"closed":3,}[ret] ?? 4;
};

export function __wbg_bufferedAmount_4f70cdbc6635f5d2(arg0) {
    const ret = getObject(arg0).bufferedAmount;
    return ret;
};

export function __wbg_setbufferedAmountLowThreshold_ca20185478348cf3(arg0, arg1) {
    getObject(arg0).bufferedAmountLowThreshold = arg1 >>> 0;
};

export function __wbg_setonopen_30f99f291ccec312(arg0, arg1) {
    getObject(arg0).onopen = getObject(arg1);
};

export function __wbg_setonclose_557f1dd997edec67(arg0, arg1) {
    getObject(arg0).onclose = getObject(arg1);
};

export function __wbg_setonmessage_30aaf581e4dec924(arg0, arg1) {
    getObject(arg0).onmessage = getObject(arg1);
};

export function __wbg_setonbufferedamountlow_9999fb13bafb05c8(arg0, arg1) {
    getObject(arg0).onbufferedamountlow = getObject(arg1);
};

export function __wbg_setbinaryType_3425c9b91c25a1a5(arg0, arg1) {
    getObject(arg0).binaryType = ["arraybuffer","blob",][arg1];
};

export function __wbg_send_49387c69e657451e() { return handleError(function (arg0, arg1, arg2) {
    getObject(arg0).send(getArrayU8FromWasm0(arg1, arg2));
}, arguments) };

export function __wbg_settype_233a2bf71c25ed93(arg0, arg1) {
    getObject(arg0).type = ["offer","pranswer","answer","rollback",][arg1];
};

export function __wbg_setsdp_0b3df5fc570c101e(arg0, arg1, arg2) {
    getObject(arg0).sdp = getStringFromWasm0(arg1, arg2);
};

export function __wbg_hostname_d7ff17205929a46d() { return handleError(function (arg0, arg1) {
    const ret = getObject(arg1).hostname;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
}, arguments) };

export function __wbg_data_5c47a6985fefc490(arg0) {
    const ret = getObject(arg0).data;
    return addHeapObject(ret);
};

export function __wbg_view_2a901bda0727aeb3(arg0) {
    const ret = getObject(arg0).view;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_respond_a799bab31a44f2d7() { return handleError(function (arg0, arg1) {
    getObject(arg0).respond(arg1 >>> 0);
}, arguments) };

export function __wbg_signal_41e46ccad44bb5e2(arg0) {
    const ret = getObject(arg0).signal;
    return addHeapObject(ret);
};

export function __wbg_new_ebf2727385ee825c() { return handleError(function () {
    const ret = new AbortController();
    return addHeapObject(ret);
}, arguments) };

export function __wbg_abort_8659d889a7877ae3(arg0) {
    getObject(arg0).abort();
};

export function __wbg_localDescription_f2c3c53ac86aba6c(arg0) {
    const ret = getObject(arg0).localDescription;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_setondatachannel_4d7c6e85c4c669d5(arg0, arg1) {
    getObject(arg0).ondatachannel = getObject(arg1);
};

export function __wbg_newwithconfiguration_05616c1f670e37f6() { return handleError(function (arg0) {
    const ret = new RTCPeerConnection(getObject(arg0));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_close_fdcfeba8ea793a00(arg0) {
    getObject(arg0).close();
};

export function __wbg_createDataChannel_17815c5304549c23(arg0, arg1, arg2) {
    const ret = getObject(arg0).createDataChannel(getStringFromWasm0(arg1, arg2));
    return addHeapObject(ret);
};

export function __wbg_createDataChannel_757fa282c4ce56c7(arg0, arg1, arg2, arg3) {
    const ret = getObject(arg0).createDataChannel(getStringFromWasm0(arg1, arg2), getObject(arg3));
    return addHeapObject(ret);
};

export function __wbg_createOffer_6f315a46446c28dd(arg0) {
    const ret = getObject(arg0).createOffer();
    return addHeapObject(ret);
};

export function __wbg_generateCertificate_b56e3a8aefa9f78e() { return handleError(function (arg0) {
    const ret = RTCPeerConnection.generateCertificate(getObject(arg0));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_setLocalDescription_124f64811e9eee83(arg0, arg1) {
    const ret = getObject(arg0).setLocalDescription(getObject(arg1));
    return addHeapObject(ret);
};

export function __wbg_setRemoteDescription_1f6796c241214296(arg0, arg1) {
    const ret = getObject(arg0).setRemoteDescription(getObject(arg1));
    return addHeapObject(ret);
};

export function __wbg_now_a69647afb1f66247(arg0) {
    const ret = getObject(arg0).now();
    return ret;
};

export function __wbg_channel_215e3e6fcd37e5b7(arg0) {
    const ret = getObject(arg0).channel;
    return addHeapObject(ret);
};

export function __wbg_new_e27c93803e1acc42() { return handleError(function () {
    const ret = new Headers();
    return addHeapObject(ret);
}, arguments) };

export function __wbg_append_f3a4426bb50622c5() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
}, arguments) };

export function __wbg_byobRequest_b32c77640da946ac(arg0) {
    const ret = getObject(arg0).byobRequest;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_close_aca7442e6619206b() { return handleError(function (arg0) {
    getObject(arg0).close();
}, arguments) };

export function __wbg_newwithstrandinit_a31c69e4cc337183() { return handleError(function (arg0, arg1, arg2) {
    const ret = new Request(getStringFromWasm0(arg0, arg1), getObject(arg2));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_close_cef2400b120c9c73() { return handleError(function (arg0) {
    getObject(arg0).close();
}, arguments) };

export function __wbg_enqueue_6f3d433b5e457aea() { return handleError(function (arg0, arg1) {
    getObject(arg0).enqueue(getObject(arg1));
}, arguments) };

export function __wbg_setcertificates_661e4f0b7198ba1b(arg0, arg1) {
    getObject(arg0).certificates = getObject(arg1);
};

export function __wbg_instanceof_Response_e91b7eb7c611a9ae(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof Response;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_url_1bf85c8abeb8c92d(arg0, arg1) {
    const ret = getObject(arg1).url;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};

export function __wbg_status_ae8de515694c5c7c(arg0) {
    const ret = getObject(arg0).status;
    return ret;
};

export function __wbg_headers_5e283e8345689121(arg0) {
    const ret = getObject(arg0).headers;
    return addHeapObject(ret);
};

export function __wbg_body_40b0ed27714d00ce(arg0) {
    const ret = getObject(arg0).body;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_text_a94b91ea8700357a() { return handleError(function (arg0) {
    const ret = getObject(arg0).text();
    return addHeapObject(ret);
}, arguments) };

export function __wbg_userAgent_58dedff4303aeb66() { return handleError(function (arg0, arg1) {
    const ret = getObject(arg1).userAgent;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
}, arguments) };

export function __wbg_sdp_cfb0795aa43320f0(arg0, arg1) {
    const ret = getObject(arg1).sdp;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};

export function __wbg_setbody_734cb3d7ee8e6e96(arg0, arg1) {
    getObject(arg0).body = getObject(arg1);
};

export function __wbg_setcache_c75a0b02602d486b(arg0, arg1) {
    getObject(arg0).cache = ["default","no-store","reload","no-cache","force-cache","only-if-cached",][arg1];
};

export function __wbg_setcredentials_2b67800db3f7b621(arg0, arg1) {
    getObject(arg0).credentials = ["omit","same-origin","include",][arg1];
};

export function __wbg_setheaders_be10a5ab566fd06f(arg0, arg1) {
    getObject(arg0).headers = getObject(arg1);
};

export function __wbg_setintegrity_54bb7edb99d51873(arg0, arg1, arg2) {
    getObject(arg0).integrity = getStringFromWasm0(arg1, arg2);
};

export function __wbg_setmethod_dc68a742c2db5c6a(arg0, arg1, arg2) {
    getObject(arg0).method = getStringFromWasm0(arg1, arg2);
};

export function __wbg_setmode_a781aae2bd3df202(arg0, arg1) {
    getObject(arg0).mode = ["same-origin","no-cors","cors","navigate",][arg1];
};

export function __wbg_setredirect_e33e7153977bbd2b(arg0, arg1) {
    getObject(arg0).redirect = ["follow","error","manual",][arg1];
};

export function __wbg_setreferrer_f7fd8739611aba35(arg0, arg1, arg2) {
    getObject(arg0).referrer = getStringFromWasm0(arg1, arg2);
};

export function __wbg_setreferrerpolicy_b3db9b9b13557412(arg0, arg1) {
    getObject(arg0).referrerPolicy = ["","no-referrer","no-referrer-when-downgrade","origin","origin-when-cross-origin","unsafe-url","same-origin","strict-origin","strict-origin-when-cross-origin",][arg1];
};

export function __wbg_setsignal_91c4e8ebd04eb935(arg0, arg1) {
    getObject(arg0).signal = getObject(arg1);
};

export function __wbg_readyState_7237e2b1adac03a6(arg0) {
    const ret = getObject(arg0).readyState;
    return ret;
};

export function __wbg_bufferedAmount_77ba515edae4df34(arg0) {
    const ret = getObject(arg0).bufferedAmount;
    return ret;
};

export function __wbg_setonopen_7e770c87269cae90(arg0, arg1) {
    getObject(arg0).onopen = getObject(arg1);
};

export function __wbg_setonerror_5ec4625df3060159(arg0, arg1) {
    getObject(arg0).onerror = getObject(arg1);
};

export function __wbg_setonclose_40f935717ad6ffcd(arg0, arg1) {
    getObject(arg0).onclose = getObject(arg1);
};

export function __wbg_setonmessage_b670c12ea34acd8b(arg0, arg1) {
    getObject(arg0).onmessage = getObject(arg1);
};

export function __wbg_setbinaryType_d164a0be4c212c9c(arg0, arg1) {
    getObject(arg0).binaryType = ["blob","arraybuffer",][arg1];
};

export function __wbg_new_0bf4a5b0632517ed() { return handleError(function (arg0, arg1) {
    const ret = new WebSocket(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_close_0a0cd79519b11318() { return handleError(function (arg0, arg1, arg2, arg3) {
    getObject(arg0).close(arg1, getStringFromWasm0(arg2, arg3));
}, arguments) };

export function __wbg_send_1b333b26681a902d() { return handleError(function (arg0, arg1, arg2) {
    getObject(arg0).send(getArrayU8FromWasm0(arg1, arg2));
}, arguments) };

export function __wbg_crypto_1d1f22824a6a080c(arg0) {
    const ret = getObject(arg0).crypto;
    return addHeapObject(ret);
};

export function __wbg_process_4a72847cc503995b(arg0) {
    const ret = getObject(arg0).process;
    return addHeapObject(ret);
};

export function __wbg_versions_f686565e586dd935(arg0) {
    const ret = getObject(arg0).versions;
    return addHeapObject(ret);
};

export function __wbg_node_104a2ff8d6ea03a2(arg0) {
    const ret = getObject(arg0).node;
    return addHeapObject(ret);
};

export function __wbg_require_cca90b1a94a0255b() { return handleError(function () {
    const ret = module.require;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_msCrypto_eb05e62b530a1508(arg0) {
    const ret = getObject(arg0).msCrypto;
    return addHeapObject(ret);
};

export function __wbg_randomFillSync_5c9c955aa56b6049() { return handleError(function (arg0, arg1) {
    getObject(arg0).randomFillSync(takeObject(arg1));
}, arguments) };

export function __wbg_getRandomValues_3aa56aa6edec874c() { return handleError(function (arg0, arg1) {
    getObject(arg0).getRandomValues(getObject(arg1));
}, arguments) };

export function __wbg_get_3baa728f9d58d3f6(arg0, arg1) {
    const ret = getObject(arg0)[arg1 >>> 0];
    return addHeapObject(ret);
};

export function __wbg_length_ae22078168b726f5(arg0) {
    const ret = getObject(arg0).length;
    return ret;
};

export function __wbg_new_a220cf903aa02ca2() {
    const ret = new Array();
    return addHeapObject(ret);
};

export function __wbg_newnoargs_76313bd6ff35d0f2(arg0, arg1) {
    const ret = new Function(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
};

export function __wbg_new_8608a2b51a5f6737() {
    const ret = new Map();
    return addHeapObject(ret);
};

export function __wbg_next_de3e9db4440638b2(arg0) {
    const ret = getObject(arg0).next;
    return addHeapObject(ret);
};

export function __wbg_next_f9cb570345655b9a() { return handleError(function (arg0) {
    const ret = getObject(arg0).next();
    return addHeapObject(ret);
}, arguments) };

export function __wbg_done_bfda7aa8f252b39f(arg0) {
    const ret = getObject(arg0).done;
    return ret;
};

export function __wbg_value_6d39332ab4788d86(arg0) {
    const ret = getObject(arg0).value;
    return addHeapObject(ret);
};

export function __wbg_iterator_888179a48810a9fe() {
    const ret = Symbol.iterator;
    return addHeapObject(ret);
};

export function __wbg_get_224d16597dbbfd96() { return handleError(function (arg0, arg1) {
    const ret = Reflect.get(getObject(arg0), getObject(arg1));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_call_1084a111329e68ce() { return handleError(function (arg0, arg1) {
    const ret = getObject(arg0).call(getObject(arg1));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_new_525245e2b9901204() {
    const ret = new Object();
    return addHeapObject(ret);
};

export function __wbg_self_3093d5d1f7bcb682() { return handleError(function () {
    const ret = self.self;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_window_3bcfc4d31bc012f8() { return handleError(function () {
    const ret = window.window;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_globalThis_86b222e13bdf32ed() { return handleError(function () {
    const ret = globalThis.globalThis;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_global_e5a3fe56f8be9485() { return handleError(function () {
    const ret = global.global;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_set_673dda6c73d19609(arg0, arg1, arg2) {
    getObject(arg0)[arg1 >>> 0] = takeObject(arg2);
};

export function __wbg_isArray_8364a5371e9737d8(arg0) {
    const ret = Array.isArray(getObject(arg0));
    return ret;
};

export function __wbg_push_37c89022f34c01ca(arg0, arg1) {
    const ret = getObject(arg0).push(getObject(arg1));
    return ret;
};

export function __wbg_instanceof_ArrayBuffer_61dfc3198373c902(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof ArrayBuffer;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_instanceof_Error_69bde193b0cc95e3(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof Error;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_new_796382978dfd4fb0(arg0, arg1) {
    const ret = new Error(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
};

export function __wbg_toString_9d18e102ca933e68(arg0) {
    const ret = getObject(arg0).toString();
    return addHeapObject(ret);
};

export function __wbg_call_89af060b4e1523f2() { return handleError(function (arg0, arg1, arg2) {
    const ret = getObject(arg0).call(getObject(arg1), getObject(arg2));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_call_c6fe275aaa60da79() { return handleError(function (arg0, arg1, arg2, arg3) {
    const ret = getObject(arg0).call(getObject(arg1), getObject(arg2), getObject(arg3));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_set_49185437f0ab06f8(arg0, arg1, arg2) {
    const ret = getObject(arg0).set(getObject(arg1), getObject(arg2));
    return addHeapObject(ret);
};

export function __wbg_isSafeInteger_7f1ed56200d90674(arg0) {
    const ret = Number.isSafeInteger(getObject(arg0));
    return ret;
};

export function __wbg_now_b7a162010a9e75b4() {
    const ret = Date.now();
    return ret;
};

export function __wbg_entries_7a0e06255456ebcd(arg0) {
    const ret = Object.entries(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_toString_e17a6671146f47c1(arg0) {
    const ret = getObject(arg0).toString();
    return addHeapObject(ret);
};

export function __wbg_new_b85e72ed1bfd57f9(arg0, arg1) {
    try {
        var state0 = {a: arg0, b: arg1};
        var cb0 = (arg0, arg1) => {
            const a = state0.a;
            state0.a = 0;
            try {
                return __wbg_adapter_391(a, state0.b, arg0, arg1);
            } finally {
                state0.a = a;
            }
        };
        const ret = new Promise(cb0);
        return addHeapObject(ret);
    } finally {
        state0.a = state0.b = 0;
    }
};

export function __wbg_resolve_570458cb99d56a43(arg0) {
    const ret = Promise.resolve(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_catch_a279b1da46d132d8(arg0, arg1) {
    const ret = getObject(arg0).catch(getObject(arg1));
    return addHeapObject(ret);
};

export function __wbg_then_95e6edc0f89b73b1(arg0, arg1) {
    const ret = getObject(arg0).then(getObject(arg1));
    return addHeapObject(ret);
};

export function __wbg_then_876bb3c633745cc6(arg0, arg1, arg2) {
    const ret = getObject(arg0).then(getObject(arg1), getObject(arg2));
    return addHeapObject(ret);
};

export function __wbg_buffer_b7b08af79b0b0974(arg0) {
    const ret = getObject(arg0).buffer;
    return addHeapObject(ret);
};

export function __wbg_newwithbyteoffsetandlength_8a2cb9ca96b27ec9(arg0, arg1, arg2) {
    const ret = new Uint8Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_new_ea1883e1e5e86686(arg0) {
    const ret = new Uint8Array(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_set_d1e79e2388520f18(arg0, arg1, arg2) {
    getObject(arg0).set(getObject(arg1), arg2 >>> 0);
};

export function __wbg_length_8339fcf5d8ecd12e(arg0) {
    const ret = getObject(arg0).length;
    return ret;
};

export function __wbg_instanceof_Uint8Array_247a91427532499e(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof Uint8Array;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_newwithlength_ec548f448387c968(arg0) {
    const ret = new Uint8Array(arg0 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_buffer_0710d1b9dbe2eea6(arg0) {
    const ret = getObject(arg0).buffer;
    return addHeapObject(ret);
};

export function __wbg_subarray_7c2e3576afe181d1(arg0, arg1, arg2) {
    const ret = getObject(arg0).subarray(arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_byteLength_850664ef28f3e42f(arg0) {
    const ret = getObject(arg0).byteLength;
    return ret;
};

export function __wbg_byteOffset_ea14c35fa6de38cc(arg0) {
    const ret = getObject(arg0).byteOffset;
    return ret;
};

export function __wbg_stringify_bbf45426c92a6bf5() { return handleError(function (arg0) {
    const ret = JSON.stringify(getObject(arg0));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_has_4bfbc01db38743f7() { return handleError(function (arg0, arg1) {
    const ret = Reflect.has(getObject(arg0), getObject(arg1));
    return ret;
}, arguments) };

export function __wbg_set_eacc7d73fefaafdf() { return handleError(function (arg0, arg1, arg2) {
    const ret = Reflect.set(getObject(arg0), getObject(arg1), getObject(arg2));
    return ret;
}, arguments) };

export function __wbindgen_bigint_get_as_i64(arg0, arg1) {
    const v = getObject(arg1);
    const ret = typeof(v) === 'bigint' ? v : undefined;
    getDataViewMemory0().setBigInt64(arg0 + 8 * 1, isLikeNone(ret) ? BigInt(0) : ret, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
};

export function __wbindgen_debug_string(arg0, arg1) {
    const ret = debugString(getObject(arg1));
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};

export function __wbindgen_throw(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
};

export function __wbindgen_memory() {
    const ret = wasm.memory;
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper1788(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 588, __wbg_adapter_50);
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper2795(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 984, __wbg_adapter_53);
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper2796(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 984, __wbg_adapter_53);
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper2797(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 984, __wbg_adapter_53);
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper2829(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 1009, __wbg_adapter_60);
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper2830(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 1009, __wbg_adapter_60);
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper2831(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 1009, __wbg_adapter_60);
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper4600(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 1775, __wbg_adapter_67);
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper5410(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 2038, __wbg_adapter_70);
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper6123(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 2367, __wbg_adapter_73);
    return addHeapObject(ret);
};

