const ipWhitelist = (req, res, next) => {
  const whitelist = process.env.IP_WHITELIST;

  // If IP_WHITELIST is empty or not set, allow all
  if (!whitelist || whitelist.trim() === '') {
    return next();
  }

  const allowedIPs = whitelist.split(',').map((ip) => ip.trim());
  const clientIP =
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.socket.remoteAddress ||
    '';

  // Normalize IPv6 loopback
  const normalizedIP = clientIP === '::1' ? '127.0.0.1' : clientIP;

  if (allowedIPs.includes(normalizedIP)) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: `Access denied. IP ${normalizedIP} is not whitelisted.`,
  });
};

module.exports = ipWhitelist;
