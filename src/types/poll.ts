
export type PollType = "yesNo" | "customOptions";

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  type: PollType;
  createdAt: number; // timestamp
  options: PollOption[]; // For both yesNo and customOptions types
  totalVotes: number;
  votesPerHour?: number; // For trending calculation
}

export interface VoteData {
  pollId: string;
  optionId: string;
}
