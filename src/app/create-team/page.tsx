"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function CreateTeamPage() {
  const router = useRouter();
  const [teamName, setTeamName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/teams/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: teamName.trim(), description: description.trim() || null }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create team");

      toast.success(`Team "${teamName}" created successfully!`);
      router.push("/student/dashboard?tab=team");
    } catch (err: any) {
      toast.error("Failed to create team: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <CardTitle>Create New Team</CardTitle>
          <CardDescription>Start a new journey — your team will appear in your dashboard immediately.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateTeam} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="teamName">Team Name *</Label>
              <div className="relative">
                <Input
                  id="teamName"
                  placeholder="e.g. Alpha Squad"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  required
                  className="pl-10"
                />
                <Users className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <div className="relative">
                <Input
                  id="description"
                  placeholder="e.g. Building an e-commerce redesign"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="pl-10"
                />
                <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading || !teamName.trim()}>
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating Team...</>
              ) : (
                "Create Team"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
