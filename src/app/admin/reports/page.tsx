"use client";

import { useEffect, useState } from "react";
import DataTable from "@/components/admin/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function AdminReportsPage() {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState("All");
    const { toast } = useToast();

    const fetchReports = async () => {
        try {
            const res = await fetch("/api/admin/reports");
            if (res.ok) {
                const data = await res.json();
                setReports(data.reports || []);
            }
        } catch (error) {
            console.error("Failed to fetch reports:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();

        const channel = supabase.channel("admin-reports")
          .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, () => fetchReports())
          .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const handleResolve = async (id: string) => {
        try {
            const res = await fetch("/api/admin/reports", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetReportId: id, action: "override_status", status: "Resolved" })
            });

            if (res.ok) {
                toast({ title: "Report marked as resolved" });
                setReports(prev => prev.map(r => r.id === id ? { ...r, status: "Resolved" } : r));
            } else {
                const err = await res.json();
                toast({ title: "Error", description: err.error, variant: "destructive" });
            }
        } catch (error: any) {
             toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const columns = [
        { 
            header: "Reporter", 
            accessor: (row: any) => (
                <div>
                   <div className="font-semibold text-slate-900 dark:text-white">{row.profiles?.full_name || "Unknown User"}</div>
                   <div className="text-xs text-slate-500">{row.profiles?.email || "No Email"}</div>
                </div>
            ) 
        },
        { 
            header: "Reported Asset", 
            accessor: (row: any) => (
                <div>
                   <div className="font-semibold text-slate-900 dark:text-white">{row.reported_entity || row.target || "Unknown"}</div>
                   <div className="text-xs text-slate-500">{row.type || "Resource"}</div>
                </div>
            ) 
        },
        { 
            header: "Reason", 
            accessor: "reason"
        },
        { 
            header: "Status", 
            accessor: (row: any) => (
               <Badge variant={row.status === "resolved" ? "secondary" : "destructive"}>
                   {row.status || "open"}
               </Badge>
            )
        },
        {
            header: "Actions",
            accessor: (row: any) => (
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleResolve(row.id)} disabled={row.status === "resolved"}>Mark Resolved</Button>
                </div>
            )
        }
    ];

    const filteredReports = reports.filter(r => {
        if (filterType === "All") return true;
        const currentStatus = r.status; 
        if (filterType === "Pending") return currentStatus === "Pending";
        if (filterType === "Resolved") return currentStatus === "Resolved";
        return true;
    });

    if (loading) return <div className="animate-pulse h-64 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                   <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Dispute & Report Center</h1>
                   <p className="text-slate-500 mt-1">Review flagged users and resolve platform disputes.</p>
                </div>
            </div>

            <div className="flex bg-white dark:bg-slate-900 p-4 rounded-xl border shadow-sm">
                 <div className="flex gap-2 w-full md:w-auto">
                    {["All", "Pending", "Resolved"].map(t => (
                        <Button 
                           key={t} 
                           variant={filterType === t ? "default" : "outline"}
                           onClick={() => setFilterType(t)}
                           className="flex-1 md:flex-none py-1 h-8"
                        >
                            {t}
                        </Button>
                    ))}
                </div>
            </div>

            {filteredReports.length === 0 ? (
                <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-xl border shadow-sm text-slate-500">
                    No reports match this filter.
                </div>
            ) : (
                <DataTable columns={columns} data={filteredReports} keyExtractor={(row) => row.id} />
            )}
        </div>
    );
}
