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
import { Logo } from "./Logo";

export function Header() {
  const { isSignedIn } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  // Removed unused scroll listener here as it was redundant with Navbar component

  const shouldHideHeader =
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/chatbots/bot_") ||
    pathname?.startsWith("/embed/");

  const publicNavItems = [
    { name: "Features", link: "/#features" },
    { name: "How it Works", link: "/#how-it-works" },
  ];

  const authenticatedNavItems = [
    { name: "My Chatbots", link: "/chatbot/manage" },
    { name: "Create Chatbot", link: "/chatbot/create" },
  ];

  const navItems = isSignedIn ? authenticatedNavItems : publicNavItems;
  
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("/#")) {
      e.preventDefault();
      const id = href.replace("/#", "");
      
      // Update URL without full page reload
      window.history.pushState({}, "", href);
      
      // Immediate scroll check
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      } else {
        // If we're not on the home page, redirect
        router.push(href);
      }
      
      if (isMobileMenuOpen) setIsMobileMenuOpen(false);
    }
  };

  if (shouldHideHeader) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <Navbar>
        <NavBody>
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-3 group outline-none translate-x-3"
          >
            <Logo className="h-10 w-10 transition-transform duration-500 group-hover:scale-110 drop-shadow-sm" />
            <span style={{ fontFamily: 'Georgia, serif' }} className="font-black text-2xl tracking-tight text-[#1A1714]">
              PluginBase
            </span>
          </button>

          <div className="flex-1 flex justify-center">
            {/* NavItems custom styling */}
            <div className="hidden md:flex items-center gap-10">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.link}
                  onClick={(e) => handleNavClick(e, item.link)}
                  className="text-xs font-bold uppercase tracking-[0.2em] text-[#8C7B68] hover:text-[#EAB564] transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6">

            {!isSignedIn ? (
              <SignInButton mode="modal">
                <button className="px-6 py-2.5 rounded-xl bg-[#1A1714] text-[#EAB564] text-sm font-black hover:bg-[#2E2820] transition-all shadow-xl shadow-[#1A1714]/10 active:scale-95">
                  Access Platform
                </button>
              </SignInButton>
            ) : (
              <div className="scale-110">
                <UserButton afterSignOutUrl="/" />
              </div>
            )}
          </div>
        </NavBody>

        <MobileNav className="md:hidden">
          <MobileNavHeader>
            <Link href="/" className="flex items-center gap-2">
              <Logo className="h-6 w-6" />
              <span style={{ fontFamily: 'Georgia, serif' }} className="font-black text-lg text-[#1A1714]">PluginBase</span>
            </Link>

            <div className="flex items-center gap-2">

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
                onClick={(e) => handleNavClick(e, item.link)}
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
