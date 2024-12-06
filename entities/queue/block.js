import { Container, Graphics, Text } from "pixi.js";
import { ContainerEntity, TextEntity } from "../../core/Entity";
import { Grid } from "../../components/layout";

class block extends ContainerEntity{
  constructor(){
    super();
  }
  onReady(){
    this.addComponent("layout", new Grid(()=>this.children.length, 5, 0));
    super.onReady();
  }
  addScope(content){
    let block = new Container();
    let bg = new Graphics();
    
    let text = new Text(content);
    block.addChild(bg, text);
    block.scopeColor = Math.ceil(Math.random() * 0xffffff);
    block.scope = text;
    block.scopeBG = bg;
    this.addChild(block);
    bg.clear();
    bg.roundRect(0, 0, text.width + 20, text.height, 5);
    bg.fill(block.scopeColor, 1);
    text.x = 10;
    return block;
  }
  fromJSON(data){
    this.removeChildren();
    for(let key in data){
      let result = this.addScope(data[key]);
      this.addChild(result);
    }
    this.getComponent("layout").refresh();
  }
  onUpdate(delta){
    super.onUpdate(delta);
    // this.children.forEach((c)=>{
    //   if(c instanceof Container && c.scope){
    //     let targetWidth = c.scope.width + 30;
    //     if(c.scopeBG.width != targetWidth || c.scopeBG.height != c.scope.height){
          
    //       // c.scopeBG.x = targetWidth/2;
    //     }

    //   }
    // })
  }
}

export {block}