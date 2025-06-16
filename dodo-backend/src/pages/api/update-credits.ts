import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../lib/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { userId, amount } = req.body;
  if (!userId || typeof amount !== 'number') {
    return res.status(400).json({ error: 'Missing userId or amount' });
  }
  try {
    console.log(`Updating credits for user ${userId} with amount ${amount}`);
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { credits: increment(amount) });
    console.log(`Credits updated successfully for user ${userId}`);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating credits:', error);
    return res.status(500).json({ error: 'Failed to update credits' });
  }
}
