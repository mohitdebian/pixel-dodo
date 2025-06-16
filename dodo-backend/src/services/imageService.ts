import Together from "together-ai";
import axios from "axios";
import { auth, db } from "../lib/firebase";
import { hasEnoughCredits, deductCredits, isEmailVerified } from "./auth";
import { toast } from 'sonner';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

// Custom event for credit updates
const CREDIT_UPDATE_EVENT = 'creditUpdate';

// Initialize Together client with environment variable if available
let together: Together | null = null;

export function initializeTogether(apiKey: string) {
  together = new Together({ apiKey });
  return together;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}

export async function generateImage(prompt: string): Promise<GeneratedImage> {
  try {
    if (!together) {
      throw new Error("API client is not initialized");
    }

    const user = auth.currentUser;
    if (!user) {
      throw new Error("User must be logged in to generate images");
    }
    
    // Check if email is verified
    const verified = await isEmailVerified(user.uid);
    if (!verified) {
      toast.error("Please verify your email before generating images.");
      throw new Error("Email not verified");
    }

    // Check if user has enough credits before making the API request
    const hasCredits = await hasEnoughCredits(user.uid);
    if (!hasCredits) {
      toast.error("Insufficient credits. Please purchase more credits to continue.");
      throw new Error("Insufficient credits");
    }

    // Generate the image
    const response = await together.images.create({
      model: "black-forest-labs/FLUX.1-schnell-Free",
      prompt: prompt,
      steps: 4,
      n: 1
    });

    const imageUrl = response.data[0].url;
    
    // Deduct credits after successful generation
    await deductCredits(user.uid);
    
    // Dispatch credit update event
    window.dispatchEvent(new Event(CREDIT_UPDATE_EVENT));
    
    const imageId = Date.now().toString();
    const generatedImage: GeneratedImage = {
      id: imageId,
      url: imageUrl,
      prompt: prompt,
      timestamp: Date.now()
    };
    
    // Save to Firestore as the last generated image with timestamp
    try {
      const timestamp = new Date();
      const lastImageData = {
        imageId,
        url: imageUrl,
        prompt,
        createdAt: timestamp.toISOString(),
        timestamp: timestamp,
        date: timestamp.toLocaleDateString(),
        time: timestamp.toLocaleTimeString()
      };
      
      await updateDoc(doc(db, 'users', user.uid), {
        lastGeneratedImage: lastImageData
      });
    } catch (saveError) {
      console.error('Error saving last image to Firestore:', saveError);
    }
    
    return generatedImage;
  } catch (error) {
    console.error("Error generating image:", error);
    if (error instanceof Error && error.message === "Insufficient credits") {
      throw error; // Re-throw the insufficient credits error
    }
    toast.error("Failed to generate img");
    throw error;
  }
}

/**
 * Retrieves the last generated image for a user from Firestore
 * @param userId The user ID to retrieve the last image for
 * @returns The last generated image data or null if not found
 */
export async function getLastGeneratedImage(userId: string) {
  try {
    if (!userId) {
      console.error("User ID is required to retrieve last image");
      return null;
    }
    
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists() && docSnap.data().lastGeneratedImage) {
      return docSnap.data().lastGeneratedImage;
    } else {
      console.log("No last image found for user");
      return null;
    }
  } catch (error) {
    console.error("Error retrieving last generated image:", error);
    return null;
  }
}
