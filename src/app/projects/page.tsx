"use client";

import { motion } from "framer-motion";
import { Search, Filter, Clock, Users, IndianRupee } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useState, useEffect } from "react";

const Projects = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch("/api/projects/browse");
        const json = await res.json();
        setProjects(json.data || []);
      } catch (err) {
        console.error("Failed to fetch projects:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  // Client-side search filter
  const filteredProjects = projects.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.company_name?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      (Array.isArray(p.requirements) && p.requirements.some((r: string) => r.toLowerCase().includes(q)))
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Browse Projects</h1>
            <p className="text-muted-foreground">Find your next team project from leading companies.</p>
          </motion.div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects by title, tech stack..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" /> Filters
            </Button>
          </div>

          {/* Loading Skeleton */}
          {loading && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-xl border shadow-card p-6 animate-pulse">
                  <div className="h-5 w-16 bg-muted rounded mb-4" />
                  <div className="h-6 w-3/4 bg-muted rounded mb-2" />
                  <div className="h-4 w-1/2 bg-muted rounded mb-3" />
                  <div className="h-16 w-full bg-muted rounded mb-4" />
                  <div className="h-8 w-full bg-muted rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Project Grid */}
          {!loading && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Link href={`/projects/${p.id}`} className="block">
                    <div className="bg-card rounded-xl border shadow-card p-6 hover:shadow-elevated transition-shadow h-full flex flex-col">
                      <div className="flex items-start justify-between mb-3">
                        <Badge variant={p.status === "open" || p.status === "Open" ? "default" : "secondary"} className={p.status === "open" || p.status === "Open" ? "bg-secondary text-secondary-foreground" : ""}>
                          {p.status === "open" ? "Open" : p.status}
                        </Badge>
                      </div>
                      <h3 className="font-display font-semibold text-lg mb-1">{p.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{p.company_name || "Unknown Company"}</p>
                      <p className="text-sm text-muted-foreground mb-4 flex-1 line-clamp-2">{p.description}</p>
                      {Array.isArray(p.requirements) && p.requirements.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {p.requirements.slice(0, 3).map((t: string, idx: number) => (
                            <span key={idx} className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
                              {t.length > 25 ? t.substring(0, 25) + "..." : t}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground border-t pt-3">
                        <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3" />{p.budget || "TBD"}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{p.duration || "TBD"}</span>
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{p.required_team_size ? `${p.required_team_size} members` : "TBD"}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}

              {filteredProjects.length === 0 && !loading && (
                <div className="col-span-full py-16 text-center text-muted-foreground bg-card rounded-xl border border-dashed">
                  {searchQuery ? "No projects matching your search." : "No projects available yet. Check back later!"}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Projects;
