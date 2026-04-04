import { useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  invite_code: string;
  group_code: string | null;
  points: number;
  role: string;
  created_at: string;
}

const PROFILE_QUERY_KEY = ["profile"] as const;
const DEMO_PROFILE_KEY = "sparky-demo-profile";

const createDemoProfile = (): Profile => ({
  id: "demo",
  user_id: "demo",
  name: "Usuário Demo",
  email: "demo@sparky.app",
  phone: null,
  avatar_url: null,
  invite_code: "DEMO2026",
  group_code: "DEMO2026",
  points: 60,
  role: "admin",
  created_at: new Date().toISOString(),
});

const getProfileQueryKey = (isDemo: boolean) => [...PROFILE_QUERY_KEY, isDemo ? "demo" : "auth"] as const;

const loadDemoProfile = (): Profile => {
  try {
    const stored = localStorage.getItem(DEMO_PROFILE_KEY);
    if (stored) {
      return { ...createDemoProfile(), ...JSON.parse(stored) } as Profile;
    }
  } catch (err) {
    console.error("Demo profile load error:", err);
  }

  const fallback = createDemoProfile();
  localStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(fallback));
  return fallback;
};

const persistDemoProfile = (profile: Profile) => {
  localStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(profile));
};

export const useProfile = () => {
  const queryClient = useQueryClient();
  const isDemo = localStorage.getItem("sparky-demo-mode") === "true";
  const profileQueryKey = getProfileQueryKey(isDemo);

  const profileQuery = useQuery({
    queryKey: profileQueryKey,
    queryFn: async (): Promise<Profile | null> => {
      if (isDemo) {
        return loadDemoProfile();
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;
      const user = session.user;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Profile fetch error:", error.message);
        return null;
      }

      return data as Profile;
    },
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
  });

  useEffect(() => {
    const invalidateProfile = () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    };

    window.addEventListener("sparky-points-updated", invalidateProfile);
    window.addEventListener("sparky-data-cleared", invalidateProfile);
    window.addEventListener("sparky-profile-refresh", invalidateProfile);
    window.addEventListener("storage", invalidateProfile);

    return () => {
      window.removeEventListener("sparky-points-updated", invalidateProfile);
      window.removeEventListener("sparky-data-cleared", invalidateProfile);
      window.removeEventListener("sparky-profile-refresh", invalidateProfile);
      window.removeEventListener("storage", invalidateProfile);
    };
  }, [queryClient]);

  useEffect(() => {
    if (isDemo || !profileQuery.data?.user_id) return;

    const channel = supabase
      .channel(`profile-${profileQuery.data.user_id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `user_id=eq.${profileQuery.data.user_id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isDemo, profileQuery.data?.user_id, queryClient]);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    const currentProfile = queryClient.getQueryData<Profile | null>(profileQueryKey) ?? profileQuery.data ?? null;
    if (!currentProfile) return;

    if (isDemo) {
      const updatedProfile = { ...currentProfile, ...updates };
      persistDemoProfile(updatedProfile);
      queryClient.setQueryData(profileQueryKey, updatedProfile);
      window.dispatchEvent(new Event("sparky-profile-updated"));
      if (updates.points !== undefined) {
        window.dispatchEvent(new Event("sparky-points-updated"));
      }
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", currentProfile.user_id)
      .select()
      .single();

    if (error) throw error;

    const updatedProfile = data as Profile;
    queryClient.setQueryData(profileQueryKey, updatedProfile);
    queryClient.invalidateQueries({ queryKey: ["group-members"] });
    window.dispatchEvent(new Event("sparky-profile-updated"));
    if (updates.points !== undefined) {
      window.dispatchEvent(new Event("sparky-points-updated"));
    }
  }, [isDemo, profileQuery.data, profileQueryKey, queryClient]);

  return {
    profile: profileQuery.data ?? null,
    loading: profileQuery.isLoading,
    updateProfile,
    isDemo,
  };
};
