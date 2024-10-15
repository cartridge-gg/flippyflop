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
  ],
  url: 'https://x.cartridge.gg',
  // rpc: 'https://api.cartridge.gg/x/starknet/sepolia'
  rpc: 'https://api.cartridge.gg/x/flippyflop/katana',
  paymaster: {
    caller: shortString.encodeShortString('ANY_CALLER'),
  },
  theme: 'flippyflop',
  config: {
    presets: {
      flippyflop: {
        id: 'flippyflop',
        name: 'FlippyFlop',
        icon: '/whitelabel/flippyflop/icon.png',
        cover: '/whitelabel/flippyflop/cover.png',
        colors: {
          primary: '#F38332',
        },
      },
    },
  },
  propagateSessionErrors: true,
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
