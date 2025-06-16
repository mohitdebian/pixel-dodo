require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const admin = require('firebase-admin');
const crypto = require('crypto');

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON bodies
app.use(bodyParser.json());

// Function to get user ID from email
async function getUserIdFromEmail(email) {
  try {
    console.log('Looking up user with email:', email);
    const usersRef = admin.firestore().collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();
    
    if (snapshot.empty) {
      console.log('No user found with email:', email);
      return null;
    }
    
    const userId = snapshot.docs[0].id;
    console.log('Found user ID:', userId);
    return userId;
  } catch (error) {
    console.error('Error finding user:', error);
    return null;
  }
}

// Function to update user credits
async function updateUserCredits(userId, amount) {
  try {
    console.log(`Attempting to update credits for user ${userId} with amount ${amount}`);
    
    const userRef = admin.firestore().collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      console.error('User document not found');
      return { success: false, error: 'User not found' };
    }
    
    const currentCredits = userDoc.data().credits || 0;
    console.log('Current credits:', currentCredits);
    
    await userRef.update({
      credits: admin.firestore.FieldValue.increment(amount)
    });
    
    console.log('Credits updated successfully');
    return { success: true };
  } catch (error) {
    console.error('Error updating credits:', error);
    throw error;
  }
}

// Handle the redirect from Dodo checkout
app.get('/dodo-redirect', (req, res) => {
  // Log all query parameters for debugging
  console.log('Received redirect with params:', req.query);
  
  const { payment_id, status } = req.query;
  
  console.log('Payment ID:', payment_id);
  console.log('Status:', status);
  
  // Get the frontend URL from environment variable or use default
  const frontendUrl = process.env.MAINAPP_URL || 'http://localhost:5173';
  
  // Redirect to the frontend application's root URL with payment parameters
  if (status === 'success' || status === 'completed' || status === 'succeeded') {
    return res.redirect(`${frontendUrl}/?payment_id=${payment_id}&status=succeeded`);
  } else {
    return res.redirect(`${frontendUrl}/?payment_id=${payment_id}&status=failed`);
  }
});

app.post('/api/dodo-webhook', async (req, res) => {
  const payload = req.body;

  // Verify webhook signature if secret is available
  if (process.env.WEBHOOK_SECRET) {
    const signature = req.headers['dodo-signature'];
    const hmac = crypto.createHmac('sha256', process.env.WEBHOOK_SECRET);
    const calculatedSignature = hmac.update(JSON.stringify(payload)).digest('hex');
    
    if (signature !== calculatedSignature) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }
  }

  // Log the event for debugging
  console.log('Received webhook:');
  console.log('Headers:', req.headers);
  console.log('Payload:', JSON.stringify(payload, null, 2));

  try {
    // Handle webhook event
    switch (payload.type) {
      case 'payment.succeeded':
        const { customer, total_amount, payment_id, product_cart } = payload.data;
        
        console.log('Processing payment success:');
        console.log('- Customer:', customer);
        console.log('- Amount:', total_amount);
        console.log('- Payment ID:', payment_id);
        console.log('- Product Cart:', product_cart);
        
        // Get user ID from email
        const userId = await getUserIdFromEmail(customer.email);
        if (!userId) {
          console.error('User not found for email:', customer.email);
          return res.status(404).json({ error: 'User not found' });
        }
        
        // Map product IDs to credit amounts
        const creditAmounts = {
          'pdt_pXCCBMDtusTUcsrB6KECY': 100,  // 100 Credits
          'pdt_QcERrcHmG3kzIBR0Su4Sc': 500,  // 500 Credits
          'pdt_g1vldnHU4iWPsnPWuNfBF': 1000  // 1000 Credits
        };
        
        // Get the product ID from the cart
        const productId = product_cart[0]?.product_id;
        if (!productId) {
          console.error('No product ID found in cart');
          return res.status(400).json({ error: 'No product ID found' });
        }
        
        const creditsToAdd = creditAmounts[productId];
        if (!creditsToAdd) {
          console.error('Invalid product ID:', productId);
          return res.status(400).json({ error: 'Invalid product ID' });
        }
        
        console.log(`Processing payment: userId=${userId}, amount=${total_amount}, creditsToAdd=${creditsToAdd}`);
        
        // Update user credits
        const updateResult = await updateUserCredits(userId, creditsToAdd);
        if (!updateResult.success) {
          console.error('Failed to update credits:', updateResult.error);
          return res.status(500).json({ error: 'Failed to update credits' });
        }
        
        // Log success and respond with 200
        console.log(`Payment successful for user ${userId}, amount: ${total_amount}, payment_id: ${payment_id}, credits added: ${creditsToAdd}`);
        res.status(200).json({ 
          success: true,
          message: 'Payment processed successfully',
          payment_id,
          credits_added: creditsToAdd
        });
        break;

      case 'payment.failed':
        const failedPaymentId = payload.data.payment_id;
        // Log failure and respond with 200
        console.warn(`Payment failed for customer ${payload.data.customer.email}, payment_id: ${failedPaymentId}`);
        res.status(200).json({ 
          success: false,
          message: 'Payment failed',
          payment_id: failedPaymentId
        });
        break;

      default:
        console.log('Unhandled event type:', payload.type);
        res.status(200).json({ received: true });
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Frontend URL: ${process.env.MAINAPP_URL || 'http://localhost:5173'}`);
});