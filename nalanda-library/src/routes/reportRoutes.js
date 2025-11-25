import express from 'express';
import {
    getActiveMembers,
    getBookAvailability,
    getMostBorrowedBooks,
    getOverdueBooks
} from '../controllers/reportController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// All report routes are Admin only
router.get(
    '/most-borrowed-books',
    protect,
    authorize('Admin'),
    getMostBorrowedBooks
);

router.get('/active-members', protect, authorize('Admin'), getActiveMembers);

router.get(
    '/book-availability',
    protect,
    authorize('Admin'),
    getBookAvailability
);

router.get('/overdue-books', protect, authorize('Admin'), getOverdueBooks);

export default router;