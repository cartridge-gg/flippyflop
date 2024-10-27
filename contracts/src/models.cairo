use starknet::ContractAddress;

#[derive(Serde, Copy, Drop)]
#[dojo::model]
pub struct Game {
    #[key]
    pub id: u32,
    // 2**64 starts_at | 2**64 ends_at
    pub data: felt252,
}

#[derive(Serde, Copy, Drop)]
#[dojo::model]
pub struct Tile {
    #[key]
    pub x: u32,
    #[key]
    pub y: u32,
    // 2**244 address | 2**4 powerup | 2**4 powerup data
    pub flipped: felt252,
}

#[derive(Serde, Copy, Drop, Introspect, PartialEq)]
enum PowerUp {
    None: (),
    Multiplier: u8,
}

trait PowerUpTrait {
    fn cumulative_probability(self: PowerUp) -> u32;
    fn from_random(random: u32) -> PowerUp;
}

impl PowerUpImpl of PowerUpTrait {
    fn cumulative_probability(self: PowerUp) -> u32 {
        match self {
            PowerUp::None => 1000000, // 100% (cumulative)
            PowerUp::Multiplier(val) => {
                if val == 2 {
                    50500 // 5%
                } else if val == 4 {
                    500 // 0.05%
                } else if val == 8 {
                    100 // 0.01%
                } else if val == 16 {
                    50 // 0.0050%
                } else if val == 32 {
                    15 // 0.0015%
                } else {
                    0
                }
            },
        }
    }

    fn from_random(random: u32) -> PowerUp {
        if random <= 15 {
            PowerUp::Multiplier(32)
        } else if random <= 50 { 
            PowerUp::Multiplier(16)
        } else if random <= 100 {
            PowerUp::Multiplier(8)
        } else if random <= 500 {
            PowerUp::Multiplier(4)
        } else if random <= 50500 {
            PowerUp::Multiplier(2)
        } else {
            PowerUp::None
        }
    }
}

#[derive(Serde, Drop)]
#[dojo::model]
pub struct Claim {
    #[key]
    pub player: felt252,
    pub amount: u256,
}

#[derive(Serde, Drop)]
#[dojo::model]
pub struct User {
    #[key]
    pub identity: ContractAddress,
    pub last_message: ByteArray,
    pub hovering_tile_x: u32,
    pub hovering_tile_y: u32,
}
