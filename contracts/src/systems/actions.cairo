// define the interface
#[dojo::interface]
trait IActions {
    fn flip(ref world: IWorldDispatcher, x: u32, y: u32, team: u8);
    fn flop(ref world: IWorldDispatcher);
    fn claim(ref world: IWorldDispatcher, flipped_hashes: Array<felt252>);
}

// dojo decorator
#[dojo::contract]
mod actions {
    use super::{IActions};
    use starknet::{ContractAddress, get_caller_address, info::{get_tx_info, get_block_timestamp, get_execution_info}};
    use flippyflop::models::{PowerUp, PowerUpTrait, Game, Claim};
    use core::poseidon::poseidon_hash_span;
    use dojo::model::{FieldLayout, Layout};
    use flippyflop::tokens::flip::{IFlipDispatcher, IFlipDispatcherTrait, MINTER_ROLE};
    use flippyflop::constants::{GAME_ID, ADDRESS_MASK, POWERUP_MASK, POWERUP_DATA_MASK, X_BOUND, Y_BOUND, TILE_MODEL_SELECTOR, GAME_MODEL_SELECTOR, GAME_PRECOMPUTED_HASH, SRC5_DELEGATE_ACCOUNT_ID};
    use flippyflop::packing::{pack_flipped_data, unpack_flipped_data, unpack_game_data};
    use openzeppelin::access::accesscontrol::interface::{IAccessControlDispatcher, IAccessControlDispatcherTrait};
    use openzeppelin::introspection::interface::{ISRC5Dispatcher, ISRC5DispatcherTrait};
    use flippyflop::utils::{flip_access_control, flip_token};

    fn get_random_powerup(seed: felt252) -> PowerUp {
        let tx_hash = get_tx_info().transaction_hash;
        let hash: u256 = poseidon_hash_span(array![seed, tx_hash].span()).into();
        let random_value: u32 = (hash % 1000000).try_into().unwrap();
        
        PowerUpTrait::from_random(random_value)
    }

    #[abi(embed_v0)]
    impl ActionsImpl of IActions<ContractState> {
        fn flip(ref world: IWorldDispatcher, x: u32, y: u32, team: u8) {
            // Get game state and check if we're within the game period
            let game_data = world.entity_lobotomized(GAME_MODEL_SELECTOR, GAME_PRECOMPUTED_HASH);
            let (starts_at, ends_at) = unpack_game_data(game_data);
            let current_time = get_block_timestamp();
            
            assert!(current_time >= starts_at, "Game has not started");
            assert!(current_time < ends_at, "Game has ended");
            
            assert!(x < X_BOUND, "X is out of bounds");
            assert!(y < Y_BOUND, "Y is out of bounds");

            let player = get_caller_address();
            let hash = poseidon_hash_span(array![x.into(), y.into()].span());
            let tile = world.entity_lobotomized(TILE_MODEL_SELECTOR, hash);

            assert!(tile == 0, "Tile already flipped");

            let powerup = get_random_powerup(hash);
            let packed_data = pack_flipped_data(player.into(), powerup, team);

            world
                .set_entity_lobotomized(
                    TILE_MODEL_SELECTOR, array![x.into(), y.into()].span(), hash, packed_data
                );
        }

        fn flop(ref world: IWorldDispatcher) {
            // Get game state and check if we're within the game period
            let game_data = world.entity_lobotomized(GAME_MODEL_SELECTOR, GAME_PRECOMPUTED_HASH);
            let (starts_at, ends_at) = unpack_game_data(game_data);
            let current_time = get_block_timestamp();
            
            assert!(current_time >= starts_at, "Game has not started");
            assert!(current_time < ends_at, "Game has ended");

            let evil_address = get_caller_address();
            let nonce = get_tx_info().nonce;

            let hash: u256 = poseidon_hash_span(array![evil_address.into(), nonce.into()].into())
                .into();

            let x: u32 = (hash % X_BOUND.into()).try_into().unwrap();
            let y: u32 = ((hash / Y_BOUND.into()) % Y_BOUND.into()).try_into().unwrap();

            let entity_hash = poseidon_hash_span(array![x.into(), y.into()].span());
            let tile = world.entity_lobotomized(TILE_MODEL_SELECTOR, entity_hash);

            // Check if the tile has a powerup
            let (_, powerup, _) = unpack_flipped_data(tile);
            if powerup == PowerUp::None || powerup == PowerUp::Multiplier(2) {
                world
                    .set_entity_lobotomized(
                        TILE_MODEL_SELECTOR, array![x.into(), y.into()].span(), entity_hash, 0
                    );
            }
        }

        fn claim(ref world: IWorldDispatcher, flipped_hashes: Array<felt252>) {
            // Caller has to be a controller account
            let src5 = ISRC5Dispatcher { contract_address: get_caller_address() };
            assert!(src5.supports_interface(SRC5_DELEGATE_ACCOUNT_ID), "Caller has to be a controller account");

            // Game must be ended
            let game_data = world.entity_lobotomized(GAME_MODEL_SELECTOR, GAME_PRECOMPUTED_HASH);
            let (_, ends_at) = unpack_game_data(game_data);
            assert!(get_block_timestamp() >= ends_at, "Game has not ended");

            let player = get_caller_address().into();
            let masked_player: felt252 = (player.into() & ADDRESS_MASK).try_into().unwrap();
            
            // Check if a Claim already exists for this player
            let existing_claim = get!(world, (player), Claim);

            let flip_token = flip_token(world);
            let mut total_tokens: u256 = 0;

            // Iterate through the provided flipped tiles
            let mut i = 0;
            loop {
                if i >= flipped_hashes.len() {
                    break;
                }

                let tile = world.entity_lobotomized(TILE_MODEL_SELECTOR, *flipped_hashes[i]);

                // Verify the tile belongs to the player
                let (tile_owner, powerup, _) = unpack_flipped_data(tile);
                assert!(tile_owner == masked_player, "Tile does not belong to the player");

                // Calculate tokens for this tile
                let mut tokens: u256 = 1000000000000000000; // 1 ETH in wei

                // Apply powerup multiplier if any
                if let PowerUp::Multiplier(multiplier) = powerup {
                    tokens *= multiplier.into();
                }

                total_tokens += tokens;
                i += 1;
            };

            if total_tokens > existing_claim.amount {
                set!(world, (Claim { player, amount: total_tokens }));
                flip_token.mint(player.try_into().unwrap(), total_tokens - existing_claim.amount);
            }
        }
    }
}
