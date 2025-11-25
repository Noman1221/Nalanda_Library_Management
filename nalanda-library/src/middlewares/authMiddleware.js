import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.js';
import User from '../models/User.js';
import { decryptToken } from '../utils/encryption.js';

export const protect = async (req, res, next) => {
    try {
        let encryptedToken;

        // Check for token in headers
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            encryptedToken = req.headers.authorization.split(' ')[1];
        }

        if (!encryptedToken) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route. Please login.'
            });
        }

        // Decrypt the token
        let token;
        try {
            token = decryptToken(encryptedToken);
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or corrupted token'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, jwtConfig.secret);

        // Get user from token
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'User account is deactivated'
            });
        }

        // Attach user to request object
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route'
        });
    }
};