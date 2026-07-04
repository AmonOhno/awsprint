import { useCallback, useEffect, useState } from "react";

type State<T> = { data?: T; loading: boolean; error?: string };

// 依存が変わるたびに非同期関数を再実行する軽量フック（サーバーが無いため Query は不使用）。
export function useAsync<T>(
  fn: () => Promise<T>,
  deps: unknown[] = []
): State<T> & { reload: () => void } {
  const [state, setState] = useState<State<T>>({ loading: true });
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let alive = true;
    setState({ loading: true });
    fn()
      .then((data) => alive && setState({ data, loading: false }))
      .catch(
        (e) =>
          alive &&
          setState({ loading: false, error: e?.message ?? String(e) })
      );
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  return { ...state, reload };
}
