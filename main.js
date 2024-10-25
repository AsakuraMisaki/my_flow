import { LGraph, LGraphCanvas, LiteGraph } from "litegraph.js";
import * as PIXIJS from "./graph/pixijs/main.js";

(() => {
  function ev() { this.init(...arguments) };
  ev.prototype.constructor = ev;
  ev.prototype.init = function () {
    this.events = new Map();
  }
  ev.prototype.on = function (name, cb, z = 1, once = false) {
    let list = this.events.get(name);
    if (!list) {
      this.events.set(name, new Map());
      return this.on(...arguments);
    }
    let size = list.size;
    list.set(cb, { z, once, size });
    let newList = this.sort(list);
    this.events.set(name, newList);
    return cb;
  }
  ev.prototype.sort = function (list) {
    let temp = Array.from(list.entries());
    temp.sort((a, b) => {
      let z = b.z - a.z; //层级越高 越先执行
      if (!z) {
        return a.size - b.size; //按添加顺序执行
      }
      return z;
    })
    return new Map(temp);
  }
  ev.prototype.clear = function () {
    this.events.clear();
  }
  ev.prototype.once = function (name, cb, z = 1) {
    return this.on(name, cb, z, true);
  }
  ev.prototype.off = function (name, cb) {
    if (!cb) {
      this.events.delete(name);
      return;
    }
    let list = this.events.get(name);
    list.delete(cb);
  }
  ev.prototype.emitonly = function (name, cb, ...args) {
    let list = this.events.get(name);
    if (!list) return;
    let options = list.get(cb);
    this._emit(options, cb, list, args);
  }
  ev.prototype.emit = function (name, ...args) {
    let list = this.events.get(name);
    if (!list) return;
    list.forEach((options, cb, list) => {
      this._emit(options, cb, list, ...args);
    })
    return;
  }
  ev.prototype._emit = function (options, cb, list, ...args) {
    cb(...args);
    if (options.once) {
      list.delete(cb);
    }
  }

  window.EV = new ev();
})();

let graph;
window.onload = function () {
  ready();
  window.graph = graph;
}

function ready() {
  graph = new LGraph();
  let canvas = document.getElementById("graph");
  const width = document.body.clientWidth;
  const hegiht = document.body.clientHeight;
  canvas.width = canvas.style.width = width;
  canvas.height = canvas.style.height = hegiht;
  new LGraphCanvas(canvas, graph);

  

  readyTest();
  graph.start(1000);
}

function simpleDiscard(...types) {
  for (let key in LiteGraph.registered_node_types) {
    types.forEach((t) => {
      let re = new RegExp(`^${t}`, "is");
      if (re.test(key)) {
        LiteGraph.unregisterNodeType(key);
      }
    })
  }
}

function readyTest() {
  let ctx = LiteGraph.createNode("pixijs/ctx");
  ctx.pos = [700, 200];
  graph.add(ctx);


  let window = LiteGraph.createNode("pixijs/window");
  window.pos = [200, 200];
  graph.add(window);

  // window.connect()

  simpleDiscard("audio", "input", "events", "geometry", "midi", "network", "math3d", "widget");
  EV.emit("ready");
  loadTest();
}

const last = 
'{"last_node_id":34,"last_link_id":44,"nodes":[{"id":11,"type":"reflect/staticarray2","pos":[-200,991],"size":{"0":140,"1":46},"flags":{"collapsed":false},"order":18,"mode":0,"inputs":[{"name":1,"type":0,"link":5},{"name":2,"type":0,"link":null}],"outputs":[{"name":"array","type":"array","links":[6],"slot_index":0}],"properties":{"precision":1}},{"id":12,"type":"feature/haskey","pos":[382,780],"size":[100,40],"flags":{},"order":23,"mode":0,"inputs":[{"name":"","type":"pixijs","link":7}],"outputs":[{"name":"instance","type":"reflect","links":[10],"slot_index":0}],"properties":{"precision":1,"key":"key"}},{"id":6,"type":"reflect/staticarray2","pos":[-160,698],"size":{"0":140,"1":46},"flags":{},"order":19,"mode":0,"inputs":[{"name":1,"type":0,"link":2},{"name":2,"type":0,"link":null}],"outputs":[{"name":"array","type":"array","links":[1],"slot_index":0}],"properties":{"precision":1}},{"id":16,"type":"basic/const","pos":[-1018,727],"size":[180,30],"flags":{},"order":0,"mode":0,"outputs":[{"name":"value","type":"number","links":[14,15],"label":"1.000","slot_index":0}],"properties":{"value":1}},{"id":4,"type":"reflect/r","pos":[-686,1011],"size":[105,40],"flags":{"collapsed":false},"order":1,"mode":0,"outputs":[{"name":"R","type":"reflect","links":[18],"slot_index":0}],"properties":{"precision":1}},{"id":10,"type":"feature/cut_tile","pos":[-479,1011],"size":{"0":210,"1":146},"flags":{},"order":13,"mode":0,"inputs":[{"name":"index","type":["number","reflect"],"link":18},{"name":"pw","type":["number","reflect"],"link":19},{"name":"ph","type":["number","reflect"],"link":null}],"outputs":[{"name":"self","type":"feature","links":[5],"slot_index":0}],"properties":{"precision":1}},{"id":23,"type":"reflect/staticobject4","pos":[654,281],"size":{"0":210,"1":110},"flags":{},"order":10,"mode":0,"inputs":[{"name":"","type":0,"link":30},{"name":"","type":0,"link":31},{"name":"","type":0,"link":32},{"name":"","type":0,"link":33}],"outputs":[{"name":"object","type":"object","links":[26,27,28,29],"slot_index":0}],"properties":{"precision":1,"id0":"id0","id1":"id1","id2":"id2","id3":"id3"}},{"id":24,"type":"basic/boolean","pos":[381,286],"size":[140,30],"flags":{},"order":2,"mode":0,"outputs":[{"name":"bool","type":"boolean","links":[30,31,32,33],"slot_index":0}],"properties":{"value":true},"widgets_values":[true]},{"id":22,"type":"reflect/staticarray4","pos":[1231,483],"size":{"0":140,"1":86},"flags":{},"order":16,"mode":0,"inputs":[{"name":1,"type":0,"link":26},{"name":2,"type":0,"link":27},{"name":3,"type":0,"link":28},{"name":4,"type":0,"link":29}],"outputs":[{"name":"array","type":"array","links":[25],"slot_index":0}],"properties":{"precision":1}},{"id":26,"type":"basic/const","pos":[1160,362],"size":[180,30],"flags":{"collapsed":true},"order":3,"mode":0,"outputs":[{"name":"value","type":"number","links":[35],"label":"10.000","slot_index":0}],"properties":{"value":10}},{"id":25,"type":"feature/dynamic_grid","pos":[1290,349],"size":{"0":140,"1":26},"flags":{},"order":11,"mode":0,"inputs":[{"name":"col","type":["number","reflect"],"link":35}],"outputs":[{"name":"self","type":"layout","links":[34],"slot_index":0}],"properties":{"precision":1}},{"id":8,"type":"reflect/staticarray1","pos":[-179,551],"size":{"0":140,"1":26},"flags":{},"order":20,"mode":0,"inputs":[{"name":1,"type":0,"link":3}],"outputs":[{"name":"array","type":"array","links":[4],"slot_index":0}],"properties":{"precision":1}},{"id":27,"type":"feature/style","pos":[-837,493],"size":{"0":152.8000030517578,"1":106},"flags":{},"order":12,"mode":0,"inputs":[{"name":"size","type":["number","reflect"],"link":37},{"name":"color","type":["color","reflect","string"],"link":38},{"name":"outline","type":["color","reflect","string"],"link":39},{"name":"outline_width","type":["number","reflect"],"link":null},{"name":"align","type":["string","reflect"],"link":null}],"outputs":[{"name":"self","type":"feature","links":[36],"slot_index":0}],"properties":{"precision":1}},{"id":28,"type":"basic/const","pos":[-973,491],"size":[180,30],"flags":{"collapsed":true},"order":4,"mode":0,"outputs":[{"name":"value","type":"number","links":[37],"label":"36.000","slot_index":0}],"properties":{"value":36}},{"id":29,"type":"basic/string","pos":[-1007,548],"size":[180,30],"flags":{"collapsed":true},"order":5,"mode":0,"outputs":[{"name":"string","type":"string","links":[38,39],"slot_index":0}],"properties":{"value":"#aabbcc"}},{"id":1,"type":"pixijs/ctx","pos":[2247,279],"size":{"0":210,"1":122},"flags":{},"order":32,"mode":0,"inputs":[{"name":"ctx","type":"pixijs","link":20},{"name":"ip","type":"string","link":null},{"name":"global_name","type":"string","link":null}],"properties":{"precision":1,"ip":"ip","global_name":"global_name"}},{"id":15,"type":"reflect/staticobject2","pos":[-690,722],"size":{"0":210,"1":62},"flags":{},"order":9,"mode":0,"inputs":[{"name":"","type":0,"link":14},{"name":"","type":0,"link":15}],"outputs":[{"name":"object","type":"object","links":[13],"slot_index":0}],"properties":{"precision":1,"id0":"id999","id1":"i33"}},{"id":18,"type":"pixijs/window","pos":[1818,277],"size":{"0":210,"1":274},"flags":{},"order":31,"mode":0,"inputs":[{"name":"x","type":"number","link":null},{"name":"y","type":"number","link":null},{"name":"width","type":"number","link":null},{"name":"height","type":"number","link":null},{"name":"alpha","type":"number","link":null},{"name":"children","type":"array","link":null},{"name":"features","type":["array","feature"],"link":21}],"outputs":[{"name":"self","type":"pixijs","links":[20],"slot_index":0}],"properties":{"precision":1,"x":0,"y":null,"width":300,"height":900,"alpha":1}},{"id":3,"type":"pixijs/sprite","pos":[87,538],"size":{"0":210,"1":274},"flags":{"collapsed":false},"order":22,"mode":0,"inputs":[{"name":"x","type":"number","link":null},{"name":"y","type":"number","link":null},{"name":"width","type":"number","link":null},{"name":"height","type":"number","link":null},{"name":"alpha","type":"number","link":null},{"name":"children","type":"array","link":4},{"name":"features","type":["array","feature"],"link":1}],"outputs":[{"name":"self","type":"pixijs","links":[8],"slot_index":0}],"properties":{"precision":1,"x":0,"y":0,"width":120,"height":120,"alpha":1}},{"id":9,"type":"pixijs/sprite","pos":[89,905],"size":{"0":210,"1":274},"flags":{"collapsed":false},"order":21,"mode":0,"inputs":[{"name":"x","type":"number","link":null},{"name":"y","type":"number","link":null},{"name":"width","type":"number","link":null},{"name":"height","type":"number","link":null},{"name":"alpha","type":"number","link":null},{"name":"children","type":"array","link":null},{"name":"features","type":["array","feature"],"link":6}],"outputs":[{"name":"self","type":"pixijs","links":[7],"slot_index":0}],"properties":{"precision":1,"x":0,"y":0,"width":20,"height":20,"alpha":1}},{"id":17,"type":"reflect/r","pos":[-682,1097],"size":[105,40],"flags":{},"order":6,"mode":0,"outputs":[{"name":"R","type":"reflect","links":[19],"slot_index":0}],"properties":{"precision":1}},{"id":7,"type":"pixijs/text","pos":[-563,422],"size":{"0":210,"1":186},"flags":{},"order":17,"mode":0,"inputs":[{"name":"x","type":"number","link":null},{"name":"y","type":"number","link":null},{"name":"alpha","type":"number","link":null},{"name":"children","type":"array","link":null},{"name":"features","type":["array","feature"],"link":36}],"outputs":[{"name":"self","type":"pixijs","links":[3],"slot_index":0}],"properties":{"precision":1,"x":0,"y":0,"alpha":1}},{"id":5,"type":"feature/cut_object","pos":[-400,710],"size":{"0":140,"1":26},"flags":{"collapsed":false},"order":15,"mode":0,"inputs":[{"name":"object","type":["object","reflect"],"link":13}],"outputs":[{"name":"self","type":"feature","links":[2],"slot_index":0}],"properties":{"precision":1}},{"id":19,"type":"feature/dynamic","pos":[1507,598],"size":{"0":140,"1":66},"flags":{},"order":30,"mode":0,"inputs":[{"name":"layout","type":"layout","link":34},{"name":"source","type":"array","link":25},{"name":"instances","type":"array","link":24}],"outputs":[{"name":"self","type":"feature","links":[21],"slot_index":0}],"properties":{"precision":1}},{"id":20,"type":"reflect/staticarray1","pos":[1339,690],"size":{"0":140,"1":26},"flags":{},"order":29,"mode":0,"inputs":[{"name":1,"type":0,"link":23}],"outputs":[{"name":"array","type":"array","links":[24],"slot_index":0}],"properties":{"precision":1}},{"id":21,"type":"feature/haskey","pos":[1213,725],"size":[100,40],"flags":{},"order":28,"mode":0,"inputs":[{"name":"","type":"pixijs","link":22}],"outputs":[{"name":"instance","type":"reflect","links":[23],"slot_index":0}],"properties":{"precision":1,"key":"key"}},{"id":2,"type":"pixijs/window","pos":[951,797],"size":{"0":210,"1":274},"flags":{},"order":27,"mode":0,"inputs":[{"name":"x","type":"number","link":null},{"name":"y","type":"number","link":null},{"name":"width","type":"number","link":null},{"name":"height","type":"number","link":null},{"name":"alpha","type":"number","link":null},{"name":"children","type":"array","link":null},{"name":"features","type":["array","feature"],"link":40}],"outputs":[{"name":"self","type":"pixijs","links":[22],"slot_index":0}],"properties":{"precision":1,"x":0,"y":0,"width":100,"height":100,"alpha":1}},{"id":14,"type":"reflect/staticarray2","pos":[541,694],"size":{"0":140,"1":46},"flags":{},"order":25,"mode":0,"inputs":[{"name":1,"type":0,"link":9},{"name":2,"type":0,"link":10}],"outputs":[{"name":"array","type":"array","links":[41],"slot_index":0}],"properties":{"precision":1}},{"id":32,"type":"feature/dynamic_grid","pos":[586,541],"size":{"0":140,"1":26},"flags":{},"order":14,"mode":0,"inputs":[{"name":"col","type":["number","reflect"],"link":43}],"outputs":[{"name":"self","type":"layout","links":[42],"slot_index":0}],"properties":{"precision":1}},{"id":33,"type":"basic/const","pos":[335,466],"size":[180,30],"flags":{},"order":7,"mode":0,"outputs":[{"name":"value","type":"number","links":[43],"label":"10.000","slot_index":0}],"properties":{"value":10}},{"id":31,"type":"feature/dynamic","pos":[788,699],"size":{"0":140,"1":66},"flags":{},"order":26,"mode":0,"inputs":[{"name":"layout","type":"layout","link":42},{"name":"source","type":"array","link":44},{"name":"instances","type":"array","link":41}],"outputs":[{"name":"self","type":"feature","links":[40],"slot_index":0}],"properties":{"precision":1}},{"id":34,"type":"reflect/staticarray2","pos":[560,632],"size":{"0":140,"1":46},"flags":{"collapsed":true},"order":8,"mode":0,"inputs":[{"name":1,"type":0,"link":null},{"name":2,"type":0,"link":null}],"outputs":[{"name":"array","type":"array","links":[44],"slot_index":0}],"properties":{"precision":1}},{"id":13,"type":"feature/haskey","pos":[395,610],"size":[100,40],"flags":{},"order":24,"mode":0,"inputs":[{"name":"","type":"pixijs","link":8}],"outputs":[{"name":"instance","type":"reflect","links":[9],"slot_index":0}],"properties":{"precision":1,"key":"key0"}}],"links":[[1,6,0,3,6,["array","feature"]],[2,5,0,6,0,"feature"],[3,7,0,8,0,"pixijs"],[4,8,0,3,5,"array"],[5,10,0,11,0,"feature"],[6,11,0,9,6,["array","feature"]],[7,9,0,12,0,"pixijs"],[8,3,0,13,0,"pixijs"],[9,13,0,14,0,"reflect"],[10,12,0,14,1,"reflect"],[13,15,0,5,0,["object","reflect"]],[14,16,0,15,0,"number"],[15,16,0,15,1,"number"],[18,4,0,10,0,["number","reflect"]],[19,17,0,10,1,["number","reflect"]],[20,18,0,1,0,"pixijs"],[21,19,0,18,6,["array","feature"]],[22,2,0,21,0,"pixijs"],[23,21,0,20,0,"reflect"],[24,20,0,19,2,"array"],[25,22,0,19,1,"array"],[26,23,0,22,0,"object"],[27,23,0,22,1,"object"],[28,23,0,22,2,"object"],[29,23,0,22,3,"object"],[30,24,0,23,0,"boolean"],[31,24,0,23,1,"boolean"],[32,24,0,23,2,"boolean"],[33,24,0,23,3,"boolean"],[34,25,0,19,0,"layout"],[35,26,0,25,0,["number","reflect"]],[36,27,0,7,4,["array","feature"]],[37,28,0,27,0,["number","reflect"]],[38,29,0,27,1,["color","reflect","string"]],[39,29,0,27,2,["color","reflect","string"]],[40,31,0,2,6,["array","feature"]],[41,14,0,31,2,"array"],[42,32,0,31,0,"layout"],[43,33,0,32,0,["number","reflect"]],[44,34,0,31,1,"array"]],"groups":[],"config":{},"extra":{},"version":0.4}'


function loadTest() {
  
  graph.configure(JSON.parse(last));
}

window.loadTest = loadTest;