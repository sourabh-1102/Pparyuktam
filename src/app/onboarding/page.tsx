"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, UserCircle2, ArrowRight, Loader2, GraduationCap } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export default function OnboardingPage() {
  const [selectedRole, setSelectedRole] = useState<"Individual" | "Company" | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, role } = useAuth();
  const { data: session } = useSession();

  // ── Company fields 
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");

  // ── Individual (Student) fields 
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [techstack, setTechstack] = useState("");   // comma-separated skills
  const [college, setCollege] = useState("");

  const ADMIN_EMAIL = "govindsingh100bn@gmail.com";
  const sessionEmail = (session?.user as any)?.email;

  // Pre-fill full_name from Google session name
  useEffect(() => {
    if (session?.user?.name && !fullName) {
      setFullName(session.user.name);
    }
  }, [session]);

  // Render guard: if admin somehow ends up here, return null while AuthContext redirects them.
  if (role === "Admin" || sessionEmail === ADMIN_EMAIL) return null;

  const handleSubmit = async () => {
    if (!selectedRole) {
      toast.error("Please select a role first");
      return;
    }

    if (selectedRole === "Company" && (!companyName || !industry)) {
      toast.error("Company Name and Industry are required");
      return;
    }

    if (selectedRole === "Individual" && !fullName.trim()) {
      toast.error("Full name is required");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/profile/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedRole,
          // Individual fields
          fullName:    selectedRole === "Individual" ? fullName.trim()    : null,
          phoneNumber: selectedRole === "Individual" ? phoneNumber.trim() : null,
          techstack:   selectedRole === "Individual" ? techstack.trim()   : null,
          college:     selectedRole === "Individual" ? college.trim()     : null,
          // Company fields
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
        window.location.href = "/student/dashboard";
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

          {/* Role selection */}
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
            {/* ── Individual student form ── */}
            {selectedRole === "Individual" && (
              <motion.div
                key="individual-form"
                initial={{ opacity: 0, height: 0, y: -20 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -20 }}
                className="bg-card rounded-2xl border shadow-card p-6 md:p-8 space-y-5 mb-8 overflow-hidden"
              >
                <div className="flex items-center gap-2 mb-1">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-slate-800 dark:text-white">Student Details</span>
                </div>

                <div className="space-y-4">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name <span className="text-destructive">*</span></Label>
                    <Input
                      id="fullName"
                      placeholder="e.g. Arjun Verma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="bg-background"
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="e.g. +91 9876543210"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="bg-background"
                    />
                  </div>

                  {/* Tech Stack / Skills */}
                  <div className="space-y-2">
                    <Label htmlFor="techstack">
                      Skills / Tech Stack <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="techstack"
                      placeholder="e.g. React, Node.js, Python, Machine Learning, UI/UX Design"
                      value={techstack}
                      onChange={(e) => setTechstack(e.target.value)}
                      className="bg-background resize-none"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">Separate skills with commas.</p>
                  </div>

                  {/* College */}
                  <div className="space-y-2">
                    <Label htmlFor="college">College / University (optional)</Label>
                    <Input
                      id="college"
                      placeholder="e.g. IIT Bombay"
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Company form ── */}
            {selectedRole === "Company" && (
              <motion.div
                key="company-form"
                initial={{ opacity: 0, height: 0, y: -20 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -20 }}
                className="bg-card rounded-2xl border shadow-card p-6 md:p-8 space-y-5 mb-8 overflow-hidden"
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name <span className="text-destructive">*</span></Label>
                    <Input
                      id="companyName"
                      placeholder="e.g. Acme Corp"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry / Field <span className="text-destructive">*</span></Label>
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
                      Continue as {selectedRole === "Individual" ? "Student" : "Company"}
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
