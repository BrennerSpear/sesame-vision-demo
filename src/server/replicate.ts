import Replicate from "replicate";
import { env } from "../env";

// Create a Replicate client instance
const replicate = new Replicate({
  auth: env.REPLICATE_API_TOKEN,
});

// LLaVA-13B model ID and version
const LLAVA_MODEL =
  "yorickvp/llava-13b:2facb4a474a0462c15041b78b1ad70952ea46b5ec6ad29583c0b29dbd4249591";

// Function to generate a caption for an image URL
export async function generateCaption(imageUrl: string): Promise<string> {
  try {
    const output = await replicate.run(LLAVA_MODEL, {
      input: {
        image: imageUrl,
        prompt:
          "Describe this image in detail. What do you see? Approximately 1 paragraph.",
        max_tokens: 300,
        temperature: 0.7,
      },
    });

    // Replicate returns an array of strings which we join into a single paragraph
    return Array.isArray(output) ? output.join("") : String(output);
  } catch (error) {
    console.error("Error generating caption with Replicate:", error);
    throw new Error(
      `Failed to generate caption: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
