"use client";

export const dynamic = "force-dynamic";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  LayoutDashboard, Briefcase, Users, Plus, Settings, LogOut,
  Eye, CheckCircle2, FileText, Download, ExternalLink, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import ReportModal from "@/components/ReportModal";

const sidebarLinks = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
  { icon: Briefcase, label: "My Projects", id: "projects" },
  { icon: Users, label: "Applicants", id: "applicants" },
  { icon: FileText, label: "Submissions", id: "submissions" },
  { icon: Settings, label: "Settings", id: "settings" },
];
const CompanyDashboard = () => {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  const [postedProjects, setPostedProjects] = useState<any[]>([]);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [stats, setStats] = useState({ posted: 0, totalApps: 0 });
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [selectedSubmProject, setSelectedSubmProject] = useState<string>("");
  const [reportState, setReportState] = useState<{ isOpen: boolean, type: "team" | "user" | "project", id: string, name: string }>({ isOpen: false, type: "team", id: "", name: "" });

useEffect(() => {
const fetchData = async () => {
if (!user?.id) return;
try {
const projectsRes = await fetch("/api/projects/my-projects");
const projectsJson = await projectsRes.json();
const projectsData: any[] = projectsJson.data || [];
const projectIds = projectsData.map((p: any) => p.id);
let appsData: any[] = [];
if (projectIds.length > 0) {
const appsRes = await fetch(`/api/projects/applicants?ids=${projectIds.join(",")}`);
const appsJson = await appsRes.json();
if (appsJson.data) appsData = appsJson.data;
}
const projectCounts: Record<string, number> = {};
appsData.forEach(a => {
projectCounts[a.project_id] = (projectCounts[a.project_id] || 0) + 1;
});
setPostedProjects(projectsData.map((p: any) => ({
...p,
applicants: projectCounts[p.id] || 0,
status: p.status || "Open",
selected: null
})));
setStats({ posted: projectsData.length, totalApps: appsData.length });
if (appsData.length > 0) {
setApplicants(appsData.map((a: any) => ({
id: a.id,
projectId: a.project_id,
teamId: a.team_id,
teamName: a.teams?.name || "Unknown Team",
members: (a.teams?.team_members || []).map((m: any) => m.profiles?.full_name || m.profiles?.email || "Student"),
project: a.projects?.title || "Unknown",
date: new Date(a.created_at || a.updated_at || Date.now()).toLocaleDateString(),
status: a.status === 'in_progress' ? 'In Progress' : (a.status === 'accepted' ? 'Accepted' : (a.status === 'shortlisted' ? 'Shortlisted' : (a.status === 'rejected' ? 'Rejected' : 'Pending'))),
rawStatus: a.status
})));
}
} catch (err) {
console.error("Failed to fetch company dashboard data:", err);
}
};
fetchData();
}, [user]);

//URL Sync
useEffect(() => {
if (typeof window !== "undefined") {
const params = new URLSearchParams(window.location.search);
const tab = params.get("tab");
const pid = params.get("project_id");
if (tab) setActiveTab(tab);
if (pid) setSelectedSubmProject(pid);
}
}, []);

// Default Selection (Auto-select first shortlisted/accepted project if none selected)
useEffect(() => {
if (activeTab === "submissions" && !selectedSubmProject && postedProjects.length > 0 && applicants.length > 0) {
const validProjects = postedProjects.filter(p => 
applicants.some(a => a.projectId === p.id && (a.rawStatus === 'shortlisted' || a.rawStatus === 'accepted'))
);
if (validProjects.length > 0) {
const defaultPid = validProjects[0].id;
setSelectedSubmProject(defaultPid);
if (typeof window !== "undefined") {
const params = new URLSearchParams(window.location.search);
params.set("tab", "submissions");
            params.set("project_id", defaultPid);
            router.replace(`?${params.toString()}`, { scroll: false });
          }
       }
    }
  }, [postedProjects, applicants, activeTab, selectedSubmProject, router]);

  // 3. Fetch submissions strictly on project_id change
  useEffect(() => {
    const fetchSubmissions = async () => {
      console.log("Current Selected ID:", selectedSubmProject);
      if (!selectedSubmProject) {
        setSubmissions([]);
        return;
      }
      setLoadingSubmissions(true);
      try {
        const res = await fetch(`/api/submissions/list?project_id=${selectedSubmProject}`);
        const json = await res.json();
        const data = json.data || [];
        setSubmissions(data);
      } catch (err) {
        console.error('Fetch error:', err);
        setSubmissions([]);
      }
      setLoadingSubmissions(false);
    };

    fetchSubmissions();
  }, [selectedSubmProject]);

  const [title, setTitle] = useState("");
  const [about, setAbout] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [outcomes, setOutcomes] = useState("");
  const [budget, setBudget] = useState("");
  const [duration, setDuration] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleUpdateApplication = async (applicationId: string, projectId: string, teamId: string, actionStatus: 'shortlisted' | 'accepted' | 'rejected') => {
    try {
      if (actionStatus === 'accepted') {
// accepted  ka certificate  generate karane k liye 
        const response = await fetch('/api/projects/accept-team', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ project_id: projectId, team_id: teamId })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Failed to accept team.");
        }

        const result = await response.json();
        toast({ title: "Team Accepted!", description: `${result.certificates_generated} certificates generated for team members.` });
        
        setApplicants(prev => prev.map(a => 
          a.id === applicationId ? { ...a, status: 'Accepted', rawStatus: 'accepted' } 
            : (a.projectId === projectId ? { ...a, status: 'Rejected', rawStatus: 'rejected' } : a)
        ));
        setPostedProjects(prev => prev.map(p => 
            p.id === projectId ? { ...p, status: 'in_progress', selected: teamId } : p
        ));
      } else {
        //rejection k liye
        const response = await fetch('/api/update-application', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
             application_id: applicationId, 
             project_id: projectId,
             team_id: teamId,
             status: actionStatus
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Failed to update application.");
        }

        toast({ title: "Success", description: `Application marked as ${actionStatus}.` });
        
        setApplicants(prev => prev.map(a => 
          a.id === applicationId ? { 
              ...a, 
              status: actionStatus.charAt(0).toUpperCase() + actionStatus.slice(1), 
              rawStatus: actionStatus 
          } : a
        ));
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleCompleteProject = async (projectId: string, applicationId: string, projectTitle: string) => {
      try {
          // Dummy distribution map pulling from context
          const distribution = [{ student_id: 'sample-student-uuid', amount: 500 }];

          const res = await fetch('/api/complete-project', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  project_id: projectId,
                  application_id: applicationId,
                  earnings_distribution: distribution,
                  project_title: projectTitle
              })
          });

          if (!res.ok) {
              const errData = await res.json();
              throw new Error(errData.error || "Failed completion.");
          }

          toast({ title: "Success", description: "Project finalized and rewards distributed!" });
          
          setPostedProjects(prev => prev.map(p => 
              p.id === projectId ? { ...p, status: 'completed' } : p
          ));
      } catch (err: any) {
          toast({ title: "Error", description: err.message, variant: "destructive" });
      }
  };

  const handlePostProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      toast({ title: "Validation Error", description: "Title and Description are required.", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const finalRequirements = requirements.split('\n').filter(t => t.trim() !== "");

      const payload = {
        title,
        description,
        about: about || "TBD",
        budget: budget || "TBD",
        duration: duration || "TBD",
        required_team_size: teamSize ? parseInt(teamSize) : null,
        outcomes: outcomes || "TBD",
        requirements: finalRequirements
      };

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to successfully create the project from the API.");
      }
      
      toast({ title: "Success", description: "Project posted successfully!" });
      setTitle(""); setAbout(""); setDescription(""); setRequirements(""); setOutcomes("");
      setBudget(""); setDuration(""); setTeamSize("");
      
      router.push('/company/dashboard');

    } catch (err: any) {
      console.error(err);
      alert(JSON.stringify(err));
      toast({ title: "Error", description: err.message || "Insert failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["Company"]}>
      <div className="min-h-screen bg-background flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border fixed h-full">
          <div className="p-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <span className="text-primary-foreground font-display font-bold text-sm">P</span>
              </div>
              <span className="font-display font-bold text-sidebar-foreground">Paryuktam</span>
            </Link>
          </div>
          <nav className="flex-1 px-3 space-y-1">
            {sidebarLinks.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (typeof window !== "undefined") {
                    const params = new URLSearchParams(window.location.search);
                    params.set("tab", item.id);
                    router.replace(`?${params.toString()}`, { scroll: false });
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  activeTab === item.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-sidebar-border">
            <button onClick={() => signOut()} className="flex items-center gap-3 px-3 py-2 text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors w-full">
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 lg:ml-64 p-6 md:p-10">
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === "dashboard" && (
              <>
                 <div className="flex items-start justify-between mb-8">
                  <div>
                    <h1 className="font-display text-2xl md:text-3xl font-bold">Company Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Manage your projects and teams.</p>
                  </div>
                  <Button onClick={() => setActiveTab("post_project")} className="bg-gradient-primary hover:opacity-90 gap-2">
                    <Plus className="h-4 w-4" /> Post Project
                  </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                  {[
                    { label: "Posted Projects", value: stats.posted.toString(), icon: Briefcase },
                    { label: "Total Applicants", value: stats.totalApps.toString(), icon: Users },
                    { label: "Required Actions", value: "0", icon: CheckCircle2 },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-card rounded-xl border shadow-card p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          <stat.icon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="text-2xl font-display font-bold">{stat.value}</div>
                          <div className="text-xs text-muted-foreground">{stat.label}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Projects Preview */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display font-semibold text-lg">Recent Projects</h2>
                    <Button variant="link" className="text-primary p-0 h-auto" onClick={() => setActiveTab("projects")}>View All</Button>
                  </div>
                  <div className="bg-card rounded-xl border shadow-card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b text-left">
                            <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Project</th>
                            <th className="px-5 py-3 hidden md:table-cell text-xs font-medium text-muted-foreground uppercase tracking-wider">About</th>
                            <th className="px-5 py-3 hidden lg:table-cell text-xs font-medium text-muted-foreground uppercase tracking-wider">Tasks</th>
                            <th className="px-5 py-3 hidden xl:table-cell text-xs font-medium text-muted-foreground uppercase tracking-wider">Outcomes</th>
                            <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                            <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Students Enrolled</th>
                            <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Selected Team</th>
                            <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {postedProjects.slice(0, 3).map((p) => (
                            <tr key={p.title} className="hover:bg-muted/50 transition-colors">
                              <td className="px-5 py-4 font-medium text-sm">{p.title}</td>
                              <td className="px-5 py-4 hidden md:table-cell text-sm max-w-[150px] truncate" title={p.about}>{p.about}</td>
                              <td className="px-5 py-4 hidden lg:table-cell text-sm max-w-[150px] truncate" title={p.requirements}>{p.requirements}</td>
                              <td className="px-5 py-4 hidden xl:table-cell text-sm max-w-[150px] truncate" title={p.outcomes}>{p.outcomes}</td>
                              <td className="px-5 py-4">
                                <Badge variant={p.status === "Open" ? "default" : "secondary"} className={p.status === "Open" ? "bg-secondary text-secondary-foreground" : ""}>
                                  {p.status}
                                </Badge>
                              </td>
                              <td className="px-5 py-4 text-sm text-muted-foreground">{p.applicants}</td>
                              <td className="px-5 py-4 text-sm">{p.selected || <span className="text-muted-foreground">—</span>}</td>
                              <td className="px-5 py-4">
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm" className="gap-1.5 h-8">
                                    <Eye className="h-3 w-3" /> View
                                  </Button>
                                  {p.status === "in_progress" && (
                                     <Button 
                                       size="sm" 
                                       className="h-8 bg-green-600 hover:bg-green-700 text-white"
                                       onClick={() => {
                                          handleCompleteProject(p.id, "synthetic-app-id", p.title);
                                       }}
                                     >
                                       Mark Complete
                                     </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === "projects" && (
              <>
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <h1 className="font-display text-2xl md:text-3xl font-bold">Your Projects</h1>
                    <p className="text-muted-foreground mt-1">Manage and track all your posted projects.</p>
                  </div>
                  <Button onClick={() => setActiveTab("post_project")} className="bg-gradient-primary hover:opacity-90 gap-2">
                    <Plus className="h-4 w-4" /> Post Project
                  </Button>
                </div>
                 <div className="bg-card rounded-xl border shadow-card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b text-left">
                            <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Project</th>
                            <th className="px-5 py-3 hidden md:table-cell text-xs font-medium text-muted-foreground uppercase tracking-wider">About</th>
                            <th className="px-5 py-3 hidden lg:table-cell text-xs font-medium text-muted-foreground uppercase tracking-wider">Tasks</th>
                            <th className="px-5 py-3 hidden xl:table-cell text-xs font-medium text-muted-foreground uppercase tracking-wider">Outcomes</th>
                            <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                            <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Students Enrolled</th>
                            <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Selected Team</th>
                            <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {postedProjects.map((p) => (
                            <tr key={p.title} className="hover:bg-muted/50 transition-colors">
                              <td className="px-5 py-4 font-medium text-sm">{p.title}</td>
                              <td className="px-5 py-4 hidden md:table-cell text-sm max-w-[150px] truncate" title={p.about}>{p.about}</td>
                              <td className="px-5 py-4 hidden lg:table-cell text-sm max-w-[150px] truncate" title={p.requirements}>{p.requirements}</td>
                              <td className="px-5 py-4 hidden xl:table-cell text-sm max-w-[150px] truncate" title={p.outcomes}>{p.outcomes}</td>
                              <td className="px-5 py-4">
                                <Badge variant={p.status === "Open" ? "default" : "secondary"} className={p.status === "Open" ? "bg-secondary text-secondary-foreground" : ""}>
                                  {p.status}
                                </Badge>
                              </td>
                              <td className="px-5 py-4 text-sm text-muted-foreground">{p.applicants}</td>
                              <td className="px-5 py-4 text-sm">{p.selected || <span className="text-muted-foreground">—</span>}</td>
                              <td className="px-5 py-4">
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm" className="gap-1.5">
                                    <Eye className="h-3 w-3" /> View
                                  </Button>
                                  {p.status === "in_progress" && (
                                     <Button 
                                       size="sm" 
                                       className="bg-green-600 hover:bg-green-700 text-white"
                                       onClick={() => {
                                          handleCompleteProject(p.id, "synthetic-app-id", p.title);
                                       }}
                                     >
                                       Mark Complete
                                     </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
              </>
            )}

            {activeTab === "applicants" && (
              <>
                 <div className="mb-8">
                  <h1 className="font-display text-2xl md:text-3xl font-bold">Applicants</h1>
                  <p className="text-muted-foreground mt-1">Review teams interested in your projects.</p>
                </div>
                 
                 <div className="bg-card rounded-xl border shadow-card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b text-left">
                            <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Candidate Team</th>
                            <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Applied For</th>
                            <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                            <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                            <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {applicants.map((applicant, idx) => (
                            <tr key={idx} className="hover:bg-muted/50 transition-colors">
                              <td className="px-5 py-4 font-medium text-sm">
                                <div className="flex flex-col gap-1">
                                  <span className="font-semibold text-primary">{applicant.teamName}</span>
                                  <span className="text-xs text-muted-foreground">{applicant.members.join(', ')}</span>
                                </div>
                              </td>
                              <td className="px-5 py-4 text-sm text-muted-foreground">{applicant.project}</td>
                              <td className="px-5 py-4 text-sm text-muted-foreground">{applicant.date}</td>
                              <td className="px-5 py-4">
                                <Badge variant={applicant.rawStatus === "pending" || applicant.status === "Pending" ? "default" : "secondary"}>
                                  {applicant.status}
                                </Badge>
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex gap-2">
                                  {applicant.rawStatus === 'pending' && (
                                    <>
                                      <Button 
                                        variant="outline" size="sm" className="h-8"
                                        onClick={() => handleUpdateApplication(applicant.id, applicant.projectId, applicant.teamId, 'shortlisted')}
                                      >
                                        Shortlist
                                      </Button>
                                      <Button 
                                        variant="destructive" size="sm" className="h-8"
                                        onClick={() => handleUpdateApplication(applicant.id, applicant.projectId, applicant.teamId, 'rejected')}
                                      >
                                        Reject
                                      </Button>
                                    </>
                                  )}
                                  
                                  <Button 
                                    variant="outline" size="sm" className="h-8 text-red-500 border-red-500 hover:bg-red-50 hover:text-red-600 gap-1"
                                    onClick={() => setReportState({ isOpen: true, type: "team", id: applicant.teamId, name: applicant.teamName })}
                                  >
                                    <AlertCircle className="w-3 h-3" /> Report
                                  </Button>
                                  
                                  {(applicant.rawStatus === 'pending' || applicant.rawStatus === 'shortlisted') && (
                                     <Button 
                                       size="sm" className="h-8 bg-green-600 hover:bg-green-700 text-white"
                                       onClick={() => handleUpdateApplication(applicant.id, applicant.projectId, applicant.teamId, 'accepted')}
                                     >
                                       Accept Team
                                     </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
              </>
            )}

            {activeTab === "submissions" && (
              <>
                <div className="mb-8">
                  <h1 className="font-display text-2xl md:text-3xl font-bold">Submissions</h1>
                  <p className="text-muted-foreground mt-1">Review project deliverables from accepted teams.</p>
                </div>

                {/* Project Selector */}
                <div className="mb-6">
                  <select
                    className="h-10 w-full md:w-[300px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={selectedSubmProject}
                    onChange={(e) => {
                      const pid = e.target.value;
                      setSelectedSubmProject(pid);
                      if (typeof window !== "undefined") {
                        const params = new URLSearchParams(window.location.search);
                        if (pid) params.set("project_id", pid);
                        else params.delete("project_id");
                        router.replace(`?${params.toString()}`, { scroll: false });
                      }
                    }}
                  >
                    <option value="">Select a project...</option>
                    {postedProjects.filter(p => 
                      applicants.some(a => a.projectId === p.id && (a.rawStatus === 'shortlisted' || a.rawStatus === 'accepted'))
                    ).map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>

                {loadingSubmissions && (
                  <div className="text-center py-12 text-muted-foreground">Loading submissions...</div>
                )}

                {!loadingSubmissions && selectedSubmProject && submissions.length === 0 && (
                  <div className="bg-card rounded-xl border shadow-card p-12 text-center text-muted-foreground">
                    No submissions found for this project.
                  </div>
                )}

                {!loadingSubmissions && submissions.length > 0 && (
                  <div className="bg-card rounded-xl border shadow-card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b text-left">
                            <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Team</th>
                            <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Submitted By</th>
                            <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                            <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                            <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {submissions.map((sub: any) => (
                            <tr key={sub.id} className="hover:bg-muted/50 transition-colors">
                              <td className="px-5 py-4 font-medium text-sm">{sub.team_name}</td>
                              <td className="px-5 py-4 text-sm text-muted-foreground">{sub.submitted_by}</td>
                              <td className="px-5 py-4">
                                <Badge variant="secondary">{sub.submission_type === 'zip_file' ? 'ZIP File' : 'GitHub'}</Badge>
                              </td>
                              <td className="px-5 py-4 text-sm text-muted-foreground">
                                {new Date(sub.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex gap-2">
                                  {sub.download_url && (
                                    <a href={sub.download_url} target="_blank" rel="noopener noreferrer">
                                      <Button variant="outline" size="sm" className="gap-1.5">
                                        <Download className="h-3 w-3" /> Download
                                      </Button>
                                    </a>
                                  )}
                                  {sub.github_repo_url && (
                                    <a href={sub.github_repo_url} target="_blank" rel="noopener noreferrer">
                                      <Button variant="outline" size="sm" className="gap-1.5">
                                        <ExternalLink className="h-3 w-3" /> View Repo
                                      </Button>
                                    </a>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === "post_project" && (
              <>
                <div className="mb-8">
                  <h1 className="font-display text-2xl md:text-3xl font-bold">Post a New Project</h1>
                  <p className="text-muted-foreground mt-1">Publish a real-world project to recruit talented student teams.</p>
                </div>
                
                <div className="bg-card rounded-xl border shadow-card p-6 md:p-8 space-y-6">
                  <form onSubmit={handlePostProject} className="space-y-6">
                    {message && (
                      <div className={`p-4 rounded-md text-sm ${message.includes("Error") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>
                        {message}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Project Title*</Label>
                      <Input 
                        value={title} onChange={e => setTitle(e.target.value)} 
                        placeholder="e.g. Next-Gen E-Commerce Logistics Platform" 
                        className="text-lg py-6"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>About the Project (Short Summary)</Label>
                      <Textarea 
                        value={about} onChange={e => setAbout(e.target.value)} 
                        placeholder="A brief 2-sentence summary of what this project aims to achieve." 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Full Technical Description*</Label>
                      <Textarea 
                        value={description} onChange={e => setDescription(e.target.value)} 
                        placeholder="Provide detailed context, goals, and technical scope..." 
                        className="min-h-[150px]"
                      />
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label>Budget (Optional)</Label>
                        <Input 
                          value={budget} onChange={e => setBudget(e.target.value)} 
                          placeholder="e.g. $5,000" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Duration (Optional)</Label>
                        <Input 
                          value={duration} onChange={e => setDuration(e.target.value)} 
                          placeholder="e.g. 3 Months" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Team Size (Optional)</Label>
                        <Input 
                          type="number"
                          value={teamSize} onChange={e => setTeamSize(e.target.value)} 
                          placeholder="e.g. 4" 
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Tasks / Requirements (Bullet Points)</Label>
                        <Textarea 
                          value={requirements} onChange={e => setRequirements(e.target.value)} 
                          placeholder="- React/Next.js\n- PostgreSQL\n- Experience with GraphQL" 
                          className="min-h-[150px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Accepted Outcomes (Deliverables)</Label>
                        <Textarea 
                          value={outcomes} onChange={e => setOutcomes(e.target.value)} 
                          placeholder="- Fully functional MVP\n- Deployed on Vercel\n- Architecture Document" 
                          className="min-h-[150px]"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t flex justify-end">
                      <Button type="button" variant="outline" className="mr-4" onClick={() => setActiveTab("projects")}>Cancel</Button>
                      <Button type="submit" size="lg" disabled={loading}>
                        {loading ? "Publishing..." : "Publish Project Live"}
                      </Button>
                    </div>
                  </form>
                </div>
              </>
            )}

            {activeTab === "settings" && (
              <>
                <div className="mb-8">
                  <h1 className="font-display text-2xl md:text-3xl font-bold">Settings</h1>
                  <p className="text-muted-foreground mt-1">Manage company profile and preferences.</p>
                </div>
                 
                 <div className="max-w-2xl bg-card rounded-xl border shadow-card p-6">
                    <h3 className="font-semibold text-lg mb-4">Company Profile</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Company Name</label>
                        <input type="text" defaultValue="TechCorp Solutions" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Website</label>
                          <input type="url" defaultValue="https://techcorp.example.com" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Industry</label>
                          <input type="text" defaultValue="Software Development" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" defaultValue="Leading provider of innovative software solutions for enterprise clients." />
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                      <Button>Save Changes</Button>
                    </div>
                  </div>
              </>
            )}
          </motion.div>
        </main>
      </div>

      <ReportModal
        isOpen={reportState.isOpen}
        onClose={() => setReportState({ ...reportState, isOpen: false })}
        entityType={reportState.type}
        entityId={reportState.id}
        entityName={reportState.name}
      />
    </ProtectedRoute>
  );
};

export default CompanyDashboard;
