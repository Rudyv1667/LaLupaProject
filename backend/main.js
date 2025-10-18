import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serverProcess = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Abrimos la URL de nuestro servidor Express
  win.loadURL('http://localhost:3000');
}

// Iniciamos el backend y luego la ventana
app.whenReady().then(() => {
  serverProcess = exec('node server.js');

  serverProcess.stdout.on('data', (data) => console.log(data.toString()));
  serverProcess.stderr.on('data', (err) => console.error(err.toString()));

  createWindow();
});

app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
