// ML-DEVOS-RFC-016 section E / D-050 -- the explicit S4 Task Policy input.
//
// This value is never derived from coordination/STATE.md's MAX_REMEDIATION_CYCLES
// or any other bootstrap turn-lock field (that dependency was the AS65-F003
// defect this design corrects). It is instead a small, versioned, explicitly
// Paulo-decided record -- these exact values were locked by D-050
// (brain/DECISION_LOG.md) at S4 implementation-authorization time, not
// invented by the Builder and not inherited from an unrelated cycle's cap.
//
// Do not import coordination/STATE.md, fs.readFile it, or otherwise let this
// module's values vary with that file's contents -- see
// tests/state-kernel.test.mjs's structural-independence test, which asserts
// no file under devos/state/ references coordination/STATE.md or
// MAX_REMEDIATION_CYCLES.

export const TASK_POLICY = Object.freeze({
  scope: "per-project",
  project: "Dillaab-source/maisog-labs",
  retryCeilings: Object.freeze({
    build: 2,
    qa: 2,
    review: 2,
  }),
  // D-050: force_clear_lock is not an ordinary kernel mutation. Paulo is the
  // only default-authorized V1 operator; any other operator requires a
  // separate, explicit Paulo delegation Decision -- this list is never
  // extended by kernel code itself.
  forceClearAuthorizedOperators: Object.freeze(["Paulo"]),
});
