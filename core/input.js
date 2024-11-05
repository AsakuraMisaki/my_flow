
import { Assets, Loader, Resolver, extensions } from "pixi.js";
import { YAML } from "./yaml";

//可能不会使用pixijs原生交互, 一是在多全屏layer情况下的触发问题, 二是使交互判定尽量一致, 如键盘/鼠标/手柄等
class Input { 
  static async setup() {
    let config = await Assets.load("../core/input.yaml");
    const pf = { passive: false };
    this.clearAllMotion(config);
    // document.addEventListener("keydown", this._onKeyDown.bind(this));
    // document.addEventListener("keyup", this._onKeyUp.bind(this));
    // document.addEventListener("pointerdown", this._onPointerDown.bind(this));
    // document.addEventListener("pointermove", this._onPointerMove.bind(this));
    // document.addEventListener("pointerup", this._onPointerUp.bind(this));
    // document.addEventListener("wheel", this._onWheel.bind(this), pf);
    // window.addEventListener("blur", this.clear.bind(this));
    // this.clear();
    // this.setRepeatWait();
    // this.clampDirection();
  }

  clearAllMotion(config){
    console.warn(config);
    for(const platform in config){
      
    }
  }

  static clear() {
    this._currentState = new Map();
    this._gcing = new Map();
    this._pointer = { _x: 0, _y: 0, x: 0, y: 0, wx: 0, wy: 0, _wx: 0, _wy: 0, ids: new Map() };
    this.now = performance.now();
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
    // const data1 = this.getMapper()[key];
    // if(data1){
    //     for(let k in data1){
    //         console.log(k)
    //         this._onKeyUp({ key:k })
    //     }
    // }

  }

  static pointerCoor(e) {
    this._pointer._x = this._pointer.x;
    this._pointer._y = this._pointer.y;
    const x = Graphics.pageToCanvasX(e.x); //240718 多点触碰需要测试和修改
    const y = Graphics.pageToCanvasY(e.y);
    this._pointer.x = x;
    this._pointer.y = y;
    return { x, y };
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
    this.pointerCoor(e);
    let key = this.pointerKey(e);
    this._onKeyDown({ key, keyCode: 0 });
  }

  static _onPointerMove(e) {
    this.pointerCoor(e);

  }

  static _onPointerUp(e) {
    this.pointerCoor(e);
    let key = this.pointerKey(e);
    this._onKeyUp({ key, keyCode: 0 });
  }

  static _onWheel(e) {
    this._pointer._wx += e.deltaX;
    this._pointer._wy += e.deltaY;

  }

  static getMapper() {
    return Params.mapper;
  }

  static getPointer() {
    return { x, y, wx, wy } = this._pointer;
  }

  /**
   * 设置双击的判定范围，单位毫秒
   * @param {any} value=200
   */
  static setRepeatWait(value = 200) {
    this._repeatWait = value;
  }

  static update(delta) {
    let now = performance.now();
    // 真实时间
    let d = now - this.now;
    // 更新未释放的
    this._currentState.forEach((pressing, key) => {
      if (pressing.press < 0) {
        pressing.press++;
        return;
      }
      // console.log(key, pressing);
      pressing.press += d;
    })
    // 更新释放的
    this._gcing.forEach((pressing, key, gc) => {
      if (pressing.press > 0) {
        pressing.press--;
        return;
      }
      pressing.press -= d;
      if (pressing.press <= -this._repeatWait) {
        gc.delete(key);
      }
    })

    this._pointer.wx = this._pointer._wx;
    this._pointer.wy = this._pointer._wy;

    this._pointer._wx = 0;
    this._pointer._wy = 0;
    // console.log(this._pointer);
    this.now = now;
    // console.log(this._currentState, this._gcing)

  }

  static pointerMoving() { // 搁置
    const data = { x, y, lx, ly } = this._pointer;
    if (x == lx && y == ly) return;
    return data;
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

  static wheeling() {
    if (!this._pointer.wx && !this._pointer.wy) return;
    return { wx, wy } = this._pointer;
  }

  static isTriggered(key) {
    const data = this.getMapper()[key];
    if (data) {
      for (let k in data) {
        let t = this.isTriggered(k);
        if (t) return t;
      }
    }
    let state = this._currentState.get(key);
    return state && state.press == 0;
  }

  static isPressed(key, time = 300) {
    const data = this.getMapper()[key];
    if (data) {
      for (let k in data) {
        let p = this.isPressed(k, time);
        if (p) return p;
      }
    }
    if (this._currentState) {
      this;
    }
    let state = this._currentState.get(key);
    return state && state.press >= time;
  }


  static pointerInside(x0 = 0, y0 = 0, w = 0, h = 0) {
    let rect = new PIXI.Rectangle(x0, y0, w, h);
    const { x, y } = this._pointer;
    let inside = rect.contains(x, y);
    return inside;
  }

  static isReleased(key) {
    const data = this.getMapper()[key];
    if (data) {
      for (let k in data) {
        if (this.isPressed(k, 0)) return;
        let r = this.isReleased(k);
        if (r) return r;
      }
    }
    let state = this._gcing.get(key);
    return state && state.press == 0;
  }

  static isRepeated(key, time = this._repeatWait) {
    const data = this.getMapper()[key];
    if (data) {
      for (let k in data) {
        let r = this.isRepeated(k, time);
        if (r) return r;
      }
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

  static clampDirection(...mapping) {
    this._dirClamp = {};
    mapping.forEach((d, i, map) => {
      if (i % 2) return;
      this._dirClamp[d] = map[i + 1];
    })
  }

  static change(motion, a = '', b = '', save = true) {
    if (a == b) return;
    let mapper = Params.mapper;
    a = a.toLocaleLowerCase();
    b = b.toLocaleLowerCase();
    mapper[motion] = mapper[motion] || {};
    delete mapper[motion][a];
    b = b.toLocaleLowerCase();
    mapper[motion][b] = true;
    if (save) {
      ConfigManager.keyMapper = Params.mapper;
    }
  }
}

export { Input }
