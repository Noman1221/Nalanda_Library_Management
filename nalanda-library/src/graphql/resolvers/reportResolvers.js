import { GraphQLError } from 'graphql';
import Book from '../../models/Book.js';
import Borrowing from '../../models/Borrowing.js';
import { checkRole, getAuthenticatedUser } from '../middleware/graphqlAuth.js';

export const reportResolvers = {
    Query: {
        // Get most borrowed books
        mostBorrowedBooks: async (_, { limit = 10 }, context) => {
            try {
                const user = await getAuthenticatedUser(context.authHeader);
                checkRole(user, ['Admin']);

                const mostBorrowedBooks = await Borrowing.aggregate([
                    {
                        $group: {
                            _id: '$bookId',
                            borrowCount: { $sum: 1 },
                            currentlyBorrowed: {
                                $sum: {
                                    $cond: [{ $eq: ['$status', 'Borrowed'] }, 1, 0],
                                },
                            },
                        },
                    },
                    {
                        $sort: { borrowCount: -1 },
                    },
                    {
                        $limit: limit,
                    },
                    {
                        $lookup: {
                            from: 'books',
                            localField: '_id',
                            foreignField: '_id',
                            as: 'bookDetails',
                        },
                    },
                    {
                        $unwind: '$bookDetails',
                    },
                    {
                        $project: {
                            _id: 1,
                            borrowCount: 1,
                            currentlyBorrowed: 1,
                            title: '$bookDetails.title',
                            author: '$bookDetails.author',
                            isbn: '$bookDetails.isbn',
                            genre: '$bookDetails.genre',
                            totalCopies: '$bookDetails.totalCopies',
                            availableCopies: '$bookDetails.availableCopies',
                        },
                    },
                ]);

                return {
                    success: true,
                    count: mostBorrowedBooks.length,
                    data: mostBorrowedBooks.map((book) => ({
                        id: book._id.toString(),
                        borrowCount: book.borrowCount,
                        currentlyBorrowed: book.currentlyBorrowed,
                        title: book.title,
                        author: book.author,
                        isbn: book.isbn,
                        genre: book.genre,
                        totalCopies: book.totalCopies,
                        availableCopies: book.availableCopies,
                    })),
                };
            } catch (error) {
                if (error instanceof GraphQLError) {
                    throw error;
                }
                throw new GraphQLError('Error generating most borrowed books report', {
                    extensions: { code: 'INTERNAL_SERVER_ERROR' },
                });
            }
        },

        // Get active members
        activeMembers: async (_, { limit = 10 }, context) => {
            try {
                const user = await getAuthenticatedUser(context.authHeader);
                checkRole(user, ['Admin']);

                const activeMembers = await Borrowing.aggregate([
                    {
                        $group: {
                            _id: '$userId',
                            totalBorrowings: { $sum: 1 },
                            currentBorrowings: {
                                $sum: {
                                    $cond: [{ $eq: ['$status', 'Borrowed'] }, 1, 0],
                                },
                            },
                            returnedBooks: {
                                $sum: {
                                    $cond: [{ $eq: ['$status', 'Returned'] }, 1, 0],
                                },
                            },
                        },
                    },
                    {
                        $sort: { totalBorrowings: -1 },
                    },
                    {
                        $limit: limit,
                    },
                    {
                        $lookup: {
                            from: 'users',
                            localField: '_id',
                            foreignField: '_id',
                            as: 'userDetails',
                        },
                    },
                    {
                        $unwind: '$userDetails',
                    },
                    {
                        $project: {
                            _id: 1,
                            totalBorrowings: 1,
                            currentBorrowings: 1,
                            returnedBooks: 1,
                            name: '$userDetails.name',
                            email: '$userDetails.email',
                            role: '$userDetails.role',
                        },
                    },
                ]);

                return {
                    success: true,
                    count: activeMembers.length,
                    data: activeMembers.map((member) => ({
                        id: member._id.toString(),
                        totalBorrowings: member.totalBorrowings,
                        currentBorrowings: member.currentBorrowings,
                        returnedBooks: member.returnedBooks,
                        name: member.name,
                        email: member.email,
                        role: member.role,
                    })),
                };
            } catch (error) {
                if (error instanceof GraphQLError) {
                    throw error;
                }
                throw new GraphQLError('Error generating active members report', {
                    extensions: { code: 'INTERNAL_SERVER_ERROR' },
                });
            }
        },

        // Get book availability summary
        bookAvailability: async (_, __, context) => {
            try {
                const user = await getAuthenticatedUser(context.authHeader);
                checkRole(user, ['Admin']);

                // Get total books statistics
                const bookStats = await Book.aggregate([
                    {
                        $match: { isActive: true },
                    },
                    {
                        $group: {
                            _id: null,
                            totalBooks: { $sum: 1 },
                            totalCopies: { $sum: '$totalCopies' },
                            availableCopies: { $sum: '$availableCopies' },
                            borrowedCopies: {
                                $sum: { $subtract: ['$totalCopies', '$availableCopies'] },
                            },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            totalBooks: 1,
                            totalCopies: 1,
                            availableCopies: 1,
                            borrowedCopies: 1,
                            availabilityPercentage: {
                                $multiply: [
                                    { $divide: ['$availableCopies', '$totalCopies'] },
                                    100,
                                ],
                            },
                        },
                    },
                ]);

                // Get genre-wise statistics
                const genreStats = await Book.aggregate([
                    {
                        $match: { isActive: true },
                    },
                    {
                        $group: {
                            _id: '$genre',
                            totalBooks: { $sum: 1 },
                            totalCopies: { $sum: '$totalCopies' },
                            availableCopies: { $sum: '$availableCopies' },
                            borrowedCopies: {
                                $sum: { $subtract: ['$totalCopies', '$availableCopies'] },
                            },
                        },
                    },
                    {
                        $project: {
                            genre: '$_id',
                            _id: 0,
                            totalBooks: 1,
                            totalCopies: 1,
                            availableCopies: 1,
                            borrowedCopies: 1,
                        },
                    },
                    {
                        $sort: { totalBooks: -1 },
                    },
                ]);

                // Get currently borrowed books count
                const currentBorrowings = await Borrowing.countDocuments({
                    status: 'Borrowed',
                });

                const summary = bookStats[0] || {
                    totalBooks: 0,
                    totalCopies: 0,
                    availableCopies: 0,
                    borrowedCopies: 0,
                    availabilityPercentage: 0,
                };

                return {
                    success: true,
                    summary: {
                        totalBooks: summary.totalBooks,
                        totalCopies: summary.totalCopies,
                        availableCopies: summary.availableCopies,
                        borrowedCopies: summary.borrowedCopies,
                        availabilityPercentage: summary.availabilityPercentage,
                    },
                    currentBorrowings,
                    genreWiseAvailability: genreStats.map((genre) => ({
                        genre: genre.genre,
                        totalBooks: genre.totalBooks,
                        totalCopies: genre.totalCopies,
                        availableCopies: genre.availableCopies,
                        borrowedCopies: genre.borrowedCopies,
                    })),
                };
            } catch (error) {
                if (error instanceof GraphQLError) {
                    throw error;
                }
                throw new GraphQLError('Error generating book availability report', {
                    extensions: { code: 'INTERNAL_SERVER_ERROR' },
                });
            }
        },

        // Get overdue books
        overdueBooks: async (_, __, context) => {
            try {
                const user = await getAuthenticatedUser(context.authHeader);
                checkRole(user, ['Admin']);

                const currentDate = new Date();

                const overdueBooks = await Borrowing.find({
                    status: 'Borrowed',
                    dueDate: { $lt: currentDate },
                })
                    .populate('bookId', 'title author isbn genre')
                    .populate('userId', 'name email')
                    .sort({ dueDate: 1 });

                return {
                    success: true,
                    count: overdueBooks.length,
                    data: overdueBooks.map((b) => ({
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
                throw new GraphQLError('Error generating overdue books report', {
                    extensions: { code: 'INTERNAL_SERVER_ERROR' },
                });
            }
        },
    },
};