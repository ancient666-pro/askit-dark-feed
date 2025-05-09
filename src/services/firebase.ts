
import { toast } from "sonner";
import { Poll, VoteData, PinPollData } from "@/types/poll";

// Mock Firebase Firestore implementation
class FirebaseService {
  private polls: Poll[] = [];
  private deviceId: string;

  constructor() {
    // Generate a device ID for anonymous identity
    this.deviceId = localStorage.getItem("deviceId") || this.generateDeviceId();
    if (!localStorage.getItem("deviceId")) {
      localStorage.setItem("deviceId", this.deviceId);
    }

    // Sample data for demonstration
    this.polls = [
      {
        id: "1",
        question: "Should remote work be the new normal?",
        type: "yesNo",
        createdAt: Date.now() - 3600000,
        isPinned: true,
        pinExpiresAt: Date.now() + 3600000,
        votes: { yes: 42, no: 18 }
      },
      {
        id: "2",
        question: "Which is better for productivity?",
        type: "optionAB",
        createdAt: Date.now() - 7200000,
        isPinned: false,
        votes: { optionA: 24, optionB: 31 }
      },
      {
        id: "3",
        question: "Do you prefer dark mode over light mode?",
        type: "yesNo",
        createdAt: Date.now() - 10800000,
        isPinned: false,
        votes: { yes: 76, no: 12 }
      }
    ];
  }

  private generateDeviceId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  async getPolls(): Promise<Poll[]> {
    // Sort by pin status (pinned first) then by creation time (newest first)
    return [...this.polls].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.createdAt - a.createdAt;
    });
  }

  async createPoll(question: string, type: "yesNo" | "optionAB"): Promise<Poll> {
    const newPoll: Poll = {
      id: Math.random().toString(36).substring(2, 10),
      question,
      type,
      createdAt: Date.now(),
      isPinned: false,
      votes: type === "yesNo" ? { yes: 0, no: 0 } : { optionA: 0, optionB: 0 }
    };
    
    this.polls.unshift(newPoll);
    return newPoll;
  }

  async votePoll({ pollId, vote }: VoteData): Promise<Poll | null> {
    const votedPolls = localStorage.getItem("votedPolls") ? 
      JSON.parse(localStorage.getItem("votedPolls") || "{}") : {};
    
    if (votedPolls[pollId]) {
      toast.error("You've already voted on this poll");
      return null;
    }
    
    const pollIndex = this.polls.findIndex(p => p.id === pollId);
    if (pollIndex === -1) return null;
    
    const poll = {...this.polls[pollIndex]};
    
    // Update vote count
    if (poll.votes[vote] !== undefined) {
      poll.votes[vote]!++;
    }
    
    // Update poll in array
    this.polls[pollIndex] = poll;
    
    // Mark poll as voted for this device
    votedPolls[pollId] = true;
    localStorage.setItem("votedPolls", JSON.stringify(votedPolls));
    
    return poll;
  }

  async pinPoll({ pollId }: PinPollData): Promise<Poll | null> {
    const pollIndex = this.polls.findIndex(p => p.id === pollId);
    if (pollIndex === -1) return null;
    
    const updatedPoll = {
      ...this.polls[pollIndex],
      isPinned: true,
      pinExpiresAt: Date.now() + 3600000 // 1 hour from now
    };
    
    this.polls[pollIndex] = updatedPoll;
    return updatedPoll;
  }

  // In a real app, this would clean expired pins periodically
  async cleanExpiredPins(): Promise<void> {
    const now = Date.now();
    this.polls = this.polls.map(poll => {
      if (poll.isPinned && poll.pinExpiresAt && poll.pinExpiresAt < now) {
        return { ...poll, isPinned: false };
      }
      return poll;
    });
  }

  hasVoted(pollId: string): boolean {
    const votedPolls = localStorage.getItem("votedPolls") ? 
      JSON.parse(localStorage.getItem("votedPolls") || "{}") : {};
    return !!votedPolls[pollId];
  }
}

export const firebaseService = new FirebaseService();
