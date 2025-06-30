
import { firebasePollsService } from "./firebasePolls";
import { firebaseVotingService } from "./firebaseVoting";
import { deviceIdManager } from "@/utils/deviceId";

class FirebaseService {
  // Polls methods
  async getPolls() {
    return firebasePollsService.getPolls();
  }

  async getTrendingPolls(count?: number) {
    return firebasePollsService.getTrendingPolls(count);
  }

  async getTopTrendingPolls(count?: number) {
    return firebasePollsService.getTopTrendingPolls(count);
  }

  async createPoll(question: string, type: "yesNo" | "customOptions", options: any[]) {
    return firebasePollsService.createPoll(question, type, options);
  }

  // Voting methods
  async votePoll(voteData: any) {
    return firebaseVotingService.votePoll(voteData);
  }

  hasVoted(pollId: string) {
    return firebaseVotingService.hasVoted(pollId);
  }

  getVotedOption(pollId: string) {
    return firebaseVotingService.getVotedOption(pollId);
  }

  // Device ID method
  getDeviceId() {
    return deviceIdManager.getDeviceId();
  }
}

export const firebaseService = new FirebaseService();
