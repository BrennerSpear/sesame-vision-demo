import Image from "next/image";
import { useEffect, useRef } from "react";

export interface Caption {
  id: string;
  caption: string;
  imageUrl: string;
  timestamp: string;
}

interface CaptionFeedProps {
  captions: Caption[];
  limit?: number;
}

export const CaptionFeed = ({ captions, limit = 10 }: CaptionFeedProps) => {
  const feedEndRef = useRef<HTMLDivElement>(null);

  // Show only the most recent captions based on limit
  const displayCaptions = captions.slice(-limit);

  // Auto-scroll to the bottom when component mounts
  useEffect(() => {
    if (feedEndRef.current) {
      feedEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []); // Execute only on component mount

  // Separate effect for scrolling when captions change
  useEffect(() => {
    if (displayCaptions.length > 0 && feedEndRef.current) {
      feedEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [displayCaptions.length]);

  return (
    <div className="max-h-[60vh] overflow-y-auto rounded-lg border">
      {displayCaptions.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          No captions yet. Start the camera to begin capturing.
        </div>
      ) : (
        <ul className="divide-y">
          {displayCaptions.map((item) => (
            <li key={item.id} className="p-4">
              <div className="flex space-x-4">
                <div className="relative h-24 w-24 flex-shrink-0">
                  <Image
                    src={item.imageUrl}
                    alt="Captured frame"
                    fill
                    className="rounded object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 text-sm">{item.caption}</p>
                  <p className="mt-1 text-gray-500 text-xs">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </li>
          ))}
          <div ref={feedEndRef} />
        </ul>
      )}
    </div>
  );
};
