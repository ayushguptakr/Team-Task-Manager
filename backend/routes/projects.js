const express = require('express');
const { body, param, validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const authenticate = require('../middleware/auth');
const { requireRole, requireProjectAdmin } = require('../middleware/rbac');

const router = express.Router();

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

const requireProjectMember = async (req, res, next) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== 'admin') {
      query['members.user'] = req.user._id;
    }
    const project = await Project.findOne(query).populate('members.user', 'name email role');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    req.project = project;
    return next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Unable to load project',
    });
  }
};

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { 'members.user': req.user._id };
    const projects = await Project.find(query)
      .populate('createdBy', 'name email role')
      .populate('members.user', 'name email role')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: { projects },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Unable to load projects',
    });
  }
});

router.post(
  '/',
  requireRole('admin'),
  [
    body('name').trim().notEmpty().withMessage('Project name is required'),
    body('description').optional().trim(),
  ],
  async (req, res) => {
    try {
      if (sendValidationErrors(req, res)) return;

      const project = await Project.create({
        name: req.body.name,
        description: req.body.description || '',
        createdBy: req.user._id,
        members: [{ user: req.user._id, role: 'admin' }],
      });

      const populatedProject = await project.populate([
        { path: 'createdBy', select: 'name email role' },
        { path: 'members.user', select: 'name email role' },
      ]);

      return res.status(201).json({
        success: true,
        data: { project: populatedProject },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Unable to create project',
      });
    }
  }
);

router.get(
  '/:id',
  [param('id').isMongoId().withMessage('A valid project id is required')],
  async (req, res, next) => {
    if (sendValidationErrors(req, res)) return;
    return next();
  },
  requireProjectMember,
  async (req, res) => {
    try {
      return res.json({
        success: true,
        data: { project: req.project },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Unable to load project',
      });
    }
  }
);

router.post(
  '/:id/members',
  [
    param('id').isMongoId().withMessage('A valid project id is required'),
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('role').optional().isIn(['admin', 'member']).withMessage('Role must be admin or member'),
  ],
  async (req, res, next) => {
    if (sendValidationErrors(req, res)) return;
    return next();
  },
  requireProjectAdmin,
  async (req, res) => {
    try {
      const user = await User.findOne({ email: req.body.email });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      const isExistingMember = req.project.members.some(
        (member) => member.user.toString() === user._id.toString()
      );

      if (isExistingMember) {
        return res.status(400).json({
          success: false,
          message: 'User is already a project member',
        });
      }

      req.project.members.push({
        user: user._id,
        role: req.body.role || 'member',
      });

      await req.project.save();
      await req.project.populate('members.user', 'name email role');

      return res.status(201).json({
        success: true,
        data: { project: req.project },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Unable to add project member',
      });
    }
  }
);

router.delete(
  '/:id/members/:userId',
  [
    param('id').isMongoId().withMessage('A valid project id is required'),
    param('userId').isMongoId().withMessage('A valid user id is required'),
  ],
  async (req, res, next) => {
    if (sendValidationErrors(req, res)) return;
    return next();
  },
  requireProjectAdmin,
  async (req, res) => {
    try {
      const beforeCount = req.project.members.length;
      req.project.members = req.project.members.filter(
        (member) => member.user.toString() !== req.params.userId
      );

      if (req.project.members.length === beforeCount) {
        return res.status(404).json({
          success: false,
          message: 'Project member not found',
        });
      }

      await req.project.save();
      await req.project.populate('members.user', 'name email role');

      return res.json({
        success: true,
        data: { project: req.project },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Unable to remove project member',
      });
    }
  }
);

router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('A valid project id is required')],
  async (req, res, next) => {
    if (sendValidationErrors(req, res)) return;
    return next();
  },
  requireProjectAdmin,
  async (req, res) => {
    try {
      await Task.deleteMany({ project: req.project._id });
      await Project.deleteOne({ _id: req.project._id });

      return res.json({
        success: true,
        data: { deletedProjectId: req.project._id },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Unable to delete project',
      });
    }
  }
);

module.exports = router;
