class RequestCoalescerStore {
  private inFlight = new Map<
    string,
    {
      promise: Promise<void>;
      resolve: () => void;
    }
  >();

  begin(key: string): void {
    if (this.inFlight.has(key)) {
      return;
    }

    let resolve!: () => void;
    const promise = new Promise<void>((res) => {
      resolve = res;
    });

    this.inFlight.set(key, { promise, resolve });
  }

  wait(key: string): Promise<void> | null {
    return this.inFlight.get(key)?.promise ?? null;
  }

  complete(key: string): void {
    const active = this.inFlight.get(key);

    if (!active) {
      return;
    }

    active.resolve();
    this.inFlight.delete(key);
  }

  clear(): void {
    this.inFlight.clear();
  }
}

export const requestCoalescerStore = new RequestCoalescerStore();
