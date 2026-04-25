/**
 * WhatsApp Cloud API Webhook Handler
 *
 * GET  — Meta webhook verification (hub.challenge handshake)
 * POST — Incoming messages from WhatsApp Business
 */

import { NextRequest, NextResponse } from "next/server";
import { logAudit } from "@/lib/audit/logger";

const VERIFY_TOKEN =
  process.env.WHATSAPP_VERIFY_TOKEN ?? "agentic_whatsapp_verify_2026";
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN ?? "";
const PHONE_NUMBER_ID =
  process.env.WHATSAPP_PHONE_NUMBER_ID ?? "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
}

interface WhatsAppChange {
  value: {
    messaging_product: string;
    metadata: { phone_number_id: string; display_phone_number?: string };
    messages?: WhatsAppMessage[];
  };
  field: string;
}

interface WhatsAppPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: WhatsAppChange[];
  }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function generateAgentReply(userMessage: string): Promise<string> {
  if (!OPENAI_API_KEY || OPENAI_API_KEY.startsWith("sk-placeholder")) {
    return `Thank you for your message. Our support team will respond shortly. (Agent AI: "${userMessage.slice(0, 40)}...")`;
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful WhatsApp customer support assistant for South Africa. Be concise, friendly, and helpful. Reply in the same language the customer used. Keep responses under 200 words.",
        },
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (!res.ok) {
    console.error("[WhatsApp] OpenAI error:", res.status, await res.text());
    return "We're experiencing technical difficulties. Please try again in a moment.";
  }

  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0]?.message?.content?.trim() ?? "Sorry, I couldn't generate a response.";
}

async function sendWhatsAppMessage(
  phoneNumberId: string,
  to: string,
  body: string
): Promise<void> {
  if (!ACCESS_TOKEN) {
    console.log(
      `[WhatsApp] ACCESS_TOKEN not set — would have sent to ${to}:\n${body}`
    );
    return;
  }

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body },
      }),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.error("[WhatsApp] Failed to send message:", res.status, errorText);
  } else {
    console.log(`[WhatsApp] Message sent to ${to}`);
  }
}

// ─── GET — Webhook Verification ───────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[WhatsApp] Webhook verified successfully");
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn("[WhatsApp] Webhook verification failed — token mismatch");
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// ─── POST — Incoming Messages ─────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const payload = (await req.json()) as WhatsAppPayload;

    if (payload.object !== "whatsapp_business_account") {
      return NextResponse.json({ status: "ignored" }, { status: 200 });
    }

    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field !== "messages") continue;

        const { messages, metadata } = change.value;
        if (!messages?.length) continue;

        const phoneNumberId =
          metadata.phone_number_id || PHONE_NUMBER_ID;

        for (const message of messages) {
          if (message.type !== "text" || !message.text?.body) {
            console.log(
              `[WhatsApp] Skipping non-text message type: ${message.type}`
            );
            continue;
          }

          const customerPhone = message.from;
          const messageText = message.text.body;
          const messageId = message.id;

          console.log(
            `[WhatsApp] Incoming from ${customerPhone}: "${messageText.slice(0, 80)}"`
          );

          await logAudit({
            action: "whatsapp.message.received",
            resource: `whatsapp:${customerPhone}`,
            details: {
              messageId,
              phone: customerPhone,
              preview: messageText.slice(0, 100),
              phoneNumberId,
            },
            tenantId: "default",
          });

          let replyText: string;
          try {
            replyText = await generateAgentReply(messageText);
          } catch (err) {
            console.error("[WhatsApp] Agent reply error:", err);
            replyText =
              "We're experiencing technical difficulties. Please try again shortly.";
          }

          try {
            await sendWhatsAppMessage(phoneNumberId, customerPhone, replyText);

            await logAudit({
              action: "whatsapp.message.sent",
              resource: `whatsapp:${customerPhone}`,
              details: {
                messageId,
                phone: customerPhone,
                preview: replyText.slice(0, 100),
              },
              tenantId: "default",
            });
          } catch (err) {
            console.error("[WhatsApp] Send error:", err);
          }
        }
      }
    }
  } catch (err) {
    // Always return 200 so Meta does not retry
    console.error("[WhatsApp] POST handler error:", err);
  }

  return NextResponse.json({ status: "ok" }, { status: 200 });
}
