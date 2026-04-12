import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getToken } from 'next-auth/jwt';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve Auth User ID
    const { data: { users }, error: authErr } = await supabaseAdmin.auth.admin.listUsers();
    if (authErr) {
       return NextResponse.json({ error: 'Failed to access auth users' }, { status: 500 });
    }
    
    const authUser = users.find(u => u.email === token.email);
    if (!authUser) {
      return NextResponse.json({ error: 'User not found in Supabase Auth' }, { status: 404 });
    }
    const userId = authUser.id;

    // 1. Get all teams the user is part of
    const { data: teamMemberships, error: memErr } = await supabaseAdmin
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId);

    if (memErr) {
       console.error('Membership Fetch Error:', memErr);
       return NextResponse.json({ error: 'Failed to query memberships' }, { status: 500 });
    }

    const teamIds = (teamMemberships || []).map(m => m.team_id);

    if (teamIds.length === 0) {
        return NextResponse.json({ data: [] });
    }

    // 2. Fetch applications for these teams
    const { data: applications, error: appErr } = await supabaseAdmin
      .from('applications')
      .select(`
        *,
        projects (
            id,
            title,
            company_id
        ),
        teams (
            id,
            name
        )
      `)
      .in('team_id', teamIds)
      .order('created_at', { ascending: false });

    if (appErr) {
        console.error('Applications Fetch Error:', appErr);
        return NextResponse.json({ error: 'Failed to query applications' }, { status: 500 });
    }

    // 3. Format the response
    const enrichedApplications = applications.map(app => ({
        id: app.id,
        projectId: app.project_id,
        projectTitle: app?.projects?.title || 'Unknown Project',
        teamId: app.team_id,
        teamName: app?.teams?.name || 'Unknown Team',
        status: app.status || 'pending',
        appliedAt: app.created_at
    }));

    return NextResponse.json({ data: enrichedApplications });
  } catch (error: any) {
    console.error('GET /api/applications/my error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
