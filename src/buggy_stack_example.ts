import { BuggyStack } from "./buggy_stack";
import { Heap } from "./heap";
import { threadId, Worker, isMainThread, workerData } from "worker_threads";

if (isMainThread) {
  const memory = new Uint32Array(new SharedArrayBuffer(32 * 20000));
  const heap = new Heap(memory, 8);
  const stack = BuggyStack.init(heap);

  new Worker(__filename, { workerData: { memory, stack: stack.ptr } });
  new Worker(__filename, { workerData: { memory, stack: stack.ptr } });
  new Worker(__filename, { workerData: { memory, stack: stack.ptr } });
  new Worker(__filename, { workerData: { memory, stack: stack.ptr } });

  setTimeout(() => {
    const N = 10000;
    for (let x = 0; x < 10; x++) {
      for (let i = 0; i < N; i++) {
        stack.push(i);
      }
      console.log("pushed " + N + " items");
    }
  }, 1000);
} else {
  const memory: Uint32Array = workerData.memory;
  const heap = new Heap(memory, 8);
  const stack = new BuggyStack(heap, workerData.stack);
  while (true) {
    let n = 0;
    let value;
    const values = [];
    while (n < 100 && (value = stack.pop()) !== null) {
      values.push(value);
      n++;
    }
    if (n > 0) {
      console.log("worker " + threadId + " popped " + n + " items", values);
    }
  }
}
