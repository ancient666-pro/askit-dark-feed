
import { toast } from "sonner";
import { Poll, PollOption } from "@/types/poll";
import { db } from "@/config/firebase";
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

export class FirebasePollsService {
  async getPolls(): Promise<Poll[]> {
    try {
      console.log("Fetching polls from Firebase...");
      
      // First get all polls
      const pollsRef = collection(db, "polls");
      const querySnapshot = await getDocs(
        query(pollsRef, orderBy("createdAt", "desc"))
      );
      
      console.log("Query snapshot size:", querySnapshot.size);
      
      if (querySnapshot.empty) {
        console.log("No polls found, creating sample polls...");
        // If no polls exist, let's create some sample ones
        await this.createSamplePolls();
        return this.getPolls();
      }
      
      // Convert the documents to Poll objects and calculate votesPerHour
      const polls = querySnapshot.docs.map((doc) => {
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
      });
      
      console.log("Successfully fetched polls:", polls.length);
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

  private async createSamplePolls(): Promise<void> {
    try {
      console.log("Creating sample polls...");
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
}

export const firebasePollsService = new FirebasePollsService();
