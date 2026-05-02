require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Project = require('./models/Project');
const Task = require('./models/Task');

async function seed() {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI is not set in .env');
      process.exit(1);
    }

    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    // ---- CLEAN SLATE ----
    console.log('Clearing existing data...');
    await Task.deleteMany({});
    await Project.deleteMany({});
    await User.deleteMany({});
    console.log('Database cleared.');

    // ---- HASH PASSWORD ----
    const hashedPassword = await bcrypt.hash('password123', 12);

    // ---- CREATE USERS ----
    console.log('Creating users...');
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@taskflow.com',
      password: hashedPassword,
      role: 'admin',
    });

    const jordan = await User.create({
      name: 'Jordan Smith',
      email: 'jordan@taskflow.com',
      password: hashedPassword,
      role: 'member',
    });

    const priya = await User.create({
      name: 'Priya Sharma',
      email: 'priya@taskflow.com',
      password: hashedPassword,
      role: 'member',
    });

    const rahul = await User.create({
      name: 'Rahul Verma',
      email: 'rahul@taskflow.com',
      password: hashedPassword,
      role: 'member',
    });

    console.log('Users created:');
    console.log(`  Admin:  ${admin.email}  (role: admin)`);
    console.log(`  Jordan: ${jordan.email} (role: member)`);
    console.log(`  Priya:  ${priya.email}  (role: member)`);
    console.log(`  Rahul:  ${rahul.email}  (role: member)`);

    // ---- CREATE PROJECTS ----
    // Admin is the creator but NOT in the members array.
    // Admin sees all projects via role-based access, not membership.
    console.log('\nCreating projects...');

    const project1 = await Project.create({
      name: 'Website Redesign',
      description: 'Overhaul the corporate website with a modern, responsive design.',
      createdBy: admin._id,
      members: [
        { user: jordan._id, role: 'admin' },
        { user: priya._id, role: 'member' },
      ],
    });

    const project2 = await Project.create({
      name: 'Mobile App MVP',
      description: 'Build the first version of the cross-platform mobile application.',
      createdBy: admin._id,
      members: [
        { user: priya._id, role: 'admin' },
        { user: rahul._id, role: 'member' },
      ],
    });

    const project3 = await Project.create({
      name: 'API Integration Suite',
      description: 'Develop and document REST APIs for third-party integrations.',
      createdBy: admin._id,
      members: [
        { user: jordan._id, role: 'admin' },
        { user: rahul._id, role: 'member' },
      ],
    });

    console.log(`  Project 1: "${project1.name}" → Members: Jordan, Priya`);
    console.log(`  Project 2: "${project2.name}" → Members: Priya, Rahul`);
    console.log(`  Project 3: "${project3.name}" → Members: Jordan, Rahul`);

    // ---- CREATE TASKS ----
    console.log('\nCreating tasks...');

    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    // Project 1 tasks (Jordan + Priya)
    await Task.insertMany([
      {
        title: 'Design homepage wireframes',
        description: 'Create wireframes for the new homepage layout in Figma.',
        status: 'in_progress',
        priority: 'high',
        project: project1._id,
        assignee: jordan._id,
        createdBy: admin._id,
        dueDate: new Date(now + 3 * day),
      },
      {
        title: 'Setup design system tokens',
        description: 'Define color palette, typography, and spacing variables.',
        status: 'done',
        priority: 'medium',
        project: project1._id,
        assignee: priya._id,
        createdBy: admin._id,
        dueDate: new Date(now - 2 * day),
      },
      {
        title: 'Build responsive navigation',
        description: 'Implement mobile-first navigation with hamburger menu.',
        status: 'todo',
        priority: 'high',
        project: project1._id,
        assignee: jordan._id,
        createdBy: admin._id,
        dueDate: new Date(now + 7 * day),
      },
      {
        title: 'Create contact page',
        description: 'Design and implement the contact form with validation.',
        status: 'todo',
        priority: 'low',
        project: project1._id,
        assignee: priya._id,
        createdBy: admin._id,
        dueDate: new Date(now + 10 * day),
      },
      {
        title: 'SEO audit and meta tags',
        description: 'Audit current SEO performance and add proper meta tags.',
        status: 'in_progress',
        priority: 'medium',
        project: project1._id,
        assignee: priya._id,
        createdBy: admin._id,
        dueDate: new Date(now + 5 * day),
      },
    ]);

    // Project 2 tasks (Priya + Rahul)
    await Task.insertMany([
      {
        title: 'Setup React Native project',
        description: 'Initialize the React Native project with Expo.',
        status: 'done',
        priority: 'high',
        project: project2._id,
        assignee: rahul._id,
        createdBy: admin._id,
        dueDate: new Date(now - 5 * day),
      },
      {
        title: 'Design login/signup screens',
        description: 'Create UI mockups for authentication flow.',
        status: 'in_progress',
        priority: 'high',
        project: project2._id,
        assignee: priya._id,
        createdBy: admin._id,
        dueDate: new Date(now + 2 * day),
      },
      {
        title: 'Implement push notifications',
        description: 'Integrate Firebase Cloud Messaging for push notifications.',
        status: 'todo',
        priority: 'medium',
        project: project2._id,
        assignee: rahul._id,
        createdBy: admin._id,
        dueDate: new Date(now + 14 * day),
      },
      {
        title: 'Build user profile screen',
        description: 'Implement profile view with avatar upload and edit functionality.',
        status: 'todo',
        priority: 'low',
        project: project2._id,
        assignee: priya._id,
        createdBy: admin._id,
        dueDate: new Date(now + 12 * day),
      },
      {
        title: 'Setup CI/CD pipeline',
        description: 'Configure GitHub Actions for automated builds and deployments.',
        status: 'in_progress',
        priority: 'high',
        project: project2._id,
        assignee: rahul._id,
        createdBy: admin._id,
        dueDate: new Date(now + 4 * day),
      },
    ]);

    // Project 3 tasks (Jordan + Rahul)
    await Task.insertMany([
      {
        title: 'Define API schema',
        description: 'Document all endpoint schemas using OpenAPI/Swagger spec.',
        status: 'done',
        priority: 'high',
        project: project3._id,
        assignee: jordan._id,
        createdBy: admin._id,
        dueDate: new Date(now - 3 * day),
      },
      {
        title: 'Build authentication middleware',
        description: 'Implement JWT-based auth middleware with refresh token support.',
        status: 'in_progress',
        priority: 'high',
        project: project3._id,
        assignee: rahul._id,
        createdBy: admin._id,
        dueDate: new Date(now + 1 * day),
      },
      {
        title: 'Write integration tests',
        description: 'Add Jest test suites for all critical API endpoints.',
        status: 'todo',
        priority: 'medium',
        project: project3._id,
        assignee: jordan._id,
        createdBy: admin._id,
        dueDate: new Date(now + 8 * day),
      },
      {
        title: 'Rate limiting and throttling',
        description: 'Implement rate limiting per-IP and per-user for all endpoints.',
        status: 'todo',
        priority: 'medium',
        project: project3._id,
        assignee: rahul._id,
        createdBy: admin._id,
        dueDate: new Date(now + 9 * day),
      },
    ]);

    console.log('  Project 1: 5 tasks created');
    console.log('  Project 2: 5 tasks created');
    console.log('  Project 3: 4 tasks created');

    console.log('\n========================================');
    console.log('  SEEDING COMPLETE');
    console.log('========================================');
    console.log('  4 users | 3 projects | 14 tasks');
    console.log('');
    console.log('  Test Credentials (all use password123):');
    console.log('  ──────────────────────────────────────');
    console.log('  Admin:  admin@taskflow.com   → sees ALL 3 projects');
    console.log('  Jordan: jordan@taskflow.com  → sees Project 1 & 3');
    console.log('  Priya:  priya@taskflow.com   → sees Project 1 & 2');
    console.log('  Rahul:  rahul@taskflow.com   → sees Project 2 & 3');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

seed();
