pub const X_BOUND: u32 = 256;
pub const Y_BOUND: u32 = 256;
pub const ADDRESS_MASK: u256 = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000;
pub const POWERUP_MASK: u256 = 0xF000;
pub const POWERUP_DATA_MASK: u256 = 0x0FF0;
pub const TILE_TYPE_MASK: u256 = 0x000F;

pub const TILE_MODEL_SELECTOR: felt252 = selector_from_tag!("flippyflop-Tile");
pub const GAME_MODEL_SELECTOR: felt252 = selector_from_tag!("flippyflop-Game");
pub const GAME_ID: u32 = 0x0;
pub const GAME_PRECOMPUTED_HASH: felt252 = 0x545d6f7d28a8a398e543948be5a026af60c4dea482867a6eeb2525b35d1e1e1; // poseidon hash of 0x0