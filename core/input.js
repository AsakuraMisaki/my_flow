
import { Assets, Loader, Rectangle, Resolver, extensions } from "pixi.js";
import { YAML } from "./yaml";

//可能不会使用pixijs原生交互, 一是在多全屏layer情况下的触发问题, 二是使交互判定尽量一致, 如键盘/鼠标/手柄等
class Input { 
  static async setup() {
    let mapper = await Assets.load("../core/input.yaml");
    const pf = { passive: false };
    this.clearAllMotion(config);
    
    document.addEventListener("keydown", this._onKeyDown.bind(this));
    document.addEventListener("keyup", this._onKeyUp.bind(this));
    document.addEventListener("pointerdown", this._onPointerDown.bind(this));
    document.addEventListener("pointermove", this._onPointerMove.bind(this));
    document.addEventListener("pointerup", this._onPointerUp.bind(this));
    document.addEventListener("wheel", this._onWheel.bind(this), pf);
    window.addEventListener("blur", this.clear.bind(this));
    this.clear(mapper);
    this.setRepeatWait();
    // this.clampDirection();
  }

  clearAllMotion(config){
    console.warn(config);
    for(const platform in config){
      
    }
  }

  static clear(mapper) {
    this._mapper = mapper;
    this._currentState = new Map();
    this._gcing = new Map();
    this._pointer = { _x: 0, _y: 0, x: 0, y: 0, wx: 0, wy: 0, _wx: 0, _wy: 0, ids: new Map() };
  }

  static _onKeyDown(e) {
    if (e.repeat) {
      return;
    }
    let { key, keyCode } = e;
    key = key.toLocaleLowerCase();
    this._currentState.set(key, { press: -1 });

  }

  static _onKeyUp(e) {
    let { key, keyCode } = e;
    key = key.toLocaleLowerCase();
    const data = this._currentState.get(key);
    if (data) {
      data.press = 1;
      this._gcing.set(key, data);
    }
    this._currentState.delete(key);
  }

  static pointerKey(e) {
    let key = 'm0';
    if (e.pointerType == 'mouse') {
      key = `m${e.button}`;
      this._currentState.set(key, { press: -1 });
    }
    else if (e.pointerType == 'touch') {
      this._pointer.ids.set(e.pointerId, true); //240718 多点触碰需要测试和修改
      if (this._pointer.ids.length >= 2) {
        key = 'm2';
      }
    }
    return key;
  }

  static _onPointerDown(e) {
    let key = this.pointerKey(e);
    this._onKeyDown({ key, keyCode: 0 });
  }

  static _onPointerMove(e) {

  }

  static _onPointerUp(e) {

    let key = this.pointerKey(e);
    this._onKeyUp({ key, keyCode: 0 });
  }

  static _onWheel(e) {
    this._pointer._wx += e.deltaX;
    this._pointer._wy += e.deltaY;
  }

  static get mapper(){
    return this._mapper;
  }

  static get pointer() {
    return { x, y, wx, wy } = this._pointer;
  }

  static get wheel() {
    return { wx, wy } = this._pointer;
  }

  static set repeatInterval(value = 200) {
    this._repeatInterval = value;
  }
  static get repeatInterval() {
    return this._repeatInterval;
  }

  static update(delta) {
    // 更新未释放的
    this._currentState.forEach((pressing, key) => {
      if (pressing.press < 0) {
        pressing.press++;
        return;
      }
      // console.log(key, pressing);
      pressing.press += delta;
    })
    // 更新释放的
    this._gcing.forEach((pressing, key, gc) => {
      if (pressing.press > 0) {
        pressing.press--;
        return;
      }
      pressing.press -= delta;
      if (pressing.press <= -this.repeatInterval) {
        gc.delete(key);
      }
    })

    this._pointer.wx = this._pointer._wx;
    this._pointer.wy = this._pointer._wy;

    this._pointer._wx = 0;
    this._pointer._wy = 0;

  }

  static isAnyTriggered(mouse = false) {
    let find;
    this._currentState.forEach((data, key) => {
      if (find) return;
      if (!mouse && /^m/i.test(key)) return;
      let triggered = this.isTriggered(key);
      find = (triggered ? { key, data } : null);
    })
    return find;
  }

  static isTriggered(key) {
    const data = this.mapper[key];
    if(!data) return;
    for (let k in data) {
      let t = this.isTriggered(k);
      if (t) return t;
    }
    let state = this._currentState.get(key);
    return state && state.press == 0;
  }

  static isPressed(key, time = 300) {
    const data = this.getMapper()[key];
    if(!data) return;
    for (let k in data) {
      let p = this.isPressed(k, time);
      if (p) return p;
    }
    if (this._currentState) {
      this;
    }
    let state = this._currentState.get(key);
    return state && state.press >= time;
  }


  static hitTest(displayObject) {
    let rect = displayObject.getBounds();
    const { x, y } = this._pointer;
    let inside = rect.contains(x, y);
    return inside;
  }

  static hitTestRect(x, y, w, h) {
    let rect = new Rectangle(x, y, w, h);
    const { x, y } = this._pointer;
    let inside = rect.contains(x, y);
    return inside;
  }

  static isReleased(key) {
    const data = this.mapper[key];
    if(!data) return;
    for (let k in data) {
      // if (this.isPressed(k, 0)) return;
      let r = this.isReleased(k);
      if (r) return r;
    }
    let state = this._gcing.get(key);
    return state && state.press == 0;
  }

  static isRepeated(key, time = this.repeatInterval) {
    const data = this.getMapper()[key];
    if(!data) return;
    for (let k in data) {
      let r = this.isRepeated(k, time);
      if (r) return r;
    }
    let trigger = this.isTriggered(key);
    let gcing = this._gcing.get(key);
    if (key == 'm0' && trigger) {
      console.log(gcing);
    }
    if (time) {
      return trigger && gcing && (gcing.press >= -time);
    }
    return trigger && gcing;
  }

}

export { Input }
