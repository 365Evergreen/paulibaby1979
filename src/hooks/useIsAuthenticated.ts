import { useState, useEffect } from "react";

export function useIsAuthenticated(): boolean {
  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    fetch("/api/admin/auth-check")
      .then((res) => setAuthed(res.ok))
      .catch(() => setAuthed(false));
  }, []);
  return authed;
}
