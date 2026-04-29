/* eslint-disable */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { calculateProfileCompleteness } = require('../src/services/users');

const prisma = new PrismaClient();

// Mirrors frontend/src/data/mockData.ts so demo accounts behave identically
// in real-mode and mock-mode. Universal demo password: Demo123!
const DEMO_PASSWORD = 'Demo123!';

const STAGE_TO_DB = {
  Ideation: 'ideation',
  Research: 'research',
  Prototype: 'prototype',
  Development: 'development',
  Testing: 'testing',
  'Clinical Validation': 'clinical_validation',
};

const STATUS_TO_DB = {
  Draft: 'draft',
  Active: 'active',
  'Meeting Scheduled': 'meeting_scheduled',
  'Partner Found': 'partner_found',
  Expired: 'expired',
  Removed: 'removed',
};

const CONFIDENTIALITY_TO_DB = {
  Public: 'public',
  Confidential: 'confidential',
  'Highly Confidential': 'highly_confidential',
};

const MEETING_STATUS_TO_DB = {
  Pending: 'pending',
  Accepted: 'accepted',
  Declined: 'declined',
  Scheduled: 'scheduled',
  Completed: 'completed',
  Cancelled: 'cancelled',
};

const seedUsers = [
  {
    id: 'u1',
    email: 'ayse.kaya@hacettepe.edu.tr',
    firstName: 'Ayse',
    lastName: 'Kaya',
    fullName: 'Dr. Ayse Kaya',
    role: 'healthcare',
    institution: 'Hacettepe University Hospital',
    bio: 'Cardiologist focused on remote monitoring and digital follow-up programs.',
    city: 'Ankara',
    country: 'Turkey',
    expertiseTags: ['Cardiology', 'Clinical Trials'],
    interestTags: ['Cardiology', 'Patient Monitoring', 'Remote Care'],
    portfolioSummary: '',
    portfolioLinks: [],
    preferredContactMethod: 'email',
    preferredContactValue: 'ayse.kaya@hacettepe.edu.tr',
    notifyInApp: true,
    notifyEmail: true,
    profileCompleteness: 96,
    onboardingCompleted: true,
    emailVerified: true,
    domainVerified: true,
  },
  {
    id: 'u2',
    email: 'mehmet.demir@metu.edu.tr',
    firstName: 'Mehmet',
    lastName: 'Demir',
    fullName: 'Mehmet Demir',
    role: 'engineer',
    institution: 'METU',
    bio: 'AI researcher focused on medical imaging and biosignal processing.',
    city: 'Ankara',
    country: 'Turkey',
    expertiseTags: ['Machine Learning', 'Computer Vision', 'Signal Processing'],
    interestTags: [],
    portfolioSummary:
      'Applied AI engineer building medical imaging and biosignal decision support prototypes.',
    portfolioLinks: ['https://github.com/mehmetdemir', 'https://mehmetdemir.dev'],
    preferredContactMethod: 'email',
    preferredContactValue: 'mehmet.demir@metu.edu.tr',
    notifyInApp: true,
    notifyEmail: false,
    profileCompleteness: 94,
    onboardingCompleted: true,
    emailVerified: true,
    domainVerified: true,
  },
  {
    id: 'u3',
    email: 'elif.yilmaz@itu.edu.tr',
    firstName: 'Elif',
    lastName: 'Yilmaz',
    fullName: 'Prof. Elif Yilmaz',
    role: 'healthcare',
    institution: 'Istanbul Technical University Hospital',
    bio: 'Radiologist interested in safe AI-assisted diagnostic workflows.',
    city: 'Istanbul',
    country: 'Turkey',
    expertiseTags: ['Radiology', 'Medical Imaging'],
    interestTags: ['Radiology', 'Diagnostics', 'Workflow Design'],
    portfolioSummary: '',
    portfolioLinks: [],
    preferredContactMethod: 'linkedin',
    preferredContactValue: 'linkedin.com/in/elif-yilmaz',
    notifyInApp: true,
    notifyEmail: true,
    profileCompleteness: 98,
    onboardingCompleted: true,
    emailVerified: true,
    domainVerified: true,
  },
  {
    id: 'u4',
    email: 'can.ozturk@bilkent.edu.tr',
    firstName: 'Can',
    lastName: 'Ozturk',
    fullName: 'Can Ozturk',
    role: 'engineer',
    institution: 'Bilkent University',
    bio: 'Hardware engineer specializing in wearable health monitoring devices.',
    city: 'Ankara',
    country: 'Turkey',
    expertiseTags: ['Embedded Systems', 'IoT', 'Wearable Devices'],
    interestTags: [],
    portfolioSummary:
      'Hardware engineer building connected wearables for rehabilitation and remote care.',
    portfolioLinks: ['https://github.com/canozturk'],
    preferredContactMethod: 'email',
    preferredContactValue: 'can.ozturk@bilkent.edu.tr',
    notifyInApp: true,
    notifyEmail: false,
    profileCompleteness: 90,
    onboardingCompleted: true,
    emailVerified: true,
    domainVerified: true,
  },
  {
    id: 'u5',
    email: 'zeynep.arslan@ege.edu.tr',
    firstName: 'Zeynep',
    lastName: 'Arslan',
    fullName: 'Dr. Zeynep Arslan',
    role: 'healthcare',
    institution: 'Ege University Hospital',
    bio: 'Orthopedic surgeon interested in rehabilitation technology partnerships.',
    city: 'Izmir',
    country: 'Turkey',
    expertiseTags: ['Orthopedics', 'Rehabilitation'],
    interestTags: ['Orthopedics', 'Biomechanics', 'Rehabilitation'],
    portfolioSummary: '',
    portfolioLinks: [],
    preferredContactMethod: 'email',
    preferredContactValue: 'zeynep.arslan@ege.edu.tr',
    notifyInApp: true,
    notifyEmail: true,
    profileCompleteness: 93,
    onboardingCompleted: true,
    emailVerified: true,
    domainVerified: true,
  },
  {
    id: 'u6',
    email: 'admin@healthai.edu.tr',
    firstName: 'Admin',
    lastName: 'User',
    fullName: 'Admin User',
    role: 'admin',
    institution: 'Health AI Platform',
    bio: 'Platform administrator.',
    city: 'Ankara',
    country: 'Turkey',
    expertiseTags: ['Platform Management'],
    interestTags: [],
    portfolioSummary: '',
    portfolioLinks: [],
    preferredContactMethod: 'email',
    preferredContactValue: 'admin@healthai.edu.tr',
    notifyInApp: true,
    notifyEmail: false,
    profileCompleteness: 100,
    onboardingCompleted: true,
    emailVerified: true,
    domainVerified: true,
  },
];

const seedPosts = [
  {
    id: 'p1',
    ownerId: 'u1',
    ownerRole: 'healthcare',
    title: 'Cardiology AI assistant for ECG interpretation',
    workingDomain: 'Cardiology',
    shortExplanation:
      'Looking for ML engineers to shape a high-level ECG interpretation assistant for early arrhythmia detection.',
    requiredExpertise: ['Machine Learning', 'Signal Processing', 'Deep Learning'],
    projectStage: 'Ideation',
    collaborationType: 'Co-Development',
    confidentialityLevel: 'Confidential',
    country: 'Turkey',
    city: 'Ankara',
    expiryDate: '2026-06-01',
    autoClose: false,
    status: 'Active',
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-01-10T10:00:00Z',
    matchTags: ['AI', 'Cardiology', 'ECG'],
    commitmentLevel: 'Part-time',
    highLevelIdea:
      'Develop an AI-assisted ECG workflow that helps clinicians triage suspicious rhythms faster without sharing sensitive data on-platform.',
    notesPreview: 'Literature review and high-level workflow are ready.',
  },
  {
    id: 'p2',
    ownerId: 'u2',
    ownerRole: 'engineer',
    title: 'Computer vision for radiology workflow optimization',
    workingDomain: 'Radiology',
    shortExplanation:
      'Seeking radiologists to validate a computer vision workflow for high-level X-ray triage decisions.',
    requiredExpertise: ['Radiology', 'Medical Imaging', 'Clinical Validation'],
    projectStage: 'Prototype',
    collaborationType: 'Clinical Validation',
    confidentialityLevel: 'Public',
    country: 'Turkey',
    city: 'Ankara',
    expiryDate: '2026-05-15',
    autoClose: true,
    status: 'Meeting Scheduled',
    createdAt: '2026-01-08T14:00:00Z',
    updatedAt: '2026-01-12T09:00:00Z',
    matchTags: ['Computer Vision', 'Radiology', 'Triage'],
    commitmentLevel: 'Full-time',
    highLevelIdea:
      'A lightweight triage assistant that prioritizes suspicious scans before detailed off-platform discussions and validation planning.',
    notesPreview: 'Prototype achieving strong offline performance.',
  },
  {
    id: 'p3',
    ownerId: 'u4',
    ownerRole: 'engineer',
    title: 'Orthopedic rehabilitation wearable device',
    workingDomain: 'Orthopedics',
    shortExplanation:
      'Building a wearable sensor for rehabilitation monitoring and need clinical input on movement patterns.',
    requiredExpertise: ['Orthopedics', 'Rehabilitation', 'Biomechanics'],
    projectStage: 'Development',
    collaborationType: 'Advisory',
    confidentialityLevel: 'Confidential',
    country: 'Turkey',
    city: 'Ankara',
    expiryDate: '2026-07-01',
    autoClose: false,
    status: 'Active',
    createdAt: '2026-01-05T08:00:00Z',
    updatedAt: '2026-01-05T08:00:00Z',
    matchTags: ['Wearable', 'Rehabilitation', 'IoT'],
    commitmentLevel: 'Part-time',
    highLevelIdea:
      'A lightweight wearable that tracks joint range of motion and supports clinician-guided feedback outside the platform.',
    notesPreview: 'Hardware prototype ready. Clinical partner needed.',
  },
  {
    id: 'p4',
    ownerId: 'u3',
    ownerRole: 'healthcare',
    title: 'Clinical decision support for emergency departments',
    workingDomain: 'Emergency Medicine',
    shortExplanation:
      'Looking for software engineers to shape a triage support prototype and define a safe first collaboration meeting.',
    requiredExpertise: ['Full-Stack Development', 'NLP', 'Healthcare IT'],
    projectStage: 'Ideation',
    collaborationType: 'Co-Development',
    confidentialityLevel: 'Highly Confidential',
    country: 'Turkey',
    city: 'Istanbul',
    expiryDate: '2026-08-01',
    autoClose: false,
    status: 'Draft',
    createdAt: '2026-01-15T16:00:00Z',
    updatedAt: '2026-01-15T16:00:00Z',
    matchTags: ['Decision Support', 'Emergency', 'NLP'],
    commitmentLevel: 'Full-time',
    highLevelIdea:
      'An NLP-based concept that helps emergency teams reason about triage priorities without exposing detailed clinical assets on-platform.',
    notesPreview: 'Concept stage only. Sensitive details held for external discussion.',
  },
  {
    id: 'p5',
    ownerId: 'u5',
    ownerRole: 'healthcare',
    title: 'Smart prosthetics feedback system',
    workingDomain: 'Rehabilitation Engineering',
    shortExplanation:
      'Seeking embedded systems engineers for a prosthetics concept with real-time haptic feedback.',
    requiredExpertise: ['Embedded Systems', 'Haptic Feedback', 'Prosthetics'],
    projectStage: 'Research',
    collaborationType: 'Co-Development',
    confidentialityLevel: 'Confidential',
    country: 'Turkey',
    city: 'Izmir',
    expiryDate: '2026-09-01',
    autoClose: true,
    status: 'Active',
    createdAt: '2026-01-12T11:00:00Z',
    updatedAt: '2026-01-12T11:00:00Z',
    matchTags: ['Prosthetics', 'Haptics', 'Embedded'],
    commitmentLevel: 'Part-time',
    highLevelIdea:
      'Integrating haptic feedback into prosthetic support systems while keeping implementation specifics off-platform.',
    notesPreview: 'Research framed. Engineering partner needed.',
  },
  {
    id: 'p6',
    ownerId: 'u2',
    ownerRole: 'engineer',
    title: 'Dermatology image classification pipeline',
    workingDomain: 'Dermatology',
    shortExplanation:
      'Have a trained model for skin lesion screening and need dermatologists for high-level clinical feedback.',
    requiredExpertise: ['Dermatology', 'Clinical Trials', 'Medical Imaging'],
    projectStage: 'Testing',
    collaborationType: 'Clinical Validation',
    confidentialityLevel: 'Public',
    country: 'Turkey',
    city: 'Ankara',
    expiryDate: '2026-04-30',
    autoClose: true,
    status: 'Active',
    createdAt: '2025-12-20T09:00:00Z',
    updatedAt: '2026-01-14T15:00:00Z',
    matchTags: ['Dermatology', 'Image Classification', 'AI'],
    commitmentLevel: 'Part-time',
    highLevelIdea:
      'A screening-oriented image classification workflow that needs external dermatology feedback after first contact.',
    notesPreview: 'Seeking early clinical validation partner.',
  },
  {
    id: 'p7',
    ownerId: 'u1',
    ownerRole: 'healthcare',
    title: 'Remote patient monitoring for heart failure',
    workingDomain: 'Cardiology',
    shortExplanation:
      'Developing a remote monitoring protocol for heart failure and need IoT plus cloud engineering support.',
    requiredExpertise: ['IoT', 'Cloud Computing', 'Data Engineering'],
    projectStage: 'Ideation',
    collaborationType: 'Co-Development',
    confidentialityLevel: 'Confidential',
    country: 'Turkey',
    city: 'Ankara',
    expiryDate: '2026-10-01',
    autoClose: false,
    status: 'Partner Found',
    createdAt: '2025-11-01T10:00:00Z',
    updatedAt: '2026-01-10T12:00:00Z',
    matchTags: ['Remote Monitoring', 'IoT', 'Heart Failure'],
    commitmentLevel: 'Full-time',
    highLevelIdea:
      'A cloud-connected monitoring pathway for heart failure patients with details reserved for external meetings.',
    notesPreview: 'Partner identified. Keeping post for reference.',
  },
  {
    id: 'p8',
    ownerId: 'u4',
    ownerRole: 'engineer',
    title: 'Gait analysis using smartphone sensors',
    workingDomain: 'Rehabilitation',
    shortExplanation:
      'Smartphone-based gait analysis tool seeking physiotherapists to define clinical movement benchmarks.',
    requiredExpertise: ['Physiotherapy', 'Biomechanics', 'Mobile Development'],
    projectStage: 'Prototype',
    collaborationType: 'Advisory',
    confidentialityLevel: 'Public',
    country: 'Turkey',
    city: 'Bursa',
    expiryDate: '2026-06-15',
    autoClose: false,
    status: 'Expired',
    createdAt: '2025-10-15T07:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z',
    matchTags: ['Gait Analysis', 'Mobile Health', 'Physiotherapy'],
    commitmentLevel: 'Part-time',
    highLevelIdea:
      'Using smartphone sensor data to reason about gait patterns before deeper collaboration takes place elsewhere.',
    notesPreview: 'Previous outreach closed without a partner.',
  },
];

const seedMeetingRequests = [
  {
    id: 'mr1',
    postId: 'p1',
    requestorId: 'u2',
    recipientId: 'u1',
    requesterRole: 'engineer',
    introductoryMessage:
      'I have strong ECG signal processing experience and would like to discuss whether our work aligns at a high level.',
    ndaAccepted: true,
    ndaAcceptedAt: '2026-01-16T09:00:00Z',
    proposedSlots: ['2026-02-01T10:00', '2026-02-02T14:00', '2026-02-03T11:00'],
    selectedSlot: null,
    status: 'Pending',
    createdAt: '2026-01-16T09:00:00Z',
  },
  {
    id: 'mr2',
    postId: 'p2',
    requestorId: 'u3',
    recipientId: 'u2',
    requesterRole: 'healthcare',
    introductoryMessage:
      'As a radiologist, I can help shape a safe validation plan and define the right first external meeting agenda.',
    ndaAccepted: true,
    ndaAcceptedAt: '2026-01-13T11:00:00Z',
    proposedSlots: ['2026-01-25T09:00', '2026-01-26T15:00'],
    selectedSlot: '2026-01-25T09:00',
    status: 'Scheduled',
    createdAt: '2026-01-13T11:00:00Z',
  },
  {
    id: 'mr3',
    postId: 'p3',
    requestorId: 'u5',
    recipientId: 'u4',
    requesterRole: 'healthcare',
    introductoryMessage:
      'My rehabilitation background aligns with your wearable concept, and I can help shape the first external discussion.',
    ndaAccepted: true,
    ndaAcceptedAt: '2026-01-17T14:00:00Z',
    proposedSlots: ['2026-02-05T10:00', '2026-02-06T13:00', '2026-02-07T09:00'],
    selectedSlot: null,
    status: 'Pending',
    createdAt: '2026-01-17T14:00:00Z',
  },
];

async function main() {
  console.log('Seeding database with frontend-aligned demo data…');

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  for (const u of seedUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        firstName: u.firstName,
        lastName: u.lastName,
        fullName: u.fullName,
        role: u.role,
        institution: u.institution,
        bio: u.bio,
        city: u.city,
        country: u.country,
        expertiseTags: u.expertiseTags,
        interestTags: u.interestTags,
        portfolioSummary: u.portfolioSummary,
        portfolioLinks: u.portfolioLinks,
        preferredContactMethod: u.preferredContactMethod,
        preferredContactValue: u.preferredContactValue,
        notifyInApp: u.notifyInApp,
        notifyEmail: u.notifyEmail,
        profileCompleteness: calculateProfileCompleteness(u),
        onboardingCompleted: u.onboardingCompleted,
        emailVerified: u.emailVerified,
        domainVerified: u.domainVerified,
        verifiedAt: new Date(),
      },
      create: {
        id: u.id,
        email: u.email,
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        fullName: u.fullName,
        role: u.role,
        institution: u.institution,
        bio: u.bio,
        city: u.city,
        country: u.country,
        expertiseTags: u.expertiseTags,
        interestTags: u.interestTags,
        portfolioSummary: u.portfolioSummary,
        portfolioLinks: u.portfolioLinks,
        preferredContactMethod: u.preferredContactMethod,
        preferredContactValue: u.preferredContactValue,
        notifyInApp: u.notifyInApp,
        notifyEmail: u.notifyEmail,
        status: 'active',
        profileCompleteness: calculateProfileCompleteness(u),
        onboardingCompleted: u.onboardingCompleted,
        emailVerified: u.emailVerified,
        domainVerified: u.domainVerified,
        verifiedAt: new Date(),
      },
    });
  }

  for (const p of seedPosts) {
    await prisma.post.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        title: p.title,
        workingDomain: p.workingDomain,
        shortExplanation: p.shortExplanation,
        description: p.shortExplanation,
        domain: p.workingDomain,
        requiredExpertise: p.requiredExpertise,
        matchTags: p.matchTags,
        projectStage: STAGE_TO_DB[p.projectStage] || 'ideation',
        status: STATUS_TO_DB[p.status] || 'active',
        confidentiality: CONFIDENTIALITY_TO_DB[p.confidentialityLevel] || 'public',
        collaborationType: p.collaborationType,
        commitmentLevel: p.commitmentLevel,
        highLevelIdea: p.highLevelIdea,
        notesPreview: p.notesPreview,
        country: p.country,
        city: p.city,
        expiryDate: p.expiryDate ? new Date(p.expiryDate) : null,
        autoClose: p.autoClose,
        authorId: p.ownerId,
        ownerRole: p.ownerRole,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      },
    });

    await prisma.postStatusHistory.create({
      data: {
        postId: p.id,
        status: STATUS_TO_DB[p.status] || 'active',
        changedAt: new Date(p.updatedAt),
        changedBy: p.ownerId,
        reason: 'Seeded',
      },
    });
  }

  for (const m of seedMeetingRequests) {
    const meeting = await prisma.meetingRequest.upsert({
      where: { id: m.id },
      update: {},
      create: {
        id: m.id,
        postId: m.postId,
        requestorId: m.requestorId,
        recipientId: m.recipientId,
        requesterRole: m.requesterRole,
        introductoryMessage: m.introductoryMessage,
        ndaAccepted: m.ndaAccepted,
        ndaAcceptedAt: m.ndaAcceptedAt ? new Date(m.ndaAcceptedAt) : null,
        proposedSlots: m.proposedSlots,
        selectedSlot: m.selectedSlot ? new Date(m.selectedSlot) : null,
        status: MEETING_STATUS_TO_DB[m.status] || 'pending',
        createdAt: new Date(m.createdAt),
        updatedAt: new Date(m.createdAt),
      },
    });

    if (m.ndaAccepted && m.ndaAcceptedAt) {
      await prisma.nDAAcceptance.upsert({
        where: { meetingRequestId: meeting.id },
        update: {},
        create: {
          userId: m.requestorId,
          meetingRequestId: meeting.id,
          acceptedAt: new Date(m.ndaAcceptedAt),
        },
      });
    }
  }

  console.log('Seed complete.');
  console.log('All demo accounts share password: ' + DEMO_PASSWORD);
  console.log('Accounts:');
  for (const u of seedUsers) {
    console.log(`  ${u.role.padEnd(11)} ${u.email}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
