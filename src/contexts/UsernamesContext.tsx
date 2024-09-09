import { useAccount, useConnect } from '@starknet-react/core'
import React, { createContext, useState, useContext, useCallback, useEffect } from 'react'
import { fetchUsername, fetchUsernames } from 'src/utils'

interface UsernamesContextType {
  usernamesCache: Record<string, string>
  getUsername: (address: string) => Promise<string>
  setUsernamesCache: React.Dispatch<React.SetStateAction<Record<string, string>>>
}

const UsernamesContext = createContext<UsernamesContextType | undefined>(undefined)

export const UsernamesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usernamesCache, setUsernamesCache] = useState<Record<string, string>>({})
  const { account, status } = useAccount()
  const { connect, connectors } = useConnect()
  useEffect(() => {
    if (status === 'connected') {
      ;(connectors[0] as any).username().then((username) => {
        setUsernamesCache((prev) => ({ ...prev, [account.address]: username }))
      })
    }
  }, [status])

  const getUsername = useCallback(
    async (address: string) => {
      if (usernamesCache[address]) {
        return usernamesCache[address]
      }

      const username = await fetchUsername(address)
      if (username) setUsernamesCache((prev) => ({ ...prev, [address]: username }))
      return username
    },
    [usernamesCache],
  )

  const value = { usernamesCache, getUsername, setUsernamesCache }

  return <UsernamesContext.Provider value={value}>{children}</UsernamesContext.Provider>
}

export const useUsernames = () => {
  const context = useContext(UsernamesContext)
  if (context === undefined) {
    throw new Error('useUsernames must be used within a UsernamesProvider')
  }
  return context
}

// export const useUsernamesBatch = (addresses: string[]) => {
//   const { usernamesCache, setUsernamesCache } = useUsernames()

//   useEffect(() => {
//     const addressesToFetch = addresses.filter((address) => !usernamesCache[address])

//     if (addressesToFetch.length === 0) return

//     fetchUsernames(addressesToFetch).then((usernames) => {
//       setUsernamesCache((prev) => ({ ...prev, ...usernames }))
//     })
//   }, [addresses, usernamesCache, setUsernamesCache])

//   return usernamesCache
// }
