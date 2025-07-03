"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import DefaultAvatar from "@components/DefaultAvatar";
import { Sheet, SheetTrigger } from "@components/ui";
import { Button } from "@components/ui/button";
import { useSocialProfile } from "@hooks/useSocialProfile";
// import ModeToggle from "@components/ModeToggle";

export default function Navbar() {
  const { data: session, status } = useSession();
  const { profile } = useSocialProfile();
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  // const router = useRouter();

  // Consistent avatar logic
  const getAvatarUrl = () => {
    return session?.user?.avatarUrl || profile?.profilePhoto || "/default_profile.png";
  };

  // Close dropdowns when route changes
  useEffect(() => {
    setDesktopMenuOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  // Auto-close dropdowns after 5 seconds
  useEffect(() => {
    if (desktopMenuOpen) {
      const timer = setTimeout(() => setDesktopMenuOpen(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [desktopMenuOpen]);

  useEffect(() => {
    if (mobileMenuOpen) {
      const timer = setTimeout(() => setMobileMenuOpen(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [mobileMenuOpen]);

  const navLinks = [
    { href: "/home", label: "Home" },
    { href: "/social", label: "Social" },
    { href: "/analytics", label: "Analytics" },
    { href: "/chat", label: "AI Assistant" }
  ];

  return (
    <nav className="bg-background border-b border-transparent backdrop-blur-sm relative z-20">
      <div className="w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between py-6">
        {/* Logo and links */}
        <div className="flex items-center md:justify-start justify-center flex-1 md:flex-none">
          <Link href="/" className="text-xl font-bold md:mr-2">
            <div className="relative w-auto md:px-8 px-4">
              {/* Light-mode logo */}
              <Image
                src="/maratron-name-dark.svg"
                alt="Maratron Logo"
                width={180}
                height={80}
                className="block dark:hidden md:w-[140px] md:h-[60px] w-[180px] h-[80px]"
              />
              {/* Dark-mode logo */}
              <Image
                src="/maratron-name-light.svg"
                alt="Maratron Logo"
                width={180}
                height={80}
                className="hidden dark:block md:w-[140px] md:h-[60px] w-[180px] h-[80px]"
              />
            </div>
          </Link>
          <div className="hidden md:flex space-x-4">
            {status !== "loading" && session?.user ? (
              navLinks.map((link) => (
                <Button
                  key={link.href}
                  asChild
                  className="block w-auto text-foreground bg-transparent no-underline transition-colors hover:text-brand-to hover:no-underline hover:bg-transparent focus:ring-0 text-base"
                >
                  <Link href={link.href}>{link.label}</Link>
                </Button>
              ))
            ) : (
              <>
                <Button
                  asChild
                  className="block w-auto text-foreground bg-transparent no-underline transition-colors hover:text-brand-to hover:no-underline hover:bg-transparent focus:ring-0 text-base"
                >
                  <Link href="/about">About</Link>
                </Button>
                <Button
                  asChild
                  className="block w-auto text-foreground bg-transparent no-underline transition-colors hover:text-brand-to hover:no-underline hover:bg-transparent focus:ring-0 text-base"
                >
                  <Link href="/contact">Contact</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Right: utilities and session (desktop) */}
        <div className="hidden md:flex items-center space-x-4 ml-auto">
          {status === "loading" ? null : session?.user ? (
            <>
              {/* User Avatar + Dropdown */}
              <div className="relative">
                <Button
                  onClick={() => setDesktopMenuOpen((o) => !o)}
                  aria-label="Toggle user menu"
                  aria-expanded={desktopMenuOpen}
                  className="focus:outline-none bg-transparent p-0 hover:bg-transparent focus:ring-0 block w-auto text-foreground no-underline transition-colors hover:text-background hover:no-underline"
                >
                  {getAvatarUrl() !== "/default_profile.png" ? (
                    <Image
                      src={getAvatarUrl()}
                      alt={session.user?.name || "User Avatar"}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover border border-brand-to bg-brand-from"
                      priority
                    />
                  ) : (
                    <DefaultAvatar
                      size={32}
                      className="border border-brand-to bg-brand-from "
                    />
                  )}
                </Button>
                {desktopMenuOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-background border border-accent rounded shadow-md z-50 flex flex-col items-center">
                    <Button
                      asChild
                      className="block w-full text-center py-2 bg-transparent justify-center text-foreground no-underline transition-colors hover:text-background hover:no-underline hover:bg-brand-from rounded-none focus:ring-0 text-base"
                    >
                      <Link href="/profile">Profile</Link>
                    </Button>
                    <Button
                      asChild
                      className="block w-full text-center py-2 bg-transparent justify-center text-foreground no-underline transition-colors hover:text-background hover:no-underline hover:bg-brand-from rounded-none focus:ring-0 text-base"
                    >
                      <Link href="/settings">Settings</Link>
                    </Button>
                    <Button
                      onClick={() => signOut()}
                      className="block w-full text-center py-2 bg-transparent justify-center text-foreground no-underline transition-colors hover:text-background hover:no-underline hover:bg-brand-from rounded-none focus:ring-0 text-base"
                    >
                      Logout
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Button
              onClick={() => signIn()}
              className="block w-auto text-foreground bg-transparent no-underline transition-colors hover:text-background hover:no-underline hover:bg-brand-from focus:ring-0"
            >
              Sign In
            </Button>
          )}
          {/* <ModeToggle /> */}
        </div>

        {/* Mobile Avatar Menu */}
        <div className="md:hidden flex items-center justify-end absolute right-4">
          {status !== "loading" && session?.user ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  aria-label="Toggle mobile menu"
                  className="focus:outline-none bg-transparent p-2 hover:bg-transparent focus:ring-0 block w-auto"
                >
                  {getAvatarUrl() !== "/default_profile.png" ? (
                    <Image
                      src={getAvatarUrl()}
                      alt={session.user?.name || "User Avatar"}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover border border-brand-to bg-brand-from"
                      priority
                    />
                  ) : (
                    <DefaultAvatar
                      size={32}
                      className="border border-brand-to bg-brand-from"
                    />
                  )}
                </Button>
              </SheetTrigger>
              <div className="fixed inset-y-0 left-0 z-50 w-1/2 bg-background p-6 space-y-4 shadow-lg border-r border-border">{/* SheetContent replacement */}
                {navLinks.map((link) => (
                  <Button
                    asChild
                    key={link.href}
                    className="block w-auto text-foreground bg-transparent no-underline transition-colors hover:text-background hover:no-underline hover:bg-brand-from focus:ring-0"
                  >
                    <Link href={link.href}>{link.label}</Link>
                  </Button>
                ))}
                <hr />
                <Button
                  asChild
                  className="block w-auto text-foreground bg-transparent no-underline transition-colors hover:text-background hover:no-underline hover:bg-brand-from focus:ring-0"
                >
                  <Link href="/profile">Profile</Link>
                </Button>
                <Button
                  asChild
                  className="block w-auto text-foreground bg-transparent no-underline transition-colors hover:text-background hover:no-underline hover:bg-brand-from focus:ring-0"
                >
                  <Link href="/settings">Settings</Link>
                </Button>
                <Button
                  onClick={() => signOut()}
                  className="block w-auto text-foreground bg-transparent no-underline transition-colors hover:text-background hover:no-underline hover:bg-brand-from focus:ring-0"
                >
                  Logout
                </Button>
                {/* <ModeToggle /> */}
              </div>{/* End SheetContent replacement */}
            </Sheet>
          ) : (
            /* For non-logged in users, show hamburger menu */
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  aria-label="Toggle mobile menu"
                  className="p-2 focus:outline-none bg-transparent hover:bg-transparent focus:ring-0 hover:text-primary transition-colors block w-auto text-foreground bg-transparent no-underline hover:text-background hover:no-underline hover:bg-brand-from"
                >
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <div className="fixed inset-y-0 left-0 z-50 w-1/2 bg-background p-6 space-y-4 shadow-lg border-r border-border">{/* SheetContent replacement */}
                <Button
                  asChild
                  className="block w-auto text-foreground bg-transparent no-underline transition-colors hover:text-background hover:no-underline hover:bg-brand-from focus:ring-0"
                >
                  <Link href="/about">About</Link>
                </Button>
                <hr />
                <Button
                  onClick={() => signIn()}
                  className="block w-auto text-foreground bg-transparent no-underline transition-colors hover:text-background hover:no-underline hover:bg-brand-from focus:ring-0"
                >
                  Sign In
                </Button>
                {/* <ModeToggle /> */}
              </div>{/* End SheetContent replacement */}
            </Sheet>
          )}
        </div>
      </div>
    </nav>
  );
}
