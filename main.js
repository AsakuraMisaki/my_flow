

const {app, BrowserWindow} = require("electron");

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600
  })
  win.loadURL("http://localhost:5173/");
  win.webContents.openDevTools({ mode: 'detach' });
}

app.whenReady().then(() => {
  createWindow()
})

// window.onload = function(){
//   // test();
// }

