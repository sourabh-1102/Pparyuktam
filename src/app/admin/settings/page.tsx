"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import type { PlatformSettings } from "@/types";

export default function AdminSettingsPage() {
    const { toast } = useToast();
    const [settings, setSettings] = useState<PlatformSettings>({
        id: 1,
        allow_students: true,
        allow_companies: true,
        auto_approve: false,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Load settings from DB on mount
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch("/api/admin/settings");
                if (res.ok) {
                    const { settings: data } = await res.json();
                    if (data) setSettings(data);
                }
            } catch (err) {
                console.error("Failed to fetch settings:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/admin/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    allow_students: settings.allow_students,
                    allow_companies: settings.allow_companies,
                    auto_approve: settings.auto_approve,
                }),
            });

            if (res.ok) {
                toast({ title: "Settings Saved", description: "Configuration updated successfully." });
            } else {
                const err = await res.json();
                toast({ title: "Error", description: err.error || "Failed to save settings.", variant: "destructive" });
            }
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="animate-pulse h-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />;

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-between">
                <div>
                   <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">System Settings</h1>
                   <p className="text-slate-500 mt-1">Configure global application parameters.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border shadow-sm rounded-xl p-6 space-y-6">
                <div>
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white border-b pb-2 mb-4">Registration Control</h3>
                    <div className="flex items-center justify-between py-2">
                        <div>
                            <p className="font-medium">Allow New Student Signups</p>
                            <p className="text-sm text-slate-500 max-w-md">Toggle whether open registration is allowed. Disabling this will lock the /join endpoints.</p>
                        </div>
                        <Switch
                            checked={settings.allow_students}
                            onCheckedChange={(val) => setSettings(prev => ({ ...prev, allow_students: val }))}
                        />
                    </div>
                     <div className="flex items-center justify-between py-2">
                        <div>
                            <p className="font-medium">Allow New Company Registrations</p>
                            <p className="text-sm text-slate-500 max-w-md">Control whether new organizations can register on the platform.</p>
                        </div>
                        <Switch
                            checked={settings.allow_companies}
                            onCheckedChange={(val) => setSettings(prev => ({ ...prev, allow_companies: val }))}
                        />
                    </div>
                </div>

                <div>
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white border-b pb-2 mb-4 mt-6">Project Parameters</h3>
                    <div className="flex items-center justify-between py-2">
                        <div>
                            <p className="font-medium">Auto-Approve Specific Companies</p>
                            <p className="text-sm text-slate-500 max-w-md">Automatically bypass manual admin project review for verified organizations.</p>
                        </div>
                        <Switch
                            checked={settings.auto_approve}
                            onCheckedChange={(val) => setSettings(prev => ({ ...prev, auto_approve: val }))}
                        />
                    </div>
                </div>

                <div className="pt-4 border-t flex justify-end">
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? "Saving..." : "Save Configuration"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
