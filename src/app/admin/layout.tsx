import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import AdminSidebar from "@/components/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
      redirect("/login");
  }

  // Securely query explicit admin authorization bypassing standard RLS barriers.
  const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("email", session.user.email)
      .single();

  const ADMIN_EMAILS = [
    "govindsingh100bn@gmail.com",
    // "jatsourabhsinghgovindsingh@gmail.com"
  ];

  if (!profile?.is_admin && !ADMIN_EMAILS.includes((session.user.email || "").toLowerCase())) {
      // Re-route normal users gracefully to their standard dashboard.
      redirect("/student/dashboard");
  }

  return (
      <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
          <AdminSidebar />
          <main className="flex-1 flex flex-col h-full overflow-hidden">
             <div className="flex-1 overflow-x-hidden overflow-y-auto w-full p-6 lg:p-10">
                <div className="max-w-7xl mx-auto w-full">
                    {children}
                </div>
             </div>
          </main>
      </div>
  );
}
