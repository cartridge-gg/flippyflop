import ControllerConnector from '@cartridge/connector/controller'
import { mainnet, sepolia } from '@starknet-react/chains'
import { StarknetConfig, starkscan } from '@starknet-react/core'
import { RpcProvider } from 'starknet'

import { ACTIONS_ADDRESS, TORII_RPC_URL } from '@/constants'

import type { Chain } from '@starknet-react/chains'
import type { PropsWithChildren } from 'react'

export function StarknetProvider({ children }: PropsWithChildren) {
  return (
    <StarknetConfig
      autoConnect
      chains={[mainnet, sepolia]}
      connectors={[cartridge]}
      explorer={starkscan}
      provider={provider}
    >
      {children}
    </StarknetConfig>
  )
}

const cartridge = new ControllerConnector({
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
  rpc: TORII_RPC_URL,
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
