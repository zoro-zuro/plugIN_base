"use client";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { useState, useEffect } from "react";
import {
  useUser,
  SignInButton,
  SignOutButton,
  UserButton,
} from "@clerk/nextjs";
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
  const [scrolled, setScrolled] = useState(true);
  const router = useRouter();

  // Handle scroll effect for glassmorphism
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 0 ? false : true);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Hide header on specific routes
  const shouldHideHeader =
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/chatbots/bot_") ||
    pathname?.startsWith("/embed/");

  const publicNavItems = [
    { name: "Features", link: "#features" },
    { name: "How it Works", link: "#how-it-works" },
    { name: "Pricing", link: "#pricing" },
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "glass-morphism shadow-sm" : "bg-transparent"}`}
    >
      <Navbar className="!bg-transparent !border-none">
        {/* Desktop Navigation */}
        <NavBody className="flex justify-between items-center hidden md:flex max-w-7xl mx-auto px-6 h-16">
          {/* Left: PlugIN logo */}
          <button
            onClick={() =>
              isSignedIn ? router.push("/chatbot/manage") : router.push("/")
            }
            className="flex items-center gap-2 group"
          >
            {/* <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white font-bold shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-all">
              P
            </div> */}
            <span className="font-bold text-lg tracking-tight text-foreground group-hover:text-primary transition-colors">
              PlugIN
            </span>
          </button>

          {/* Center: Navigation Items */}
          <div className="flex-1 flex justify-center">
            <NavItems
              items={navItems}
              className="text-sm font-medium text-muted hover:text-primary transition-colors"
            />
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-4">
            <Button
              aria-label="Toggle dark mode"
              variant="ghost"
              onClick={toggleTheme}
              className="p-3.5 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors z-[99]"
            >
              {theme === "dark" ? <FiSun size={18} /> : <FiMoon size={18} />}
            </Button>

            {!isSignedIn ? (
              <SignInButton mode="modal">
                <button className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-violet-500/25">
                  Login
                </button>
              </SignInButton>
            ) : (
              <div className="flex items-center gap-3">
                <UserButton afterSignOutUrl="/" />
              </div>
            )}
          </div>
        </NavBody>

        {/* Mobile Navigation */}
        <MobileNav className="flex md:hidden">
          <MobileNavHeader className="px-4 py-3">
            <Link href="/" className="flex items-center gap-2">
              {/* <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white font-bold">
                P
              </div> */}
              <span className="font-bold text-lg">PlugIN</span>
            </Link>
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
            className="bg-background/95 backdrop-blur-xl border-t border-border"
          >
            {navItems.map((item, idx) => (
              <Link
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-3 px-4 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg mx-2 my-1"
              >
                {item.name}
              </Link>
            ))}

            <div className="p-4 border-t border-border mt-2">
              <button
                onClick={() => {
                  toggleTheme();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-accent text-sm font-medium"
              >
                {theme === "dark" ? <FiSun size={18} /> : <FiMoon size={18} />}
                <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
              </button>

              {!isSignedIn && (
                <div className="mt-4">
                  <SignInButton>
                    <button className="w-full rounded-full bg-primary py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/20">
                      Sign In
                    </button>
                  </SignInButton>
                </div>
              )}
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
    </div>
  );
}
