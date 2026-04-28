"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMe, updateMe } from "@/lib/api";
import type { User } from "@/types";

export function useProfile(walletAddress?: string | null) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["profile", walletAddress],
    queryFn: getMe,
    enabled: !!walletAddress,
    retry: false,
    staleTime: 60_000,
  });

  const user = data?.data;
  const hasProfile = !!(user?.display_name && user.display_name.trim().length > 0);

  const updateProfile = useMutation({
    mutationFn: (profileData: Partial<User>) => updateMe(profileData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", walletAddress] });
    },
  });

  return {
    user,
    isLoading,
    error,
    hasProfile,
    updateProfile: updateProfile.mutateAsync,
    isUpdating: updateProfile.isPending,
  };
}
