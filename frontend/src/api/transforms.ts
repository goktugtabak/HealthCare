// Frontend uses human-readable Title Case enums (mockData / UI labels).
// Backend Prisma stores snake_case values. These helpers translate at
// the API boundary so the rest of the app stays oblivious to the
// difference.
import type {
  MeetingRequest,
  MeetingRequestStatus,
  Notification,
  Post,
  PostStatus,
  PostStatusHistoryEntry,
  PreferredContact,
  Role,
  User,
} from "@/data/types";

const POST_STATUS_TO_DB: Record<PostStatus, string> = {
  Draft: "draft",
  Active: "active",
  "Meeting Scheduled": "meeting_scheduled",
  "Partner Found": "partner_found",
  Expired: "expired",
};

const POST_STATUS_FROM_DB: Record<string, PostStatus> = {
  draft: "Draft",
  active: "Active",
  meeting_scheduled: "Meeting Scheduled",
  partner_found: "Partner Found",
  expired: "Expired",
  removed: "Expired",
};

const STAGE_TO_DB: Record<string, string> = {
  Ideation: "ideation",
  Research: "research",
  Prototype: "prototype",
  Development: "development",
  Testing: "testing",
  "Clinical Validation": "clinical_validation",
};

const STAGE_FROM_DB: Record<string, string> = {
  ideation: "Ideation",
  research: "Research",
  prototype: "Prototype",
  development: "Development",
  testing: "Testing",
  clinical_validation: "Clinical Validation",
};

const CONFIDENTIALITY_TO_DB: Record<Post["confidentialityLevel"], string> = {
  Public: "public",
  Confidential: "confidential",
  "Highly Confidential": "highly_confidential",
};

const CONFIDENTIALITY_FROM_DB: Record<string, Post["confidentialityLevel"]> = {
  public: "Public",
  confidential: "Confidential",
  highly_confidential: "Highly Confidential",
};

const MEETING_STATUS_TO_DB: Record<MeetingRequestStatus, string> = {
  Pending: "pending",
  Accepted: "accepted",
  Declined: "declined",
  Scheduled: "scheduled",
  Cancelled: "cancelled",
  Completed: "completed",
};

const MEETING_STATUS_FROM_DB: Record<string, MeetingRequestStatus> = {
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined",
  scheduled: "Scheduled",
  cancelled: "Cancelled",
  completed: "Completed",
};

const CONTACT_METHOD_TO_DB: Record<PreferredContact["method"], string> = {
  Email: "email",
  Phone: "phone",
  LinkedIn: "linkedin",
  Other: "other",
};

const CONTACT_METHOD_FROM_DB: Record<string, PreferredContact["method"]> = {
  email: "Email",
  phone: "Phone",
  linkedin: "LinkedIn",
  other: "Other",
};

export const toDb = {
  postStatus: (s: PostStatus) => POST_STATUS_TO_DB[s] || "draft",
  stage: (s: string) => STAGE_TO_DB[s] || s.toLowerCase().replace(/\s+/g, "_"),
  confidentiality: (c: Post["confidentialityLevel"]) =>
    CONFIDENTIALITY_TO_DB[c] || "public",
  meetingStatus: (s: MeetingRequestStatus) => MEETING_STATUS_TO_DB[s] || "pending",
  contactMethod: (m: PreferredContact["method"]) => CONTACT_METHOD_TO_DB[m] || "email",
};

export const fromDb = {
  postStatus: (s: string): PostStatus => POST_STATUS_FROM_DB[s] || "Draft",
  stage: (s: string) => STAGE_FROM_DB[s] || s,
  confidentiality: (c: string): Post["confidentialityLevel"] =>
    CONFIDENTIALITY_FROM_DB[c] || "Public",
  meetingStatus: (s: string): MeetingRequestStatus => MEETING_STATUS_FROM_DB[s] || "Pending",
  contactMethod: (m: string): PreferredContact["method"] =>
    CONTACT_METHOD_FROM_DB[m] || "Email",
};

type ApiPost = Omit<Post, "status" | "projectStage" | "confidentialityLevel" | "statusHistory"> & {
  status: string;
  projectStage: string;
  confidentialityLevel?: string;
  confidentiality?: string;
  statusHistory?: Array<{
    status: string;
    changedAt: string;
    changedBy?: string | null;
    reason?: string | null;
  }>;
  authorId?: string;
  ownerRole?: Role;
};

const toIsoString = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value instanceof Date) {
    const t = value.getTime();
    return Number.isNaN(t) ? "" : value.toISOString();
  }
  const d = new Date(value as string);
  const t = d.getTime();
  return Number.isNaN(t) ? "" : d.toISOString();
};

export const normalizePost = (p: ApiPost): Post => {
  const confidentiality = p.confidentialityLevel || p.confidentiality || "public";
  const statusHistory: PostStatusHistoryEntry[] | undefined = p.statusHistory?.map((h) => ({
    status: fromDb.postStatus(h.status),
    changedAt: typeof h.changedAt === "string" ? h.changedAt : new Date(h.changedAt).toISOString(),
    changedBy: h.changedBy ?? undefined,
    reason: h.reason ?? undefined,
  }));
  return {
    ...p,
    ownerId: p.ownerId || (p.authorId ?? ""),
    ownerRole: (p.ownerRole as Role) || "engineer",
    title: p.title,
    workingDomain: p.workingDomain || (p as unknown as { domain?: string }).domain || "",
    shortExplanation: p.shortExplanation || (p as unknown as { description?: string }).description || "",
    requiredExpertise: Array.isArray(p.requiredExpertise) ? p.requiredExpertise : [],
    matchTags: Array.isArray(p.matchTags) ? p.matchTags : [],
    projectStage: fromDb.stage(p.projectStage as string),
    collaborationType: p.collaborationType || "",
    confidentialityLevel: fromDb.confidentiality(confidentiality),
    country: p.country || "",
    city: p.city || "",
    expiryDate: toIsoString(p.expiryDate),
    autoClose: !!p.autoClose,
    status: fromDb.postStatus(p.status),
    createdAt: toIsoString(p.createdAt) || new Date().toISOString(),
    updatedAt: toIsoString(p.updatedAt) || toIsoString(p.createdAt) || new Date().toISOString(),
    commitmentLevel: p.commitmentLevel || "",
    highLevelIdea: p.highLevelIdea || "",
    notesPreview: p.notesPreview || "",
    statusHistory,
  } as Post;
};

type ApiUser = Omit<User, "preferredContact" | "notificationPreferences" | "fullName" | "city" | "country"> & {
  fullName?: string | null;
  firstName?: string;
  lastName?: string;
  city?: string | null;
  country?: string | null;
  preferredContactMethod?: string | null;
  preferredContactValue?: string | null;
  notifyInApp?: boolean;
  notifyEmail?: boolean;
};

export const normalizeUser = (u: ApiUser): User => {
  const fullName =
    u.fullName ||
    [u.firstName, u.lastName].filter(Boolean).join(" ") ||
    u.email;
  const preferredContact: PreferredContact | undefined =
    u.preferredContactMethod && u.preferredContactValue
      ? {
          method: fromDb.contactMethod(u.preferredContactMethod),
          value: u.preferredContactValue,
        }
      : undefined;
  return {
    id: u.id,
    fullName: fullName || "",
    email: u.email,
    role: u.role,
    institution: u.institution || "",
    city: u.city || "",
    country: u.country || "",
    expertiseTags: u.expertiseTags || [],
    interestTags: u.interestTags || [],
    profileCompleteness: u.profileCompleteness ?? 0,
    avatar: u.avatar || "",
    status: u.status || "active",
    onboardingCompleted: !!u.onboardingCompleted,
    emailVerified: !!u.emailVerified,
    domainVerified: !!u.domainVerified,
    portfolioSummary: u.portfolioSummary || "",
    portfolioLinks: u.portfolioLinks || [],
    preferredContact,
    notificationPreferences: {
      inApp: u.notifyInApp ?? true,
      email: u.notifyEmail ?? true,
    },
    bio: u.bio || "",
    createdAt: toIsoString(u.createdAt) || new Date().toISOString(),
    deletionRequestedAt: u.deletionRequestedAt ? toIsoString(u.deletionRequestedAt) : null,
    lastActiveAt: u.lastActiveAt ? toIsoString(u.lastActiveAt) : undefined,
  } as User;
};

type ApiMeeting = {
  id: string;
  postId: string;
  requestorId?: string;
  requesterId?: string;
  recipientId?: string;
  requesterRole?: Role;
  introductoryMessage?: string;
  ndaAccepted?: boolean;
  ndaAcceptedAt?: string | Date | null;
  proposedSlots?: string[] | unknown;
  selectedSlot?: string | Date | null;
  status: string;
  createdAt: string | Date;
};

export const normalizeMeeting = (m: ApiMeeting): MeetingRequest => ({
  id: m.id,
  postId: m.postId,
  requesterId: m.requesterId || m.requestorId || "",
  requesterRole: (m.requesterRole as Role) || "engineer",
  introductoryMessage: m.introductoryMessage || "",
  ndaAccepted: !!m.ndaAccepted,
  ndaAcceptedAt: m.ndaAcceptedAt ? toIsoString(m.ndaAcceptedAt) : null,
  proposedSlots: Array.isArray(m.proposedSlots) ? (m.proposedSlots as string[]) : [],
  selectedSlot: m.selectedSlot ? toIsoString(m.selectedSlot) : null,
  status: fromDb.meetingStatus(m.status),
  createdAt: toIsoString(m.createdAt) || new Date().toISOString(),
});

type ApiNotification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  body?: string;
  message?: string;
  isRead?: boolean;
  read?: boolean;
  createdAt: string | Date;
};

const NOTIFICATION_TYPE_FROM_DB: Record<string, Notification["type"]> = {
  message_received: "interest",
  meeting_requested: "meeting_request",
  meeting_accepted: "meeting_confirmed",
  meeting_declined: "account",
  meeting_scheduled: "post_status",
  meeting_cancelled: "account",
  nda_required: "account",
  post_status: "post_status",
  post_expired: "post_status",
  partner_found: "post_status",
  email_verification: "account",
  account: "account",
  interest: "interest",
};

export const normalizeNotification = (n: ApiNotification): Notification => ({
  id: n.id,
  userId: n.userId,
  type: NOTIFICATION_TYPE_FROM_DB[n.type] || "account",
  title: n.title,
  message: n.message || n.body || "",
  read: n.read ?? n.isRead ?? false,
  createdAt: typeof n.createdAt === "string" ? n.createdAt : n.createdAt.toISOString(),
});
