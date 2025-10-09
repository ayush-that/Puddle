import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL || "";

// Create postgres client
const client = postgres(DATABASE_URL);

// Create drizzle instance
export const db = drizzle(client);
