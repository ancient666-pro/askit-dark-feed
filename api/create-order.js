
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
    // Log the request body to help with debugging
    console.log('Request body:', JSON.stringify(req.body));
    
    const { pollId } = req.body;
    
    if (!pollId) {
      return res.status(400).json({ error: 'Poll ID is required' });
    }

    // Get Razorpay credentials from environment variables
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    
    // Log the key_id to verify it's being read correctly (don't log the secret!)
    console.log('Using Razorpay key ID:', key_id);
    
    if (!key_id || !key_secret) {
      console.error('Missing Razorpay credentials');
      return res.status(500).json({ error: 'Server configuration error: Missing Razorpay credentials' });
    }
    
    console.log('Creating Razorpay order for poll:', pollId);

    // Initialize Razorpay instance
    const razorpay = new Razorpay({
      key_id: key_id,
      key_secret: key_secret
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
    
    // Return complete order information for debugging
    return res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return res.status(500).json({ 
      error: 'Failed to create order', 
      details: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
};
