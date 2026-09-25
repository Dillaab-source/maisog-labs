// S6 test-only construction (ML-DEVOS-RFC-019 §13.5, §18 item 14; D-074).
//
// NOT part of the production surface: index.mjs never exports this module, and
// the production createExecutionHost() refuses fault or store hooks. Tests use
// it to inject faults at named points and to inspect committed state. The
// `inspect` view returns copies; `inspect.store` and `inspect.corrupt()` exist
// only so tests can deliberately damage committed state (§18 items 9, 12).
import { buildExecutionHost } from "./host.mjs";
import { replayJournal } from "./journal.mjs";

export function createTestExecutionHost(config, { faults = null, storeHooks = null } = {}) {
  const { host, store, snapshot, locate } = buildExecutionHost(config, { faults, storeHooks });
  const copy = (v) => (v === undefined || v === null ? null : structuredClone(v));
  const inspect = Object.freeze({
    store,
    snapshot: (taskId) => copy(snapshot(taskId)),
    version: (taskId) => store.read(taskId).version,
    findInstance(instanceId) {
      try {
        return copy(locate(instanceId).record);
      } catch {
        return null;
      }
    },
    listInstances: (taskId) => Object.values(snapshot(taskId).instances).map(copy),
    getPermitStatus: (taskId, permitId) => copy(snapshot(taskId).permits[permitId]),
    listPermits: (taskId) => Object.entries(snapshot(taskId).permits).map(([permitId, p]) => ({ permit_id: permitId, status: copy(p) })),
    getRtrStatus: (taskId, transferId) => copy(snapshot(taskId).rtr[transferId]),
    listRtr: (taskId) => Object.entries(snapshot(taskId).rtr).map(([transferId, r]) => ({ transfer_id: transferId, status: copy(r) })),
    readRtrBody(taskId, transferId) {
      const r = snapshot(taskId).rtr[transferId];
      if (!r) return null;
      try {
        return store.readBlob(taskId, r.rtr_digest).toString("utf8");
      } catch {
        return null;
      }
    },
    journal(instanceId) {
      const { taskId, record } = locate(instanceId);
      return replayJournal(snapshot(taskId).journal[instanceId] ?? [], record.identity_digest).entries.map((e) => copy(e.entry));
    },
    slot: (taskId) => copy(snapshot(taskId).slot),
    // Deliberate corruption of committed state (a raw transaction that
    // bypasses every host rule). Tests only.
    corrupt: (taskId, fn) => store.transact(taskId, fn),
  });
  return Object.freeze({ ...host, inspect });
}
