import { Rectangle, RenderTexture, Sprite, Texture } from "pixi.js";
// import { renderer, stage } from "./editor.js";

async function snap(displayObject, resolution=0.5) {

  let texture = await renderer.extract.texture({
    target: stage,
    resolution
  });
  const {x, y, width, height} = displayObject.getBounds();
  
  texture.frame = new Rectangle(0, 0, 20, 20);
  let sprite = new Sprite(texture);
  
  // texture.update();
  
  return sprite;
};

export {snap};