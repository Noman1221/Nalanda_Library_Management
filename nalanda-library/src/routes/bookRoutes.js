import express from 'express';
import {
    addBook,
    deleteBook,
    getBookById,
    getBooks,
    updateBook
} from '../controllers/bookController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import {
    bookUpdateValidation,
    bookValidation,
    objectIdValidation,
    paginationValidation,
    validate
} from '../utils/validators.js';

const router = express.Router();

// Public routes
router.get('/', paginationValidation, validate, getBooks);
router.get('/:id', objectIdValidation, validate, getBookById);

// Protected routes - Admin only
router.post(
    '/',
    protect,
    authorize('Admin'),
    bookValidation,
    validate,
    addBook
);

router.put(
    '/:id',
    protect,
    authorize('Admin'),
    objectIdValidation,
    bookUpdateValidation,
    validate,
    updateBook
);

router.delete(
    '/:id',
    protect,
    authorize('Admin'),
    objectIdValidation,
    validate,
    deleteBook
);

export default router;