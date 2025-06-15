import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

admin.initializeApp();

export const dodoWebhook = functions.https.onRequest(async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }

  try {
    // Get the signature from headers
    const signature = req.headers['dodo-signature'];
    const payload = req.body;

    // Verify webhook signature if secret is available
    if (process.env.DODO_WEBHOOK_SECRET) {
      const hmac = crypto.createHmac('sha256', process.env.DODO_WEBHOOK_SECRET);
      const calculatedSignature = hmac.update(JSON.stringify(payload)).digest('hex');
      
      if (signature !== calculatedSignature) {
        console.error('Invalid webhook signature');
        res.status(401).send('Invalid signature');
        return;
      }
    }

    // Extract payment details from payload
    const { type, data } = payload;

    // Only process successful payments
    if (type !== 'payment.succeeded') {
      res.status(200).send('Ignored non-payment event');
      return;
    }

    const { customer, amount, product_id } = data;

    // Find user by email (customer email from Dodo)
    const usersRef = admin.firestore().collection('users');
    const userSnapshot = await usersRef.where('email', '==', customer.email).get();

    if (userSnapshot.empty) {
      console.error('User not found for email:', customer.email);
      res.status(404).send('User not found');
      return;
    }

    const userDoc = userSnapshot.docs[0];
    const userId = userDoc.id;

    // Map product IDs to credit amounts
    const creditAmounts: { [key: string]: number } = {
      'pdt_pXCCBMDtusTUcsrB6KECY': 100,  // 100 Credits
      'pdt_QcERrcHmG3kzIBR0Su4Sc': 500,  // 500 Credits
      'pdt_g1vldnHU4iWPsnPWuNfBF': 1000  // 1000 Credits
    };

    const creditsToAdd = creditAmounts[product_id];
    if (!creditsToAdd) {
      console.error('Invalid product ID:', product_id);
      res.status(400).send('Invalid product ID');
      return;
    }

    // Update user's credits
    await userDoc.ref.update({
      credits: admin.firestore.FieldValue.increment(creditsToAdd)
    });

    // Log successful credit addition
    console.log(`Added ${creditsToAdd} credits to user ${userId}`);

    res.status(200).send('Credits added successfully');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Internal server error');
  }
}); 