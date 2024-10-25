#[dojo::interface]
trait IGameManager {
    fn lock(ref world: IWorldDispatcher, locked_at: u64);
}

#[dojo::contract]
mod game {
    use flippyflop::constants::{GAME_ID};
    use flippyflop::models::Game;
    use super::{IGameManager};
    use starknet::{get_caller_address};

    #[abi(embed_v0)]
    impl GameManagerImpl of IGameManager<ContractState> {
        fn lock(ref world: IWorldDispatcher, locked_at: u64) {
            assert(world.is_owner(0, get_caller_address()), 'Caller is not world owner');
            
            set!(world, (Game { id: GAME_ID, locked_at }));
        }
    }
}