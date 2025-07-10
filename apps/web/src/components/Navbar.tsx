"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import DefaultAvatar from "@components/DefaultAvatar";
import { Sheet, SheetTrigger } from "@components/ui";
import { Button } from "@components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuPortal
} from "@components/ui/dropdown-menu";
import { useSocialProfile } from "@hooks/useSocialProfile";
import ModeToggle from "@components/ModeToggle";
import { isDemoMode } from "@lib/utils/demo-mode";

export default function Navbar() {
  const { data: session, status } = useSession();
  
  // Demo mode for testing/screenshots
  const demoMode = isDemoMode();
  const { profile } = useSocialProfile();
  const pathname = usePathname();
  // const router = useRouter();

  // Consistent avatar logic
  const getAvatarUrl = () => {
    if (demoMode) return "/default_profile.png";
    return session?.user?.avatarUrl || profile?.profilePhoto || "/default_profile.png";
  };

  const navLinks = [
    { href: "/home", label: "Home" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/social", label: "Social" },
    { href: "/analytics", label: "Analytics" },
    { href: "/chat", label: "AI Assistant" }
  ];

  return (
    <nav className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 backdrop-blur-sm relative z-20">
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
            {status !== "loading" && (session?.user || demoMode) ? (
              navLinks.map((link) => (
                <Button
                  key={link.href}
                  asChild
                  variant="ghost"
                  size="lg"
                  className="text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-base px-4 py-2"
                >
                  <Link href={link.href}>{link.label}</Link>
                </Button>
              ))
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  size="lg"
                  className="text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-base px-4 py-2"
                >
                  <Link href="/about">About</Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="lg"
                  className="text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-base px-4 py-2"
                >
                  <Link href="/contact">Contact</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Right: utilities and session (desktop) */}
        <div className="hidden md:flex items-center space-x-4 ml-auto">
          {status === "loading" ? null : (session?.user || demoMode) ? (
            <>
              {/* User Avatar + Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full p-0"
                  >
                    {getAvatarUrl() !== "/default_profile.png" ? (
                      <Image
                        src={getAvatarUrl()}
                        alt={session.user?.name || "User Avatar"}
                        width={36}
                        height={36}
                        className="w-9 h-9 rounded-full object-cover border-2 border-zinc-200 dark:border-zinc-700"
                        priority
                      />
                    ) : (
                      <DefaultAvatar
                        size={36}
                      />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuContent className="w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg z-50" align="end" sideOffset={5}>
                    <DropdownMenuItem asChild className="text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                      <Link href="/profile" className="w-full no-underline hover:no-underline">
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                      <Link href="/settings" className="w-full no-underline hover:no-underline">
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-zinc-200 dark:bg-zinc-800" />
                    <DropdownMenuItem
                      onClick={() => signOut()}
                      className="w-full text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenuPortal>
              </DropdownMenu>
            </>
          ) : (
            <Button
              onClick={() => signIn()}
              variant="ghost"
              size="lg"
              className="text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-base px-4 py-2"
            >
              Sign In
            </Button>
          )}
          <ModeToggle />
        </div>

        {/* Mobile Avatar Menu */}
        <div className="md:hidden flex items-center justify-end absolute right-4">
          {status !== "loading" && (session?.user || demoMode) ? (
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
                      className="w-8 h-8 rounded-full object-cover border-2 border-background bg-foreground"
                      priority
                    />
                  ) : (
                    <DefaultAvatar
                      size={32}
                    />
                  )}
                </Button>
              </SheetTrigger>
              <div className="fixed inset-y-0 left-0 z-50 w-1/2 bg-background p-6 space-y-4 shadow-lg border-r border-border">{/* SheetContent replacement */}
                {navLinks.map((link) => (
                  <Button
                    asChild
                    key={link.href}
                    className="block w-auto text-foreground bg-transparent no-underline transition-colors hover:text-background hover:no-underline hover:bg-brand-purple focus:ring-0"
                  >
                    <Link href={link.href}>{link.label}</Link>
                  </Button>
                ))}
                <hr />
                <Button
                  asChild
                  className="block w-auto text-foreground bg-transparent no-underline transition-colors hover:text-background hover:no-underline hover:bg-brand-purple focus:ring-0"
                >
                  <Link href="/profile">Profile</Link>
                </Button>
                <Button
                  asChild
                  className="block w-auto text-foreground bg-transparent no-underline transition-colors hover:text-background hover:no-underline hover:bg-brand-purple focus:ring-0"
                >
                  <Link href="/settings">Settings</Link>
                </Button>
                <Button
                  onClick={() => signOut()}
                  className="block w-auto text-foreground bg-transparent no-underline transition-colors hover:text-background hover:no-underline hover:bg-brand-purple focus:ring-0"
                >
                  Logout
                </Button>
                <ModeToggle />
              </div>{/* End SheetContent replacement */}
            </Sheet>
          ) : (
            /* For non-logged in users, show hamburger menu */
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  aria-label="Toggle mobile menu"
                  className="p-2 focus:outline-none bg-transparent hover:bg-transparent focus:ring-0 hover:text-primary transition-colors block w-auto text-foreground bg-transparent no-underline hover:text-background hover:no-underline hover:bg-brand-purple"
                >
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <div className="fixed inset-y-0 left-0 z-50 w-1/2 bg-background p-6 space-y-4 shadow-lg border-r border-border">{/* SheetContent replacement */}
                <Button
                  asChild
                  className="block w-auto text-foreground bg-transparent no-underline transition-colors hover:text-background hover:no-underline hover:bg-brand-purple focus:ring-0"
                >
                  <Link href="/about">About</Link>
                </Button>
                <hr />
                <Button
                  onClick={() => signIn()}
                  className="block w-auto text-foreground bg-transparent no-underline transition-colors hover:text-background hover:no-underline hover:bg-brand-purple focus:ring-0"
                >
                  Sign In
                </Button>
                <ModeToggle />
              </div>{/* End SheetContent replacement */}
            </Sheet>
          )}
        </div>
      </div>
    </nav>
  );
}
