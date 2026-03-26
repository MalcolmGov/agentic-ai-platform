/**
 * File Processing Pipeline
 * 
 * Handles file uploads, validates types/sizes, parses content,
 * and stores results for agent consumption.
 * 
 * Supported formats: PDF, CSV, JSON, Excel, plain text
 * Production: S3 storage + async processing queue
 */

// ─── Types ─────────────────────────────────

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  tenantId: string;
  uploadedBy: string;
  parsedContent?: ParsedContent;
  status: "uploaded" | "processing" | "parsed" | "error";
  createdAt: number;
}

export interface ParsedContent {
  type: "table" | "text" | "structured";
  rowCount?: number;
  columns?: string[];
  preview: string;
  data: unknown;
}

// ─── Config ───────────────────────────────

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_TYPES: Record<string, string[]> = {
  "application/pdf":  [".pdf"],
  "text/csv":         [".csv"],
  "application/json": [".json"],
  "text/plain":       [".txt", ".log", ".md"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.ms-excel": [".xls"],
};

// ─── In-Memory Store ──────────────────────

const fileStore = new Map<string, UploadedFile>();

// ─── File Processor ───────────────────────

export class FileProcessor {
  
  /**
   * Process an uploaded file
   */
  static async process(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    tenantId: string,
    userId: string
  ): Promise<UploadedFile> {
    // Validate
    if (buffer.length > MAX_FILE_SIZE) {
      throw new FileProcessingError(`File too large: ${(buffer.length / 1024 / 1024).toFixed(1)}MB (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`);
    }

    const isAllowed = Object.keys(ALLOWED_TYPES).includes(mimeType) ||
      Object.values(ALLOWED_TYPES).flat().some((ext) => fileName.toLowerCase().endsWith(ext));
    if (!isAllowed) {
      throw new FileProcessingError(`Unsupported file type: ${mimeType}. Allowed: PDF, CSV, JSON, TXT, XLSX`);
    }

    const fileId = `file_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const file: UploadedFile = {
      id: fileId,
      name: fileName,
      type: mimeType,
      size: buffer.length,
      tenantId,
      uploadedBy: userId,
      status: "processing",
      createdAt: Date.now(),
    };

    fileStore.set(fileId, file);

    // Parse based on type
    try {
      file.parsedContent = await this.parseFile(buffer, fileName, mimeType);
      file.status = "parsed";
    } catch (error) {
      file.status = "error";
      console.error(`[FileProcessor] Parse error for ${fileName}:`, error);
    }

    // In production: upload to S3
    // await s3.putObject({ Bucket: env.S3_BUCKET, Key: `${tenantId}/${fileId}/${fileName}`, Body: buffer });

    return file;
  }

  /**
   * Parse file based on type
   */
  private static async parseFile(buffer: Buffer, fileName: string, mimeType: string): Promise<ParsedContent> {
    const text = buffer.toString("utf-8");

    // CSV
    if (mimeType === "text/csv" || fileName.endsWith(".csv")) {
      return this.parseCSV(text);
    }

    // JSON
    if (mimeType === "application/json" || fileName.endsWith(".json")) {
      return this.parseJSON(text);
    }

    // Plain text / Markdown / Log
    if (mimeType.startsWith("text/") || fileName.match(/\.(txt|log|md)$/)) {
      return {
        type: "text",
        preview: text.slice(0, 500),
        data: { content: text, lineCount: text.split("\n").length },
      };
    }

    // PDF — extract text (simplified)
    if (mimeType === "application/pdf" || fileName.endsWith(".pdf")) {
      return {
        type: "text",
        preview: "[PDF content — production uses pdf-parse library for extraction]",
        data: { content: "PDF parsing requires pdf-parse package", pages: 0 },
      };
    }

    // Excel — placeholder
    if (fileName.match(/\.(xlsx|xls)$/)) {
      return {
        type: "table",
        preview: "[Excel content — production uses xlsx library for parsing]",
        data: { sheets: [], rowCount: 0 },
      };
    }

    return {
      type: "text",
      preview: text.slice(0, 500),
      data: { content: text },
    };
  }

  /**
   * Parse CSV content
   */
  private static parseCSV(text: string): ParsedContent {
    const lines = text.trim().split("\n");
    const headers = lines[0]?.split(",").map((h) => h.trim().replace(/"/g, "")) || [];
    const rows = lines.slice(1).map((line) =>
      line.split(",").map((cell) => cell.trim().replace(/"/g, ""))
    );

    return {
      type: "table",
      rowCount: rows.length,
      columns: headers,
      preview: `${headers.join(", ")}\n${rows.slice(0, 3).map((r) => r.join(", ")).join("\n")}`,
      data: { headers, rows, rowCount: rows.length },
    };
  }

  /**
   * Parse JSON content
   */
  private static parseJSON(text: string): ParsedContent {
    const parsed = JSON.parse(text);
    const isArray = Array.isArray(parsed);

    return {
      type: "structured",
      rowCount: isArray ? parsed.length : 1,
      columns: isArray && parsed.length > 0 ? Object.keys(parsed[0]) : Object.keys(parsed),
      preview: JSON.stringify(parsed, null, 2).slice(0, 500),
      data: parsed,
    };
  }

  /**
   * Get a file by ID
   */
  static getFile(fileId: string, tenantId: string): UploadedFile | null {
    const file = fileStore.get(fileId);
    if (!file || file.tenantId !== tenantId) return null;
    return file;
  }

  /**
   * List files for a tenant
   */
  static listFiles(tenantId: string): UploadedFile[] {
    return Array.from(fileStore.values())
      .filter((f) => f.tenantId === tenantId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }
}

export class FileProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FileProcessingError";
  }
}
