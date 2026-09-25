"use client";

// Keyboard selection for a row of selector buttons (plan §17): Arrow keys
// move and select, Home/End jump. Tab still enters/leaves the group once
// (roving tabindex is applied by the caller via `tabIndex`).
import { useCallback, useRef } from "react";

export default function useListKeys(count, selected, select) {
  const refs = useRef([]);
  const onKeyDown = useCallback(event => {
    const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    let next = null;
    if (Object.hasOwn(keys, event.key)) next = (selected + keys[event.key] + count) % count;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = count - 1;
    if (next === null) return;
    event.preventDefault();
    select(next);
    refs.current[next]?.focus();
  }, [count, selected, select]);
  const register = index => element => { refs.current[index] = element; };
  return { onKeyDown, register };
}
