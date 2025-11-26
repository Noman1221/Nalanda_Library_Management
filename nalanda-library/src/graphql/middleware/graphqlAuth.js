import { GraphQLError } from 'graphql';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../../config/jwt.js';
import User from '../../models/User.js';
import { decryptToken } from '../../utils/encryption.js';

// Extract and verify user from context
export const getAuthenticatedUser = async (authHeader) => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new GraphQLError('Not authorized. Please login.', {
            extensions: {
                code: 'UNAUTHENTICATED',
            },
        });
    }

    const encryptedToken = authHeader.split(' ')[1];

    if (!encryptedToken) {
        throw new GraphQLError('Invalid token format', {
            extensions: {
                code: 'UNAUTHENTICATED',
            },
        });
    }

    try {
        // Decrypt the token
        const token = decryptToken(encryptedToken);

        // Verify token
        const decoded = jwt.verify(token, jwtConfig.secret);

        // Get user from database
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            throw new GraphQLError('User not found', {
                extensions: {
                    code: 'UNAUTHENTICATED',
                },
            });
        }

        if (!user.isActive) {
            throw new GraphQLError('User account is deactivated', {
                extensions: {
                    code: 'FORBIDDEN',
                },
            });
        }

        return user;
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            throw new GraphQLError('Invalid token', {
                extensions: {
                    code: 'UNAUTHENTICATED',
                },
            });
        }
        if (error.name === 'TokenExpiredError') {
            throw new GraphQLError('Token expired', {
                extensions: {
                    code: 'UNAUTHENTICATED',
                },
            });
        }
        throw error;
    }
};

// Check if user has required role
export const checkRole = (user, allowedRoles) => {
    if (!allowedRoles.includes(user.role)) {
        throw new GraphQLError(
            `Access denied. Required role: ${allowedRoles.join(' or ')}`,
            {
                extensions: {
                    code: 'FORBIDDEN',
                },
            }
        );
    }
};