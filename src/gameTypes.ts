import type { StatId } from './gameConfig';

export type ActivityEntry = {
  id: string;
  label: string;
  statId: StatId;
  hours: number;
  xp: number;
  rentPoints: number;
  timestamp: number;
  timeLabel: string;
  localDate: string;
};

export type DailyRentResult = {
  localDate: string;
  rentPaid: boolean;
  paidAt: number;
  coinReward: number;
};

export type RestTokenUse = {
  localDate: string;
  usedAt: number;
  coinCost: number;
};

export type Quest = {
  id: string;
  label: string;
  createdAt: number;
  deadlineAt: number | null;
};
