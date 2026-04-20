import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  mockMeetingRequests,
  mockNotifications,
  mockPosts,
  mockUsers,
} from "@/data/mockData";
import type { MeetingRequest, Notification, Post, PostStatus, User } from "@/data/types";

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

interface SubmitMeetingRequestInput {
  postId: string;
  requesterId: string;
  requesterRole: User["role"];
  introductoryMessage: string;
  ndaAccepted: boolean;
  proposedSlots: string[];
}

interface PlatformDataContextType {
  users: User[];
  posts: Post[];
  meetingRequests: MeetingRequest[];
  notifications: Notification[];
  addUser: (user: User) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  createPost: (input: CreatePostInput) => Post;
  updatePost: (postId: string, updates: UpdatePostInput) => void;
  setPostStatus: (postId: string, status: PostStatus) => void;
  submitMeetingRequest: (input: SubmitMeetingRequestInput) => MeetingRequest;
  acceptMeetingRequest: (requestId: string, slot: string) => void;
  declineMeetingRequest: (requestId: string) => void;
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: (userId: string) => void;
}

interface PersistedState {
  users: User[];
  posts: Post[];
  meetingRequests: MeetingRequest[];
  notifications: Notification[];
}

const defaultState: PersistedState = {
  users: mockUsers,
  posts: mockPosts,
  meetingRequests: mockMeetingRequests,
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
      notifications,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [meetingRequests, notifications, posts, users]);

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
      ndaAccepted: input.ndaAccepted,
      proposedSlots: input.proposedSlots,
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

  const acceptMeetingRequest = (requestId: string, slot: string) => {
    const acceptedRequest = meetingRequests.find((request) => request.id === requestId);
    const relatedPost = posts.find((post) => post.id === acceptedRequest?.postId);

    setMeetingRequests((currentRequests) =>
      currentRequests.map((request) =>
        request.id === requestId
          ? {
              ...request,
              status: "Scheduled",
              selectedSlot: slot,
            }
          : request,
      ),
    );

    if (acceptedRequest && relatedPost) {
      setPostStatus(relatedPost.id, "Meeting Scheduled");

      setNotifications((currentNotifications) => [
        {
          id: createId("notif"),
          userId: acceptedRequest.requesterId,
          type: "meeting_confirmed",
          title: "External handoff is ready",
          message: `Your intro meeting for ${relatedPost.title} was scheduled. Contact details are now available in Meetings.`,
          createdAt: new Date().toISOString(),
          read: false,
        },
        {
          id: createId("notif"),
          userId: relatedPost.ownerId,
          type: "post_status",
          title: "Meeting scheduled",
          message: `A first-contact meeting for ${relatedPost.title} is set. Continue the detailed discussion off-platform.`,
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
        notifications,
        addUser,
        updateUser,
        createPost,
        updatePost,
        setPostStatus,
        submitMeetingRequest,
        acceptMeetingRequest,
        declineMeetingRequest,
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
