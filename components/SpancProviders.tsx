'use client'

import { SessionProvider } from 'next-auth/react'
import { OfflineProvider } from '@/components/OfflineProvider'
import OfflineStatusBar from '@/components/OfflineStatusBar'

export default function SpancProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <OfflineProvider>
        <OfflineStatusBar />
        {children}
      </OfflineProvider>
    </SessionProvider>
  )
}
