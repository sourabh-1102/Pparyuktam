"use client";

import { useEffect, useState } from "react";
import DataTable from "@/components/admin/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function AdminProjectsPage() {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState("All");
    const { toast } = useToast();

    const fetchProjects = async () => {
        try {
            const res = await fetch("/api/admin/projects");
            if (res.ok) {
                const data = await res.json();
                setProjects(data.projects || []);
            }
        } catch (error) {
            console.error("Failed to fetch projects:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();

        const channel = supabase.channel("admin-projects")
          .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, () => fetchProjects())
          .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const handleDeleteProject = async (projectId: string) => {
        const confirmed = window.confirm("Are you sure you want to delete this project? This will erase all underlying applications.");
        if (!confirmed) return;

        try {
            const res = await fetch("/api/admin/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetProjectId: projectId, action: "delete" })
            });

            if (res.ok) {
                toast({ title: "Project Deleted" });
                setProjects(prev => prev.filter(p => p.id !== projectId));
            } else {
                const err = await res.json();
                toast({ title: "Error", description: err.error, variant: "destructive" });
            }
        } catch (error: any) {
             toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleToggleApproval = async (projectId: string, currentVal: boolean) => {
        try {
            const res = await fetch("/api/admin/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    targetProjectId: projectId, 
                    action: "update_approval", 
                    payload: { is_approved: !currentVal } 
                })
            });

            if (res.ok) {
                toast({ title: "Project " + (!currentVal ? "Approved" : "Unapproved") });
                setProjects(prev => prev.map(p => p.id === projectId ? { ...p, is_approved: !currentVal } : p));
            } else {
                const err = await res.json();
                toast({ title: "Error", description: err.error, variant: "destructive" });
            }
        } catch (error: any) {
             toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    }

    const filteredProjects = projects.filter(p => filterStatus === "All" || p.status === filterStatus);

    const columns = [
        { 
            header: "Company", 
            accessor: (row: any) => (
                <div>
                   <div className="font-semibold text-slate-900 dark:text-white">
                     {row.profiles?.company_name || row.company_name || row.profiles?.full_name || "Unknown"}
                   </div>
                   <div className="text-xs text-slate-500">{row.profiles?.email || "Unknown Contact"}</div>
                </div>
            ) 
        },
        { 
            header: "Project Title", 
            accessor: (row: any) => (
               <div className="font-medium max-w-[250px] truncate" title={row.title}>{row.title}</div>
            )
        },
        { 
            header: "Status", 
            accessor: (row: any) => (
               <Badge variant={row.status === "open" ? "default" : (row.status === "completed" ? "secondary" : "outline")}>
                   {row.status || "open"}
               </Badge>
            )
        },
        { 
            header: "Approved / Live", 
            accessor: (row: any) => (
                <div className="flex items-center gap-2">
                    <Switch 
                       checked={Boolean(row.is_approved)}
                       onCheckedChange={() => handleToggleApproval(row.id, Boolean(row.is_approved))}
                    />
                    <span className="text-sm font-medium">{row.is_approved ? "Yes" : "No"}</span>
                </div>
            )
        },
        {
            header: "Actions",
            accessor: (row: any) => (
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive hover:text-white h-8 w-8 p-0" onClick={() => handleDeleteProject(row.id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )
        }
    ];

    if (loading) return <div className="animate-pulse h-64 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                   <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Project Moderation</h1>
                   <p className="text-slate-500 mt-1">Approve or reject projects posted by companies.</p>
                </div>
            </div>

            <div className="flex bg-white dark:bg-slate-900 p-4 rounded-xl border shadow-sm">
                 <div className="flex gap-2 w-full md:w-auto">
                    {["All", "open", "in_progress", "completed"].map(status => (
                        <Button 
                           key={status} 
                           variant={filterStatus === status ? "default" : "outline"}
                           onClick={() => setFilterStatus(status)}
                           className="flex-1 md:flex-none capitalize"
                        >
                            {status.replace("_", " ")}
                        </Button>
                    ))}
                </div>
            </div>

            <DataTable columns={columns} data={filteredProjects} keyExtractor={(row) => row.id} />
        </div>
    );
}
