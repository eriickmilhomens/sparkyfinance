import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";

export interface GroupMember {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  avatar_url: string | null;
  points: number;
  role: string;
  invite_code: string;
  group_code: string | null;
  created_at: string;
}

export const useGroupMembers = () => {
  const { profile, isDemo } = useProfile();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo || !profile?.group_code) {
      setLoading(false);
      return;
    }

    const fetchMembers = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("group_code", profile.group_code!)
        .order("points", { ascending: false });

      if (data) setMembers(data as GroupMember[]);
      setLoading(false);
    };

    fetchMembers();

    // Refresh every 30s
    const interval = setInterval(fetchMembers, 30000);
    return () => clearInterval(interval);
  }, [profile?.group_code, isDemo]);

  // The group creator is the one whose invite_code === group_code
  const leader = members.find(m => m.invite_code === m.group_code);
  const currentUserRank = members.findIndex(m => m.user_id === profile?.user_id) + 1;

  const isLeader = (member: GroupMember) => member.invite_code === member.group_code;

  return { members, loading, leader, currentUserRank, isLeader };
};
