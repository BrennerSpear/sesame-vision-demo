import type { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { env } from "../../env";
import { db } from "../../server/db";
import { generateCaption } from "../../server/replicate";
import { supabaseAdmin } from "../../server/supabase";

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
    const caption = await generateCaption(imageUrl);

    // Create a unique ID for this caption
    const captionId = uuidv4();

    // Store the caption in the database
    await db.caption.create({
      data: {
        id: captionId,
        sessionId: session,
        timestamp: new Date(timestamp),
        imagePath: path,
        imageUrl,
        caption,
      },
    });

    // Broadcast the caption to the client via Supabase Realtime
    await supabaseAdmin.channel(`session:${session}`).send({
      type: "broadcast",
      event: "caption",
      payload: {
        id: captionId,
        caption,
        imageUrl,
        timestamp,
      },
    });

    return res.status(200).json({
      success: true,
      caption,
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
