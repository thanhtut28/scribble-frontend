import { z } from "zod";

export const createRoomSchema = z.object({
  name: z.string().min(3).max(20),
  maxPlayers: z.number().min(1).max(10),
  isPrivate: z.boolean().default(false).optional(),
  rounds: z.number().min(1).max(8),
  password: z.string().min(8).max(20).optional(),
});

export type CreateRoomValues = z.infer<typeof createRoomSchema>;
