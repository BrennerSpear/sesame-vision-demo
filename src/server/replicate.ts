import Replicate from "replicate";
import { env } from "../env";
import { getPrompt } from "../config/prompts";

// Create a Replicate client instance
const replicate = new Replicate({
  auth: env.REPLICATE_API_TOKEN,
});

// LLaVA-13B model ID and version
const LLAVA_MODEL_13B =
  "yorickvp/llava-13b:2facb4a474a0462c15041b78b1ad70952ea46b5ec6ad29583c0b29dbd4249591";

const LLAVA_MODEL_7B =
  "yorickvp/llava-v1.6-mistral-7b:19be067b589d0c46689ffa7cc3ff321447a441986a7694c01225973c2eafc874";

// Function to generate a caption for an image URL
export async function generateCaption(imageUrl: string, model: "13b" | "7b" = "13b"): Promise<string> {
  try {
    const modelId = model === "7b" ? LLAVA_MODEL_7B : LLAVA_MODEL_13B;
    
    const output = await replicate.run(modelId, {
      input: {
        image: imageUrl,
        prompt: getPrompt(),
        max_tokens: 512,
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
