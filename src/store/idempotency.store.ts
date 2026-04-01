interface IdempotencyRecord {
  response?: {
    statusCode: number;
    body: any;
    headers: Record<string, string | number | string[] | undefined>;
  };
  createdAt: Date;
  completedAt?: Date;
  requestHash: string;
}

class InMemoryIdempotencyStore {
  private records: Map<string, IdempotencyRecord> = new Map();
  private ttlMs: number;
  private cleanupInterval: NodeJS.Timeout;

  /**
   * Creates an in-memory idempotency store with TTL-based expiration.
   */
  constructor(ttlMs: number = 24 * 60 * 60 * 1000) {
    this.ttlMs = ttlMs;
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 60 * 1000);
    this.cleanupInterval.unref()
    
  }

  /**
   * Returns a record by key and  removes it if expired.
   */
  get(key: string): IdempotencyRecord | undefined {
    const record = this.records.get(key);
    if (!record) return undefined;
    if (Date.now() - record.createdAt.getTime() > this.ttlMs)
      return (this.records.delete(key), undefined);
    return record;
  }

  /**
   * Stores a record for the provided idempotency key.
   */
  set(key: string, record: IdempotencyRecord): void {
    this.records.set(key, record);
  }

  /**
   * Clears all records from the store.
   */
  clear(): void {
    this.records.clear();
  }

  /**
   * Removes records that have exceeded the configured TTL.
   */
  private cleanup(): void {
    const cutoff = Date.now() - this.ttlMs;

    for (const [key, record] of this.records.entries()) {
      if (record.createdAt.getTime() < cutoff) {
        this.records.delete(key);
      }
    }
  }

  /**
   * Stops the periodic cleanup timer.
   */
  stop(): void {
    clearInterval(this.cleanupInterval);
  }
}

export const idempotencyStore = new InMemoryIdempotencyStore();
