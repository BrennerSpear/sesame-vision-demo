import { useCallback, useEffect, useRef, useState } from "react";

interface CameraProps {
  onCapture: (blob: Blob) => void;
  quality: number;
  isActive: boolean;
}

export const Camera = ({ onCapture, quality, isActive }: CameraProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Initialize camera
  useEffect(() => {
    const initCamera = async () => {
      try {
        // Check if mediaDevices is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Camera API is not supported in your browser");
        }

        console.log("Requesting camera permissions...");

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment", // Use back camera on mobile
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        console.log("Camera permissions granted");

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraError(null);
      } catch (err) {
        console.error("Error accessing camera:", err);

        // Provide more descriptive error messages
        if (err instanceof Error) {
          if (
            err.name === "NotAllowedError" ||
            err.name === "PermissionDeniedError"
          ) {
            setCameraError(
              "Camera access denied. Please allow camera permissions in your browser settings.",
            );
          } else if (err.name === "NotFoundError") {
            setCameraError(
              "No camera found. Please make sure your device has a camera.",
            );
          } else if (err.name === "NotReadableError") {
            setCameraError("Camera is already in use by another application.");
          } else if (err.name === "OverconstrainedError") {
            setCameraError(
              "The requested camera settings are not supported by your device.",
            );
          } else if (err.name === "SecurityError") {
            setCameraError(
              "Camera access blocked due to security restrictions. This page must be served over HTTPS.",
            );
          } else {
            setCameraError(`Error accessing camera: ${err.message}`);
          }
        } else {
          setCameraError(`Error accessing camera: ${String(err)}`);
        }
      }
    };

    initCamera();

    return () => {
      // Clean up video stream when component unmounts
      const stream = videoRef.current?.srcObject as MediaStream | null;
      if (stream) {
        for (const track of stream.getTracks()) {
          track.stop();
        }
      }
    };
  }, []);

  // Function to capture a single frame - using useCallback to properly handle dependencies
  const captureFrame = useCallback(() => {
    if (isCapturing) return; // Don't start a new capture if already capturing

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas && video.readyState >= 2) {
      setIsCapturing(true);

      try {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          // Set canvas dimensions to match video
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          // Draw video frame on canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Convert canvas to blob and send to parent
          canvas.toBlob(
            (blob) => {
              if (blob) {
                onCapture(blob);
              }
              setIsCapturing(false);
            },
            "image/jpeg",
            quality,
          );
        } else {
          setIsCapturing(false);
        }
      } catch (err) {
        console.error("Error capturing frame:", err);
        setIsCapturing(false);
      }
    }
  }, [isCapturing, onCapture, quality]); // Include all dependencies used inside the callback

  // Capture a frame when active and not already capturing
  useEffect(() => {
    // Only capture if active and not already capturing
    if (isActive && !isCapturing) {
      captureFrame();
    }
  }, [isActive, isCapturing, captureFrame]);

  return (
    <div className="relative w-full">
      {cameraError ? (
        <div className="flex h-64 flex-col items-center justify-center rounded bg-red-100 p-6 text-red-800">
          <div className="mb-4 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mx-auto h-12 w-12 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-labelledby="cameraErrorTitle"
              role="img"
            >
              <title id="cameraErrorTitle">Camera Error Icon</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h3 className="mt-2 font-semibold text-lg">Camera Error</h3>
          </div>
          <p className="text-center">{cameraError}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-auto w-full rounded"
          />
          {isActive && (
            <div className="absolute top-2 right-2">
              <div className="flex items-center rounded-full bg-black bg-opacity-50 px-3 py-1 text-white text-xs">
                <span className="mr-1.5 h-2 w-2 animate-pulse rounded-full bg-red-500" />
                <span>Live</span>
              </div>
            </div>
          )}
        </>
      )}
      {/* Hide canvas but keep it in the DOM for capturing frames */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
