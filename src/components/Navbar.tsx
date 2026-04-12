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
    ? (role ? (role === "Company" ? "/company/dashboard" : "/student/dashboard") : "/onboarding") 
    : "/login";

  const handleSignOut = async () => {
    await signOut();
    // router.push("/"); // Handled in AuthContext signOut now
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`fixed top-0 left-0 right-0 z-50  bg-white/10 backdrop-blur-lg rounded-xl border border-white/50 shadow-lg">
  Translucent Glass Container   `}
    >
      <div className="container mx-auto flex items-center justify-between h-16 px-4 ">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <span className="text-primary-foreground font-display font-bold text-sm">P</span>
          </div>
          <span className="font-display font-bold text-lg text-foreground">Paryuktam</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/projects" className="text-md text-muted-foreground hover:text-foreground transition-colors">
            Projects
          </Link>
          {user ? (
            <>
              <Link href={dashboardPath} className="text-md text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </Link>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut size={16} className="mr-1" /> Sign out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Log in
              </Link>
              <Button asChild size="sm">
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
          <Link href="/projects" className="text-sm text-muted-foreground" onClick={() => setOpen(false)}>Projects</Link>
          {user ? (
            <>
              <Link href={dashboardPath} className="text-sm text-muted-foreground" onClick={() => setOpen(false)}>Dashboard</Link>
              <Button variant="ghost" size="sm" onClick={() => { handleSignOut(); setOpen(false); }}>
                <LogOut size={16} className="mr-1" /> Sign out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-muted-foreground" onClick={() => setOpen(false)}>Log in</Link>
              <Button asChild size="sm">
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
