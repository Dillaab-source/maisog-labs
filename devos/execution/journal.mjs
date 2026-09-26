// S6 hash-chained journal (ML-DEVOS-RFC-019 §7.1.2, §17 -- AS88-F001).
//
//   head_0 = SHA-256("s6-journal-v1\n" + identity_digest)
//   head_n = SHA-256(head_{n-1} + SHA-256(e_n))      (hex strings concatenated)
//
// Entries are appended, never rewritten; each records prev_head. The entries
// live in the per-task S6 task store and commit in the same local transaction
// as the state they justify (§13.2 rule 3; state.mjs). Tamper-evident, not
// tamper-proof (Residual risks 5).
import { sha256 } from "./digest.mjs";
import { HEX64, fail } from "./vocabulary.mjs";

export function genesisHead(identityDigest) {
  if (!HEX64.test(identityDigest ?? "")) fail("MALFORMED_REQUEST", "identity digest required for the journal genesis");
  return sha256(`s6-journal-v1\n${identityDigest}`);
}

export function nextHead(prevHead, entryBytes) {
  return sha256(prevHead + sha256(entryBytes));
}

// Replays from genesis; throws ISOLATION_UNPROVABLE on any break.
export function replayJournal(lines, identityDigest) {
  let head = genesisHead(identityDigest);
  const entries = [];
  lines.forEach((bytes, i) => {
    let entry;
    try {
      entry = JSON.parse(bytes);
    } catch {
      fail("ISOLATION_UNPROVABLE", `journal entry ${i} is not JSON`);
    }
    if (entry.seq !== i) fail("ISOLATION_UNPROVABLE", `journal entry ${i} is out of sequence`);
    if (entry.prev_head !== head) fail("ISOLATION_UNPROVABLE", `journal hash chain breaks at entry ${i}`);
    head = nextHead(head, bytes);
    entries.push({ bytes, entry, head });
  });
  return { head, entries };
}
