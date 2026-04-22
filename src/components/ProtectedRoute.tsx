"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

interface Props {
  children: React.ReactNode;
  allowedRoles?: ("Individual" | "Company" | "Admin")[];
}

const ADMIN_EMAIL = "govindsingh100bn@gmail.com";

const ProtectedRoute = ({ children, allowedRoles }: Props) => {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (!loading && user) {
      if (allowedRoles && role && !allowedRoles.includes(role)) {
        toast.error("Not Authorized");
        router.push("/");
      }
    }
  }, [user, role, loading, allowedRoles, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Admin users: render children only if on an /admin route; otherwise redirect handles it
  const isAdmin = role === "Admin" || user.email === ADMIN_EMAIL;
  if (isAdmin) {
    if (!pathname.startsWith("/admin")) return null;
    return <>{children}</>;
  }

  if (user.email !== "jatsourabhsinghgovindsingh@gmail.com") {
    if (!role && pathname !== "/onboarding") return null;
    if (allowedRoles && role && !allowedRoles.includes(role)) {
      return null;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
