import Image from "next/image";
import Link from "next/link";
import { Instagram, Twitter, Facebook, Mail, Send } from "lucide-react";
import { ClientOnly } from "@components/ui/ClientOnly";
import { Button } from "@components/ui/button";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 relative z-10">
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-32 pb-12">
        {/* Logo and Social Icons */}
        <div className="flex flex-col items-center mb-16">
          <div className="mb-6">
            <Image
              src="/maratron-name-gradient-to-orange.svg"
              alt="Maratron wordmark"
              width={180}
              height={40}
            />
          </div>
          <div className="flex space-x-4">
            <Button 
              variant="ghost" 
              size="icon"
              asChild
              className="h-10 w-10 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              asChild
              className="h-10 w-10 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <a
                href="https://www.facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              asChild
              className="h-10 w-10 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <a
                href="https://www.instagram.com/maratron.ai/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>

        {/* Navigation and Actions */}
        <div className="grid gap-12 md:grid-cols-3 mb-16">
          <div className="space-y-4">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Navigate</h3>
            <nav className="space-y-3">
              <Link href="/" className="block text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                Home
              </Link>
              <Link href="/about" className="block text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                About
              </Link>
              <Link href="/plans" className="block text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                Plans
              </Link>
              <Link href="/social" className="block text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                Social
              </Link>
            </nav>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Account</h3>
            <nav className="space-y-3">
              <Link href="/login" className="block text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                Login
              </Link>
              <Link href="/signup" className="block text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                Sign Up
              </Link>
              <Link href="/home" className="block text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                Dashboard
              </Link>
              <Link href="/privacy" className="block text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                Privacy Policy
              </Link>
            </nav>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Newsletter</h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                Get tips, technical guides, and best practices for running.
              </p>
              <Button
                asChild
                variant="outline"
                className="w-fit border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <Link href="/newsletter">
                  <Send className="h-4 w-4 mr-2" />
                  Subscribe
                </Link>
              </Button>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Support</h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                Get in touch with our team for support and questions.
              </p>
              <Button
                asChild
                variant="outline"
                className="w-fit border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <Link href="/contact">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Us
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center">
          <p className="text-zinc-600 dark:text-zinc-400">
            &copy;{" "}
            <ClientOnly fallback="2025">
              {currentYear}
            </ClientOnly>{" "}
            Maratron. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
