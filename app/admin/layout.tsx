import AdminAuthWrapper from "./admin-auth-wrapper";
import AdminClientLayout from "./admin-client-layout";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthWrapper>
      <AdminClientLayout>
        {children}
      </AdminClientLayout>
    </AdminAuthWrapper>
  );
}