export type Ptr = number;

export const OBJECT_SIZE_IN_WORDS = 8;
export const OBJECT_TAKEN_OFFSET = OBJECT_SIZE_IN_WORDS - 1;

export class Heap {
  public readonly memory: Uint32Array;

  constructor(mem: SharedArrayBuffer) {
    this.memory = new Uint32Array(mem);
  }

  alloc(): Ptr {
    for(let p = OBJECT_SIZE_IN_WORDS; p + OBJECT_SIZE_IN_WORDS <= this.memory.length; p += OBJECT_SIZE_IN_WORDS) {
      if(Atomics.compareExchange(this.memory, p + OBJECT_TAKEN_OFFSET, 0, 1) === 0){
        return p;
      }
    }
    // FIXME: This is not linearizable, the memory may not ever actually be full
    throw new Error('Out of memory');
  }

  free(p: Ptr) {
    Atomics.store(this.memory, p + OBJECT_TAKEN_OFFSET, 0);
  }
}
