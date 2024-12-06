

const {app, BrowserWindow, ipcMain} = require("electron");
const fs = require("node:fs");
const path = require("node:path");
// const server = require("./server/server.js");
// 获取用户数据目录
// const rPath = app.getPath('./');
// const filePath = path.join("./", 'queue.json');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1600,
    height: 980,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  })
  win.loadURL("http://localhost:5173/");
  
  win.webContents.openDevTools({ mode: 'detach' });
}

ipcMain.on("save-file", (event, filePath, data)=>{
  fs.writeFile(filePath, data, (err) => {
    if (err) {
        console.error('Error writing file:', err);
        event.reply('save-file-response', { success: false, error: err.message });
    } else {
        event.reply('save-file-response', { success: true });
    }
  });
})

app.whenReady().then(() => {
  createWindow()
})

// window.onload = function(){
//   // test();
// }

