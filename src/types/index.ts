// ─── TypeScript Types for Paryuktam ──────────────────────────────────────────

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  role: "Individual" | "Company" | "Admin" | null;
  college: string | null;
  phone_number: string | null;
  techstack: string[] | null;       // array of skills, e.g. ['react','python']
  company_name: string | null;
  industry: string | null;
  is_admin: boolean;
  created_at: string;
}

/** Alias for backward compatibility */
export type Profile = UserProfile;

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string | null;
  name: string;
  email: string;
  role: "Leader" | "Member" | "Admin";
  skill_role: string[];
  equity: number;
  finalized_equity: number;
  profiles?: Pick<UserProfile, "full_name" | "email">;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  team_members?: TeamMember[];
}

export interface Application {
  id: string;
  team_id: string;
  project_id: string;
  status: "pending" | "shortlisted" | "accepted" | "rejected";
  created_at: string;
  projects?: {
    id: string;
    title: string;
    company_name: string | null;
  };
  teams?: {
    id: string;
    name: string;
    team_members?: Pick<TeamMember, "name" | "email" | "role">[];
  };
}

export interface PlatformSettings {
  id: 1;
  allow_students: boolean;
  allow_companies: boolean;
  auto_approve: boolean;
  updated_at?: string;
}
