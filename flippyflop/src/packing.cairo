use starknet::ContractAddress;
use flippyflop::models::PowerUp;
use flippyflop::constants::{ADDRESS_MASK, POWERUP_MASK, POWERUP_DATA_MASK, TILE_TYPE_MASK};

fn pack_flipped_data(address: felt252, powerup: PowerUp, team: u8) -> felt252 {
    let address_bits: u256 = address.into();
    let (powerup_type, powerup_data) = match powerup {
        PowerUp::None => (0_u256, 0_u256),
        PowerUp::Lock => (1_u256, 0_u256),
        PowerUp::Multiplier(multiplier) => (2_u256, multiplier.into()),
    };
    
    let mut packed: u256 = 0_u256;
    packed = packed | (address_bits & ADDRESS_MASK);
    packed = packed | ((powerup_type * 0x1000_u256) & POWERUP_MASK);
    packed = packed | ((powerup_data * 0x10_u256) & POWERUP_DATA_MASK);
    packed = packed | (team.into() & TILE_TYPE_MASK);
    packed.try_into().unwrap()
}

fn unpack_flipped_data(flipped: felt252) -> (felt252, PowerUp, u8) {
    let flipped_u256: u256 = flipped.into();
    let address: felt252 = (flipped_u256 & ADDRESS_MASK).try_into().unwrap();
    let powerup_type: felt252 = ((flipped_u256 & POWERUP_MASK) / 0x1000).try_into().unwrap();
    let powerup_data = (flipped_u256 & POWERUP_DATA_MASK) / 0x10;
    let team: u8 = (flipped_u256 & TILE_TYPE_MASK).try_into().unwrap();
    
    let powerup = match powerup_type {
        0 => PowerUp::None,
        1 => PowerUp::Lock,
        2 => PowerUp::Multiplier(powerup_data.try_into().unwrap()),
        _ => PowerUp::None,
    };
    
    (address, powerup, team)
}