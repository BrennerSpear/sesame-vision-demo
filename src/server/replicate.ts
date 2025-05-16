import Replicate from "replicate";
import { getPrompt } from "../config/prompts";
import { env } from "../env";

// Create a Replicate client instance
const replicate = new Replicate({
  auth: env.REPLICATE_API_TOKEN,
});

// Model IDs and versions
const LLAVA_MODEL_13B =
  "yorickvp/llava-13b:2facb4a474a0462c15041b78b1ad70952ea46b5ec6ad29583c0b29dbd4249591" as const;

const LLAVA_MODEL_7B =
  "yorickvp/llava-v1.6-mistral-7b:19be067b589d0c46689ffa7cc3ff321447a441986a7694c01225973c2eafc874" as const;

const DEEPSEEK_MODEL_7B =
  "deepseek-ai/deepseek-vl-7b-base:d1823e6f68cd3d57f2d315b9357dfa85f53817120ae0de8d2b95fbc8e93a1385" as const;

// Function to generate a caption for an image URL
export async function generateCaption(
  imageUrl: string,
  model: "13b" | "7b" | "deepseek" = "13b",
): Promise<string> {
  try {
    let modelId:
      | typeof LLAVA_MODEL_13B
      | typeof LLAVA_MODEL_7B
      | typeof DEEPSEEK_MODEL_7B;

    switch (model) {
      case "7b":
        modelId = LLAVA_MODEL_7B;
        break;
      case "deepseek":
        modelId = DEEPSEEK_MODEL_7B;
        break;
      default:
        modelId = LLAVA_MODEL_13B;
        break;
    }

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
