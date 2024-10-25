use starknet::ContractAddress;

#[derive(Serde, Copy, Drop)]
#[dojo::model]
pub struct Game {
    #[key]
    pub id: u32,
    pub is_locked: bool,
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
    Lock: (),
    Multiplier: u8,
}

trait PowerUpTrait {
    fn cumulative_probability(self: PowerUp) -> u32;
}

impl PowerUpImpl of PowerUpTrait {
    fn cumulative_probability(self: PowerUp) -> u32 {
        match self {
            PowerUp::None => 1000000, // 100% (cumulative)
            PowerUp::Lock => 3142,    // 0.1642 + 0.1500 = 0.3142% (cumulative)
            PowerUp::Multiplier(val) => {
                if val == 2 {
                    1642 // 0.0642% + 0.1000% = 0.1642% (cumulative)
                } else if val == 4 {
                    642 // 0.0142% + 0.0500% = 0.0642% (cumulative)
                } else if val == 8 {
                    142 // 0.0017% + 0.0125% = 0.0142% (cumulative)
                } else if val == 16 {
                    17 // 0.0005% + 0.0012% = 0.0017% (cumulative)
                } else if val == 32 {
                    5 // 0.0005%
                } else {
                    0
                }
            },
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
