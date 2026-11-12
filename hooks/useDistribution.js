import { useEffect, useState } from "react";

const LOADING_DISTRIBUTION = { status: "loading", total: 0, buckets: [] };

export function useDistribution(enabled) {
  const [distribution, setDistribution] = useState(LOADING_DISTRIBUTION);
  useEffect(() => {
    if (!enabled) return undefined;
    let isMounted = true;
    (async () => {
      try {
        const response = await fetch("/api/get-distribution");
        if (!response.ok) throw new Error(`get-distribution returned ${response.status}`);
        const result = await response.json();
        if (isMounted) setDistribution({ status: "ready", total: result.total, buckets: result.buckets });
      } catch (error) {
        console.error("Failed to load the score distribution", error);
        if (isMounted) setDistribution({ status: "error", total: 0, buckets: [] });
      }
    })();
    return () => {
      isMounted = false;
      setDistribution(LOADING_DISTRIBUTION);
    };
  }, [enabled]);
  return distribution;
}
