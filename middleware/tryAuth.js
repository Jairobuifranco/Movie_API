const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const header = req.headers['authorization'];
    if (!header) return next();

    const parts = header.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return next();

    const token = parts[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
    } catch {
        // Ignore invalid token: treat as unauthenticated
    }

    next();
};
