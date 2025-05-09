
export type PollType = "yesNo" | "optionAB";

export interface Poll {
  id: string;
  question: string;
  type: PollType;
  createdAt: number; // timestamp
  isPinned: boolean;
  pinExpiresAt?: number; // timestamp when pin expires
  votes: {
    yes?: number;
    no?: number;
    optionA?: number;
    optionB?: number;
  };
}

export interface VoteData {
  pollId: string;
  vote: "yes" | "no" | "optionA" | "optionB";
}

export interface PinPollData {
  pollId: string;
  orderId: string;
  paymentId: string;
}
