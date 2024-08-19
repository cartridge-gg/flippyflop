/* tslint:disable */
/* eslint-disable */
/**
* @param {string} typed_data
* @param {string} address
* @returns {string}
*/
export function typedDataEncode(typed_data: string, address: string): string;
/**
* @returns {string}
*/
export function signingKeyNew(): string;
/**
* @param {string} private_key
* @param {string} hash
* @returns {Signature}
*/
export function signingKeySign(private_key: string, hash: string): Signature;
/**
* @param {string} signing_key
* @returns {string}
*/
export function verifyingKeyNew(signing_key: string): string;
/**
* @param {string} verifying_key
* @param {string} hash
* @param {Signature} signature
* @returns {boolean}
*/
export function verifyingKeyVerify(verifying_key: string, hash: string, signature: Signature): boolean;
/**
* @param {string} rpc_url
* @returns {Provider}
*/
export function createProvider(rpc_url: string): Provider;
/**
* @param {string} class_hash
* @param {string} salt
* @param {(string)[]} constructor_calldata
* @param {string} deployer_address
* @returns {string}
*/
export function hashGetContractAddress(class_hash: string, salt: string, constructor_calldata: (string)[], deployer_address: string): string;
/**
* @param {string} tag
* @returns {string}
*/
export function getSelectorFromTag(tag: string): string;
/**
* @param {string} str
* @returns {(string)[]}
*/
export function byteArraySerialize(str: string): (string)[];
/**
* @param {(string)[]} felts
* @returns {string}
*/
export function byteArrayDeserialize(felts: (string)[]): string;
/**
* @param {(string)[]} inputs
* @returns {string}
*/
export function poseidonHash(inputs: (string)[]): string;
/**
* @param {string} name
* @returns {string}
*/
export function getSelectorFromName(name: string): string;
/**
* @param {Uint8Array} inputs
* @returns {string}
*/
export function starknetKeccak(inputs: Uint8Array): string;
/**
* @param {string} str
* @returns {string}
*/
export function cairoShortStringToFelt(str: string): string;
/**
* @param {string} str
* @returns {string}
*/
export function parseCairoShortString(str: string): string;
/**
* Create the a client with the given configurations.
* @param {ClientConfig} config
* @returns {Promise<ToriiClient>}
*/
export function createClient(config: ClientConfig): Promise<ToriiClient>;
export interface ClientConfig {
    rpcUrl: string;
    toriiUrl: string;
    relayUrl: string;
    worldAddress: string;
}

export interface Ty {
    type: "primitive" | "struct" | "enum" | "array" | "tuple" | "bytearray";
    type_name: string;
    value: boolean | number | string | Ty | null;
    key: boolean;
}

export interface EnumValue {
    option: string;
    value: Ty;
}

export interface Signature {
    r: string;
    s: string;
}

export type Calls = Call[];

export type Model = Record<string, Ty>;

export type Entity = Record<string, Model>;

export type Entities = Record<string, Entity>;

export interface Call {
    to: string;
    selector: string;
    calldata: string[];
}

export type BlockTag = "Latest" | "Pending";

export type BlockId = { Hash: string } | { Number: number } | { BlockTag: BlockTag };

export interface Query {
    limit: number;
    offset: number;
    clause: Clause | undefined;
}

export type Clause = { Keys: KeysClause } | { Member: MemberClause } | { Composite: CompositeClause };

export type KeysClauses = EntityKeysClause[];

export type ModelKeysClauses = ModelKeysClause[];

export interface ModelKeysClause {
    model: string;
    keys: string[];
}

export type PatternMatching = "FixedLen" | "VariableLen";

export type EntityKeysClause = { HashedKeys: string[] } | { Keys: KeysClause };

export interface KeysClause {
    keys: (string | undefined)[];
    pattern_matching: PatternMatching;
    models: string[];
}

export interface MemberClause {
    model: string;
    member: string;
    operator: ComparisonOperator;
    value: Primitive;
}

export interface CompositeClause {
    operator: LogicalOperator;
    clauses: Clause[];
}

export type LogicalOperator = "And" | "Or";

export type ComparisonOperator = "Eq" | "Neq" | "Gt" | "Gte" | "Lt" | "Lte";

export interface Value {
    primitive_type: Primitive;
    value_type: ValueType;
}

export type ValueType = { String: string } | { Int: number } | { UInt: number } | { VBool: boolean } | { Bytes: number[] };

export type Primitive = { I8: number | undefined } | { I16: number | undefined } | { I32: number | undefined } | { I64: number | undefined } | { I128: string | undefined } | { U8: number | undefined } | { U16: number | undefined } | { U32: number | undefined } | { U64: number | undefined } | { U128: string | undefined } | { U256: string | undefined } | { USize: number | undefined } | { Bool: boolean | undefined } | { Felt252: string | undefined } | { ClassHash: string | undefined } | { ContractAddress: string | undefined };

/**
*/
export class Account {
  free(): void;
/**
* @returns {string}
*/
  address(): string;
/**
* @returns {string}
*/
  chainId(): string;
/**
* @param {string} block_id
*/
  setBlockId(block_id: string): void;
/**
* @param {(Call)[]} calldata
* @returns {Promise<string>}
*/
  executeRaw(calldata: (Call)[]): Promise<string>;
/**
* @param {string} private_key
* @returns {Promise<Account>}
*/
  deployBurner(private_key: string): Promise<Account>;
/**
* @returns {Promise<string>}
*/
  nonce(): Promise<string>;
}
/**
*/
export class IntoUnderlyingByteSource {
  free(): void;
/**
* @param {any} controller
*/
  start(controller: any): void;
/**
* @param {any} controller
* @returns {Promise<any>}
*/
  pull(controller: any): Promise<any>;
/**
*/
  cancel(): void;
/**
*/
  readonly autoAllocateChunkSize: number;
/**
*/
  readonly type: string;
}
/**
*/
export class IntoUnderlyingSink {
  free(): void;
/**
* @param {any} chunk
* @returns {Promise<any>}
*/
  write(chunk: any): Promise<any>;
/**
* @returns {Promise<any>}
*/
  close(): Promise<any>;
/**
* @param {any} reason
* @returns {Promise<any>}
*/
  abort(reason: any): Promise<any>;
}
/**
*/
export class IntoUnderlyingSource {
  free(): void;
/**
* @param {any} controller
* @returns {Promise<any>}
*/
  pull(controller: any): Promise<any>;
/**
*/
  cancel(): void;
}
/**
* Raw options for [`pipeTo()`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream/pipeTo).
*/
export class PipeOptions {
  free(): void;
/**
*/
  readonly preventAbort: boolean;
/**
*/
  readonly preventCancel: boolean;
/**
*/
  readonly preventClose: boolean;
/**
*/
  readonly signal: AbortSignal | undefined;
}
/**
*/
export class Provider {
  free(): void;
/**
* @param {string} private_key
* @param {string} address
* @returns {Promise<Account>}
*/
  createAccount(private_key: string, address: string): Promise<Account>;
/**
* @param {Call} call
* @param {BlockId} block_id
* @returns {Promise<Array<any>>}
*/
  call(call: Call, block_id: BlockId): Promise<Array<any>>;
/**
* @param {string} txn_hash
* @returns {Promise<boolean>}
*/
  waitForTransaction(txn_hash: string): Promise<boolean>;
}
/**
*/
export class QueuingStrategy {
  free(): void;
/**
*/
  readonly highWaterMark: number;
}
/**
* Raw options for [`getReader()`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream/getReader).
*/
export class ReadableStreamGetReaderOptions {
  free(): void;
/**
*/
  readonly mode: any;
}
/**
*/
export class Subscription {
  free(): void;
/**
*/
  cancel(): void;
/**
*/
  id: bigint;
}
/**
*/
export class ToriiClient {
  free(): void;
/**
* @param {Query} query
* @returns {Promise<Entities>}
*/
  getEntities(query: Query): Promise<Entities>;
/**
* @param {number} limit
* @param {number} offset
* @returns {Promise<Entities>}
*/
  getAllEntities(limit: number, offset: number): Promise<Entities>;
/**
* @param {Query} query
* @returns {Promise<Entities>}
*/
  getEventMessages(query: Query): Promise<Entities>;
/**
* @param {(EntityKeysClause)[]} clauses
* @param {Function} callback
* @returns {Promise<Subscription>}
*/
  onEntityUpdated(clauses: (EntityKeysClause)[], callback: Function): Promise<Subscription>;
/**
* @param {Subscription} subscription
* @param {(EntityKeysClause)[]} clauses
* @returns {Promise<void>}
*/
  updateEntitySubscription(subscription: Subscription, clauses: (EntityKeysClause)[]): Promise<void>;
/**
* @param {(EntityKeysClause)[]} clauses
* @param {Function} callback
* @returns {Promise<Subscription>}
*/
  onEventMessageUpdated(clauses: (EntityKeysClause)[], callback: Function): Promise<Subscription>;
/**
* @param {Subscription} subscription
* @param {(EntityKeysClause)[]} clauses
* @returns {Promise<void>}
*/
  updateEventMessageSubscription(subscription: Subscription, clauses: (EntityKeysClause)[]): Promise<void>;
/**
* @param {string} message
* @param {(string)[]} signature
* @returns {Promise<Uint8Array>}
*/
  publishMessage(message: string, signature: (string)[]): Promise<Uint8Array>;
}
