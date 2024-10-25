const WebSocket = require('ws');

// 创建 WebSocket 服务器
const wss = new WebSocket.Server({ port: 5173 });
let lastCtx = ""
wss.on('connection', (ws) => {
  // console.log('客户端已连接');

  // 处理客户端发送的消息
  ws.on('message', (message) => {

    if(message == "requesting_ctx"){
      ws.send(lastCtx);
    }
    
    message = message.toString();
    console.log(message);
    try{
      let data = JSON.parse(message);
      if(data.ctx){
        lastCtx = message;
      }
    }catch(e){
      console.error(e);
    }
    // console.log('收到消息:', message.toString());
    // // 可以选择回应客户端
    // ws.send('服务器已收到你的消息: ' + message);
  });
});

console.log('WebSocket 服务器已启动，监听 3000 端口');
