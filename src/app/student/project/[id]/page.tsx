"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Upload, Globe, Folder, Download, ExternalLink,
  Briefcase, Award, CheckCircle, Clock, FileText, AlertCircle, MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useToast } from "@/hooks/use-toast";
import ReportModal from "@/components/ReportModal";

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const projectId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  // Data state
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any>(null);
  const [application, setApplication] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);

// Submission modal state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submitUrl, setSubmitUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Report modal state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    const fetchProjectData = async () => {
      setLoading(true);
      try {
        // Fetch project details
        const projRes = await fetch(`/api/projects/browse`);
        const projJson = await projRes.json();
        const allProjects = projJson.data || [];
        const foundProject = allProjects.find((p: any) => p.id === projectId);
        setProject(foundProject || null);

        // Fetch applications to get status
        const appsRes = await fetch("/api/applications/my");
        const appsJson = await appsRes.json();
        const apps = appsJson.data || [];
        const myApp = apps.find((a: any) => a.projectId === projectId);
        setApplication(myApp || null);

        // Fetch submission if exists (use student-accessible endpoint)
        const subRes = await fetch(`/api/submissions/my?project_id=${projectId}`);
        if (subRes.ok) {
          const subJson = await subRes.json();
          if (subJson.data) setSubmission(subJson.data);
        }
      } catch (err) {
        console.error("Failed to fetch project data:", err);
      }
      setLoading(false);
    };

    fetchProjectData();
  }, [projectId]);

  const status = application?.status?.toLowerCase() || "unknown";

  const handleSubmit = async () => {
    if (!submitUrl) {
      toast({ title: "Error", description: "Please provide a GitHub URL.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("project_id", projectId!);
      formData.append("team_id", application?.teamId || "");
      formData.append("submission_type", "github_transfer");
      formData.append("github_repo_url", submitUrl);

      const res = await fetch("/api/submissions/create", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed.");

      toast({ title: "Success", description: "Project submitted successfully!" });
      setIsSubmitModalOpen(false);

      // Refresh submission data
      setSubmission({
        submission_type: "github_transfer",
        github_repo_url: submitUrl,
        download_url: null,
      });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["Individual"]}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["Individual"]}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push("/student/dashboard?tab=projects")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold font-display">{project?.title || "Project"}</h1>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Briefcase className="h-3 w-3" /> {project?.company_name || "Company"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="text-red-500 border-red-200 bg-red-50 hover:bg-red-100 hover:text-red-600 font-medium" onClick={() => setIsReportModalOpen(true)}>
                  <AlertCircle className="w-4 h-4 mr-1" /> Report Project
              </Button>
              <Badge 
                variant={status === "accepted" ? "default" : "secondary"}
                className={
                status === "accepted" ? "bg-green-600 text-white" :
                status === "shortlisted" ? "bg-blue-600 text-white" : ""
              }
            >
              {status === "accepted" ? "Accepted" : 
               status === "shortlisted" ? "Shortlisted" : 
               status === "pending" ? "Under Review" : 
               application?.status || "Applied"}
            </Badge>
          </div>
        </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Project Info */}
          <section className="bg-card rounded-xl border p-6 shadow-sm mb-6">
            <h2 className="font-semibold text-lg mb-3">About this Project</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {project?.description || project?.about || "No description available."}
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {project?.budget && <span>💰 Budget: {project.budget}</span>}
              {project?.duration && <span>📅 Duration: {project.duration}</span>}
              {project?.required_team_size && <span>👥 Team Size: {project.required_team_size}</span>}
            </div>
          </section>

          {/* STATUS-BASED UI */}

          {/* CASE 3: Under Review / Pending */}
          {(status === "pending" || status === "under review" || status === "applied") && (
            <section className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
              <Clock className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-amber-800 mb-2">Application Under Review</h2>
              <p className="text-amber-700">
                Your team's application is currently being reviewed by the company. 
                You'll be notified when your status is updated.
              </p>
            </section>
          )}

          {/* CASE 1: Shortlisted — Show Submit Button */}
          {status === "shortlisted" && !submission && (
            <section className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
              <CheckCircle className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-blue-800 mb-2">You've Been Shortlisted!</h2>
              <p className="text-blue-700 mb-6">
                Your team has been shortlisted for this project. Submit your final deliverables to proceed.
              </p>
              <Button 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                onClick={() => {
                  setSubmitUrl("");
                  setIsSubmitModalOpen(true);
                }}
              >
                <Upload className="h-4 w-4" /> Submit Project
              </Button>
            </section>
          )}

          {/* Shortlisted but already submitted */}
          {status === "shortlisted" && submission && (
            <section className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-green-800 mb-2">Project Submitted</h2>
              <p className="text-green-700 mb-4">Your submission is awaiting review by the company.</p>
              <div className="flex justify-center gap-3">
                {submission.download_url && (
                  <a href={submission.download_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="gap-2">
                      <Download className="h-4 w-4" /> Download ZIP
                    </Button>
                  </a>
                )}
                {submission.github_repo_url && (
                  <a href={submission.github_repo_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="gap-2">
                      <ExternalLink className="h-4 w-4" /> View GitHub Repo
                    </Button>
                  </a>
                )}
              </div>
            </section>
          )}

          {/* CASE 2: Accepted — Show submission + certificates link */}
          {status === "accepted" && (
            <>
              {/* Submission info */}
              <section className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <h2 className="text-lg font-semibold text-green-800">Project Accepted</h2>
                </div>
                <p className="text-green-700 mb-4">
                  Congratulations! Your project has been accepted by the company.
                </p>
                {submission && (
                  <div className="flex gap-3 mb-4">
                    {submission.download_url && (
                      <a href={submission.download_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="gap-2">
                          <Download className="h-3 w-3" /> Download Submission
                        </Button>
                      </a>
                    )}
                    {submission.github_repo_url && (
                      <a href={submission.github_repo_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="gap-2">
                          <ExternalLink className="h-3 w-3" /> View GitHub Repo
                        </Button>
                      </a>
                    )}
                  </div>
                )}
              </section>

              {/* Certificates link */}
              <section className="bg-card rounded-xl border p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Award className="h-6 w-6 text-yellow-500" />
                  <h2 className="text-lg font-semibold">Your Certificates</h2>
                </div>
                <p className="text-muted-foreground mb-4">
                  Certificates have been generated for your participation. Download them from the certificates page.
                </p>
                <Button 
                  className="gap-2"
                  onClick={() => router.push("/student/certificates")}
                >
                  <Award className="h-4 w-4" /> View Certificates
                </Button>
              </section>
            </>
          )}

          {/* Unknown status fallback */}
          {status === "unknown" && (
            <section className="bg-muted rounded-xl p-8 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Application Found</h2>
              <p className="text-muted-foreground">
                We couldn't find an active application for this project.
              </p>
              <Button variant="outline" className="mt-4" onClick={() => router.push("/student/dashboard?tab=live_projects")}>
                Browse Projects
              </Button>
            </section>
          )}
        </main>

        {/* Submission Modal */}
        <Dialog open={isSubmitModalOpen} onOpenChange={setIsSubmitModalOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Submit Project</DialogTitle>
              <DialogDescription>
                Provide a GitHub repository link for your final submission deliverables.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>GitHub Repository URL</Label>
                <Input
                  placeholder="https://github.com/your-org/project"
                  value={submitUrl}
                  onChange={(e) => setSubmitUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Must start with https://github.com/</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSubmitModalOpen(false)}>Cancel</Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !submitUrl}
              >
                {submitting ? "Submitting..." : "Submit Delivery"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Report Modal */}
        <ReportModal 
          isOpen={isReportModalOpen} 
          onClose={() => setIsReportModalOpen(false)} 
          entityType="project"
          entityId={projectId}
          entityName={project?.title}
        />
      </div>
    </ProtectedRoute>
  );
}
