require('dotenv').config();
const mongoose = require('mongoose');
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

    // Get all users
    const users = await User.find({});
    if (users.length === 0) {
      console.log('No users found in database. Please run the previous seed or signup some users first.');
      process.exit(0);
    }

    const admin = users.find(u => u.role === 'admin') || users[0];
    const regularUsers = users.filter(u => u._id.toString() !== admin._id.toString());

    console.log(`Found admin: ${admin.email}`);
    console.log(`Found ${regularUsers.length} other users.`);

    // 1. Create a "Shared Team Project" involving EVERYONE
    let sharedProject = await Project.findOne({ name: 'Global Team Initiatives' });
    if (!sharedProject) {
      console.log('Creating Shared Team Project...');
      
      const members = [{ user: admin._id, role: 'admin' }];
      regularUsers.forEach(u => {
        members.push({ user: u._id, role: 'member' });
      });

      sharedProject = await Project.create({
        name: 'Global Team Initiatives',
        description: 'A central project for all team members to collaborate.',
        createdBy: admin._id,
        members: members
      });

      // Create a task for each user in this shared project
      const sharedTasks = [];
      users.forEach((user, index) => {
        const statuses = ['todo', 'in_progress', 'done'];
        sharedTasks.push({
          title: `Initial Setup for ${user.name.split(' ')[0]}`,
          description: `Please complete your onboarding and setup your local environment.`,
          status: statuses[index % 3],
          priority: 'high',
          project: sharedProject._id,
          assignee: user._id,
          createdBy: admin._id,
        });
      });
      await Task.insertMany(sharedTasks);
      console.log('Shared Team Project and collaborative tasks created!');
    } else {
      console.log('Shared Team Project already exists.');
    }

    // 2. Seed an individual project for every user who has 0 projects created by them
    for (const user of users) {
      const userProjectCount = await Project.countDocuments({ createdBy: user._id });
      if (userProjectCount === 0) {
        console.log(`Creating personal project for ${user.email}...`);
        const p = await Project.create({
          name: `${user.name.split(' ')[0]}'s Personal Workspace`,
          description: 'Private tasks and personal notes.',
          createdBy: user._id,
          members: [{ user: user._id, role: 'admin' }]
        });

        // Add a couple of tasks to their personal workspace
        await Task.insertMany([
          {
            title: 'Review Weekly Goals',
            description: 'Check personal goals for the week.',
            status: 'todo',
            priority: 'medium',
            project: p._id,
            assignee: user._id,
            createdBy: user._id,
          },
          {
            title: 'Organize files',
            status: 'done',
            priority: 'low',
            project: p._id,
            assignee: user._id,
            createdBy: user._id,
          }
        ]);
      }
    }

    console.log('Seeding completed successfully. All users now have projects and tasks!');
    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

seed();
