import "./globals.css"
import { Inter, JetBrains_Mono } from "next/font/google"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata = {
  title: "Edgely",
  description: "Always-on AI trading guru for prop firms",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${mono.variable} bg-bg text-text-primary antialiased`}
      >
        {children}
      </body>
    </html>
  )
}
