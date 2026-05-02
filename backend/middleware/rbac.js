const Project = require('../models/Project');
const Task = require('../models/Task');

const requireRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to perform this action',
    });
  }

  return next();
};

const resolveProjectId = async (req) => {
  if (req.params.id && req.baseUrl.includes('/projects')) {
    return req.params.id;
  }

  if (req.params.projectId) {
    return req.params.projectId;
  }

  if (req.body.project) {
    return req.body.project;
  }

  if (req.query.projectId) {
    return req.query.projectId;
  }

  if (req.params.id && req.baseUrl.includes('/tasks')) {
    const task = await Task.findById(req.params.id).select('project');
    return task ? task.project : null;
  }

  return null;
};

const requireProjectAdmin = async (req, res, next) => {
  try {
    const projectId = await resolveProjectId(req);

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project id is required',
      });
    }

    let project;
    if (req.user.role === 'admin') {
      project = await Project.findById(projectId);
    } else {
      project = await Project.findOne({
        _id: projectId,
        members: {
          $elemMatch: {
            user: req.user._id,
            role: 'admin',
          },
        },
      });
    }

    if (!project) {
      return res.status(403).json({
        success: false,
        message: 'Project admin access is required',
      });
    }

    req.project = project;
    return next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Unable to verify project permissions',
    });
  }
};

module.exports = {
  requireRole,
  requireProjectAdmin,
};
