class RequestCoalescerStore {
  private inFlight = new Map<
    string,
    {
      promise: Promise<void>;
      resolve: () => void;
    }
  >();

  /**
   * Marks a key as in-flight and creates a waitable promise.
   */
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

  /**
   * Returns the in-flight promise for a key, if any.
   */
  wait(key: string): Promise<void> | null {
    return this.inFlight.get(key)?.promise ?? null;
  }

  /**
   * Resolves and removes the in-flight entry for a key.
   */
  complete(key: string): void {
    const active = this.inFlight.get(key);

    if (!active) {
      return;
    }

    active.resolve();
    this.inFlight.delete(key);
  }

  /**
   * Clears all in-flight entries.
   */
  clear(): void {
    this.inFlight.clear();
  }
}

export const requestCoalescerStore = new RequestCoalescerStore();
