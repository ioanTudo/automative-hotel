import { getSessionUser } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AiAgentBubble } from "@/components/ai/AiAgentBubble";

export async function SiteShell({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  return (
    <>
      <Header user={user} />
      <main className="flex-1">{children}</main>
      <Footer />
      <AiAgentBubble />
    </>
  );
}
