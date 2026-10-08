const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET =
  process.env.JWT_SECRET ||
  (() => {
    console.warn(
      'JWT_SECRET is not set in backend/.env — using a random secret for this run. ' +
        'Everyone will be logged out on the next restart; set a real value to avoid that.'
    );
    return crypto.randomBytes(48).toString('hex');
  })();

const COOKIE_NAME = 'token';
const TOKEN_TTL = '30d';
// Identifying attributes shared by every cookie.set/clear call — these must
// match exactly or the browser treats set and clear as different cookies.
const BASE_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};
const COOKIE_OPTIONS = { ...BASE_COOKIE_OPTIONS, maxAge: 30 * 24 * 60 * 60 * 1000 }; // 30 days, matches TOKEN_TTL
// res.clearCookie must NOT receive maxAge/expires: Express merges whatever
// options you pass on top of its own `expires: new Date(1)`, so including our
// 30-day maxAge here would silently re-extend the cookie instead of expiring it.
const CLEAR_COOKIE_OPTIONS = BASE_COOKIE_OPTIONS;

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

function signToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

function verifyToken(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return payload.sub;
  } catch {
    return null;
  }
}

function requireAuth(req, res, next) {
  const userId = verifyToken(req.cookies?.[COOKIE_NAME]);
  if (!userId) {
    res.clearCookie(COOKIE_NAME, CLEAR_COOKIE_OPTIONS);
    return res.status(401).json({ error: 'Not authenticated' });
  }
  req.userId = userId;
  next();
}

module.exports = {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  requireAuth,
  COOKIE_NAME,
  COOKIE_OPTIONS,
  CLEAR_COOKIE_OPTIONS,
};
