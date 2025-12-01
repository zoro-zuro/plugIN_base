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

import { useUser, SignInButton, SignOutButton, UserButton } from "@clerk/nextjs";

import { FiSun, FiMoon } from "react-icons/fi";
import { useTheme } from "../hooks/useTheme";
import { Button } from "./Buttons";


export function Header() {
  const navItems = [
    { name: "Features", link: "#features" },
    { name: "Pricing", link: "#pricing" },
    { name: "Contact", link: "#contact" },
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isSignedIn } = useUser();
  
  // Use the custom theme hook
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="relative w-full">
      <Navbar>
        {/* Desktop Navigation */}
        <NavBody className="flex justify-between items-center hidden md:flex">
          {/* Left: PlugIN logo/text */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">PlugIN</span>
          </div>

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

            {!isSignedIn && (
              <SignInButton>
                <NavbarButton variant="primary">Login</NavbarButton>
              </SignInButton>
            )}
            {isSignedIn && (
              <>
                <UserButton />
                <SignOutButton>
                  <NavbarButton variant="primary">Logout</NavbarButton>
                </SignOutButton>
              </>
            )}
          </div>
        </NavBody>

        {/* Mobile Navigation */}
        <MobileNav className="flex md:hidden">
          <MobileNavHeader>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg">PlugIN</span>
            </div>
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
              <a
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="relative text-neutral-600 dark:text-neutral-300"
              >
                <span className="block">{item.name}</span>
              </a>
            ))}

            <button
              aria-label="Toggle dark mode"
              onClick={() => {
                toggleTheme();
                setIsMobileMenuOpen(false);
              }}
              className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 mb-4 w-full"
            >
              {theme === "dark" ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>

            {!isSignedIn && (
              <SignInButton>
                <NavbarButton variant="primary" className="w-full">
                  Login
                </NavbarButton>
              </SignInButton>
            )}
            {isSignedIn && (
              <>
                <UserButton />
                <SignOutButton>
                  <NavbarButton variant="primary" className="w-full">
                    Logout
                  </NavbarButton>
                </SignOutButton>
              </>
            )}
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
    </div>
  );
}
