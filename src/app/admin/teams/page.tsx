"use client";

import { useEffect, useState } from "react";
import DataTable from "@/components/admin/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Team, TeamMember } from "@/types";

export default function AdminTeamsPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [isMembersOpen, setIsMembersOpen] = useState(false);
    const { toast } = useToast();

    const fetchTeams = async () => {
        try {
            const res = await fetch("/api/admin/teams");
            if (res.ok) {
                const data = await res.json();
                setTeams(data.teams || []);
            }
        } catch (error) {
            console.error("Failed to fetch teams:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeams();

        const channel = supabase.channel("admin-teams")
          .on("postgres_changes", { event: "*", schema: "public", table: "teams" }, () => fetchTeams())
          .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const handleDeleteTeam = async (teamId: string) => {
        const confirmed = window.confirm("Are you sure you want to delete this team? Cascading deletions may remove applications.");
        if (!confirmed) return;

        try {
            const res = await fetch("/api/admin/teams", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetTeamId: teamId, action: "delete" })
            });

            if (res.ok) {
                toast({ title: "Team Deleted" });
                setTeams(prev => prev.filter(t => t.id !== teamId));
            } else {
                const err = await res.json();
                toast({ title: "Error", description: err.error, variant: "destructive" });
            }
        } catch (error: any) {
             toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const openMembersDialog = (team: Team) => {
        setSelectedTeam(team);
        setIsMembersOpen(true);
    };

    const columns = [
        {
            header: "Team Name",
            accessor: (row: Team) => (
                <div className="font-semibold text-slate-900 dark:text-white">
                  {row.name}
                </div>
            )
        },
        {
            header: "Leader",
            accessor: (row: Team) => {
               const leader = row.team_members?.find((m: TeamMember) =>
                 m.role === "Leader" || m.role === "Admin"
               );
               return (
                   <div>
                       {leader
                         ? <div className="font-medium">{leader.name}</div>
                         : <span className="text-slate-400 italic">No Leader Found</span>
                       }
                       {leader && <div className="text-xs text-slate-500">{leader.email}</div>}
                   </div>
               );
            }
        },
        {
            header: "Members",
            accessor: (row: Team) => (
               <Button
                 variant="secondary"
                 size="sm"
                 className="flex items-center gap-1.5"
                 onClick={() => openMembersDialog(row)}
               >
                 <Users className="h-3.5 w-3.5" />
                 {row.team_members?.length || 0} Members
               </Button>
            )
        },
        {
            header: "Actions",
            accessor: (row: Team) => (
                <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive hover:text-white h-8 w-8 p-0"
                      onClick={() => handleDeleteTeam(row.id)}
                    >
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
                   <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Team Management</h1>
                   <p className="text-slate-500 mt-1">Manage project teams and detect abnormal group activity.</p>
                </div>
            </div>

            <DataTable columns={columns} data={teams} keyExtractor={(row) => row.id} />

            {/* Team Members Dialog */}
            <Dialog open={isMembersOpen} onOpenChange={setIsMembersOpen}>
                <DialogContent className="sm:max-w-[520px]">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedTeam?.name} — Members
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-3 mt-2 max-h-[420px] overflow-y-auto pr-1">
                        {(selectedTeam?.team_members || []).length === 0 && (
                            <p className="text-sm text-slate-400 italic text-center py-6">No members found for this team.</p>
                        )}

                        {(selectedTeam?.team_members || []).map((member: TeamMember) => (
                            <div
                                key={member.id}
                                className="flex items-center justify-between p-3 rounded-lg border bg-slate-50 dark:bg-slate-800"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                                        {(member.name || "?").slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm text-slate-900 dark:text-white">{member.name}</p>
                                        <p className="text-xs text-slate-500">{member.email}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <Badge
                                        variant={member.role === "Leader" ? "default" : "secondary"}
                                        className="text-[10px]"
                                    >
                                        {member.role}
                                    </Badge>
                                    <span className="text-xs text-slate-400">{member.equity ?? 0}% equity</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
