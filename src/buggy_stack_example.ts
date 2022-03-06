import { BuggyStack } from "./buggy_stack";
import { Heap } from "./heap";
import {
  threadId,
  Worker,
  isMainThread,
  workerData,
  parentPort,
} from "worker_threads";

if (isMainThread) {
  const memory = new Uint32Array(new SharedArrayBuffer(32 * 20000));
  const heap = new Heap(memory, 8);
  const stack = BuggyStack.init(heap);

  const NUM_WORKERS = 4;

  let totalPopped = 0;
  let numWorkersFinished = 0;

  for (let i = 0; i < NUM_WORKERS; i++) {
    const w = new Worker(__filename, {
      workerData: { memory, stack: stack.ptr },
    });
    w.on("message", (count) => {
      totalPopped += count;
      numWorkersFinished++;

      if (numWorkersFinished === NUM_WORKERS) {
        console.log("Total popped: " + totalPopped);
      }
    });
  }

  (async () => {
    const N = 1000;
    let totalPushed = 0;
    for (let x = 0; x < 1000; x++) {
      for (let i = 0; i < N; i++) {
        stack.push(i);
        totalPushed++;
      }
      await Promise.resolve();
    }
    console.log("Total pushed: " + totalPushed);
    Atomics.store(memory, 0, 1);
  })();
} else {
  const memory: Uint32Array = workerData.memory;
  const heap = new Heap(memory, 8);
  const stack = new BuggyStack(heap, workerData.stack);
  let n = 0;
  while (!Atomics.load(memory, 0)) {
    while (stack.pop() !== null) {
      n++;
    }
  }

  // drain the stack one last time
  while (stack.pop() !== null) {
    n++;
  }

  console.log("worker " + threadId + " popped " + n + " items");
  parentPort!.postMessage(n);
}
