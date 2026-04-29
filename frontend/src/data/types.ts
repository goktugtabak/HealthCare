export type Role = 'engineer' | 'healthcare' | 'admin';

export type PostStatus = 'Draft' | 'Active' | 'Meeting Scheduled' | 'Partner Found' | 'Expired';

export type MeetingRequestStatus = 'Pending' | 'Accepted' | 'Declined' | 'Scheduled' | 'Cancelled' | 'Completed';

export interface PreferredContact {
  method: 'Email' | 'Phone' | 'LinkedIn' | 'Other';
  value: string;
}

export interface NotificationPreferences {
  inApp: boolean;
  email: boolean;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  institution: string;
  city: string;
  country: string;
  expertiseTags: string[];
  interestTags: string[];
  profileCompleteness: number;
  avatar: string;
  status: 'active' | 'suspended' | 'deactivated' | 'pending_deletion';
  onboardingCompleted: boolean;
  emailVerified?: boolean;
  domainVerified?: boolean;
  portfolioSummary?: string;
  portfolioLinks: string[];
  preferredContact?: PreferredContact;
  notificationPreferences: NotificationPreferences;
  bio?: string;
  createdAt: string;
  deletionRequestedAt?: string | null;
  lastActiveAt?: string;
}

export interface PostStatusHistoryEntry {
  status: PostStatus;
  changedAt: string;
  changedBy?: string;
  reason?: string;
}

export interface Post {
  id: string;
  ownerId: string;
  ownerRole: Role;
  title: string;
  workingDomain: string;
  shortExplanation: string;
  requiredExpertise: string[];
  projectStage: string;
  collaborationType: string;
  confidentialityLevel: 'Public' | 'Confidential' | 'Highly Confidential';
  country: string;
  city: string;
  expiryDate: string;
  autoClose: boolean;
  status: PostStatus;
  createdAt: string;
  updatedAt: string;
  matchTags: string[];
  commitmentLevel: string;
  highLevelIdea: string;
  notesPreview: string;
  statusHistory?: PostStatusHistoryEntry[];
}

export interface MeetingRequest {
  id: string;
  postId: string;
  requesterId: string;
  requesterRole: Role;
  introductoryMessage: string;
  ndaAccepted: boolean;
  ndaAcceptedAt?: string | null;
  proposedSlots: string[];
  selectedSlot: string | null;
  status: MeetingRequestStatus;
  createdAt: string;
}

export interface Message {
  id: string;
  postId: string;
  senderId: string;
  recipientId: string;
  content: string;
  ndaAcceptedAt: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'interest' | 'meeting_request' | 'meeting_confirmed' | 'post_status' | 'account';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userId?: string;
  userName: string;
  role: Role;
  actionType: string;
  targetEntity: string;
  resultStatus: 'success' | 'failure' | 'warning';
  ipPreview: string;
  hash?: string;
  prevHash?: string;
}
