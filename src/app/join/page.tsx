"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

function JoinContent() {
  const searchParams = useSearchParams();
  // Handle casing issues gracefully
  const token = searchParams?.get("token") || searchParams?.get("Token");
  
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [leaderInfo, setLeaderInfo] = useState<{ name: string; avatar: string | null } | null>(null);

  useEffect(() => {
    // Basic guards
    if (!token) {
      setError("Invalid or missing invitation link.");
      setLoading(false);
      return;
    }
    
    // Wait for next-auth to figure out the session
    if (status === "loading") {
      return; 
    }
    
    // Auth guard -> push to login and return to this exact url
    if (status === "unauthenticated") {
      router.push(`/api/auth/signin?callbackUrl=/join?token=${token}`);
      return;
    }

    if (!session?.user?.email) {
      setError("Missing active session or validated email address. Please relogin.");
      setLoading(false);
      return;
    }

    // Call acceptance endpoint
    const acceptInvite = async () => {
      try {
        const res = await fetch("/api/invites/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }), // API naturally expects lower-case token property
        });
        
        const data = await res.json();
        
        if (!res.ok) {
           throw new Error(data.error || "Failed to accept invite.");
        }

        if (data.success) {
           setSuccess(true);
           setLeaderInfo(data.leader);
           toast.success("Successfully joined the team!");
           
           // Automatically redirect to the dashboard after a pause
           setTimeout(() => {
              router.push("/student/dashboard");
           }, 3000);
        }

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    acceptInvite();

  }, [token, status, session, router]);

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 text-center p-6">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <h2 className="text-xl font-bold text-slate-800">Invalid Invitation Link</h2>
        <p className="text-muted-foreground">We could not find a valid token in this URL. Please ask your team leader for a new link.</p>
        <Button onClick={() => router.push("/")} variant="outline" className="mt-4">Go Home</Button>
      </div>
    );
  }

  if (loading) {
     return (
      <div className="flex flex-col items-center justify-center space-y-4 text-center p-8">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Validating Invitation...</h2>
        <p className="text-muted-foreground text-sm">Please wait while we confirm your access.</p>
      </div>
     );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 text-center p-6">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <h2 className="text-xl font-bold text-slate-800">Invitation Error</h2>
        <div className="w-full bg-destructive/10 text-destructive font-medium p-4 rounded-lg flex items-center justify-center">
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
           You have successfully joined <strong className="text-slate-900">{leaderInfo?.name}'s</strong> team.
        </p>
        <div className="mt-6 pt-6 border-t w-full">
            <p className="text-sm font-medium text-primary mt-2">Redirecting to your dashboard automatically...</p>
        </div>
      </motion.div>
    );
  }

  return null; 
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
