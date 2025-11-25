import express from 'express';
import {
    borrowBook,
    getAllBorrowings,
    getMyBorrowingHistory,
    returnBook
} from '../controllers/borrowingController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { objectIdValidation, validate } from '../utils/validators.js';

const router = express.Router();

// Member routes
router.post(
    '/borrow/:id',
    protect,                    // First: Authentication
    authorize('Member', 'Admin'), // Second: Authorization
    objectIdValidation,         // Third: Validation
    validate,                   // Fourth: Check validation results
    borrowBook                  // Fifth: Controller
);

router.put(
    '/return/:id',
    protect,
    authorize('Member', 'Admin'),
    objectIdValidation,
    validate,
    returnBook
);

router.get(
    '/my-history',
    protect,
    authorize('Member', 'Admin'),
    getMyBorrowingHistory
);

// Admin routes
router.get('/', protect, authorize('Admin'), getAllBorrowings);

export default router;