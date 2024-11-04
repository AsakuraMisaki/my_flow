import { RenderTexture, Sprite } from "pixi.js";
import { renderer } from "./editor";

async function snap(displayObject, resolution=0.5) {
    
  let bound = displayObject.getBounds();
  const { x, y, width, height } = bound;
  const renderTexture = RenderTexture.create({
    width: displayObject.width,
    height: displayObject.height,
    resolution
  });
  renderer.render({ container:displayObject, target:renderTexture });
  // renderTexture.frame = new Rectangle(x, y, width, height); //(注意resolution不会影响texture本身的frame, 不需要再乘r)
  // let image = await Graphics.app.renderer.extract.image(renderTexture, "image/webp", 0.25);
  // const texture = await Assets.load("../res/icons.svg");
  let sprite = new Sprite(renderTexture);
  return sprite;
};

export {snap};