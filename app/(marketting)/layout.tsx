import { Header } from "@/components/ui/Header";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* ✅ Add Header HERE */}
      <Header />
      <main className="flex-1">{children}</main>
    </div>
  );
}
