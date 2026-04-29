const { param, query, body } = require('express-validator');

// Accepts UUIDs OR seed-stable IDs (p1, u2, mr3). Rejects null bytes, slashes, dots-pair.
const safeId = (name = 'id') =>
  param(name)
    .isString()
    .trim()
    .notEmpty()
    .isLength({ max: 64 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Invalid ID format');

const safeQueryString = (name, max = 200) =>
  query(name)
    .optional()
    .isString()
    .trim()
    .isLength({ max })
    .matches(/^[^\x00]*$/)
    .not()
    .contains('..')
    .withMessage('Invalid query value');

const safeFreeText = (name, max) =>
  body(name)
    .optional()
    .isString()
    .isLength({ max })
    .matches(/^[^\x00]*$/);

module.exports = { safeId, safeQueryString, safeFreeText };
