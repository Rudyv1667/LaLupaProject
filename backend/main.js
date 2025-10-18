import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serverProcess = null;

function waitForServer(url, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      http.get(url, () => resolve(true)).on('error', () => {
        if (Date.now() - start > timeout) reject(new Error('Server timeout'));
        else setTimeout(check, 100);
      });
    };
    check();
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  win.loadURL('http://localhost:3000').catch(err => console.error(err));
}

app.whenReady().then(async () => {
  serverProcess = exec('node server.js');

  serverProcess.stdout.on('data', (data) => console.log(data.toString()));
  serverProcess.stderr.on('data', (err) => console.error(err.toString()));

  try {
    await waitForServer('http://localhost:3000', 10000); // espera hasta 10s
    createWindow();
  } catch (err) {
    console.error('No se pudo conectar al servidor:', err);
  }
});

app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
