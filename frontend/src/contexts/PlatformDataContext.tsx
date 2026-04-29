import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  mockMeetingRequests,
  mockMessages,
  mockNotifications,
  mockPosts,
  mockUsers,
  mockActivityLogs,
} from "@/data/mockData";
import type {
  ActivityLog,
  MeetingRequest,
  Message,
  Notification,
  Post,
  PostStatus,
  PostStatusHistoryEntry,
  User,
} from "@/data/types";

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

interface AddActivityLogInput {
  userId?: string;
  userName?: string;
  role?: User["role"];
  actionType: string;
  targetEntity: string;
  resultStatus?: ActivityLog["resultStatus"];
}

interface PlatformDataContextType {
  users: User[];
  posts: Post[];
  meetingRequests: MeetingRequest[];
  messages: Message[];
  notifications: Notification[];
  activityLogs: ActivityLog[];
  addUser: (user: User) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  suspendUser: (userId: string, actorId?: string) => void;
  reactivateUser: (userId: string, actorId?: string) => void;
  deactivateUser: (userId: string, actorId?: string) => void;
  verifyUserDomain: (userId: string, actorId?: string) => void;
  requestAccountDeletion: (userId: string) => void;
  cancelAccountDeletion: (userId: string) => void;
  hardDeleteUser: (userId: string) => void;
  createPost: (input: CreatePostInput) => Post;
  updatePost: (postId: string, updates: UpdatePostInput) => void;
  setPostStatus: (postId: string, status: PostStatus, actorId?: string, reason?: string) => void;
  removePost: (postId: string, actorId?: string) => void;
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
  addActivityLog: (input: AddActivityLogInput) => void;
  getUserActivityMetrics: (userId: string) => UserActivityMetrics;
}

interface UserActivityMetrics {
  postsCreated: number;
  meetingsRequested: number;
  meetingsAccepted: number;
  messagesSent: number;
  lastActiveAt?: string;
  totalLogEntries: number;
}

interface PersistedState {
  users: User[];
  posts: Post[];
  meetingRequests: MeetingRequest[];
  messages: Message[];
  notifications: Notification[];
  activityLogs: ActivityLog[];
}

const defaultState: PersistedState = {
  users: mockUsers,
  posts: mockPosts,
  meetingRequests: mockMeetingRequests,
  messages: mockMessages,
  notifications: mockNotifications,
  activityLogs: mockActivityLogs,
};

const PlatformDataContext = createContext<PlatformDataContextType | undefined>(undefined);

const createId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const simpleHash = (input: string) => {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    const char = input.charCodeAt(index);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

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
      activityLogs: parsed.activityLogs ?? defaultState.activityLogs,
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

const isExpired = (post: Post) => {
  if (post.status === "Expired" || post.status === "Partner Found") return false;
  if (!post.expiryDate) return false;
  const expiry = new Date(post.expiryDate);
  if (Number.isNaN(expiry.getTime())) return false;
  return expiry.getTime() < Date.now();
};

const ensureStatusHistory = (post: Post): PostStatusHistoryEntry[] => {
  if (post.statusHistory && post.statusHistory.length > 0) return post.statusHistory;
  return [
    {
      status: post.status,
      changedAt: post.createdAt ?? new Date().toISOString(),
    },
  ];
};

const fakeIp = () => {
  const segments = [192, 168, Math.floor(Math.random() * 200) + 1, Math.floor(Math.random() * 200) + 1];
  return `${segments[0]}.${segments[1]}.${segments[2]}.***`;
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
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(
    persistedState.activityLogs,
  );

  // FR-15: Auto-expiry runtime check on mount
  useEffect(() => {
    setPosts((current) => {
      let mutated = false;
      const next = current.map((post) => {
        if (isExpired(post)) {
          mutated = true;
          const history = ensureStatusHistory(post);
          return {
            ...post,
            status: "Expired" as PostStatus,
            updatedAt: new Date().toISOString(),
            statusHistory: [
              ...history,
              {
                status: "Expired" as PostStatus,
                changedAt: new Date().toISOString(),
                reason: "Automatic expiry — post passed expiryDate",
              },
            ],
          };
        }
        return post;
      });
      return mutated ? next : current;
    });
  }, []);

  // NFR-10: 72-hour hard-delete sweep for accounts pending deletion
  useEffect(() => {
    const usersToDelete = users.filter((user) => {
      if (user.status !== "pending_deletion" || !user.deletionRequestedAt) return false;
      const requestedAt = new Date(user.deletionRequestedAt).getTime();
      if (Number.isNaN(requestedAt)) return false;
      return Date.now() - requestedAt >= 72 * 60 * 60 * 1000;
    });

    if (usersToDelete.length === 0) return;

    setUsers((current) => current.filter((user) => !usersToDelete.find((target) => target.id === user.id)));
    setPosts((current) => current.filter((post) => !usersToDelete.find((target) => target.id === post.ownerId)));
  }, [users]);

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
      activityLogs,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [activityLogs, meetingRequests, messages, notifications, posts, users]);

  const addActivityLog = useCallback((input: AddActivityLogInput) => {
    setActivityLogs((current) => {
      const lastEntry = current[0];
      const prevHash = lastEntry?.hash ?? "0".repeat(8);
      const timestamp = new Date().toISOString();
      const userName = input.userName ?? "system";
      const role: User["role"] = input.role ?? "admin";
      const payload = `${timestamp}|${userName}|${input.actionType}|${input.targetEntity}|${prevHash}`;
      const hash = simpleHash(payload);
      const entry: ActivityLog = {
        id: createId("al"),
        timestamp,
        userId: input.userId,
        userName,
        role,
        actionType: input.actionType,
        targetEntity: input.targetEntity,
        resultStatus: input.resultStatus ?? "success",
        ipPreview: fakeIp(),
        hash,
        prevHash,
      };
      return [entry, ...current];
    });
  }, []);

  const addUser = (user: User) => {
    setUsers((currentUsers) => [mergeUser(user, {}), ...currentUsers]);
    addActivityLog({
      userId: user.id,
      userName: user.fullName,
      role: user.role,
      actionType: "Account Created",
      targetEntity: user.email,
    });
  };

  const updateUser = (userId: string, updates: Partial<User>) => {
    setUsers((currentUsers) =>
      currentUsers.map((user) => (user.id === userId ? mergeUser(user, updates) : user)),
    );
  };

  const suspendUser = (userId: string, actorId?: string) => {
    const target = users.find((user) => user.id === userId);
    setUsers((current) =>
      current.map((user) => (user.id === userId ? mergeUser(user, { status: "suspended" }) : user)),
    );
    const actor = users.find((user) => user.id === actorId);
    if (target) {
      addActivityLog({
        userId: actor?.id ?? actorId,
        userName: actor?.fullName ?? "Admin",
        role: actor?.role ?? "admin",
        actionType: "User Suspended",
        targetEntity: target.fullName,
        resultStatus: "warning",
      });
    }
  };

  const reactivateUser = (userId: string, actorId?: string) => {
    const target = users.find((user) => user.id === userId);
    setUsers((current) =>
      current.map((user) => (user.id === userId ? mergeUser(user, { status: "active" }) : user)),
    );
    const actor = users.find((user) => user.id === actorId);
    if (target) {
      addActivityLog({
        userId: actor?.id ?? actorId,
        userName: actor?.fullName ?? "Admin",
        role: actor?.role ?? "admin",
        actionType: "User Reactivated",
        targetEntity: target.fullName,
      });
    }
  };

  const deactivateUser = (userId: string, actorId?: string) => {
    const target = users.find((user) => user.id === userId);
    setUsers((current) =>
      current.map((user) => (user.id === userId ? mergeUser(user, { status: "deactivated" }) : user)),
    );
    const actor = users.find((user) => user.id === actorId);
    if (target) {
      addActivityLog({
        userId: actor?.id ?? actorId,
        userName: actor?.fullName ?? "Admin",
        role: actor?.role ?? "admin",
        actionType: "User Deactivated",
        targetEntity: target.fullName,
        resultStatus: "warning",
      });
    }
  };

  const verifyUserDomain = (userId: string, actorId?: string) => {
    const target = users.find((user) => user.id === userId);
    setUsers((current) =>
      current.map((user) => (user.id === userId ? mergeUser(user, { domainVerified: true, emailVerified: true }) : user)),
    );
    const actor = users.find((user) => user.id === actorId);
    if (target) {
      addActivityLog({
        userId: actor?.id ?? actorId,
        userName: actor?.fullName ?? "Admin",
        role: actor?.role ?? "admin",
        actionType: "Domain Verified",
        targetEntity: target.email,
      });
    }
  };

  const requestAccountDeletion = (userId: string) => {
    const target = users.find((user) => user.id === userId);
    setUsers((current) =>
      current.map((user) =>
        user.id === userId
          ? mergeUser(user, {
              status: "pending_deletion",
              deletionRequestedAt: new Date().toISOString(),
            })
          : user,
      ),
    );
    if (target) {
      addActivityLog({
        userId: target.id,
        userName: target.fullName,
        role: target.role,
        actionType: "Account Deletion Requested",
        targetEntity: target.email,
        resultStatus: "warning",
      });
    }
  };

  const cancelAccountDeletion = (userId: string) => {
    setUsers((current) =>
      current.map((user) =>
        user.id === userId
          ? mergeUser(user, { status: "active", deletionRequestedAt: null })
          : user,
      ),
    );
  };

  const hardDeleteUser = (userId: string) => {
    const target = users.find((user) => user.id === userId);
    setUsers((current) => current.filter((user) => user.id !== userId));
    setPosts((current) => current.filter((post) => post.ownerId !== userId));
    if (target) {
      addActivityLog({
        userName: target.fullName,
        role: target.role,
        actionType: "User Hard Deleted",
        targetEntity: target.email,
        resultStatus: "warning",
      });
    }
  };

  const createPost = (input: CreatePostInput) => {
    const now = new Date().toISOString();
    const status: PostStatus = input.publish ? "Active" : "Draft";
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
      status,
      createdAt: now,
      updatedAt: now,
      matchTags: input.requiredExpertise.slice(0, 4),
      commitmentLevel: input.commitmentLevel,
      highLevelIdea: input.highLevelIdea,
      notesPreview:
        "High-level post only. Detailed assets stay off-platform until both sides connect externally.",
      statusHistory: [{ status, changedAt: now, changedBy: input.ownerId }],
    };

    setPosts((currentPosts) => [post, ...currentPosts]);

    const owner = users.find((user) => user.id === input.ownerId);
    addActivityLog({
      userId: input.ownerId,
      userName: owner?.fullName,
      role: owner?.role,
      actionType: input.publish ? "Post Published" : "Post Created (Draft)",
      targetEntity: input.title,
    });

    return post;
  };

  const updatePost = (postId: string, updates: UpdatePostInput) => {
    setPosts((currentPosts) =>
      currentPosts.map((post) => {
        if (post.id !== postId) return post;
        const newStatus =
          post.status === "Partner Found" || post.status === "Expired"
            ? post.status
            : updates.publish
              ? ("Active" as PostStatus)
              : post.status === "Active"
                ? ("Active" as PostStatus)
                : ("Draft" as PostStatus);
        const history = ensureStatusHistory(post);
        return {
          ...post,
          ...updates,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          matchTags: updates.requiredExpertise.slice(0, 4),
          statusHistory:
            newStatus !== post.status
              ? [
                  ...history,
                  {
                    status: newStatus,
                    changedAt: new Date().toISOString(),
                    reason: "Edited by owner",
                  },
                ]
              : history,
        };
      }),
    );

    const post = posts.find((candidate) => candidate.id === postId);
    if (post) {
      const owner = users.find((user) => user.id === post.ownerId);
      addActivityLog({
        userId: post.ownerId,
        userName: owner?.fullName,
        role: owner?.role,
        actionType: "Post Updated",
        targetEntity: updates.title,
      });
    }
  };

  const setPostStatus = (
    postId: string,
    status: PostStatus,
    actorId?: string,
    reason?: string,
  ) => {
    let mutatedPost: Post | undefined;
    setPosts((currentPosts) =>
      currentPosts.map((post) => {
        if (post.id !== postId) return post;
        const history = ensureStatusHistory(post);
        const next: Post = {
          ...post,
          status,
          updatedAt: new Date().toISOString(),
          statusHistory: [
            ...history,
            {
              status,
              changedAt: new Date().toISOString(),
              changedBy: actorId,
              reason,
            },
          ],
        };
        mutatedPost = next;
        return next;
      }),
    );

    if (mutatedPost) {
      const actor = users.find((user) => user.id === (actorId ?? mutatedPost?.ownerId));
      addActivityLog({
        userId: actorId ?? mutatedPost.ownerId,
        userName: actor?.fullName,
        role: actor?.role,
        actionType: `Post Status → ${status}`,
        targetEntity: mutatedPost.title,
      });
    }
  };

  const removePost = (postId: string, actorId?: string) => {
    const target = posts.find((post) => post.id === postId);
    setPosts((current) => current.filter((post) => post.id !== postId));
    setMeetingRequests((current) => current.filter((request) => request.postId !== postId));
    if (target) {
      const actor = users.find((user) => user.id === actorId);
      addActivityLog({
        userId: actorId,
        userName: actor?.fullName ?? "Admin",
        role: actor?.role ?? "admin",
        actionType: "Post Removed",
        targetEntity: target.title,
        resultStatus: "warning",
      });
    }
  };

  const submitMeetingRequest = (input: SubmitMeetingRequestInput) => {
    const request: MeetingRequest = {
      id: createId("request"),
      postId: input.postId,
      requesterId: input.requesterId,
      requesterRole: input.requesterRole,
      introductoryMessage: input.introductoryMessage,
      ndaAccepted: input.ndaAccepted ?? true,
      ndaAcceptedAt: input.ndaAccepted ? new Date().toISOString() : null,
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

      addActivityLog({
        userId: input.requesterId,
        userName: requester?.fullName,
        role: requester?.role,
        actionType: "Meeting Request Sent",
        targetEntity: post.title,
      });

      // FR-38: mock email delivery when recipient opted in
      const owner = users.find((user) => user.id === post.ownerId);
      if (owner?.notificationPreferences.email) {
        addActivityLog({
          userId: owner.id,
          userName: owner.fullName,
          role: owner.role,
          actionType: "Email Sent: Meeting Request",
          targetEntity: owner.email,
        });
      }
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
        setPostStatus(
          relatedPost.id,
          "Meeting Scheduled",
          relatedPost.ownerId,
          "Meeting scheduled with collaborator",
        );
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

      const owner = users.find((user) => user.id === relatedPost.ownerId);
      const requester = users.find((user) => user.id === acceptedRequest.requesterId);
      addActivityLog({
        userId: relatedPost.ownerId,
        userName: owner?.fullName,
        role: owner?.role,
        actionType: slot ? "Meeting Scheduled" : "Meeting Request Accepted",
        targetEntity: relatedPost.title,
      });

      if (requester?.notificationPreferences.email) {
        addActivityLog({
          userId: requester.id,
          userName: requester.fullName,
          role: requester.role,
          actionType: "Email Sent: Request Accepted",
          targetEntity: requester.email,
        });
      }
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

      const owner = users.find((user) => user.id === relatedPost.ownerId);
      addActivityLog({
        userId: relatedPost.ownerId,
        userName: owner?.fullName,
        role: owner?.role,
        actionType: "Meeting Request Declined",
        targetEntity: relatedPost.title,
        resultStatus: "warning",
      });
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

    const sender = users.find((user) => user.id === input.senderId);
    const post = posts.find((candidate) => candidate.id === input.postId);
    if (sender && post) {
      addActivityLog({
        userId: sender.id,
        userName: sender.fullName,
        role: sender.role,
        actionType: "Message Sent",
        targetEntity: post.title,
      });
    }

    return createdMessage as unknown as Message;
  }, [addActivityLog, posts, users]);

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

  const getUserActivityMetrics = useCallback(
    (userId: string): UserActivityMetrics => {
      const userPosts = posts.filter((post) => post.ownerId === userId);
      const requested = meetingRequests.filter((request) => request.requesterId === userId);
      const acceptedOnMyPosts = meetingRequests.filter(
        (request) =>
          (request.status === "Accepted" || request.status === "Scheduled") &&
          userPosts.some((post) => post.id === request.postId),
      );
      const sent = messages.filter((message) => message.senderId === userId);
      const userLogs = activityLogs.filter((log) => log.userId === userId);
      const lastActiveAt = userLogs[0]?.timestamp;

      return {
        postsCreated: userPosts.length,
        meetingsRequested: requested.length,
        meetingsAccepted: acceptedOnMyPosts.length,
        messagesSent: sent.length,
        lastActiveAt,
        totalLogEntries: userLogs.length,
      };
    },
    [activityLogs, meetingRequests, messages, posts],
  );

  return (
    <PlatformDataContext.Provider
      value={{
        users,
        posts,
        meetingRequests,
        messages,
        notifications,
        activityLogs,
        addUser,
        updateUser,
        suspendUser,
        reactivateUser,
        deactivateUser,
        verifyUserDomain,
        requestAccountDeletion,
        cancelAccountDeletion,
        hardDeleteUser,
        createPost,
        updatePost,
        setPostStatus,
        removePost,
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
        addActivityLog,
        getUserActivityMetrics,
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
