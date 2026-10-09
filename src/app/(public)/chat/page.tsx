import { AppShell } from "@/features/app-shell/components/app-shell";
import { ChatWorkspace } from "@/features/chat/components/chat-workspace";

export const metadata = {
  title: "Trợ lý | VietFlood",
  description: "Hỏi đáp về an toàn lũ và các dịch vụ VietFlood.",
};

export default function ChatPage() {
  return (
    <AppShell>
      <ChatWorkspace />
    </AppShell>
  );
}
