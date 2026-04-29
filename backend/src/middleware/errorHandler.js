const logger = require('./logger');

// H-04: never let server file paths, drive letters, or line:column numbers
// reach the response body in production. Strip anything that looks like a
// stack-frame fragment so a careless `throw new Error(`failed at ${path}`)`
// can't leak filesystem layout to a client.
const PATH_LIKE = /\b(?:[A-Za-z]:\\[^\s)]+|\/[^\s)]+\.[a-z]+:\d+(?::\d+)?|at\s+\S+\s+\([^)]+\))/gi;
const sanitizeProdMessage = (msg) => {
  if (typeof msg !== 'string') return 'Internal server error';
  return msg.replace(PATH_LIKE, '[redacted]').slice(0, 500);
};

const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production';

  if (status >= 500) {
    logger.error(`[${req.method}] ${req.path} — ${err.message}`, { stack: err.stack });
  }

  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'A record with this value already exists' });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found' });
  }

  let body;
  if (isProd) {
    body = {
      error: status >= 500 ? 'Internal server error' : sanitizeProdMessage(err.message),
    };
  } else {
    body = {
      error: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    };
  }

  res.status(status).json(body);
};

module.exports = errorHandler;
