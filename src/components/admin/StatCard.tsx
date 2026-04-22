"use client";

import { LucideIcon } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    description?: string;
}

export default function StatCard({ title, value, icon: Icon, trend, description }: StatCardProps) {
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h3>
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
            </div>
            
            <div className="mt-2">
                <div className="text-3xl font-bold text-slate-900 dark:text-white">{value}</div>
                {trend && (
                    <p className={`text-xs mt-2 font-medium ${trend.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {trend} <span className="text-slate-500 dark:text-slate-400 font-normal ml-1">{description}</span>
                    </p>
                )}
            </div>
        </div>
    );
}
