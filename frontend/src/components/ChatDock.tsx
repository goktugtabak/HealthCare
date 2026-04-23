import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  FileX2,
  MessageCircle,
  Minus,
  Send,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useChatDock } from "@/contexts/ChatDockContext";
import { usePlatformData } from "@/contexts/PlatformDataContext";
import { cn } from "@/lib/utils";

const formatTimestamp = (iso: string) => {
  const date = new Date(iso);
  const today = new Date();
  const sameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();
  return sameDay
    ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString([], { month: "short", day: "numeric" });
};

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export const ChatDock = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const {
    markThreadRead,
    meetingRequests,
    messages,
    posts,
    sendMessage,
    users,
  } = usePlatformData();
  const {
    open,
    activeConversation,
    openDock,
    closeDock,
    toggleDock,
    setActiveConversation,
  } = useChatDock();

  const [draft, setDraft] = useState("");
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  const conversations = useMemo(() => {
    if (!currentUser) return [];
    const grouped = new Map<
      string,
      {
        postId: string;
        otherUserId: string;
        thread: typeof messages;
      }
    >();
    for (const message of messages) {
      if (
        message.senderId !== currentUser.id &&
        message.recipientId !== currentUser.id
      )
        continue;
      const other =
        message.senderId === currentUser.id
          ? message.recipientId
          : message.senderId;
      const key = `${message.postId}::${other}`;
      const bucket = grouped.get(key) ?? {
        postId: message.postId,
        otherUserId: other,
        thread: [],
      };
      bucket.thread = [...bucket.thread, message];
      grouped.set(key, bucket);
    }
    return Array.from(grouped.values())
      .map((entry) => {
        const sorted = [...entry.thread].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        const last = sorted[sorted.length - 1];
        const unreadCount = sorted.filter(
          (message) =>
            message.recipientId === currentUser.id && !message.readAt,
        ).length;
        return {
          postId: entry.postId,
          otherUserId: entry.otherUserId,
          lastMessage: last,
          unreadCount,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.lastMessage.createdAt).getTime() -
          new Date(a.lastMessage.createdAt).getTime(),
      );
  }, [messages, currentUser]);

  const totalUnread = conversations.reduce(
    (sum, conversation) => sum + conversation.unreadCount,
    0,
  );

  const activePost = activeConversation
    ? posts.find((post) => post.id === activeConversation.postId) ?? null
    : null;
  const otherUser = activeConversation
    ? users.find((user) => user.id === activeConversation.otherUserId) ?? null
    : null;

  const thread = useMemo(() => {
    if (!activeConversation || !currentUser) return [];
    return messages
      .filter(
        (message) =>
          message.postId === activeConversation.postId &&
          ((message.senderId === currentUser.id &&
            message.recipientId === activeConversation.otherUserId) ||
            (message.senderId === activeConversation.otherUserId &&
              message.recipientId === currentUser.id)),
      )
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
  }, [messages, activeConversation, currentUser]);

  const activeCollaborationRequest = currentUser && activeConversation && activePost
    ? meetingRequests.find(
        (request) =>
          request.postId === activePost.id &&
          ((activePost.ownerId === currentUser.id &&
            request.requesterId === activeConversation.otherUserId) ||
            (activePost.ownerId === activeConversation.otherUserId &&
              request.requesterId === currentUser.id)),
      )
    : undefined;

  const messagingAllowed =
    currentUser?.role === "admin" ||
    activeCollaborationRequest?.status === "Accepted" ||
    activeCollaborationRequest?.status === "Scheduled" ||
    activeCollaborationRequest?.status === "Completed";

  useEffect(() => {
    if (!open || !activeConversation || !currentUser) return;
    markThreadRead(
      activeConversation.postId,
      activeConversation.otherUserId,
      currentUser.id,
    );
  }, [
    open,
    activeConversation?.postId,
    activeConversation?.otherUserId,
    currentUser?.id,
    markThreadRead,
  ]);

  useEffect(() => {
    if (!open || !activeConversation) return;
    threadEndRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [thread.length, open, activeConversation]);

  useEffect(() => {
    setDraft("");
  }, [activeConversation?.postId, activeConversation?.otherUserId]);

  if (!currentUser) {
    return null;
  }

  const handleSend = () => {
    if (!activeConversation || !draft.trim()) return;
    if (!messagingAllowed) return;
    sendMessage({
      postId: activeConversation.postId,
      senderId: currentUser.id,
      recipientId: activeConversation.otherUserId,
      content: draft.trim(),
    });
    setDraft("");
  };

  return (
    <>
      <button
        type="button"
        onClick={toggleDock}
        className={cn(
          "fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:scale-105 hover:shadow-xl",
          open && "opacity-0 pointer-events-none scale-95",
        )}
        aria-label="Open chat"
      >
        <MessageCircle className="h-6 w-6" />
        {totalUnread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground ring-2 ring-background">
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        )}
      </button>

      <div
        className={cn(
          "fixed bottom-5 right-5 z-50 flex h-[560px] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl transition-all duration-200 sm:w-[420px]",
          open
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0",
        )}
      >
        <header className="flex items-center justify-between border-b border-border/70 bg-gradient-to-r from-primary/[0.08] to-accent/[0.06] px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            {activeConversation && (
              <button
                type="button"
                onClick={() => setActiveConversation(null)}
                className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted"
                aria-label="Back to conversations"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {activeConversation && otherUser
                  ? otherUser.fullName
                  : "Messages"}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {activeConversation && activePost
                  ? `Re: ${activePost.title}`
                  : `${conversations.length} conversation${conversations.length === 1 ? "" : "s"}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleDock}
              className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted"
              aria-label="Minimize chat"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={closeDock}
              className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {!activeConversation ? (
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <MessageCircle className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">No conversations yet</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Open a post and send a collaboration request to start a
                  thread after approval.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border/60">
                {conversations.map((conversation) => {
                  const post = posts.find(
                    (item) => item.id === conversation.postId,
                  );
                  const other = users.find(
                    (user) => user.id === conversation.otherUserId,
                  );
                  return (
                    <li
                      key={`${conversation.postId}-${conversation.otherUserId}`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          openDock({
                            postId: conversation.postId,
                            otherUserId: conversation.otherUserId,
                          })
                        }
                        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {other ? initials(other.fullName) : "?"}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-medium">
                              {other?.fullName ?? "Unknown user"}
                            </span>
                            <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground/70">
                              {formatTimestamp(conversation.lastMessage.createdAt)}
                            </span>
                          </span>
                          <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                            {post?.title ?? "Post unavailable"}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-muted-foreground/80">
                            {conversation.lastMessage.senderId === currentUser.id
                              ? "You: "
                              : ""}
                            {conversation.lastMessage.content}
                          </span>
                        </span>
                        {conversation.unreadCount > 0 && (
                          <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : !otherUser || !activePost ? (
          <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-muted-foreground">
            This conversation is no longer available.
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-muted/30 px-4 py-2">
              <button
                type="button"
                onClick={() => navigate(`/posts/${activePost.id}`)}
                className="truncate text-[11px] font-medium text-primary hover:underline"
              >
                Open post page
              </button>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-background px-2 py-0.5 text-[10px] text-muted-foreground ring-1 ring-border/60">
                <FileX2 className="h-3 w-3" />
                No file uploads
              </span>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
              {thread.length === 0 ? (
                <p className="mt-8 text-center text-xs text-muted-foreground">
                  No messages yet — say hello.
                </p>
              ) : (
                thread.map((message) => {
                  const isOwn = message.senderId === currentUser.id;
                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex flex-col",
                        isOwn ? "items-end" : "items-start",
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-5",
                          isOwn
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground",
                        )}
                      >
                        {message.content}
                      </div>
                      <span className="mt-0.5 text-[10px] text-muted-foreground/70">
                        {formatTimestamp(message.createdAt)}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={threadEndRef} />
            </div>

            <footer className="border-t border-border/70 px-3 py-3">
              <div className="flex items-end gap-2">
                <Textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={
                    messagingAllowed
                      ? "Type a message..."
                      : "Request must be accepted before messaging"
                  }
                  disabled={!messagingAllowed}
                  rows={1}
                  className="min-h-[38px] flex-1 resize-none text-sm"
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!draft.trim() || !messagingAllowed}
                  className="h-9 w-9 shrink-0 rounded-full"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </footer>
          </>
        )}
      </div>
    </>
  );
};
