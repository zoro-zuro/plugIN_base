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
import { useState } from "react";
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
import { usePathname } from "next/navigation";

export function Header() {
  const { isSignedIn } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  // ✅ Hide header on specific routes
  const shouldHideHeader =
    pathname?.startsWith("/dashboard") || // ✅ All dashboard routes
    pathname?.startsWith("/chatbots/bot_") || // Chatbot-specific pages
    pathname?.startsWith("/embed/"); // Embed widget
  // Eval page

  // Different nav items based on auth state
  const publicNavItems = [
    { name: "Features", link: "#features" },
    { name: "Pricing", link: "#pricing" },
    { name: "Contact", link: "#contact" },
  ];

  const authenticatedNavItems = [
    { name: "My Chatbots", link: "/chatbot/manage" },
    { name: "Create Chatbot", link: "/chatbot/create" },
    { name: "Playground", link: "/dashboard/playground" },
    { name: "Upload Docs", link: "/dashboard/upload" },
  ];

  const navItems = isSignedIn ? authenticatedNavItems : publicNavItems;

  // ✅ Return null to hide header
  if (shouldHideHeader) {
    return null;
  }

  return (
    <div className="relative w-full">
      <Navbar>
        {/* Desktop Navigation */}
        <NavBody className="flex justify-between items-center hidden md:flex">
          {/* Left: PlugIN logo/text */}
          <Link
            href={isSignedIn ? "/chatbots/manage" : "/"}
            className="flex items-center gap-2"
          >
            <span className="font-bold text-lg">PlugIN</span>
          </Link>

          {/* Center: Navigation Items */}
          <div className="flex-1 flex justify-center">
            <NavItems items={navItems} />
          </div>

          {/* Right: Theme toggle and Clerk Login/Logout */}
          <div className="flex items-center gap-4">
            <Button
              aria-label="Toggle dark mode"
              variant="ghost"
              onClick={toggleTheme}
              className="p-4 px-3 rounded-full z-[99]"
            >
              {theme === "dark" ? <FiSun size={20} /> : <FiMoon size={20} />}
            </Button>

            {!isSignedIn ? (
              <SignInButton>
                <NavbarButton variant="primary">Login</NavbarButton>
              </SignInButton>
            ) : (
              <div className="flex items-center gap-3">
                <UserButton afterSignOutUrl="/" />
                <SignOutButton>
                  <NavbarButton variant="primary">Logout</NavbarButton>
                </SignOutButton>
              </div>
            )}
          </div>
        </NavBody>

        {/* Mobile Navigation */}
        <MobileNav className="flex md:hidden">
          <MobileNavHeader>
            <Link
              href={isSignedIn ? "/chatbots/manage" : "/"}
              className="flex items-center gap-2"
            >
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
          >
            {navItems.map((item, idx) => (
              <Link
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="relative text-neutral-600 dark:text-neutral-300 py-2"
              >
                <span className="block">{item.name}</span>
              </Link>
            ))}

            <button
              aria-label="Toggle dark mode"
              onClick={() => {
                toggleTheme();
                setIsMobileMenuOpen(false);
              }}
              className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 mb-4 w-full text-left"
            >
              {theme === "dark" ? (
                <span className="flex items-center gap-2">
                  <FiSun size={20} /> Light Mode
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <FiMoon size={20} /> Dark Mode
                </span>
              )}
            </button>

            {!isSignedIn ? (
              <SignInButton>
                <NavbarButton variant="primary" className="w-full">
                  Login
                </NavbarButton>
              </SignInButton>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-center">
                  <UserButton afterSignOutUrl="/" />
                </div>
                <SignOutButton>
                  <NavbarButton variant="primary" className="w-full">
                    Logout
                  </NavbarButton>
                </SignOutButton>
              </div>
            )}
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
    </div>
  );
}
