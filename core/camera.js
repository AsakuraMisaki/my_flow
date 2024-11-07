import { Rectangle, RenderTexture, Sprite, Texture } from "pixi.js";
import { app, renderer, stage } from "./editor";

async function snap(displayObject, resolution=0.5) {

  let texture = await renderer.extract.texture({
    target: stage,
    resolution
  });
  const {x, y, width, height} = displayObject.getBounds();
 
  let sprite = new Sprite(texture);
  texture.frame = new Rectangle(0, 0, 20, 20);
  // texture.update();
  
  return sprite;
};

export {snap};