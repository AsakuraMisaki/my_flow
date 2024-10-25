
import { LGraph, LGraphCanvas, LiteGraph } from "litegraph.js";
import * as E from "./type_el.js"
import * as R from "./type_reflect.js"
import * as B from "./type_el.js"
import * as F from "./type_feature.js"

const socket = new WebSocket('ws://localhost:5173/');
socket.addEventListener('open', (event) => {
  console.warn('WebSocket 已连接');
  // 发送消息到服务器
  socket.send(JSON.stringify({ ctx:1, obj:{ a:'Hello, 服务器' } }));
});


console.warn(F);
function register(m){
  m = m.default || m;
  for(let key in m){
    let data = m[key];
    // console.log(data);
    if(typeof(data) == 'function' && data.title){
      LiteGraph.registerNodeType(`${data.ctxgroup || m.ctx.group}/${data.title.toLowerCase()}`, data);
    }
  }
}

function tryAddBasicInput(_this, ...props){
  props.forEach((p)=>{
    let type = p.type;
    _this.addInput(p.key, type);
    let wtype = type;
    if(Array.isArray(type)){
      wtype = type[0];
    }
    if(/number/i.test(wtype)){
      _this.addProperty(p.key, 0.0);
    }
    else{
      _this.addProperty(p.key, p.key);
    }
    
    _this[`${p.key}_widget`] = _this.addWidget(wtype, p.key, "", p.key);
  })
  // _this.widgets_up = true;
}
function simpleNumber(value){
  
  value = value || 0;
  return Number(value);
}
function simpleArray(value){
  
  if(value == undefined) return [];
  if(Array.isArray(value)){
    return value;
  }
  value = [value];
  return value;
}
function simpleValue(value){
  
  return value;
}
function tryCustomPropOutput(_this, trans, indexs){
  let obj = { type: _this.type };
  indexs.forEach((i)=>{
    let temp = _this.getInputData(i);
    if(temp == undefined && (_this.widgets && _this.widgets[i])){
      temp = _this.widgets[i].value;
    }
    let value = temp;
    if(value && value.R && /reflect\/r/i.test(value.type));
    else{
      value = trans(temp);
    }
    let key = _this.getInputInfo(i).name;
    obj[key] = value;
  })
  return obj;
}
function tryCustomArrayOutput(_this, trans, indexs){
  let array = [];
  indexs.forEach((i)=>{
    let temp = _this.getInputData(i);
    let value = trans(temp);
    array.push(value);
  })
  return array;
}

register(E)
register(R)
register(B)
register(F)

export { 
  simpleValue, 
  tryCustomArrayOutput, 
  tryCustomPropOutput, 
  tryAddBasicInput, 
  simpleNumber, 
  simpleArray,
  socket
}