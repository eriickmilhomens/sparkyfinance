import { useState, useEffect, useCallback } from "react";
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

  const fetchMembers = useCallback(async () => {
    if (isDemo || !profile?.group_code) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("group_code", profile.group_code)
      .order("points", { ascending: false });

    if (data) setMembers(data as GroupMember[]);
    setLoading(false);
  }, [profile?.group_code, isDemo]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Realtime subscription for instant group updates
  useEffect(() => {
    if (isDemo || !profile?.group_code) return;

    const channel = supabase
      .channel("group-members-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        fetchMembers();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile?.group_code, isDemo, fetchMembers]);

  // Also listen to custom points events
  useEffect(() => {
    const handler = () => fetchMembers();
    window.addEventListener("sparky-points-updated", handler);
    return () => window.removeEventListener("sparky-points-updated", handler);
  }, [fetchMembers]);

  // The group creator is the one whose invite_code === group_code
  const leader = members.find(m => m.invite_code === m.group_code);
  const currentUserRank = members.findIndex(m => m.user_id === profile?.user_id) + 1;

  const isLeader = (member: GroupMember) => member.invite_code === member.group_code;

  return { members, loading, leader, currentUserRank, isLeader, refetch: fetchMembers };
};
