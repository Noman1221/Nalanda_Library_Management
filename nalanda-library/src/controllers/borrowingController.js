import Book from '../models/Book.js';
import Borrowing from '../models/Borrowing.js';

// @desc    Borrow a book (Member only)
// @route   POST /api/borrowings/borrow/:bookId
// @access  Private/Member
export const borrowBook = async (req, res) => {
    try {
        // console.log("what i get", req.params);

        const { id } = req.params;
        const userId = req.user.id;

        // Find the book
        const book = await Book.findById(id);
        if (!book || !book.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }

        // Check if book is available
        if (book.availableCopies <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Book is currently not available'
            });
        }

        // Check if user already borrowed this book and hasn't returned it
        const existingBorrowing = await Borrowing.findOne({
            userId,
            bookId: id,
            status: 'Borrowed'
        });

        if (existingBorrowing) {
            return res.status(400).json({
                success: false,
                message: 'You have already borrowed this book. Please return it first.'
            });
        }

        // Calculate due date (14 days from now)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);

        // Create borrowing record
        const borrowing = await Borrowing.create({
            userId,
            bookId: id,
            borrowDate: new Date(),
            dueDate,
            status: 'Borrowed'
        });

        // Decrease available copies
        book.availableCopies -= 1;
        await book.save();

        // Populate book and user details
        await borrowing.populate('bookId', 'title author isbn');
        await borrowing.populate('userId', 'name email');

        res.status(201).json({
            success: true,
            message: 'Book borrowed successfully',
            data: borrowing
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error while borrowing book',
            error: error.message
        });
    }
};

// @desc    Return a borrowed book
// @route   PUT /api/borrowings/return/:borrowingId
// @access  Private/Member
export const returnBook = async (req, res) => {
    try {
        const { id } = req.params;
        console.log("dekh", id);

        const userId = req.user.id;

        // Find the borrowing record
        const borrowing = await Borrowing.findById(id);

        if (!borrowing) {
            return res.status(404).json({
                success: false,
                message: 'Borrowing record not found'
            });
        }

        // Check if the borrowing belongs to the user
        if (borrowing.userId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to return this book'
            });
        }

        // Check if book is already returned
        if (borrowing.status === 'Returned') {
            return res.status(400).json({
                success: false,
                message: 'Book has already been returned'
            });
        }

        // Update borrowing record
        borrowing.returnDate = new Date();
        borrowing.status = 'Returned';
        await borrowing.save();

        // Increase available copies
        const book = await Book.findById(borrowing.bookId);
        if (book) {
            book.availableCopies += 1;
            await book.save();
        }

        // Populate details
        await borrowing.populate('bookId', 'title author isbn');
        await borrowing.populate('userId', 'name email');

        res.status(200).json({
            success: true,
            message: 'Book returned successfully',
            data: borrowing
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error while returning book',
            error: error.message
        });
    }
};

// @desc    Get borrowing history for logged in user
// @route   GET /api/borrowings/my-history
// @access  Private/Member
export const getMyBorrowingHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Build filter
        const filter = { userId };

        if (req.query.status) {
            filter.status = req.query.status;
        }

        // Get borrowing history
        const borrowings = await Borrowing.find(filter)
            .populate('bookId', 'title author isbn genre')
            .sort({ borrowDate: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Borrowing.countDocuments(filter);

        res.status(200).json({
            success: true,
            count: borrowings.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            data: borrowings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error while fetching borrowing history',
            error: error.message
        });
    }
};

// @desc    Get all borrowing records (Admin only)
// @route   GET /api/borrowings
// @access  Private/Admin
export const getAllBorrowings = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Build filter
        const filter = {};

        if (req.query.status) {
            filter.status = req.query.status;
        }

        if (req.query.userId) {
            filter.userId = req.query.userId;
        }

        // Get all borrowings
        const borrowings = await Borrowing.find(filter)
            .populate('bookId', 'title author isbn genre')
            .populate('userId', 'name email role')
            .sort({ borrowDate: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Borrowing.countDocuments(filter);

        res.status(200).json({
            success: true,
            count: borrowings.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            data: borrowings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error while fetching borrowing records',
            error: error.message
        });
    }
};