import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to extract session token from Authorization header or HttpOnly cookie
function extractSessionToken(req: any): string | undefined {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)opsflow_session=([^;]+)/);
    if (match) {
      return decodeURIComponent(match[1]);
    }
  }
  return undefined;
}

// Auth token authentication middleware
function authenticateToken(req: any, res: any, next: any) {
  const token = extractSessionToken(req);

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Authentication token required' });
  }

  const user = db.getUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired session' });
  }

  req.user = user;
  req.sessionToken = token;
  next();
}

// Lazy initialize AI client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'serviceops-enterprise',
        },
      },
    });
  }
  return geminiClient;
}

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

// ==========================================
// 2. AUTHENTICATION & SESSION MANAGEMENT
// ==========================================
app.post('/api/auth/login', (req, res) => {
  const { userId, username, password } = req.body;
  const identifier = userId || username;
  if (!identifier || !password) {
    return res.status(400).json({ error: 'User ID and password are required' });
  }

  const result = db.login(identifier, password);
  if (!result) {
    return res.status(401).json({ error: 'Invalid credentials or account is inactive' });
  }

  // Set secure HttpOnly session cookie
  res.setHeader(
    'Set-Cookie',
    `opsflow_session=${encodeURIComponent(result.token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
  );

  res.json(result);
});

app.post('/api/auth/logout', authenticateToken, (req: any, res) => {
  const token = req.sessionToken || extractSessionToken(req);
  if (token) {
    db.logout(token);
  }
  res.setHeader(
    'Set-Cookie',
    'opsflow_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
  );
  res.json({ status: 'ok', message: 'Logged out successfully' });
});

app.get('/api/auth/me', authenticateToken, (req: any, res) => {
  res.json({ user: req.user });
});

// ==========================================
// 3. USER MANAGEMENT & RBAC POLICIES
// ==========================================
app.get('/api/users', authenticateToken, (req: any, res) => {
  const user = req.user;
  const allUsers = db.getAllUsers();

  if (user.role === 'ADMIN' || user.role === 'OPERATIONS') {
    return res.json(allUsers);
  }

  if (user.role === 'MANAGER') {
    // Manager sees themselves and their assigned team engineers
    const team = allUsers.filter((u) => u.id === user.id || u.managerId === user.id);
    return res.json(team);
  }

  if (user.role === 'FIELD_ENGINEER') {
    // Engineer sees themselves and their assigned manager
    const visible = allUsers.filter(
      (u) => u.id === user.id || (user.managerId && u.id === user.managerId)
    );
    return res.json(visible);
  }

  res.json([user]);
});

app.post('/api/users', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Only Administrators can create users' });
  }
  const newUser = db.adminCreateUser(req.user, req.body);
  if (!newUser) {
    return res.status(400).json({ error: 'Failed to create user' });
  }
  res.status(201).json(newUser);
});

app.put('/api/users/:id/password', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      error: 'Forbidden: Normal users cannot reset passwords. Only Administrators can change credentials.',
    });
  }
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  const ok = db.adminChangePassword(req.user, req.params.id, newPassword);
  if (!ok) return res.status(404).json({ error: 'User not found' });
  res.json({ status: 'ok', message: 'Password updated successfully' });
});

app.put('/api/users/:id/team', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Only Administrators can assign teams' });
  }
  const { managerId } = req.body;
  const ok = db.adminSetManager(req.user, req.params.id, managerId);
  if (!ok) return res.status(400).json({ error: 'Invalid user or manager ID' });
  res.json({ status: 'ok', message: 'Team assignment updated' });
});

app.put('/api/users/:id/status', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Only Administrators can change user status' });
  }
  const { isActive } = req.body;
  const ok = db.adminSetUserStatus(req.user, req.params.id, Boolean(isActive));
  if (!ok) return res.status(404).json({ error: 'User not found' });
  res.json({ status: 'ok', message: 'User status updated' });
});

app.put('/api/users/:id/role', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Only Administrators can change roles' });
  }
  const { role } = req.body;
  const ok = db.adminSetUserRole(req.user, req.params.id, role);
  if (!ok) return res.status(400).json({ error: 'Failed to update role' });
  res.json({ status: 'ok', message: 'Role updated' });
});

// ==========================================
// 4. JOB CARDS (Strict Server-Side Isolation)
// ==========================================
app.get('/api/jobcards', authenticateToken, (req: any, res) => {
  const cards = db.getScopedJobCards(req.user);
  res.json(cards);
});

app.get('/api/jobcards/:id', authenticateToken, (req: any, res) => {
  const result = db.getScopedJobCard(req.user, req.params.id);
  if (result.status !== 200) {
    return res.status(result.status).json({ error: result.error });
  }
  res.json(result.card);
});

app.post('/api/jobcards', authenticateToken, (req: any, res) => {
  const result = db.createJobCard(req.user, req.body);
  if (result.status !== 201) {
    return res.status(result.status).json({ error: result.error });
  }
  res.status(201).json(result.card);
});

app.put('/api/jobcards/:id', authenticateToken, (req: any, res) => {
  const result = db.updateJobCard(req.user, req.params.id, req.body);
  if (result.status !== 200) {
    return res.status(result.status).json({ error: result.error });
  }
  res.json(result.card);
});

app.post('/api/jobcards/:id/submit', authenticateToken, (req: any, res) => {
  const result = db.submitJobCard(req.user, req.params.id);
  if (result.status !== 200) {
    return res.status(result.status).json({ error: result.error });
  }
  res.json(result.card);
});

app.post('/api/jobcards/:id/approve', authenticateToken, (req: any, res) => {
  const { notes } = req.body;
  const result = db.approveJobCard(req.user, req.params.id, notes);
  if (result.status !== 200) {
    return res.status(result.status).json({ error: result.error });
  }
  res.json(result.card);
});

app.post('/api/jobcards/:id/request-changes', authenticateToken, (req: any, res) => {
  const { sections, notes } = req.body;
  const result = db.requestChanges(req.user, req.params.id, sections || [], notes || '');
  if (result.status !== 200) {
    return res.status(result.status).json({ error: result.error });
  }
  res.json(result.card);
});

app.post('/api/jobcards/:id/reject', authenticateToken, (req: any, res) => {
  const { reason } = req.body;
  const result = db.rejectJobCard(req.user, req.params.id, reason || 'Rejected by manager');
  if (result.status !== 200) {
    return res.status(result.status).json({ error: result.error });
  }
  res.json(result.card);
});

app.post('/api/jobcards/:id/pricing-review', authenticateToken, (req: any, res) => {
  db.recordPricingReviewed(req.user, req.params.id);
  res.json({ status: 'ok' });
});

app.post('/api/jobcards/:id/document-generated', authenticateToken, (req: any, res) => {
  db.recordDocumentGenerated(req.user, req.params.id);
  res.json({ status: 'ok' });
});

// ==========================================
// 5. MASTER DATA & AUDIT LOGS
// ==========================================
app.get('/api/inventory', (req, res) => {
  res.json(db.getInventory());
});

app.post('/api/inventory', authenticateToken, (req: any, res) => {
  const result = db.addInventoryItem(req.user, req.body);
  if (result.status !== 201) {
    return res.status(result.status).json({ error: result.error });
  }
  res.status(201).json(result.item);
});

app.put('/api/inventory/:id', authenticateToken, (req: any, res) => {
  const result = db.updateInventoryItem(req.user, req.params.id, req.body);
  if (result.status !== 200) {
    return res.status(result.status).json({ error: result.error });
  }
  res.json(result.item);
});

app.post('/api/inventory/:id/adjust-stock', authenticateToken, (req: any, res) => {
  const result = db.adjustStock(req.user, req.params.id, req.body);
  if (result.status !== 200) {
    return res.status(result.status).json({ error: result.error });
  }
  res.json({
    status: 'ok',
    item: result.item,
    movement: result.movement,
  });
});

app.get('/api/inventory/movements', authenticateToken, (req: any, res) => {
  res.json(db.getStockMovements(req.user));
});

app.get('/api/customers', (req, res) => {
  res.json(db.getCustomers());
});

app.get('/api/equipment', (req, res) => {
  res.json(db.getEquipment());
});

app.get('/api/audit-logs', authenticateToken, (req: any, res) => {
  res.json(db.getAuditLogs(req.user));
});

app.post('/api/system/reset', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only Administrators can reset system data' });
  }
  db.seed();
  res.json({ status: 'ok', message: 'System database reset to initial enterprise seed data' });
});

// 2. AI: Generate Service Summary
app.post('/api/ai/service-summary', async (req, res) => {
  try {
    const { problemReported, checklist, parts, currentNotes } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // Deterministic rule-based fallback if no AI API key is configured
      const issuesFound = (checklist || []).filter((c: any) => c.status === 'Issue Found');
      const partsUsed = (parts || []).map((p: any) => `${p.quantity}x ${p.partNumber} (${p.description})`).join(', ');
      
      const summary = `Completed comprehensive technical inspection. Addressed reported symptom: "${problemReported || 'Standard service scope'}". ${
        issuesFound.length > 0
          ? `Identified and rectified ${issuesFound.length} issue(s): ${issuesFound.map((i: any) => i.issue?.description || i.label).join('; ')}.`
          : 'All mandatory diagnostic checkpoints conformed to operational tolerances.'
      } Installed replacement parts: ${partsUsed || 'None required'}. Final operational testing verified stable performance parameters.`;

      const recommendation = `Recommend periodic observation during continuous load duty. Inspect ambient ventilation and schedule next routine preventive maintenance per manufacturer hours interval.`;

      return res.json({ summary, recommendation });
    }

    const prompt = `You are a certified senior industrial machinery and field service operations specialist.
Generate a concise, highly professional "Work Performed" summary and "Technical Recommendations" for a service Job Card.

Context:
- Problem Reported: ${problemReported || 'Standard service'}
- Inspection checklist issues: ${JSON.stringify(checklist?.filter((c: any) => c.status === 'Issue Found') || [])}
- Parts installed: ${JSON.stringify(parts || [])}
- Engineer's initial notes: ${currentNotes || 'None'}

Return a JSON object with:
{
  "summary": "Detailed, technical 2-4 sentence narrative of work performed in past tense",
  "recommendations": "Actionable, technical guidance for the plant manager or maintenance crew"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      summary: parsed.summary || 'Completed service procedure and verified equipment operation.',
      recommendations: parsed.recommendations || 'Maintain standard operational monitoring schedule.',
    });
  } catch (error: any) {
    console.error('Error in service-summary:', error);
    res.status(500).json({
      error: 'Failed to generate summary with AI',
      fallback: 'Completed inspection, addressed identified faults, installed specified replacement components, and verified baseline operating parameters.',
    });
  }
});

// 3. AI: Check Job Card & Inconsistency Detection
app.post('/api/ai/check-jobcard', async (req, res) => {
  try {
    const { jobCard } = req.body;
    const ai = getGeminiClient();

    // Check pricing variances programmatically first
    const pricingVariances = (jobCard?.parts || []).map((p: any) => {
      const std = p.standardPrice || p.unitPrice;
      const applied = p.unitPrice;
      const diffPct = std > 0 ? Math.round(((applied - std) / std) * 100) : 0;
      let flag: 'normal' | 'attention' | 'critical' = 'normal';
      if (Math.abs(diffPct) > 15) flag = 'critical';
      else if (Math.abs(diffPct) > 5) flag = 'attention';

      return {
        partNumber: p.partNumber,
        partName: p.description,
        standardPrice: std,
        appliedPrice: applied,
        differencePct: diffPct,
        flag,
        message: diffPct !== 0 
          ? `Applied price ₹${applied} is ${diffPct > 0 ? '+' : ''}${diffPct}% compared to master inventory reference ₹${std}.` 
          : `Applied price aligns with master inventory catalog.`
      };
    });

    if (!ai) {
      // Deterministic intelligent validation fallback
      const issuesFound = (jobCard?.checklist || []).filter((c: any) => c.status === 'Issue Found');
      const missingRequired: string[] = [];
      const warnings: string[] = [];

      if (!jobCard?.workPerformed || jobCard.workPerformed.length < 15) {
        missingRequired.push('Work performed narrative is too brief or missing');
      }
      if (!jobCard?.customerName) missingRequired.push('Customer details are incomplete');
      if (!jobCard?.equipmentName) missingRequired.push('Equipment details are incomplete');
      
      const uninspected = (jobCard?.checklist || []).filter((c: any) => c.status === 'Pending');
      if (uninspected.length > 0) {
        missingRequired.push(`${uninspected.length} checklist item(s) remain uninspected`);
      }

      const inconsistencies = [];
      const probLower = (jobCard?.problemReported || '').toLowerCase();
      const workLower = (jobCard?.workPerformed || '').toLowerCase();

      if (probLower.includes('overheating') || probLower.includes('temperature') || probLower.includes('thermal')) {
        if (!workLower.includes('cooling') && !workLower.includes('radiator') && !workLower.includes('temperature') && !workLower.includes('overheat') && !workLower.includes('fan') && !workLower.includes('coolant')) {
          inconsistencies.push({
            title: 'Potential Diagnosis Inconsistency',
            reportedIssue: jobCard?.problemReported || 'Thermal overheating reported',
            workPerformed: jobCard?.workPerformed || 'Filter / general maintenance',
            recommendation: 'Confirm whether overheating root-cause was fully resolved after component replacement, or if radiator/coolant checks are also warranted.',
            severity: 'warning' as const,
          });
        }
      }

      if (issuesFound.length > 0 && (!jobCard?.parts || jobCard.parts.length === 0) && !workLower.includes('repaired without parts')) {
        warnings.push(`${issuesFound.length} issue(s) were flagged during checklist inspection, but no replacement parts or materials were recorded.`);
      }

      const executiveSummary = `Job Card ${jobCard?.id || ''} review: ${
        missingRequired.length === 0 ? 'Mandatory fields are populated.' : `${missingRequired.length} required item(s) require attention.`
      } ${
        pricingVariances.some((pv: any) => pv.flag !== 'normal') ? 'Commercial attention: inventory pricing variance detected.' : 'Pricing aligns with catalogue.'
      } Ready for supervisory evaluation.`;

      return res.json({
        completenessCheck: {
          isComplete: missingRequired.length === 0,
          missingRequired,
          warnings,
        },
        inconsistencies,
        pricingVariances,
        executiveSummary,
        lastCheckedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    }

    const prompt = `You are an enterprise service operations quality auditor reviewing a completed Job Card for manager signoff.
Inspect this Job Card data:
${JSON.stringify({
  id: jobCard?.id,
  customer: jobCard?.customerName,
  equipment: jobCard?.equipmentName,
  serviceType: jobCard?.serviceType,
  problemReported: jobCard?.problemReported,
  checklist: jobCard?.checklist,
  parts: jobCard?.parts,
  workPerformed: jobCard?.workPerformed,
  recommendations: jobCard?.recommendations,
})}

Output JSON adhering strictly to:
{
  "completenessCheck": {
    "isComplete": true/false,
    "missingRequired": ["list of critical missing data"],
    "warnings": ["list of advisory notices"]
  },
  "inconsistencies": [
    {
      "title": "Short title",
      "reportedIssue": "What the customer reported",
      "workPerformed": "What the engineer did",
      "recommendation": "Auditor suggestion e.g. confirm whether overheating was resolved",
      "severity": "warning"
    }
  ],
  "executiveSummary": "2-sentence executive summary synthesizing the job for the manager"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      completenessCheck: parsed.completenessCheck || { isComplete: true, missingRequired: [], warnings: [] },
      inconsistencies: parsed.inconsistencies || [],
      pricingVariances,
      executiveSummary: parsed.executiveSummary || 'Job card reviewed. Ready for supervisory decision.',
      lastCheckedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  } catch (error: any) {
    console.error('Error in check-jobcard:', error);
    res.status(500).json({ error: 'AI check failed' });
  }
});

// 4. AI: Suggest Parts from Inventory
app.post('/api/ai/suggest-parts', async (req, res) => {
  try {
    const { equipmentName, problemReported, availableInventory } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // Intelligent keyword-matching fallback
      const text = `${equipmentName || ''} ${problemReported || ''}`.toLowerCase();
      const suggestions = (availableInventory || []).filter((item: any) => {
        const itemDesc = (item.description || '').toLowerCase();
        const cat = (item.category || '').toLowerCase();
        if (text.includes('filter') || text.includes('intake') || text.includes('dust')) {
          if (cat.includes('filtration') || itemDesc.includes('filter')) return true;
        }
        if (text.includes('leak') || text.includes('seal') || text.includes('oil')) {
          if (cat.includes('seal') || itemDesc.includes('seal') || itemDesc.includes('gasket')) return true;
        }
        if (text.includes('temperature') || text.includes('sensor') || text.includes('temp') || text.includes('overheat')) {
          if (itemDesc.includes('probe') || itemDesc.includes('sensor') || itemDesc.includes('gasket')) return true;
        }
        return false;
      });

      return res.json({
        suggestions: suggestions.slice(0, 3),
        reason: 'Selected based on equipment category and reported symptom diagnostics.',
      });
    }

    const prompt = `Based on the equipment "${equipmentName}" and reported problem "${problemReported}", identify which of the following inventory parts are most applicable.
Available inventory:
${JSON.stringify(availableInventory || [])}

Return JSON:
{
  "suggestedPartNumbers": ["FLT-AC-029", "SEAL-HYD-11"],
  "reason": "Brief technical justification"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const parsed = JSON.parse(response.text || '{}');
    const matchedParts = (availableInventory || []).filter((item: any) =>
      (parsed.suggestedPartNumbers || []).includes(item.partNumber)
    );

    return res.json({
      suggestions: matchedParts,
      reason: parsed.reason || 'Recommended based on typical failure modes.',
    });
  } catch (error: any) {
    console.error('Error in suggest-parts:', error);
    res.status(500).json({ suggestions: [], reason: 'Failed to query suggestions' });
  }
});

// Vite Middleware integration for SPA dev and production static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Job Card System Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
