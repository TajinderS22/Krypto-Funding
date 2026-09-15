export type Challenge = {
  id: string;
  creator_id?: string;
  title: string;
  description: string;
  value: number;
  price: number;
  steps?: number | null;
  drawdown?: number | null;
  target?: number | null;
  created_at: Date;
  updated_at: Date;
};

export type ChallengeStatus = {
  id: number;
  status: string;
  passed: boolean;
  currentStepStatus: number | null;
  steps: number | null;
  hasApiKey: boolean;
  value: number;
  currentBalance: number; 
  updated_at: string;
};

export type MyChallenge = {
  purchase_id: number;
  purchase_date: string;
  status: ChallengeStatus | null;
  challenge: Challenge;
};
