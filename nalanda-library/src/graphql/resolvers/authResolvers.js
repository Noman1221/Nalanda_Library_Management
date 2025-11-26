import bcrypt from 'bcryptjs';
import { GraphQLError } from 'graphql';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../../config/jwt.js';
import User from '../../models/User.js';
import { encryptToken } from '../../utils/encryption.js';
import { getAuthenticatedUser } from '../middleware/graphqlAuth.js';

export const authResolvers = {
    Query: {
        // Get current logged in user
        me: async (_, __, context) => {
            const user = await getAuthenticatedUser(context.authHeader);

            return {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                createdAt: user.createdAt.toISOString(),
                updatedAt: user.updatedAt.toISOString(),
            };
        },
    },

    Mutation: {
        // Register user
        register: async (_, { input }) => {
            try {
                const { name, email, password, role } = input;

                // Validate input
                if (!name || name.trim().length < 2) {
                    throw new GraphQLError('Name must be at least 2 characters', {
                        extensions: { code: 'BAD_USER_INPUT' },
                    });
                }

                if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
                    throw new GraphQLError('Please provide a valid email', {
                        extensions: { code: 'BAD_USER_INPUT' },
                    });
                }

                if (!password || password.length < 6) {
                    throw new GraphQLError('Password must be at least 6 characters', {
                        extensions: { code: 'BAD_USER_INPUT' },
                    });
                }

                if (role && !['Admin', 'Member'].includes(role)) {
                    throw new GraphQLError('Role must be either Admin or Member', {
                        extensions: { code: 'BAD_USER_INPUT' },
                    });
                }

                // Check if user already exists
                const userExists = await User.findOne({ email });
                if (userExists) {
                    throw new GraphQLError('User already exists with this email', {
                        extensions: { code: 'BAD_USER_INPUT' },
                    });
                }

                // Hash password
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);

                // Create user
                const user = await User.create({
                    name,
                    email,
                    password: hashedPassword,
                    role: role || 'Member',
                });

                // Generate token
                const token = jwt.sign(
                    { id: user._id, role: user.role },
                    jwtConfig.secret,
                    { expiresIn: jwtConfig.expiresIn }
                );

                // Encrypt token
                const encryptedToken = encryptToken(token);

                return {
                    success: true,
                    message: 'User registered successfully',
                    user: {
                        id: user._id.toString(),
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        isActive: user.isActive,
                        createdAt: user.createdAt.toISOString(),
                        updatedAt: user.updatedAt.toISOString(),
                    },
                    token: encryptedToken,
                };
            } catch (error) {
                if (error instanceof GraphQLError) {
                    throw error;
                }
                throw new GraphQLError('Server error during registration', {
                    extensions: { code: 'INTERNAL_SERVER_ERROR' },
                });
            }
        },

        // Login user
        login: async (_, { input }) => {
            try {
                const { email, password } = input;

                // Validate input
                if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
                    throw new GraphQLError('Please provide a valid email', {
                        extensions: { code: 'BAD_USER_INPUT' },
                    });
                }

                if (!password) {
                    throw new GraphQLError('Password is required', {
                        extensions: { code: 'BAD_USER_INPUT' },
                    });
                }

                // Check if user exists
                const user = await User.findOne({ email });
                if (!user) {
                    throw new GraphQLError('Invalid credentials', {
                        extensions: { code: 'UNAUTHENTICATED' },
                    });
                }

                // Check if user is active
                if (!user.isActive) {
                    throw new GraphQLError('Account is deactivated. Please contact admin.', {
                        extensions: { code: 'FORBIDDEN' },
                    });
                }

                // Verify password
                const isPasswordMatch = await bcrypt.compare(password, user.password);
                if (!isPasswordMatch) {
                    throw new GraphQLError('Invalid credentials', {
                        extensions: { code: 'UNAUTHENTICATED' },
                    });
                }

                // Generate token
                const token = jwt.sign(
                    { id: user._id, role: user.role },
                    jwtConfig.secret,
                    { expiresIn: jwtConfig.expiresIn }
                );

                // Encrypt token
                const encryptedToken = encryptToken(token);

                return {
                    success: true,
                    message: 'Login successful',
                    user: {
                        id: user._id.toString(),
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        isActive: user.isActive,
                        createdAt: user.createdAt.toISOString(),
                        updatedAt: user.updatedAt.toISOString(),
                    },
                    token: encryptedToken,
                };
            } catch (error) {
                if (error instanceof GraphQLError) {
                    throw error;
                }
                throw new GraphQLError('Server error during login', {
                    extensions: { code: 'INTERNAL_SERVER_ERROR' },
                });
            }
        },
    },
};