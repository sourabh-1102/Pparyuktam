"use client";

import { useEffect, useState } from "react";
import DataTable from "@/components/admin/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function AdminApplicationsPage() {
const [applications, setApplications] = useState<any[]>([]);
const [loading, setLoading] = useState(true);
const [filterStatus, setFilterStatus] = useState("All");
const { toast } = useToast();

const fetchApps = async () => {
try {
const res = await fetch("/api/admin/applications");
if (res.ok) {
const data = await res.json();
setApplications(data.applications || []);
}
}catch (error) {
console.error("Failed to fetch applications:", error);
} finally {
setLoading(false);
}
};

    useEffect(() => {
    fetchApps();

    const channel = supabase.channel("admin-applications")
    .on("postgres_changes", { event: "*", schema: "public", table: "project_applications" }, () => fetchApps())
    .subscribe();
    return () => { supabase.removeChannel(channel); };
    }, []);

const handleOverrideStatus = async (appId: string, newStatus: string) => {
    try {
    const res = await fetch("/api/admin/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetApplicationId: appId, action: "override_status", status: newStatus })
    });

    if (res.ok) {
    toast({ title: "Status Overruled to " + newStatus });
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
    } else {
    const err = await res.json();
    toast({ title: "Error", description: err.error, variant: "destructive" });
    }
    } catch (error: any) {
    toast({ title: "Error", description: error.message, variant: "destructive" });
    }
};

const filtered = applications.filter(a => filterStatus === "All" || a.status === filterStatus);

const columns = [
    { 
    header: "Project", 
    accessor: (row: any) => (
    <div className="font-semibold text-slate-900 dark:text-white max-w-[200px] truncate" title={row.projects?.title}>
    {row.projects?.title || row.project_id}
    </div>
    ) 
    },
{ 
header: "Team Name", 
accessor: (row: any) => row.teams?.name || row.team_id
},
{ 
header: "Members", 
accessor: (row: any) => (
<div className="text-xs text-slate-500 max-w-[200px] truncate">
{row.teams?.team_members?.map((m: any) => m.name).join(", ") || "Unknown Members"}
</div>
)
},

{ 
header: "Status", 
accessor: (row: any) => (
<Badge variant={row.status === "accepted" ? "default" : (row.status === "rejected" ? "destructive" : "secondary")}>
{row.status || "pending"}
</Badge>
)
},

{
header: "Admin Override",
accessor: (row: any) => (
<div className="flex gap-2">
<Button variant="outline" size="sm" onClick={() => handleOverrideStatus(row.id, "accepted")} disabled={row.status === "accepted"}>Accept</Button>
<Button variant="outline" size="sm" className="text-destructive border-destructive" onClick={() => handleOverrideStatus(row.id, "rejected")} disabled={row.status === "rejected"}>Reject</Button>
</div>
)
}
];

    if (loading) return <div className="animate-pulse h-64 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                   <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Application Monitoring</h1>
                   <p className="text-slate-500 mt-1">Monitor pipeline state and issue administrative overrides.</p>
                </div>
            </div>

            <div className="flex bg-white dark:bg-slate-900 p-4 rounded-xl border shadow-sm">
                 <div className="flex gap-2 w-full md:w-auto">
                    {["All", "pending", "shortlisted", "accepted", "rejected"].map(status => (
                        <Button 
                           key={status} 
                           variant={filterStatus === status ? "default" : "outline"}
                           onClick={() => setFilterStatus(status)}
                           className="flex-1 md:flex-none capitalize"
                        >
                            {status}
                        </Button>
                    ))}
                </div>
            </div>

            <DataTable columns={columns} data={filtered} keyExtractor={(row) => row.id} />
        </div>
    );
}
