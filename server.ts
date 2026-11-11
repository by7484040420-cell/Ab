import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';

async function startServer() {
  const app = express();
  const PORT = 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // CORS support
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Download Android App / Package ("App wala file")
  app.get('/api/download-apk', (req: Request, res: Response) => {
    const zipPath = path.resolve(process.cwd(), 'public/assets/aistudio/Ab-main__5__443fd235.zip');
    if (fs.existsSync(zipPath)) {
      res.setHeader('Content-Disposition', 'attachment; filename="NaradAI-Android-App-Release.zip"');
      res.setHeader('Content-Type', 'application/zip');
      return fs.createReadStream(zipPath).pipe(res);
    }

    // Fallback: create dynamic info package
    res.setHeader('Content-Disposition', 'attachment; filename="NaradAI-App-Installer.json"');
    res.setHeader('Content-Type', 'application/json');
    res.json({
      name: 'Narad AI Mobile App',
      version: '1.0.0',
      type: 'Android PWA WebAPK & Native Source',
      installInstructions: [
        '1. Open Narad AI in Chrome / Samsung Internet on Android',
        '2. Tap "Install app" or "Add to Home screen"',
        '3. Instant native-like Android WebAPK is installed without Play Store requirement!'
      ]
    });
  });

  // AI Form Auto-Fill Endpoint powered by Gemini API
  app.post('/api/ai-autofill', async (req: Request, res: Response) => {
    const { fields, profile, portalName } = req.body;
    if (!fields || !profile) {
      return res.status(400).json({ error: 'Missing fields or profile data' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (apiKey) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `You are Narad AI, an automated form-filling assistant for Indian official government portals (IRCTC, Parivahan Driving Licence, Passport Seva, Income Tax PAN, College Admissions, SSC, RRB, RTPS).

Candidate Profile Locker:
${JSON.stringify(profile, null, 2)}

Official Website Input Fields detected on "${portalName || 'Government Website'}":
${JSON.stringify(fields, null, 2)}

Instructions:
1. Map each field in the form to the appropriate value from the candidate's profile.
2. For select dropdowns, select the exact matching option text or value from the field's options array.
3. For date fields, provide the value in DD/MM/YYYY or YYYY-MM-DD as appropriate.
4. For checkboxes like declarations, agreements, or "same as permanent address", return true.
5. NEVER fill passwords, ATM pins, or payment card/CVV/UPI fields.

Output strictly valid JSON with no markdown formatting:
{
  "mapping": {
    "field_id_or_name": "value_to_fill"
  }
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        const text = response.text || '{}';
        const parsed = JSON.parse(text);
        return res.json({ success: true, method: 'gemini-api', mapping: parsed.mapping || parsed });
      } catch (err: any) {
        console.warn('Gemini API call failed, falling back to intelligent rule engine:', err.message);
      }
    }

    // Heuristic fallback if no API key is set
    return res.json({ success: true, method: 'heuristic' });
  });

  // Real-Time Web Proxy: Opens ANY Real Official Portal & Injects Narad AI Auto-Fill Engine
  app.get('/api/proxy', async (req: Request, res: Response) => {
    const rawUrl = req.query.url as string;
    if (!rawUrl) {
      return res.status(400).send('Missing url parameter');
    }

    let targetUrl = rawUrl.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    try {
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8',
          'Cache-Control': 'no-cache'
        },
        redirect: 'follow'
      });

      const contentType = response.headers.get('content-type') || 'text/html';

      // Pass non-HTML assets directly
      if (!contentType.includes('text/html')) {
        res.setHeader('Content-Type', contentType);
        const arrayBuf = await response.arrayBuffer();
        return res.send(Buffer.from(arrayBuf));
      }

      // Modify HTML: inject <base> tag and Narad AI Auto-Fill engine
      let html = await response.text();
      const parsedUrl = new URL(targetUrl);
      const baseTag = `<base href="${parsedUrl.protocol}//${parsedUrl.host}/">`;

      // Profile JSON from query if passed
      let profileSnippet = '';
      if (req.query.profile) {
        try {
          const prof = JSON.parse(decodeURIComponent(req.query.profile as string));
          profileSnippet = `<script>window.__naradProfile = ${JSON.stringify(prof)};</script>`;
        } catch {
          // default
        }
      }

      const injection = `
        ${baseTag}
        ${profileSnippet}
        <script src="/narad-injected-engine.js"></script>
      `;

      if (html.includes('<head>')) {
        html = html.replace('<head>', '<head>' + injection);
      } else if (html.includes('<html>')) {
        html = html.replace('<html>', '<html><head>' + injection + '</head>');
      } else {
        html = injection + html;
      }

      // Explicitly allow iframe embedding
      res.removeHeader('X-Frame-Options');
      res.removeHeader('Content-Security-Policy');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('X-Narad-Proxied-Url', targetUrl);
      return res.send(html);
    } catch (err: any) {
      console.warn('Proxy fetch error:', err.message);
      // Return a friendly fallback page allowing direct open + bookmarklet
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Narad AI - Portal Gateway</title>
          <style>
            body { font-family: system-ui, sans-serif; background: #0B1B3F; color: #fff; text-align: center; padding: 40px 20px; }
            .card { background: #162447; max-width: 500px; margin: 0 auto; padding: 30px; border-radius: 16px; border: 2px solid #e53935; }
            h2 { color: #fde047; }
            p { font-size: 14px; line-height: 1.6; color: #cbd5e1; }
            a.btn { display: inline-block; background: #22c55e; color: #fff; font-weight: bold; padding: 12px 24px; border-radius: 10px; text-decoration: none; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>⚡ ${targetUrl}</h2>
            <p>Yeh official portal direct proxy ko restrict kar raha hai.</p>
            <p><strong>Aap seedha official website open karein aur Narad Bookmarklet se 1 second me form auto-fill karein!</strong></p>
            <a class="btn" href="${targetUrl}" target="_blank" rel="noopener noreferrer">Original Site Kholo ↗</a>
          </div>
        </body>
        </html>
      `);
    }
  });

  // Mount Vite or static files
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Narad AI App Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Narad AI server:', err);
  process.exit(1);
});
