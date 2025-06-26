"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

/**
 * UserSync component ensures the signed-in Clerk user is present in Supabase,
 * and initializes user settings if missing. Runs on login and user change.
 */
export function UserSync() {
  const { user, isLoaded } = useUser();
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !user) return;

    const sync_user = async () => {
      try {
        // Call the sync-user API endpoint
        const response = await fetch("/api/auth/sync-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clerk_user_id: user.id,
            email: user.emailAddresses?.[0]?.emailAddress || null,
            username: user.username || null,
            first_name: user.firstName || null,
            last_name: user.lastName || null,
            image_url: user.imageUrl || null,
          }),
        });
        
        if (!response.ok) {
          const data = await response.json();
          console.error("[UserSync] Sync error:", data.error);
          setSyncError(data.error || "Failed to sync user");
        } else {
          const data = await response.json();
          console.log("[UserSync] User synced successfully:", data.user_id);
          setSyncError(null);
        }
      } catch (error) {
        console.error("[UserSync] Failed to sync user:", error);
        setSyncError("Network error during user sync");
      }
    };

    sync_user();
  }, [user, isLoaded]);

  // Only show error UI if there's an actual error
  if (!syncError) return null;

  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
      <p className="text-sm text-red-800">
        Account sync issue: {syncError}
      </p>
      <p className="text-xs text-red-600 mt-1">
        Please refresh the page or contact support if this persists.
      </p>
    </div>
  );
}