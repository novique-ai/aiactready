export const URGENT_HEADERS: Record<string, string> = {
  "X-Priority": "1",
  "X-MSMail-Priority": "High",
  Importance: "high",
  Priority: "urgent",
};

type SendArgs = {
  from: string;
  to: string;
  reply_to: string;
  subject: string;
  text: string;
  headers: Record<string, string>;
};

export async function sendEmail(args: SendArgs): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "missing RESEND_API_KEY" };
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    return { ok: false, error: `resend ${response.status}: ${body.slice(0, 300)}` };
  }
  const body = (await response.json()) as { id?: string };
  return body.id ? { ok: true, id: body.id } : { ok: false, error: "resend response missing id" };
}
