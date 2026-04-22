"use client";

import { useEffect, useState } from "react";
import DataTable from "@/components/admin/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Link as LinkIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function AdminCertificatesPage() {
    const [certificates, setCertificates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState("All");
    const { toast } = useToast();

    const fetchCertifs = async () => {
        try {
            const res = await fetch("/api/admin/certificates");
            if (res.ok) {
                const data = await res.json();
                setCertificates(data.certificates || []);
            }
        } catch (error) {
            console.error("Failed to fetch certificates:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCertifs();

        const channel = supabase.channel("admin-certificates")
          .on("postgres_changes", { event: "*", schema: "public", table: "certificates" }, () => fetchCertifs())
          .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const handleDeleteCertificate = async (id: string) => {
        const confirmed = window.confirm("Delete this certificate permanently?");
        if (!confirmed) return;

        try {
            const res = await fetch("/api/admin/certificates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetCertificateId: id, action: "delete" })
            });

            if (res.ok) {
                toast({ title: "Certificate Deleted" });
                setCertificates(prev => prev.filter(c => c.id !== id));
            } else {
                const err = await res.json();
                toast({ title: "Error", description: err.error, variant: "destructive" });
            }
        } catch (error: any) {
             toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const filtered = certificates.filter(c => filterType === "All" || c.type === filterType);

    const columns = [
        { 
            header: "Recipient", 
            accessor: (row: any) => (
                <div>
                   <div className="font-semibold text-slate-900 dark:text-white">
                     {row.profiles?.full_name || "Unknown"}
                   </div>
                   <div className="text-xs text-slate-500">{row.profiles?.email}</div>
                </div>
            ) 
        },
        { 
            header: "Project", 
            accessor: (row: any) => row.projects?.title || "Unknown Project"
        },
        { 
            header: "Type", 
            accessor: (row: any) => (
               <Badge variant={row.type === "Letter of Acceptance" ? "default" : "secondary"}>
                   {row.type}
               </Badge>
            )
        },
        { 
            header: "Issued Date", 
            accessor: (row: any) => new Date(row.issue_date || row.created_at).toLocaleDateString()
        },
        {
            header: "Actions",
            accessor: (row: any) => (
                <div className="flex gap-2 items-center">
                    <Button variant="outline" size="sm" onClick={() => window.open(`/verify/${row.id}`, "_blank")}>
                        <LinkIcon className="w-4 h-4 mr-2" /> Verify
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive border-transparent hover:border-destructive" onClick={() => handleDeleteCertificate(row.id)}>
                       <Trash2 className="w-4 h-4" />
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
                   <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Certificate Issuance</h1>
                   <p className="text-slate-500 mt-1">Review and manage platform generated certificates.</p>
                </div>
            </div>

            <div className="flex bg-white dark:bg-slate-900 p-4 rounded-xl border shadow-sm">
                 <div className="flex gap-2 w-full md:w-auto">
                    {["All", "Letter of Acceptance", "Certificate of Completion"].map(t => (
                        <Button 
                           key={t} 
                           variant={filterType === t ? "default" : "outline"}
                           onClick={() => setFilterType(t)}
                           className="flex-1 md:flex-none"
                        >
                            {t}
                        </Button>
                    ))}
                </div>
            </div>

            <DataTable columns={columns} data={filtered} keyExtractor={(row) => row.id} />
        </div>
    );
}
