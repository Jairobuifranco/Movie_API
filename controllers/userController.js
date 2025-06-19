const knex = require('../db/knex');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

//Register user
exports.register = async (req, res) => {
    const { email, password } = req.body;
    // Check required fields
    if (!email || !password) {
        return res.status(400).json({
            error: true,
            message: "Request body incomplete: email and password are required."
        });
    }

    try {
        // Check if user already exists
        const existing = await knex('users').where({ email }).first();
        if (existing) {
            return res.status(409).json({
                error: true,
                message: "User already exists"
            });
        }
        // Hash password and store new user
        const passwordHash = await bcrypt.hash(password, 10);
        await knex('users').insert({ email, passwordHash });
        res.status(201).json({ message: "User created" });
    } catch (err) {
        console.error(" Registration error:", err);
        res.status(500).json({ error: true, message: "Database error" });
    }
};

// Login an existing user and issue tokens
exports.login = async (req, res) => {
    const { email, password, longExpiry, bearerExpiresInSeconds, refreshExpiresInSeconds } = req.body;
    // Validate input
    if (!email || !password) {
        return res.status(400).json({
            error: true,
            message: "Request body incomplete, both email and password are required"
        });
    }

    try {
        // Verify email exists and password matches
        const user = await knex("users").where({ email }).first();
        if (!user) {
            return res.status(401).json({
                error: true,
                message: "Incorrect email or password"
            });
        }
        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) {
            return res.status(401).json({
                error: true,
                message: "Incorrect email or password"
            });
        }
        // Determine token expiry based on input
        const bearerExpiry = longExpiry ? '365d' : (bearerExpiresInSeconds ? `${bearerExpiresInSeconds}s` : '600s');
        const refreshExpiry = longExpiry ? '365d' : (refreshExpiresInSeconds ? `${refreshExpiresInSeconds}s` : '86400s');
        // Generate JWT tokens
        const bearerToken = jwt.sign({ email }, process.env.JWT_SECRET, {
            expiresIn: bearerExpiry
        });

        const refreshToken = jwt.sign({ email }, process.env.JWT_SECRET, {
            expiresIn: refreshExpiry
        });

        res.status(200).json({
            bearerToken: {
                token: bearerToken,
                token_type: "Bearer",
                expires_in: parseInt(bearerExpiresInSeconds) || 600
            },
            refreshToken: {
                token: refreshToken,
                token_type: "Refresh",
                expires_in: parseInt(refreshExpiresInSeconds) || 86400
            }
        });

    } catch (err) {
        console.error(" Login error:", err);
        res.status(500).json({
            error: true,
            message: "Internal server error"
        });
    }
};


// Refresh access and refresh tokens using the provided refresh token
exports.refresh = async (req, res) => {
    const { refreshToken } = req.body;
    const { bearerExpiresInSeconds, refreshExpiresInSeconds } = req.query;
    // Ensure refresh token exists
    if (!refreshToken) {
        return res.status(400).json({
            error: true,
            message: "Request body incomplete, refresh token required"
        });
    }

    try {
        // Verify and decode refresh token
        const payload = jwt.verify(refreshToken, process.env.JWT_SECRET);
        const email = payload.email;
        // Generate new tokens
        const bearerExpiry = bearerExpiresInSeconds ? `${bearerExpiresInSeconds}s` : '600s';
        const refreshExpiry = refreshExpiresInSeconds ? `${refreshExpiresInSeconds}s` : '86400s';

        const newBearerToken = jwt.sign({ email }, process.env.JWT_SECRET, {
            expiresIn: bearerExpiry
        });
        const newRefreshToken = jwt.sign({ email }, process.env.JWT_SECRET, {
            expiresIn: refreshExpiry
        });

        return res.json({
            bearerToken: {
                token: newBearerToken,
                token_type: "Bearer",
                expires_in: bearerExpiresInSeconds ? parseInt(bearerExpiresInSeconds) : 600
            },
            refreshToken: {
                token: newRefreshToken,
                token_type: "Refresh",
                expires_in: refreshExpiresInSeconds ? parseInt(refreshExpiresInSeconds) : 86400
            }
        });
    } catch (err) {
        console.error(" Refresh error:", err);
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: true,
                message: "JWT token has expired"
            });
        }

        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: true,
                message: "Invalid JWT token"
            });
        }

        return res.status(401).json({
            error: true,
            message: "Authorization header ('Bearer token') not found"
        });
    }
};

//Logout user
exports.logout = (req, res) => {
    const { refreshToken } = req.body;
    // Validate presence of refresh token
    if (!refreshToken) {
        return res.status(400).json({
            error: true,
            message: "Request body incomplete, refresh token required"
        });
    }

    try {
        // Attempt to verify the refresh token using the secret
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        return res.status(200).json({
            error: false,
            message: "Token successfully invalidated"
        });
    } catch (err) {
        // Handle specific JWT-related errors
        // Token has expired
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: true,
                message: "JWT token has expired"
            });
        }
        // Token is malformed or tampered with
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: true,
                message: "Invalid JWT token"
            });
        }
        // Generic auth error
        return res.status(401).json({
            error: true,
            message: "Authorization header ('Bearer token') not found"
        });
    }
};

// Get Profile
exports.getProfile = async (req, res) => {
    const { email } = req.params; // Email of the profile being requested
    const authEmail = req.user?.email;// Email from authenticated JWT (if present)

    try {
        // Fetch the user's profile data from the database
        const user = await knex('users')
            .select('email', 'firstName', 'lastName', 'dob', 'address')
            .where({ email })
            .first();

        // If the user does not exist, return a 404 error
        if (!user) {
            return res.status(404).json({ error: true, message: "User not found" });
        }
        // Determine if the requesting user is the owner of the profil
        const isOwner = authEmail === email;
        const response = {
            email: user.email,
            firstName: user.firstName ?? null,
            lastName: user.lastName ?? null,
        };
        // If the requester is the profile owner, include sensitive fields
        if (isOwner) {
            response.dob = user.dob ? new Date(user.dob.getTime() + (user.dob.getTimezoneOffset() * 60000)).toISOString().split('T')[0] : null;
            response.address = user.address ?? null;
        }
        // 6. Return the profile
        return res.status(200).json(response);
    } catch (err) {
        // Handle any database or unexpected errors
        console.error(" Get profile error:", err);
        return res.status(500).json({ error: true, message: "Database error" });
    }
};


// Update profile
exports.updateProfile = async (req, res) => {
    const { email } = req.params;
    const authUser = req.user?.email;
    const { firstName, lastName, dob, address } = req.body;

    // Check for authorization header
    if (!authUser) {
        return res.status(401).json({
            error: true,
            message: "Authorization header ('Bearer token') not found"
        });
    }

    // Check if the logged-in user is the profile owner
    if (authUser !== email) {
        return res.status(403).json({
            error: true,
            message: "Forbidden"
        });
    }

    // Check all fields are present
    if (!firstName || !lastName || !dob || !address) {
        return res.status(400).json({
            error: true,
            message: "Request body incomplete: firstName, lastName, dob and address are required."
        });
    }

    // Check field types
    if (typeof firstName !== 'string' || typeof lastName !== 'string' || typeof address !== 'string') {
        return res.status(400).json({
            error: true,
            message: "Request body invalid: firstName, lastName and address must be strings only."
        });
    }

    // Check valid date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
        return res.status(400).json({
            error: true,
            message: "Invalid input: dob must be a real date in format YYYY-MM-DD."
        });
    }

    const date = new Date(dob);
    if (isNaN(date.getTime()) || dob !== date.toISOString().slice(0, 10)) {
        return res.status(400).json({
            error: true,
            message: "Invalid input: dob must be a real date in format YYYY-MM-DD."
        });
    }

    // Prevent future dates
    if (date > new Date()) {
        return res.status(400).json({
            error: true,
            message:"Invalid input: dob must be a date in the past."

        });
    }

    try {
        const existing = await knex('users').where({ email }).first();
        if (!existing) {
            return res.status(404).json({ error: true, message: "User not found" });
        }

        await knex('users')
            .where({ email })
            .update({ firstName, lastName, dob, address });

        return res.status(200).json({ email, firstName, lastName, dob, address });
    } catch (err) {
        console.error(" Update profile error:", err);
        return res.status(500).json({ error: true, message: "Database error" });
    }
};

