"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Building2, Calendar, CheckCircle2 } from "lucide-react";

export default function ProjectPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAuth();
  
  const [project, setProject] = useState<any>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchProjectAndEnrollment = async () => {
      if (!id) return;
      
      const { data: projData } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();
        
      if (projData) setProject(projData);

      if (user?.id) {
        // Check applications table (team-based) — find any team the user belongs to that applied
        const { data: memberData } = await supabase
          .from("team_members")
          .select("team_id")
          .eq("user_id", user.id);

        if (memberData && memberData.length > 0) {
          const teamIds = memberData.map((m: any) => m.team_id);
          const { data: appData } = await supabase
            .from("applications")
            .select("status")
            .eq("project_id", id)
            .in("team_id", teamIds)
            .maybeSingle();

          if (appData) setStatus((appData as any).status);
        }
      }
      setLoading(false);
    };
    
    fetchProjectAndEnrollment();
  }, [id, user]);

  const handleAction = async (newStatus: "pending" | "shortlisted") => {
    if (!user) {
      alert("Please log in to participate.");
      return;
    }
    setActionLoading(true);
    
    try {
      // Find the user's team
      const { data: memberData } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (!memberData?.team_id) {
        alert("You must be part of a team to apply. Please create or join a team first.");
        setActionLoading(false);
        return;
      }

      // Upsert into applications table
      const { error } = await supabase
        .from("applications")
        .upsert(
          { team_id: memberData.team_id, project_id: id, status: newStatus },
          { onConflict: "project_id,team_id" }
        );

      if (error) throw error;
      setStatus(newStatus);
    } catch (err: any) {
      alert("Failed to apply: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };


  if (loading) return <div className="p-10 text-center">Loading project...</div>;
  if (!project) return <div className="p-10 text-center">Project not found.</div>;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header section */}
      <div className="bg-card border-b pt-24 pb-12">
        <div className="container px-6 flex flex-col items-center text-center max-w-4xl mx-auto">
          <Badge className="mb-4 bg-primary/10 text-primary uppercase tracking-widest text-xs hover:bg-primary/20">
            {project.status || "Open"}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-6 text-foreground leading-tight">
            {project.title}
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
            {project.about || project.description?.slice(0, 100) + '...'}
          </p>
          
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <span>Posted {new Date(project.created_at).toLocaleDateString()}</span>
            </div>
            {project.required_team_size && (
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                <span>Team Size: {project.required_team_size}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container px-6 pt-12 max-w-4xl mx-auto">
        <div className="grid md:grid-cols-3 gap-10">
          <div className="md:col-span-2 space-y-10">
            <section>
              <h2 className="text-2xl font-display font-bold mb-4 flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-primary" />
                Full Description
              </h2>
              <div className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {project.description}
              </div>
            </section>

            {project.requirements && (
              <section className="bg-slate-50 dark:bg-slate-900/50 p-6 md:p-8 rounded-2xl border">
                <h2 className="text-xl font-display font-bold mb-4">Technical Requirements</h2>
                <div className="whitespace-pre-wrap text-muted-foreground">
                  {project.requirements}
                </div>
              </section>
            )}

            {project.outcomes && (
              <section className="bg-slate-50 dark:bg-slate-900/50 p-6 md:p-8 rounded-2xl border">
                <h2 className="text-xl font-display font-bold mb-4">Expected Outcomes</h2>
                <div className="whitespace-pre-wrap text-muted-foreground">
                  {project.outcomes}
                </div>
              </section>
            )}
          </div>

          <div className="md:col-span-1">
            <div className="sticky top-24 bg-card p-6 rounded-2xl border shadow-card text-center">
              <h3 className="font-bold text-lg mb-2">Contribute to this Project</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Join the team and start buiding the required milestones.
              </p>
              
              {!user && (
                <Button className="w-full bg-primary" disabled>
                  Login to Accept
                </Button>
              )}
              
              {user && user.id !== project.company_id && (
                <div className="space-y-4">
                  {!status && (
                    <Button 
                      className="w-full h-12 text-md transition-all bg-primary hover:bg-primary/90 shadow-md" 
                      onClick={() => handleAction("pending")}
                      disabled={actionLoading}
                    >
                      {actionLoading ? "Applying..." : "Apply to Project"}
                    </Button>
                  )}
                  {status === "pending" && (
                    <div className="flex items-center justify-center p-4 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 font-medium">
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Application Submitted — Awaiting Review
                    </div>
                  )}
                  {status === "shortlisted" && (
                    <div className="flex items-center justify-center p-4 rounded-xl bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 font-medium">
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Your Team is Shortlisted!
                    </div>
                  )}
                  {status === "selected" && (
                    <div className="flex items-center justify-center p-4 rounded-xl bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 font-medium">
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Congratulations! Your Team is Selected.
                    </div>
                  )}
                  {status === "rejected" && (
                    <div className="flex items-center justify-center p-4 rounded-xl bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 font-medium">
                      Application not selected this time.
                    </div>
                  )}
                </div>
              )}
              
              {user && user.id === project.company_id && (
                <p className="text-xs text-muted-foreground mt-4">You are the author of this project.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
