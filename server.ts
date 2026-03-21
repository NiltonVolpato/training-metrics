import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';

const METRICS_FILE = path.join(process.cwd(), 'metrics.csv');

// Ensure the file exists initially with sample data
if (!fs.existsSync(METRICS_FILE)) {
  fs.writeFileSync(METRICS_FILE, `global_step,fidelity,loss,lr
# Epoch 9 start
3450,nan,0.148533,4.173464e-05
3460,nan,0.151485,4.200653e-05
3470,nan,0.147153,4.227841e-05
3480,nan,0.147756,4.255030e-05
3490,nan,0.150412,4.282219e-05
3500,0.861660,0.154443,4.309407e-05
3510,0.861660,0.148007,4.336596e-05
3520,0.861660,0.150168,4.363785e-05
3530,0.861660,0.147791,4.390973e-05
3540,0.861660,0.145398,4.418162e-05
`);
}

function parseCSV(filePath: string) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const data = [];
  
  let headers: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    if (headers.length === 0) {
      headers = trimmed.split(',');
      continue;
    }
    
    const values = trimmed.split(',');
    const row: Record<string, number | null> = {};
    for (let i = 0; i < headers.length; i++) {
      const val = values[i];
      if (val === 'nan' || val === 'NaN') {
        row[headers[i]] = null;
      } else {
        row[headers[i]] = parseFloat(val);
      }
    }
    data.push(row);
  }
  return data;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // SSE endpoint
  app.get('/api/metrics/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send initial data
    const sendData = () => {
      try {
        const data = parseCSV(METRICS_FILE);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (err) {
        console.error('Error parsing CSV:', err);
      }
    };

    sendData();

    // Watch file for changes
    let fsWait: NodeJS.Timeout | null = null;
    const watcher = fs.watch(METRICS_FILE, (event, filename) => {
      if (filename) {
        if (fsWait) return;
        fsWait = setTimeout(() => {
          fsWait = null;
        }, 100); // debounce
        sendData();
      }
    });

    req.on('close', () => {
      watcher.close();
    });
  });

  // Vite middleware for development
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
