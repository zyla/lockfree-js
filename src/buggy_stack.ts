import { Heap, Uint32, Ptr } from "./heap";

const Node = {
  VALUE_OFFSET: 0,
  NEXT_OFFSET: 1,
};

export class BuggyStack {
  static HEAD_OFFSET = 0;

  constructor(private heap: Heap, public readonly ptr: Ptr) {}

  static init(heap: Heap) {
    const ptr = heap.alloc();
    return new this(heap, ptr);
  }

  push(value: Uint32) {
    const newHead = this.heap.alloc();
    this.heap.memory[newHead + Node.VALUE_OFFSET] = value;
    let next;
    do {
      next = Atomics.load(this.heap.memory, this.ptr + BuggyStack.HEAD_OFFSET);
      this.heap.memory[newHead + Node.NEXT_OFFSET] = next;
    } while (
      Atomics.compareExchange(
        this.heap.memory,
        this.ptr + BuggyStack.HEAD_OFFSET,
        next,
        newHead
      ) !== next
    );
  }

  pop(): Uint32 | null {
    let head, next;
    do {
      head = Atomics.load(this.heap.memory, this.ptr + BuggyStack.HEAD_OFFSET);
      if (head === 0) {
        return null;
      }
      next = this.heap.memory[head + Node.NEXT_OFFSET];
    } while (
      Atomics.compareExchange(
        this.heap.memory,
        this.ptr + BuggyStack.HEAD_OFFSET,
        head,
        next
      ) !== head
    );
    const value = this.heap.memory[head + Node.VALUE_OFFSET];
    this.heap.free(head);
    return value;
  }
}
