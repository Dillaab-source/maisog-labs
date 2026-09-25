// Fixed task-store crash fixture (ML-DEVOS-RFC-019 §13.2 "Proof first", §18
// item 15; D-074 transaction-substrate gate). It takes no command: only a JSON
// spec naming one mode from a closed set and, optionally, one persistence point
// from a closed set. It commits a self-describing counter state repeatedly and
// prints "ACK <version>" after each commit returns. At the chosen point of the
// chosen commit it SIGKILLs ITSELF, so no handler of the store runs.
import { TaskStore } from "../../../devos/execution/store.mjs";

const MODES = new Set(["commit-kill-at", "commit-forever", "increment", "blob-kill-at"]);
const POINTS = new Set(["envelope:written", "envelope:synced", "envelope:renamed", "envelope:committed", "blob:written", "blob:linked"]);

const spec = JSON.parse(process.argv[2]);
if (!MODES.has(spec.mode) || (spec.point !== undefined && !POINTS.has(spec.point))) {
  process.stderr.write("store-worker: mode or point outside the fixed set\n");
  process.exit(2);
}

let armed = false;
const hooks = (name) => {
  if (armed && name === spec.point) process.kill(process.pid, "SIGKILL");
};
const store = new TaskStore(spec.stateDir, { hooks });
const pad = "x".repeat(spec.padBytes ?? 0);

// Every committed state carries its own sequence number and a payload whose
// content is a function of it, so a torn or mixed envelope is detectable.
async function commitNext() {
  return store.transact(spec.taskId, (draft, { version }) => {
    draft.instances.counter = { seq: version + 1, pad: `${version + 1}:${pad}`, writer: spec.writer ?? "w" };
    return version + 1;
  }, { waitMs: 60_000 });
}

if (spec.mode === "commit-kill-at") {
  for (let i = 1; i <= spec.commits; i += 1) {
    armed = i === spec.commits;
    const v = await commitNext();
    process.stdout.write(`ACK ${v}\n`);
  }
} else if (spec.mode === "commit-forever") {
  for (;;) {
    const v = await commitNext();
    process.stdout.write(`ACK ${v}\n`);
  }
} else if (spec.mode === "increment") {
  for (let i = 0; i < spec.commits; i += 1) {
    await store.transact(spec.taskId, (draft) => {
      const c = draft.instances.shared ?? { n: 0, by: {} };
      c.n += 1;
      c.by[spec.writer] = (c.by[spec.writer] ?? 0) + 1;
      draft.instances.shared = c;
    }, { waitMs: 60_000 });
  }
  process.stdout.write("DONE\n");
} else if (spec.mode === "blob-kill-at") {
  armed = true;
  store.putBlob(spec.taskId, Buffer.alloc(spec.blobBytes, 0x62));
  process.stdout.write("ACK blob\n");
}
