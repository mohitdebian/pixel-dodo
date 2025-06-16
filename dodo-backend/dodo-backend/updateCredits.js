const express = require('express');
const router = express.Router();
const { getFirestore, doc, updateDoc, increment } = require('firebase-admin/firestore');
const db = getFirestore();

router.post('/api/update-credits', async (req, res) => {
  const { userId, amount } = req.body;
  if (!userId || typeof amount !== 'number') {
    return res.status(400).json({ error: 'Missing userId or amount' });
  }
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { credits: increment(amount) });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating credits:', error);
    return res.status(500).json({ error: 'Failed to update credits' });
  }
});

module.exports = router;
