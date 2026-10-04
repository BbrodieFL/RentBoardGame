import { dailyRentCoinReward } from './gameConfig';
import type { GameActionFeedback } from './gameActions';

export function shouldOpenRentReflection(feedback: GameActionFeedback | null): feedback is GameActionFeedback {
  return feedback?.text === `RENT PAID +${dailyRentCoinReward} coins`;
}
