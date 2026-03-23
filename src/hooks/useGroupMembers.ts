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
    if (isDemo) {
      // In demo mode, show current profile as the sole member
      if (profile) {
        setMembers([profile as GroupMember]);
      }
      setLoading(false);
      return;
    }

    if (!profile?.group_code) {
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

    // Refresh every 15s for faster sync
    const interval = setInterval(fetchMembers, 15000);

    // Listen for points updates
    const handlePointsUpdate = () => fetchMembers();
    window.addEventListener("sparky-points-updated", handlePointsUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener("sparky-points-updated", handlePointsUpdate);
    };
  }, [profile?.group_code, profile?.points, isDemo]);

  // The group creator is the one whose invite_code === group_code
  const leader = members.find(m => m.invite_code === m.group_code);
  const currentUserRank = members.findIndex(m => m.user_id === profile?.user_id) + 1;

  const isLeader = (member: GroupMember) => member.invite_code === member.group_code;

  return { members, loading, leader, currentUserRank, isLeader };
};
