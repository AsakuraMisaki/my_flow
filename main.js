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

  graph.start(1000);

  readyTest();

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
}

function loadTest() {
  const last = `{"last_node_id":3,"last_link_id":2,"nodes":[{"id":3,"type":"feature/dynamic","pos":[476,407],"size":{"0":140,"1":66},"flags":{},"order":0,"mode":0,"inputs":[{"name":"layout","type":"layout","link":null},{"name":"source","type":"array","link":null},{"name":"instances","type":"array","link":null}],"outputs":[{"name":"self","type":"feature","links":[1],"slot_index":0}],"properties":{"precision":1}},{"id":1,"type":"pixijs/ctx","pos":[1007,208],"size":{"0":140,"1":66},"flags":{},"order":2,"mode":0,"inputs":[{"name":"ctx","type":"pixijs","link":2},{"name":"ip","type":"string","link":null},{"name":"global_name","type":"string","link":null}],"properties":{"precision":1}},{"id":2,"type":"pixijs/window","pos":[700,200],"size":{"0":140,"1":146},"flags":{},"order":1,"mode":0,"inputs":[{"name":"x","type":"number","link":null},{"name":"y","type":"number","link":null},{"name":"width","type":"number","link":null},{"name":"height","type":"number","link":null},{"name":"alpha","type":"number","link":null},{"name":"children","type":"array","link":null},{"name":"features","type":["array","feature"],"link":1}],"outputs":[{"name":"self","type":"pixijs","links":[2],"slot_index":0}],"properties":{"precision":1}}],"links":[[1,3,0,2,6,["array","feature"]],[2,2,0,1,0,"pixijs"]],"groups":[],"config":{},"extra":{},"version":0.4}`
  graph.configure(JSON.parse(last));
}

window.loadTest = loadTest;