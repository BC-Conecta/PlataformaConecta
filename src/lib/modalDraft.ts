import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

type DraftState<T> = {
  open: boolean;
  editId: string | null;
  value: T;
};

function readDraft<T>(key: string, initial: T): DraftState<T> {
  try {
    const saved = sessionStorage.getItem(key);
    return saved ? (JSON.parse(saved) as DraftState<T>) : { open: false, editId: null, value: initial };
  } catch {
    return { open: false, editId: null, value: initial };
  }
}

export function useModalDraft<T>(key: string, initial: T): [DraftState<T>, Dispatch<SetStateAction<DraftState<T>>>, () => void] {
  const [draft, setDraft] = useState(() => readDraft(key, initial));

  useEffect(() => {
    if (draft.open) sessionStorage.setItem(key, JSON.stringify(draft));
    else sessionStorage.removeItem(key);
  }, [key, draft]);

  function clear() {
    setDraft({ open: false, editId: null, value: initial });
  }

  return [draft, setDraft, clear];
}
