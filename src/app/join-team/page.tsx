"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Code, Briefcase, Percent } from "lucide-react";

const JoinTeamForm = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const teamId = searchParams?.get("teamId");
  const teamName = searchParams?.get("teamName");

  const [formData, setFormData] = useState({
    name: "",
    techStack: "",
    work: "",
    equity: [0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate saving join request/adding member
    const newMember = {
      id: `m${Date.now()}`,
      teamId,
      name: formData.name,
      role: "Developer", // Default role
      email: "new.member@example.com", // Placeholder
      initials: formData.name.substring(0, 2).toUpperCase(),
      equity: formData.equity[0],
      isLeader: false,
      techStack: formData.techStack,
      workDescription: formData.work,
      joinedAt: new Date().toISOString(),
    };

    // Store in localStorage to simulate persistence
    const existingJoins = JSON.parse(localStorage.getItem("pending_joins") || "[]");
    localStorage.setItem("pending_joins", JSON.stringify([...existingJoins, newMember]));

    // Redirect to dashboard
    router.push("/student/dashboard?joined=true");
  };

  if (!teamId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-destructive">Invalid Invitation</CardTitle>
            <CardDescription>No team specified in the invitation link.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-lg shadow-lg border-primary/10">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-display">Join {teamName || "Team"}</CardTitle>
          <CardDescription>Complete your profile to join the team.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <Input 
                    id="name" 
                    placeholder="e.g. Alex Johnson" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    className="pl-10"
                  />
                  <Users className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tech">Tech Stack</Label>
                <div className="relative">
                  <Input 
                    id="tech" 
                    placeholder="e.g. React, Node.js, Python" 
                    value={formData.techStack}
                    onChange={(e) => setFormData({...formData, techStack: e.target.value})}
                    required
                    className="pl-10"
                  />
                  <Code className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">Technologies you will bring to the project.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="work">Scope of Work</Label>
                <div className="relative">
                  <textarea 
                    id="work" 
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
                    placeholder="Describe your responsibilities..."
                    value={formData.work}
                    onChange={(e) => setFormData({...formData, work: e.target.value})}
                    required
                  />
                  <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center">
                  <Label>Desired Equity</Label>
                  <span className="font-bold text-primary">{formData.equity[0]}%</span>
                </div>
                <Slider 
                  value={formData.equity} 
                  max={100} 
                  step={1} 
                  onValueChange={(val) => setFormData({...formData, equity: val})}
                  className="py-2"
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Percent className="h-3 w-3" /> Percentage of project payment you expect.
                </p>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 text-base">
              Submit & Join Team
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default function JoinTeamPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JoinTeamForm />
    </Suspense>
  );
}
