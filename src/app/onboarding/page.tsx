"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, UserCircle2, ArrowRight, Loader2 } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useSession } from "next-auth/react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function OnboardingPage() {
  const [selectedRole, setSelectedRole] = useState<"Individual" | "Company" | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const { data: session } = useSession();

  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");

  const handleSubmit = async () => {
    if (!selectedRole) {
      toast.error("Please select a role first");
      return;
    }

    if (selectedRole === "Company" && (!companyName || !industry)) {
      toast.error("Company Name and Industry are required");
      return;
    }

    setLoading(true);

    try {
      // session.user.id is the real Supabase UUID (resolved in the NextAuth jwt callback).
      // The DB trigger already created the profile row — we upsert to update the role.
      // Roles must be EXACTLY 'Individual' or 'Company' (case-sensitive DB enum).
      const supabaseId = (session?.user as any)?.id;

      // Route everything securely through the API to respect RLS and NextAuth UUID constraints natively
      const response = await fetch("/api/profile/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedRole,
          companyName: selectedRole === "Company" ? companyName : null,
          industry:    selectedRole === "Company" ? industry    : null,
          website:     selectedRole === "Company" ? website     : null,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to save profile");


      toast.success("Profile saved! Redirecting...");

      if (selectedRole === "Company") {
        window.location.href = "/company/dashboard";
      } else {
        window.location.href = "/";
      }
    } catch (err: any) {
      toast.error("Error saving profile: " + err.message);
      setLoading(false);
    }
  };


  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-900/[0.04] bg-[bottom_1px_center] [mask-image:linear-gradient(to_bottom,transparent,black)] -z-10" />
        
        <div className="w-full max-w-xl mx-auto z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary mx-auto flex items-center justify-center mb-6 shadow-xl">
              <span className="text-white font-display font-bold text-3xl">P</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-3 tracking-tight">Complete your profile</h1>
            <p className="text-muted-foreground text-lg">How are you planning to use Paryuktam?</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => setSelectedRole("Individual")}
              className={`p-6 rounded-2xl border-2 text-left transition-all flex flex-col items-center text-center ${
                selectedRole === "Individual" 
                  ? "border-primary bg-primary/5 ring-4 ring-primary/10 shadow-lg scale-[1.02]" 
                  : "border-border hover:border-primary/50 hover:bg-muted/30"
              }`}
            >
              <UserCircle2 className={`w-12 h-12 mb-4 ${selectedRole === "Individual" ? "text-primary" : "text-muted-foreground"}`} />
              <h3 className="font-bold text-lg mb-2">Individual / Student</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                I want to join projects, build my portfolio, and grow my skills.
              </p>
            </button>

            <button
              onClick={() => setSelectedRole("Company")}
              className={`p-6 rounded-2xl border-2 text-left transition-all flex flex-col items-center text-center ${
                selectedRole === "Company" 
                  ? "border-primary bg-primary/5 ring-4 ring-primary/10 shadow-lg scale-[1.02]" 
                  : "border-border hover:border-primary/50 hover:bg-muted/30"
              }`}
            >
              <Building2 className={`w-12 h-12 mb-4 ${selectedRole === "Company" ? "text-primary" : "text-muted-foreground"}`} />
              <h3 className="font-bold text-lg mb-2">Company / Organization</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                I am looking for talented contributors and want to post projects.
              </p>
            </button>
          </div>

          <AnimatePresence mode="popLayout">
            {selectedRole === "Company" && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -20 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -20 }}
                className="bg-card rounded-2xl border shadow-card p-6 md:p-8 space-y-5 mb-8 overflow-hidden"
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input 
                      id="companyName"
                      placeholder="e.g. Acme Corp" 
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry / Field *</Label>
                    <Input 
                      id="industry"
                      placeholder="e.g. Software, Finance, Healthcare" 
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Official Website</Label>
                    <Input 
                      id="website"
                      placeholder="https://acme.com" 
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                </div>
              </motion.div>
            )}
            
            {selectedRole === "Individual" && (
               <motion.div
                initial={{ opacity: 0, height: 0, y: -20 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -20 }}
                className="text-center p-6 bg-muted/30 rounded-2xl border border-dashed mb-8 text-sm text-muted-foreground"
               >
                 No further setup required. You'll be ready to browse projects immediately!
               </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {selectedRole && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center"
              >
                <Button 
                  size="lg" 
                  className="w-full md:w-auto min-w-[200px] h-14 text-base gap-2 bg-gradient-primary hover:opacity-90 shadow-lg font-medium"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Continue as {selectedRole}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </ProtectedRoute>
  );
}
