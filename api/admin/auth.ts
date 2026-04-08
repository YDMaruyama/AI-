import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCors, handlePreflight } from '../../lib/core/cors';
import { authenticate } from '../../lib/core/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(req, res);
  if (handlePreflight(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ status: 'error', error: 'Method not allowed' });

  try {
    const { password } = req.body || {};
    if (!password) return res.status(400).json({ status: 'error', error: 'Password is required' });

    const result = authenticate(password);
    if (!result) return res.status(401).json({ status: 'error', error: 'Invalid password' });

    return res.status(200).json({ token: result.token, user: { role: result.role, name: result.name } });
  } catch (e: any) {
    return res.status(500).json({ status: 'error', error: e.message || 'Internal server error' });
  }
}
