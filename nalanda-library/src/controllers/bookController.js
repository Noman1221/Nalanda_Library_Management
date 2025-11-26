import Book from '../models/Book.js';


export const addBook = async (req, res) => {
    try {
        const {
            title,
            author,
            isbn,
            publicationDate,
            genre,
            totalCopies,
            availableCopies
        } = req.body;

        // Check if book with ISBN already exists
        const bookExists = await Book.findOne({ isbn });
        if (bookExists) {
            return res.status(400).json({
                success: false,
                message: 'Book with this ISBN already exists'
            });
        }

        // Create book
        const book = await Book.create({
            title,
            author,
            isbn,
            publicationDate,
            genre,
            totalCopies,
            availableCopies
        });

        res.status(201).json({
            success: true,
            message: 'Book added successfully',
            data: book
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error while adding book',
            error: error.message
        });
    }
};

//Update book details (Admin only)
export const updateBook = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Find book
        let book = await Book.findById(id);
        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }

        // If ISBN is being updated, check if it already exists
        if (updateData.isbn && updateData.isbn !== book.isbn) {
            const isbnExists = await Book.findOne({ isbn: updateData.isbn });
            if (isbnExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Another book with this ISBN already exists'
                });
            }
        }

        // Update book
        book = await Book.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            message: 'Book updated successfully',
            data: book
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error while updating book',
            error: error.message
        });
    }
};

//  Delete a book (Admin only)
export const deleteBook = async (req, res) => {
    try {
        const { id } = req.params;

        const book = await Book.findById(id);
        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }

        // Soft delete by setting isActive to false
        await Book.findByIdAndUpdate(id, { isActive: false });

        res.status(200).json({
            success: true,
            message: 'Book deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error while deleting book',
            error: error.message
        });
    }
};

// Get all books with pagination and filtering
export const getBooks = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Build filter object
        const filter = { isActive: true };

        if (req.query.genre) {
            filter.genre = { $regex: req.query.genre, $options: 'i' };
        }

        if (req.query.author) {
            filter.author = { $regex: req.query.author, $options: 'i' };
        }

        if (req.query.title) {
            filter.title = { $regex: req.query.title, $options: 'i' };
        }

        // Get books with pagination
        const books = await Book.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Get total count for pagination
        const total = await Book.countDocuments(filter);

        res.status(200).json({
            success: true,
            count: books.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            data: books
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error while fetching books',
            error: error.message
        });
    }
};

//  Get single book by ID

export const getBookById = async (req, res) => {
    try {
        const { id } = req.params;

        const book = await Book.findById(id);
        if (!book || !book.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }

        res.status(200).json({
            success: true,
            data: book
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error while fetching book',
            error: error.message
        });
    }
};