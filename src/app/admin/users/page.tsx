"use client";

import { useEffect, useState } from "react";
import DataTable from "@/components/admin/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterRole, setFilterRole] = useState("All");
    const { toast } = useToast();

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/admin/users");
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
            }
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();

        const channel = supabase.channel("admin-users")
          .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => fetchUsers())
          .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const handleDeleteUser = async (userId: string) => {
        const confirmed = window.confirm("Are you sure you want to delete this user? This action is irreversible.");
        if (!confirmed) return;

        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetUserId: userId, action: "delete" })
            });

            if (res.ok) {
                toast({ title: "User Deleted" });
                setUsers(prev => prev.filter(u => u.id !== userId));
            } else {
                const err = await res.json();
                toast({ title: "Error", description: err.error, variant: "destructive" });
            }
        } catch (error: any) {
             toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = (u.full_name?.toLowerCase().includes(search.toLowerCase())) || 
                              (u.email?.toLowerCase().includes(search.toLowerCase()));
        const matchesRole = filterRole === "All" || u.role === filterRole;
        return matchesSearch && matchesRole;
    });

    const columns = [
        { 
            header: "Name", 
            accessor: (row: any) => (
                <div>
                   <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                     {row.full_name || "Unknown"}
                     {row.is_admin && <Badge variant="default" className="text-[10px] h-5">Admin</Badge>}
                   </div>
                   <div className="text-xs text-slate-500">{row.email}</div>
                </div>
            ) 
        },
        { 
            header: "Role", 
            accessor: (row: any) => (
               <Badge variant={row.role === "Company" ? "secondary" : "outline"}>
                   {row.role || "Individual"}
               </Badge>
            )
        },
        { 
            header: "Joined", 
            accessor: (row: any) => new Date(row.created_at).toLocaleDateString()
        },
        {
            header: "Actions",
            accessor: (row: any) => (
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive hover:text-white h-8 w-8 p-0" onClick={() => handleDeleteUser(row.id)}>
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
                   <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">User Management</h1>
                   <p className="text-slate-500 mt-1">Manage students and companies on the platform.</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="Search by name or email..." 
                        className="pl-9 w-full"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    {["All", "Individual", "Company"].map(role => (
                        <Button 
                           key={role} 
                           variant={filterRole === role ? "default" : "outline"}
                           onClick={() => setFilterRole(role)}
                           className="flex-1 md:flex-none"
                        >
                            {role}
                        </Button>
                    ))}
                </div>
            </div>

            <DataTable columns={columns} data={filteredUsers} keyExtractor={(row) => row.id} />
        </div>
    );
}
