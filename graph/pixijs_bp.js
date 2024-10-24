/*:
@target 
@plugindesc 
@author 

*/


(function (global, factory) {
    if (!global) return;
    let common = (typeof exports === 'object' && typeof module !== 'undefined'); // CommonJS
    common ? factory(exports) : factory(global.pixijs_bp = {}); //Universal
})(window || global || self || globalThis, function (exports) {


    function Cut_Tile(){

    }
    Cut_Tile.type = "features/C_tile"

    function touch(display){
        if(Graphics.app){
            let hit = this.app.renderer.plugins.interaction.hitTest({x:TouchInput._x, y:TouchInput._y}, display);
            return hit;
        }
    }

    function newCoor(){
        return { x:TouchInput._x, y:TouchInput._y };
    }

    let globalNow = 0;
    let Graphics_initialize = Graphics.initialize;
    Graphics.initialize = function(){
        let result = Graphics_initialize.call(this, ...arguments);
        if(this.app){
            this.app.renderer.plugins.interaction.moveWhenInside = true;
            Graphics.app.ticker.add(()=>globalNow = performance.now());
        }
        return result;
    }

    class Info{
        constructor(em) {
            this.em = em;
            this.features = new Set();
        }

        get select(){
            return this._select;
        }
        set select(item){
            if(item == true && this._select){
                this.em.emit("itemok", this._select);
            }
            else if(item == false && this._select){
                this.em.emit("itemcancel", this._select);
            }
            else if(this._select != item && (item instanceof PIXI.Container)){
                this.em.emit("itemselect", item, this._select);
            }
            this._select = item;
        }
    }

    

    const touchEvents = {
        dragstart: "pointerdown",
        dragend: "pointerup",
        drag: "pressing",
        scroll: "scroll",

        pointerdown: "pointerdown",
        pointerup: "pointerup",
        pointermove: "pointermove",
        pressing: "pressing",
    };

    

    class Description{
        constructor() {
            
        }
    }

    

    class Abstract{
        static _apply(..._classes){
            _classes.forEach((c)=>{
                Abstract._override(c);
            })
        }

        static _override(_class){
            let names = Object.getOwnPropertyNames(Abstract.prototype).filter((item)=>{
                return (item != "constructor");
            })
            names.forEach((item)=>{
                let origin = _class.prototype[item];
                let target = this.prototype[item];
                if(!origin){
                    _class.prototype[item] = this.prototype[item];
                    return;
                }
                _class.prototype[item] = function(){
                    origin.call(this, ...arguments);
                    target.call(this, ...arguments);
                }
            })
        }

        

        // checkTouchUpdate(){
        //     const c = this.listenerCount("pressing");
        //     if(c){
        //         this.interactive = true;
        //         return;
        //     }
        //     let set = Array.from(new Set(Object.values(touchEvents)));
        //     for (let index = 0; index < set.length; index++) {
        //         const c = this.listenerCount(set[index]);
        //         if(c){
        //             this.interactive = true;
        //             return;
        //         }
        //     }
        //     this.interactive = false;
        // }

        // on(){
        //     this.checkTouchUpdate();
        // }

        // off(){
        //     this.checkTouchUpdate();
        // }

        static setDragObj(obj){
            Abstract._dragObj = obj;
        }
        static getDragObj(){
            return Abstract._dragObj;
        }

        
        removeAllListeners(){
            this.interactive = false;
        }
        
        addFeature(f){
            let valid = !this._last.features.has(f);
            if(!valid) return;
            if(f == "drag"){
                this.interactive = true;
                this._last.drag = this._last.drag || { };
                this.on("pointerdown", this.pointerdown_standalone_drag);
                this.on("pointerout", this.pointerup_standalone_drag);
                this.on("pointerup", this.pointerup_standalone_drag);
            }
            else if(f == "drop"){
                this.on("pointerout", this.pointerout_standalone_drop);
                this.on("pointermove", this.pointermove_standalone_drop);
                this.on("pointerup", this.pointerup_standalone_drop);
                this.on("update", this.updateDrop);
                this.interactive = true;
                this._last.drop = this._last.drop || { };
                this._last.drop.over = -1;
            }
            this._last.features.add(f);
        }

        removeFeature(f){
            this._last.features.delete(f);
            if(f == "drag"){
                this.off("pointerdown", this.pointerdown_standalone_drag);
                this.off("pointerout", this.pointerup_standalone_drag);
                this.off("pointerup", this.pointerup_standalone_drag);
                this._last.drag = null;
            }
            else if(f == "drop"){
                this.off("pointerout", this.pointerout_standalone_drop);
                this.off("pointermove", this.pointermove_standalone_drop);
                this.off("pointerup", this.pointerup_standalone_drop);
                this.off("update", this.updateDrop);
                this._last.drop = null;
            }
        }

        featureRunning(f){
            return this._last.features.has(f) && this._last[f].start;
        }

        pointerdown_standalone_drag(e){
            let dragging = Abstract.getDragObj();
            if(dragging) return;
            this._last.drag.start = true;
            this._last.drag.coor = newCoor();
            
            Abstract.setDragObj(this);
            this.emit("dragstart", this);
            this.on("update", this.dragging);
        }

        pointerup_standalone_drag(e){
            this._last.drag.start = false;
        }

        pointermove_standalone_drop(e){
            if(!this._last.drop.over){
                this._last.drop.over = true;
            }
        }
        pointerout_standalone_drop(e){
            this._last.drop.over = false;
        }
        pointerup_standalone_drop(e){
            this._last.drop.start = 2;
        }

        dragging(e){
            if(!this._last.drag || !this._last.drag.start){
                this.off("update", this.dragging);
                this.emit("dragend", this);
                if(Abstract.getDragObj() == this){
                    Abstract.setDragObj(null);
                }   
                return;
            }
            let { coor } = this._last.drag;
            let coor1 = newCoor();
            let offset = {x:coor1.x - coor.x, y:coor1.y - coor.y};
            this._last.drag.coor = coor1;
            this.emit("drag", this, coor1, offset.x, offset.y);
        }

        updateDrop(){
            if(this._last.drop.start > 0){
                this._last.drop.start--;
            }
            let obj = Abstract.getDragObj();
            if(!obj) return;
            if(this._last.drop.over == true){
                this.emit("dropover", obj);
            }
            else if(this._last.drop.over == false){
                this.emit("dropleave", obj);
            }
            if(this._last.drop.start == 2){
                this.emit("drop", obj);
            }
            
        }
    }

    // UI
    class Window extends PIXI.Container{
        constructor(width=100, height=100, x=0, y=0){
            super();
            let mask = new PIXI.Graphics();
            mask.beginFill(0x000, 1);
            mask.drawRect(0, 0, 1, 1);
            mask.scale.x = width;
            mask.scale.y = height;
            this.x = x;
            this.y = y;
            this.innerMask = mask;
            let content = new PIXI.Container();
            this.addChild(mask, content);
            content.mask = mask;
            this.content = content;
            this._last = new Info(this);
            this.on("update", this.updateLayout);
        }

        update(){
            this.content.children.forEach((c)=>{
                c.update ? c.update() : null;
            })
            this.emit("update");
        }


        resize(width=this.width, height=this.height){
            this.innerMask.clear();
            this.innerMask.beginFill(0, 1);
            mask.drawRect(0, 0, 1, 1);
        }

        get width(){
            return this.innerMask.width;
        }
        get height(){
            return this.innerMask.height;
        }

        addChild(){
            if(!this.content){
                super.addChild.call(this, ...arguments);
                return;
            }
            this.content.addChild(...arguments);
        }

        removeChild(){
            this.content.removeChild(...arguments);
        }

        removeChildren(){
            this.content.removeChildren(...arguments);
        }

        pointermove(e){
            if(e.target != this){
                this._last.select = e.target;
            }
            this._last.wheel = true;
            return;
        }

        pointerout(e){
            this._last.select = false;
            this._last.wheel = false;
            this._last.touch = false;
        }

        pointerdown(e){
            this._last.touch = true;
            this._last.coor = newCoor();
            this._last.time = globalNow;
        }

        pointerup(e){
            this._last.select = true;
            this._last.touch = false;
        }

        getChildren(){
            return this.content.children;
        }

        addLayout(){
            this.layout = new SmoothLayout();
        }

        updateLayout(){
            this.layout ? this.layout.update(this.width, this.content) : null;
        }
    }

    Abstract._apply(Window);

    class ScrollWindow extends Window{
        constructor(...args){
            super(...args);
            this.horizon = false;
            this.friction = 0.08;
            this.velocity = { x:0, y:0 };
        }

        pointerup(e){
            if(this.velocity.y > 1){
                this._last.select = false;
            }
            else{
                this._last.select = true;
            }
            this._last.touch = false;
        }

        update(){
            super.update.call(this, ...arguments);
            if(this.content.height > this.innerMask.height){
                if(!this.interactive){
                    this.interactive = true;
                }
                this.updateWheel();
                this.updateSmoothScroll();
                this.updateSmoothCorrect();
            }
            else{
                this.interactive = false;
            }
        }

        updateWheel(){
            if(!this._last.wheel) return;
            if(this._last.touch) return;
            let add = ((TouchInput.wheelY || 0) / 10);
            this.velocity.y -= add;
        }

        updateSmoothScroll(){
            if(this.featureRunning("drag")) return;
            let oy = this.velocity.y;
            if(Math.abs(this.velocity.y) <= 0.1){
                oy = 0;
                // this.updateSmoothCorrect();
            }
            this.velocity.y -= this.velocity.y * this.friction;
            let ty = this.content.y + oy;
            let min = this.height - this.content.height;
            if(ty < min){
                ty = min;
                // this._smoothCorrect = oy;
            }
            else if(ty > 0){
                ty = 0;
                // this._smoothCorrect = oy;
            }
            this.content.y = ty;
            if(!this._last.touch) return;
            let coor = newCoor();
            let now = globalNow;
            let y = coor.y - this._last.coor.y;
            let d = now - this._last.time;
            let v = y / d;
            this.velocity.y += v * 2; 
            let max = Math.abs(this.velocity.y);
            let tmax = Math.min(max, 30);
            this.velocity.y = ((max / this.velocity.y) * tmax) || 0;
            this._last.time = now;
            this._last.coor.y = coor.y;
            this.emit("scroll", this.velocity.y);
        }

        updateSmoothCorrect(){
            if(!this._smoothCorrect) return;
            let content = this.content;
            let target = Math.abs(this._smoothCorrect *= (1 - this.friction));
            if(target <= 0.01){
                target = 0;
                this._smoothCorrect = 0;
            }
            content.scale.y = 1 + target / 20;
        }
    }

    function test(){

        let win = new ScrollWindow(500, 900, 0, 0);
        SceneManager._scene._spriteset.addChild(win);
        win.addLayout();
        // win.layout.requesting = true;
        window.ttt = win;
        win.x = Graphics.width - 500;

        for(let i=0; i<100; i++){
            let container = new PIXI.Container();
            container.interactive = true;
            let s = new PIXI.Sprite();
            container.icon = s;
            let text = new PIXI.Text;
            container.text = text;
            PIXI.Texture.safeload("img/system/IconSet.png").then((data)=>{
                s.texture = data.tex;
                s.scale.x = 1;
                s.texture.frame = new PIXI.Rectangle(32, 32, 32, 32);
            });
            container.addChild(s, text);
            win.addChild(container);
        }

        let layoutTemplate = function(width, content){
            this._layoutTable(width, content, 1);
        }
        win.layout.setLayoutTemplate(layoutTemplate);
        let time = 60;
        win.layout.requesting = true;
        win.on("update", ()=>{
            if(win.testtt){
                win.layout.setLayoutTemplate(win.layout._layoutAuto);
            }
            else{
                win.layout.setLayoutTemplate(layoutTemplate);
            }
            if(!(time--)){
                time = 60;
                // win.layout.requesting = true;
            }
            // let content = win.content;
            // content.children.forEach((container)=>{
            //     container.icon.scale.x += Math.random() * 0.001;
            //     container.text.x = container.icon.width;
            //     container.text.text = Math.ceil(container.icon.width);
            // })
            // content.children = content.children.sort((a, b)=>{
            //     return (b.icon.scale.x - a.icon.scale.x);
            // })
        })
        // win.on("itemselect", (item, lastItem)=>{
        //     item.scale.y = 5;
        //     win.layout.requesting = true;
        //     if(lastItem){
        //         lastItem.scale.y = 1;
        //     }
        // })
        // win.addFeature("drag");
        // win.on("drag", (ox, oy)=>{
        //     win.x += ox;
        //     win.y += oy;
        // })
    }

    function test1(){

        let work = new Vis();
        work.open();
    }

    defaultLayoutFlag = {
        align: [0, 1],
        margin: [5, 5]
    }

    class Vis{
        constructor(){
            this.container = new Window(Graphics.width, Graphics.height, 0, 0);
            this.container.addFeature("drop");
            this.container.on("drop", this.drop.bind(this));
            this.outline = new Tree({ });
            this.createWidgets();
            this.container.on("update", this.update.bind(this));
            this.container.addChild(this.outline);
        }

        createWidgets(){
            this.tools = new ScrollWindow(200, Graphics.height);
            this.tools.addLayout();
            this.tools.layout.setLayoutTemplate((width, content)=>{
                this.tools.layout._layoutTable(width, content, 1);
            })
            let allText = ["窗口", "文字", "精灵"];
            let all = ["window", "text", "sprite"];
            all.forEach((type, i)=>{
                this._createWidget(type, allText[i]);
            })
            this.tools.layout.requesting = true;
            this.container.addChild(this.tools);
        }

        _createWidget(type, t){
            let text = new PIXI.Text();
            text.style.fill = 0xffffff;
            let window = new Window(70, 36, 0, 0);
            window.addChild(text);
            text.style.align = "center";
            text.anchor.x = 0.5;
            text.x = 35;
            text.text = t;
            window.content.mask = null;
            window.contextType = type;
            this.tools.addChild(window);
            window.addFeature("drag");
            window.on("dragstart", this.dragStart.bind(this));
            // window.on("drag", this.drag);
            // window.on("dragend", this.dragEnd);
            return window;
        }

        update(){
            this.updateDragElement();
        }

        updateDragElement(){
            if(this.__tempSprite && TouchInput.isPressed("m0", 0)){
                let sprite = this.__tempSprite;
                sprite.x = TouchInput._x;
                sprite.y = TouchInput._y;
            }
            else if(this.__tempSprite){
                this.__tempSprite.remove();
                Abstract.setDragObj(null);
            }
        }

        dragStart(item){
            let sprite = new Sprite();
            sprite.bitmap = Bitmap.snap(item);
            sprite.alpha = 0.6;
            SceneManager._scene.addChild(sprite);
            this.__tempSprite = sprite;
            sprite.contextType = item.contextType;
            Abstract.setDragObj(sprite);
        }

        // drag(item, touch){
        //     if(!item.__tempSprite) return;
        //     item.__tempSprite.x = touch.x;
        //     item.__tempSprite.y = touch.y;
        // }

        // dragEnd(item){
        //     item.__tempSprite.remove();
        // }

        drop(item){
            console.log(item.contextType);
            createElementByDrop(item.contextType);
        }

        createElementByDrop(type){
            if(type == "窗口"){

            }
        }



        open(){
            SceneManager._scene.addChild(this.container);
        }
    }

    class Dynamic{
        constructor(em){
            this.examples = new Map();
            this.sources = new Set();
            this.em = em;
        }

        static gc(){

        }

        clone(example){
            if(example.__tempInfo){
                
            }
        }

        addExample(example, key){
            
        }

        addSource(data){
            this.sources.add(data);
        }
    }

    function lerp(t){
        return 3 * Math.pow(t, 2) - 2 * Math.pow(t, 3);
    }

    class SmoothLayout{
        constructor(){
            this.transforming = new Map();
            this.layoutTemplate = this._layoutAuto;
        }

        setLayoutTemplate(fn, ...args){
            this.layoutTemplate = fn.bind(this, ...args);
        }

        _layoutTable(w, content, col){
            let xx = w / col;
            this.transforming.clear();
            let _col = 0;
            let y = 0;
            let ty = 0;
            content.children.forEach((c, i)=>{
                let { width, height } = c;
                let layoutFlag = c.layoutFlag || {};
                let lf = Object.assign({}, defaultLayoutFlag);
                lf = Object.assign(lf, layoutFlag);
                width += lf.margin[0];
                height += lf.margin[1];
                let anchor = c.anchor || {x:0, y:0};
                let tx = _col * xx - (width * (lf.align[0] - anchor.x));
                _col++;
                if(_col >= col){
                    _col = 0;
                    y += ty;
                    ty = 0;
                }
                this.setTransforming(c, tx, y);
                ty = Math.max(height, ty);
            })
        }

        _layoutAuto(w, content){
            let x = 0;
            let y = 0;
            let ty = 0;
            content.children.forEach((c, i)=>{
                let { width, height } = c;
                let layoutFlag = c.layoutFlag || {};
                let lf = Object.assign({}, defaultLayoutFlag);
                lf = Object.assign(lf, layoutFlag);
                width += lf.margin[0];
                height += lf.margin[1];
                x += width;
                if(x > w){
                    x = width;
                    y += ty;
                    ty = 0;
                }
                let tx = x-width;
                this.setTransforming(c, tx, y);
                ty = Math.max(height, ty);
            })
        }

        setTransforming(c, tx, ty){
            if((c.x == tx) && (c.y == ty)) return;
            this.transforming.set(c, { x:tx, y:ty, dx:tx - c.x, dy:ty - c.y, sx:c.x, sy:c.y });
        }

        update(width, content){
            if(this.requesting){
                this.transforming.clear();
                this.layoutTemplate(width, content);
                this.now = globalNow;
                this.requesting = false;
            }
            if(!this.transforming.size) return;
            let now = globalNow;
            let t = (now - this.now) / 700;
            t = Math.min(t, 1);
            let tp = lerp(t);
            this.transforming.forEach((target, c)=>{
                let txl = tp * target.dx;
                c.x = target.sx + txl;
                let tyl = tp * target.dy;
                c.y = target.sy + tyl;
            })
            if(t >= 1){
                this.transforming.clear();
            }
        }
    }

    class ScrollBar extends PIXI.Container{
        constructor(slider, frame, window){
            this.slider = slider;
            this.frame = frame;
            this.window = window;
            this.addChild(frame, slider);
        }

        update(){
            
        }
    }

    class Tree extends PIXI.Container{
        constructor(json){
            super();
        }
    }

    
    
    exports.test = test;
    exports.test1 = test1;
    exports.vis = new Vis();
    exports.globalNow = globalNow;
});


