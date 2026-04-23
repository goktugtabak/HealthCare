import { createContext, useCallback, useContext, useMemo, useState } from "react";

interface ActiveConversation {
  postId: string;
  otherUserId: string;
}

interface ChatDockContextType {
  open: boolean;
  activeConversation: ActiveConversation | null;
  openDock: (conversation?: ActiveConversation) => void;
  closeDock: () => void;
  toggleDock: () => void;
  setActiveConversation: (conversation: ActiveConversation | null) => void;
}

const ChatDockContext = createContext<ChatDockContextType | undefined>(undefined);

export const ChatDockProvider = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [activeConversation, setActiveConversation] =
    useState<ActiveConversation | null>(null);

  const openDock = useCallback((conversation?: ActiveConversation) => {
    if (conversation) setActiveConversation(conversation);
    setOpen(true);
  }, []);

  const closeDock = useCallback(() => setOpen(false), []);
  const toggleDock = useCallback(() => setOpen((current) => !current), []);

  const value = useMemo(
    () => ({
      open,
      activeConversation,
      openDock,
      closeDock,
      toggleDock,
      setActiveConversation,
    }),
    [open, activeConversation, openDock, closeDock, toggleDock],
  );

  return (
    <ChatDockContext.Provider value={value}>{children}</ChatDockContext.Provider>
  );
};

export const useChatDock = () => {
  const context = useContext(ChatDockContext);
  if (!context) {
    throw new Error("useChatDock must be used inside ChatDockProvider");
  }
  return context;
};
