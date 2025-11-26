import { GraphQLError } from 'graphql';
import mongoose from 'mongoose';
import Book from '../../models/Book.js';
import { checkRole, getAuthenticatedUser } from '../middleware/graphqlAuth.js';

export const bookResolvers = {
    Query: {
        // Get all books with pagination and filtering
        getBooks: async (_, { page = 1, limit = 10, genre, author, title }) => {
            try {
                const skip = (page - 1) * limit;

                // Build filter object
                const filter = { isActive: true };

                if (genre) {
                    filter.genre = { $regex: genre, $options: 'i' };
                }

                if (author) {
                    filter.author = { $regex: author, $options: 'i' };
                }

                if (title) {
                    filter.title = { $regex: title, $options: 'i' };
                }

                // Get books with pagination
                const books = await Book.find(filter)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit);

                // Get total count
                const total = await Book.countDocuments(filter);

                return {
                    success: true,
                    count: books.length,
                    total,
                    totalPages: Math.ceil(total / limit),
                    currentPage: page,
                    data: books.map((book) => ({
                        id: book._id.toString(),
                        title: book.title,
                        author: book.author,
                        isbn: book.isbn,
                        publicationDate: book.publicationDate.toISOString(),
                        genre: book.genre,
                        totalCopies: book.totalCopies,
                        availableCopies: book.availableCopies,
                        isActive: book.isActive,
                        createdAt: book.createdAt.toISOString(),
                        updatedAt: book.updatedAt.toISOString(),
                    })),
                };
            } catch (error) {
                throw new GraphQLError('Error fetching books', {
                    extensions: { code: 'INTERNAL_SERVER_ERROR' },
                });
            }
        },

        // Get single book by ID
        getBookById: async (_, { id }) => {
            try {
                // Validate ObjectId
                if (!mongoose.Types.ObjectId.isValid(id)) {
                    throw new GraphQLError('Invalid book ID format', {
                        extensions: { code: 'BAD_USER_INPUT' },
                    });
                }

                const book = await Book.findById(id);

                if (!book || !book.isActive) {
                    throw new GraphQLError('Book not found', {
                        extensions: { code: 'NOT_FOUND' },
                    });
                }

                return {
                    success: true,
                    data: {
                        id: book._id.toString(),
                        title: book.title,
                        author: book.author,
                        isbn: book.isbn,
                        publicationDate: book.publicationDate.toISOString(),
                        genre: book.genre,
                        totalCopies: book.totalCopies,
                        availableCopies: book.availableCopies,
                        isActive: book.isActive,
                        createdAt: book.createdAt.toISOString(),
                        updatedAt: book.updatedAt.toISOString(),
                    },
                };
            } catch (error) {
                if (error instanceof GraphQLError) {
                    throw error;
                }
                throw new GraphQLError('Error fetching book', {
                    extensions: { code: 'INTERNAL_SERVER_ERROR' },
                });
            }
        },
    },

    Mutation: {
        // Add a new book (Admin only)
        addBook: async (_, { input }, context) => {
            try {
                const user = await getAuthenticatedUser(context.authHeader);
                checkRole(user, ['Admin']);

                const {
                    title,
                    author,
                    isbn,
                    publicationDate,
                    genre,
                    totalCopies,
                    availableCopies,
                } = input;

                // Validate input
                if (!title || !author || !isbn || !publicationDate || !genre) {
                    throw new GraphQLError('All fields are required', {
                        extensions: { code: 'BAD_USER_INPUT' },
                    });
                }

                if (totalCopies < 0 || availableCopies < 0) {
                    throw new GraphQLError('Copies must be positive numbers', {
                        extensions: { code: 'BAD_USER_INPUT' },
                    });
                }

                if (availableCopies > totalCopies) {
                    throw new GraphQLError('Available copies cannot exceed total copies', {
                        extensions: { code: 'BAD_USER_INPUT' },
                    });
                }

                // Check if book with ISBN already exists
                const bookExists = await Book.findOne({ isbn });
                if (bookExists) {
                    throw new GraphQLError('Book with this ISBN already exists', {
                        extensions: { code: 'BAD_USER_INPUT' },
                    });
                }

                // Create book
                const book = await Book.create({
                    title,
                    author,
                    isbn,
                    publicationDate: new Date(publicationDate),
                    genre,
                    totalCopies,
                    availableCopies,
                });

                return {
                    success: true,
                    message: 'Book added successfully',
                    data: {
                        id: book._id.toString(),
                        title: book.title,
                        author: book.author,
                        isbn: book.isbn,
                        publicationDate: book.publicationDate.toISOString(),
                        genre: book.genre,
                        totalCopies: book.totalCopies,
                        availableCopies: book.availableCopies,
                        isActive: book.isActive,
                        createdAt: book.createdAt.toISOString(),
                        updatedAt: book.updatedAt.toISOString(),
                    },
                };
            } catch (error) {
                if (error instanceof GraphQLError) {
                    throw error;
                }
                throw new GraphQLError('Error adding book', {
                    extensions: { code: 'INTERNAL_SERVER_ERROR' },
                });
            }
        },

        // Update book (Admin only)
        updateBook: async (_, { id, input }, context) => {
            try {
                const user = await getAuthenticatedUser(context.authHeader);
                checkRole(user, ['Admin']);

                // Validate ObjectId
                if (!mongoose.Types.ObjectId.isValid(id)) {
                    throw new GraphQLError('Invalid book ID format', {
                        extensions: { code: 'BAD_USER_INPUT' },
                    });
                }

                // Find book
                let book = await Book.findById(id);
                if (!book) {
                    throw new GraphQLError('Book not found', {
                        extensions: { code: 'NOT_FOUND' },
                    });
                }

                // If ISBN is being updated, check if it already exists
                if (input.isbn && input.isbn !== book.isbn) {
                    const isbnExists = await Book.findOne({ isbn: input.isbn });
                    if (isbnExists) {
                        throw new GraphQLError('Another book with this ISBN already exists', {
                            extensions: { code: 'BAD_USER_INPUT' },
                        });
                    }
                }

                // Validate copies if provided
                if (input.totalCopies !== undefined && input.totalCopies < 0) {
                    throw new GraphQLError('Total copies must be a positive number', {
                        extensions: { code: 'BAD_USER_INPUT' },
                    });
                }

                if (input.availableCopies !== undefined && input.availableCopies < 0) {
                    throw new GraphQLError('Available copies must be a positive number', {
                        extensions: { code: 'BAD_USER_INPUT' },
                    });
                }

                // Convert publicationDate if provided
                if (input.publicationDate) {
                    input.publicationDate = new Date(input.publicationDate);
                }

                // Update book
                book = await Book.findByIdAndUpdate(id, input, {
                    new: true,
                    runValidators: true,
                });

                return {
                    success: true,
                    message: 'Book updated successfully',
                    data: {
                        id: book._id.toString(),
                        title: book.title,
                        author: book.author,
                        isbn: book.isbn,
                        publicationDate: book.publicationDate.toISOString(),
                        genre: book.genre,
                        totalCopies: book.totalCopies,
                        availableCopies: book.availableCopies,
                        isActive: book.isActive,
                        createdAt: book.createdAt.toISOString(),
                        updatedAt: book.updatedAt.toISOString(),
                    },
                };
            } catch (error) {
                if (error instanceof GraphQLError) {
                    throw error;
                }
                throw new GraphQLError('Error updating book', {
                    extensions: { code: 'INTERNAL_SERVER_ERROR' },
                });
            }
        },

        // Delete book (Admin only)
        deleteBook: async (_, { id }, context) => {
            try {
                const user = await getAuthenticatedUser(context.authHeader);
                checkRole(user, ['Admin']);

                // Validate ObjectId
                if (!mongoose.Types.ObjectId.isValid(id)) {
                    throw new GraphQLError('Invalid book ID format', {
                        extensions: { code: 'BAD_USER_INPUT' },
                    });
                }

                const book = await Book.findById(id);
                if (!book) {
                    throw new GraphQLError('Book not found', {
                        extensions: { code: 'NOT_FOUND' },
                    });
                }

                // Soft delete
                await Book.findByIdAndUpdate(id, { isActive: false });

                return {
                    success: true,
                    message: 'Book deleted successfully',
                };
            } catch (error) {
                if (error instanceof GraphQLError) {
                    throw error;
                }
                throw new GraphQLError('Error deleting book', {
                    extensions: { code: 'INTERNAL_SERVER_ERROR' },
                });
            }
        },
    },
};