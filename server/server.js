const WebSocket = require('ws');

// 创建 WebSocket 服务器
const wss = new WebSocket.Server({ port: 8080 });
const clients = {app:new Set(), editor:new Set()};
wss.on('connection', (ws) => {
  ws.on('message', (message)=>{
    typeMessage(message, ws);
  });
  ws.on("close", ()=>{
    clients.app.delete(ws);
    clients.editor.delete(ws);
  })
  ws.send("start");
});

const SEND_BP_DATA = /SEND_BP_DATA/i;
const BLOCKLY_JSON_OLD = /BLOCKLY_JSON_OLD/i;
const BLOCKLY_BUILT_WITH_JSON = /BLOCKLY_BUILT_WITH_JSON/i;

let lastSave = "";
let lastLoad = "";
function typeMessage(message, ws){
  
  try{
    let data = JSON.parse(message);
    if(data.type == "group"){
      clients[data.name].add(ws);
      console.log(data.name, "ok");
      // ws.send(JSON.stringify({type:`${data.type}ok`}));
    }
    else if(data.type == "save"){
      lastSave = JSON.stringify(data);
      console.log("save", clients.app.size);
      clients.app.forEach((client)=>{
        if (client.readyState === WebSocket.OPEN) {
          client.send(lastSave);
        }
      })
    }
    else if(data.type == "load"){
      lastLoad = JSON.stringify(data);
      console.log("load", clients.editor.size);
      clients.editor.forEach((client)=>{
        if (client.readyState === WebSocket.OPEN) {
          client.send(lastLoad);
        }
      })
    }
    else if(clients.app.size){
      clients.app.forEach((client)=>{
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      })
    }
    
  }catch(e){
    console.error(message.toString());
  }
}

console.log('WebSocket 8080');
