'use client'

import { Chain, mainnet, sepolia } from '@starknet-react/chains'
import { StarknetConfig, starkscan } from '@starknet-react/core'
import { PropsWithChildren } from 'react'
import CartridgeConnector from '@cartridge/connector'
import { RpcProvider, shortString } from 'starknet'
import { ACTIONS_ADDRESS } from '@/constants'

export function StarknetProvider({ children }: PropsWithChildren) {
  return (
    <StarknetConfig autoConnect chains={[sepolia]} connectors={[cartridge]} explorer={starkscan} provider={provider}>
      {children}
    </StarknetConfig>
  )
}

const cartridge = new CartridgeConnector(
  [
    {
      target: ACTIONS_ADDRESS,
      method: 'flip',
      description: 'Flip a tile at given x and y coordinates',
    },
  ],
  {
    url: 'https://x.cartridge.gg',
    rpc: 'https://api.cartridge.gg/x/starknet/sepolia',
    paymaster: {
      caller: shortString.encodeShortString('ANY_CALLER'),
    },
    // theme: "dope-wars",
    // colorMode: "light"
    // prefunds: [
    //   {
    //     address: ETH_TOKEN_ADDRESS,
    //     min: "300000000000000",
    //   },
    //   {
    //     address: PAPER_TOKEN_ADDRESS,
    //     min: "100",
    //   },
    // ],
  },
)

function provider(chain: Chain) {
  switch (chain) {
    case mainnet:
      return new RpcProvider({
        nodeUrl: 'https://api.cartridge.gg/x/starknet/mainnet',
      })
    case sepolia:
    default:
      return new RpcProvider({
        nodeUrl: 'https://api.cartridge.gg/x/starknet/sepolia',
      })
  }
}
