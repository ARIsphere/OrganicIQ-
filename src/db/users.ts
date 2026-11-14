import { db } from './index.ts';
import { users } from './schema.ts';

export async function getOrCreateUser(uid: string, email: string) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email: email || `${uid}@users.organiciq.local`,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: email || `${uid}@users.organiciq.local`,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database error in getOrCreateUser:', error);
    throw new Error('Unable to synchronize user account.', { cause: error });
  }
}
