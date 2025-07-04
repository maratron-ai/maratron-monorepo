import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join, extname } from "path";
import { randomUUID } from "crypto";
import { requireAuth, unauthorizedResponse } from "@lib/middleware/auth";
import { withRateLimit, RATE_LIMITS } from "@lib/middleware/rateLimit";

export const POST = withRateLimit(RATE_LIMITS.UPLOAD, "file-upload")(
  async (request: NextRequest) => {
    // Require authentication
    const authResult = await requireAuth(request);
    if (!authResult.isAuthenticated) {
      return unauthorizedResponse(authResult.error);
    }
    
    try {
      const formData = await request.formData();
      const fileEntry = formData.get("file");
      
      if (!fileEntry || !(fileEntry instanceof Blob)) {
        return NextResponse.json({ error: "File missing" }, { status: 400 });
      }

      // Treat the uploaded entry as a Blob with a name
      const file = fileEntry as Blob & { name: string };

      // File type validation
      const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!allowed.includes(file.type)) {
        return NextResponse.json({ error: "Invalid file type. Only JPEG, PNG, WebP, and GIF files are allowed." }, { status: 400 });
      }

      // File size validation (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "File too large. Maximum size is 5MB." }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uploadDir = join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });
      
      // Generate secure filename with user prefix for tracking
      const fileName = `${authResult.userId}-${randomUUID()}${extname(file.name)}`;
      await writeFile(join(uploadDir, fileName), buffer);
      
      return NextResponse.json({ 
        url: `/uploads/${fileName}`,
        size: file.size,
        type: file.type
      });
    } catch (error) {
      console.error("File upload error:", error);
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }
  }
);
