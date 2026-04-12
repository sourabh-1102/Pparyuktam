"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

interface Props {
  children: React.ReactNode;
  allowedRoles?: ("Individual" | "Company" | "admin")[];
}

const ProtectedRoute = ({ children, allowedRoles }: Props) => {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (!loading && user) {
      if (user.email === "jatsourabhsinghgovindsingh@gmail.com") return;
      
      if (!role && pathname !== "/onboarding") {
        router.push("/onboarding");
        return;
      }
      
      if (allowedRoles && role && !allowedRoles.includes(role)) {
        toast.error("Not Authorized");
        router.push("/");
      }
    }
  }, [user, role, loading, allowedRoles, router, pathname]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
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
