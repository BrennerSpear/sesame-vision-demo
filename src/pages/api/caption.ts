import type { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { env } from "../../env";
import { db } from "../../server/db";
import { generateCaption } from "../../server/replicate";
import { supabaseAdmin } from "../../server/supabase";
import { setPrompt } from "../../config/prompts";

/**
 * Format a caption into "thoughts: <all but last sentence> observations: <last sentence>"
 */
function formatCaption(caption: string): string {
  // Clean up the caption and split into sentences
  // This regex matches sentence endings (period, question mark, exclamation) followed by a space
  const sentences = caption.trim().split(/(?<=[.!?])\s+/);

  if (sentences.length <= 1) {
    return `Observations: ${caption}`;
  }

  // The last sentence is the observation
  const observation = sentences.pop() || "";

  // All other sentences are the thoughts
  const thoughts = sentences.join(" ");

  return `Thoughts: ${thoughts}\n\nObservations: ${observation}`;
}

// Validation schema for the request body
const requestSchema = z.object({
  path: z.string(),
  timestamp: z.string().optional(),
  session: z.string(),
  requestId: z.string().optional(), // For tracking pipeline timing
  model: z.enum(["13b", "7b"]).default("13b"),
  prompt: z.string().optional(), // Optional prompt parameter
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Validate request body
    const validation = requestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid request data",
        details: validation.error.flatten(),
      });
    }

    const { path, session, requestId = "unknown", model, prompt } = validation.data;
    const timestamp = validation.data.timestamp ?? new Date().toISOString();
    
    // If a prompt was provided, set it as the current prompt
    if (prompt) {
      setPrompt(prompt);
    }

    console.log(`[${requestId}] === SERVER PROCESSING STARTED ===`);
    const serverStartTime = Date.now();

    // Step 6: Preparing to fetch image from Supabase
    console.time(`[${requestId}] Step 6: Prepare image URL from Supabase`);
    const bucketName = "vision-images";
    const imageUrl = `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucketName}/${path}`;
    console.timeEnd(`[${requestId}] Step 6: Prepare image URL from Supabase`);

    // Step 7: Generate a caption using Replicate
    console.time(
      `[${requestId}] Step 7: Generate caption with Replicate LLaVA-${model}`,
    );
    const rawCaption = await generateCaption(imageUrl, model);
    console.timeEnd(
      `[${requestId}] Step 7: Generate caption with Replicate LLaVA-${model}`,
    );

    // Format the caption
    console.time(`[${requestId}] Format caption`);
    const formattedCaption = formatCaption(rawCaption);
    console.timeEnd(`[${requestId}] Format caption`);

    // Create a unique ID for this caption
    const captionId = uuidv4();

    // Step 8a: Session check and creation if needed
    console.time(`[${requestId}] Step 8a: Session check`);
    const existingSession = await db.session.findUnique({
      where: {
        id: session,
      },
    });

    if (!existingSession) {
      console.log(`[${requestId}] Creating new session:`, session);
      await db.session.create({
        data: {
          id: session,
        },
      });
    }
    console.timeEnd(`[${requestId}] Step 8a: Session check`);

    // Step 8b: Store the caption in the database
    console.time(`[${requestId}] Step 8b: Store caption in database`);
    await db.caption.create({
      data: {
        id: captionId,
        sessionId: session,
        timestamp: new Date(timestamp),
        imagePath: path,
        imageUrl,
        caption: formattedCaption,
      },
    });
    console.timeEnd(`[${requestId}] Step 8b: Store caption in database`);

    // Step 9: Broadcast the caption to the client via Supabase Realtime
    console.time(`[${requestId}] Step 9: Broadcast via Supabase Realtime`);
    await supabaseAdmin.channel(`session:${session}`).send({
      type: "broadcast",
      event: "caption",
      payload: {
        id: captionId,
        caption: formattedCaption,
        imageUrl,
        timestamp,
        requestId, // Pass the request ID back to correlate with client logs
      },
    });
    console.timeEnd(`[${requestId}] Step 9: Broadcast via Supabase Realtime`);

    // Log total server processing time
    const serverEndTime = Date.now();
    const serverTotalTime = serverEndTime - serverStartTime;
    console.log(
      `[${requestId}] === SERVER PROCESSING COMPLETE (${serverTotalTime}ms) ===`,
    );

    return res.status(200).json({
      success: true,
      caption: formattedCaption,
      rawCaption,
      imageUrl,
      id: captionId,
      requestId,
      processingTime: serverTotalTime,
    });
  } catch (error) {
    console.error("Error in caption API:", error);
    return res.status(500).json({
      error: "Failed to process caption",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
