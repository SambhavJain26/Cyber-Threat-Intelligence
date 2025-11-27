import { type User, type InsertUser, type ChatSession, type ChatMessage, type InsertChatSession } from "@shared/schema";
import { randomUUID } from "crypto";
import { getDB } from "./db/mongodb";
import { ObjectId } from "mongodb";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByEmailOrUsername(emailOrUsername: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getChatSessionsByUser(userId: string): Promise<ChatSession[]>;
  getChatSession(sessionId: string): Promise<ChatSession | undefined>;
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  updateChatSession(sessionId: string, messages: ChatMessage[], title?: string): Promise<ChatSession | undefined>;
  deleteChatSession(sessionId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private chatSessions: Map<string, ChatSession>;

  constructor() {
    this.users = new Map();
    this.chatSessions = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getUserByEmailOrUsername(emailOrUsername: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === emailOrUsername || user.username === emailOrUsername,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getChatSessionsByUser(userId: string): Promise<ChatSession[]> {
    return Array.from(this.chatSessions.values())
      .filter(s => s.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async getChatSession(sessionId: string): Promise<ChatSession | undefined> {
    return this.chatSessions.get(sessionId);
  }

  async createChatSession(session: InsertChatSession): Promise<ChatSession> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const chatSession: ChatSession = {
      id,
      userId: session.userId,
      title: session.title || "New Conversation",
      messages: session.messages || [],
      createdAt: now,
      updatedAt: now,
    };
    this.chatSessions.set(id, chatSession);
    return chatSession;
  }

  async updateChatSession(sessionId: string, messages: ChatMessage[], title?: string): Promise<ChatSession | undefined> {
    const session = this.chatSessions.get(sessionId);
    if (!session) return undefined;
    
    session.messages = messages;
    session.updatedAt = new Date().toISOString();
    if (title) session.title = title;
    
    this.chatSessions.set(sessionId, session);
    return session;
  }

  async deleteChatSession(sessionId: string): Promise<boolean> {
    return this.chatSessions.delete(sessionId);
  }
}

export class MongoDBStorage implements IStorage {
  private collectionName = "users";
  private chatSessionsCollection = "chat_sessions";

  private async getCollection() {
    const db = getDB();
    return db.collection(this.collectionName);
  }

  private async getChatSessionsCollection() {
    const db = getDB();
    return db.collection(this.chatSessionsCollection);
  }

  async getUser(id: string): Promise<User | undefined> {
    const collection = await this.getCollection();
    const user = await collection.findOne({ _id: new ObjectId(id) });
    
    if (!user) return undefined;
    
    return {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      password: user.password,
    };
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const collection = await this.getCollection();
    const user = await collection.findOne({ username });
    
    if (!user) return undefined;
    
    return {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      password: user.password,
    };
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const collection = await this.getCollection();
    const user = await collection.findOne({ email });
    
    if (!user) return undefined;
    
    return {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      password: user.password,
    };
  }

  async getUserByEmailOrUsername(emailOrUsername: string): Promise<User | undefined> {
    const collection = await this.getCollection();
    const user = await collection.findOne({
      $or: [
        { email: emailOrUsername },
        { username: emailOrUsername }
      ]
    });
    
    if (!user) return undefined;
    
    return {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      password: user.password,
    };
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const collection = await this.getCollection();
    const result = await collection.insertOne({
      username: insertUser.username,
      email: insertUser.email,
      password: insertUser.password,
      createdAt: new Date(),
    });
    
    return {
      id: result.insertedId.toString(),
      username: insertUser.username,
      email: insertUser.email,
      password: insertUser.password,
    };
  }

  async getChatSessionsByUser(userId: string): Promise<ChatSession[]> {
    const collection = await this.getChatSessionsCollection();
    const sessions = await collection
      .find({ userId })
      .sort({ updatedAt: -1 })
      .limit(10)
      .toArray();
    
    return sessions.map(s => ({
      id: s._id.toString(),
      userId: s.userId,
      title: s.title,
      messages: s.messages || [],
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));
  }

  async getChatSession(sessionId: string): Promise<ChatSession | undefined> {
    const collection = await this.getChatSessionsCollection();
    try {
      const session = await collection.findOne({ _id: new ObjectId(sessionId) });
      
      if (!session) return undefined;
      
      return {
        id: session._id.toString(),
        userId: session.userId,
        title: session.title,
        messages: session.messages || [],
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      };
    } catch {
      return undefined;
    }
  }

  async createChatSession(session: InsertChatSession): Promise<ChatSession> {
    const collection = await this.getChatSessionsCollection();
    const now = new Date().toISOString();
    
    const result = await collection.insertOne({
      userId: session.userId,
      title: session.title || "New Conversation",
      messages: session.messages || [],
      createdAt: now,
      updatedAt: now,
    });
    
    return {
      id: result.insertedId.toString(),
      userId: session.userId,
      title: session.title || "New Conversation",
      messages: session.messages || [],
      createdAt: now,
      updatedAt: now,
    };
  }

  async updateChatSession(sessionId: string, messages: ChatMessage[], title?: string): Promise<ChatSession | undefined> {
    const collection = await this.getChatSessionsCollection();
    const now = new Date().toISOString();
    
    const updateData: any = {
      messages,
      updatedAt: now,
    };
    
    if (title) {
      updateData.title = title;
    }
    
    try {
      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(sessionId) },
        { $set: updateData },
        { returnDocument: 'after' }
      );
      
      if (!result) return undefined;
      
      return {
        id: result._id.toString(),
        userId: result.userId,
        title: result.title,
        messages: result.messages || [],
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      };
    } catch {
      return undefined;
    }
  }

  async deleteChatSession(sessionId: string): Promise<boolean> {
    const collection = await this.getChatSessionsCollection();
    try {
      const result = await collection.deleteOne({ _id: new ObjectId(sessionId) });
      return result.deletedCount === 1;
    } catch {
      return false;
    }
  }
}

export const storage = new MongoDBStorage();
