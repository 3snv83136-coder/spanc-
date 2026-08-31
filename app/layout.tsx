import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import SpancProviders from "@/components/SpancProviders"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SPANC — Interventions",
  description: "Logiciel terrain SPANC : contrôles, rapports, cartographie et attestations",
  robots: "noindex, nofollow",
  applicationName: "SPANC Sens",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SPANC",
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0e2a52",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${inter.className} antialiased`}>
        <SpancProviders>{children}</SpancProviders>
      </body>
    </html>
  )
}
