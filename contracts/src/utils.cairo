use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};
use starknet::{ClassHash, ContractAddress};
use openzeppelin::access::accesscontrol::interface::{IAccessControlDispatcher, IAccessControlDispatcherTrait};
use flippyflop::tokens::flip::{IFlipDispatcher, IFlipDispatcherTrait};

pub fn get_contract_info(
    world: IWorldDispatcher, resource: felt252
) -> (ClassHash, ContractAddress) {
    let (class_hash, contract_address) = match world.resource(resource) {
        dojo::world::Resource::Contract((
            class_hash, contract_address
        )) => (class_hash, contract_address),
        _ => (0.try_into().unwrap(), 0.try_into().unwrap())
    };

    if class_hash.is_zero() || contract_address.is_zero() {
        panic!("Invalid resource!");
    }

    (class_hash, contract_address)
}

pub fn flip_token(world: IWorldDispatcher) -> IFlipDispatcher {
    let (_, contract_address) = get_contract_info(world, selector_from_tag!("flippyflop-Flip"));
    IFlipDispatcher { contract_address }
}
    
pub fn flip_access_control(world: IWorldDispatcher) -> IAccessControlDispatcher {
    let (_, contract_address) = get_contract_info(world, selector_from_tag!("flippyflop-Flip"));
    IAccessControlDispatcher { contract_address }
}