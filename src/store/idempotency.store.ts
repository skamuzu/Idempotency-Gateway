interface IdempotencyRecord {
  response?: {
    statusCode: number;
    body: any;
    headers: Record<string, string | number | string[] | undefined>;
  };
  requestHash: string;
}

class InMemoryIdempotencyStore {
  private records: Map<string, IdempotencyRecord> = new Map();

  get(key: string): IdempotencyRecord | undefined {
    return this.records.get(key);
  }

  set(key: string, record: IdempotencyRecord): void {
    this.records.set(key, record);
  }

  clear(): void {
    this.records.clear();
  }
}

export const idempotencyStore = new InMemoryIdempotencyStore();
