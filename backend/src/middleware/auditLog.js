const { recordAuditLog } = require('../services/audit');

// Wraps a route handler so the audit log is automatically written
// after the response is sent. Inputs let the caller derive context
// from req/res when params are not enough.
const auditLog = ({ action, resource, getResourceId, getTargetEntity }) =>
  (req, res, next) => {
    res.on('finish', () => {
      const ok = res.statusCode < 400;
      const u = req.user || {};
      const userName =
        u.fullName ||
        [u.firstName, u.lastName].filter(Boolean).join(' ') ||
        u.email ||
        null;
      recordAuditLog({
        userId: u.id,
        userName,
        role: u.role,
        action,
        actionType: action,
        resource,
        resourceId:
          typeof getResourceId === 'function'
            ? getResourceId(req, res)
            : req.params.id || null,
        targetEntity:
          typeof getTargetEntity === 'function' ? getTargetEntity(req, res) : null,
        resultStatus: ok ? 'success' : res.statusCode >= 500 ? 'failure' : 'warning',
        ip: req.ip,
        userAgent: req.get('user-agent'),
        details: {
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,
        },
      });
    });
    next();
  };

module.exports = auditLog;
