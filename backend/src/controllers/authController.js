const crypto = require('crypto');

const TOKEN_TTL_SECONDS = 8 * 60 * 60;

function getTokenSecret() {
  const secret = process.env.ADMIN_TOKEN_SECRET;
  return secret && secret.length >= 32 ? secret : null;
}

function sign(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

exports.login = (req, res) => {
  const { username, password } = req.body || {};
  const configuredUsername = process.env.ADMIN_USERNAME;
  const configuredPassword = process.env.ADMIN_PASSWORD;
  const secret = getTokenSecret();

  if (!configuredUsername || !configuredPassword || !secret) {
    return res.status(503).json({
      error: 'Admin login is not configured. Set ADMIN_USERNAME, ADMIN_PASSWORD, and an ADMIN_TOKEN_SECRET of at least 32 characters.'
    });
  }

  const usernameMatches = crypto.timingSafeEqual(
    crypto.createHash('sha256').update(String(username || '')).digest(),
    crypto.createHash('sha256').update(configuredUsername).digest()
  );
  const passwordMatches = crypto.timingSafeEqual(
    crypto.createHash('sha256').update(String(password || '')).digest(),
    crypto.createHash('sha256').update(configuredPassword).digest()
  );

  if (!usernameMatches || !passwordMatches) {
    return res.status(401).json({ error: 'Invalid administrator credentials.' });
  }

  const payload = Buffer.from(JSON.stringify({
    sub: configuredUsername,
    role: 'admin',
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS
  })).toString('base64url');
  const token = `${payload}.${sign(payload, secret)}`;
  return res.json({
    success: true,
    token,
    user: { username: configuredUsername, role: 'admin' },
    expiresIn: TOKEN_TTL_SECONDS
  });
};

exports.requireAdmin = (req, res, next) => {
  const secret = getTokenSecret();
  const authorization = req.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  const [payload, signature, extra] = token.split('.');

  if (!secret || !payload || !signature || extra) {
    return res.status(401).json({ error: 'Administrator authentication is required.' });
  }

  const expectedSignature = sign(payload, secret);
  const supplied = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
    return res.status(401).json({ error: 'Invalid administrator session.' });
  }

  try {
    const user = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (user.role !== 'admin' || !user.sub || !Number.isFinite(user.exp) ||
        user.exp <= Math.floor(Date.now() / 1000)) {
      return res.status(401).json({ error: 'Administrator session has expired.' });
    }
    req.adminUser = { username: user.sub, role: user.role };
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid administrator session.' });
  }
};

exports.getProfile = (req, res) => {
  res.json({ user: req.adminUser });
};
