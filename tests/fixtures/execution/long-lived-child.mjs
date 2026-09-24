// Fixed fixture process for S6 quiescence tests (ML-DEVOS-RFC-019 §18; D-071).
// It does nothing but stay alive until the fixture driver terminates its group.
setInterval(() => {}, 1000);
