
import { Assets, Loader, Rectangle, Resolver, extensions } from "pixi.js";
import { EV } from "./ev";
import { app } from "./editor";

const STATIC = { MOUSE0: { key:"m0" }, MOUSE1: {key: "m1"}, MOUSE2: { key: "m2"}  };
for(let key in STATIC){
  STATIC[key].parent = STATIC;
}

const InputEmitter = new EV();
class Pointer{
  constructor(){
    this._x = 0;
    this._y = 0;
    this._wx = 0;
    this._wy = 0;
    this.wx = 0;
    this.wy = 0;
    this.ids = new Map();
  }
  get x(){
    return this._x;
  }
  get y(){
    return this._y;
  }
}
//可能不会使用pixijs原生交互, 一是在多全屏layer情况下的触发问题, 二是使交互判定尽量一致, 如键盘/鼠标/手柄等
class Input { 
  static async setup() {
    let mapper = await Assets.load("../core/input.yaml");
    const pf = { passive: false };
    
    document.addEventListener("keydown", this._onKeyDown.bind(this));
    document.addEventListener("keyup", this._onKeyUp.bind(this));
    document.addEventListener("pointerdown", this._onPointerDown.bind(this));
    document.addEventListener("pointermove", this._onPointerMove.bind(this));
    document.addEventListener("pointerup", this._onPointerUp.bind(this));
    document.addEventListener("wheel", this._onWheel.bind(this), pf);
    window.addEventListener("blur", this.clear.bind(this));
    this.clear();
    this._mapper = mapper;
    this._repeatInterval = 100;
  }

  static clear() {
    this._hitTestCaches = new Map();
    this._currentState = new Map();
    this._gcing = new Map();
    this._pointer = new Pointer();
  }

  static _onKeyDown(e) {
    if (e.repeat) return;
    let { key, keyCode } = e;
    key = key.toLocaleLowerCase();
    this._currentState.set(key, { press: -1 });
    InputEmitter.emit("keydown", key);
    console.warn(this.mapper, e);
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
    InputEmitter.emit("keyup", key);
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

  static updatePointer(e) {
    this._pointer._x = e.clientX - app.screen.x;
    this._pointer._y = e.clientY - app.screen.y;
  }

  static _onPointerDown(e) {
    this.updatePointer(e);
    let key = this.pointerKey(e);
    this._onKeyDown({ key, keyCode: 0 });
    InputEmitter.emit("pointerdown", this.pointer);
    console.warn(this.mapper, e);
  }

  static _onPointerMove(e) {
    this.updatePointer(e);
    InputEmitter.emit("pointermove", this.pointer);
  }

  static _onPointerUp(e) {
    this.updatePointer(e);
    let key = this.pointerKey(e);
    this._onKeyUp({ key, keyCode: 0 });
    InputEmitter.emit("pointerup", this.pointer);
  }

  static _onWheel(e) {
    this._pointer._wx += e.deltaX;
    this._pointer._wy += e.deltaY;
    InputEmitter.emit("wheel", this.pointer);
  }

  static get mapper(){
    const userAgent = navigator.userAgent;
    if(/Win/i.test(userAgent)){
      return this._mapper.win64;
    }
    return this._mapper.win64;
  }

  static get pointer() {
    const { x, y, wx, wy } = this._pointer;
    return { x, y, wx, wy };
  }

  static get wheel() {
    const { wx, wy } = this._pointer;
    return { wx, wy };
  }

  static set repeatInterval(value = 200) {
    this._repeatInterval = value;
  }
  static get repeatInterval() {
    return this._repeatInterval;
  }

  static update(delta) {
    if(!this._currentState) return;
    this._hitTestCaches.clear();
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
    if(key.parent == STATIC){
      let state = this._currentState.get(key.key);
      return state && state.press == 0;
    }
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
    if(key.parent == STATIC){
      let state = this._currentState.get(key.key);
      return state && state.press >= time;
    }
    const data = this.mapper[key];
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

  static isReleased(key) {
    if(key.parent == STATIC){
      let state = this._gcing.get(key.key);
      return state && state.press == 0;
    }
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
    if(key.parent == STATIC){
      let trigger = this.isTriggered(key.key);
      let gcing = this._gcing.get(key.key);
      if (key.key == 'm0' && trigger) {
        console.log(gcing);
      }
      if (time) {
        return trigger && gcing && (gcing.press >= -time);
      }
      return trigger && gcing;
    }
    const data = this.mapper[key];
    if(!data) return;
    for (let k in data) {
      let r = this.isRepeated(k, time);
      if (r) return r;
    }
    let trigger = this.isTriggered(key);
    let gcing = this._gcing.get(key);
    
    if (time) {
      return trigger && gcing && (gcing.press >= -time);
    }
    return trigger && gcing;
  }

  // 性能节省, 不使用pixi的hitTest
  static hitTest(e) { 
    if(this._hitTestCaches.has(e)){ //一帧之内查询多次的处理
      return this._hitTestCaches.get(e);
    }
    let rect = e.getBounds();
    let result = this.hitTestRect(rect.x, rect.y, rect.width, rect.height);
    this._hitTestCaches.set(e, result);
    return result;
  }

  static hitTestRect(x0, y0, w, h) {
    let rect = new Rectangle(x0, y0, w, h);
    const { x, y } = this._pointer;
    let inside = rect.contains(x, y);
    return inside;
  }

  

}

export { Input, InputEmitter, STATIC }
