
// Vercel Serverless Function for creating Razorpay orders
const Razorpay = require('razorpay');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pollId } = req.body;
    
    if (!pollId) {
      return res.status(400).json({ error: 'Poll ID is required' });
    }

    console.log('Creating Razorpay order for poll:', pollId);
    console.log('Using Razorpay key:', process.env.RAZORPAY_KEY_ID);

    // Initialize Razorpay instance
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    // Create an order
    const order = await razorpay.orders.create({
      amount: 1000, // ₹10.00 in paise
      currency: 'INR',
      receipt: `poll_boost_${pollId}_${Date.now()}`,
      notes: {
        pollId: pollId
      }
    });

    console.log('Order created successfully:', order.id);
    return res.status(200).json({
      orderId: order.id,
      amount: order.amount
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return res.status(500).json({ error: 'Failed to create order', details: error.message });
  }
};
