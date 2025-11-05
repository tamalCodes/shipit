import { Collection, Db, MongoClient } from "mongodb";
import type { Document } from "mongodb";

const dbName = process.env.MONGODB_DB ?? "shipit";

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "Missing MONGODB_URI environment variable. Set it in your .env file."
    );
  }

  return uri;
}

function createClient(): MongoClient {
  return new MongoClient(getMongoUri());
}

function getClientPromise(): Promise<MongoClient> {
  const globalForMongo = globalThis as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (process.env.NODE_ENV === "development") {
    if (!globalForMongo._mongoClientPromise) {
      globalForMongo._mongoClientPromise = createClient().connect();
    }
    return globalForMongo._mongoClientPromise;
  }

  return createClient().connect();
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  return client.db(dbName);
}

export async function getUsersCollection<TSchema extends Document = Document>(): Promise<
  Collection<TSchema>
> {
  const db = await getDb();
  return db.collection<TSchema>("users");
}

export async function getPasswordResetTokensCollection<
  TSchema extends Document = Document
>(): Promise<Collection<TSchema>> {
  const db = await getDb();
  return db.collection<TSchema>("password_reset_tokens");
}

export async function getTasksCollection<TSchema extends Document = Document>(): Promise<
  Collection<TSchema>
> {
  const db = await getDb();
  return db.collection<TSchema>("tasks");
}
