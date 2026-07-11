import { useEffect, useState } from "react";
import { fetchPublishedResources } from "../../resources/service";
import type { EmotionalResource } from "../../resources/types";

export function usePatientResources() {
  const [resources, setResources] = useState<EmotionalResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchPublishedResources();
        if (!cancelled) setResources(data);
      } catch (e) {
        if (!cancelled) {
          setResources([]);
          setError(
            e instanceof Error ? e.message : "No se pudieron cargar recursos",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { resources, loading, error };
}
