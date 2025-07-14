import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { supabaseServiceRole } from "@/lib/db/supabase-server";

async function checkAdminAccess(userId: string) {
  try {
    const { data } = await supabaseServiceRole
      .from("user_settings")
      .select("role")
      .eq("user_id", userId)
      .single();
    
    return data?.role === "admin";
  } catch (error) {
    console.error("[AdminAuthWrapper] Error checking admin access:", error);
    return false;
  }
}

export default async function AdminAuthWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  if (!session?.userId) {
    redirect("/auth/sign-in");
  }
  
  const isAdmin = await checkAdminAccess(session.userId);
  
  if (!isAdmin) {
    redirect("/dashboard");
  }
  
  return <>{children}</>;
}