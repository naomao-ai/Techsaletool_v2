import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';
import { build } from 'vite';
import ExcelJS from 'exceljs';
import { handleExportExcel } from './exportExcelHandler.ts';

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: '*' }
  });

  const PORT = 3000;

  // Add JSON parsing middleware
  app.use(express.json({ limit: '50mb' }));

  // 1. Socket.IO Lock Event Handlers
  const editingStatus: Record<string, string> = {}; // id -> socketId

  io.on('connection', (socket) => {
    socket.on('request-lock', (id: string, callback: (res: { success: boolean }) => void) => {
      if (editingStatus[id] && editingStatus[id] !== socket.id) {
        callback({ success: false });
      } else {
        editingStatus[id] = socket.id;
        callback({ success: true });
        io.emit('editing-status-update', editingStatus);
      }
    });

    socket.on('release-lock', (id: string) => {
      if (editingStatus[id] === socket.id) {
        delete editingStatus[id];
        io.emit('editing-status-update', editingStatus);
      }
    });

    socket.on('disconnect', () => {
      let changed = false;
      for (const [id, sId] of Object.entries(editingStatus)) {
        if (sId === socket.id) {
          delete editingStatus[id];
          changed = true;
        }
      }
      if (changed) {
        io.emit('editing-status-update', editingStatus);
      }
    });
  });

  // 2. Server setup scaffolding
  const dataDir = path.join(process.cwd(), 'data');
  const serverConfigPath = path.join(dataDir, 'server_config.json');
  const workspaceActivePath = path.join(dataDir, 'workspace_active.json');

  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  
  if (!fs.existsSync(serverConfigPath)) {
    fs.writeFileSync(serverConfigPath, JSON.stringify({ activeDataPath: workspaceActivePath }, null, 2));
  }
  
  if (!fs.existsSync(workspaceActivePath)) {
    fs.writeFileSync(workspaceActivePath, JSON.stringify({}));
  }

  // Config APIs
  app.get('/api/config/server-config', (req, res) => {
    try {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      const configStr = fs.readFileSync(serverConfigPath, 'utf-8');
      const config = JSON.parse(configStr);
      // Inject current working directory so the frontend can know desktop running path
      config.cwd = process.cwd();
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.post('/api/config/server-config', (req, res) => {
    try {
      fs.writeFileSync(serverConfigPath, JSON.stringify(req.body, null, 2));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // 3. Local file JSON API
  app.post('/api/save-to-path', (req, res) => {
    try {
      const { filePath, content } = req.body;
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.post('/api/load-from-path', (req, res) => {
    try {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      const { filePath } = req.body;
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
      }
      const fileData = fs.readFileSync(filePath, 'utf-8');
      res.json(JSON.parse(fileData));
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.post('/api/import-to-shared', (req, res) => {
    try {
      const { state } = req.body;
      const configStr = fs.readFileSync(serverConfigPath, 'utf-8');
      const config = JSON.parse(configStr);
      
      const activePath = config.activeDataPath;
      if (activePath) {
        const dir = path.dirname(activePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(activePath, JSON.stringify(state, null, 2));
      }
      
      io.emit('force-reload-data');
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // 4. Changelog APIs
  app.post('/api/append-changelog', (req, res) => {
    try {
      const { projectPath, log } = req.body;
      const parentDir = path.dirname(projectPath) || process.cwd();
      const changelogDir = path.join(parentDir, 'changelogs');
      if (!fs.existsSync(changelogDir)) {
         fs.mkdirSync(changelogDir, { recursive: true });
      }
      
      const today = new Date().toISOString().split('T')[0];
      const filepath = path.join(changelogDir, `${today}.jsonl`);
      
      fs.appendFileSync(filepath, JSON.stringify(log) + '\n');
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.post('/api/export-excel', (req, res) => handleExportExcel(req, res, serverConfigPath));

  app.post('/api/read-changelog', (req, res) => {
    try {
      const { projectPath, date } = req.body;
      const today = date || new Date().toISOString().split('T')[0];
      const parentDir = path.dirname(projectPath) || process.cwd();
      const filepath = path.join(parentDir, 'changelogs', `${today}.jsonl`);
      
      if (!fs.existsSync(filepath)) {
        return res.json([]);
      }
      
      const lines = fs.readFileSync(filepath, 'utf-8').split('\n').filter(Boolean);
      const parsedLogs = lines.map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          return null;
        }
      }).filter(Boolean);
      
      res.json(parsedLogs);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // 5. Offline Build API
  app.post('/api/download-offline', async (req, res) => {
    try {
      const { state } = req.body;
      
      await build({
        build: {
          emptyOutDir: false
        },
        define: {
           isTauri: false
        }
      });
      
      const distPath = path.join(process.cwd(), 'dist', 'index.html');
      let html = await fsPromises.readFile(distPath, 'utf-8');
      
      const safeJsonPayload = JSON.stringify(state).replace(/</g, '\\u003c');
      const stateScript = `<script>window.OFFLINE_DATA = ${safeJsonPayload};</script>`;
      if (html.includes('<!-- OFFLINE_DATA_PLACEHOLDER -->')) {
         html = html.replace('<!-- OFFLINE_DATA_PLACEHOLDER -->', stateScript);
      } else {
         // fallback: inject into head
         html = html.replace('</head>', `${stateScript}</head>`);
      }
      
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', 'attachment; filename="offline_app.html"');
      res.send(html);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: String(error) });
    }
  });

  // 6. Vite Express route handling
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
