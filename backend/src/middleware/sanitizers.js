const { param, query, body } = require('express-validator');
const sanitizeHtml = require('sanitize-html');

// M-03: defence-in-depth — strip ALL HTML/script content at storage time so
// that any future render path that does not escape (e.g. accidental
// dangerouslySetInnerHTML) still cannot reach an XSS payload.
const sanitiseUserText = (text) => {
  if (text == null) return text;
  return sanitizeHtml(text, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
    enforceHtmlBoundary: true,
  });
};

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

module.exports = { safeId, safeQueryString, safeFreeText, sanitiseUserText };
