import { User, Post, MeetingRequest, Notification, ActivityLog } from './types';

export const mockUsers: User[] = [
  {
    id: 'u1', fullName: 'Dr. Ayşe Kaya', email: 'ayse.kaya@hacettepe.edu.tr', role: 'healthcare',
    institution: 'Hacettepe University Hospital', city: 'Ankara', country: 'Turkey',
    expertiseTags: ['Cardiology', 'Clinical Trials', 'Patient Monitoring'],
    profileCompleteness: 90, avatar: '', status: 'active',
    bio: 'Cardiologist with 12 years of experience in clinical trials and digital health integration.',
    createdAt: '2024-11-15T10:00:00Z'
  },
  {
    id: 'u2', fullName: 'Mehmet Demir', email: 'mehmet.demir@metu.edu.tr', role: 'engineer',
    institution: 'METU', city: 'Ankara', country: 'Turkey',
    expertiseTags: ['Machine Learning', 'Computer Vision', 'Signal Processing'],
    profileCompleteness: 85, avatar: '', status: 'active',
    bio: 'AI researcher focused on medical imaging and biosignal processing.',
    createdAt: '2024-10-20T08:30:00Z'
  },
  {
    id: 'u3', fullName: 'Prof. Elif Yılmaz', email: 'elif.yilmaz@itu.edu.tr', role: 'healthcare',
    institution: 'Istanbul Technical University Hospital', city: 'Istanbul', country: 'Turkey',
    expertiseTags: ['Radiology', 'Medical Imaging', 'Diagnostics'],
    profileCompleteness: 95, avatar: '', status: 'active',
    bio: 'Radiologist pioneering AI-assisted diagnostic workflows.',
    createdAt: '2024-09-05T14:00:00Z'
  },
  {
    id: 'u4', fullName: 'Can Öztürk', email: 'can.ozturk@bilkent.edu.tr', role: 'engineer',
    institution: 'Bilkent University', city: 'Ankara', country: 'Turkey',
    expertiseTags: ['Embedded Systems', 'IoT', 'Wearable Devices'],
    profileCompleteness: 75, avatar: '', status: 'active',
    bio: 'Hardware engineer specializing in wearable health monitoring devices.',
    createdAt: '2024-12-01T09:00:00Z'
  },
  {
    id: 'u5', fullName: 'Dr. Zeynep Arslan', email: 'zeynep.arslan@ege.edu.tr', role: 'healthcare',
    institution: 'Ege University Hospital', city: 'Izmir', country: 'Turkey',
    expertiseTags: ['Orthopedics', 'Rehabilitation', 'Biomechanics'],
    profileCompleteness: 80, avatar: '', status: 'active',
    bio: 'Orthopedic surgeon interested in rehabilitation technology.',
    createdAt: '2024-11-25T11:00:00Z'
  },
  {
    id: 'u6', fullName: 'Admin User', email: 'admin@healthai.edu.tr', role: 'admin',
    institution: 'Health AI Platform', city: 'Ankara', country: 'Turkey',
    expertiseTags: ['Platform Management'],
    profileCompleteness: 100, avatar: '', status: 'active',
    bio: 'Platform administrator.',
    createdAt: '2024-08-01T00:00:00Z'
  },
];

export const mockPosts: Post[] = [
  {
    id: 'p1', ownerId: 'u1', ownerRole: 'healthcare', title: 'Cardiology AI Assistant for ECG Interpretation',
    workingDomain: 'Cardiology', shortExplanation: 'Looking for ML engineers to collaborate on an AI-powered ECG interpretation tool for early arrhythmia detection.',
    requiredExpertise: ['Machine Learning', 'Signal Processing', 'Deep Learning'],
    projectStage: 'Ideation', collaborationType: 'Co-Development', confidentialityLevel: 'Confidential',
    country: 'Turkey', city: 'Ankara', expiryDate: '2025-06-01', autoClose: false,
    status: 'Active', createdAt: '2025-01-10T10:00:00Z', updatedAt: '2025-01-10T10:00:00Z',
    matchTags: ['AI', 'Cardiology', 'ECG'], commitmentLevel: 'Part-time',
    highLevelIdea: 'Develop an AI model that assists cardiologists in interpreting ECG readings with higher accuracy and speed.',
    notesPreview: 'Initial dataset available from clinical trials.'
  },
  {
    id: 'p2', ownerId: 'u2', ownerRole: 'engineer', title: 'Computer Vision for Radiology Workflow Optimization',
    workingDomain: 'Radiology', shortExplanation: 'Seeking radiologists to validate a computer vision pipeline for automated X-ray triage.',
    requiredExpertise: ['Radiology', 'Medical Imaging', 'Clinical Validation'],
    projectStage: 'Prototype', collaborationType: 'Clinical Validation', confidentialityLevel: 'Public',
    country: 'Turkey', city: 'Ankara', expiryDate: '2025-05-15', autoClose: true,
    status: 'Active', createdAt: '2025-01-08T14:00:00Z', updatedAt: '2025-01-12T09:00:00Z',
    matchTags: ['Computer Vision', 'Radiology', 'Triage'], commitmentLevel: 'Full-time',
    highLevelIdea: 'Automated prioritization of X-ray images based on severity using deep learning.',
    notesPreview: 'Prototype achieving 92% accuracy on test set.'
  },
  {
    id: 'p3', ownerId: 'u4', ownerRole: 'engineer', title: 'Orthopedic Rehabilitation Wearable Device',
    workingDomain: 'Orthopedics', shortExplanation: 'Building a wearable sensor for post-surgery rehabilitation monitoring. Need clinical input on movement patterns.',
    requiredExpertise: ['Orthopedics', 'Rehabilitation', 'Biomechanics'],
    projectStage: 'Development', collaborationType: 'Advisory', confidentialityLevel: 'Confidential',
    country: 'Turkey', city: 'Ankara', expiryDate: '2025-07-01', autoClose: false,
    status: 'Active', createdAt: '2025-01-05T08:00:00Z', updatedAt: '2025-01-05T08:00:00Z',
    matchTags: ['Wearable', 'Rehabilitation', 'IoT'], commitmentLevel: 'Part-time',
    highLevelIdea: 'A lightweight wearable that tracks joint range of motion and provides feedback to patients and physicians.',
    notesPreview: 'Hardware prototype ready. Need clinical validation partner.'
  },
  {
    id: 'p4', ownerId: 'u3', ownerRole: 'healthcare', title: 'Clinical Decision Support for Emergency Departments',
    workingDomain: 'Emergency Medicine', shortExplanation: 'Need software engineers to build a clinical decision support prototype for emergency triage.',
    requiredExpertise: ['Full-Stack Development', 'NLP', 'Healthcare IT'],
    projectStage: 'Ideation', collaborationType: 'Co-Development', confidentialityLevel: 'Highly Confidential',
    country: 'Turkey', city: 'Istanbul', expiryDate: '2025-08-01', autoClose: false,
    status: 'Draft', createdAt: '2025-01-15T16:00:00Z', updatedAt: '2025-01-15T16:00:00Z',
    matchTags: ['Decision Support', 'Emergency', 'NLP'], commitmentLevel: 'Full-time',
    highLevelIdea: 'An NLP-based system that analyzes patient intake notes and suggests triage priority levels.',
    notesPreview: 'Conceptual stage. Strong clinical data access available.'
  },
  {
    id: 'p5', ownerId: 'u5', ownerRole: 'healthcare', title: 'Smart Prosthetics Feedback System',
    workingDomain: 'Rehabilitation Engineering', shortExplanation: 'Seeking embedded systems engineers for a smart prosthetics project with real-time haptic feedback.',
    requiredExpertise: ['Embedded Systems', 'Haptic Feedback', 'Prosthetics'],
    projectStage: 'Research', collaborationType: 'Co-Development', confidentialityLevel: 'Confidential',
    country: 'Turkey', city: 'Izmir', expiryDate: '2025-09-01', autoClose: true,
    status: 'Active', createdAt: '2025-01-12T11:00:00Z', updatedAt: '2025-01-12T11:00:00Z',
    matchTags: ['Prosthetics', 'Haptics', 'Embedded'], commitmentLevel: 'Part-time',
    highLevelIdea: 'Integrating haptic feedback into prosthetic limbs to improve user experience and control.',
    notesPreview: 'Literature review completed. Looking for engineering partner.'
  },
  {
    id: 'p6', ownerId: 'u2', ownerRole: 'engineer', title: 'Dermatology Image Classification Pipeline',
    workingDomain: 'Dermatology', shortExplanation: 'Have a trained model for skin lesion classification. Need dermatologists for clinical feedback and validation.',
    requiredExpertise: ['Dermatology', 'Clinical Trials', 'Medical Imaging'],
    projectStage: 'Testing', collaborationType: 'Clinical Validation', confidentialityLevel: 'Public',
    country: 'Turkey', city: 'Ankara', expiryDate: '2025-04-30', autoClose: true,
    status: 'Meeting Scheduled', createdAt: '2024-12-20T09:00:00Z', updatedAt: '2025-01-14T15:00:00Z',
    matchTags: ['Dermatology', 'Image Classification', 'AI'], commitmentLevel: 'Part-time',
    highLevelIdea: 'A deep learning pipeline that classifies skin lesions into categories for preliminary screening.',
    notesPreview: 'Meeting with Dr. Kara scheduled for next week.'
  },
  {
    id: 'p7', ownerId: 'u1', ownerRole: 'healthcare', title: 'Remote Patient Monitoring for Heart Failure',
    workingDomain: 'Cardiology', shortExplanation: 'Developing a remote monitoring protocol for heart failure patients. Need IoT and cloud engineers.',
    requiredExpertise: ['IoT', 'Cloud Computing', 'Data Engineering'],
    projectStage: 'Ideation', collaborationType: 'Co-Development', confidentialityLevel: 'Confidential',
    country: 'Turkey', city: 'Ankara', expiryDate: '2025-10-01', autoClose: false,
    status: 'Partner Found', createdAt: '2024-11-01T10:00:00Z', updatedAt: '2025-01-10T12:00:00Z',
    matchTags: ['Remote Monitoring', 'IoT', 'Heart Failure'], commitmentLevel: 'Full-time',
    highLevelIdea: 'A cloud-connected monitoring system that alerts physicians about deteriorating heart failure patients.',
    notesPreview: 'Partnered with IoT lab at METU.'
  },
  {
    id: 'p8', ownerId: 'u4', ownerRole: 'engineer', title: 'Gait Analysis using Smartphone Sensors',
    workingDomain: 'Rehabilitation', shortExplanation: 'Smartphone-based gait analysis tool. Need physiotherapists to define clinical movement benchmarks.',
    requiredExpertise: ['Physiotherapy', 'Biomechanics', 'Mobile Development'],
    projectStage: 'Prototype', collaborationType: 'Advisory', confidentialityLevel: 'Public',
    country: 'Turkey', city: 'Bursa', expiryDate: '2025-06-15', autoClose: false,
    status: 'Expired', createdAt: '2024-10-15T07:00:00Z', updatedAt: '2025-01-15T00:00:00Z',
    matchTags: ['Gait Analysis', 'Mobile Health', 'Physiotherapy'], commitmentLevel: 'Part-time',
    highLevelIdea: 'Using accelerometer and gyroscope data from smartphones to analyze walking patterns.',
    notesPreview: 'Post expired without match.'
  },
];

export const mockMeetingRequests: MeetingRequest[] = [
  {
    id: 'mr1', postId: 'p1', requesterId: 'u2', requesterRole: 'engineer',
    introductoryMessage: 'I have extensive experience in ECG signal processing and would love to collaborate on this project. My team has published several papers on arrhythmia detection using deep learning.',
    ndaAccepted: true, proposedSlots: ['2025-02-01T10:00', '2025-02-02T14:00', '2025-02-03T11:00'],
    selectedSlot: null, status: 'Pending', createdAt: '2025-01-16T09:00:00Z'
  },
  {
    id: 'mr2', postId: 'p2', requesterId: 'u3', requesterRole: 'healthcare',
    introductoryMessage: 'As a radiologist, I can provide clinical validation for your X-ray triage system. We have access to a large anonymized dataset.',
    ndaAccepted: true, proposedSlots: ['2025-01-25T09:00', '2025-01-26T15:00'],
    selectedSlot: '2025-01-25T09:00', status: 'Scheduled', createdAt: '2025-01-13T11:00:00Z'
  },
  {
    id: 'mr3', postId: 'p3', requesterId: 'u5', requesterRole: 'healthcare',
    introductoryMessage: 'My expertise in orthopedic rehabilitation aligns perfectly with your wearable device project. I can advise on clinical movement patterns and recovery protocols.',
    ndaAccepted: true, proposedSlots: ['2025-02-05T10:00', '2025-02-06T13:00', '2025-02-07T09:00'],
    selectedSlot: null, status: 'Pending', createdAt: '2025-01-17T14:00:00Z'
  },
];

export const mockNotifications: Notification[] = [
  {
    id: 'n1', userId: 'u1', type: 'meeting_request', title: 'New Meeting Request',
    message: 'Mehmet Demir has requested a meeting for "Cardiology AI Assistant for ECG Interpretation".',
    createdAt: '2025-01-16T09:05:00Z', read: false
  },
  {
    id: 'n2', userId: 'u2', type: 'post_status', title: 'Post Status Updated',
    message: 'Your post "Dermatology Image Classification Pipeline" has a meeting scheduled.',
    createdAt: '2025-01-14T15:05:00Z', read: true
  },
  {
    id: 'n3', userId: 'u3', type: 'meeting_confirmed', title: 'Meeting Confirmed',
    message: 'Your meeting for "Computer Vision for Radiology Workflow Optimization" has been confirmed for Jan 25.',
    createdAt: '2025-01-14T12:00:00Z', read: false
  },
  {
    id: 'n4', userId: 'u4', type: 'interest', title: 'Interest Received',
    message: 'Dr. Zeynep Arslan expressed interest in "Orthopedic Rehabilitation Wearable Device".',
    createdAt: '2025-01-17T14:05:00Z', read: false
  },
  {
    id: 'n5', userId: 'u1', type: 'account', title: 'Profile Reminder',
    message: 'Complete your profile to increase visibility. You are at 90% completeness.',
    createdAt: '2025-01-10T08:00:00Z', read: true
  },
];

export const mockActivityLogs: ActivityLog[] = [
  { id: 'al1', timestamp: '2025-01-17T14:05:00Z', userName: 'Dr. Zeynep Arslan', role: 'healthcare', actionType: 'Meeting Request Sent', targetEntity: 'Orthopedic Rehabilitation Wearable Device', resultStatus: 'success', ipPreview: '192.168.1.***' },
  { id: 'al2', timestamp: '2025-01-16T09:05:00Z', userName: 'Mehmet Demir', role: 'engineer', actionType: 'Meeting Request Sent', targetEntity: 'Cardiology AI Assistant for ECG Interpretation', resultStatus: 'success', ipPreview: '10.0.0.***' },
  { id: 'al3', timestamp: '2025-01-15T16:00:00Z', userName: 'Prof. Elif Yılmaz', role: 'healthcare', actionType: 'Post Created (Draft)', targetEntity: 'Clinical Decision Support for Emergency Departments', resultStatus: 'success', ipPreview: '172.16.0.***' },
  { id: 'al4', timestamp: '2025-01-14T15:00:00Z', userName: 'Mehmet Demir', role: 'engineer', actionType: 'Meeting Scheduled', targetEntity: 'Dermatology Image Classification Pipeline', resultStatus: 'success', ipPreview: '10.0.0.***' },
  { id: 'al5', timestamp: '2025-01-13T11:00:00Z', userName: 'Prof. Elif Yılmaz', role: 'healthcare', actionType: 'Meeting Request Sent', targetEntity: 'Computer Vision for Radiology Workflow Optimization', resultStatus: 'success', ipPreview: '172.16.0.***' },
  { id: 'al6', timestamp: '2025-01-10T12:00:00Z', userName: 'Dr. Ayşe Kaya', role: 'healthcare', actionType: 'Partner Found', targetEntity: 'Remote Patient Monitoring for Heart Failure', resultStatus: 'success', ipPreview: '192.168.1.***' },
  { id: 'al7', timestamp: '2025-01-10T10:00:00Z', userName: 'Dr. Ayşe Kaya', role: 'healthcare', actionType: 'Post Published', targetEntity: 'Cardiology AI Assistant for ECG Interpretation', resultStatus: 'success', ipPreview: '192.168.1.***' },
];

export const domainOptions = ['Cardiology', 'Radiology', 'Orthopedics', 'Emergency Medicine', 'Rehabilitation Engineering', 'Dermatology', 'Rehabilitation', 'Neurology', 'Oncology'];
export const stageOptions = ['Ideation', 'Research', 'Prototype', 'Development', 'Testing', 'Clinical Validation'];
export const collaborationTypes = ['Co-Development', 'Clinical Validation', 'Advisory', 'Consulting', 'Research Partnership'];
export const confidentialityLevels = ['Public', 'Confidential', 'Highly Confidential'] as const;
export const commitmentLevels = ['Part-time', 'Full-time', 'Flexible'];
export const expertiseOptions = ['Machine Learning', 'Computer Vision', 'Signal Processing', 'Deep Learning', 'NLP', 'IoT', 'Cloud Computing', 'Full-Stack Development', 'Embedded Systems', 'Data Engineering', 'Haptic Feedback', 'Mobile Development', 'Cardiology', 'Radiology', 'Orthopedics', 'Rehabilitation', 'Biomechanics', 'Dermatology', 'Medical Imaging', 'Clinical Trials', 'Diagnostics', 'Physiotherapy', 'Prosthetics', 'Patient Monitoring', 'Healthcare IT'];
