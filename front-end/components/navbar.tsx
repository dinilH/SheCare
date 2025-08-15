"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";

const navigation = [
  { name: "Home", href: "/" },
  { name: "Wellness", href: "/wellness" },
  { name: "My Period", href: "/my-period" },
  { name: "News", href: "/news" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-b border-gray-200/20 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <img
              src="/favicon.png"
              alt="She Care Logo"
              className="w-8 h-8 rounded-full shadow"
            />
            <span className="text-xl font-bold bg-gradient-to-r from-[#FF407D] to-[#FFCAD4] bg-clip-text text-transparent">
              She Care
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-sm font-medium transition-all duration-200 hover:text-[#FF407D] ${
                  pathname === item.href
                    ? "text-[#FF407D] font-bold border-b-2 border-[#FF407D] pb-1"
                    : "text-[#1B3C73]"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-[#40679E]" />
                  <span className="text-sm font-medium text-[#40679E]">{user.name}</span>
                </div>
                <Button
                  onClick={logout}
                  variant="outline"
                  size="sm"
                  className="border-[#FF407D] text-[#FF407D] hover:bg-[#FF407D] hover:text-white"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#40679E] text-[#40679E] hover:bg-[#40679E] hover:text-white"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-[#FF407D] to-[#FFCAD4] hover:from-[#FFCAD4] hover:to-[#FF407D] text-white"
                  >
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white/95 backdrop-blur-lg border-t border-gray-200/20"
          >
            <div className="px-4 py-4 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`block px-3 py-2 text-base font-medium rounded-lg transition-all duration-200 ${
                    pathname === item.href
                      ? "text-[#FF407D] font-bold bg-[#FFCAD4]/20 border-l-4 border-[#FF407D]"
                      : "text-[#1B3C73] hover:text-[#FF407D] hover:bg-gray-50"
                  }`}
                >
                  {item.name}
                </Link>
              ))}

              {/* Mobile Auth Buttons */}
              <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200">
                {user ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 px-3 py-2">
                      <User className="h-5 w-5 text-[#40679E]" />
                      <span className="text-sm font-medium text-[#40679E]">{user.name}</span>
                    </div>
                    <Button
                      onClick={() => {
                        logout();
                        setIsOpen(false);
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full border-[#FF407D] text-[#FF407D] hover:bg-[#FF407D] hover:text-white"
                    >
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link href="/login" onClick={() => setIsOpen(false)}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-[#40679E] text-[#40679E] hover:bg-[#40679E] hover:text-white"
                      >
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/signup" onClick={() => setIsOpen(false)}>
                      <Button
                        size="sm"
                        className="w-full bg-gradient-to-r from-[#FF407D] to-[#FFCAD4] hover:from-[#FFCAD4] hover:to-[#FF407D] text-white"
                      >
                        Sign Up
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
