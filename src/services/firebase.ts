
import { toast } from "sonner";
import { Poll, VoteData, PinPollData } from "@/types/poll";
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  Timestamp,
  where
} from "firebase/firestore";

// Firebase configuration - replace with your own Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyD_VG7PJcVyO2CHIUHrpn11MeUX1X48MuE",
  authDomain: "askit-polls.firebaseapp.com",
  projectId: "askit-polls",
  storageBucket: "askit-polls.appspot.com",
  messagingSenderId: "745819241844",
  appId: "1:745819241844:web:ac4ad8f7e6303c8b9c681d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

class FirebaseService {
  private deviceId: string;

  constructor() {
    // Generate a device ID for anonymous identity
    this.deviceId = localStorage.getItem("deviceId") || this.generateDeviceId();
    if (!localStorage.getItem("deviceId")) {
      localStorage.setItem("deviceId", this.deviceId);
    }
  }

  private generateDeviceId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  async getPolls(): Promise<Poll[]> {
    try {
      // First get all polls
      const pollsRef = collection(db, "polls");
      const querySnapshot = await getDocs(pollsRef);
      
      if (querySnapshot.empty) {
        // If no polls exist, let's create some sample ones
        await this.createSamplePolls();
        return this.getPolls();
      }
      
      // Convert the documents to Poll objects
      const polls = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          question: data.question,
          type: data.type,
          createdAt: data.createdAt.toMillis(),
          isPinned: data.isPinned || false,
          pinExpiresAt: data.pinExpiresAt?.toMillis() || null,
          votes: data.votes
        } as Poll;
      });
      
      // Sort by pin status (pinned first) then by creation time (newest first)
      return polls.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.createdAt - a.createdAt;
      });
    } catch (error) {
      console.error("Error getting polls:", error);
      toast.error("Failed to fetch polls");
      return [];
    }
  }

  private async createSamplePolls(): Promise<void> {
    try {
      const pollsRef = collection(db, "polls");
      
      const samplePolls = [
        {
          question: "Should remote work be the new normal?",
          type: "yesNo",
          createdAt: Timestamp.fromMillis(Date.now() - 3600000),
          isPinned: true,
          pinExpiresAt: Timestamp.fromMillis(Date.now() + 3600000),
          votes: { yes: 42, no: 18 }
        },
        {
          question: "Which is better for productivity?",
          type: "optionAB",
          createdAt: Timestamp.fromMillis(Date.now() - 7200000),
          isPinned: false,
          votes: { optionA: 24, optionB: 31 }
        },
        {
          question: "Do you prefer dark mode over light mode?",
          type: "yesNo",
          createdAt: Timestamp.fromMillis(Date.now() - 10800000),
          isPinned: false,
          votes: { yes: 76, no: 12 }
        }
      ];
      
      for (const poll of samplePolls) {
        await addDoc(pollsRef, poll);
      }
      
      console.log("Sample polls created successfully");
    } catch (error) {
      console.error("Error creating sample polls:", error);
    }
  }

  async createPoll(question: string, type: "yesNo" | "optionAB"): Promise<Poll> {
    try {
      const pollsRef = collection(db, "polls");
      
      const newPoll = {
        question,
        type,
        createdAt: serverTimestamp(),
        isPinned: false,
        votes: type === "yesNo" ? { yes: 0, no: 0 } : { optionA: 0, optionB: 0 }
      };
      
      const docRef = await addDoc(pollsRef, newPoll);
      
      // We need to get the actual document to include the server timestamp
      const docSnap = await getDoc(docRef);
      const data = docSnap.data();
      
      return {
        id: docRef.id,
        question,
        type,
        createdAt: data?.createdAt?.toMillis() || Date.now(),
        isPinned: false,
        votes: type === "yesNo" ? { yes: 0, no: 0 } : { optionA: 0, optionB: 0 }
      };
    } catch (error) {
      console.error("Error creating poll:", error);
      toast.error("Failed to create poll");
      throw error;
    }
  }

  async votePoll({ pollId, vote }: VoteData): Promise<Poll | null> {
    try {
      const votedPolls = localStorage.getItem("votedPolls") ? 
        JSON.parse(localStorage.getItem("votedPolls") || "{}") : {};
      
      if (votedPolls[pollId]) {
        toast.error("You've already voted on this poll");
        return null;
      }
      
      const pollRef = doc(db, "polls", pollId);
      const pollSnap = await getDoc(pollRef);
      
      if (!pollSnap.exists()) {
        toast.error("Poll not found");
        return null;
      }
      
      const pollData = pollSnap.data();
      const updatedVotes = { ...pollData.votes };
      
      // Update vote count
      if (updatedVotes[vote] !== undefined) {
        updatedVotes[vote] = (updatedVotes[vote] || 0) + 1;
      }
      
      // Update poll in Firestore
      await updateDoc(pollRef, { votes: updatedVotes });
      
      // Mark poll as voted for this device
      votedPolls[pollId] = true;
      localStorage.setItem("votedPolls", JSON.stringify(votedPolls));
      
      const updatedPoll = {
        id: pollId,
        question: pollData.question,
        type: pollData.type,
        createdAt: pollData.createdAt.toMillis(),
        isPinned: pollData.isPinned || false,
        pinExpiresAt: pollData.pinExpiresAt?.toMillis() || null,
        votes: updatedVotes
      };
      
      return updatedPoll;
    } catch (error) {
      console.error("Error voting on poll:", error);
      toast.error("Failed to record vote");
      return null;
    }
  }

  async pinPoll({ pollId, orderId, paymentId }: PinPollData): Promise<Poll | null> {
    try {
      const pollRef = doc(db, "polls", pollId);
      const pollSnap = await getDoc(pollRef);
      
      if (!pollSnap.exists()) {
        toast.error("Poll not found");
        return null;
      }
      
      // Create payment record in Firestore
      const paymentRef = collection(db, "payments");
      await addDoc(paymentRef, {
        pollId,
        orderId,
        paymentId,
        amount: 1000, // ₹10.00 in paise
        createdAt: serverTimestamp(),
        status: "completed"
      });
      
      // Update poll with pinned status
      const pinExpiresAt = Timestamp.fromMillis(Date.now() + 3600000); // 1 hour from now
      await updateDoc(pollRef, {
        isPinned: true,
        pinExpiresAt
      });
      
      // Get updated poll data
      const updatedPollSnap = await getDoc(pollRef);
      const updatedPollData = updatedPollSnap.data();
      
      return {
        id: pollId,
        question: updatedPollData.question,
        type: updatedPollData.type,
        createdAt: updatedPollData.createdAt.toMillis(),
        isPinned: true,
        pinExpiresAt: pinExpiresAt.toMillis(),
        votes: updatedPollData.votes
      };
    } catch (error) {
      console.error("Error pinning poll:", error);
      toast.error("Failed to pin poll");
      return null;
    }
  }

  async cleanExpiredPins(): Promise<void> {
    try {
      const now = Timestamp.now();
      const pollsRef = collection(db, "polls");
      
      // Query for pinned polls with expired pins
      const q = query(
        pollsRef,
        where("isPinned", "==", true),
        where("pinExpiresAt", "<", now)
      );
      
      const expiredPinsSnapshot = await getDocs(q);
      
      // Update each expired pin
      expiredPinsSnapshot.forEach(async (document) => {
        await updateDoc(doc(db, "polls", document.id), {
          isPinned: false
        });
      });
    } catch (error) {
      console.error("Error cleaning expired pins:", error);
    }
  }

  hasVoted(pollId: string): boolean {
    const votedPolls = localStorage.getItem("votedPolls") ? 
      JSON.parse(localStorage.getItem("votedPolls") || "{}") : {};
    return !!votedPolls[pollId];
  }
}

export const firebaseService = new FirebaseService();
