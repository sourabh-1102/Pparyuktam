"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

function JoinContent() {
  const searchParams = useSearchParams();
  // Handle casing issues gracefully
  const token = searchParams?.get("token") || searchParams?.get("Token");
  
  const router = useRouter();
  const { data: session } = useSession();

  const [loading, setLoading] = useState(false); // for button
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [leaderInfo, setLeaderInfo] = useState<{ name: string; avatar: string | null } | null>(null);
  const [equity, setEquity] = useState<string>("0");
  const [name, setName] = useState<string>("");
  const [skillRole, setSkillRole] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      console.log("Full URL:", window.location.href);
      console.log("Extracted token:", token);
      console.log("Current session:", !!session);
      console.log("Token present:", !!token);
    }
    // Basic guards
    if (!token) {
      setError("Invalid Link");
      setCheckingSession(false);
      return;
    }
    
    // Auth bypass based on requirement
    setCheckingSession(false);

  }, [token, router]);

  const handleAccept = async () => {
    if (!name.trim() || !skillRole.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const equityNum = Number(equity);
    if (isNaN(equityNum) || equityNum < 0 || equityNum > 100) {
      toast.error("Requested Equity must be between 0 and 100.");
      return;
    }

    setLoading(true);
    setError("");

    console.log("SENDING DATA:", { name, skillRole, equity });

    try {
      const res = await fetch("/api/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          name,
          role: "Member",
          skillRole,
          equity
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Server path error");
        }
        throw new Error(data.error || "Something went wrong");
      }

      if (data.success) {
         setSuccess(true);
         setLeaderInfo(data.leader);
         toast.success("Successfully joined the team!");
         
         // Automatically redirect to the dashboard after a pause
         setTimeout(() => {
            router.push("/dashboard");
         }, 3000);
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 text-center p-6">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <h2 className="text-xl font-bold text-slate-800">Invalid Link</h2>
        <p className="text-muted-foreground">We could not find a valid token in this URL. Please ask your team leader for a new link.</p>
        <Button onClick={() => router.push("/")} variant="outline" className="mt-4">Go Home</Button>
      </div>
    );
  }

  if (checkingSession) {
     return (
      <div className="flex flex-col items-center justify-center space-y-4 text-center p-8">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Validating Session...</h2>
        <p className="text-muted-foreground text-sm">Please wait while we confirm your access.</p>
      </div>
     );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 text-center p-6">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <h2 className="text-xl font-bold text-slate-800">Invitation Error</h2>
        <div className="w-full bg-destructive/10 text-destructive font-medium p-4 rounded-lg flex items-center justify-center text-center">
          {error}
        </div>
        <Button onClick={() => router.push("/student/dashboard")} variant="outline" className="mt-4">Back to Dashboard</Button>
      </div>
    );
  }

  if (success) {
    return (
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center justify-center space-y-4 text-center p-6">
        <CheckCircle2 className="w-16 h-16 text-green-500" />
        <h2 className="text-2xl font-bold text-slate-800">You're In!</h2>
        <p className="text-slate-600">
           You have successfully joined <strong className="text-slate-900">{leaderInfo?.name || "the"}'s</strong> team.
        </p>
        <div className="mt-6 pt-6 border-t w-full">
            <p className="text-sm font-medium text-primary mt-2">Redirecting to your dashboard automatically...</p>
        </div>
      </motion.div>
    );
  }

  // Pre-acceptance form state
  return (
    <div className="flex flex-col items-center justify-center space-y-6 text-center p-4 w-full">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Complete Your Profile to Join the Team</h2>
        <p className="text-muted-foreground text-sm">Please provide your details below to accept the invitation.</p>
      </div>
      
      <div className="w-full space-y-4 text-left border rounded-lg p-5 bg-slate-50">
        <div className="space-y-2">
          <Label htmlFor="name" className="font-semibold text-slate-700">Full Name</Label>
          <Input 
            id="name"
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full"
            placeholder="e.g. John Doe"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="skillRole" className="font-semibold text-slate-700">Your Skills</Label>
          <Input 
            id="skillRole"
            type="text" 
            value={skillRole}
            onChange={(e) => setSkillRole(e.target.value)}
            className="w-full"
            placeholder="e.g. Frontend, Backend, UI/UX"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="equity" className="font-semibold text-slate-700">Requested Equity %</Label>
          <Input 
            id="equity"
            type="number" 
            min="0"
            max="100"
            value={equity}
            onChange={(e) => setEquity(e.target.value)}
            className="w-full"
            placeholder="e.g. 5"
            disabled={loading}
          />
          <p className="text-xs text-slate-500">
            Enter an amount between 0 and 100.
          </p>
        </div>
      </div>

      <Button onClick={handleAccept} disabled={loading} className="w-full h-11 text-base shadow-sm">
        {loading ? "Accepting..." : "Accept Invitation"}
      </Button>
      <Button onClick={() => router.push("/")} variant="ghost" disabled={loading} className="w-full text-slate-500">
        Decline / Go Home
      </Button>
    </div>
  );
}

export default function JoinPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-md border border-slate-100 min-h-[350px] flex items-center justify-center">
        <Suspense fallback={
          <div className="text-center p-10 w-full flex flex-col items-center justify-center">
            <div className="animate-spin w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full mx-auto" />
            <p className="mt-6 font-medium text-slate-500">Loading secure gateway...</p>
          </div>
        }>
          <JoinContent />
        </Suspense>
      </div>
    </div>
  );
}
