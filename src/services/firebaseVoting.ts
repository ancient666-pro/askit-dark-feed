
import { toast } from "sonner";
import { Poll, VoteData } from "@/types/poll";
import { db } from "@/config/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export class FirebaseVotingService {
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

export const firebaseVotingService = new FirebaseVotingService();
