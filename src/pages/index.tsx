import Head from "next/head";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Camera } from "../components/Camera";
import { CameraControls } from "../components/CameraControls";
import { type Caption, CaptionFeed } from "../components/CaptionFeed";
import { useRealtimeCaptions } from "../hooks/useRealtimeCaptions";

export default function Home() {
  // Camera settings
  const [fps, setFps] = useState(1);
  const [quality, setQuality] = useState(0.75);
  const [isActive, setIsActive] = useState(false);

  // Session management
  const [sessionId, setSessionId] = useState<string>("");
  const [isInitializing, setIsInitializing] = useState(true);

  // Uploading state
  const [isUploading, setIsUploading] = useState(false);

  // Use the realtime captions hook to get live updates
  const { captions, isLoading, error } = useRealtimeCaptions(sessionId);

  // Initialize session on first load
  useEffect(() => {
    // Create or restore session ID
    try {
      setIsInitializing(true);
      const storedSessionId = localStorage.getItem("vision-session-id");
      if (storedSessionId) {
        setSessionId(storedSessionId);
      } else {
        const newSessionId = uuidv4();
        localStorage.setItem("vision-session-id", newSessionId);
        setSessionId(newSessionId);
      }
    } catch (err) {
      console.error("Error initializing session:", err);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  // Handle frame capture
  const handleCapture = async (blob: Blob) => {
    if (!sessionId || isUploading) return;

    try {
      setIsUploading(true);

      // Generate a unique request ID to track this specific image processing
      const requestId = Math.random().toString(36).substring(2, 10);
      const startTime = Date.now();

      console.log(`[${requestId}] === PIPELINE STARTED ===`);

      // Step 3: Get a signed upload URL
      console.time(`[${requestId}] Step 3: Get signed upload URL`);
      const uploadRes = await fetch("/api/signed-upload");
      console.timeEnd(`[${requestId}] Step 3: Get signed upload URL`);

      if (!uploadRes.ok) throw new Error("Failed to get upload URL");

      const { uploadUrl, getUrl, path } = await uploadRes.json();

      // Step 4: Upload image to storage
      console.time(`[${requestId}] Step 4: Upload image to Supabase`);
      const uploadResult = await fetch(uploadUrl, {
        method: "PUT",
        body: blob,
        headers: {
          "Content-Type": "image/jpeg",
        },
      });
      console.timeEnd(`[${requestId}] Step 4: Upload image to Supabase`);

      if (!uploadResult.ok) throw new Error("Failed to upload image");

      // Step 5: Send for captioning
      const timestamp = new Date().toISOString();
      console.time(`[${requestId}] Step 5-9: Caption API (server processing)`);
      const captionRes = await fetch("/api/caption", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path,
          timestamp,
          session: sessionId,
          requestId, // Pass the request ID to correlate server logs
        }),
      });
      console.timeEnd(
        `[${requestId}] Step 5-9: Caption API (server processing)`,
      );

      if (!captionRes.ok) throw new Error("Failed to generate caption");

      // Start timing for Step 10: receiving via Realtime
      console.time(`[${requestId}] Step 10: Receive caption via Realtime`);
      console.log(`[${requestId}] Waiting for caption via Realtime...`);

      // Store the start time in sessionStorage for end-to-end calculation
      sessionStorage.setItem(`start_${requestId}`, startTime.toString());
    } catch (error) {
      console.error("Error processing capture:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Vision Assistant</title>
        <meta name="description" content="Real-time vision assistant" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {isInitializing ? (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <svg
              className="mx-auto h-10 w-10 animate-spin text-indigo-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              role="img"
              aria-labelledby="loadingSpinnerTitle"
            >
              <title id="loadingSpinnerTitle">Loading Spinner</title>
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <h2 className="mt-4 font-semibold text-gray-900 text-lg">
              Initializing Vision Assistant
            </h2>
            <p className="mt-2 text-gray-500 text-sm">
              Please wait while we set up your session...
            </p>
          </div>
        </div>
      ) : (
        <main className="flex min-h-screen flex-col bg-gray-50">
          <header className="bg-white py-2 shadow-sm">
            <div className="container mx-auto px-2">
              <div className="flex items-center justify-between">
                <h1 className="font-bold text-gray-900 text-lg">
                  Vision Assistant
                </h1>
                <p className="text-gray-500 text-xs">
                  Session: {sessionId.slice(0, 8)}
                </p>
              </div>
            </div>
          </header>

          <div className="container mx-auto flex flex-1 flex-col px-2 py-2">
            {/* Top section with camera and controls side by side - works on mobile and desktop */}
            <div className="mb-2 flex flex-row gap-2">
              {/* Camera section - smaller width (50% on mobile) */}
              <div className="w-1/2">
                <div className="rounded-lg bg-white p-2 shadow-sm">
                  <h2 className="mb-1 font-semibold text-sm">Camera</h2>
                  <Camera
                    onCapture={handleCapture}
                    fps={fps}
                    quality={quality}
                    isActive={isActive}
                  />
                </div>
              </div>

              {/* Controls section - side by side with camera (50% on mobile) */}
              <div className="w-1/2">
                <div className="h-full rounded-lg bg-white p-2 shadow-sm">
                  <h2 className="mb-1 font-semibold text-sm">Controls</h2>
                  <CameraControls
                    fps={fps}
                    setFps={setFps}
                    quality={quality}
                    setQuality={setQuality}
                    isActive={isActive}
                    setIsActive={setIsActive}
                  />
                </div>
              </div>
            </div>

            {/* Status indicator */}
            {isUploading && (
              <div className="mb-2">
                <div className="flex items-center rounded-lg bg-white p-2 shadow-sm">
                  <svg
                    className="mr-2 h-5 w-5 animate-spin text-blue-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    role="img"
                    aria-labelledby="processingSpinnerTitle"
                  >
                    <title id="processingSpinnerTitle">Processing Image</title>
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span className="text-blue-600 text-sm">
                    Processing image...
                  </span>
                </div>
              </div>
            )}

            {/* Captions section - full width */}
            <div className="flex-1">
              <div className="h-full rounded-lg bg-white p-2 shadow-sm">
                <h2 className="mb-1 font-semibold text-sm">Live Captions</h2>

                {isLoading ? (
                  <div className="flex h-20 items-center justify-center">
                    <p className="text-gray-500 text-sm">Loading captions...</p>
                  </div>
                ) : error ? (
                  <div className="rounded bg-red-50 p-2 text-red-600 text-sm">
                    <p>{error}</p>
                  </div>
                ) : (
                  <CaptionFeed captions={captions} limit={20} />
                )}
              </div>
            </div>
          </div>
        </main>
      )}
    </>
  );
}
