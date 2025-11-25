import Book from '../models/Book.js';
import Borrowing from '../models/Borrowing.js';

// @desc    Get most borrowed books
// @route   GET /api/reports/most-borrowed-books
// @access  Private/Admin
export const getMostBorrowedBooks = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        const mostBorrowedBooks = await Borrowing.aggregate([
            {
                $group: {
                    _id: '$bookId',
                    borrowCount: { $sum: 1 },
                    currentlyBorrowed: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'Borrowed'] }, 1, 0]
                        }
                    }
                }
            },
            {
                $sort: { borrowCount: -1 }
            },
            {
                $limit: limit
            },
            {
                $lookup: {
                    from: 'books',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'bookDetails'
                }
            },
            {
                $unwind: '$bookDetails'
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
                    availableCopies: '$bookDetails.availableCopies'
                }
            }
        ]);

        res.status(200).json({
            success: true,
            count: mostBorrowedBooks.length,
            data: mostBorrowedBooks
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error while generating report',
            error: error.message
        });
    }
};

// @desc    Get most active members
// @route   GET /api/reports/active-members
// @access  Private/Admin
export const getActiveMembers = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        const activeMembers = await Borrowing.aggregate([
            {
                $group: {
                    _id: '$userId',
                    totalBorrowings: { $sum: 1 },
                    currentBorrowings: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'Borrowed'] }, 1, 0]
                        }
                    },
                    returnedBooks: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'Returned'] }, 1, 0]
                        }
                    }
                }
            },
            {
                $sort: { totalBorrowings: -1 }
            },
            {
                $limit: limit
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            {
                $unwind: '$userDetails'
            },
            {
                $project: {
                    _id: 1,
                    totalBorrowings: 1,
                    currentBorrowings: 1,
                    returnedBooks: 1,
                    name: '$userDetails.name',
                    email: '$userDetails.email',
                    role: '$userDetails.role'
                }
            }
        ]);

        res.status(200).json({
            success: true,
            count: activeMembers.length,
            data: activeMembers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error while generating report',
            error: error.message
        });
    }
};

// @desc    Get book availability summary
// @route   GET /api/reports/book-availability
// @access  Private/Admin
export const getBookAvailability = async (req, res) => {
    try {
        // Get total books statistics
        const bookStats = await Book.aggregate([
            {
                $match: { isActive: true }
            },
            {
                $group: {
                    _id: null,
                    totalBooks: { $sum: 1 },
                    totalCopies: { $sum: '$totalCopies' },
                    availableCopies: { $sum: '$availableCopies' },
                    borrowedCopies: {
                        $sum: { $subtract: ['$totalCopies', '$availableCopies'] }
                    }
                }
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
                            100
                        ]
                    }
                }
            }
        ]);

        // Get genre-wise statistics
        const genreStats = await Book.aggregate([
            {
                $match: { isActive: true }
            },
            {
                $group: {
                    _id: '$genre',
                    totalBooks: { $sum: 1 },
                    totalCopies: { $sum: '$totalCopies' },
                    availableCopies: { $sum: '$availableCopies' },
                    borrowedCopies: {
                        $sum: { $subtract: ['$totalCopies', '$availableCopies'] }
                    }
                }
            },
            {
                $project: {
                    genre: '$_id',
                    _id: 0,
                    totalBooks: 1,
                    totalCopies: 1,
                    availableCopies: 1,
                    borrowedCopies: 1
                }
            },
            {
                $sort: { totalBooks: -1 }
            }
        ]);

        // Get currently borrowed books count
        const currentBorrowings = await Borrowing.countDocuments({
            status: 'Borrowed'
        });

        res.status(200).json({
            success: true,
            data: {
                summary: bookStats[0] || {
                    totalBooks: 0,
                    totalCopies: 0,
                    availableCopies: 0,
                    borrowedCopies: 0,
                    availabilityPercentage: 0
                },
                currentBorrowings,
                genreWiseAvailability: genreStats
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error while generating report',
            error: error.message
        });
    }
};


export const getOverdueBooks = async (req, res) => {
    try {
        const currentDate = new Date();

        const overdueBooks = await Borrowing.find({
            status: 'Borrowed',
            dueDate: { $lt: currentDate }
        })
            .populate('bookId', 'title author isbn')
            .populate('userId', 'name email')
            .sort({ dueDate: 1 });

        res.status(200).json({
            success: true,
            count: overdueBooks.length,
            data: overdueBooks
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error while generating report',
            error: error.message
        });
    }
};