import { Header } from "@/components/ui/Header";

export default function chatbotLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 mx-1.5">{children}</main>
    </div>
  );
}
