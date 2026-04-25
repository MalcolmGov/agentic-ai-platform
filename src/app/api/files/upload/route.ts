/**
 * File Upload API
 * 
 * POST /api/files/upload — Upload and parse a file
 * GET  /api/files/upload — List uploaded files
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/rbac";
import { FileProcessor, FileProcessingError } from "@/lib/files/processor";
import { auditFromRequest } from "@/lib/audit/logger";

function apiResponse(data: unknown, status = 200) {
  return NextResponse.json(
    { success: true, data, timestamp: new Date().toISOString() },
    { status }
  );
}

function apiError(message: string, status = 400) {
  return NextResponse.json(
    { success: false, error: message, timestamp: new Date().toISOString() },
    { status }
  );
}

// GET — List uploaded files
export const GET = withAuth("agents:read", async (_req, { user }) => {
  const files = FileProcessor.listFiles(user.tenantId);
  return apiResponse({
    files: files.map((f) => ({
      id: f.id,
      name: f.name,
      type: f.type,
      size: f.size,
      status: f.status,
      preview: f.parsedContent?.preview?.slice(0, 200),
      rowCount: f.parsedContent?.rowCount,
      columns: f.parsedContent?.columns,
      createdAt: new Date(f.createdAt).toISOString(),
    })),
    total: files.length,
  });
});

// POST — Upload and parse a file
export const POST = withAuth("agents:create", async (req: NextRequest, { user }) => {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return apiError("No file provided. Send as multipart/form-data with field name 'file'", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await FileProcessor.process(
      buffer,
      file.name,
      file.type || "application/octet-stream",
      user.tenantId,
      user.userId
    );

    await auditFromRequest(req, user, "file.upload", `file:${result.id}`, {
      fileName: file.name,
      fileSize: buffer.length,
      fileType: file.type,
      status: result.status,
    });

    return apiResponse({
      id: result.id,
      name: result.name,
      type: result.type,
      size: result.size,
      status: result.status,
      parsed: result.parsedContent
        ? {
            type: result.parsedContent.type,
            rowCount: result.parsedContent.rowCount,
            columns: result.parsedContent.columns,
            preview: result.parsedContent.preview,
          }
        : null,
    }, 201);
  } catch (error) {
    if (error instanceof FileProcessingError) {
      return apiError(error.message, 400);
    }
    console.error("[File Upload]", error);
    return apiError("File upload failed", 500);
  }
});
