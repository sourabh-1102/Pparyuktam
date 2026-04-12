"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Award, Download, FileText, Calendar,
  ExternalLink, ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ProtectedRoute from "@/components/ProtectedRoute";

interface Certificate {
  id: string;
  type: string;
  project_title: string;
  project_id: string;
  issue_date: string;
  download_url: string | null;
}

const certTypeConfig: Record<string, { label: string; color: string; icon: string }> = {
  Participation: { label: "Certificate of Participation", color: "bg-blue-100 text-blue-800 border-blue-200", icon: "🏅" },
  LOE: { label: "Letter of Experience", color: "bg-purple-100 text-purple-800 border-purple-200", icon: "📜" },
  Confirmation: { label: "Certificate of Confirmation", color: "bg-green-100 text-green-800 border-green-200", icon: "✅" },
};

export default function CertificatesPage() {
  const router = useRouter();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const res = await fetch("/api/certificates/my");
        if (res.ok) {
          const json = await res.json();
          setCertificates(json.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch certificates:", err);
      }
      setLoading(false);
    };
    fetchCertificates();
  }, []);

  // Group certificates by project
  const grouped = certificates.reduce<Record<string, Certificate[]>>((acc, cert) => {
    const key = cert.project_title || cert.project_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(cert);
    return acc;
  }, {});

  return (
    <ProtectedRoute allowedRoles={["Individual"]}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/student/dashboard?tab=projects")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold font-display flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" /> My Certificates
              </h1>
              <p className="text-sm text-muted-foreground">
                Download your verified credentials from completed projects.
              </p>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-5xl">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          )}

          {!loading && certificates.length === 0 && (
            <div className="bg-card rounded-xl border p-12 text-center">
              <Award className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Certificates Yet</h2>
              <p className="text-muted-foreground mb-6">
                Certificates are generated when a company accepts your team's project submission.
              </p>
              <Button variant="outline" onClick={() => router.push("/student/dashboard?tab=live_projects")}>
                Browse Projects
              </Button>
            </div>
          )}

          {!loading && Object.keys(grouped).length > 0 && (
            <div className="space-y-8">
              {Object.entries(grouped).map(([projectTitle, certs]) => (
                <section key={projectTitle} className="bg-card rounded-xl border shadow-sm overflow-hidden">
                  {/* Project header */}
                  <div className="px-6 py-4 bg-muted/30 border-b flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <h2 className="font-semibold">{projectTitle}</h2>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Issued: {new Date(certs[0].issue_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    </div>
                  </div>

                  {/* Certificates list */}
                  <div className="divide-y">
                    {certs.map((cert) => {
                      const config = certTypeConfig[cert.type] || { label: cert.type, color: "bg-gray-100 text-gray-800", icon: "📄" };
                      return (
                        <div key={cert.id} className="px-6 py-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
                          <div className="flex items-center gap-4">
                            <span className="text-2xl">{config.icon}</span>
                            <div>
                              <h3 className="font-medium text-sm">{config.label}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className={`text-[10px] ${config.color}`}>
                                  {cert.type}
                                </Badge>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <ShieldCheck className="h-3 w-3 text-green-500" /> Verified
                                </span>
                              </div>
                            </div>
                          </div>
                          <div>
                            {cert.download_url ? (
                              <a href={cert.download_url} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="sm" className="gap-2">
                                  <Download className="h-3.5 w-3.5" /> Download PDF
                                </Button>
                              </a>
                            ) : (
                              <Button variant="outline" size="sm" disabled className="gap-2">
                                <Download className="h-3.5 w-3.5" /> Unavailable
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
