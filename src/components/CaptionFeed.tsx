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
                  {/* Process all captions with consistent formatting */}
                  {(() => {
                    // Extract any sentence with "most interesting" or "most important" for all caption types
                    const extractInterestingSentence = (text: string) => {
                      const sentences = text.trim().split(/(?<=[.!?])\s+/);
                      const interestingSentence = sentences.find(
                        (sentence) =>
                          sentence.toLowerCase().includes("most interesting") ||
                          sentence.toLowerCase().includes("most important"),
                      );

                      // Return filtered sentences and the interesting one if found
                      return {
                        filteredText: interestingSentence
                          ? sentences
                              .filter((s) => s !== interestingSentence)
                              .join(" ")
                          : text,
                        interestingSentence,
                      };
                    };

                    // If caption is already formatted with "Thoughts:"
                    if (item.caption.includes("Thoughts:")) {
                      const parts = item.caption.split("\n\n");
                      // Ensure parts[0] exists and handle the replace safely
                      let thoughts = "";
                      if (parts.length > 0 && parts[0]) {
                        thoughts = parts[0].replace("Thoughts: ", "");
                      }

                      // Make sure observations exists and handle the replace safely
                      let observations = "";
                      if (parts.length > 1 && parts[1]) {
                        observations = parts[1].replace("Observations: ", "");
                      }

                      // Extract interesting sentence from thoughts
                      const {
                        filteredText: filteredThoughts,
                        interestingSentence: thoughtsInteresting,
                      } = extractInterestingSentence(thoughts);
                      thoughts = filteredThoughts;

                      // Extract interesting sentence from observations
                      const {
                        filteredText: filteredObservations,
                        interestingSentence: observationsInteresting,
                      } = extractInterestingSentence(observations);
                      observations = filteredObservations;

                      // Use the one from observations if available, otherwise from thoughts
                      const interestingSentence =
                        observationsInteresting || thoughtsInteresting;

                      return (
                        <>
                          <div className="mb-2">
                            <span className="font-medium text-gray-500 text-xs">
                              THOUGHTS:
                            </span>
                            <p className="text-gray-500 text-xs italic leading-snug">
                              {thoughts}
                            </p>
                          </div>

                          {interestingSentence && (
                            <div className="mb-2">
                              <span className="font-medium text-indigo-600 text-xs">
                                INTERESTING:
                              </span>
                              <p className="font-semibold text-indigo-600 text-sm">
                                {interestingSentence}
                              </p>
                            </div>
                          )}

                          <div>
                            <span className="font-medium text-gray-700 text-xs">
                              OBSERVATION:
                            </span>
                            <p className="font-medium text-gray-900 text-sm">
                              {observations}
                            </p>
                          </div>
                        </>
                      );
                    }
                    // For old captions, try to split the last sentence as the observation

                    // Get all sentences
                    const sentences = item.caption
                      .trim()
                      .split(/(?<=[.!?])\s+/);

                    if (sentences.length <= 1) {
                      return (
                        <p className="text-gray-900 text-sm">{item.caption}</p>
                      );
                    }

                    // Extract interesting sentence from all sentences
                    const interestingIndex = sentences.findIndex(
                      (sentence) =>
                        sentence.toLowerCase().includes("most interesting") ||
                        sentence.toLowerCase().includes("most important"),
                    );

                    const interestingSentence =
                      interestingIndex !== -1
                        ? sentences[interestingIndex]
                        : null;

                    // Remove interesting sentence from array if found
                    if (interestingIndex !== -1) {
                      sentences.splice(interestingIndex, 1);
                    }

                    // The last sentence is the observation
                    const observation = sentences.pop() || "";

                    // All other sentences are the thoughts
                    const thoughts = sentences.join(" ");

                    return (
                      <>
                        <div className="mb-2">
                          <span className="font-medium text-gray-500 text-xs">
                            THOUGHTS:
                          </span>
                          <p className="text-gray-500 text-xs italic leading-snug">
                            {thoughts}
                          </p>
                        </div>

                        {interestingSentence && (
                          <div className="mb-2">
                            <span className="font-medium text-indigo-600 text-xs">
                              INTERESTING:
                            </span>
                            <p className="font-semibold text-indigo-600 text-sm">
                              {interestingSentence}
                            </p>
                          </div>
                        )}

                        <div>
                          <span className="font-medium text-gray-700 text-xs">
                            OBSERVATION:
                          </span>
                          <p className="font-medium text-gray-900 text-sm">
                            {observation}
                          </p>
                        </div>
                      </>
                    );
                  })()}
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
