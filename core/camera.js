import { RenderTexture, Sprite } from "pixi.js";
import { renderer } from "./editor";

async function snap(displayObject, resolution=0.5) {
    
  let bound = displayObject.getBounds();
  const { x, y, width, height } = bound;
  const renderTexture = RenderTexture.create({
    width: width,
    height: height,
    resolution
  });
  renderer.render({ container:displayObject, target:renderTexture });
  let sprite = new Sprite(renderTexture);
  return sprite;
};

export {snap};