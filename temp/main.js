import { LGraph, LGraphCanvas, LiteGraph } from "litegraph.js";
import * as PIXIJS from "../graph/pixijs/main.js";

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
  graph.start(3000);
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
{"last_node_id":65,"last_link_id":88,"nodes":[{"id":42,"type":"pixijs/sprite","pos":[1769,278],"size":{"0":210,"1":274},"flags":{"collapsed":true},"order":6,"mode":0,"inputs":[{"name":"x","type":"number","link":null},{"name":"y","type":"number","link":null},{"name":"width","type":"number","link":null},{"name":"height","type":"number","link":null},{"name":"alpha","type":"number","link":null},{"name":"children","type":"array","link":null},{"name":"features","type":["array","feature"],"link":55}],"outputs":[{"name":"self","type":"pixijs","links":[74],"slot_index":0}],"properties":{"precision":1,"x":0,"y":0,"width":0,"height":0,"alpha":1}},{"id":1,"type":"pixijs/ctx","pos":[2676,299],"size":{"0":210,"1":122},"flags":{},"order":15,"mode":0,"inputs":[{"name":"ctx","type":"pixijs","link":48},{"name":"ip","type":"string","link":null},{"name":"global_name","type":"string","link":null}],"properties":{"precision":1,"ip":"ip","global_name":"global_name"}},{"id":36,"type":"pixijs/window","pos":[2328,311],"size":{"0":210,"1":318},"flags":{},"order":14,"mode":0,"inputs":[{"name":"x","type":"number","link":null},{"name":"y","type":"number","link":null},{"name":"width","type":"number","link":null},{"name":"height","type":"number","link":null},{"name":"alpha","type":"number","link":null},{"name":"windowArea","type":"boolean","link":null},{"name":"children","type":"array","link":75},{"name":"features","type":["array","feature"],"link":null}],"outputs":[{"name":"self","type":"pixijs","links":[48],"slot_index":0}],"properties":{"precision":1,"x":0,"y":0,"width":1920,"height":1080,"alpha":1,"windowArea":"windowArea"}},{"id":51,"type":"reflect/staticarray2","pos":[2105,322],"size":{"0":140,"1":46},"flags":{},"order":13,"mode":0,"inputs":[{"name":1,"type":0,"link":74,"slot_index":0},{"name":2,"type":0,"link":76}],"outputs":[{"name":"array","type":"array","links":[75],"slot_index":0}],"properties":{"precision":1}},{"id":37,"type":"basic/boolean","pos":[1558,470],"size":[140,30],"flags":{},"order":0,"mode":0,"outputs":[{"name":"bool","type":"boolean","links":[77],"slot_index":0}],"properties":{"value":true},"widgets_values":[true]},{"id":52,"type":"pixijs/window","pos":[1811,383],"size":{"0":210,"1":318},"flags":{},"order":12,"mode":0,"inputs":[{"name":"x","type":"number","link":null},{"name":"y","type":"number","link":null},{"name":"width","type":"number","link":null},{"name":"height","type":"number","link":null},{"name":"alpha","type":"number","link":null},{"name":"windowArea","type":"boolean","link":77},{"name":"children","type":"array","link":null},{"name":"features","type":["array","feature"],"link":78}],"outputs":[{"name":"self","type":"pixijs","links":[76],"slot_index":0}],"properties":{"precision":1,"x":270,"y":32,"width":1400,"height":100,"alpha":1,"windowArea":"windowArea"}},{"id":53,"type":"feature/dynamic","pos":[1559,568],"size":{"0":140,"1":66},"flags":{},"order":11,"mode":0,"inputs":[{"name":"layout","type":"layout","link":79},{"name":"source","type":"array","link":81},{"name":"instances","type":"array","link":85}],"outputs":[{"name":"self","type":"feature","links":[78],"slot_index":0}],"properties":{"precision":1}},{"id":54,"type":"feature/dynamic_grid","pos":[1333,524],"size":{"0":210,"1":146},"flags":{"collapsed":true},"order":1,"mode":0,"inputs":[{"name":"col","type":["number","reflect"],"link":null},{"name":"margin_x","type":["number","reflect"],"link":null},{"name":"margin_y","type":["number","reflect"],"link":null}],"outputs":[{"name":"self","type":"layout","links":[79],"slot_index":0}],"properties":{"precision":1,"col":10,"margin_x":0,"margin_y":0}},{"id":57,"type":"reflect/try_copy","pos":[1356,582],"size":{"0":210,"1":78},"flags":{"collapsed":true},"order":2,"mode":0,"inputs":[{"name":"range","type":"number","link":null},{"name":"value","type":0,"link":null}],"outputs":[{"name":"out","type":"array","links":[81],"slot_index":0}],"properties":{"precision":1,"range":10}},{"id":58,"type":"feature/haskey","pos":[1243,682],"size":[100,40],"flags":{},"order":9,"mode":0,"inputs":[{"name":"","type":"pixijs","link":82}],"outputs":[{"name":"instance","type":"reflect","links":[84],"slot_index":0}],"properties":{"precision":1,"key":"id"}},{"id":61,"type":"reflect/staticarray2","pos":[1378,671],"size":{"0":140,"1":46},"flags":{},"order":10,"mode":0,"inputs":[{"name":1,"type":0,"link":84},{"name":2,"type":0,"link":null}],"outputs":[{"name":"array","type":"array","links":[85],"slot_index":0}],"properties":{"precision":1}},{"id":41,"type":"feature/texture","pos":[1471,214],"size":{"0":210,"1":58},"flags":{},"order":3,"mode":0,"inputs":[{"name":"url","type":["string","reflect"],"link":null}],"outputs":[{"name":"instance","type":"feature","links":[55],"slot_index":0}],"properties":{"precision":1,"url":"/img/pictures/test/texture.png"}},{"id":59,"type":"pixijs/sprite","pos":[948,595],"size":{"0":210,"1":274},"flags":{"collapsed":false},"order":8,"mode":0,"inputs":[{"name":"x","type":"number","link":null},{"name":"y","type":"number","link":null},{"name":"width","type":"number","link":null},{"name":"height","type":"number","link":null},{"name":"alpha","type":"number","link":null},{"name":"children","type":"array","link":null},{"name":"features","type":["array","feature"],"link":88}],"outputs":[{"name":"self","type":"pixijs","links":[82],"slot_index":0}],"properties":{"precision":1,"x":0,"y":0,"width":0,"height":0,"alpha":0}},{"id":65,"type":"reflect/staticarray2","pos":[757,768],"size":{"0":140,"1":46},"flags":{},"order":7,"mode":0,"inputs":[{"name":1,"type":0,"link":87},{"name":2,"type":0,"link":86}],"outputs":[{"name":"array","type":"array","links":[88],"slot_index":0}],"properties":{"precision":1}},{"id":63,"type":"feature/texture","pos":[452,834],"size":{"0":210,"1":58},"flags":{"collapsed":false},"order":4,"mode":0,"inputs":[{"name":"url","type":["string","reflect"],"link":null}],"outputs":[{"name":"instance","type":"feature","links":[86],"slot_index":0}],"properties":{"precision":1,"url":"/img/pictures/test/texture.png"}},{"id":64,"type":"feature/cut_object","pos":[454,715],"size":{"0":210,"1":58},"flags":{},"order":5,"mode":0,"inputs":[{"name":"obj","type":["string","object","reflect"],"link":null}],"outputs":[{"name":"self","type":"feature","links":[87],"slot_index":0}],"properties":{"precision":1,"obj":"\"frame\": {         \"x\": 287,         \"y\": 1144,         \"w\": 106,         \"h\": 106       }"}}],"links":[[48,36,0,1,0,"pixijs"],[55,41,0,42,6,["array","feature"]],[74,42,0,51,0,"pixijs"],[75,51,0,36,6,"array"],[76,52,0,51,1,"pixijs"],[77,37,0,52,5,"boolean"],[78,53,0,52,7,["array","feature"]],[79,54,0,53,0,"layout"],[81,57,0,53,1,"array"],[82,59,0,58,0,"pixijs"],[84,58,0,61,0,"reflect"],[85,61,0,53,2,"array"],[86,63,0,65,1,"feature"],[87,64,0,65,0,"feature"],[88,65,0,59,6,["array","feature"]]],"groups":[],"config":{},"extra":{},"version":0.4}
function loadTest() {
  graph.configure(last);
}

window.loadTest = loadTest;