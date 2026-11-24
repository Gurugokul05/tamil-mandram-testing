import { AuditLog } from '../models/index.js';

export async function recordAudit({ actor, action, targetType, targetId, targetLabel, reason = '', meta = {}, ip = '' }) {
  try {
    await AuditLog.create({
      actor: actor._id || actor,
      action,
      targetType,
      targetId: targetId || null,
      targetLabel: targetLabel || '',
      reason,
      meta,
      ip,
    });
  } catch (error) {
    console.error('[audit] failed to record entry:', error.message);
  }
}
