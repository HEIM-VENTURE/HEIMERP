import { AdminSidebar } from "@/components/sidebar/admin-sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 px-8 py-7 overflow-x-auto">{children}</main>
    </div>
  );
}
