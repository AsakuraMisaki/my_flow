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
    await Input.setup();
    let mask = new Graphics();
    mask.rect(0, 0, 900, 500);
    mask.fill(0xffffff, 1);
    // app.stage.addChild(mask);

    let ui = this.addLayer("ui", { zIndex: 8 });
    let texture = await Assets.load("../res/icons.png");
    let baseGrid = ui.addComponent("grid", new Grid(1, 0, 0));
    let testContainer = new ContainerEntity();
    let grid = testContainer.addComponent("grid", new Grid(20, 10, 10));
    let hover = testContainer.addComponent("hover", new Hover().itemAble().itemOnly());

    for (let i = 0; i < 2000; i++) {
      let tex = new Texture(texture);

      let container = new Container();
      let t = new SpriteEntity(tex);
      t.anchor.x = 0.5;
      let tt = new TextEntity("aaaaaaa");
      tt.x += 200;
      t.addChild(tt);

      testContainer.addChild(t);
    }
    grid.refresh();


    this.test1 = new ScreenPrinter(this);

    ui.addChild(this.test1, testContainer);
    // testContainer._timeScale = 0;
    grid.on("transformend", () => {
      baseGrid.refresh();
    })
    grid.on("transformend", () => {
      hover.on("hoverin", (current) => {

        // console.log(current);
        // if(current == testContainer) return;
        current.alpha = 0.5;
      })
      hover.on("hoverout", (old) => {
        // if(old == testContainer) return;
        old.alpha = 1;
      })
      hover.on("hover", (current) => {
        // console.log(current == testContainer);
      })
    })
  }
}


async function ready() {
  const app = new Application();

  // Initialize the application
  await app.init({ background: '#1099bb', resizeTo: globalThis });

  // Append the application canvas to the document body
  document.body.appendChild(app.canvas);

  const renderer = app.renderer;
  const stage = app.stage;
  // app.stage.eventMode = "static";
  // app.stage.interactive = true;
  // app.stage.hitArea = app.screen;




  // app.stage.on("pointerdown", (e)=>{
  //   console.warn(e);
  // })

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
  alert("?");
  ready();
}

export { Editor, Input, ready };


