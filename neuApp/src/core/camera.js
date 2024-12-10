import { Rectangle, RenderTexture, Sprite, Texture } from "pixi.js";
// import { renderer, stage } from "./editor.js";

async function snap(displayObject, resolution=0.5) {
  let renderer = app.renderer;
  let stage = app.stage;
  let texture = await renderer.extract.texture({
    target: stage,
    resolution
  });
  const {x, y, width, height} = displayObject.getBounds();
  
  texture.cut(new Rectangle(x, y, width, height), true);
  let sprite = new Sprite(texture);
  
  // texture.update();
  
  return sprite;
};

export {snap};