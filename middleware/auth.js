const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const header = req.headers['authorization'];

    if (!header) {
        return res.status(401).json({
            error: true,
            message: "Authorization header ('Bearer token') not found"
        });
    }

    const parts = header.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({
            error: true,
            message: "Authorization header ('Bearer token') not found"
        });
    }

    const token = parts[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach decoded token to request
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: true,
                message: "JWT token has expired"
            });
        }
        return res.status(401).json({
            error: true,
            message: "Invalid JWT token"
        });
    }
};
