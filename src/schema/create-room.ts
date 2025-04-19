import { z } from "zod";

export const gameSettingsSchema = z.object({
  players: z.number().min(1).max(10),
  drawTime: z.number().min(20).max(240), // min time you want to allow
  rounds: z.number().min(2).max(10), // min rounds you want to allow
  wordCount: z.number().min(1).max(5),
  hints: z.number().min(0).max(5),
});

export type GameSettings = z.infer<typeof gameSettingsSchema>;
