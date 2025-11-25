import mongoose from 'mongoose';

const borrowingSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        bookId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Book',
            required: true
        },
        borrowDate: {
            type: Date,
            required: true,
            default: Date.now
        },
        dueDate: {
            type: Date,
            required: true
        },
        returnDate: {
            type: Date,
            default: null
        },
        status: {
            type: String,
            enum: ['Borrowed', 'Returned', 'Overdue'],
            default: 'Borrowed'
        }
    },
    {
        timestamps: true
    }
);

const Borrowing = mongoose.model('Borrowing', borrowingSchema);

export default Borrowing;