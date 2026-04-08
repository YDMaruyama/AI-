/**
 * スキル登録（静的import — Vercel Serverlessで確実にバンドルされる）
 * 登録順 = キーワードルートの優先順位（具体的 → 汎用）
 */
import { skillRegistry } from './_registry';

import { reportSkill } from './report.skill';
import { taskSkill } from './task.skill';
import { calendarSkill } from './calendar.skill';
import { reservationSkill } from './reservation.skill';
import { invoiceSkill } from './invoice.skill';
import { expenseSkill } from './expense.skill';
import { salesSkill } from './sales.skill';

// 登録順 = ルートの優先順位
skillRegistry.register(reportSkill);
skillRegistry.register(taskSkill);
skillRegistry.register(calendarSkill);
skillRegistry.register(reservationSkill);
skillRegistry.register(invoiceSkill);
skillRegistry.register(expenseSkill);
skillRegistry.register(salesSkill);

export { skillRegistry };
