import type { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuidv4 } from "uuid";
import { env } from "../../env";
import { supabaseAdmin } from "../../server/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Generate a unique filename
    const fileId = uuidv4();
    const fileName = `${fileId}.jpg`;
    const bucketName = "vision-images";
    const filePath = `frames/${fileName}`;

    console.log("Creating bucket if not exists...");
    // Create the bucket if it doesn't exist
    const { error: bucketError } = await supabaseAdmin.storage.createBucket(
      bucketName,
      {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      },
    );

    if (bucketError && bucketError.message !== "Bucket already exists") {
      console.error("Error creating bucket:", bucketError);
      return res.status(500).json({ error: "Failed to create bucket" });
    }

    console.log("Creating signed URL...");
    // Create a signed URL for uploading
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .createSignedUploadUrl(filePath);

    if (error) {
      console.error("Error creating signed URL:", error);
      return res.status(500).json({ error: "Failed to create signed URL" });
    }

    // Generate a public URL for the image (will be accessible after upload)
    const imageUrl = `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucketName}/${filePath}`;

    console.log("Signed URL created successfully");
    return res.status(200).json({
      uploadUrl: data.signedUrl,
      path: filePath,
      getUrl: imageUrl,
    });
  } catch (error) {
    console.error("Error in signed-upload API:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
