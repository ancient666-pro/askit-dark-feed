
// Vercel Serverless Function for verifying Razorpay payments
const crypto = require('crypto');

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
    console.log('Verify payment request:', JSON.stringify(req.body));
    
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ 
        error: 'Missing required payment verification parameters',
        received: { 
          razorpay_order_id: !!razorpay_order_id, 
          razorpay_payment_id: !!razorpay_payment_id, 
          razorpay_signature: !!razorpay_signature 
        }
      });
    }

    console.log('Verifying payment:', razorpay_payment_id);

    // Get Razorpay secret key from environment variable
    const secret = process.env.RAZORPAY_KEY_SECRET;
    
    // Check if the secret key is available (don't log the actual secret)
    if (!secret) {
      console.error('Missing Razorpay secret key');
      return res.status(500).json({ error: 'Server configuration error: Missing Razorpay secret key' });
    }

    // Verify the payment signature
    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');
    
    const is_authentic = generated_signature === razorpay_signature;
    
    if (!is_authentic) {
      console.log('Signature verification failed');
      console.log('Generated signature:', generated_signature);
      console.log('Received signature:', razorpay_signature);
      return res.status(400).json({ 
        error: 'Payment verification failed',
        details: 'Signature mismatch'
      });
    }

    console.log('Payment verified successfully');
    // Payment is verified successfully
    return res.status(200).json({ 
      verified: true,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id
    });
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    return res.status(500).json({ 
      error: 'Failed to verify payment',
      details: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
};
