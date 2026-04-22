import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    
    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { project_id, application_id, earnings_distribution, project_title } = body; 
    // earnings_distribution: Array<{student_id: string, amount: number}>

    // Update project and application to completed
    await supabaseAdmin.from('projects').update({ status: 'completed' }).eq('id', project_id);
    await supabaseAdmin.from('applications').update({ status: 'completed' }).eq('id', application_id);
    
    // Distribute rewards securely via backend injection
    if (Array.isArray(earnings_distribution)) {
       for (const earning of earnings_distribution) {
           if (earning.amount > 0) {
              // Note: since this is an upsert or increment, in a real DB we'd use a postgres function.
              // For now, we assume the wallets table handles raw inserts merging by trigger or simply append a ledger.
              await supabaseAdmin.from('wallets').insert([{
                 user_id: earning.student_id,
                 amount: earning.amount,
                 type: 'credit',
                 description: `Payment for project: ${project_title}`
              }] as any);
           }
           
           // Issue a certificate generically upon completion natively to the cert registry bound to the user id
           await supabaseAdmin.from('certificates').insert([{
              user_id: earning.student_id,
              title: `Completion: ${project_title}`,
              type: 'completion',
              date: new Date().toISOString()
           }] as any);
       }
    }

    return NextResponse.json({ message: "Project completed and payouts distributed!" }, { status: 200 });

  } catch (err: any) {
    console.error("Completion error:", err);
    return NextResponse.json({ error: err.message || "Failed to finalize project delivery." }, { status: 500 });
  }
}
