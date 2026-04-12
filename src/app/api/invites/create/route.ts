import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getToken } from 'next-auth/jwt';
import { randomUUID } from 'crypto';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const { team_id, equity, role } = await request.json();

    if (!team_id) {
      return NextResponse.json({ error: 'team_id is required' }, { status: 400 });
    }

    const authToken = await getToken({ req: request });
    if (!authToken?.email) {
      return NextResponse.json({ error: 'Unauthorized: No active session' }, { status: 401 });
    }

    // Resolve user (created_by)
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', authToken.email)
      .maybeSingle();

    if (profileErr || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Parse numeric equity
    const parsedEquity = equity !== undefined && equity !== null ? Number(equity) : 0;
    if (isNaN(parsedEquity)) {
      return NextResponse.json({ error: 'equity must be a valid number' }, { status: 400 });
    }

    // Generate raw UUID token (Not Base64)
    const token = randomUUID();

    // Calculate expiry (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Insert into team_invitations
    const { data: invite, error } = await supabaseAdmin
      .from('team_invitations')
      .insert({
        team_id,
        token,
        equity: parsedEquity,
        role: role || 'Member',
        status: 'pending',
        used: false,
        created_by: profile.id,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Insert Invite Error:', error);
      return NextResponse.json({ error: error.message || 'Failed to create invite' }, { status: 500 });
    }

    const inviteUrl = `${process.env.NEXTAUTH_URL || request.nextUrl.origin}/join?token=${token}`;

    return NextResponse.json({
      success: true,
      token,
      url: inviteUrl
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create invite error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
