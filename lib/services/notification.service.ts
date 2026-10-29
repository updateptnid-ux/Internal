/**
 * Enterprise Omnichannel Notification Service
 * Supports: Transactional Email (Resend) and WhatsApp API (Cloud API/Provider)
 */

export interface EmailPayload {
  to: string;
  recipientName: string;
  subject: string;
  taskTitle: string;
  taskStatus: string;
  eventType: 'DONE' | 'OVERDUE' | 'NEW_ASSIGNMENT' | 'URGENT_UPDATE';
  divisionName?: string;
  actionUrl: string;
}

export interface WhatsAppPayload {
  phoneNumber: string; // E.164 formatted, e.g. "6281234567890"
  recipientName: string;
  taskTitle: string;
  oldStatus?: string;
  newStatus?: string;
  progressPercentage?: number;
  priority?: string;
}

/**
 * 1. Transactional Email Notification Handler
 */
export async function sendEmailNotification(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    console.warn('[NotificationService] RESEND_API_KEY is not defined. Simulating email dispatch.');
    return { success: true };
  }

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <div style="border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px;">
            <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; font-weight: 700;">Enterprise Task Notification</span>
            <h2 style="margin: 6px 0 0; font-size: 20px; font-weight: 700; color: #0f172a;">${payload.subject}</h2>
          </div>
          <p style="font-size: 14px; line-height: 1.6; color: #334155;">
            Halo <strong>${payload.recipientName}</strong>,
          </p>
          <div style="background: #f1f5f9; border-left: 4px solid #0f172a; padding: 14px 16px; margin: 16px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 13px; font-weight: 600; color: #0f172a;">Tugas: ${payload.taskTitle}</p>
            <p style="margin: 4px 0 0; font-size: 12px; color: #475569;">Status: <strong>${payload.taskStatus}</strong> ${payload.divisionName ? `| Divisi: ${payload.divisionName}` : ''}</p>
          </div>
          <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
            Pemberitahuan otomatis ini dikirimkan untuk memastikan audit trail dan kepatuhan SLA korporat terpenuhi.
          </p>
          <div style="margin-top: 24px;">
            <a href="${payload.actionUrl}" style="background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-size: 13px; font-weight: 600; display: inline-block;">
              Buka Task System
            </a>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Enterprise Operations <notifications@company.com>',
        to: payload.to,
        subject: `[Task Alert] ${payload.subject}`,
        html: htmlBody,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Resend API error: ${err}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error('[NotificationService] Email delivery failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 2. WhatsApp API Integration (Server-side Trigger via Webhook / WhatsApp Business Gateway)
 */
export async function triggerWhatsAppAlert(payload: WhatsAppPayload): Promise<{ success: boolean; error?: string }> {
  const WA_GATEWAY_URL = process.env.WHATSAPP_GATEWAY_URL;
  const WA_API_TOKEN = process.env.WHATSAPP_API_TOKEN;

  // Format corporate message
  const message = [
    `*🚨 [ENTERPRISE TASK NOTIFICATION]*`,
    `Halo *${payload.recipientName}*,`,
    `Terdapat pembaruan mendesak pada tugas:`,
    `📋 *Judul:* ${payload.taskTitle}`,
    payload.priority ? `⚡ *Prioritas:* ${payload.priority}` : '',
    payload.newStatus ? `🔄 *Status Baru:* ${payload.newStatus}` : '',
    payload.progressPercentage !== undefined ? `📊 *Progress:* ${payload.progressPercentage}%` : '',
    `\nMohon lakukan pengecekan pada sistem segera.`,
  ].filter(Boolean).join('\n');

  if (!WA_GATEWAY_URL || !WA_API_TOKEN) {
    console.warn('[NotificationService] WhatsApp Gateway not configured. Simulating WA delivery:\n', message);
    return { success: true };
  }

  try {
    const formattedPhone = cleanPhoneNumber(payload.phoneNumber);
    const res = await fetch(WA_GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${WA_API_TOKEN}`,
      },
      body: JSON.stringify({
        phone: formattedPhone,
        message: message,
      }),
    });

    if (!res.ok) {
      throw new Error(`WA Gateway responded with status: ${res.status}`);
    }

    return { success: true };
  } catch (err: any) {
    console.error('[NotificationService] WA trigger failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * 3. Client Helper: Generate Universal WhatsApp Direct Link (wa.me)
 */
export function generateDirectWALink(params: {
  phone: string;
  recipientName: string;
  taskTitle: string;
  taskId: string;
  status: string;
  progress: number;
}): string {
  const cleanPhone = cleanPhoneNumber(params.phone);
  const text = 
    `Halo *${params.recipientName}*,\n\n` +
    `Mengenai tugas *"${params.taskTitle}"* (ID: ${params.taskId.slice(0, 8)}):\n` +
    `• Status saat ini: *${params.status}*\n` +
    `• Progress: *${params.progress}%*\n\n` +
    `Mohon update atau konfirmasi tindak lanjut terkait milestone ini. Terima kasih.`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Standardize Indonesian or International numbers to format: 628xxxx / international
 */
function cleanPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  }
  return cleaned;
}
