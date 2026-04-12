"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Users, Briefcase, Award, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import heroBg from "@/assets/hero-bg.jpg";
import Image from "next/image";

const features = [
  {
    icon: Users,
    title: "Team Formation",
    description: "Form teams with fellow students, define roles, and set contribution splits before applying to projects.",
  },
  {
    icon: Briefcase,
    title: "Real Company Projects",
    description: "Work on actual projects posted by companies — build real experience, not just portfolio pieces.",
  },
  {
    icon: Award,
    title: "Verified Certificates",
    description: "Receive auto-generated certificates upon completion, signed by the company and platform.",
  },
  {
    icon: Shield,
    title: "Letter of Agreement",
    description: "Every selected team gets a formal LoA — structured, professional, and legally formatted.",
  },
];

const steps = [
  { num: "01", title: "Register & Build Profile", desc: "Sign up as a student or company. Students add skills and form teams." },
  { num: "02", title: "Browse & Apply", desc: "Teams browse available projects, submit proposals with prototypes." },
  { num: "03", title: "Get Selected", desc: "Companies review, shortlist, and select the best team for the job." },
  { num: "04", title: "Deliver & Get Certified", desc: "Complete milestones, deliver the project, and receive your certificate." },
];

const stats = [
  { value: "500+", label: "Students" },
  { value: "120+", label: "Projects" },
  { value: "80+", label: "Companies" },
  { value: "95%", label: "Completion Rate" },
];

const Index = () => {
  const { user, role } = useAuth();
  
  const studentHref = user 
    ? (role ? (role === "Company" ? "/" : "/student/dashboard") : "/onboarding") 
    : "/register";
  const companyHref = user 
    ? (role ? (role === "Company" ? "/company/dashboard" : "/") : "/onboarding") 
    : "/register";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <Image src={heroBg} alt="Hero background" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-hero opacity-80" />
        </div>
        <div className="container mx-auto px-4 relative z-10 pt-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl"
          >
            {/* <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/30 mb-6">
              Acquired by NEXONVATE
            </span> */}
            <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight mb-6" style={{ color: "hsl(210, 20%, 95%)" }}>
              Where Student Teams
              <br />
              <span className="text-gradient">Build Real Projects</span>
            </h1>
            <p className="text-lg md:text-xl mb-8" style={{ color: "hsl(215, 15%, 65%)" }}>
              Paryuktam connects student teams with companies for milestone-based freelancing.
              Gain experience, earn certificates, and build your career.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="bg-gradient-primary hover:opacity-90 transition-opacity">
                <Link href={studentHref}>
                  {user && role === "Individual" ? "Go to Dashboard" : "Start as Student"} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-border/50 bg-card/10 backdrop-blur-sm hover:bg-card/20" style={{ color: "hsl(210, 20%, 85%)" }}>
                <Link href={companyHref}>{user && role === "Company" ? "Go to Dashboard" : "Post a Project"}</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-display font-bold text-gradient">{s.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Built for Student</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Everything you need to collaborate, deliver, and get certified — all in one platform.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-xl bg-card shadow-card border hover:shadow-elevated transition-shadow group"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <f.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="font-display font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground">Four simple steps from signup to certification.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="relative"
              >
                <div className="text-5xl font-display font-bold text-gradient opacity-30 mb-3">{s.num}</div>
                <h3 className="font-display font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-2xl overflow-hidden p-12 md:p-16 text-center bg-hero"
          >
            <div className="relative z-10">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4" style={{ color: "hsl(210, 20%, 95%)" }}>
                Ready to Build Something Real?
              </h2>
              <p className="mb-8 max-w-md mx-auto" style={{ color: "hsl(215, 15%, 65%)" }}>
                Join hundreds of student teams already working on industry projects.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button asChild size="lg" className="bg-gradient-primary hover:opacity-90">
                  <Link href={studentHref}>{user ? "Go to Dashboard" : "Join Now"} <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
