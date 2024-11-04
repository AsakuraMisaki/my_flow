import { Application, Assets, Texture } from "pixi.js";
import { BaseSprite } from "../components/displayObject";
import { Entity } from "./Entity";
import { Drag } from "../components/ItemDrag";

class Editor extends Entity{
  constructor(){
    super();
  }

  async onReady(){
    const texture = await Assets.load("../res/icons.svg");
    this.test = new BaseSprite(texture);
    this.addChild(this.test);
  }
}

const app = new Application();

// Initialize the application
await app.init({ background: '#1099bb', resizeTo: window });

// Append the application canvas to the document body
document.body.appendChild(app.canvas);

let editor = new Editor();

editor.onReady();
app.stage.addChild(editor);
app.stage.eventMode = 'static';
app.stage.hitArea = app.screen;

const renderer = app.renderer;
const stage = app.stage;


const update = function(ticker){
  stage.children.forEach((c)=>{
    c.update ? c.update(ticker.deltaMS) : null;
  })
}
app.ticker.add(update);

window.app = app;

export { Editor, app, renderer, stage };

editor.addComponent("drag", Drag);