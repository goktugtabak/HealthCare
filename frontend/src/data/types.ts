export type Role = 'engineer' | 'healthcare' | 'admin';

export type PostStatus = 'Draft' | 'Active' | 'Meeting Scheduled' | 'Partner Found' | 'Expired';

export type MeetingRequestStatus = 'Pending' | 'Accepted' | 'Declined' | 'Scheduled' | 'Cancelled' | 'Completed';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  institution: string;
  city: string;
  country: string;
  expertiseTags: string[];
  profileCompleteness: number;
  avatar: string;
  status: 'active' | 'suspended' | 'deactivated';
  bio?: string;
  createdAt: string;
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
}

export interface MeetingRequest {
  id: string;
  postId: string;
  requesterId: string;
  requesterRole: Role;
  introductoryMessage: string;
  ndaAccepted: boolean;
  proposedSlots: string[];
  selectedSlot: string | null;
  status: MeetingRequestStatus;
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
  userName: string;
  role: Role;
  actionType: string;
  targetEntity: string;
  resultStatus: 'success' | 'failure' | 'warning';
  ipPreview: string;
}
