"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isLanding = pathname === "/";
  const { user, role, signOut } = useAuth();

  const dashboardPath = user
    ? (role === "Admin"
        ? "/admin"
        : role === "Company"
          ? "/company/dashboard"
          : role === "Individual"
            ? "/student/dashboard"
            : "/onboarding")
    : "/login";

  const handleSignOut = async () => {
    await signOut();
  
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-lg rounded-xl border border-white/50 shadow-lg text-black"
    >
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
            <span className="text-primary-foreground font-display font-bold text-xl">P</span>
          </div>
          <span className="font-display font-bold text-2xl text-2xl text-blue-200 ">Paryuktam</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex  items-center gap-6">
          <Link href="/projects" className="font-semibold text-2xl text-blue-400 hover:text-black transition-colors">
            Projects
          </Link>
          {user ? (
            <>
              <Link href={dashboardPath} className="font-semibold text-2xl text-blue-400 hover:text-black transition-colors">
                Dashboard
              </Link>
              <Button variant="ghost" size="lg" className="text-2xl text-blue-400 hover:text-black" onClick={handleSignOut}>
                <LogOut size={20} className="mr-2" /> Sign out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className="font-semibold text-lg text-black hover:text-gray-700 transition-colors">
                Log in
              </Link>
              <Button asChild size="lg" className="font-semibold text-lg">
                <Link href="/register">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden glass border-t p-4 flex flex-col gap-3"
        >
          <Link href="/projects" className="font-semibold text-lg text-black" onClick={() => setOpen(false)}>Projects</Link>
          {user ? (
            <>
              <Link href={dashboardPath} className="font-semibold text-lg text-black" onClick={() => setOpen(false)}>Dashboard</Link>
              <Button variant="ghost" size="lg" className="w-full justify-start text-black font-semibold text-lg" onClick={() => { handleSignOut(); setOpen(false); }}>
                <LogOut size={20} className="mr-2" /> Sign out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className="font-semibold text-lg text-black" onClick={() => setOpen(false)}>Log in</Link>
              <Button asChild size="lg" className="w-full font-semibold text-lg">
                <Link href="/register" onClick={() => setOpen(false)}>Get Started</Link>
              </Button>
            </>
          )}
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;
