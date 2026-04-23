import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  mockMeetingRequests,
  mockMessages,
  mockNotifications,
  mockPosts,
  mockUsers,
} from "@/data/mockData";
import type { MeetingRequest, Message, Notification, Post, PostStatus, User } from "@/data/types";

const STORAGE_KEY = "health-ai-platform-data";

interface CreatePostInput {
  ownerId: string;
  ownerRole: User["role"];
  title: string;
  workingDomain: string;
  shortExplanation: string;
  requiredExpertise: string[];
  projectStage: string;
  collaborationType: string;
  confidentialityLevel: Post["confidentialityLevel"];
  country: string;
  city: string;
  expiryDate: string;
  autoClose: boolean;
  commitmentLevel: string;
  highLevelIdea: string;
  publish: boolean;
}

interface UpdatePostInput extends Omit<CreatePostInput, "ownerId" | "ownerRole"> {}

interface SendMessageInput {
  postId: string;
  senderId: string;
  recipientId: string;
  content: string;
  ndaAccepted?: boolean;
}

interface ConversationSummary {
  postId: string;
  otherUserId: string;
  lastMessage: Message;
  unreadCount: number;
  ndaAccepted: boolean;
}

interface SubmitMeetingRequestInput {
  postId: string;
  requesterId: string;
  requesterRole: User["role"];
  introductoryMessage: string;
  ndaAccepted?: boolean;
  proposedSlots?: string[];
}

interface PlatformDataContextType {
  users: User[];
  posts: Post[];
  meetingRequests: MeetingRequest[];
  messages: Message[];
  notifications: Notification[];
  addUser: (user: User) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  createPost: (input: CreatePostInput) => Post;
  updatePost: (postId: string, updates: UpdatePostInput) => void;
  setPostStatus: (postId: string, status: PostStatus) => void;
  submitMeetingRequest: (input: SubmitMeetingRequestInput) => MeetingRequest;
  acceptMeetingRequest: (requestId: string, slot?: string) => void;
  declineMeetingRequest: (requestId: string) => void;
  sendMessage: (input: SendMessageInput) => Message;
  acceptMessageNda: (postId: string, otherUserId: string, currentUserId: string) => void;
  markThreadRead: (postId: string, otherUserId: string, currentUserId: string) => void;
  getThread: (postId: string, otherUserId: string, currentUserId: string) => Message[];
  getConversations: (currentUserId: string) => ConversationSummary[];
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: (userId: string) => void;
}

interface PersistedState {
  users: User[];
  posts: Post[];
  meetingRequests: MeetingRequest[];
  messages: Message[];
  notifications: Notification[];
}

const defaultState: PersistedState = {
  users: mockUsers,
  posts: mockPosts,
  meetingRequests: mockMeetingRequests,
  messages: mockMessages,
  notifications: mockNotifications,
};

const PlatformDataContext = createContext<PlatformDataContextType | undefined>(undefined);

const createId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const loadPersistedState = (): PersistedState => {
  if (typeof window === "undefined") {
    return defaultState;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return defaultState;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PersistedState>;

    return {
      users: parsed.users ?? defaultState.users,
      posts: parsed.posts ?? defaultState.posts,
      meetingRequests: parsed.meetingRequests ?? defaultState.meetingRequests,
      messages: parsed.messages ?? defaultState.messages,
      notifications: parsed.notifications ?? defaultState.notifications,
    };
  } catch {
    return defaultState;
  }
};

const calculateProfileCompleteness = (user: User) => {
  let score = 25;

  if (user.institution.trim()) score += 15;
  if (user.city.trim() && user.country.trim()) score += 15;
  if (user.bio?.trim()) score += 10;
  if (user.preferredContact?.value.trim()) score += 10;

  if (user.role === "healthcare") {
    if (user.interestTags.length >= 3) score += 25;
  } else if (user.role === "engineer") {
    if (user.expertiseTags.length >= 3) score += 15;
    if (user.portfolioSummary?.trim()) score += 10;
    if (user.portfolioLinks.length > 0) score += 10;
  } else {
    score = 100;
  }

  if (user.onboardingCompleted) {
    score += 5;
  }

  return Math.min(score, 100);
};

const mergeUser = (user: User, updates: Partial<User>): User => {
  const nextUser = { ...user, ...updates };
  return {
    ...nextUser,
    profileCompleteness: calculateProfileCompleteness(nextUser),
  };
};

export const PlatformDataProvider = ({ children }: { children: React.ReactNode }) => {
  const persistedState = useMemo(loadPersistedState, []);
  const [users, setUsers] = useState<User[]>(persistedState.users);
  const [posts, setPosts] = useState<Post[]>(persistedState.posts);
  const [meetingRequests, setMeetingRequests] = useState<MeetingRequest[]>(
    persistedState.meetingRequests,
  );
  const [messages, setMessages] = useState<Message[]>(persistedState.messages);
  const [notifications, setNotifications] = useState<Notification[]>(
    persistedState.notifications,
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const payload: PersistedState = {
      users,
      posts,
      meetingRequests,
      messages,
      notifications,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [meetingRequests, messages, notifications, posts, users]);

  const addUser = (user: User) => {
    setUsers((currentUsers) => [mergeUser(user, {}), ...currentUsers]);
  };

  const updateUser = (userId: string, updates: Partial<User>) => {
    setUsers((currentUsers) =>
      currentUsers.map((user) => (user.id === userId ? mergeUser(user, updates) : user)),
    );
  };

  const createPost = (input: CreatePostInput) => {
    const now = new Date().toISOString();
    const post: Post = {
      id: createId("post"),
      ownerId: input.ownerId,
      ownerRole: input.ownerRole,
      title: input.title,
      workingDomain: input.workingDomain,
      shortExplanation: input.shortExplanation,
      requiredExpertise: input.requiredExpertise,
      projectStage: input.projectStage,
      collaborationType: input.collaborationType,
      confidentialityLevel: input.confidentialityLevel,
      country: input.country,
      city: input.city,
      expiryDate: input.expiryDate,
      autoClose: input.autoClose,
      status: input.publish ? "Active" : "Draft",
      createdAt: now,
      updatedAt: now,
      matchTags: input.requiredExpertise.slice(0, 4),
      commitmentLevel: input.commitmentLevel,
      highLevelIdea: input.highLevelIdea,
      notesPreview:
        "High-level post only. Detailed assets stay off-platform until both sides connect externally.",
    };

    setPosts((currentPosts) => [post, ...currentPosts]);
    return post;
  };

  const updatePost = (postId: string, updates: UpdatePostInput) => {
    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              ...updates,
              status:
                post.status === "Partner Found" || post.status === "Expired"
                  ? post.status
                  : updates.publish
                    ? "Active"
                    : post.status === "Active"
                      ? "Active"
                      : "Draft",
              updatedAt: new Date().toISOString(),
              matchTags: updates.requiredExpertise.slice(0, 4),
            }
          : post,
      ),
    );
  };

  const setPostStatus = (postId: string, status: PostStatus) => {
    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              status,
              updatedAt: new Date().toISOString(),
            }
          : post,
      ),
    );
  };

  const submitMeetingRequest = (input: SubmitMeetingRequestInput) => {
    const request: MeetingRequest = {
      id: createId("request"),
      postId: input.postId,
      requesterId: input.requesterId,
      requesterRole: input.requesterRole,
      introductoryMessage: input.introductoryMessage,
      ndaAccepted: input.ndaAccepted ?? true,
      proposedSlots: input.proposedSlots ?? [],
      selectedSlot: null,
      status: "Pending",
      createdAt: new Date().toISOString(),
    };

    setMeetingRequests((currentRequests) => [request, ...currentRequests]);

    const post = posts.find((candidatePost) => candidatePost.id === input.postId);
    const requester = users.find((user) => user.id === input.requesterId);

    if (post) {
      setNotifications((currentNotifications) => [
        {
          id: createId("notif"),
          userId: post.ownerId,
          type: "meeting_request",
          title: "New first-contact request",
          message: `${
            requester?.fullName ?? "A platform member"
          } requested an intro meeting for ${post.title}.`,
          createdAt: new Date().toISOString(),
          read: false,
        },
        ...currentNotifications,
      ]);
    }

    return request;
  };

  const acceptMeetingRequest = (requestId: string, slot?: string) => {
    const acceptedRequest = meetingRequests.find((request) => request.id === requestId);
    const relatedPost = posts.find((post) => post.id === acceptedRequest?.postId);

    setMeetingRequests((currentRequests) =>
      currentRequests.map((request) =>
        request.id === requestId
          ? {
              ...request,
              status: slot ? "Scheduled" : "Accepted",
              selectedSlot: slot ?? null,
            }
          : request,
      ),
    );

    if (acceptedRequest && relatedPost) {
      if (slot) {
        setPostStatus(relatedPost.id, "Meeting Scheduled");
      }

      setNotifications((currentNotifications) => [
        {
          id: createId("notif"),
          userId: acceptedRequest.requesterId,
          type: "meeting_confirmed",
          title: "Collaboration request accepted",
          message: `Your collaboration request for ${relatedPost.title} was accepted. Messaging is now available.`,
          createdAt: new Date().toISOString(),
          read: false,
        },
        {
          id: createId("notif"),
          userId: relatedPost.ownerId,
          type: "post_status",
          title: "Collaboration request accepted",
          message: `You accepted a collaboration request for ${relatedPost.title}. Messaging is now available.`,
          createdAt: new Date().toISOString(),
          read: false,
        },
        ...currentNotifications,
      ]);
    }
  };

  const declineMeetingRequest = (requestId: string) => {
    const declinedRequest = meetingRequests.find((request) => request.id === requestId);
    const relatedPost = posts.find((post) => post.id === declinedRequest?.postId);

    setMeetingRequests((currentRequests) =>
      currentRequests.map((request) =>
        request.id === requestId
          ? {
              ...request,
              status: "Declined",
            }
          : request,
      ),
    );

    if (declinedRequest && relatedPost) {
      setNotifications((currentNotifications) => [
        {
          id: createId("notif"),
          userId: declinedRequest.requesterId,
          type: "account",
          title: "Request declined",
          message: `Your request for ${relatedPost.title} was declined. You can keep exploring other high-level opportunities.`,
          createdAt: new Date().toISOString(),
          read: false,
        },
        ...currentNotifications,
      ]);
    }
  };

  const threadKey = (postId: string, a: string, b: string) =>
    `${postId}::${[a, b].sort().join("::")}`;

  const threadHasAcceptedNda = (
    list: Message[],
    postId: string,
    a: string,
    b: string,
  ) =>
    list.some(
      (message) =>
        message.postId === postId &&
        ((message.senderId === a && message.recipientId === b) ||
          (message.senderId === b && message.recipientId === a)) &&
        message.ndaAcceptedAt !== null,
    );

  const sendMessage = useCallback((input: SendMessageInput) => {
    const now = new Date().toISOString();
    let createdMessage: Message | null = null;

    setMessages((current) => {
      const ndaAlreadyAccepted = threadHasAcceptedNda(
        current,
        input.postId,
        input.senderId,
        input.recipientId,
      );
      const message: Message = {
        id: createId("msg"),
        postId: input.postId,
        senderId: input.senderId,
        recipientId: input.recipientId,
        content: input.content,
        ndaAcceptedAt:
          ndaAlreadyAccepted || input.ndaAccepted ? now : null,
        readAt: null,
        createdAt: now,
      };
      createdMessage = message;
      return [...current, message];
    });

    setNotifications((current) => {
      const post = posts.find((candidate) => candidate.id === input.postId);
      const sender = users.find((user) => user.id === input.senderId);
      if (!post) return current;
      return [
        {
          id: createId("notif"),
          userId: input.recipientId,
          type: "interest",
          title: "New message",
          message: `${sender?.fullName ?? "A platform member"} sent you a message about ${post.title}.`,
          createdAt: now,
          read: false,
        },
        ...current,
      ];
    });

    return createdMessage as unknown as Message;
  }, [posts, users]);

  const acceptMessageNda = useCallback((
    postId: string,
    otherUserId: string,
    currentUserId: string,
  ) => {
    setMessages((current) => {
      const hasPending = current.some((message) => {
        const isInThread =
          message.postId === postId &&
          ((message.senderId === currentUserId && message.recipientId === otherUserId) ||
            (message.senderId === otherUserId && message.recipientId === currentUserId));
        return isInThread && !message.ndaAcceptedAt;
      });
      if (!hasPending) return current;
      const now = new Date().toISOString();
      return current.map((message) => {
        const isInThread =
          message.postId === postId &&
          ((message.senderId === currentUserId && message.recipientId === otherUserId) ||
            (message.senderId === otherUserId && message.recipientId === currentUserId));
        if (!isInThread || message.ndaAcceptedAt) return message;
        return { ...message, ndaAcceptedAt: now };
      });
    });
  }, []);

  const markThreadRead = useCallback((
    postId: string,
    otherUserId: string,
    currentUserId: string,
  ) => {
    setMessages((current) => {
      const hasUnread = current.some(
        (message) =>
          message.postId === postId &&
          message.senderId === otherUserId &&
          message.recipientId === currentUserId &&
          !message.readAt,
      );
      if (!hasUnread) return current;
      const now = new Date().toISOString();
      return current.map((message) =>
        message.postId === postId &&
        message.senderId === otherUserId &&
        message.recipientId === currentUserId &&
        !message.readAt
          ? { ...message, readAt: now }
          : message,
      );
    });
  }, []);

  const getThread = useCallback((
    postId: string,
    otherUserId: string,
    currentUserId: string,
  ) =>
    messages
      .filter(
        (message) =>
          message.postId === postId &&
          ((message.senderId === currentUserId && message.recipientId === otherUserId) ||
            (message.senderId === otherUserId && message.recipientId === currentUserId)),
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
  [messages]);

  const getConversations = useCallback((currentUserId: string): ConversationSummary[] => {
    const grouped = new Map<string, Message[]>();
    for (const message of messages) {
      if (message.senderId !== currentUserId && message.recipientId !== currentUserId) continue;
      const other =
        message.senderId === currentUserId ? message.recipientId : message.senderId;
      const key = threadKey(message.postId, currentUserId, other);
      const bucket = grouped.get(key) ?? [];
      bucket.push(message);
      grouped.set(key, bucket);
    }

    const summaries: ConversationSummary[] = [];
    for (const bucket of grouped.values()) {
      const sorted = [...bucket].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      const last = sorted[sorted.length - 1];
      const otherUserId =
        last.senderId === currentUserId ? last.recipientId : last.senderId;
      const unreadCount = sorted.filter(
        (message) => message.recipientId === currentUserId && !message.readAt,
      ).length;
      const ndaAccepted = sorted.some((message) => message.ndaAcceptedAt !== null);
      summaries.push({
        postId: last.postId,
        otherUserId,
        lastMessage: last,
        unreadCount,
        ndaAccepted,
      });
    }

    return summaries.sort(
      (a, b) =>
        new Date(b.lastMessage.createdAt).getTime() -
        new Date(a.lastMessage.createdAt).getTime(),
    );
  }, [messages]);

  const markNotificationRead = (notificationId: string) => {
    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification,
      ),
    );
  };

  const markAllNotificationsRead = (userId: string) => {
    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) =>
        notification.userId === userId ? { ...notification, read: true } : notification,
      ),
    );
  };

  return (
    <PlatformDataContext.Provider
      value={{
        users,
        posts,
        meetingRequests,
        messages,
        notifications,
        addUser,
        updateUser,
        createPost,
        updatePost,
        setPostStatus,
        submitMeetingRequest,
        acceptMeetingRequest,
        declineMeetingRequest,
        sendMessage,
        acceptMessageNda,
        markThreadRead,
        getThread,
        getConversations,
        markNotificationRead,
        markAllNotificationsRead,
      }}
    >
      {children}
    </PlatformDataContext.Provider>
  );
};

export const usePlatformData = () => {
  const context = useContext(PlatformDataContext);

  if (!context) {
    throw new Error("usePlatformData must be used inside PlatformDataProvider");
  }

  return context;
};
