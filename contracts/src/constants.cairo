pub const X_BOUND: u32 = 256;
pub const Y_BOUND: u32 = 256;
pub const ADDRESS_MASK: u256 = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000;
pub const POWERUP_MASK: u256 = 0xF000;
pub const POWERUP_DATA_MASK: u256 = 0x0FF0;
pub const TILE_TYPE_MASK: u256 = 0x000F;

pub const TILE_MODEL_SELECTOR: felt252 = selector_from_tag!("flippyflop-Tile");
pub const GAME_ID: u32 = 0x0;