import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { db } from "../../server/db";

// Validation schema for the query params
const querySchema = z.object({
  session: z.string(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Validate query parameters
    const validation = querySchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid query parameters",
        details: validation.error.flatten(),
      });
    }

    const { session, cursor, limit } = validation.data;

    // Query captions from the database with pagination
    const captions = await db.caption.findMany({
      where: {
        sessionId: session,
      },
      orderBy: {
        timestamp: "desc",
      },
      take: limit,
      ...(cursor
        ? {
            cursor: {
              id: cursor,
            },
            skip: 1, // Skip the cursor itself
          }
        : {}),
    });

    // Get the next cursor for pagination
    const nextCursor =
      captions.length === limit && captions.length > 0
        ? (captions[captions.length - 1]?.id ?? null)
        : null;

    return res.status(200).json({
      captions,
      nextCursor,
    });
  } catch (error) {
    console.error("Error in history API:", error);
    return res.status(500).json({
      error: "Failed to retrieve history",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
