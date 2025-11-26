import { GraphQLError } from 'graphql';
import mongoose from 'mongoose';
import Book from '../../models/Book.js';
import Borrowing from '../../models/Borrowing.js';
import { checkRole, getAuthenticatedUser } from '../middleware/graphqlAuth.js';

export const borrowingResolvers = {
    Query: {
        // Get borrowing history for logged in user
        getBorrowHistory: async (
            _,
            { page = 1, limit = 10, status },
            context
        ) => {
            try {
                // console.log('Fetching borrow history for user');

                const user = await getAuthenticatedUser(context.authHeader);
                checkRole(user, ['Member', 'Admin']);

                const skip = (page - 1) * limit;

                // Build filter
                const filter = { userId: user._id };
                // console.log('User ID:', user._id);

                if (status) {
                    filter.status = status;
                    console.log('Filter status:', status);
                }

                // Get borrowing history with safe population
                const borrowings = await Borrowing.find(filter)
                    .populate({
                        path: 'bookId',
                        select: 'title author isbn genre publicationDate totalCopies availableCopies isActive createdAt updatedAt'
                    })
                    .populate({
                        path: 'userId',
                        select: 'name email role isActive createdAt updatedAt'
                    })
                    .sort({ borrowDate: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(); // Use lean() for better performance

                // console.log(`Found ${borrowings.length} borrowing records`);

                const total = await Borrowing.countDocuments(filter);

                // Safely map the data with null checks
                const mappedData = borrowings.map((b) => {
                    // Check if populated data exists
                    const userData = b.userId ? {
                        id: b.userId._id?.toString() || '',
                        name: b.userId.name || 'Unknown',
                        email: b.userId.email || '',
                        role: b.userId.role || 'Member',
                        isActive: b.userId.isActive !== undefined ? b.userId.isActive : true,
                        createdAt: b.userId.createdAt?.toISOString() || new Date().toISOString(),
                        updatedAt: b.userId.updatedAt?.toISOString() || new Date().toISOString(),
                    } : null;

                    const bookData = b.bookId ? {
                        id: b.bookId._id?.toString() || '',
                        title: b.bookId.title || 'Unknown Title',
                        author: b.bookId.author || 'Unknown Author',
                        isbn: b.bookId.isbn || '',
                        publicationDate: b.bookId.publicationDate?.toISOString() || new Date().toISOString(),
                        genre: b.bookId.genre || '',
                        totalCopies: b.bookId.totalCopies || 0,
                        availableCopies: b.bookId.availableCopies || 0,
                        isActive: b.bookId.isActive !== undefined ? b.bookId.isActive : true,
                        createdAt: b.bookId.createdAt?.toISOString() || new Date().toISOString(),
                        updatedAt: b.bookId.updatedAt?.toISOString() || new Date().toISOString(),
                    } : null;

                    return {
                        id: b._id.toString(),
                        userId: userData,
                        bookId: bookData,
                        borrowDate: b.borrowDate?.toISOString() || new Date().toISOString(),
                        dueDate: b.dueDate?.toISOString() || new Date().toISOString(),
                        returnDate: b.returnDate ? b.returnDate.toISOString() : null,
                        status: b.status || 'Unknown',
                        createdAt: b.createdAt?.toISOString() || new Date().toISOString(),
                        updatedAt: b.updatedAt?.toISOString() || new Date().toISOString(),
                    };
                });

                return {
                    success: true,
                    count: borrowings.length,
                    total,
                    totalPages: Math.ceil(total / limit),
                    currentPage: page,
                    data: mappedData,
                };
            } catch (error) {
                // console.error('Error in getBorrowHistory resolver:', error);

                if (error instanceof GraphQLError) {
                    throw error;
                }

                // Handle specific MongoDB errors
                if (error.name === 'MongoError' || error.name === 'MongoServerError') {
                    console.error('MongoDB error:', error.message);
                    throw new GraphQLError('Database error occurred while fetching borrowing history', {
                        extensions: { code: 'INTERNAL_SERVER_ERROR' },
                    });
                }

                // Handle population errors
                if (error.message && error.message.includes('population')) {
                    throw new GraphQLError('Error loading related data', {
                        extensions: { code: 'INTERNAL_SERVER_ERROR' },
                    });
                }

                throw new GraphQLError('Error fetching borrowing history: ' + error.message, {
                    extensions: { code: 'INTERNAL_SERVER_ERROR' },
                });
            }
        },
        // Get all borrowings (Admin only)
        getAllBorrowings: async (
            _,
            { page = 1, limit = 10, status, userId },
            context
        ) => {
            try {
                const user = await getAuthenticatedUser(context.authHeader);
                checkRole(user, ['Admin']);

                const skip = (page - 1) * limit;

                // Build filter
                const filter = {};

                if (status) {
                    filter.status = status;
                }

                if (userId) {
                    if (!mongoose.Types.ObjectId.isValid(userId)) {
                        throw new GraphQLError('Invalid user ID format', {
                            extensions: { code: 'BAD_USER_INPUT' },
                        });
                    }
                    filter.userId = userId;
                }

                // Get all borrowings
                const borrowings = await Borrowing.find(filter)
                    .populate('bookId', 'title author isbn genre')
                    .populate('userId', 'name email role')
                    .sort({ borrowDate: -1 })
                    .skip(skip)
                    .limit(limit);

                const total = await Borrowing.countDocuments(filter);

                return {
                    success: true,
                    count: borrowings.length,
                    total,
                    totalPages: Math.ceil(total / limit),
                    currentPage: page,
                    data: borrowings.map((b) => ({
                        id: b._id.toString(),
                        userId: {
                            id: b.userId._id.toString(),
                            name: b.userId.name,
                            email: b.userId.email,
                            role: b.userId.role,
                            isActive: b.userId.isActive,
                            createdAt: b.userId.createdAt.toISOString(),
                            updatedAt: b.userId.updatedAt.toISOString(),
                        },
                        bookId: {
                            id: b.bookId._id.toString(),
                            title: b.bookId.title,
                            author: b.bookId.author,
                            isbn: b.bookId.isbn,
                            publicationDate: b.bookId.publicationDate.toISOString(),
                            genre: b.bookId.genre,
                            totalCopies: b.bookId.totalCopies,
                            availableCopies: b.bookId.availableCopies,
                            isActive: b.bookId.isActive,
                            createdAt: b.bookId.createdAt.toISOString(),
                            updatedAt: b.bookId.updatedAt.toISOString(),
                        },
                        borrowDate: b.borrowDate.toISOString(),
                        dueDate: b.dueDate.toISOString(),
                        returnDate: b.returnDate ? b.returnDate.toISOString() : null,
                        status: b.status,
                        createdAt: b.createdAt.toISOString(),
                        updatedAt: b.updatedAt.toISOString(),
                    })),
                };
            } catch (error) {
                if (error instanceof GraphQLError) {
                    throw error;
                }
                throw new GraphQLError('Error fetching borrowings', {
                    extensions: { code: 'INTERNAL_SERVER_ERROR' },
                });
            }
        },
    },

    Mutation: {
        borrowBook: async (_, { bookId }, context) => {
            try {
                // console.log('Borrow book request received for bookId:', bookId);

                const user = await getAuthenticatedUser(context.authHeader);
                checkRole(user, ['Member', 'Admin']);

                // Validate ObjectId
                if (!mongoose.Types.ObjectId.isValid(bookId)) {
                    throw new GraphQLError('Invalid book ID format', {
                        extensions: { code: 'BAD_USER_INPUT' },
                    });
                }

                const userId = user._id;
                // console.log('Authenticated user:', userId);

                // Find the book
                const book = await Book.findById(bookId);
                if (!book) {
                    throw new GraphQLError('Book not found', {
                        extensions: { code: 'NOT_FOUND' },
                    });
                }

                if (!book.isActive) {
                    throw new GraphQLError('Book is not available for borrowing', {
                        extensions: { code: 'BAD_USER_INPUT' },
                    });
                }

                // Check if book is available
                if (book.availableCopies <= 0) {
                    throw new GraphQLError('Book is currently not available', {
                        extensions: { code: 'BAD_USER_INPUT' },
                    });
                }

                // Check if user already borrowed this book
                const existingBorrowing = await Borrowing.findOne({
                    userId,
                    bookId,
                    status: 'Borrowed',
                });

                if (existingBorrowing) {
                    throw new GraphQLError(
                        'You have already borrowed this book. Please return it first.',
                        {
                            extensions: { code: 'BAD_USER_INPUT' },
                        }
                    );
                }

                // Calculate due date (14 days from now)
                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + 14);

                // Create borrowing record
                const borrowing = await Borrowing.create({
                    userId,
                    bookId,
                    borrowDate: new Date(),
                    dueDate,
                    status: 'Borrowed',
                });

                // Decrease available copies
                book.availableCopies -= 1;
                await book.save();

                // Populate details
                await borrowing.populate('userId', 'name email role isActive createdAt updatedAt');
                await borrowing.populate('bookId', 'title author isbn genre publicationDate totalCopies availableCopies isActive createdAt updatedAt');

                // console.log('Book borrowed successfully:', borrowing._id);

                return {
                    success: true,
                    message: 'Book borrowed successfully',
                    data: {
                        id: borrowing._id.toString(),
                        userId: {
                            id: borrowing.userId._id.toString(),
                            name: borrowing.userId.name,
                            email: borrowing.userId.email,
                            role: borrowing.userId.role,
                            isActive: borrowing.userId.isActive,
                            createdAt: borrowing.userId.createdAt.toISOString(),
                            updatedAt: borrowing.userId.updatedAt.toISOString(),
                        },
                        bookId: {
                            id: borrowing.bookId._id.toString(),
                            title: borrowing.bookId.title,
                            author: borrowing.bookId.author,
                            isbn: borrowing.bookId.isbn,
                            publicationDate: borrowing.bookId.publicationDate.toISOString(),
                            genre: borrowing.bookId.genre,
                            totalCopies: borrowing.bookId.totalCopies,
                            availableCopies: borrowing.bookId.availableCopies,
                            isActive: borrowing.bookId.isActive,
                            createdAt: borrowing.bookId.createdAt.toISOString(),
                            updatedAt: borrowing.bookId.updatedAt.toISOString(),
                        },
                        borrowDate: borrowing.borrowDate.toISOString(),
                        dueDate: borrowing.dueDate.toISOString(),
                        returnDate: borrowing.returnDate
                            ? borrowing.returnDate.toISOString()
                            : null,
                        status: borrowing.status,
                        createdAt: borrowing.createdAt.toISOString(),
                        updatedAt: borrowing.updatedAt.toISOString(),
                    },
                };
            } catch (error) {
                console.error('Error borrowing book:', error);

                if (error instanceof GraphQLError) {
                    throw error;
                }

                // Handle specific MongoDB errors
                if (error.name === 'MongoError' || error.name === 'MongoServerError') {
                    throw new GraphQLError('Database error occurred while borrowing book', {
                        extensions: { code: 'INTERNAL_SERVER_ERROR' },
                    });
                }

                throw new GraphQLError('Error borrowing book: ' + error.message, {
                    extensions: { code: 'INTERNAL_SERVER_ERROR' },
                });
            }
        },

        // Return a book
        returnBook: async (_, { borrowingId }, context) => {
            try {
                // console.log('Return book request received for borrowingId:', borrowingId);

                const user = await getAuthenticatedUser(context.authHeader);
                checkRole(user, ['Member', 'Admin']);

                // Validate ObjectId
                if (!mongoose.Types.ObjectId.isValid(borrowingId)) {
                    throw new GraphQLError('Invalid borrowing ID format', {
                        extensions: { code: 'BAD_USER_INPUT' },
                    });
                }

                const userId = user._id;
                console.log('Authenticated user:', userId);

                // Find the borrowing record and populate necessary fields
                const borrowing = await Borrowing.findById(borrowingId)
                    .populate('userId')
                    .populate('bookId');

                if (!borrowing) {
                    throw new GraphQLError('Borrowing record not found', {
                        extensions: { code: 'NOT_FOUND' },
                    });
                }

                // console.log('Found borrowing record:', borrowing._id, 'Status:', borrowing.status);

                // Check if the borrowing belongs to the user (unless admin)
                if (
                    user.role !== 'Admin' &&
                    borrowing.userId._id.toString() !== userId.toString()
                ) {
                    throw new GraphQLError('Not authorized to return this book', {
                        extensions: { code: 'FORBIDDEN' },
                    });
                }

                // Check if book is already returned
                if (borrowing.status === 'Returned') {
                    throw new GraphQLError('Book has already been returned', {
                        extensions: { code: 'BAD_USER_INPUT' },
                    });
                }

                // Update borrowing record
                borrowing.returnDate = new Date();
                borrowing.status = 'Returned';
                await borrowing.save();

                // console.log('Updated borrowing record status to:', borrowing.status);

                // Increase available copies
                const book = await Book.findById(borrowing.bookId._id || borrowing.bookId);
                if (book) {
                    book.availableCopies += 1;
                    await book.save();
                    console.log('Updated book available copies:', book.availableCopies);
                } else {
                    console.log('Book not found for ID:', borrowing.bookId);
                }

                // Ensure population is complete
                await borrowing.populate('userId', 'name email role isActive createdAt updatedAt');
                await borrowing.populate('bookId', 'title author isbn genre publicationDate totalCopies availableCopies isActive createdAt updatedAt');

                console.log('Book returned successfully');

                return {
                    success: true,
                    message: 'Book returned successfully',
                    data: {
                        id: borrowing._id.toString(),
                        userId: {
                            id: borrowing.userId._id.toString(),
                            name: borrowing.userId.name,
                            email: borrowing.userId.email,
                            role: borrowing.userId.role,
                            isActive: borrowing.userId.isActive,
                            createdAt: borrowing.userId.createdAt?.toISOString() || new Date().toISOString(),
                            updatedAt: borrowing.userId.updatedAt?.toISOString() || new Date().toISOString(),
                        },
                        bookId: {
                            id: borrowing.bookId._id.toString(),
                            title: borrowing.bookId.title,
                            author: borrowing.bookId.author,
                            isbn: borrowing.bookId.isbn,
                            publicationDate: borrowing.bookId.publicationDate?.toISOString() || new Date().toISOString(),
                            genre: borrowing.bookId.genre,
                            totalCopies: borrowing.bookId.totalCopies,
                            availableCopies: borrowing.bookId.availableCopies,
                            isActive: borrowing.bookId.isActive,
                            createdAt: borrowing.bookId.createdAt?.toISOString() || new Date().toISOString(),
                            updatedAt: borrowing.bookId.updatedAt?.toISOString() || new Date().toISOString(),
                        },
                        borrowDate: borrowing.borrowDate.toISOString(),
                        dueDate: borrowing.dueDate.toISOString(),
                        returnDate: borrowing.returnDate ? borrowing.returnDate.toISOString() : null,
                        status: borrowing.status,
                        createdAt: borrowing.createdAt.toISOString(),
                        updatedAt: borrowing.updatedAt.toISOString(),
                    },
                };
            } catch (error) {
                console.error('Error in returnBook resolver:', error);

                if (error instanceof GraphQLError) {
                    throw error;
                }

                // Handle specific MongoDB errors
                if (error.name === 'MongoError' || error.name === 'MongoServerError') {
                    console.error('MongoDB error:', error.message);
                    throw new GraphQLError('Database error occurred while returning book', {
                        extensions: { code: 'INTERNAL_SERVER_ERROR' },
                    });
                }

                // Handle validation errors
                if (error.name === 'ValidationError') {
                    throw new GraphQLError('Validation error: ' + error.message, {
                        extensions: { code: 'BAD_USER_INPUT' },
                    });
                }

                throw new GraphQLError('Error returning book: ' + error.message, {
                    extensions: { code: 'INTERNAL_SERVER_ERROR' },
                });
            }
        },
    }
}