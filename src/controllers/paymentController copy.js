//controllers/paymentController.js
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { insertPaymentDetails } = require('../models/paymentModel'); // Import the payment model
require('dotenv').config(); // Add this line to load environment variables

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createRazorpayOrder = async (req, res) => {
    try {
        const amount = req.body.amount; // Amount in paise from the frontend
        const currency = 'INR';
        const options = {
            amount: amount,
            currency: currency,
            receipt: `renewal_rcptid_${Date.now()}_${req.user ? req.user.id : 'guest'}`, // Include user ID if available
        };

        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) {
        console.error('❌ Error creating Razorpay order:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
};

const verifyPayment = async (req, res) => {
    const { paymentId, orderId, signature } = req.body;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(orderId + '|' + paymentId)
        .digest('hex');

    if (generatedSignature === signature) {
        console.log('✅ Payment signature verified successfully');
        try {
            const paymentDetails = {
                paymentId,
                orderId,
                signature,
                amount: req.body.amount, // Ensure you send the amount from the frontend
                currency: 'INR',
                userId: req.user ? req.user.id : null, // Get user ID from authentication context
            };
            await insertPaymentDetails(paymentDetails);
            // Here you would also update the user's profile to mark renewal
            res.json({ success: true, message: 'Payment successful and details saved' });
        } catch (error) {
            console.error('❌ Error saving payment details:', error);
            res.status(500).json({ success: true, message: 'Payment successful but failed to save details' });
        }
    } else {
        console.error('❌ Payment signature verification failed');
        res.status(400).json({ success: false, error: 'Payment signature verification failed' });
    }
};

module.exports = { createRazorpayOrder, verifyPayment };
