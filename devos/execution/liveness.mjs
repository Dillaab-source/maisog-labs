// S6 read-only process-group liveness proof (ML-DEVOS-RFC-019 §13.1 step 6).
//
// S6 core never starts, signals or terminates actor/tool processes: the
// execution driver terminates what it started. S6 only PROVES that every
// reported group is empty:
//   "proc"    -- Linux /proc scan; zombies/dead entries are not survivors, so an
//                unreaped zombie under a non-reaping PID 1 is not misreported;
//   "signal0" -- process.kill(-pgid, 0): an existence probe that delivers no
//                signal. ESRCH proves absence; anything else cannot.
// Anything that cannot prove absence reports the group as alive (fail closed).
import fs from "node:fs";

function liveMembersProc(pgid) {
  const live = [];
  for (const name of fs.readdirSync("/proc")) {
    if (!/^\d+$/.test(name)) continue;
    let stat;
    try {
      stat = fs.readFileSync(`/proc/${name}/stat`, "utf8");
    } catch {
      continue;
    }
    const fields = stat.slice(stat.lastIndexOf(")") + 2).split(" ");
    if (Number(fields[2]) === pgid && fields[0] !== "Z" && fields[0] !== "X") live.push(Number(name));
  }
  return live;
}

function aliveBySignal0(pgid) {
  try {
    process.kill(-pgid, 0);
    return true;
  } catch (err) {
    return err.code !== "ESRCH";
  }
}

export function createLivenessInspector(proof) {
  return Object.freeze({
    groupAlive(pgid) {
      if (!Number.isInteger(pgid) || pgid <= 1) return true; // cannot prove anything about an invalid id
      if (proof === "proc") return liveMembersProc(pgid).length > 0;
      if (proof === "signal0") return aliveBySignal0(pgid);
      return true;
    },
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Waits up to `deadlineMs` for every group to be proven empty. Read-only.
export async function proveGroupsEmpty(pgids, { inspector, deadlineMs = 2000 } = {}) {
  const start = Date.now();
  for (;;) {
    const survivors = pgids.filter((g) => inspector.groupAlive(g));
    if (survivors.length === 0) return { proven: true, survivors };
    if (Date.now() - start >= deadlineMs) return { proven: false, survivors };
    await sleep(50);
  }
}
