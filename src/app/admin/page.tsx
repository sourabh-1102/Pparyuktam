"use client";

import { useEffect, useState } from "react";
import { Users, Briefcase, Building, ShieldCheck, FileText, CheckCircle, Activity, Award } from "lucide-react";
import StatCard from "@/components/admin/StatCard";
import { supabase } from "@/integrations/supabase/client";

export default function AdminDashboardOverview() {
    const [stats, setStats] = useState({
        studentsCount: 0,
        companiesCount: 0,
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        totalTeams: 0,
        totalApplications: 0,
        certificatesCount: 0,
    });
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const res = await fetch("/api/admin/overview");
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error("Failed to fetch admin stats:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();

        
        const channel = supabase.channel("admin-public-changes")
          .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => fetchStats())
          .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, () => fetchStats())
          .on("postgres_changes", { event: "*", schema: "public", table: "teams" }, () => fetchStats())
          .on("postgres_changes", { event: "*", schema: "public", table: "project_applications" }, () => fetchStats())
          .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    if (loading) {
        return <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>)}
            </div>
        </div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                   <h1 className="text-3xl font-bold font-display text-slate-900 dark:text-white">Admin Dashboard</h1>
                   <p className="text-slate-500 mt-1">Platform overview and real-time statistics.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Students" 
                    value={stats.studentsCount} 
                    icon={Users} 
                    trend="+12%" description="from last month"
                />
                <StatCard 
                    title="Total Companies" 
                    value={stats.companiesCount} 
                    icon={Building} 
                    trend="+5%" description="from last month"
                />
                <StatCard 
                    title="Total Projects" 
                    value={stats.totalProjects} 
                    icon={Briefcase} 
                />
                <StatCard 
                    title="Active Projects" 
                    value={stats.activeProjects} 
                    icon={Activity} 
                />
                <StatCard 
                    title="Completed Projects" 
                    value={stats.completedProjects} 
                    icon={CheckCircle} 
                />
                <StatCard 
                    title="Total Teams" 
                    value={stats.totalTeams} 
                    icon={ShieldCheck} 
                />
                <StatCard 
                    title="Total Applications" 
                    value={stats.totalApplications} 
                    icon={FileText} 
                />
                 <StatCard 
                    title="Certificates Issued" 
                    value={stats.certificatesCount}
                    icon={Award} 
                />
            </div>
        </div>
    );
}
