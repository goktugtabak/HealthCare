const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const adminHash = await bcrypt.hash('admin123!', 10);
  const engineerHash = await bcrypt.hash('engineer123!', 10);
  const doctorHash = await bcrypt.hash('doctor123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@healthai.edu' },
    update: {},
    create: {
      email: 'admin@healthai.edu',
      passwordHash: adminHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      institution: 'HEALTH AI',
      verifiedAt: new Date(),
    },
  });

  const engineer = await prisma.user.upsert({
    where: { email: 'john.engineer@mit.edu' },
    update: {},
    create: {
      email: 'john.engineer@mit.edu',
      passwordHash: engineerHash,
      firstName: 'John',
      lastName: 'Engineer',
      role: 'engineer',
      institution: 'MIT',
      bio: 'Full-stack engineer focused on health tech',
      verifiedAt: new Date(),
    },
  });

  const doctor = await prisma.user.upsert({
    where: { email: 'dr.smith@harvard.edu' },
    update: {},
    create: {
      email: 'dr.smith@harvard.edu',
      passwordHash: doctorHash,
      firstName: 'Sarah',
      lastName: 'Smith',
      role: 'doctor',
      institution: 'Harvard Medical',
      bio: 'Cardiologist with 10 years experience',
      verifiedAt: new Date(),
    },
  });

  await prisma.post.upsert({
    where: { id: 'seed-post-001' },
    update: {},
    create: {
      id: 'seed-post-001',
      title: 'AI-Powered ECG Analysis Tool',
      description: 'Looking for a cardiologist to collaborate on building an ML model that can detect arrhythmias from 12-lead ECG data. We have the dataset and initial model architecture ready.',
      domain: 'Cardiology',
      expertiseNeeded: 'Cardiologist with ECG interpretation experience',
      commitmentLevel: '10 hours/week for 6 months',
      projectStage: 'prototype',
      status: 'active',
      confidentiality: 'public',
      tags: ['AI', 'ECG', 'Cardiology', 'Machine Learning'],
      authorId: engineer.id,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.post.upsert({
    where: { id: 'seed-post-002' },
    update: {},
    create: {
      id: 'seed-post-002',
      title: 'Remote Patient Monitoring Platform',
      description: 'Building a real-time patient monitoring dashboard for ICU use. Need clinical validation and workflow integration expertise.',
      domain: 'Critical Care',
      expertiseNeeded: 'ICU physician or nurse practitioner',
      commitmentLevel: '5 hours/week for 3 months',
      projectStage: 'concept',
      status: 'active',
      confidentiality: 'public',
      tags: ['IoT', 'ICU', 'Real-time', 'Dashboard'],
      authorId: engineer.id,
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('Seed complete!');
  console.log(`Admin: admin@healthai.edu / admin123!`);
  console.log(`Engineer: john.engineer@mit.edu / engineer123!`);
  console.log(`Doctor: dr.smith@harvard.edu / doctor123!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
