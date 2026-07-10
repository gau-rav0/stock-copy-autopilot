export type OutboundEventType = "creator_application" | "follow_intent" | "roast_lead";

export type OutboundResult = {
  crm: "sent" | "skipped" | "failed";
  email: "sent" | "skipped" | "failed";
};

type OutboundEvent = {
  type: OutboundEventType;
  payload: Record<string, unknown>;
};

const operationEmailTo = () => process.env.OPERATIONS_EMAIL_TO ?? process.env.CRM_EMAIL_TO;
const operationEmailFrom = () => process.env.OPERATIONS_EMAIL_FROM ?? "Follow Verified Investors <onboarding@resend.dev>";

async function sendCrmWebhook(event: OutboundEvent) {
  const webhookUrl = process.env.CRM_WEBHOOK_URL;
  if (!webhookUrl) {
    return "skipped" as const;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.CRM_WEBHOOK_SECRET ? { authorization: `Bearer ${process.env.CRM_WEBHOOK_SECRET}` } : {}),
      },
      body: JSON.stringify({
        ...event,
        sentAt: new Date().toISOString(),
        source: "follow-verified-investors",
      }),
    });

    return response.ok ? ("sent" as const) : ("failed" as const);
  } catch {
    return "failed" as const;
  }
}

async function sendOperationsEmail(event: OutboundEvent) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = operationEmailTo();

  if (!apiKey || !to) {
    return "skipped" as const;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: operationEmailFrom(),
        to,
        subject: `New ${event.type.replace(/_/g, " ")} event`,
        text: JSON.stringify(event.payload, null, 2),
      }),
    });

    return response.ok ? ("sent" as const) : ("failed" as const);
  } catch {
    return "failed" as const;
  }
}

export async function dispatchOutboundEvent(type: OutboundEventType, payload: Record<string, unknown>): Promise<OutboundResult> {
  const event = { type, payload };
  const [crm, email] = await Promise.all([sendCrmWebhook(event), sendOperationsEmail(event)]);

  return { crm, email };
}
