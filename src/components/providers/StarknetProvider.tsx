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

const cartridge = new CartridgeConnector({
  policies: [
    {
      target: ACTIONS_ADDRESS,
      method: 'flip',
      description: 'Flip a tile at given x and y coordinates',
    },
    {
      target: ACTIONS_ADDRESS,
      method: 'claim',
      description: 'Claim $FLIP for your flipped tiles',
    },
    {
      target: '0x70fc96f845e393c732a468b6b6b54d876bd1a29e41a026e8b13579bf98eec8f',
      method: 'attack',
      description: 'Attack the beast',
    },
  ],
  url: 'https://x.cartridge.gg',
  rpc: 'https://api.cartridge.gg/x/starknet/mainnet',
  paymaster: {
    caller: shortString.encodeShortString('ANY_CALLER'),
  },
  theme: 'flippyflop',
  // propagateSessionErrors: true,
})

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
