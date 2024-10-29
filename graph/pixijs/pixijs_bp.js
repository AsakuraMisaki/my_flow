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

    const registered_node_types = new Map();
    function validNodeType(type){
        return registered_node_types.has(type);
    }
    function getNodeType(type){
        return registered_node_types.get(type);
    }
    function registerNodeType(type, _class){
        type = type.toLowerCase();
        registered_node_types.set(type, _class);
    }
    function unregisterNodeType(target){
        if(typeof(target) == "string"){
            registered_node_types.delete(target);
        }
        else if(target.type){
            registered_node_types.delete(target.type);
        }
    }


    // 连接到 WebSocket 服务器（假设 Vite 开发服务器在 localhost:3000）
    // const socket = new HTTP('https://192.168.31.35:5173/socket.io');
    const socket = new WebSocket(`ws://localhost:5173/`);
    socket.addEventListener('open', (event) => {
        console.warn('WebSocket 已连接');
        // 发送消息到服务器
        socket.send('Hello, 服务器1');
    });

    let auto = function(){
        socket.send("requesting_ctx");
        setTimeout(auto, 1000);
    }

    setTimeout(auto, 1000);

    // 当接收到服务器消息时触发
    socket.addEventListener('message', (event) => {
        try{
            let data = JSON.parse(event.data);
            if(data.ctx){
                tryRefreshCurrent(data.obj);
            }
        }catch(e){
            console.error(e);
        }
        // console.log('收到服务器消息:', event.data);
    });

    // 当连接关闭时触发
    socket.addEventListener('close', (event) => {
        console.log('WebSocket 已关闭');
    });

    // 当发生错误时触发
    socket.addEventListener('error', (event) => {
        console.error('WebSocket 错误:', event);
    });

    function tryRefreshCurrent(data){
        console.log(data);
        let target = basicCtx.new(data);

        if(target){
            let last = basicCtx.__cache;
            setTimeout(()=>{
                SceneManager._scene.removeChild(last);
            }, 2000);
            basicCtx.__cache = target;
            SceneManager._scene.addChild(target);
            console.log(basicCtx.__cache);
        }
    }

    let basicCtx = { __cache: null };
    basicCtx.new = function(data){
        if(!data) return;
        let type = data.type;
        if(!type){
            return data;
        }
        let node_class = getNodeType(type);
        if(!node_class) return;
        return new node_class(data);
    }
    basicCtx.setupChildren = function(target, children){
        children.forEach((data)=>{
            let temp = basicCtx.new(data);
            if(!temp) return;
            target.addChild(temp);
            // 测试
            if(temp.alpha == 0){
                temp.alpha = 1;
            }
        })
    }
    basicCtx.getChildren = function(target){
        let children = target.getChildren ? target.getChildren() : target.children;
        return children;
    }
    basicCtx.setupFeatures = function(target, features){
        let obj = { };
        if(Array.isArray(features)){
            features.forEach((data)=>{
                if(!data) return;
                obj[data.type] = data;
            })
        }
        else{
            obj = features;
        }
        let result = new Map();
        for(let type in obj){
            let temp = basicCtx.new(obj[type]);
            result.set(type, temp);
        }
        target.features = result;
        return result;
    }
    basicCtx.update = function(){
        let children = basicCtx.getChildren(this);
        children.forEach((c)=>{
            c.update ? c.update(this) : null;
        })
        let features = this.getFeatures ? this.getFeatures() : this.features;
        if(features){
            features.forEach((f)=>{
                f.update ? f.update(this) : null;
            })
        }
        this.emit("update");
    }

    function _Window(data){
        let target = new Window(data.width, data.height, data.windowArea);
        this.target = target;
        const {x, y, alpha} = data;
        Object.assign(target, {x, y, alpha});
        basicCtx.setupChildren(target, data.children);
        basicCtx.setupFeatures(target, data.features);
        return target;
    }
    registerNodeType("pixijs/window", _Window);

    class Sprite extends PIXI.Sprite{
        constructor(width, height){
            super();
            this.constSize = {width, height};
        }
        get constSize(){
            return this._constSize;
        }
        set constSize(obj){
            this._constSize = obj;
        }
        update(){
            basicCtx.update.call(this);
        }
    }
    function _Sprite(data){
        let target = new Sprite(data.width, data.height);
        this.target = target;
        const {x, y, alpha} = data;
        Object.assign(target, {x, y, alpha});
        basicCtx.setupChildren(target, data.children);
        basicCtx.setupFeatures(target, data.features);
        return target;
    }
    registerNodeType("pixijs/sprite", _Sprite);

    class Text extends PIXI.Text{
        constructor(){
            super();
        }
        update(){
            basicCtx.update.call(this);
        }
    }
    function _Text(data){
        let target = new Text();
        this.target = target;
        const {x, y, alpha, text} = data;
        Object.assign(target, {x, y, alpha, text});
        basicCtx.setupChildren(target, data.children);
        basicCtx.setupFeatures(target, data.features);
        return target;
    }
    registerNodeType("pixijs/text", _Text);
    
    function Cut_Tile(data){
        const { index, pw, ph } = data;
        Object.assign(this, { index, pw, ph });
    }
    Cut_Tile.prototype.update = function(display){
        
    }   
    Cut_Tile.dynamicSafe = function(prop){
        return 32;
    }
    registerNodeType("feature/cut_Tile", Cut_Tile);

    function Texture(data){
        this.url = data.url;
        this.valid = false;
    }
    Texture.prototype.update = function(display){
        if(this.url != this.lastUrl){
            this.valid = false;
            this.lastUrl = this.url;
            PIXI.Texture.safeload(this.url).then((data)=>{
                display.texture = data.tex;
                this.valid = true;
            })
        }
        if(this.valid){
            display.emit("tex_valid");
        }
    }
    registerNodeType("feature/texture", Texture);

    function Cut_Object(data){
        if(!data.obj) return;
        let target = data.obj.frame ? data.obj.frame : data.obj;
        this.frame = new PIXI.Rectangle(target.x, target.y, target.w || target.width, target.h || target.height);
    }
    Cut_Object.prototype.update = function(display){
        if(this.frame != this.lastFrame){
            this.lastFrame = this.frame;
            display.once("tex_valid", this.applyFrame.bind(this, display));
        }
    }
    Cut_Object.prototype.applyFrame = function(display){
        display.texture.frame = this.frame;
    }
    registerNodeType("feature/cut_object", Cut_Object);
    

    function Style(data){
        const { size, color, outline, outline_width, align } = data;
        this.simpleApply = { size, color, outline, outline_width, align };
    }
    Style.prototype.update = function(display){
        if(this.simpleApply){
            let d = this.simpleApply;
            display.style.fontSize = d.size;
            display.style.fill = d.color;
            display.style.stroke = d.outline;
            display.style.strokeThickness = d.outline_width;
            display.style.align = d.align;
            this.simpleApply = null;
        }
    }
    registerNodeType("feature/style", Style);

    function Dynamic(data){
        this.layout = basicCtx.new(data.layout);
        this.setupInstances(data.instances);
        this.source = data.source;
        this.transforming = new Map();
    }
    Dynamic.prototype.setupInstances = function(instances){
        this.instancesInfo = new Map();
        for(let key in instances){
            let instanceData = instances[key];
            let reflects = this.dynamicSafe(instanceData, { });
            let instance = basicCtx.new(instanceData);
            this.instancesInfo.set(key, instanceData);
        }
    }
    Dynamic.prototype.dynamicSafe = function(instanceData, reflects={}){
        let obj = { };
        let features = instanceData.features;
        if(Array.isArray(features)){
            features.forEach((data)=>{
                if(!data) return;
                obj[data.type] = data;
            })
        }
        else{
            obj = features;
        }
        instanceData.features = obj;
        // for(let key in obj){
        //     let data = obj[key];
        //     if(!data) continue;
        //     let node_class = getNodeType(data.type);
        //     if(!node_class) continue;
        //     let node_class_dynamic_safe = node_class.dynamicSafe;
        //     for(let k0 in data){
        //         let R = data[k0];
        //         if(R && R.R && /reflect\/r/i.test(R.type)){
        //             reflects[R.R] = reflects[R.R] || { };
        //             reflects[R.R][data.type] = reflects[R.R][data.type] || { };
        //             reflects[R.R][data.type][k0] = true;
        //             if(node_class_dynamic_safe){
        //                 data[k0] = node_class_dynamic_safe(k0);
        //             }
        //             else{
        //                 data[k0] = 0;
        //             }
        //         }
        //     }
        // }
        return reflects;
    }
    Dynamic.prototype.dynamicSourceApply = function(source){
        if(!this.instancesInfo) return;
        let info = this.instancesInfo;
        let children = [];
        // 整段需要优化
        source.forEach((data)=>{
            let targetInfo = null;
            if(!data || data == true){ //无条件, 因此也无过滤
                targetInfo = info.values().next().value;
            }
            else{
                info.forEach((sub, key)=>{
                    if(sub[key]){
                        targetInfo = sub;
                    }
                })
            }
            if(!targetInfo) return;
            targetInfo = JSON.parse(JSON.stringify(targetInfo));
            for(let key in targetInfo.features){
                let temp = targetInfo.features[key];
                for(let name in temp){
                    let r = temp[name];
                    if(r && r.R && /reflect\/r/i.test(r.type)){
                        if(data.hasOwnProperty(r.R)){
                            temp[name] = data[r.R];
                        }
                        else{
                            temp[name] = 0;
                        }
                    }
                }
            }
            let target = basicCtx.new(targetInfo);
            children.push(target);
            if(data && data.userData){ //隐式用户数据, 用于开发端
                target.userData = data.userData;
            }
        })
        // console.warn(children);
        if(children != this.dynamicRequesting){
            this.dynamicRequesting = children; //先简单移除所有子元素再添加
        }
        
    }
    Dynamic.prototype.update = function(display){
        this.layout ? this.layout.update() : null;
        if(this.dynamicRequesting){
            display.removeChildren();
            this.dynamicRequesting.forEach((c)=>{
                display.addChild(c);
            })
            this.layout.refresh(display.width, basicCtx.getChildren(display));
            this.dynamicRequesting = null;
        }
    }
    Object.defineProperties(Dynamic.prototype, {
        source: {
            get: function(){
                return this._source;
            },
            set: function(array){
                if(this._source != array){
                    this.dynamicSourceApply(array);
                    this._source = array;
                }
            }
        },
    })
    registerNodeType("feature/dynamic", Dynamic);


    function Dynamic_Grid(data){
        this.col = data.col;
        this.mx = data.margin_x;
        this.my = data.margin_y;
        this.transforming = new Map();
    }
    Dynamic_Grid.prototype.refresh = function(children){
        let col = this.col;
        this.transforming.clear();
        let _col = 0;
        let y = 0;
        let ty = 0;
        children.forEach((c, i)=>{
            let { width, height } = c;
            width += this.mx;
            height += this.my;
            let anchor = c.anchor || {x:0, y:0};
            let tx = _col * xx - (width * (0 - anchor.x));
            _col++;
            if(_col >= col){
                _col = 0;
                y += ty;
                ty = 0;
            }
            this.setTransforming(c, tx, y);
            ty = Math.max(height, ty);
        })
        this.now = Graphics.app.ticker.lastTime;
    }
    Dynamic_Grid.prototype.lerp = function(t){
        return 3 * Math.pow(t, 2) - 2 * Math.pow(t, 3);
    }
    Dynamic_Grid.prototype.setTransforming = function(c, tx, ty){
        if((c.x == tx) && (c.y == ty)) return;
        this.transforming.set(c, { x:tx, y:ty, dx:tx - c.x, dy:ty - c.y, sx:c.x, sy:c.y });
    }
    Dynamic_Grid.prototype.update = function(){
        if(!this.transforming.size) return;
        let now = Graphics.app.ticker.lastTime;
        let t = (now - this.now) / 700;
        t = Math.min(t, 1);
        let tp = this.lerp(t);
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
    registerNodeType("feature/dynamic_grid", Dynamic_Grid);

    
    


    function touch(display){
        if(Graphics.app){
            let hit = this.app.renderer.plugins.interaction.hitTest({x:TouchInput._x, y:TouchInput._y}, display);
            return hit;
        }
    }

    function newCoor(){
        return { x:TouchInput._x, y:TouchInput._y };
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

        static setDragObj(obj){
            Abstract._dragObj = obj;
        }
        static getDragObj(){
            return Abstract._dragObj;
        }

        
        removeAllListeners(){
            this.interactive = false;
        }
        
    }

    // 基础
    class Window extends PIXI.Container{
        constructor(width=100, height=100, windowArea=false){
            super();
            let mask = new PIXI.Graphics();
            mask.beginFill(0x000, 1);
            mask.drawRect(0, 0, 1, 1);
            mask.scale.x = width;
            mask.scale.y = height;
            this.innerMask = mask;
            let content = new PIXI.Container();
            this.appendChildAt(mask, 0);
            this.appendChildAt(content, 1);
            content.mask = mask;
            this.content = content;
            if(windowArea == true){
                this.windowArea = true;
            }
        }

        update(){
            basicCtx.update.call(this);
            this.updateAreaVisble();
        }
        updateAreaVisble(){
            if(this.windowArea){
                this.appendWindowArea();
            }
            else if(this.windowAreaMask){
                this.windowAreaMask.remove();
                this.windowAreaMask = null;
            }
        }   

        appendWindowArea(){
            if(this.windowAreaMask) return;
            let mask = new PIXI.Graphics();
            mask.beginFill(0x000, 1);
            mask.drawRect(0, 0, 1, 1);
            mask.scale.x = this.innerMask.width;
            mask.scale.y = this.innerMask.height;
            mask.x = this.innerMask.x;
            mask.y = this.innerMask.y;
            mask.alpha = 0.4;
            this.appendChildAt(mask, 0);
            this.windowAreaMask = mask;
        }

        getChildren(){
            return this.content.children;
        }
        
        get width(){
            return this.innerMask.width;
        }
        get height(){
            return this.innerMask.height;
        }

        appendChildAt(){
            super.addChildAt.call(this, ...arguments);
        }

        addChild(){
            this.content.addChild(...arguments);
        }

        removeChild(){
            this.content.removeChild(...arguments);
        }

        removeChildren(){
            this.content.removeChildren(...arguments);
        }

        // pointermove(e){
        //     if(e.target != this){
        //         this._last.select = e.target;
        //     }
        //     this._last.wheel = true;
        //     return;
        // }

        // pointerout(e){
        //     this._last.select = false;
        //     this._last.wheel = false;
        //     this._last.touch = false;
        // }

        // pointerdown(e){
        //     this._last.touch = true;
        //     this._last.coor = newCoor();
        //     this._last.time = globalNow;
        // }

        // pointerup(e){
        //     this._last.select = true;
        //     this._last.touch = false;
        // }
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

    defaultLayoutFlag = {
        align: [0, 1],
        margin: [5, 5]
    }

});


