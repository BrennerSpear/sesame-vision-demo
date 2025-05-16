// Shared prompt configurations for the vision models
export const PROMPTS = {
  DEFAULT:
    "Write out your thought process for a bit about all the things happening in this scene, and then state the most important or interesting thing happening in this scene in one concise sentence without explaining why it's important or interesting.",

  // Add more prompts as needed
  DETAILED:
    "Analyze this image in detail. First, describe everything you see as internal thoughts. Then provide one clear, concise observation that captures the most important or interesting element.",
  BRIEF:
    "Quickly analyze this image and provide a brief thought process followed by one key observation.",
};

// Default prompt to use
export const DEFAULT_PROMPT = PROMPTS.DEFAULT;

// Current prompt selection - this can be modified by the frontend
export let currentPrompt = DEFAULT_PROMPT;

// Helper function to get the current selected prompt
export function getPrompt(): string {
  return currentPrompt;
}

// Helper function to set a new prompt
export function setPrompt(prompt: keyof typeof PROMPTS | string): void {
  // If prompt is a key in PROMPTS, use that value
  if (prompt in PROMPTS) {
    currentPrompt = PROMPTS[prompt as keyof typeof PROMPTS];
  } else {
    // Otherwise use the string directly
    currentPrompt = prompt;
  }
}
