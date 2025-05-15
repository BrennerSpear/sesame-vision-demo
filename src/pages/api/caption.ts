import type { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { env } from "../../env";
import { db } from "../../server/db";
import { generateCaption } from "../../server/replicate";
import { supabaseAdmin } from "../../server/supabase";

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

    const { path, session } = validation.data;
    const timestamp = validation.data.timestamp ?? new Date().toISOString();

    // Create a public URL for the image
    const bucketName = "vision-images";
    const imageUrl = `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucketName}/${path}`;

    // Generate a caption using Replicate
    const rawCaption = await generateCaption(imageUrl);
    
    // Format the caption as "thoughts: <all sentences except last> observations: <last sentence>"
    const formattedCaption = formatCaption(rawCaption);

    // Create a unique ID for this caption
    const captionId = uuidv4();

    // Check if session exists, if not create it
    const existingSession = await db.session.findUnique({
      where: {
        id: session,
      },
    });

    if (!existingSession) {
      console.log("Creating new session:", session);
      await db.session.create({
        data: {
          id: session,
        },
      });
    }

    // Store the caption in the database
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

    // Broadcast the caption to the client via Supabase Realtime
    await supabaseAdmin.channel(`session:${session}`).send({
      type: "broadcast",
      event: "caption",
      payload: {
        id: captionId,
        caption: formattedCaption,
        imageUrl,
        timestamp,
      },
    });

    return res.status(200).json({
      success: true,
      caption: formattedCaption,
      rawCaption,
      imageUrl,
      id: captionId,
    });
  } catch (error) {
    console.error("Error in caption API:", error);
    return res.status(500).json({
      error: "Failed to process caption",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
