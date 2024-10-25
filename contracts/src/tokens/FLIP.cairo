// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts for Cairo ^0.18.0
use starknet::ContractAddress;

const MINTER_ROLE: felt252 = selector!("MINTER_ROLE");

#[starknet::interface]
pub trait IERC20Metadata<TState> {
    fn symbol(self: @TState) -> ByteArray;
    fn decimals(self: @TState) -> u8;
}

#[starknet::interface]
trait IFlip<TState> {
    fn burn(ref self: TState, value: u256);
    fn burn_from(ref self: TState, account: ContractAddress, value: u256);
    fn mint(ref self: TState, recipient: ContractAddress, amount: u256);
}

#[dojo::contract]
mod Flip {
    use openzeppelin::access::accesscontrol::AccessControlComponent;
    use openzeppelin::access::accesscontrol::DEFAULT_ADMIN_ROLE;
    use openzeppelin::introspection::src5::SRC5Component;
    use openzeppelin::token::erc20::ERC20Component;
    // use openzeppelin::token::erc20::ERC20HooksEmptyImpl;
    use starknet::{get_tx_info, get_caller_address, ContractAddress};
    use flippyflop::utils::get_contract_infos;
    use super::MINTER_ROLE;

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);
    component!(path: AccessControlComponent, storage: accesscontrol, event: AccessControlEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    #[abi(embed_v0)]
    impl ERC20Impl = ERC20Component::ERC20Impl<ContractState>;
    #[abi(embed_v0)]
    impl AccessControlMixinImpl = AccessControlComponent::AccessControlMixinImpl<ContractState>;

    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;
    impl AccessControlInternalImpl = AccessControlComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc20: ERC20Component::Storage,
        #[substorage(v0)]
        accesscontrol: AccessControlComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC20Event: ERC20Component::Event,
        #[flat]
        AccessControlEvent: AccessControlComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::model]
    #[dojo::event]
    struct FlipBalance {
        #[key]
        owner: ContractAddress,
        balance: u256
    }

    fn dojo_init(ref self: ContractState) {
        self.erc20.initializer("Flip", "FLIP");
        self.accesscontrol.initializer();

        let owner = get_tx_info().unbox().account_contract_address;
        let (_, actions_address) = get_contract_infos(self.world(), selector!("flippyflop-actions"));

        self.accesscontrol._grant_role(DEFAULT_ADMIN_ROLE, owner);
        self.accesscontrol._grant_role(MINTER_ROLE, actions_address);
    }

    #[abi(embed_v0)]
    impl ERC20Metadata<ContractState> of super::IERC20Metadata<ContractState> {
        /// Returns the ticker symbol of the token, usually a shorter version of the name.
        fn symbol(self: @ContractState) -> ByteArray {
            Self::symbol(self)
        }

        /// Returns the number of decimals used to get its user representation.
        fn decimals(self: @ContractState) -> u8 {
            Self::decimals(self)
        }
    }

    #[abi(embed_v0)]
    impl FlipImpl of super::IFlip<ContractState> {
        fn burn(ref self: ContractState, value: u256) {
            self.erc20.burn(get_caller_address(), value);
        }

        fn burn_from(ref self: ContractState, account: ContractAddress, value: u256) {
            self.accesscontrol.assert_only_role(MINTER_ROLE);
            self.erc20.burn(account, value);
        }

        fn mint(ref self: ContractState, recipient: ContractAddress, amount: u256) {
            self.accesscontrol.assert_only_role(MINTER_ROLE);
            self.erc20.mint(recipient, amount);
        }
    }

    pub impl ERC20HooksImpl<
        ContractState, +IWorldProvider
    > of ERC20Component::ERC20HooksTrait<ContractState> {
        fn before_update(
            ref self: ERC20Component::ComponentState<ContractState>,
            from: ContractAddress,
            recipient: ContractAddress,
            amount: u256
        ) {}

        fn after_update(
            ref self: ERC20Component::ComponentState<ContractState>,
            from: ContractAddress,
            recipient: ContractAddress,
            amount: u256
        ) {
            let contract_state = self.get_contract();

            let balance_from = contract_state.erc20.balance_of(from);
            let balance_recipient = contract_state.erc20.balance_of(recipient);

            emit!(
                contract_state.world(),
                (FlipBalance {
                    owner: from,
                    balance: balance_from
                })
            );

            emit!(
                contract_state.world(),
                (FlipBalance {
                    owner: recipient,
                    balance: balance_recipient
                })
            );
        }
    }

}
