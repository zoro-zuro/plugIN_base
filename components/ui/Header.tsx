"use client";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { useState, useEffect } from "react";
import { useUser, SignInButton, UserButton } from "@clerk/nextjs";
import { FiSun, FiMoon } from "react-icons/fi";
import { useTheme } from "../hooks/useTheme";
import { Button } from "./Buttons";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export function Header() {
  const { isSignedIn } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  // 1. Rename to 'isAtTop' so the logic is clear (True = at top, False = scrolled down)
  const [isAtTop, setIsAtTop] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      // 2. Use a small buffer (e.g., > 10px) to prevent flickering on small movements
      // Logic: If scrollY is low, we are "at top".
      setIsAtTop(window.scrollY <= 10);
    };

    // 3. Trigger once on mount to ensure state is correct immediately (e.g., page refresh)
    handleScroll();

    // 4. Use { passive: true } for better scroll performance in browsers
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const shouldHideHeader =
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/chatbots/bot_") ||
    pathname?.startsWith("/embed/");

  const publicNavItems = [
    { name: "Features", link: "#features" },
    { name: "How it Works", link: "#how-it-works" },
  ];

  const authenticatedNavItems = [
    { name: "My Chatbots", link: "/chatbot/manage" },
    { name: "Create Chatbot", link: "/chatbot/create" },
  ];

  const navItems = isSignedIn ? authenticatedNavItems : publicNavItems;

  if (shouldHideHeader) {
    return null;
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isAtTop
          ? "glass-morphism shadow-sm" // Style when at the top (Before scroll)
          : "bg-transparent" // Style when scrolled down (After scroll)
      }`}
    >
      <Navbar>
        {/* Desktop Navigation */}
        <NavBody>
          {/* Logo */}
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 group outline-none"
          >
            <span className="font-bold text-xl tracking-tight text-foreground group-hover:text-primary transition-colors">
              PlugIN
            </span>
          </button>

          {/* Center Items */}
          <div className="flex-1 flex justify-center">
            <NavItems items={navItems} />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={toggleTheme}
              className="p-2.5 rounded-full hover:bg-accent text-foreground transition-colors"
            >
              {theme === "dark" ? <FiSun size={18} /> : <FiMoon size={18} />}
            </Button>

            {!isSignedIn ? (
              <SignInButton mode="modal">
                <button className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25">
                  Sign In
                </button>
              </SignInButton>
            ) : (
              <UserButton afterSignOutUrl="/" />
            )}
          </div>
        </NavBody>

        {/* Mobile Navigation */}
        <MobileNav className="md:hidden">
          <MobileNavHeader>
            <Link href="/" className="flex items-center gap-2">
              <span className="font-bold text-lg text-foreground">PlugIN</span>
            </Link>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-md hover:bg-accent text-foreground transition-colors"
              >
                {theme === "dark" ? <FiSun size={20} /> : <FiMoon size={20} />}
              </button>

              <MobileNavToggle
                isOpen={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              />
            </div>
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navItems.map((item, idx) => (
              <Link
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full py-3 px-4 text-base font-medium text-foreground hover:bg-accent rounded-lg transition-colors"
              >
                {item.name}
              </Link>
            ))}

            {!isSignedIn && (
              <div className="mt-4 pt-4 border-t border-border w-full">
                <SignInButton>
                  <button className="w-full rounded-xl bg-primary py-3 text-base font-bold text-white shadow-lg active:scale-95 transition-transform">
                    Sign In
                  </button>
                </SignInButton>
              </div>
            )}
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
    </div>
  );
}
