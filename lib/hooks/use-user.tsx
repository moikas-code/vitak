"use client";

import { useUser as useClerkUser } from "@clerk/nextjs";
import { api } from "@/lib/trpc/provider";
import { useEffect } from "react";

/**
 * Custom hook that ensures user is synced between Clerk and our database
 * Returns both Clerk user data and our database user data
 */
export function useUser() {
  const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn } = useClerkUser();
  
  // Get user from our database
  const { data: dbUser, isLoading: dbLoading, refetch } = api.user.getCurrentUser.useQuery(
    undefined,
    {
      enabled: isSignedIn && clerkLoaded,
      retry: 3,
      retryDelay: 1000,
    }
  );

  // Ensure user exists in database when signed in
  const ensureUserMutation = api.user.ensureUserExists.useMutation();

  useEffect(() => {
    if (
      isSignedIn && 
      clerkUser && 
      !dbUser && 
      !dbLoading && 
      !ensureUserMutation.isPending &&
      !ensureUserMutation.isSuccess
    ) {
      // If signed in but no database user, create one
      ensureUserMutation.mutate({
        clerk_user_id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || null,
        username: clerkUser.username || null,
        first_name: clerkUser.firstName || null,
        last_name: clerkUser.lastName || null,
        image_url: clerkUser.imageUrl || null,
      }, {
        onSuccess: () => {
          refetch();
        },
      });
    }
  }, [
    isSignedIn, 
    clerkUser, 
    dbUser, 
    dbLoading, 
    ensureUserMutation.isPending,
    ensureUserMutation.isSuccess,
    ensureUserMutation,
    refetch
  ]);

  return {
    clerkUser,
    dbUser,
    isLoading: !clerkLoaded || dbLoading || ensureUserMutation.isPending,
    isSignedIn,
    userId: clerkUser?.id,
  };
}