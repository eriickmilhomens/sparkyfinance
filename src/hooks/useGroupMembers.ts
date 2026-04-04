import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

const GROUP_MEMBERS_QUERY_KEY = ["group-members"] as const;

export const useGroupMembers = () => {
  const { profile, isDemo } = useProfile();
  const queryClient = useQueryClient();

  const membersQuery = useQuery({
    queryKey: [...GROUP_MEMBERS_QUERY_KEY, isDemo ? "demo" : profile?.group_code ?? profile?.user_id ?? "solo"],
    enabled: !!profile,
    queryFn: async (): Promise<GroupMember[]> => {
      if (!profile) return [];

      if (isDemo) {
        return [profile as GroupMember];
      }

      let query = supabase.from("profiles").select("*");

      if (profile.group_code) {
        query = query.eq("group_code", profile.group_code);
      } else {
        query = query.eq("user_id", profile.user_id);
      }

      const { data, error } = await query.order("points", { ascending: false });

      if (error) {
        console.error("Group members fetch error:", error.message);
        return [profile as GroupMember];
      }

      const fetchedMembers = (data as GroupMember[] | null) ?? [];
      if (fetchedMembers.length === 0) {
        return [profile as GroupMember];
      }

      return fetchedMembers.some((member) => member.user_id === profile.user_id)
        ? fetchedMembers
        : [profile as GroupMember, ...fetchedMembers];
    },
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
  });

  useEffect(() => {
    if (!profile) return;

    const invalidateMembers = () => {
      queryClient.invalidateQueries({ queryKey: GROUP_MEMBERS_QUERY_KEY });
    };

    window.addEventListener("sparky-points-updated", invalidateMembers);
    window.addEventListener("sparky-profile-updated", invalidateMembers);
    window.addEventListener("sparky-data-cleared", invalidateMembers);

    if (isDemo) {
      return () => {
        window.removeEventListener("sparky-points-updated", invalidateMembers);
        window.removeEventListener("sparky-profile-updated", invalidateMembers);
        window.removeEventListener("sparky-data-cleared", invalidateMembers);
      };
    }

    const filter = profile.group_code
      ? `group_code=eq.${profile.group_code}`
      : `user_id=eq.${profile.user_id}`;

    const channel = supabase
      .channel(`group-members-${profile.group_code ?? profile.user_id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter,
        },
        invalidateMembers
      )
      .subscribe();

    return () => {
      window.removeEventListener("sparky-points-updated", invalidateMembers);
      window.removeEventListener("sparky-profile-updated", invalidateMembers);
      window.removeEventListener("sparky-data-cleared", invalidateMembers);
      supabase.removeChannel(channel);
    };
  }, [isDemo, profile, queryClient]);

  const members = useMemo(() => {
    const list = membersQuery.data ?? [];
    return [...list].sort((a, b) => b.points - a.points);
  }, [membersQuery.data]);

  // The group creator is the one whose invite_code === group_code
  const leader = members.find(m => m.invite_code === m.group_code);
  const currentUserRank = members.findIndex(m => m.user_id === profile?.user_id) + 1;

  const isLeader = (member: GroupMember) => member.invite_code === member.group_code;

  return { members, loading: membersQuery.isLoading, leader, currentUserRank, isLeader };
};
