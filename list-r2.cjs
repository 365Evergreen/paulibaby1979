const { S3Client, ListObjectsV2Command } = require("@aws-sdk/client-s3");
const fs = require("fs");

// Initialize the R2 client using its S3-compatible API
const client = new S3Client({
  region: "auto",
  endpoint: "https://9563d1b7d90e2bb8e1eaafd6abd8e6a8.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: "48d84ec21a9b5ba93a45e8065ca5edac",
    secretAccessKey: "1546bd806385a922f450853e5b4068eba5f753207b5287e5472e54a03594294c",
  },
});

async function exportBucketList() {
  try {
    const command = new ListObjectsV2Command({
      Bucket: "paulibaby-blog",
    });

    const response = await client.send(command);

    // Map to a clean list of keys or output the full metadata response
    const fileList = response.Contents ? response.Contents.map(file => file.Key) : [];

    fs.writeFileSync("r2_bucket_list.json", JSON.stringify(fileList, null, 2));
    console.log("Successfully exported to r2_bucket_list.json");
  } catch (err) {
    console.error("Error fetching bucket contents:", err);
  }
}

exportBucketList();
