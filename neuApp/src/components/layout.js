import { Component } from "../core/entity.js";

class Layout extends Component{
  constructor(){
    super();
    this.transforming = new Map();
    this.now = 0;
    this.time = 0;
    this.lerp(Layout.lerp);
  }
  
  static lerp(t){
    return 3 * Math.pow(t, 2) - 2 * Math.pow(t, 3);
  }

  lerp(_lerp, time = 300){
    this._lerp = _lerp;
    this.time = time;
  }

  onRefresh(){
    if(!this._lerp){
      this.now = this.time;
      this.updateTransforms();
    }
    this.emit("transformstart");
  }

  refresh(children=this.E.children){
    this.onRefresh(children);
  }

  setTransform(e, tx, ty){
    if((e.x == tx) && (e.y == ty)) return;
    this.transforming.set(e, { x:tx, y:ty, dx:tx - e.x, dy:ty - e.y, sx:e.x, sy:e.y });
  }

  updateTransforms(delta){
    if (!this.transforming.size) return;
    let t = this.now / this.time;
    this.now += delta;
    t = Math.min(t, 1);
    let tp = this._lerp(t);
    this.transforming.forEach((target, c) => {
      let txl = tp * target.dx;
      c.x = target.sx + txl;
      let tyl = tp * target.dy;
      c.y = target.sy + tyl;
    })
    this.emit("transform");
    if (t >= 1) {
      this.transforming.clear();
      this.emit("transformend");
      this.now = 0;
    }
  }

  onUpdate(delta){
    super.onUpdate(delta);
    this.updateTransforms(delta);
  }
}

class Grid extends Layout{
  constructor(col=1, margin_x=0, margin_y=0){
    super();
    this.col = col;
    this.margin_x = margin_x;
    this.margin_y = margin_y;
  }

  onRefresh(children){
    let col = (typeof(this.col) == "function" ? this.col() : this.col);
    let _col = -1;
    let y = 0;
    let ty = 0;
    let tx = 0;
    children.forEach((c, i) => {
      if(c.isMask) return;
      let { width, height } = c.getBounds();
      width += this.margin_x;
      height += this.margin_y;
      _col++;
      if (_col >= col) {
        _col = 0;
        ty += y;
        y = 0;
        tx = 0;
      }
      this.setTransform(c, tx, ty);
      tx += width;
      y = Math.max(height, y);
    })
    super.onRefresh();
  }

}

class Flex extends Layout{
  constructor(){
    super();
    
  }
}

export { Layout, Flex, Grid };



