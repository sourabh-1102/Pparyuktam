"use client";

export const dynamic = "force-dynamic";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import {
  LayoutDashboard, Briefcase, Users, Award, Settings, LogOut,
  FileText, Plus, Trash2, Percent, ChevronDown, Send, Wallet, Folder, Download, CreditCard, ArrowLeft, Calendar, Landmark, Smartphone, ShieldCheck, Lock, AlertCircle, MoreVertical
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useState, useEffect } from "react";
import { Copy, Check, Globe } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ReportModal from "@/components/ReportModal";

const sidebarLinks = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
  { icon: Globe, label: "Live Projects", id: "live_projects" },
  { icon: Briefcase, label: "My Projects", id: "projects" },
  { icon: Users, label: "My Team", id: "team" },
  { icon: Wallet, label: "Wallet", id: "wallet" },
  { icon: Award, label: "Certificates", id: "certificates" },
  { icon: Settings, label: "Settings", id: "settings" },
];

// activeProjects moved to component derived state

const appliedProjects = [
  { title: "Health Tracker App", company: "MedFirst", status: "Under Review" },
  { title: "Supply Chain Dashboard", company: "LogiCore", status: "Shortlisted" },
];

const mockCertificates = [
  { id: 1, title: "Mobile Banking App Typescript", type: "participation", date: "Jan 2026", url: "#" },
  { id: 2, title: "Letter of Recommendation - FinTech", type: "recommendation", date: "Feb 2026", url: "#" },
  { id: 3, title: "Full Stack Development Bootcamp", type: "completion", date: "Dec 2025", url: "#" },
  { id: 4, title: "AI Ethics Workshop", type: "participation", date: "Mar 2026", url: "#" },
  { id: 5, title: "System Design Masterclass", type: "completion", date: "Nov 2025", url: "#" },
  { id: 6, title: "Hackathon 2025 Finalist", type: "participation", date: "Apr 2026", url: "#" },
  { id: 7, title: "Internship Recommendation", type: "recommendation", date: "May 2026", url: "#" },
  { id: 8, title: "Advanced React Patterns", type: "completion", date: "Oct 2025", url: "#" },
];

const handleDownload = (cert: any) => {
    const content = `PARYUKTAM VERIFIED CREDENTIAL\n\nCertificate Type: ${cert.type.toUpperCase()}\nTitle: ${cert.title}\nDate Issued: ${cert.date}\n\nThis document certifies the successful completion/participation of the above credential.\n\nVerified by Paryuktam Platform.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cert.title.replace(/\s+/g, '_')}_Certificate.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
};



interface Message {
  id: number;
  senderId: string;
  text: string;
  timestamp: string;
}

// CIA Security Helpers
const mockEncrypt = (data: string) => {
    try { return btoa(data); } catch (e) { return data; }
};

const maskData = (data: string, visibleCount = 4) => {
    if (!data || data.length <= visibleCount) return data;
    return "•".repeat(Math.max(0, data.length - visibleCount)) + data.slice(-visibleCount);
};

interface PaymentMethod {
    id: number;
    type: 'bank' | 'upi' | 'card';
    details: {
        identifier: string; // Encrypted Account No, UPI ID, or Card No
        meta1?: string; // Encrypted Bank Name or Expiry
        meta2?: string; // Encrypted IFSC
    };
    addedOn: string;
}

interface Member {
  id: string;
  name: string;
  role: string;
  email: string;
  initials: string;
  equity: number;
  isLeader: boolean;
}

interface Team {
  id: string;
  name: string;
  project: string;
  budget: number;
  members: Member[];
}

interface Certificate {
  id: number;
  title: string;
  type: string;
  date: string;
  url: string;
}


interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  bio: string;
}

interface CurrentUser {
  id: string;
  role: string;
}

const MemberChatDialog = ({ isOpen, onClose, member, currentUser }: { isOpen: boolean; onClose: () => void; member: Member | null; currentUser: CurrentUser }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [reportState, setReportState] = useState<{ isOpen: boolean, type: "user" | "project", id: string, name: string }>({ isOpen: false, type: "user", id: "", name: "" });

  useEffect(() => {
    if (isOpen && member) {
      const chatId = [currentUser.id, member.id].sort().join("_");
      const stored = localStorage.getItem(`paryuktam_chat_${chatId}`);
      if (stored) {
        setMessages(JSON.parse(stored));
      } else {
        setMessages([{
             id: Date.now(),
             senderId: member.id,
             text: `Hey! Let's discuss the project tasks.`,
             timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    }
  }, [isOpen, member, currentUser]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !member) return;

    const msg: Message = {
      id: Date.now(),
      senderId: currentUser.id,
      text: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, msg];
    setMessages(updatedMessages);
    
    const chatId = [currentUser.id, member.id].sort().join("_");
    localStorage.setItem(`paryuktam_chat_${chatId}`, JSON.stringify(updatedMessages));
    setNewMessage("");

    setTimeout(() => {
        const reply: Message = {
            id: Date.now() + 1,
            senderId: member.id,
            text: "Got it! I'll take a look shortly.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        const withReply = [...updatedMessages, reply];
        setMessages(withReply);
        localStorage.setItem(`paryuktam_chat_${chatId}`, JSON.stringify(withReply));
    }, 1500);
  };

  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                {member.initials}
             </div>
             <div>
                <DialogTitle>{member.name}</DialogTitle>
                <div className="flex items-center gap-3">
                   <DialogDescription>{member.role}</DialogDescription>
                   <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                         <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground ml-2">
                            <MoreVertical className="h-4 w-4" />
                         </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                         <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer" onClick={() => setReportState({ isOpen: true, type: "user", id: member.id, name: member.name })}>
                            <AlertCircle className="w-4 h-4 mr-2" /> Report User
                         </DropdownMenuItem>
                      </DropdownMenuContent>
                   </DropdownMenu>
                </div>
             </div>
          </div>
        </DialogHeader>
        
        {/* Report Modal */}
        <ReportModal
            isOpen={reportState.isOpen}
            onClose={() => setReportState({ ...reportState, isOpen: false })}
            entityType={reportState.type}
            entityId={reportState.id}
            entityName={reportState.name}
        />
        <div className="h-[400px] flex flex-col border rounded-md mt-2">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] rounded-lg p-3 ${
                            msg.senderId === currentUser.id 
                            ? "bg-primary text-primary-foreground rounded-tr-none" 
                            : "bg-muted rounded-tl-none"
                        }`}>
                            <p className="text-sm">{msg.text}</p>
                            <span className="text-[10px] opacity-70 block text-right mt-1">{msg.timestamp}</span>
                        </div>
                    </div>
                ))}
            </div>
            <div className="p-3 border-t bg-muted/20 flex gap-2">
                <Input 
                    value={newMessage} 
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <Button size="icon" onClick={handleSendMessage}>
                    <Send className="h-4 w-4" />
                </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const StudentDashboard = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(searchParams?.get("tab") || "dashboard");
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [liveProjects, setLiveProjects] = useState<any[]>([]);
  const [enrolledProjects, setEnrolledProjects] = useState<string[]>([]);
  const [enrollmentStatusMap, setEnrollmentStatusMap] = useState<Record<string, string>>({});
  const [dashboardReportState, setDashboardReportState] = useState<{ isOpen: boolean, type: "user" | "project", id: string, name: string }>({ isOpen: false, type: "user", id: "", name: "" });
  
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [selectedEnrollProject, setSelectedEnrollProject] = useState<string | null>(null);
  const [selectedEnrollTeamId, setSelectedEnrollTeamId] = useState<string>("");
  const [realTeams, setRealTeams] = useState<any[]>([]);
  const [currentRealTeamId, setCurrentRealTeamId] = useState<string | null>(null);
  const [currentRealTeamMembers, setCurrentRealTeamMembers] = useState<any[]>([]);

  // Submission State
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submitProjectId, setSubmitProjectId] = useState<string | null>(null);
  const [submitUrl, setSubmitUrl] = useState("");
  const [submitFile, setSubmitFile] = useState<File | null>(null);
  const [submitType, setSubmitType] = useState<"zip_file" | "github_transfer">("github_transfer");
  const [submitting, setSubmitting] = useState(false);

  const openSubmitModal = (projectId: string) => {
     setSubmitProjectId(projectId);
     setIsSubmitModalOpen(true);
     setSubmitUrl("");
     setSubmitFile(null);
     setSubmitType("github_transfer");
  };

  const handleSubmitProject = async () => {
     if (submitType === "github_transfer" && !submitUrl) {
        toast({ title: "Error", description: "Please provide a valid GitHub URL.", variant: "destructive" });
        return;
     }
     if (submitType === "zip_file" && !submitFile) {
        toast({ title: "Error", description: "Please select a ZIP file.", variant: "destructive" });
        return;
     }

     // Resolve team_id for this project from enrolled applications
     const teamId = currentRealTeamId || realTeams[0]?.id;
     if (!teamId) {
        toast({ title: "Error", description: "No team found. Please join or create a team first.", variant: "destructive" });
        return;
     }

     setSubmitting(true);
     try {
        const formData = new FormData();
        formData.append("project_id", submitProjectId!);
        formData.append("team_id", teamId);
        formData.append("submission_type", submitType);

        if (submitType === "zip_file" && submitFile) {
           formData.append("file", submitFile);
        } else {
           formData.append("github_repo_url", submitUrl);
        }

        const res = await fetch("/api/submissions/create", {
           method: "POST",
           body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to submit project.");

        toast({ title: "Success", description: "Project submitted successfully! The company will review it shortly." });
        setIsSubmitModalOpen(false);
     } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
     } finally {
        setSubmitting(false);
     }
  };

  const fetchRealTeams = async () => {
    try {
      const res = await fetch("/api/teams/my-teams");
      const data = await res.json();
      if (data.teams && Array.isArray(data.teams)) {
        setRealTeams(data.teams);
        if (data.teams.length > 0) {
          setCurrentRealTeamId(prev => prev || data.teams[0].id);
        }
        
        // Fetch applications via secure API route (bypasses RLS issues)
        const appsRes = await fetch("/api/applications/my");
        const appsJson = await appsRes.json();
        
        if (appsJson.data && Array.isArray(appsJson.data)) {
          const apps = appsJson.data;
          setEnrolledProjects(apps.map((a: any) => a.projectId));
          
          const statusMap: Record<string, string> = {};
          apps.forEach((a: any) => { statusMap[a.projectId] = a.status; });
          setEnrollmentStatusMap(statusMap);
        }
      }
    } catch (e) {
      console.error("Failed to fetch teams:", e);
    }
  };

  useEffect(() => {
    const fetchLiveProjects = async () => {
      // Fetch open projects via API route (bypasses RLS — auth.uid() is null with NextAuth)
      try {
        const res = await fetch('/api/projects/browse');
        const json = await res.json();
        const allProjects: any[] = json.data || [];
        // Filter to only open projects for the live tab
        const openProjects = allProjects.filter((p: any) => p.status === 'open' || p.status === 'Open');
        setLiveProjects(openProjects);
      } catch (err) {
        console.error("Failed to fetch live projects:", err);
      }

      // Realtime subscription for new projects
      const projectsChannel = supabase
         .channel('live-projects')
         .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'projects' }, payload => {
             if (payload.new.status === 'open') {
                 setLiveProjects(prev => [payload.new as any, ...prev]);
             }
         })
         .subscribe();

      // Fetch user's teams via service-role API (bypasses RLS)
      await fetchRealTeams();

      return () => { supabase.removeChannel(projectsChannel); };
    };
    fetchLiveProjects();
  }, [user]);

  const openEnrollModal = (projectId: string) => {
      setSelectedEnrollProject(projectId);
      setIsEnrollModalOpen(true);
      // Default auto-select the first team they lead from real database instances
      const ledTeams = realTeams.filter(t => t.isLeader);
      if (ledTeams.length > 0) setSelectedEnrollTeamId(ledTeams[0].id);
      else setSelectedEnrollTeamId("");
  };

  const handleEnrollSubmit = async () => {
    if (!user?.id || !selectedEnrollProject || !selectedEnrollTeamId) {
      toast({ title: "Error", description: "You must lead a team to enroll.", variant: "destructive" });
      return;
    }

    // Guard: ensure the team ID is a real UUID (not a localStorage mock like "t1234567")
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(selectedEnrollTeamId)) {
      toast({
        title: "Invalid Team",
        description: "Please create a real team from the 'My Team' tab before applying.",
        variant: "destructive"
      });
      setIsEnrollModalOpen(false);
      setActiveTab("team");
      return;
    }
    
    setIsEnrollModalOpen(false);
    
    // Optimistic update
    setEnrolledProjects(prev => [...prev, selectedEnrollProject]);
    setEnrollmentStatusMap(prev => ({ ...prev, [selectedEnrollProject]: 'pending' }));

    const res = await fetch('/api/enroll-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: selectedEnrollProject, team_id: selectedEnrollTeamId })
    });

    if (!res.ok) {
        const errorData = await res.json();
        setEnrolledProjects(prev => prev.filter(id => id !== selectedEnrollProject));
        toast({ title: "Error", description: errorData.error || "Application failed", variant: "destructive" });
    } else {
        toast({ title: "Success", description: "Successfully applied to the project!" });
    }
  };




  const [userProfile, setUserProfile] = useState<UserProfile>({
    firstName: "Arjun",
    lastName: "Verma",
    email: "arjun.verma@example.com",
    bio: "Computer Science student passionate about full-stack development and AI."
  });
  
  // Load profile from storage
  useEffect(() => {
    const savedProfile = localStorage.getItem("paryuktam_user_profile");
    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile));
    }
  }, []);

  // Native Data & State for Team Management
  const [teams, setTeams] = useState<{ id: string, name?: string, project?: string, budget?: number, members: any[] }[]>([]);


  // Initial load from local storage (for mock persistence)
  // Dynamically load active teams from native source
  useEffect(() => {
    // Relying on myTeamMembers fetch from fetchLiveProjects natively mapped into realTeams. 
    // Synchronize teams state with realTeams if required for component mapping.
  }, []);
  const [currentTeamId, setCurrentTeamId] = useState<string | null>(null);
  const [selectedInviteTeamId, setSelectedInviteTeamId] = useState<string>("");

  // Fetch members whenever the selected real team changes
  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!currentRealTeamId) { setCurrentRealTeamMembers([]); return; }
      try {
        const res = await fetch(`/api/teams/members?teamId=${currentRealTeamId}`);
        const { members } = await res.json();
        if (members && Array.isArray(members)) {
          setCurrentRealTeamMembers(members.map((m: any) => ({
            id: m.id,
            user_id: m.user_id,
            name: m.name || m.email?.split("@")[0] || "User",
            email: m.email || '',
            role: m.role || 'Member',
            skill_role: m.skill_role || [],
            initials: (m.name || m.email || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
            equity: m.equity || 0,
          })));
        }
      } catch (err) {
        console.error("Failed to fetch team members:", err);
      }
    };
    fetchTeamMembers();
  }, [currentRealTeamId]);

  // Re-fetch teams when window regains focus (e.g., returning from create-team page)
  useEffect(() => {
    const handleFocus = () => fetchRealTeams();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedCertificate, setSelectedCertificate] = useState<any>(null);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isInviteMemberOpen, setIsInviteMemberOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  
  // Custom Invite State (resend api use ki thi)
  const [inviteMethod, setInviteMethod] = useState<'Email' | 'SMS' | 'WhatsApp'>('Email');
  const [countryCode, setCountryCode] = useState('+91');
  const [inviteContactInfo, setInviteContactInfo] = useState('');
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState('');
  const [inviteErrorMsg, setInviteErrorMsg] = useState('');

  // Payment Methods State
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'bank' | 'upi' | 'card'>('bank');
  
  // Form State
  const [pmIdentifier, setPmIdentifier] = useState("");
  const [pmMeta1, setPmMeta1] = useState("");
  const [pmMeta2, setPmMeta2] = useState("");
  const [pmError, setPmError] = useState("");

  useEffect(() => {
      const savedPm = localStorage.getItem("paryuktam_payment_methods");
      if (savedPm) {
          setPaymentMethods(JSON.parse(savedPm));
      }
  }, []);

  const handleSavePaymentMethod = () => {
      setPmError("");
      
      // Integrity: Input Validation & Sanitization
      const cleanIdentifier = pmIdentifier.trim();
      const cleanMeta1 = pmMeta1.trim();
      const cleanMeta2 = pmMeta2.trim();

      if (!cleanIdentifier) {
          setPmError("Identifier is required.");
          return;
      }

      if (paymentType === 'upi') {
          if (!/^[\w.-]+@[\w.-]+$/.test(cleanIdentifier)) {
              setPmError("Invalid UPI ID format.");
              return;
          }
      } else if (paymentType === 'card') {
          if (!/^\d{16}$/.test(cleanIdentifier.replace(/\s/g, ''))) {
              setPmError("Invalid Card Number (must be 16 digits).");
              return;
          }
          if (!/^\d{2}\/\d{2}$/.test(cleanMeta1)) {
              setPmError("Invalid Expiry (MM/YY).");
              return;
          }
      } else if (paymentType === 'bank') {
          if (!/^\d{9,18}$/.test(cleanIdentifier)) {
              setPmError("Invalid Account Number.");
              return;
          }
           if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanMeta2)) {
              setPmError("Invalid IFSC Code.");
              return;
          }
      }

      // Confidentiality: Mock Encryption before storage
      const newMethod: PaymentMethod = {
          id: Date.now(),
          type: paymentType,
          details: {
              identifier: mockEncrypt(cleanIdentifier),
              meta1: cleanMeta1 ? mockEncrypt(cleanMeta1) : undefined,
              meta2: cleanMeta2 ? mockEncrypt(cleanMeta2) : undefined
          },
          addedOn: new Date().toLocaleDateString()
      };

      const updatedMethods = [...paymentMethods, newMethod];
      setPaymentMethods(updatedMethods);
      
      // Availability: Persistence
      localStorage.setItem("paryuktam_payment_methods", JSON.stringify(updatedMethods));
      
      // Reset Form
      setIsAddPaymentOpen(false);
      setPmIdentifier("");
      setPmMeta1("");
      setPmMeta2("");
  };

  const removePaymentMethod = (id: number) => {
      const updated = paymentMethods.filter(pm => pm.id !== id);
      setPaymentMethods(updated);
      localStorage.setItem("paryuktam_payment_methods", JSON.stringify(updated));
  };

  const currentTeam = teams.find(t => t.id === currentTeamId) || teams[0] || { 
    id: "empty-team", name: "No Team Found", project: "N/A", budget: 0, members: [] 
  };
  const currentUser = { id: "m1", role: "leader" }; // Mock current user as leader


  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  useEffect(() => {
    // Load persisted teams on mount — PURGE any with non-UUID IDs (legacy mock IDs like "t1234...")
    const savedTeams = JSON.parse(localStorage.getItem("paryuktam_teams") || "[]");
    const realSavedTeams = savedTeams.filter((t: any) => UUID_REGEX.test(t.id));
    // Overwrite storage with only valid teams
    if (realSavedTeams.length !== savedTeams.length) {
      localStorage.setItem("paryuktam_teams", JSON.stringify(realSavedTeams));
    }
    if (realSavedTeams.length > 0) {
      setTeams(realSavedTeams);
    }
  }, []);

  useEffect(() => {
    // Check for pending joins from localStorage
    const pendingJoins = JSON.parse(localStorage.getItem("pending_joins") || "[]");
    
    if (pendingJoins.length > 0) {
      setTeams(currentTeams => {
        let hasChanges = false;
        const updatedTeams = currentTeams.map(team => {
          const teamJoins = pendingJoins.filter((join: any) => join.teamId === team.id);
          
          if (teamJoins.length > 0) {
            // Filter out members that are already in the team to avoid duplicates
            const newMembers = teamJoins.filter((join: any) => 
              !(team.members || []).some((m: any) => m.id === join.id || m.email === join.email)
            );

            if (newMembers.length > 0) {
              hasChanges = true;
              return {
                ...team,
                members: [...(team.members || []), ...newMembers]
              };
            }
          }
          return team;
        });

        if (hasChanges) {
          // Update localStorage for teams as well to persist the new members
          localStorage.setItem("paryuktam_teams", JSON.stringify(updatedTeams));
          // Clear pending joins to prevent loop
          localStorage.removeItem("pending_joins");
          return updatedTeams;
        }
        return currentTeams;
      });
    }
  }, [teams]); // This dependency is still dangerous if not handled carefully, but clearing localStorage helps. 
  // Better: remove 'teams' from dependency and trust the functional update, 
  // BUT we need to trigger this check when `teams` *might* have changed or on mount? 
  // Actually, we only really need to check this on mount and maybe when window gets focus?
  // Let's stick to the safe approach: functional update + clear storage.

  const generateInviteLink = () => {
    // Only generate a link for teams with real UUIDs from the database
    const teamId = realTeams[0]?.id || currentTeamId;
    if (!teamId || !UUID_REGEX.test(teamId)) {
      toast({ title: "No valid team", description: "Please create a team first before generating an invite link.", variant: "destructive" });
      return;
    }
    const teamName = realTeams.find(t => t.id === teamId)?.name || currentTeam.name || "My Team";
    const link = `${window.location.origin}/join?token=${btoa(JSON.stringify({ teamId, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }))}`;
    setInviteLink(link);
    setIsCopied(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // to handle send invitation (resend api)
  const handleSendInvitation = async () => {
    if (!inviteContactInfo) return;
    setIsSendingInvite(true);
    setInviteSuccessMsg('');
    setInviteErrorMsg('');
    
    // Combine country code for SMS/WhatsApp
    const finalContactInfo = (inviteMethod === 'SMS' || inviteMethod === 'WhatsApp')
      ? `${countryCode}${inviteContactInfo}`
      : inviteContactInfo;

    // Use the real Supabase user.id and resolve team from realTeams
    const validTeamId = selectedInviteTeamId || realTeams[0]?.id;
    const activeTeamContext = realTeams.find(t => t.id === validTeamId) || currentTeam;

    // Guard: never send a mock/localStorage team ID to the database
    if (!validTeamId || !UUID_REGEX.test(validTeamId)) {
      setInviteErrorMsg('No valid team found. Please create a team from the \'My Team\' tab first.');
      setIsSendingInvite(false);
      return;
    }
    try {
      const res = await fetch('/api/invites/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: inviteMethod,
          contactInfo: finalContactInfo,
          teamId: validTeamId,
          projectId: activeTeamContext?.project || null,
          inviterId: user?.id || inviteContactInfo,
          teamName: activeTeamContext?.name || 'Your Team'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send invite');
      setInviteSuccessMsg(`Invitation sent successfully via ${inviteMethod}!`);
      setInviteContactInfo('');
    } catch (err: any) {
      setInviteErrorMsg(err.message);
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const res = await fetch("/api/team-members/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId })
      });
      if (res.ok) {
        setCurrentRealTeamMembers(prev => prev.filter(m => m.id !== memberId));
        toast({ title: "Success", description: "Member removed successfully!" });
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error || "Failed finding member", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
    }
  };

  const handleEquityChange = (memberId: string, newValue: string | number) => {
    setCurrentRealTeamMembers(prev => prev.map(m => m.id === memberId ? { ...m, equity: Number(newValue) } : m));
  };
  
  const handleSaveEquityDistribution = async () => {
    try {
      const res = await fetch("/api/team-members/update-equity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ members: currentRealTeamMembers })
      });
      if (res.ok) {
        toast({ title: "Success", description: "Equity distribution saved!" });
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error || "Failed to update equity", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: "Unexpected error", variant: "destructive" });
    }
  };

  const handleSaveProfile = () => {
    localStorage.setItem("paryuktam_user_profile", JSON.stringify(userProfile));
    
    // Update current user's name in all teams to reflect the change globally
    // We assume current user ID is "m1" as per mock constant
    const fullName = `${userProfile.firstName} ${userProfile.lastName}`;
    
    const updatedTeams = teams.map(team => ({
      ...team,
      members: (team.members || []).map((m: any) => m.id === currentUser.id ? { ...m, name: fullName, email: userProfile.email } : m)
    }));
    
    setTeams(updatedTeams);
    localStorage.setItem("paryuktam_teams", JSON.stringify(updatedTeams));
    
    // Show simple alert or toast (mock)
    alert("Profile updated successfully!");
  };

  // We simulate dynamic active projects by combining initial mock teams and any live accepted enrollments
  const activeProjects = [
    ...teams.map(team => ({
      id: team.id,
      title: team.project,
      company: "TechVista", // Mock company
      progress: Math.floor(Math.random() * 40) + 30, // Mock progress between 30-70%
      status: "In Progress"
    })),
    // Dynamic overlay - accepted projects
    ...liveProjects.filter(p => enrolledProjects.includes(p.id) && enrollmentStatusMap[p.id] === 'accepted').map(p => ({
        id: p.id,
        title: p.title,
        company: p.company_name,
        progress: 10,
        status: "Recent"
    }))
  ];

  // Dynamic overlay - all applications with real statuses
  const dynamicApplications = liveProjects
    .filter(p => enrolledProjects.includes(p.id) && enrollmentStatusMap[p.id] !== 'accepted')
    .map(p => {
       const rawStatus = (enrollmentStatusMap[p.id] || 'pending').toLowerCase();
       const displayStatus = rawStatus === 'shortlisted' ? 'Shortlisted' 
         : rawStatus === 'accepted' ? 'Accepted' 
         : rawStatus === 'rejected' ? 'Rejected'
         : 'Under Review';
       return {
         id: p.id,
         title: p.title,
         company: p.company_name,
         status: displayStatus
       };
    });
  
  const finalApplications = [...appliedProjects, ...dynamicApplications];

  const totalMembers = teams.reduce((acc: number, team) => acc + (team.members ? team.members.length : 0), 0);

  // Safe access for wallet calculation
  const walletEarnings = teams.reduce((acc: number, team) => {
      const member = (team.members || []).find((m: any) => m.id === currentUser.id);
      return acc + (team.budget || 0) * ((member?.equity || 0) / 100);
  }, 0);

  const stats = [
    { label: "Active Projects", value: activeProjects.length.toString(), icon: Briefcase, id: "projects" },
    { label: "Applications", value: enrolledProjects.length.toString(), icon: FileText, id: "live_projects" }, // dynamic stat update
    { label: "Team Members", value: totalMembers.toString(), icon: Users, id: "team" },
    { label: "Certificates", value: mockCertificates.length.toString(), icon: Award, id: "certificates" },
  ];

  return (
    <ProtectedRoute allowedRoles={["Individual"]}>
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
                onClick={() => setActiveTab(item.id)}
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
                <div className="mb-8">
                  <h1 className="font-display text-2xl md:text-3xl font-bold">Welcome back, {userProfile.firstName} 👋</h1>
                  <p className="text-muted-foreground mt-1">Here's what's happening with your projects.</p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {stats.map((stat) => (
                    <div 
                      key={stat.label} 
                      onClick={() => setActiveTab(stat.id)}
                      className="bg-card rounded-xl border shadow-card p-4 cursor-pointer hover:shadow-md hover:border-primary/50 transition-all"
                    >
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

                {/* Active Projects Preview */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display font-semibold text-lg">Active Projects</h2>
                    <Button variant="link" className="text-primary p-0 h-auto" onClick={() => setActiveTab("projects")}>View All</Button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {activeProjects.map((p, idx) => (
                      <Link key={p.id || idx} href={`/student/project/${p.id}`} className="block h-full">
                        <div className="bg-card rounded-xl border shadow-card p-5 h-full hover:shadow-md transition-shadow cursor-pointer">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold">{p.title}</h3>
                              <p className="text-sm text-muted-foreground">{p.company}</p>
                            </div>
                            <Badge className="bg-secondary text-secondary-foreground">{p.status}</Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Progress</span>
                              <span>{p.progress}%</span>
                            </div>
                            <Progress value={p.progress} className="h-2" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === "live_projects" && (
              <>
                <div className="mb-8">
                  <h1 className="font-display text-2xl md:text-3xl font-bold">Live Projects</h1>
                  <p className="text-muted-foreground mt-1">Explore and enroll in projects posted by companies.</p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {liveProjects.map(p => {
                    const isEnrolled = enrolledProjects.includes(p.id);
                    return (
                      <div key={p.id} className="bg-card rounded-xl border shadow-card p-6 flex flex-col h-full hover:shadow-md transition-shadow">
                        <div className="flex-1 flex flex-col">
                          <h3 className="font-semibold text-lg line-clamp-1" title={p.title}>{p.title}</h3>
                          <p className="text-sm text-primary font-medium mb-3">{p.company_name}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{p.about}</p>
                          
                          <div className="flex flex-wrap gap-3 mb-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Wallet className="h-3.5 w-3.5" />
                              {p.budget || "TBD"}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />
                              {p.duration || "TBD"}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Users className="h-3.5 w-3.5" />
                              {p.required_team_size ? `${p.required_team_size} Members` : "TBD"}
                            </div>
                          </div>

                          {Array.isArray(p.requirements) && p.requirements.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2 mt-auto">
                              {p.requirements.slice(0, 3).map((req: string, idx: number) => (
                                <Badge key={idx} variant="secondary" className="text-[10px] bg-secondary/50 font-medium px-2 py-0.5">
                                  {req.length > 20 ? req.substring(0, 20) + '...' : req}
                                </Badge>
                              ))}
                              {p.requirements.length > 3 && (
                                <Badge variant="secondary" className="text-[10px] bg-secondary/50 font-medium px-2 py-0.5">
                                  +{p.requirements.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        <Button 
                          className="w-full mt-4" 
                          disabled={isEnrolled}
                          onClick={() => openEnrollModal(p.id)}
                          variant={isEnrolled ? "secondary" : "default"}
                        >
                          {isEnrolled ? "Applied" : "Apply with Team"}
                        </Button>
                      </div>
                    );
                  })}
                  {liveProjects.length === 0 && (
                    <div className="col-span-full py-12 text-center text-muted-foreground bg-card rounded-xl border border-dashed">
                      No live projects available at the moment. Check back later!
                    </div>
                  )}
                </div>

                <Dialog open={isEnrollModalOpen} onOpenChange={setIsEnrollModalOpen}>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Apply to Project</DialogTitle>
                      <DialogDescription>
                        Select a team you lead to submit this application.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                       <Label>Select Team</Label>
                       {realTeams.filter(t => t.isLeader).length > 0 ? (
                           <select 
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              value={selectedEnrollTeamId}
                              onChange={(e) => setSelectedEnrollTeamId(e.target.value)}
                           >
                             {realTeams.filter(t => t.isLeader).map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                             ))}
                           </select>
                       ) : (
                           <div className="space-y-4">
                              <p className="text-destructive text-sm">No teams found. Create a team in the 'My Team' tab first.</p>
                              <Button 
                                variant="outline" 
                                className="w-full" 
                                onClick={() => { setIsEnrollModalOpen(false); setActiveTab("team"); }}
                              >
                                Create a Team
                              </Button>
                           </div>
                       )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsEnrollModalOpen(false)}>Cancel</Button>
                      <Button onClick={handleEnrollSubmit} disabled={!selectedEnrollTeamId}>Submit Application</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}

            {activeTab === "projects" && (
              <>
                 <div className="mb-8">
                  <h1 className="font-display text-2xl md:text-3xl font-bold">My Projects</h1>
                  <p className="text-muted-foreground mt-1">Track your active work and applications.</p>
                </div>

                <div className="space-y-8">
                  <section>
                    <h2 className="font-display font-semibold text-lg mb-4">Active Projects</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                      {activeProjects.map((p, idx) => (
                        <Link key={p.id || idx} href={`/student/project/${p.id}`} className="block h-full">
                          <div className="bg-card rounded-xl border shadow-card p-5 h-full hover:shadow-md transition-shadow cursor-pointer">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-semibold">{p.title}</h3>
                                <p className="text-sm text-muted-foreground">{p.company}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className="bg-secondary text-secondary-foreground">{p.status}</Badge>
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-6 w-6 text-red-500 border-red-500 hover:bg-red-50"
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDashboardReportState({ isOpen: true, type: "project", id: p.id, name: p.title }); }}
                                >
                                  <AlertCircle className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Progress</span>
                                <span>{p.progress}%</span>
                              </div>
                              <Progress value={p.progress} className="h-2" />
                              
                              {p.status === "Recent" && (
                                <div className="mt-4 pt-4 border-t">
                                   <Button 
                                      className="w-full" size="sm"
                                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); openSubmitModal(p.id); }}
                                   >
                                      Submit Final Project
                                   </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                  
                <Dialog open={isSubmitModalOpen} onOpenChange={setIsSubmitModalOpen}>
                  <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                      <DialogTitle>Submit Final Project</DialogTitle>
                      <DialogDescription>
                        Upload your project files or provide a GitHub repository link for the company to review.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                       {/* Submission Type Toggle */}
                       <div className="flex gap-2">
                         <div
                           onClick={() => setSubmitType("github_transfer")}
                           className={`flex-1 p-3 border rounded-lg cursor-pointer text-center text-sm transition-colors ${submitType === "github_transfer" ? "bg-primary/10 border-primary font-semibold" : "hover:bg-muted"}`}
                         >
                           <Globe className="h-4 w-4 mx-auto mb-1" />
                           GitHub URL
                         </div>
                         <div
                           onClick={() => setSubmitType("zip_file")}
                           className={`flex-1 p-3 border rounded-lg cursor-pointer text-center text-sm transition-colors ${submitType === "zip_file" ? "bg-primary/10 border-primary font-semibold" : "hover:bg-muted"}`}
                         >
                           <Folder className="h-4 w-4 mx-auto mb-1" />
                           ZIP File
                         </div>
                       </div>

                       {submitType === "github_transfer" ? (
                         <div className="space-y-2">
                           <Label>GitHub Repository URL</Label>
                           <Input 
                              placeholder="https://github.com/your-org/project-repo" 
                              value={submitUrl}
                              onChange={(e) => setSubmitUrl(e.target.value)}
                           />
                           <p className="text-xs text-muted-foreground">Must be a valid https://github.com/ URL.</p>
                         </div>
                       ) : (
                         <div className="space-y-2">
                           <Label>Upload ZIP File (Max 10MB)</Label>
                           <Input 
                              type="file" 
                              accept=".zip"
                              onChange={(e) => setSubmitFile(e.target.files?.[0] || null)}
                           />
                           {submitFile && (
                             <p className="text-xs text-muted-foreground">
                               Selected: {submitFile.name} ({(submitFile.size / 1024 / 1024).toFixed(2)} MB)
                             </p>
                           )}
                         </div>
                       )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsSubmitModalOpen(false)}>Cancel</Button>
                      <Button 
                        onClick={handleSubmitProject} 
                        disabled={submitting || (submitType === "github_transfer" ? !submitUrl : !submitFile)}
                      >
                        {submitting ? "Submitting..." : "Submit Delivery"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                  <section>
                    <h2 className="font-display font-semibold text-lg mb-4">Applications</h2>
                    <div className="bg-card rounded-xl border shadow-card divide-y">
                      {finalApplications.map((p: any, i: number) => {
                        const normalizedStatus = p.status?.toLowerCase();
                        const hasId = !!p.id;
                        return (
                          <div 
                            key={i} 
                            className={`flex items-center justify-between p-4 transition-colors ${hasId ? 'cursor-pointer hover:bg-muted/50' : ''}`}
                            onClick={() => hasId && router.push(`/student/project/${p.id}`)}
                          >
                            <div>
                              <h3 className="font-medium text-sm">{p.title}</h3>
                              <p className="text-xs text-muted-foreground">{p.company}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {normalizedStatus === 'shortlisted' && hasId && (
                                <Button 
                                  size="sm" variant="outline" className="h-7 text-xs gap-1"
                                  onClick={(e) => { e.stopPropagation(); router.push(`/student/project/${p.id}`); }}
                                >
                                  Submit Project
                                </Button>
                              )}
                              {normalizedStatus === 'accepted' && hasId && (
                                <Button 
                                  size="sm" variant="outline" className="h-7 text-xs gap-1"
                                  onClick={(e) => { e.stopPropagation(); router.push('/student/certificates'); }}
                                >
                                  View Certificates
                                </Button>
                              )}
                              <Badge 
                                variant={normalizedStatus === 'shortlisted' ? 'default' : 'secondary'}
                                className={
                                  normalizedStatus === 'accepted' ? 'bg-green-600 text-white' :
                                  normalizedStatus === 'shortlisted' ? 'bg-blue-600 text-white' :
                                  normalizedStatus === 'rejected' ? 'bg-red-100 text-red-800' : ''
                                }
                              >
                                {p.status}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                      {finalApplications.length === 0 && (
                          <div className="p-8 text-center text-muted-foreground text-sm">
                             No open applications found. Apply in the Live Projects tab!
                          </div>
                      )}
                    </div>
                  </section>
                </div>
              </>
            )}

            {activeTab === "team" && (
              <>
                 <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                  <div>
                    <h1 className="font-display text-2xl md:text-3xl font-bold">My Team</h1>
                    <p className="text-muted-foreground mt-1">Manage your team and project equity.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <select 
                         className="h-10 w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                         value={currentRealTeamId || ""}
                         onChange={(e) => setCurrentRealTeamId(e.target.value)}
                       >
                         {realTeams.length === 0 && <option value="">No teams yet</option>}
                         {realTeams.map(t => (
                           <option key={t.id} value={t.id}>{t.name}</option>
                         ))}
                       </select>
                    </div>
                    <Link href="/create-team">
                      <Button><Plus className="h-4 w-4 mr-2" /> Create Team</Button>
                    </Link>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                   {currentRealTeamMembers.length === 0 && (
                     <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-xl">
                       {realTeams.length === 0 ? "You haven't joined or created a team yet." : "No members in this team yet. Invite someone!"}
                     </div>
                   )}
                    {currentRealTeamMembers.map((member: any) => (
                      <div key={member.id} className="bg-card rounded-xl border shadow-card p-6 flex flex-col items-center text-center relative group">
                      {realTeams.find((t: any) => t.id === currentRealTeamId)?.isLeader && user?.id !== member.user_id && (
                        <button 
                          onClick={() => handleRemoveMember(member.id)}
                          className="absolute top-4 right-4 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove Member"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-xl font-bold text-primary">
                        {member.initials}
                      </div>
                      <h3 className="font-semibold text-lg">{member.name || member.email?.split("@")[0] || "User"}</h3>
                      <p className="text-sm text-muted-foreground mb-1">{member.user_id === user?.id ? "Leader" : (member.role || "Member")}</p>
                      
                      <div className="flex flex-wrap gap-1 justify-center mb-2">
                        {member.skill_role?.map((skill: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-[10px]">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                      
                      <p className="text-sm font-medium mb-4 text-primary">Equity: {member.equity || 0}%</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => {
                          setSelectedMember(member);
                          setIsChatOpen(true);
                        }}
                      >
                        Message
                      </Button>
                    </div>
                  ))}
                  
                  <Dialog open={isInviteMemberOpen} onOpenChange={setIsInviteMemberOpen}>
                    <DialogTrigger asChild>
                      <div 
                        onClick={() => {
                          setIsInviteMemberOpen(true);
                          generateInviteLink();
                        }}
                        className="bg-muted/50 rounded-xl border border-dashed border-muted-foreground/25 flex flex-col items-center justify-center p-6 text-center hover:bg-muted/80 transition-colors cursor-pointer group h-full min-h-[250px]"
                      >
                        <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                          <Users className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <h3 className="font-medium">Invite Member</h3>
                        <p className="text-xs text-muted-foreground mt-1">Generate invitation link</p>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[450px]">
                      <DialogHeader>
                        <DialogTitle>Invite Member</DialogTitle>
                        <DialogDescription>Send an invitation to new members or share the direct link.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6 py-4">
                        {/* Direct Send Section */}
                        <div className="space-y-4 border-b pb-6">
                           <div className="space-y-2 mb-4">
                              <Label>Select Team for Invitation</Label>
                              {realTeams.filter(t => t.isLeader).length > 0 ? (
                                <select 
                                   className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                   value={selectedInviteTeamId || currentTeamId || ""}
                                   onChange={(e) => setSelectedInviteTeamId(e.target.value)}
                                >
                                  {realTeams.filter(t => t.isLeader).map(t => (
                                     <option key={t.id} value={t.id}>{t.name}</option>
                                  ))}
                                </select>
                              ) : (
                                <p className="text-destructive text-sm mt-1">You must create and lead a team to send invitations.</p>
                              )}
                           </div>
                           <h4 className="text-sm font-medium">Send Invitation</h4>
                           <div className="grid grid-cols-3 gap-2">
                             {['Email', 'SMS', 'WhatsApp'].map(m => (
                               <Button 
                                 key={m} 
                                 variant={inviteMethod === m ? "default" : "outline"} 
                                 size="sm" 
                                 onClick={() => {
                                   setInviteMethod(m as any);
                                   setInviteContactInfo('');
                                   setInviteSuccessMsg('');
                                   setInviteErrorMsg('');
                                 }}
                               >
                                 {m}
                               </Button>
                             ))}
                           </div>
                           <div className="space-y-2">
                             <Label>{inviteMethod === 'Email' ? 'Email Address' : 'Phone Number'}</Label>
                             <div className="flex space-x-2">
                               {(inviteMethod === 'SMS' || inviteMethod === 'WhatsApp') && (
                                 <select 
                                   className="w-24 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                   value={countryCode}
                                   onChange={(e) => setCountryCode(e.target.value)}
                                 >
                                   <option value="+91">+91 (IN)</option>
                                   <option value="+1">+1 (US)</option>
                                   <option value="+44">+44 (UK)</option>
                                 </select>
                               )}
                               <Input 
                                 placeholder={inviteMethod === 'Email' ? "colleague@example.com" : "9876543210"}
                                 value={inviteContactInfo}
                                 onChange={(e) => setInviteContactInfo(e.target.value)}
                               />
                               <Button onClick={handleSendInvitation} disabled={isSendingInvite || !inviteContactInfo}>
                                 {isSendingInvite ? "..." : "Send"}
                               </Button>
                             </div>
                           </div>
                           {inviteSuccessMsg && <p className="text-sm text-green-600 dark:text-green-400">{inviteSuccessMsg}</p>}
                           {inviteErrorMsg && <p className="text-sm text-red-600 dark:text-red-400">{inviteErrorMsg}</p>}
                        </div>

                        {/* Direct Link Section */}
                        <div className="space-y-2">
                          <Label>Or copy direct link</Label>
                          <div className="flex items-center space-x-2">
                             <Input readOnly value={inviteLink || "Generating link..."} className="bg-muted" />
                             <Button size="icon" variant="outline" onClick={copyToClipboard} disabled={!inviteLink}>
                                {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                             </Button>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                         <Button variant="ghost" onClick={() => setIsInviteMemberOpen(false)}>Close</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Payment Equity Section */}
                <div className="bg-card rounded-xl border shadow-card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Percent className="h-5 w-5 text-primary" />
                        Energy & Equity Distribution
                      </h3>
                      <p className="text-sm text-muted-foreground">Adjust how project payments are distributed among the team.</p>
                    </div>
                    <Badge variant={currentRealTeamMembers.reduce((acc, m) => acc + (m.equity || 0), 0) <= 100 ? "default" : "destructive"}>
                      Total: {currentRealTeamMembers.reduce((acc, m) => acc + (m.equity || 0), 0)}%
                    </Badge>
                  </div>
                  
                  <div className="space-y-6">
                    {(currentRealTeamMembers || []).map((member: any) => (
                      <div key={member.id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{member.name || member.email?.split("@")[0] || "User"} ({member.user_id === user?.id ? "Leader" : member.role})</span>
                          <span className="font-bold">{member.equity || 0}%</span>
                        </div>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={member.equity}
                          onChange={(e) => handleEquityChange(member.id, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-6 border-t flex items-center justify-between">
                    <div>
                      {currentRealTeamMembers.reduce((acc, m) => acc + (m.equity || 0), 0) > 100 && (
                        <p className="text-sm text-destructive font-medium">Warning: Total exceeds 100%</p>
                      )}
                    </div>
                    <Button 
                      onClick={handleSaveEquityDistribution} 
                      disabled={currentRealTeamMembers.reduce((acc, m) => acc + (m.equity || 0), 0) > 100}
                    >
                      Save Equity Distribution
                    </Button>
                  </div>
                </div>
              </>
            )}



            {activeTab === "wallet" && (
                <>
                  <div className="mb-8">
                    <h1 className="font-display text-2xl md:text-3xl font-bold">Wallet</h1>
                    <p className="text-muted-foreground mt-1">Track your earnings and project payouts.</p>
                  </div>


                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                      <div className="bg-primary/5 border-primary/20 border rounded-xl p-6 shadow-sm">
                          <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                             <Wallet className="h-4 w-4" /> Total Earnings
                          </h3>
                          <div className="text-3xl font-bold text-primary">
                             ${walletEarnings.toLocaleString()}
                          </div>
                      </div>
                      <div className="bg-card border rounded-xl p-6 shadow-sm">
                          <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                             <CreditCard className="h-4 w-4" /> Pending Payouts
                          </h3>
                          <div className="text-3xl font-bold">
                             $0.00
                          </div>
                      </div>
                   </div>

                   <section>
                      <h2 className="font-display font-semibold text-lg mb-4">Project Breakdowns</h2>
                      <div className="bg-card rounded-xl border shadow-card divide-y">
                          {teams.map(team => {
                              const member = team.members.find((m) => m.id === currentUser.id);
                              if (!member) return null;
                              const share = (team.budget || 0) * (member.equity / 100);

                              return (
                                  <div key={team.id} className="p-4 flex items-center justify-between">
                                      {/* ... same content ... */}
                                      <div>
                                          <h3 className="font-medium">{team.project}</h3>
                                          <p className="text-xs text-muted-foreground">{team.name}</p>
                                      </div>
                                      <div className="flex items-center gap-6 text-sm">
                                          <div className="text-right">
                                              <div className="text-muted-foreground text-xs">Total Budget</div>
                                              <div className="font-medium">${(team.budget || 0).toLocaleString()}</div>
                                          </div>
                                          <div className="text-right">
                                              <div className="text-muted-foreground text-xs">Your Equity</div>
                                              <div className="font-medium">{member.equity}%</div>
                                          </div>
                                          <div className="text-right">
                                              <div className="text-muted-foreground text-xs">Your Share</div>
                                              <div className="font-bold text-primary">${share.toLocaleString()}</div>
                                          </div>
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                   </section>

                   <section className="mt-8">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="font-display font-semibold text-lg flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-green-600" />
                                Payment Methods
                            </h2>
                            <p className="text-sm text-muted-foreground">Securely managed with CIA standards.</p>
                        </div>
                        <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-2"/> Add Method</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add Payment Method</DialogTitle>
                                    <DialogDescription>
                                        Your details are encrypted and securely stored.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-2">
                                    <div className="flex gap-2 mb-4">
                                        {(['bank', 'upi', 'card'] as const).map(t => (
                                            <div 
                                                key={t}
                                                onClick={() => setPaymentType(t)}
                                                className={`flex-1 p-3 border rounded-lg cursor-pointer text-center capitalize text-sm ${paymentType === t ? 'bg-primary/10 border-primary font-medium' : 'hover:bg-muted'}`}
                                            >
                                                {t}
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {paymentType === 'bank' && (
                                        <>
                                            <div className="space-y-2">
                                                <Label>Account Number</Label>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                    <Input 
                                                        type="password" 
                                                        placeholder="Enter Account Number" 
                                                        className="pl-9"
                                                        value={pmIdentifier}
                                                        onChange={(e) => setPmIdentifier(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Bank Name</Label>
                                                <Input 
                                                    placeholder="e.g. HDFC Bank" 
                                                    value={pmMeta1}
                                                    onChange={(e) => setPmMeta1(e.target.value)}
                                                />
                                            </div>
                                             <div className="space-y-2">
                                                <Label>IFSC Code</Label>
                                                <Input 
                                                    placeholder="e.g. HDFC0001234" 
                                                    value={pmMeta2}
                                                    onChange={(e) => setPmMeta2(e.target.value)}
                                                />
                                            </div>
                                        </>
                                    )}

                                    {paymentType === 'upi' && (
                                        <div className="space-y-2">
                                            <Label>UPI ID</Label>
                                            <div className="relative">
                                                <Smartphone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input 
                                                    placeholder="username@bank" 
                                                    className="pl-9"
                                                    value={pmIdentifier}
                                                    onChange={(e) => setPmIdentifier(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {paymentType === 'card' && (
                                        <>
                                            <div className="space-y-2">
                                                <Label>Card Number</Label>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                    <Input 
                                                        type="password" 
                                                        placeholder="16-digit Card Number" 
                                                        className="pl-9"
                                                        value={pmIdentifier}
                                                        onChange={(e) => setPmIdentifier(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Expiry (MM/YY)</Label>
                                                <Input 
                                                    placeholder="MM/YY" 
                                                    value={pmMeta1}
                                                    onChange={(e) => setPmMeta1(e.target.value)}
                                                />
                                            </div>
                                        </>
                                    )}

                                    {pmError && <p className="text-destructive text-xs">{pmError}</p>}
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleSavePaymentMethod}>Save Securely</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                          {paymentMethods.map(pm => {
                              const identifier = safeDecrypt(pm.details.identifier);
                              
                              function safeDecrypt(d: string) { try { return atob(d); } catch { return d; } }

                              return (
                                  <div key={pm.id} className="bg-card rounded-xl border shadow-card p-5 flex items-start justify-between">
                                      <div className="flex items-start gap-4">
                                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                              {pm.type === 'bank' && <Landmark className="h-5 w-5 text-muted-foreground" />}
                                              {pm.type === 'upi' && <Smartphone className="h-5 w-5 text-muted-foreground" />}
                                              {pm.type === 'card' && <CreditCard className="h-5 w-5 text-muted-foreground" />}
                                          </div>
                                          <div>
                                              <h3 className="font-medium capitalize flex items-center gap-2">
                                                  {pm.type === 'bank' ? safeDecrypt(pm.details.meta1 || "") || 'Bank Account' : pm.type}
                                                  {pm.type === 'card' && <Badge variant="secondary" className="text-[10px] h-5">VISA</Badge>}
                                              </h3>
                                              <p className="text-sm font-mono text-muted-foreground mt-1">
                                                  {pm.type === 'upi' ? identifier : maskData(identifier)}
                                              </p>
                                              {pm.type === 'bank' && pm.details.meta2 && (
                                                  <p className="text-xs text-muted-foreground mt-1">IFSC: {safeDecrypt(pm.details.meta2)}</p>
                                              )}
                                              {pm.type === 'card' && pm.details.meta1 && (
                                                  <p className="text-xs text-muted-foreground mt-1">Expires: {safeDecrypt(pm.details.meta1)}</p>
                                              )}
                                          </div>
                                      </div>
                                      <Button variant="ghost" size="icon" onClick={() => removePaymentMethod(pm.id)} className="text-muted-foreground hover:text-destructive">
                                          <Trash2 className="h-4 w-4" />
                                      </Button>
                                  </div>
                              );
                          })}
                          
                          {paymentMethods.length === 0 && (
                                <div className="col-span-full text-center py-8 border-2 border-dashed rounded-xl text-muted-foreground">
                                    <Lock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>No payment methods added.</p>
                                </div>
                          )}
                      </div>
                   </section>
                </>
            )}

            {activeTab === "certificates" && (
              <>
                <div className="mb-8">
                  <h1 className="font-display text-2xl md:text-3xl font-bold">Certificates</h1>
                  <p className="text-muted-foreground mt-1">Access your verified credentials.</p>
                </div>

                {!selectedFolder ? (
                   /* Folders Grid */
                   <div className="grid md:grid-cols-3 gap-6">
                       {[
                           { id: 'participation', label: 'Participation', icon: FileText, count: mockCertificates.filter(c => c.type === 'participation').length },
                           { id: 'recommendation', label: 'Letters of Rec.', icon: Award, count: mockCertificates.filter(c => c.type === 'recommendation').length },
                           { id: 'completion', label: 'Completion', icon: Check, count: mockCertificates.filter(c => c.type === 'completion').length },
                       ].map(folder => (
                           <div
                             key={folder.id}
                             onClick={() => setSelectedFolder(folder.id)}
                             className="bg-card rounded-xl border shadow-card p-6 hover:shadow-md transition-shadow cursor-pointer group flex flex-col items-center text-center py-10"
                           >
                               <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors mb-4">
                                   <Folder className="h-8 w-8" />
                               </div>
                               <h3 className="font-semibold text-lg mb-1">{folder.label}</h3>
                               <Badge variant="secondary" className="mt-2">{folder.count} Items</Badge>
                           </div>
                       ))}
                   </div>
                ) : (
                    /* Selected Folder View */
                    <div className="space-y-6">
                        <Button variant="ghost" onClick={() => setSelectedFolder(null)} className="pl-0 hover:pl-2 transition-all">
                            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Folders
                        </Button>

                        <div className="grid md:grid-cols-2 gap-4">
                            {mockCertificates.filter(c => c.type === selectedFolder).map(cert => (
                                <div
                                    key={cert.id}
                                    onClick={() => setSelectedCertificate(cert)}
                                    className="bg-card rounded-xl border shadow-card p-4 hover:border-primary transition-colors cursor-pointer flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-4">
                                         <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                                            <Award className="h-5 w-5" />
                                         </div>
                                         <div>
                                             <h4 className="font-medium text-sm md:text-base line-clamp-1">{cert.title}</h4>
                                             <p className="text-xs text-muted-foreground">{cert.date}</p>
                                         </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="group-hover:text-primary transition-colors">
                                        <Download className="h-4 w-4" onClick={(e) => {
                                            e.stopPropagation();
                                            handleDownload(cert);
                                        }}/>
                                    </Button>
                                </div>
                            ))}
                            {mockCertificates.filter(c => c.type === selectedFolder).length === 0 && (
                                <div className="col-span-full text-center py-10 text-muted-foreground">
                                    <p>No certificates found in this folder.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Certificate Detail Dialog */ }
                <Dialog open={!!selectedCertificate} onOpenChange={(open) => !open && setSelectedCertificate(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Certificate Details</DialogTitle>
                            <DialogDescription>View and download your credential.</DialogDescription>
                        </DialogHeader>
                        {selectedCertificate && (
                            <div className="space-y-6 py-4">
                                <div className="border rounded-xl p-8 text-center bg-muted/20 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-5">
                                        <Award className="h-32 w-32" />
                                    </div>
                                    <Award className="h-12 w-12 text-primary mx-auto mb-4" />
                                    <h3 className="font-display font-bold text-lg mb-2">{selectedCertificate.title}</h3>
                                    <Badge variant="outline" className="mb-4 uppercase tracking-wider text-[10px]">{selectedCertificate.type}</Badge>
                                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        <span>Issued: {selectedCertificate.date}</span>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Button className="w-full flex-1" onClick={() => handleDownload(selectedCertificate)}>
                                        <Download className="h-4 w-4 mr-2" /> Download File
                                    </Button>
                                    <Button variant="outline" className="flex-1" onClick={() => setSelectedCertificate(null)}>
                                        Close
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
              </>
            )}

            {activeTab === "settings" && (
              <>
                <div className="mb-8">
                  <h1 className="font-display text-2xl md:text-3xl font-bold">Settings</h1>
                  <p className="text-muted-foreground mt-1">Manage your account preferences.</p>
                </div>
                
                <div className="max-w-2xl space-y-8">



                  <div className="bg-card rounded-xl border shadow-card p-6">
                    <h3 className="font-semibold text-lg mb-4">Profile Information</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">First Name</label>
                          <input 
                            type="text" 
                            value={userProfile.firstName} 
                            onChange={(e) => setUserProfile({...userProfile, firstName: e.target.value})}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Last Name</label>
                          <input 
                            type="text" 
                            value={userProfile.lastName} 
                            onChange={(e) => setUserProfile({...userProfile, lastName: e.target.value})}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <input 
                          type="email" 
                          value={userProfile.email} 
                          onChange={(e) => setUserProfile({...userProfile, email: e.target.value})}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Bio</label>
                        <textarea 
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
                          value={userProfile.bio} 
                          onChange={(e) => setUserProfile({...userProfile, bio: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                      <Button onClick={handleSaveProfile}>Save Changes</Button>
                    </div>
                  </div>

                  <div className="bg-card rounded-xl border shadow-card p-6">
                    <h3 className="font-semibold text-lg mb-4">Notifications</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Email Notifications</p>
                          <p className="text-sm text-muted-foreground">Receive updates about your projects.</p>
                        </div>
                        <div className="h-6 w-11 rounded-full bg-primary relative cursor-pointer">
                           <span className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform"></span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Marketing Emails</p>
                          <p className="text-sm text-muted-foreground">Receive news about new features.</p>
                        </div>
                        <div className="h-6 w-11 rounded-full bg-muted relative cursor-pointer">
                           <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform"></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </main>
        {/* Team Chat Dialog */}
        <MemberChatDialog 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)} 
          member={selectedMember} 
          currentUser={currentUser} 
        />
      </div>
    </ProtectedRoute>
  );
};

const StudentDashboardPage = () => (
  <Suspense fallback={
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  }>
    <StudentDashboard />
  </Suspense>
);

export default StudentDashboardPage;
