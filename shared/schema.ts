import { z } from "zod";

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
}

export const insertUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export const insertChatSessionSchema = z.object({
  userId: z.string(),
  title: z.string().default("New Conversation"),
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
    timestamp: z.string(),
  })).default([]),
});

export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
