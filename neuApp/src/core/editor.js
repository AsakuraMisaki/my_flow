import { Application, Assets, Texture, Container, Rectangle, Graphics, mSDFBit } from "pixi.js";
import { ContainerEntity, Entity, SpriteEntity, TextEntity } from "./Entity.js";
import { Drag } from "../components/drag.js";
import { Drop } from "../components/drop.js";
import { Layer } from "./layer.js";
import { Input } from "./interaction.js";
import { YAML } from "./yaml.js";
import { Hover } from "../components/hover.js";
import { Grid, Layout } from "../components/layout.js";
import { ScreenPrinter } from "./utils.js";
import { list } from "../entities/queue/list.js";


class Editor extends ContainerEntity {
  constructor() {
    super();
    this._layerMaps = new Map();
    // this.renderable = false;

  }

  addLayer(id, options) {
    const L = new Layer();
    Object.assign(L, options);
    L.label = id;
    this._layerMaps.set(id, L);
    this.addChild(L);
    this.children.sort((a, b) => {
      return (a.zIndex || 1) - (b.zIndex || 1);
    })
    return L;
  }

  getLayer(id) {
    const L = this._layerMaps.get(id);
    return L;
  }

  removeLayer(id) {
    const L = this._layerMaps.get(id);
    L.remove();
  }

  onUpdate(delta) {
    super.onUpdate(delta);
    Input.update(delta);
  }

  async onReady() {
    super.onReady();
    await Input.setup(app);
    let qList = new list();
    this.addChild(qList);
  }
}




async function ready() {
  const app = new Application();

  // Initialize the application
  let targetCanvas = document.getElementById("workspace");
  await app.init({ background: '#1099bb', canvas:targetCanvas, resizeTo:targetCanvas });

  // Append the application canvas to the document body
  // document.body.appendChild(app.canvas);

  const renderer = app.renderer;
  const stage = app.stage;

  globalThis.app = app;

  const update = function (ticker) {
    stage.children.forEach((c) => {
      c.update ? c.update(ticker.deltaMS) : null;
    })
  }
  app.ticker.add(update);

  // window.app = app;

  let editor = new Editor();
  stage.addChild(editor);
}

window.onload = function(){
  console.warn("?");
  ready();
}

export { Editor, Input, ready };


