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

    const teamId = req.nextUrl.searchParams.get('teamId');
    if (!teamId) {
       return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
    }

    // Optional: Validate if the requesting user has access to this team by fetching their relation
    const { data: { users }, error: authUserErr } = await supabaseAdmin.auth.admin.listUsers();
    const authUser = (users || []).find(u => u.email === token.email);
    
    if (authUser) {
      const { data: membership } = await supabaseAdmin
        .from('team_members')
        .select('id')
        .eq('team_id', teamId)
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (!membership) {
        return NextResponse.json({ error: 'Forbidden: Not a team member' }, { status: 403 });
      }
    }

    // Join team_members with profiles to return details
    const { data: members, error } = await supabaseAdmin
      .from('team_members')
      .select('*, profiles(full_name, email)')
      .eq('team_id', teamId);

    if (error) {
      console.error('Fetch team error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: members });
  } catch (error: any) {
    console.error('GET /api/team/my-team error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
