/**
 * Enterprise Omnichannel Notification Engine (Email & Direct WA)
 * Integration: Resend / Nodemailer transactional delivery
 */

export interface TaskEmailPayload {
  to: string;
  recipientName: string;
  assigneeName: string;
  taskTitle: string;
  taskId: string;
  eventType: 'REVIEW_REQUESTED' | 'TASK_OVERDUE' | 'TASK_COMPLETED';
  divisionName?: string;
  dueDate?: string;
}

/**
 * 1. Email Dispatch Utility via Resend (or SMTP fallback)
 */
export async function sendTaskNotificationEmail(payload: TaskEmailPayload): Promise<{ success: boolean; error?: string }> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.company.com';
  const taskUrl = `${APP_URL}/tasks/${payload.taskId}`;

  let subject = '';
  let badgeLabel = '';
  let mainMessage = '';

  switch (payload.eventType) {
    case 'REVIEW_REQUESTED':
      subject = `[Review Diperlukan] Tugas Siap Ditinjau: ${payload.taskTitle}`;
      badgeLabel = 'STATUS: READY FOR REVIEW';
      mainMessage = `Pelaksana tugas <strong>${payload.assigneeName}</strong> telah memindahkan tugas ke status <strong>REVIEW</strong>. Mohon lakukan pengecekan hasil pekerjaan dan konfirmasi persetujuan (QA).`;
      break;
    case 'TASK_OVERDUE':
      subject = `[Peringatan SLA] Tugas Melewati Batas Waktu: ${payload.taskTitle}`;
      badgeLabel = 'STATUS: OVERDUE (SLA BREACH)';
      mainMessage = `Tugas ini telah melewati target tanggal jatuh tempo (<strong>${payload.dueDate || 'Hari ini'}</strong>). Mohon segera lakukan peninjauan dan follow-up kepada pelaksana (<strong>${payload.assigneeName}</strong>).`;
      break;
    case 'TASK_COMPLETED':
      subject = `[Selesai] Tugas Berhasil Diselesaikan: ${payload.taskTitle}`;
      badgeLabel = 'STATUS: DONE';
      mainMessage = `Tugas telah ditandai selesai oleh <strong>${payload.assigneeName}</strong>. Seluruh metrik milestone tercatat 100%.`;
      break;
  }

  const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
        <!-- Corporate Header -->
        <tr>
          <td style="padding: 24px 28px; background-color: #0f172a; color: #ffffff;">
            <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; display: block; margin-bottom: 4px;">
              Enterprise Operations Alert
            </span>
            <h1 style="margin: 0; font-size: 18px; font-weight: 700; line-height: 1.3;">
              ${subject}
            </h1>
          </td>
        </tr>

        <!-- Body Content -->
        <tr>
          <td style="padding: 28px;">
            <p style="font-size: 14px; margin-top: 0; line-height: 1.6; color: #334155;">
              Halo <strong>${payload.recipientName}</strong>,
            </p>
            <p style="font-size: 13px; line-height: 1.6; color: #475569;">
              ${mainMessage}
            </p>

            <!-- Task Meta Box -->
            <div style="background-color: #f1f5f9; border-left: 4px solid #0f172a; padding: 14px 16px; margin: 20px 0; border-radius: 4px;">
              <span style="display: inline-block; font-size: 10px; font-weight: 800; background-color: #0f172a; color: #ffffff; padding: 2px 6px; border-radius: 3px; letter-spacing: 0.05em; margin-bottom: 6px;">
                ${badgeLabel}
              </span>
              <p style="margin: 4px 0 0; font-size: 14px; font-weight: 700; color: #0f172a;">
                ${payload.taskTitle}
              </p>
              <p style="margin: 4px 0 0; font-size: 12px; color: #64748b;">
                ID: ${payload.taskId.slice(0, 8)} ${payload.divisionName ? `• Divisi: ${payload.divisionName}` : ''}
              </p>
            </div>

            <!-- CTA Button -->
            <div style="margin-top: 24px;">
              <a href="${taskUrl}" style="background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-size: 12px; font-weight: 700; display: inline-block;">
                Buka & Tinjau Tugas
              </a>
            </div>

            <p style="font-size: 11px; color: #94a3b8; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 16px; line-height: 1.5;">
              Pemberitahuan otomatis ini dikirim oleh Internal Task Management System untuk memenuhi standar SLA dan audit trail ISO 27001.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  if (!RESEND_API_KEY) {
    console.warn('[NotificationEngine] RESEND_API_KEY is not configured. Simulating email dispatch to:', payload.to);
    console.log('[NotificationEngine] Subject:', subject);
    return { success: true };
  }

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
        subject: subject,
        html: htmlTemplate,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Resend API Error (${response.status}): ${errText}`);
    }

    return { success: true };
  } catch (err: any) {
    console.error('[NotificationEngine] Email dispatch failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * 2. WhatsApp Direct Link Generator
 * Standardizes international/local Indonesian phone format: 08xx -> 628xx
 */
export function buildDirectWALink(whatsappNumber: string, taskTitle: string): string {
  // Clean non-numeric characters
  let cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
  if (cleanNumber.startsWith('0')) {
    cleanNumber = '62' + cleanNumber.slice(1);
  }

  const encodedText = encodeURIComponent(`Halo, terkait tugas "${taskTitle}"...`);
  return `https://wa.me/${cleanNumber}?text=${encodedText}`;
}
