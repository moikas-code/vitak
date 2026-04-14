import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { userSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function checkAdminAccess(userId: string) {
  try {
    const db = await getDb();
    const settings = await db
      .select({ role: userSettings.role })
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .get();

    return settings?.role === "admin";
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