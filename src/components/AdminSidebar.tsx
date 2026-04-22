"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
    LayoutDashboard, 
    Users, 
    Briefcase, 
    ShieldCheck, 
    FileText, 
    Award, 
    AlertTriangle, 
    Settings,
    LogOut
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const NAV_ITEMS = [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "Projects", href: "/admin/projects", icon: Briefcase },
    { label: "Teams", href: "/admin/teams", icon: ShieldCheck },
    { label: "Applications", href: "/admin/applications", icon: FileText },
    { label: "Certificates", href: "/admin/certificates", icon: Award },
    { label: "Reports", href: "/admin/reports", icon: AlertTriangle },
    { label: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const { signOut } = useAuth();

    return (
        <aside className="w-64 bg-sidebar border-r flex flex-col h-screen sticky top-0 left-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-center">
                <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                   Paryuktam Admin
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/admin");
                    
                    return (
                        <Link 
                            key={item.href} 
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                                isActive 
                                ? "bg-slate-100 text-blue-600 dark:bg-slate-800 dark:text-blue-400 font-medium" 
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-50"
                            }`}
                        >
                            <item.icon className="h-4 w-4" />
                            <span className="text-sm">{item.label}</span>
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <button 
                  onClick={() => signOut()}
                  className="flex items-center gap-3 px-3 py-2 w-full text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-md text-sm"
                >
                    <LogOut className="h-4 w-4" /> 
                    <span>Log Out</span>
                </button>
            </div>
        </aside>
    );
}
