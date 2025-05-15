import { useEffect, useState } from "react";
import type { Caption } from "../components/CaptionFeed";
import { createSupabaseClient } from "../utils/supabase-browser";

export function useRealtimeCaptions(
  sessionId: string, 
  onNewCaption?: () => void
) {
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    setIsLoading(true);
    setError(null);

    // Create a Supabase client
    const supabase = createSupabaseClient();

    // Fetch initial captions history
    async function fetchInitialCaptions() {
      try {
        const response = await fetch(`/api/history?session=${sessionId}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch history: ${response.statusText}`);
        }

        const data = await response.json();
        // API already returns newest first, so we reverse to get oldest first
        // This way new captions will be added at the end (bottom)
        const reversedCaptions = [...data.captions].reverse();
        setCaptions(reversedCaptions);
      } catch (err) {
        console.error("Error fetching captions:", err);
        setError(
          `Failed to load captions: ${err instanceof Error ? err.message : String(err)}`,
        );
      } finally {
        setIsLoading(false);
      }
    }

    // Subscribe to realtime updates for new captions
    const subscription = supabase
      .channel(`session:${sessionId}`)
      .on("broadcast", { event: "caption" }, (payload) => {
        // Track timing for step 10: Receiving caption via Realtime
        const requestId = payload.payload.requestId;
        if (requestId) {
          console.timeEnd(
            `[${requestId}] Step 10: Receive caption via Realtime`,
          );

          // Calculate and log total end-to-end time
          const totalTime =
            Date.now() - Number(sessionStorage.getItem(`start_${requestId}`));
          console.log(`[${requestId}] === FULL PIPELINE COMPLETE ===`);
          console.log(`[${requestId}] Total end-to-end time: ${totalTime}ms`);

          // Create a summary of all timing data
          console.log(`[${requestId}] === TIMING SUMMARY ===`);
        }

        // Add the new caption to the state
        setCaptions((current) => {
          // Check if we already have this caption (avoid duplicates)
          if (current.some((c) => c.id === payload.payload.id)) {
            return current;
          }
          
          // Create the new state first
          const newState = [...current, payload.payload];
          
          // Call the onNewCaption callback separately, after state update
          // This prevents the callback from running during render
          if (onNewCaption) {
            setTimeout(onNewCaption, 0);
          }
          
          return newState;
        });
      })
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") {
          console.error("Failed to subscribe to realtime updates:", status);
          setError(`Failed to connect to realtime updates: ${status}`);
        }
      });

    // Fetch initial data
    void fetchInitialCaptions();

    // Cleanup subscription when component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, [sessionId]);

  return { captions, isLoading, error };
}
