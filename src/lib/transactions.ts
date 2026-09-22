// NIST CSF PROTECT (Data Security): Database Transaction Wrapper
// Ensures multi-step operations are atomic (all succeed or all rollback)

import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function withTransaction<T>(operation: () => Promise<T>): Promise<T> {
  // In production with PostgreSQL: BEGIN; operation(); COMMIT/ROLLBACK
  // Drizzle ORM handles basic transactions through db.execute(sql`BEGIN`)
  try {
    await db.execute(sql`BEGIN`);
    const result = await operation();
    await db.execute(sql`COMMIT`);
    return result;
  } catch (error) {
    await db.execute(sql`ROLLBACK`);
    throw error;
  }
}

export function requireDBTransaction(): string {
  return "NIST PROTECT: Multi-step database operations must use withTransaction wrapper";
}
