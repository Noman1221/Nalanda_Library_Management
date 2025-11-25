import { body, param, query, validationResult } from 'express-validator';

// Validation middleware to check for errors
export const validate = (req, res, next) => {
    console.log("Validation params:", req.params);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    next();
};

// User registration validation
export const registerValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2 })
        .withMessage('Name must be at least 2 characters'),
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    body('role')
        .optional()
        .isIn(['Admin', 'Member'])
        .withMessage('Role must be either Admin or Member')
];

// User login validation
export const loginValidation = [
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

// Book validation
export const bookValidation = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Title is required'),
    body('author')
        .trim()
        .notEmpty()
        .withMessage('Author is required'),
    body('isbn')
        .trim()
        .notEmpty()
        .withMessage('ISBN is required'),
    body('publicationDate')
        .notEmpty()
        .withMessage('Publication date is required')
        .isISO8601()
        .withMessage('Please provide a valid date'),
    body('genre')
        .trim()
        .notEmpty()
        .withMessage('Genre is required'),
    body('totalCopies')
        .notEmpty()
        .withMessage('Total copies is required')
        .isInt({ min: 0 })
        .withMessage('Total copies must be a positive number'),
    body('availableCopies')
        .notEmpty()
        .withMessage('Available copies is required')
        .isInt({ min: 0 })
        .withMessage('Available copies must be a positive number')
];

// Book update validation
export const bookUpdateValidation = [
    body('title')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Title cannot be empty'),
    body('author')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Author cannot be empty'),
    body('isbn')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('ISBN cannot be empty'),
    body('publicationDate')
        .optional()
        .isISO8601()
        .withMessage('Please provide a valid date'),
    body('genre')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Genre cannot be empty'),
    body('totalCopies')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Total copies must be a positive number'),
    body('availableCopies')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Available copies must be a positive number')
];

// Pagination and filtering validation
export const paginationValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    query('genre')
        .optional()
        .trim(),
    query('author')
        .optional()
        .trim()
];

// MongoDB ObjectId validation
export const objectIdValidation = [
    param('id')
        .notEmpty()
        .withMessage('ID is required')
        .isMongoId()
        .withMessage('Invalid ID format')
];