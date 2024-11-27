const WebSocket = require('ws');

// 创建 WebSocket 服务器
const wss = new WebSocket.Server({ port: 5173 });

wss.on('connection', (ws) => {
  ws.on('message', typeMessage);
});

const SEND_BP_DATA = /SEND_BP_DATA/i;
const BLOCKLY_JSON_OLD = /BLOCKLY_JSON_OLD/i;
const BLOCKLY_BUILT_WITH_JSON = /BLOCKLY_BUILT_WITH_JSON/i;
let lastCtx = "";

function typeMessage(message){
  try{
    let data = JSON.parse(message);
    if(data.type == BLOCKLY_JSON_OLD){
      console.log(data);
    }
  }catch(e){
    console.error(e);
  }
}

console.log('WebSocket 服务器已启动，监听 3000 端口');
