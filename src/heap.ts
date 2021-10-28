export type Uint32 = number; // lol no integers

export type Ptr = number;

export const OBJECT_SIZE_IN_WORDS = 8;
export const OBJECT_TAKEN_OFFSET = OBJECT_SIZE_IN_WORDS - 1;

export class Heap {
  constructor(public readonly memory: Uint32Array, private startOffset: Ptr) {}

  alloc(): Ptr {
    for (
      let p = this.startOffset;
      p + OBJECT_SIZE_IN_WORDS <= this.memory.length;
      p += OBJECT_SIZE_IN_WORDS
    ) {
      if (
        Atomics.compareExchange(this.memory, p + OBJECT_TAKEN_OFFSET, 0, 1) ===
        0
      ) {
        return p;
      }
    }
    // FIXME: This is not linearizable, the memory may not ever actually be full
    throw new Error("Out of memory");
  }

  free(p: Ptr) {
    Atomics.store(this.memory, p + OBJECT_TAKEN_OFFSET, 0);
  }
}
