
import { toast } from "sonner";
import { Poll, PollOption, VoteData } from "@/types/poll";
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
  increment,
  limit,
  where
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

// Firebase configuration - replace with your own Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyCOeFzbTpxxffIpVAlhQnBIOhZbdL6KhV8",
  authDomain: "askitserver.firebaseapp.com",
  projectId: "askitserver",
  storageBucket: "askitserver.firebasestorage.app",
  messagingSenderId: "438161991675",
  appId: "1:438161991675:web:d3c65a2118e18f33e60d5e"
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
      const querySnapshot = await getDocs(
        query(pollsRef, orderBy("createdAt", "desc"))
      );
      
      if (querySnapshot.empty) {
        // If no polls exist, let's create some sample ones
        await this.createSamplePolls();
        return this.getPolls();
      }
      
      // Convert the documents to Poll objects and calculate votesPerHour
      const polls = await Promise.all(querySnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const options = data.options || [];
        const totalVotes = options.reduce((sum: number, option: PollOption) => sum + option.votes, 0);
        
        // Calculate votes per hour (for trending)
        const createdAtTimestamp = data.createdAt?.toMillis() || Date.now();
        const hoursElapsed = Math.max(1, (Date.now() - createdAtTimestamp) / (1000 * 60 * 60));
        const votesPerHour = totalVotes / hoursElapsed;
        
        return {
          id: doc.id,
          question: data.question,
          type: data.type,
          createdAt: createdAtTimestamp,
          options: options,
          totalVotes: totalVotes,
          votesPerHour: votesPerHour
        } as Poll;
      }));
      
      return polls;
    } catch (error) {
      console.error("Error getting polls:", error);
      
      // Handle permission denied error specifically
      if (error.code === 'permission-denied') {
        toast.error("Permission denied. Check your Firebase security rules.");
      } else {
        toast.error("Failed to fetch polls");
      }
      
      return [];
    }
  }

  async getTrendingPolls(count: number = 10): Promise<Poll[]> {
    try {
      const polls = await this.getPolls();
      
      // Sort by votesPerHour (most votes per hour first)
      return polls
        .sort((a, b) => (b.votesPerHour || 0) - (a.votesPerHour || 0))
        .slice(0, count);
    } catch (error) {
      console.error("Error getting trending polls:", error);
      toast.error("Failed to fetch trending polls");
      return [];
    }
  }

  async getTopTrendingPolls(count: number = 3): Promise<Poll[]> {
    return this.getTrendingPolls(count);
  }

  private async createSamplePolls(): Promise<void> {
    try {
      const pollsRef = collection(db, "polls");
      
      const samplePolls = [
        {
          question: "Should remote work be the new normal?",
          type: "yesNo",
          createdAt: Timestamp.fromMillis(Date.now() - 3600000), // 1 hour ago
          options: [
            { id: "yes", text: "Yes", votes: 42 },
            { id: "no", text: "No", votes: 18 }
          ]
        },
        {
          question: "Which is better for productivity?",
          type: "customOptions",
          createdAt: Timestamp.fromMillis(Date.now() - 7200000), // 2 hours ago
          options: [
            { id: uuidv4(), text: "Working from home", votes: 24 },
            { id: uuidv4(), text: "Working from office", votes: 31 },
            { id: uuidv4(), text: "Hybrid model", votes: 45 }
          ]
        },
        {
          question: "Do you prefer dark mode over light mode?",
          type: "yesNo",
          createdAt: Timestamp.fromMillis(Date.now() - 10800000), // 3 hours ago
          options: [
            { id: "yes", text: "Yes", votes: 76 },
            { id: "no", text: "No", votes: 12 }
          ]
        }
      ];
      
      for (const poll of samplePolls) {
        await addDoc(pollsRef, poll);
      }
      
      console.log("Sample polls created successfully");
    } catch (error) {
      console.error("Error creating sample polls:", error);
      
      if (error.code === 'permission-denied') {
        toast.error("Permission denied when creating sample polls. Check your Firebase security rules.");
      }
    }
  }

  async createPoll(question: string, type: "yesNo" | "customOptions", options: PollOption[]): Promise<Poll> {
    try {
      const pollsRef = collection(db, "polls");
      
      const newPoll = {
        question,
        type,
        createdAt: serverTimestamp(),
        options
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
        options,
        totalVotes: 0
      };
    } catch (error) {
      console.error("Error creating poll:", error);
      
      if (error.code === 'permission-denied') {
        toast.error("Cannot create poll: Permission denied. Check your Firebase security rules.");
      } else {
        toast.error("Failed to create poll");
      }
      
      throw error;
    }
  }

  async votePoll({ pollId, optionId }: VoteData): Promise<Poll | null> {
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
      const options = [...(pollData.options || [])];
      
      // Find the option to update
      const optionIndex = options.findIndex(opt => opt.id === optionId);
      if (optionIndex === -1) {
        toast.error("Option not found");
        return null;
      }
      
      // Update vote count for the selected option
      options[optionIndex].votes = (options[optionIndex].votes || 0) + 1;
      
      // Update poll in Firestore
      await updateDoc(pollRef, { options });
      
      // Mark poll as voted for this device
      votedPolls[pollId] = optionId;
      localStorage.setItem("votedPolls", JSON.stringify(votedPolls));
      
      // Calculate total votes
      const totalVotes = options.reduce((sum, opt) => sum + (opt.votes || 0), 0);
      
      // Calculate votes per hour
      const createdAtTimestamp = pollData.createdAt?.toMillis() || Date.now();
      const hoursElapsed = Math.max(1, (Date.now() - createdAtTimestamp) / (1000 * 60 * 60));
      const votesPerHour = totalVotes / hoursElapsed;
      
      const updatedPoll = {
        id: pollId,
        question: pollData.question,
        type: pollData.type,
        createdAt: createdAtTimestamp,
        options: options,
        totalVotes: totalVotes,
        votesPerHour: votesPerHour
      };
      
      return updatedPoll;
    } catch (error) {
      console.error("Error voting on poll:", error);
      toast.error("Failed to record vote");
      return null;
    }
  }

  hasVoted(pollId: string): boolean {
    const votedPolls = localStorage.getItem("votedPolls") ? 
      JSON.parse(localStorage.getItem("votedPolls") || "{}") : {};
    return !!votedPolls[pollId];
  }

  getVotedOption(pollId: string): string | null {
    const votedPolls = localStorage.getItem("votedPolls") ? 
      JSON.parse(localStorage.getItem("votedPolls") || "{}") : {};
    return votedPolls[pollId] || null;
  }
}

export const firebaseService = new FirebaseService();
