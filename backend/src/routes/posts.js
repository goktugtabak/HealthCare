const express = require('express');
const { body, query, validationResult } = require('express-validator');
const postService = require('../services/posts');
const { authenticate, requireVerified, requireRole } = require('../middleware/auth');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

router.get(
  '/',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('domain').optional().isString(),
    query('status').optional().isIn(['draft', 'active', 'meeting_scheduled', 'partner_found', 'expired']),
    query('stage').optional().isIn(['idea', 'concept', 'prototype', 'pilot', 'deployed']),
    query('search').optional().isString().isLength({ max: 200 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { page, limit, domain, status, stage, search } = req.query;
      const result = await postService.listPosts({
        role: req.user.role,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        domain,
        status,
        stage,
        search,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const post = await postService.getPost(req.params.id);
    res.json(post);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  authenticate,
  requireVerified,
  requireRole('engineer', 'admin'),
  [
    body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Title must be 5-200 characters'),
    body('description').trim().isLength({ min: 20, max: 5000 }).withMessage('Description required'),
    body('domain').trim().notEmpty(),
    body('expertiseNeeded').trim().notEmpty(),
    body('commitmentLevel').trim().notEmpty(),
    body('projectStage').isIn(['idea', 'concept', 'prototype', 'pilot', 'deployed']),
    body('confidentiality').optional().isIn(['public', 'private']),
    body('tags').optional().isArray(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const post = await postService.createPost(req.user.id, {
        ...req.body,
        status: 'active',
      });
      res.status(201).json(post);
    } catch (err) {
      next(err);
    }
  }
);

router.put('/:id', authenticate, requireVerified, async (req, res, next) => {
  try {
    const post = await postService.updatePost(req.params.id, req.user.id, req.user.role, req.body);
    res.json(post);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await postService.deletePost(req.params.id, req.user.id, req.user.role);
    res.json({ message: 'Post deleted' });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/mark-closed', authenticate, requireVerified, async (req, res, next) => {
  try {
    const post = await postService.markClosed(req.params.id, req.user.id);
    res.json(post);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
