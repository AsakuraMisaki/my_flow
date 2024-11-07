import { Application, Assets, Texture, Container, Rectangle } from "pixi.js";
import { ContainerEntity, Entity, SpriteEntity } from "./Entity";
import { Drag } from "../components/drag";
import { Drop } from "../components/drop";
import { Layer } from "./layer";
import { Input } from "./input";
import { YAML } from "./yaml";
import { Hover } from "../components/hover";
import { Grid, Layout } from "../components/layout";


class Editor extends ContainerEntity{
  constructor(){
    super();
    this._layerMaps = new Map();
    // this.renderable = false;

  }

  addLayer(id, options){
    const L = new Layer();
    Object.assign(L, options);
    L.label = id;
    this._layerMaps.set(id, L);
    this.addChild(L);
    this.children.sort((a, b)=>{
      return (a.zIndex || 1) - (b.zIndex || 1);
    })
    return L;
  }

  getLayer(id){
    const L = this._layerMaps.get(id);
    return L;
  }

  removeLayer(id){
    const L = this._layerMaps.get(id);
    L.remove();
  }

  onUpdate(delta){
    super.onUpdate(delta);
    Input.update(delta);
  }

  async onReady(){
    await Input.setup();
    let ui = this.addLayer("ui", { zIndex:8 });
    let texture = await Assets.load("../res/icons.png");
    let baseGrid = ui.addComponent("grid", new Grid(1, 0, 0));
    let testContainer = new ContainerEntity();
    let grid = testContainer.addComponent("grid", new Grid(1, 0, 20));
    let hover = testContainer.addComponent("hover", new Hover().itemAble());
    hover.on("hoverin", (current, old)=>{
      if(current == testContainer){
        console.log("parent hover in");
      }
      else if(current){
        console.log("hover in", current, old);
      }
    })
    hover.on("hoverout", (current, old)=>{
      if(current == testContainer){
        console.log("parent hover out");
      }
      else if(current){
        console.log("hover out", current, old);
      }
    })
    hover.on("hover", (current)=>{
      // if(current == testContainer){
      //   console.log("parent hover ing");
      // }
      // else if(current){
      //   console.log("hover ing", current);
      // }
    })
    for(let i=0; i<10; i++){
      let tex = new Texture(texture);
      // tex.cut(new Rectangle(0, 0, 80, 80));
      let t = new SpriteEntity(tex);
      console.log(tex);
      // t.addComponent("drag", new Drag());
      
      // let index = i;
      // t.on("c.drag.start", ()=>{
      //   console.log(t, index);
      // })
      testContainer.addChild(t);
    }
    grid.refresh();


    this.test1 = new SpriteEntity(texture);
    this.test1.addComponent("hover", Hover);
    this.test1.alpha = 0.5;
    
    ui.addChild(testContainer, this.test1);
    grid.on("transform", ()=>{
      console.log(baseGrid.transforming);
      baseGrid.refresh();
    })
  }
}

const app = new Application();

// Initialize the application
await app.init({ background: '#1099bb', resizeTo: window });

// Append the application canvas to the document body
document.body.appendChild(app.canvas);
app.stage.eventMode = 'static';
app.stage.interactive = true;
const renderer = app.renderer;
const stage = app.stage;
stage.hitArea = app.screen;
stage.on("pointerdown", (e)=>{
  console.warn(e);
})
const update = function(ticker){
  stage.children.forEach((c)=>{
    c.update ? c.update(ticker.deltaMS) : null;
  })
}
app.ticker.add(update);

window.app = app;

let editor = new Editor();
stage.addChild(editor);

export { Editor, app, renderer, stage, editor };

editor.onReady();
