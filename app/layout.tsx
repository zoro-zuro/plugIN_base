import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { ClerkProvider } from "@clerk/nextjs";
import { Header } from "@/components/ui/Header";
import Script from "next/script";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PlugIN - Transform Data into Conversations",
  description:
    "Build custom AI agents trained on your data and plugin them into any website in seconds.",
  icons: {
    icon: "/convex.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            (function() {
              const theme = localStorage.getItem('theme') || 
                           (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
              document.documentElement.classList.toggle('dark', theme === 'dark');
            })();
          `}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <ClerkProvider dynamic>
          <ConvexClientProvider>
            <Header />
            <main className="relative flex flex-col min-h-[calc(100vh-4rem)]">
              {children}
            </main>
            {/* FOOTER */}
            <footer className="border-t border-border bg-card pt-16 pb-8">
              <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-xs text-white font-bold">
                      P
                    </div>
                    <span className="font-bold text-foreground text-lg">
                      Plugin_base
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Made with ♥️ and lot of ☕️ {""}
                    <span>
                      <Link
                        href="https://sheik-portfolio-taupe.vercel.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        By{" "}
                        <span className="hover:text-primary transition-colors font-medium">
                          Shiek
                        </span>
                        .
                      </Link>
                    </span>
                  </p>
                </div>

                <div className="flex gap-8 text-sm font-medium text-muted-foreground">
                  <Link
                    href="https://github.com/zoro-zuro/plugIN_base.git"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                  >
                    GitHub
                  </Link>
                </div>
              </div>
            </footer>
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
