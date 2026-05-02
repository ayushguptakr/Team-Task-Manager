const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const authenticate = require('../middleware/auth');

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

const signAccessToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '15m',
  });

const signRefreshToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });

router.post(
  '/signup',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
  ],
  async (req, res) => {
    try {
      if (sendValidationErrors(req, res)) return;

      const { name, email, password } = req.body;
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already registered',
        });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: 'member',
      });

      return res.status(201).json({
        success: true,
        data: {
          user,
          token: signAccessToken(user),
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Unable to create account',
      });
    }
  }
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    try {
      if (sendValidationErrors(req, res)) return;

      const { email, password } = req.body;
      const user = await User.findOne({ email }).select('+password');

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      const passwordMatches = await bcrypt.compare(password, user.password);

      if (!passwordMatches) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      user.password = undefined;

      return res.json({
        success: true,
        data: {
          user,
          accessToken: signAccessToken(user),
          refreshToken: signRefreshToken(user),
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Unable to login',
      });
    }
  }
);

router.get('/me', authenticate, async (req, res) => {
  try {
    return res.json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Unable to load user profile',
    });
  }
});

module.exports = router;
