const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const postService = require('../services/posts');
const { authenticate, requireVerified, requireRole } = require('../middleware/auth');
const auditLog = require('../middleware/auditLog');
const writeLimit = require('../middleware/writeLimit');
const { safeId, safeQueryString, safeFreeText } = require('../middleware/sanitizers');

const router = express.Router();

const PROJECT_STAGES = [
  'ideation',
  'research',
  'prototype',
  'development',
  'testing',
  'clinical_validation',
];

const POST_STATUSES = ['draft', 'active', 'meeting_scheduled', 'partner_found', 'expired', 'removed'];

const CONFIDENTIALITY_LEVELS = ['public', 'confidential', 'highly_confidential'];

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
    safeQueryString('domain', 200),
    query('status').optional().isIn(POST_STATUSES),
    query('stage').optional().isIn(PROJECT_STAGES),
    safeQueryString('city', 100),
    safeQueryString('country', 100),
    query('ownerId').optional().isString().trim().notEmpty().isLength({ max: 64 }).matches(/^[a-zA-Z0-9_-]+$/),
    safeQueryString('search', 200),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { page, limit, domain, status, stage, city, country, ownerId, search } = req.query;
      const result = await postService.listPosts({
        userId: req.user.id,
        role: req.user.role,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        domain,
        status,
        stage,
        city,
        country,
        ownerId,
        search,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.get('/mine', authenticate, async (req, res, next) => {
  try {
    const result = await postService.listPosts({
      userId: req.user.id,
      role: 'admin', // bypass status filter for own posts; owner sees own confidentials anyway
      ownerId: req.user.id,
      includeAll: true,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authenticate, [safeId('id')], validate, async (req, res, next) => {
  try {
    const post = await postService.getPost(req.params.id, req.user.id, req.user.role);
    res.json(post);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  authenticate,
  writeLimit,
  requireVerified,
  requireRole('engineer', 'healthcare', 'admin'),
  [
    body('title').trim().isLength({ min: 5, max: 200 }).matches(/^[^\x00]*$/),
    body('workingDomain').optional().isString().trim().isLength({ max: 200 }).matches(/^[^\x00]*$/),
    body('domain').optional().isString().trim().isLength({ max: 200 }).matches(/^[^\x00]*$/),
    body('shortExplanation').optional().isString().trim().isLength({ max: 5000 }).matches(/^[^\x00]*$/),
    body('description').optional().isString().trim().isLength({ max: 5000 }).matches(/^[^\x00]*$/),
    body('requiredExpertise').optional().isArray({ max: 30 }),
    body('requiredExpertise.*').optional().isString().trim().isLength({ min: 1, max: 100 }),
    body('matchTags').optional().isArray({ max: 20 }),
    body('matchTags.*').optional().isString().trim().isLength({ min: 1, max: 100 }),
    body('projectStage').optional().isIn(PROJECT_STAGES),
    body('confidentiality').optional().isIn(CONFIDENTIALITY_LEVELS),
    body('confidentialityLevel').optional().isIn(CONFIDENTIALITY_LEVELS),
    body('collaborationType').optional().isString().trim().isLength({ max: 100 }).matches(/^[^\x00]*$/),
    body('commitmentLevel').optional().isString().trim().isLength({ max: 100 }).matches(/^[^\x00]*$/),
    body('highLevelIdea').optional().isString().trim().isLength({ max: 5000 }).matches(/^[^\x00]*$/),
    body('notesPreview').optional().isString().trim().isLength({ max: 1000 }).matches(/^[^\x00]*$/),
    body('country').optional().isString().trim().isLength({ max: 100 }).matches(/^[^\x00]*$/),
    body('city').optional().isString().trim().isLength({ max: 100 }).matches(/^[^\x00]*$/),
    body('expiryDate').optional().isISO8601(),
    body('autoClose').optional().isBoolean(),
    body('publish').optional().isBoolean(),
  ],
  validate,
  auditLog({
    action: 'post_create',
    resource: 'post',
    getResourceId: (_req, _res) => null,
    getTargetEntity: (req) => req.body.title,
  }),
  async (req, res, next) => {
    try {
      if (!req.body.workingDomain && !req.body.domain) {
        return res.status(400).json({ error: 'workingDomain or domain required' });
      }
      if (!req.body.shortExplanation && !req.body.description) {
        return res.status(400).json({ error: 'shortExplanation or description required' });
      }
      const post = await postService.createPost(req.user.id, req.user.role, req.body);
      res.status(201).json(post);
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/:id',
  authenticate,
  requireVerified,
  [safeId('id')],
  validate,
  auditLog({ action: 'post_update', resource: 'post' }),
  async (req, res, next) => {
    try {
      const post = await postService.updatePost(req.params.id, req.user.id, req.user.role, req.body);
      res.json(post);
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  '/:id',
  authenticate,
  [safeId('id')],
  validate,
  auditLog({ action: 'post_delete', resource: 'post' }),
  async (req, res, next) => {
    try {
      await postService.deletePost(req.params.id, req.user.id, req.user.role);
      res.json({ message: 'Post removed' });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:id/status',
  authenticate,
  requireVerified,
  [
    safeId('id'),
    body('status').isIn(POST_STATUSES),
    body('reason').optional().isString().trim().isLength({ max: 500 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const post = await postService.transitionStatus({
        id: req.params.id,
        userId: req.user.id,
        role: req.user.role,
        status: req.body.status,
        reason: req.body.reason,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
      res.json(post);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:id/mark-closed',
  authenticate,
  requireVerified,
  [safeId('id')],
  validate,
  async (req, res, next) => {
    try {
      const post = await postService.markClosed(req.params.id, req.user.id);
      res.json(post);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
