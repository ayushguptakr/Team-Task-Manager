const express = require('express');
const Task = require('../models/Task');
const authenticate = require('../middleware/auth');

const router = express.Router();

const taskPopulation = [
  { path: 'project', select: 'name description' },
  { path: 'assignee', select: 'name email role' },
  { path: 'createdBy', select: 'name email role' },
];

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const assignedFilter = { assignee: req.user._id };
    const overdueFilter = {
      ...assignedFilter,
      dueDate: { $lt: startOfToday },
      status: { $ne: 'done' },
    };

    const [
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      overdueTaskList,
      tasksAssignedToMe,
    ] = await Promise.all([
      Task.countDocuments(assignedFilter),
      Task.countDocuments({ ...assignedFilter, status: 'done' }),
      Task.countDocuments({ ...assignedFilter, status: 'in_progress' }),
      Task.countDocuments(overdueFilter),
      Task.find(overdueFilter).populate(taskPopulation).sort({ dueDate: 1 }),
      Task.find(assignedFilter).populate(taskPopulation).sort({ dueDate: 1, createdAt: -1 }),
    ]);

    return res.json({
      success: true,
      data: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        overdueTaskList,
        tasksAssignedToMe,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Unable to load dashboard',
    });
  }
});

module.exports = router;
