import { HvpSidebar } from "@/components/sidebar/hvp-sidebar";

export default function HvpLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <HvpSidebar />
      <main className="flex-1 px-8 py-7 overflow-x-auto">{children}</main>
    </div>
  );
}
