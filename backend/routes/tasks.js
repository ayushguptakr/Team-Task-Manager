const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const authenticate = require('../middleware/auth');

const router = express.Router();

const taskPopulation = [
  { path: 'project', select: 'name description' },
  { path: 'assignee', select: 'name email role' },
  { path: 'createdBy', select: 'name email role' },
];

const sendValidationErrors = (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: errors.array().map((error) => error.msg).join(', '),
    });
    return true;
  }

  return false;
};

const findProjectForUser = (projectId, user) => {
  const query = { _id: projectId };
  if (user.role !== 'admin') {
    query['members.user'] = user._id;
  }
  return Project.findOne(query);
};

const requireTaskAccess = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const project = await findProjectForUser(task.project, req.user);

    if (!project) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this task',
      });
    }

    req.task = task;
    req.project = project;
    return next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Unable to verify task access',
    });
  }
};

const ensureAssigneeInProject = async (assigneeId, projectId) => {
  if (!assigneeId) return true;

  const user = await User.findById(assigneeId);
  if (!user) return false;

  const project = await Project.findOne({
    _id: projectId,
    'members.user': assigneeId,
  });

  return Boolean(project);
};

const requireLoadedProjectAdmin = (req, res, next) => {
  if (req.user.role === 'admin') {
    return next();
  }
  const member = req.project.members.find(
    (projectMember) => projectMember.user.toString() === req.user._id.toString()
  );

  if (!member || member.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Project admin access is required',
    });
  }

  return next();
};

router.use(authenticate);

router.get(
  '/',
  [
    query('projectId').isMongoId().withMessage('A valid project id is required'),
    query('status')
      .optional()
      .isIn(['todo', 'in_progress', 'done'])
      .withMessage('Status must be todo, in_progress, or done'),
    query('assignee').optional().isMongoId().withMessage('A valid assignee id is required'),
  ],
  async (req, res) => {
    try {
      if (sendValidationErrors(req, res)) return;

      const project = await findProjectForUser(req.query.projectId, req.user);

      if (!project) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this project',
        });
      }

      const filter = { project: req.query.projectId };

      if (req.query.status) {
        filter.status = req.query.status;
      }

      if (req.query.assignee) {
        filter.assignee = req.query.assignee;
      }

      const tasks = await Task.find(filter).populate(taskPopulation).sort({ createdAt: -1 });

      return res.json({
        success: true,
        data: { tasks },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Unable to load tasks',
      });
    }
  }
);

router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Task title is required'),
    body('description').optional().trim(),
    body('status')
      .optional()
      .isIn(['todo', 'in_progress', 'done'])
      .withMessage('Status must be todo, in_progress, or done'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high'])
      .withMessage('Priority must be low, medium, or high'),
    body('dueDate').optional().isISO8601().withMessage('Due date must be a valid date'),
    body('project').isMongoId().withMessage('A valid project id is required'),
    body('assignee').optional().isMongoId().withMessage('A valid assignee id is required'),
  ],
  async (req, res) => {
    try {
      if (sendValidationErrors(req, res)) return;

      const project = await findProjectForUser(req.body.project, req.user);

      if (!project) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this project',
        });
      }

      const assigneeIsValid = await ensureAssigneeInProject(req.body.assignee, req.body.project);

      if (!assigneeIsValid) {
        return res.status(400).json({
          success: false,
          message: 'Assignee must be a member of the project',
        });
      }

      const task = await Task.create({
        title: req.body.title,
        description: req.body.description || '',
        status: req.body.status || 'todo',
        priority: req.body.priority || 'medium',
        dueDate: req.body.dueDate,
        project: req.body.project,
        assignee: req.body.assignee,
        createdBy: req.user._id,
      });

      const populatedTask = await task.populate(taskPopulation);

      return res.status(201).json({
        success: true,
        data: { task: populatedTask },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Unable to create task',
      });
    }
  }
);

router.get(
  '/:id',
  [param('id').isMongoId().withMessage('A valid task id is required')],
  async (req, res, next) => {
    if (sendValidationErrors(req, res)) return;
    return next();
  },
  requireTaskAccess,
  async (req, res) => {
    try {
      const task = await req.task.populate(taskPopulation);

      return res.json({
        success: true,
        data: { task },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Unable to load task',
      });
    }
  }
);

router.patch(
  '/:id',
  [
    param('id').isMongoId().withMessage('A valid task id is required'),
    body('title').optional().trim().notEmpty().withMessage('Task title cannot be empty'),
    body('description').optional().trim(),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high'])
      .withMessage('Priority must be low, medium, or high'),
    body('dueDate').optional().isISO8601().withMessage('Due date must be a valid date'),
    body('assignee').optional().isMongoId().withMessage('A valid assignee id is required'),
    body('status')
      .optional()
      .isIn(['todo', 'in_progress', 'done'])
      .withMessage('Status must be todo, in_progress, or done'),
  ],
  async (req, res, next) => {
    if (sendValidationErrors(req, res)) return;
    return next();
  },
  requireTaskAccess,
  async (req, res) => {
    try {
      const allowedFields = ['title', 'description', 'priority', 'dueDate', 'assignee', 'status'];

      if (req.body.assignee) {
        const assigneeIsValid = await ensureAssigneeInProject(
          req.body.assignee,
          req.task.project
        );

        if (!assigneeIsValid) {
          return res.status(400).json({
            success: false,
            message: 'Assignee must be a member of the project',
          });
        }
      }

      allowedFields.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(req.body, field)) {
          req.task[field] = req.body[field];
        }
      });

      await req.task.save();
      const task = await req.task.populate(taskPopulation);

      return res.json({
        success: true,
        data: { task },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Unable to update task',
      });
    }
  }
);

router.patch(
  '/:id/status',
  [
    param('id').isMongoId().withMessage('A valid task id is required'),
    body('status')
      .isIn(['todo', 'in_progress', 'done'])
      .withMessage('Status must be todo, in_progress, or done'),
  ],
  async (req, res, next) => {
    if (sendValidationErrors(req, res)) return;
    return next();
  },
  requireTaskAccess,
  async (req, res) => {
    try {
      req.task.status = req.body.status;
      await req.task.save();
      const task = await req.task.populate(taskPopulation);

      return res.json({
        success: true,
        data: { task },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Unable to update task status',
      });
    }
  }
);

router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('A valid task id is required')],
  async (req, res, next) => {
    if (sendValidationErrors(req, res)) return;
    return next();
  },
  requireTaskAccess,
  requireLoadedProjectAdmin,
  async (req, res) => {
    try {
      await Task.deleteOne({ _id: req.task._id });

      return res.json({
        success: true,
        data: { deletedTaskId: req.task._id },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Unable to delete task',
      });
    }
  }
);

module.exports = router;
