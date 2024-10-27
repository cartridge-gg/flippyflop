#[dojo::interface]
trait IGameManager {
    fn set_game(ref world: IWorldDispatcher, starts_at: u64, ends_at: u64);
}

#[dojo::contract]
mod game {
    use flippyflop::constants::{GAME_ID, GAME_PRECOMPUTED_HASH, GAME_MODEL_SELECTOR};
    use flippyflop::models::Game;
    use flippyflop::packing::{pack_game_data};
    use super::{IGameManager};
    use starknet::{get_caller_address};

    #[abi(embed_v0)]
    impl GameManagerImpl of IGameManager<ContractState> {
        fn set_game(ref world: IWorldDispatcher, starts_at: u64, ends_at: u64) {
            assert(world.is_owner(0, get_caller_address()), 'Caller is not world owner');
            assert(ends_at > starts_at, 'Invalid game time range');
            
            let packed = pack_game_data(starts_at, ends_at);
            
            world.set_entity_lobotomized(
                GAME_MODEL_SELECTOR, 
                array![GAME_ID.into()].span(), 
                GAME_PRECOMPUTED_HASH, 
                packed
            );
        }
    }
}
