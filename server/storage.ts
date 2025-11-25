import { type User, type InsertUser } from "@shared/schema";
import { randomUUID } from "crypto";
import { getDB } from "./db/mongodb";
import { ObjectId } from "mongodb";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;

  constructor() {
    this.users = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
}

export class MongoDBStorage implements IStorage {
  private collectionName = "users";

  private async getCollection() {
    const db = getDB();
    return db.collection(this.collectionName);
  }

  async getUser(id: string): Promise<User | undefined> {
    const collection = await this.getCollection();
    const user = await collection.findOne({ _id: new ObjectId(id) });
    
    if (!user) return undefined;
    
    return {
      id: user._id.toString(),
      username: user.username,
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
      password: user.password,
    };
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const collection = await this.getCollection();
    const result = await collection.insertOne({
      username: insertUser.username,
      password: insertUser.password,
      createdAt: new Date(),
    });
    
    return {
      id: result.insertedId.toString(),
      username: insertUser.username,
      password: insertUser.password,
    };
  }
}

export const storage = new MongoDBStorage();
