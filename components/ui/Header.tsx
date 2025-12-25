"use client";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { useUser, SignInButton, UserButton } from "@clerk/nextjs";
import { FiSun, FiMoon } from "react-icons/fi";
import { Button } from "./Buttons";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";

export function Header() {
  const { isSignedIn } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme(); // ✅ Use next-themes
  const pathname = usePathname();
  const router = useRouter();
  const [isAtTop, setIsAtTop] = useState(true);

  // ✅ Toggle function
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsAtTop(window.scrollY <= 10);
    };
    handleScroll();
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
        isAtTop ? "glass-morphism shadow-sm" : "bg-transparent"
      }`}
    >
      <Navbar>
        <NavBody>
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 group outline-none"
          >
            <span className="font-bold text-xl tracking-tight text-foreground group-hover:text-primary transition-colors">
              PlugIN
            </span>
          </button>

          <div className="flex-1 flex justify-center">
            <NavItems items={navItems} />
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={toggleTheme}
              className="p-2.5 rounded-full hover:bg-accent text-foreground transition-colors"
              suppressHydrationWarning
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

        <MobileNav className="md:hidden">
          <MobileNavHeader>
            <Link href="/" className="flex items-center gap-2">
              <span className="font-bold text-lg text-foreground">PlugIN</span>
            </Link>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-md hover:bg-accent text-foreground transition-colors"
                suppressHydrationWarning
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
