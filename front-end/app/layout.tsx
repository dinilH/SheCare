import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/contexts/auth-context"
import { WellnessProvider } from "@/contexts/wellness-context"
import { NewsProvider } from "@/contexts/news-context"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import ChatbotIcon from "@/components/chatbot-icon"
import LoadingScreen from "@/components/loading-screen"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "She Care - Women's Health & Wellness Platform",
  description: "Comprehensive health tracking, period monitoring, and wellness insights for women",
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <WellnessProvider>
              <NewsProvider>
                <LoadingScreen />
                <div className="min-h-screen flex flex-col">
                  <Navbar />
                  <main className="flex-1 pt-16">{children}</main>
                  <Footer />
                  <ChatbotIcon />
                  </div>
                  <Toaster />
                </NewsProvider>
              </WellnessProvider>
            </AuthProvider>
          </ThemeProvider>
      </body>
    </html>
  )
}