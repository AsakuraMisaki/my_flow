(function (global, factory) {
    if (!global) return;
    let common = (typeof exports === 'object' && typeof module !== 'undefined'); // CommonJS
    common ? factory(exports) : factory(global.ScriptableQueryObject = {}); //Universal
})(window || global || self || globalThis, function (exports) {

    //=== 通用 真实时间ticker 帧会影响误差
    class Atime {

        static add(cb, duration, max = 1) {
            let timer = { cb, duration, max, start: performance.now() };
            this.timers.set(this.id++, timer);
            if (!this._start) {
                this.start();
            }
        }

        static remove(id) {
            this.timers.delete(id);
        }

        static clear() {
            this.timers.clear();
        }

        static start() {
            this._start = true;
            requestAnimationFrame(Atime.update);
        }

        static _update(elapsed, timer, key, map) {
            if (elapsed >= (timer.start + timer.duration)) {
                timer.max--;
                timer.cb();
                timer.start = elapsed;
                if (!timer.max) {
                    map.delete(key);
                }
            }
        }

        static update() {
            requestAnimationFrame(Atime.update);
            let elapsed = performance.now();
            Atime.timers.forEach((timer, key, map) => Atime._update(elapsed, timer, key, map));
        }
    };
    Atime.timers = new Map();
    Atime.id = 0;
    Atime._start = false;

    // 全局方法
    const getQuery = function (any) {
        if (!any) return;
        if (any instanceof contexter) return any;
        if (any._queryId != undefined) any = any._queryId;
        else {
            if (any.gameObject && any._queryId) {
                return getQuery(any.gameObject);
            }
        }
        return contexter.running.get(any);
    }
    const setCache = function (target, key, any) {
        if(!target) return;
        if (!(target instanceof contexter)) return setCache(getQuery(target), key, any);
        return target.cache.set(key, any);
    }
    const getCache = function (target, key) {
        if(!target) return;
        if (!(target instanceof contexter)) return getCache(getQuery(target), key);
        return target.cache.get(key);
    }
    const clearCache = function (target, key) {
        if(!target) return;
        if (!(target instanceof contexter)) return clearCache(getQuery(target), key);
        return target.cache.delete(key);
    }

    let explore = {};

    let json = {
        string2obj : function (s) {
            if (typeof (s) != 'string') return s;
            let temp = new Function(`return {${s}};`);
            return temp();
        }
    }

    let shared = new Map();
    shared.set('gc', new Map());
    let __sharedId = 0;

    /**
     * 序列对象结构:
     * @namespace ScriptableQueryObject
     * @property {string} color - 按钮的颜色，使用 CSS 颜色值表示
     */

    const __version = `0.1`;
    let ID = 0;

    let common = {};
    common.screen2Map = function(x, y){
        x += $gameMap.tileWidth() * $gameMap._displayX;
        y += $gameMap.tileHeight() * $gameMap._displayY;
        return {x, y};
    }

    /**
     * 服务器对象
     * @memberof ScriptableQueryObject
     * @class
     */
    function Server() {
        this.init(...arguments);
    }
    Server.prototype = Object.create(evcontext.ev.prototype);
    Server.prototype.init = function (host, cache) {
        evcontext.ev.prototype.init.call(this, ...arguments);
        this._host = host;
        this._app = new Map();
        this.cache = cache;
    }
    /**
     * 添加一个响应事件, 可以响应fetch(请求)和spread(广播)过来的数据
     * @param {string} path 事件名
     * @param {object|function} data 执行数据(打包后的序列或方法块)
     * <strong>如为方法块</strong>会有两个可访问的特殊变量,
     * req-传递过来的打包消息
     * res-返回对象
     * res.host-主机即服务器序列
     * res.server-当前服务器
     * res.yes(返回数据)-表示接受请求并返回数据给客户端执行成功相关逻辑
     * req.no(返回数据)-表示拒绝请求并返回数据给客户端执行失败的相关逻辑
     */
    Server.prototype.get = function (path, contexterblock) {
        if (!contexterblock) return;
        this.on(path, (req, _res) => {
            _res = _res || {};
            const res = { server: this, yes: _res.resolve, no: _res.reject };
            _fetchAfter(this._host, contexterblock, { req, res });
            return;
        })
    }
    /**
     * 广播
     * @param {string} path 广播的事件名
     * @param {any} req 广播打包数据
     * @param {any} delay=1 延迟，单位帧
     * @param {number} port=80 端口 
     * @param {array|function} filter=null 过滤数组或过滤函数
     */
    Server.prototype.spread = function (path, req, delay = 1, filter = null) {
        let res = _newPromise();
        let _delay = delay;
        if(filter && filter.map){
            filter = filter.map((b) => {
                return getQuery(b);
            })
        }
        let once = () => {
            if (_delay-- <= 0) {
                EV.off('gamemapupdate', once);
                this._app.forEach((data, app) => {
                    if (Array.isArray(filter) && filter.indexOf(app) < 0) return;
                    if (typeof (filter) == 'function' && !filter(app)) return;
                    const server = app._server;
                    if (!server) return;
                    server.emit(path, req, res);
                })
            }
        }
        EV.on('gamemapupdate', once);
    }
    /**
     * 手动关闭一个客户端的连接
     * @param {Game_Battler|contexter|Game_Character} a 客户端
     */
    Server.prototype.close = function (a) {
        const app = getQuery(a);
        if (!app) return;
        this._app.delete(app);
    }
    Server.prototype.update = function () {
        this.emit('update');
        this._app.forEach((data, app, map) => {
            if (!contexter.running.get(app.id)) {
                map.delete(app);
            }
        })
    }
    /**
     * 所有序列对象结构的父类
     * @memberof ScriptableQueryObject
     * @class
     */
    function contexter() { this.initialize(...arguments) };
    Object.defineProperties(contexter.prototype, {
        prefab: {
            get: function(){ return this._battler.prefab }
        },
    })
    contexter.prototype.initialize = function (source) {
        this.source = source;
        this.id = (ID++);
        this.query = new Map();
        this.cache = new Map();
        this.currentQueries = new Map();
        this.gccb = new Map();
        this.createServer();
        this.cache.set('id', this.source.id);
        this.cache.set('this', this);
        this.cache.set('exe', this.exec.bind(this));
        
        // 240621 序列间拓展
        let map = contexter.preComplied.get(`${this.constructor.name}${this.source.id}`);
        if (map && map.__relation) {
            this.__relation = map.__relation;
        }
        
    }
    /**
     * 创建服务器
     * @param {number} port=80 端口
     * @returns {Server}
     */
    contexter.prototype.createServer = function (port = 80) {
        const server = new Server(this);
        this._server = server;
        return server;
    }
    /**
     * 获取服务器
     * @param {Game_Battler|Game_Character|contexter} a 服务器序列
     * @param {number} port=80 端口
     * @returns {Server}
     */
    contexter.prototype.getServer = function (a=this) {
        a = getQuery(a);
        if (!a) return;
        return a._server;
    }
    /**
     * 连接某个服务器
     * @param {Server} server 服务器
     * @param {contexter|Game_Battler|Game_Character} app=this 客户端
     * @param {boolean} re=false 重置连接
     * @param {any} cache={} 初始数据
     * @returns {any}
     */
    contexter.prototype.connect = function (server, app = this, re = false, cache = {}) {
        if (!server) return;
        app = getQuery(app);
        if (!app) return;
        let data = server._app.get(app);
        if (data && !re) return data;
        server._app.set(app, cache);
        return cache;
    }
    /**
     * 主动关闭与服务器的连接
     * @param {Server} server 服务器
     */
    contexter.prototype.disconnect = function (server) {
        if (!server) return;
        server._app.delete(this);
        return true;
    }
    let _fetchAfter = function(contexter, rrTarget, ds){
        let tryi = implicitStart(contexter, rrTarget, ds);
        if(!tryi && typeof(rrTarget) == 'function'){
            rrTarget(contexter, ds);
        }
    }
    /**
     * 发送消息到某个<strong>已连接的</strong>服务器
     * @param {Server} server 服务器
     * @param {contexter|Game_Battler|Game_Character} app=this 客户端
     * @param {string} path 事件id
     * @param {any} req 打包后数据
     * @param {number} delay=1 延迟, 单位帧
     * @param {function} resolved=undefined 成功回调
     * @param {function} rejected=undefined 失败回调
     */
    contexter.prototype.fetch = function (server, app = this, path, req, delay = 1, resolved = undefined, rejected = undefined) {
        app = getQuery(app);
        if (!app || !server || !server._app.has(app)) return;
        let res = _newPromise();
        if (resolved) {
            res.then((ds)=>_fetchAfter(app, resolved, ds));
        }
        if (rejected) {
            res.catch((ds)=>_fetchAfter(app, rejected, ds));
        }
        let _delay = delay;
        let once = () => {
            if (_delay-- <= 0) {
                EV.off('gamemapupdate', once);
                server.emit(path, req, res);
            }
        }
        EV.on('gamemapupdate', once);
        return res;
    }
    contexter.prototype._splitArgs2List = function () {
        const spilter = '..';
        let args = [];
        let temp = [];
        Array.from(arguments).forEach((a) => {
            if (a == spilter) {
                if(temp.length){
                    args.push(temp);
                }
                temp = [];
                return;
            }
            temp.push(a);
        })
        if (temp.length) {
            args.push(temp);
        }
        // args = args.filter((v)=>v && v.length);
        return args;
    }
    contexter.prototype.exec = function (data, excontext={}) {
        if (this.__gcing) return;
        if (!this._execMeetConditions(data, excontext)) return;
        let result;
        let list = data.list;
        if (!Array.isArray(data.list)) {
            list = [data.list];
        }
        list.forEach((d) => {
            result = this._exec(d, excontext);
        })
        return result;
    }
    let tryExec = true;
    if(tryExec){
        let exec = contexter.prototype.exec;
        contexter.prototype.exec = function (...args) {
            try{
                return exec.call(this, ...args);
            }catch(e){
                console.error(e, this.constructor.name, this.source.id, ...args);
            }
        }   
    }
    contexter.prototype._throw = function (m) {
        throw new Error(`${m} 位置 ${this.constructor.name} ${this.source.id}`);
    }
    contexter.prototype._exec = function (data, excontext={}) {
        this._execingName = data.name;
        let args1 = data.args || [];
        let cache = this.cache;
        let args = [];
        // console.log(data);
        args1.forEach((a) => {
            if (typeof (a) == 'function') {
                if (a.as && a.as.Func) {
                    args.push(a);
                    return;
                }
                args.push(a(this, excontext));
                return;
            }
            args.push(a);
        })
        let result, s = data.source;
        if (typeof (s) == 'string') {
            result = this[s](...args);
        }
        else if (typeof (s) == 'function') {
            let ex = Object.assign({ args }, excontext);
            result = s(this, ex);
        }
        let cacheName = data.cached;
        if (cacheName) {
            cache.set(cacheName, result);
        }
        return result;
    }
    contexter.prototype.float = function (value, radio) {
        return value;
    }
    /**
     * 条件判定响应:最大执行次数, 执行频率, 类if的?!表达式,
     * @todo 类sendMessage的事件响应或  get/set响应
     * @param {object} data
     * @returns {any}
     */
    contexter.prototype._execMeetConditions = function (data, excontext) {
        let f = data.flags;
        if (!f) return true;
        if (f.max != undefined && f.max <= 0) return;
        if (f.cycle != undefined && (f._cyclelog++) % f.cycle) return;
        let cons = f.cons;
        if (!cons) {
            f.max--;
            return true;
        }
        let length = cons.length;
        for (let i = 0; i < length; i++) {
            let a = cons[i];
            let r = a;
            if (typeof (a) == 'function') {
                r = a(this, excontext);
            }
            if (!r) return;
        }
        f.max--;
        return true;
    }
    /**
     * 分享一个表达式函数或方法块用来获取本序列的上下文
     * @param {string} name 引用名
     * @param {function} value 表达式函数或方法块
     * @param {any} scope=undefined
     */
    contexter.prototype.sharelite = function (name, value, scope = undefined) {
        if (!name) {
            this._sharelite = new Map();
            return;
        }
        else if (!value) {
            this._sharelite.delete(name);
            return;
        }
        this._sharelite = this._sharelite || new Map();
        if (!value) return;
        if (typeof (value) == 'function') {
            value = value.bind(this, this);
        }
        this._sharelite.set(name, { value, scope });
        return this._sharelite;
    }


    contexter.prototype.getShareLite = function (name, filter) {
        let target = this._sharelite;
        if (!target) return;
        let data = target.get(name);
        if (!data) return;
        if (filter && !filter(this, data)) return;
        return data;
    }

    contexter.prototype._gcSafe = function () {
        //safegc
        let destroy = this.query.get('destroy');
        if (destroy) {
            destroy.push(this.slice('gc'));
            // console.log(`destroy query of ${this.source.id} auto-gc added`);
        }
        else {
            this.query.set('destroy', this._build('#gc'));
        }
    }
    /**
     * 对应序列暂停
     * @param {number} value 时间
     * @returns {undefined}
     */
    contexter.prototype.pause = function (value) {
        let query = this._execingQuery;
        if (!query) return;
        query.__pause = value;
    }

    /**
     * 开启一个序列
     * @param {string} name 序列名
     * @returns {undefined}
     */
    contexter.prototype.hook = function (name, reset = true, build = true, run = false) {
        if (this.currentQueries.get(name)) return;
        if (name == 'destroy') {
            this.hookoff();
        }
        let target = this.query.get(name);
        if(!this._hookTest(name)) return;
        // 父级锁定
        if (build && !target) {
            target = this.build(name);
        }
        if (!target) return;
        this.currentQueries.set(name, target);
        if (reset) {
            this.resetQuery(target);
        }
        if (run) {
            // console.log(name);
            this.run(name);
        }
        this._afterHook(name);
        return true;
    }
    contexter.prototype._hookTest = function(name, relation = this.__relation){
        if(!relation) return true;
        let r = relation.get(name);
        if(!r) return true;
        let fail = false;
        let map = this.currentQueries;
        if(r.lock){
            r.lock.forEach((name)=>{
                if(fail) return;
                if(map.has(name)){
                    fail = true;
                }
            })
        }
        if(r.parent){   
            r.parent.forEach((name)=>{
                if(fail) return;
                if(!map.has(name)){
                    fail = true;
                }
            })
        }
        return !fail;
    }
    contexter.prototype._afterHook = function(name, relation = this.__relation){
        let r;
        if(relation && (r = relation.get(name)) && r.kill){
            r.kill.forEach((name)=>{
                this.hookoff(name);
            })
        }
    }
    /**
     * 事件侦听，用于桥接底层代码和序列指令
     * 与listen, 服务器的侦听相比，更灵活，同时也更复杂
     * <a href="#_eon">具体实现</a>
     * @returns {any}
     */
    contexter.prototype.eon = function(...args){
        this._eon(...args);
    }
    /**
     * 事件侦听-事件驱动模型
     * @param {Array<any>} queryParams 底层侦听触发时<strong>顺序严格</strong>传进来的参数
     * @param {EventEmitter} ev 任意实现了事件侦听处理的对象，包含on, off, once等函数，如任意一个精灵/龙骨/序列服务器
     * @param {string} ename 事件名
     * @param {function|string} bound 函数(方法块)或隐性序列
     * @param {boolean} once 单次
     * @param {Array<any>} ...listenParams 额外参数如优先级
     * @returns {number} 绝对id
     */
    contexter.prototype._eon = function(ev, ename, bound, once, ...listenParams){
        this._evTemp = this._evTemp || new Map();
        let fn = (...emitParams)=>{
            let data = {};
            emitParams.forEach((p, i)=>{
                data[`req${i}`] = p;
            })
            _fetchAfter(this, bound, data);
        }
        if(once){
            ev.once(ename, fn, ...listenParams);
        }
        else{
            ev.on(ename, fn, ...listenParams);
        }
        let id = performance.now();
        this._evTemp.set(id, { ev, ename, fn });
        return id;
    }
    /**
     * 移除一个事件侦听
     * @param {EventEmitter} ev 任意实现了事件侦听处理的对象，包含on, off, once等函数，如任意一个精灵/龙骨/序列服务器
     * @param {string} ename 事件名
     * @param {function|string} bound 函数(方法块)或绝对id(由eon指令返回)
     * @param {contexter|Game_Battler|Game_Character} target=this 序列或序列实体
     * @returns {boolean} 移除成功
     */
    contexter.prototype.eoff = function(ev, ename, bound, target=this){
        if((bound == 'all' || bound == true) && ev instanceof evcontext.ev){
            ev.off(ename);
        }
        else if((bound == 'all' || bound == true)){
            ev.removeAllListeners(ename);
        }
        else if(target){
            let ct = getQuery(target);
            let fn = _findEvBound(ct, bound);
            if(ev instanceof evcontext.ev){
                ev.off(ename, fn);
                ct._evTemp.delete(bound);
            }
            else{
                ev.removeListener(ename, fn);
                ct._evTemp.delete(bound);
            }
        }
        return true;
    }
    let _findEvBound = function(contexter, b){
        if(typeof(b) == 'function'){
            return b;
        }
        else if(typeof(b) == 'number' && contexter._evTemp){
            let data = contexter._evTemp.get(b);
            if(data){
                return data.fn;
            }
        }
    }
    /**
     * 为某个序列添加一个或多个缓存
     * @param {Game_Battler|Game_Character|contexter} context=this 序列或序列实体
     * @param {any} ...args @example #setCache $a 名称1 $变量1 名称2 $变量2  ... 
     */
    contexter.prototype.setCache = function (context = this, ...args) {
        if (!(context instanceof contexter)) {
            return this.setCache(getQuery(context), ...args);
        }
        args.forEach((v, i) => {
            if (i % 2) return;
            const value = args[i + 1];
            context.cache.set(v, value);
        })
    }
    /**
     * 清除缓存
     */
    contexter.prototype.clearCache = function (context = this, ...keys) {
        if (!(context instanceof contexter)) {
            return this.setCache(getQuery(context), ...keys);
        }
        if(!keys || !keys.length){
            context.cache.clear();
            return;
        }
        keys.forEach((k) => {
            context.cache.delete(k);
        })
    }
    /**
     * 从某个序列中获取一个缓存 
     * @param {Game_Battler|Game_Character|contexter} context=this 序列或序列实体
     * @param {any} key 缓存对应的键
     * @returns {any} 缓存值
     */
    contexter.prototype.getCache = function (context = this, key) {
        if (!(context instanceof contexter)) {
            return this.getCache(getQuery(context), key);
        }
        let result = context.cache.get(key);
        return result;
    }
    /**
     * 重置序列
     * @param {string|Map} target 序列或序列名
     * @returns {boolean}
     */
    contexter.prototype.resetQuery = function (target) {
        if(typeof(target) == 'string'){
            target = this.query.get(target);
        }
        if(!target) return;
        target.__index = 0;
        target.__pause = 0;
        if(target.hookingQuery){
            target.hookingQuery.clear();
        }
        target.hookingQuery = new Map();
        return true;
    }
    /**
     * 关闭一个序列
     * @param {string} name 序列名
     * @returns {undefined}
     */
    contexter.prototype.hookoff = function (name) {
        if (!name) {
            this.currentQueries = new Map();
            return;
        }
        this.currentQueries.delete(name);
        this._hookoffTest(name);
    }
    contexter.prototype._hookoffTest = function (name, relation = this.__relation) {
        let r, children;
        if(relation && (r = relation.get(name)) && (children = r.children)){
            children.forEach((_name) => {
                this.hookoff(_name);
            })
        }

        
        
    }
    contexter.prototype.destroy = function (reset) {
        this.hook('destroy', reset);
    }
    /**
     * 关闭一个序列
     * @param {string} name 序列名
     * @returns {undefined}
     */
    contexter.prototype.export = function (obj, key) {
        let __export = this.cache.get('__export');
        if (!__export) {
            this.cache.set('__export', {});
            return this.export(...arguments);
        }
        __export[key] = obj;
        return obj;
    }
    /**
     * 关闭一个序列
     * @param {string} name 序列名
     * @returns {undefined}
     */
    contexter.prototype.import = function (any) {
        let q = getQuery(any);
        if (!q) return;
        return q.cache.get('__export');
    }
    contexter.prototype._meta = function(name){
        return this.source.meta[name]
    }
    
    contexter.prototype.update = function () {
        this._server.update();
        this.currentQueries.forEach((q, name) => {
            this.run(name, q);
        })
    }
    contexter.prototype.run = function (name, query) {
        if (this.__gcing) return;
        query = query || this.query.get(name);
        if (!query) return;
        query.hookingQuery.forEach((data, i) => {
            this.exec(data);
            if (data.flags && data.flags.max <= 0) {
                query.hookingQuery.delete(i);
            }
        })
        if (query.__pause > 0) {
            query.__pause--;
            return;
        }
        let length = query.length;
        let start = query.__index;
        for (let i = start; i < length; i++) {
            if (query.__pause) break;
            if (!this.currentQueries.get(name)) break;
            let data = query[i];
            this._execingQuery = query;
            this.exec(data);
            this._execingQuery = null;
            if (data.flags && data.flags.max > 0) {
                query.hookingQuery.set(i, data);
            }
            query.__index++;
        }
    }

    /**
     * 240621 只处理预编译过的序列
     * @param {string} name 序列名
     */
    contexter.prototype.build = function (name) {
        let cached = this._buildFromPre(name);
        if (!cached) return;
        return cached;
    }
    contexter.prototype._buildFromPre = function (name) {
        let map = contexter.preComplied.get(`${this.constructor.name}${this.source.id}`);
        if (!map) return;
        let q = map.get(name);
        if (!q) return;
        let nq = [];
        q.forEach((data) => {
            let copyed = this._buildcopy(data);
            nq.push(copyed);
        })
        this.query.set(name, nq);
        this.resetQuery(nq);
        return nq;
    }
    contexter.prototype._buildcopy = function (v) {
        if (Array.isArray(v)) {
            let n = [];
            v.forEach((v1) => {
                n.push(this._buildcopy(v1));
            })
            return n;
        }
        else if (v && typeof (v) == 'object') {
            let n = {};
            for (let i in v) {
                n[i] = this._buildcopy(v[i]);
            }
            return n;
        }
        return v;
    }
    contexter.prototype._build = function (list) {
        list = list.split(/#/).map((value) => {
            value = value.trim();
            value = value.replace(/\（/gi, '(');
            value = value.replace(/\）/gi, ')');
            value = value.replace(/，/gi, ',');
            value = value.replace(/：/gi, ':');
            value = value.replace(/“|”/gi, '"');
            value = value.replace(/？/gi, '?');
            return value;
        }).filter(value => value.length);
        let query = [];
        while (list.length) {
            let value = list.shift();
            let obj = this.slice(value);
            if (obj && obj.list) {
                query.push(obj);
            }
        }
        this.resetQuery(query);
        return query;
    }
    contexter.prototype._slice = function (value) {
        let ca = value.match(/\{/g);
        let cb = value.match(/\}/g);
        if (ca && cb && (ca.length != cb.length)) {
            this._throw(`大括号和小括号数量必须相同! ${value}`);
        }
        let result;
        if (!ca) {
            result = value.split(/\s+/g);
        }
        else {
            result = this._sliceSplitBraces(value);
        }
        return result;
    }
    contexter.prototype._sliceSplitBraces = function (input) {
        let results = [];
        let braceCount = 0;
        let v1 = '';
        let save = (i) => {
            if (braceCount) return;
            let v2 = v1.trim();
            if (!v2) return;
            results.push(v2);
            v1 = '';
            return true;
        }
        for (let i = 0; i < input.length; i++) {
            let v = input[i];
            if (v === '{') {
                save(i);
                v1 += v;
                braceCount++;
            }
            else if (v === '}') {
                braceCount--;
                v1 += v;
                save(i);
            }
            else {
                v1 += v;
            }
        }
        save();
        let count = 0;
        let startDone = false;
        let newResult = [];
        for (let i = 0; i < results.length; i++) {
            let s = results[i];
            if (!/\{/i.test(s)) {
                s = s.split(/\s+/i).map(s1 => { return s1.trim() }).filter(s1 => s1.length);
                newResult = newResult.concat(s);
            }
            else {
                newResult.push(s);
            }
            if (!startDone && /\{/i.test(s)) {
                count++;
            }
            else {
                startDone = true;
            }
        }
        newResult.start = count;
        return newResult;
    }
    // 指令编译
    contexter.prototype.slice = function (value) {
        // 已编译过
        if (value && value.list) {
            return value;
        }
        if (!value) return;
        value = value.trim();
        if (!value) return;
        // 注释
        if (/^0/i.test(value)) return;
        let result = this._slice(value);
        let start = result.start || 0;
        let flagList = result.slice(0, start);
        // 条件
        let flags = {};
        flagList.forEach((v) => {
            this.warmFlags(v.replace(/\{|\}/g, ''), flags);
        })
        result = result.slice(start, result.length);
        let newResult = [];
        let temp = [];
        // 多个指令
        result.forEach((v) => {
            if (/^\.\+/i.test(v)) {
                newResult.push(temp);
                temp = [];
                return;
            }
            temp.push(v);
        })
        newResult.push(temp);
        let obj = {};
        let list = [];
        // 逐指令解释
        newResult.forEach((r) => {
            list.push(this._sliceEx(r));
        })
        if (list.length <= 1) {
            list = list[0];
        }
        let needFlags = (Object.entries(flags).length > 0);
        if (needFlags) {
            Object.assign(obj, { flags });
        }
        Object.assign(obj, { list });
        return obj;
    }
    contexter.prototype._sliceEx = function (result) {
        let entry = this.warmEntry(result[0]);
        if (!entry) return;
        let obj = entry;
        let args = result.slice(1, result.length);
        obj = Object.assign({}, entry);
        args = args.map((v) => {
            let result = this._sliceArgs(v);
            return result;
        })
        Object.assign(obj, { args });
        return obj;
    }
    contexter.prototype._sliceArgs = function (v) {
        let sp = /^\{\./i.test(v);
        let re = /^\{\.B|^\{\.S|^\{\.V|^\{\.|^\{|\}$/gi;
        let a = v.replace(re, '').trim();
        if (!sp) {
            let a1 = this.warmArg(a, 'value');
            return a1;
        }
        // 特性块
        let a1;
        if (/^\{\.B/i.test(v)) { //方法块
            a1 = this.warmArg(a, 'block', true);
            a1.as = a1.as || { Func: true };
        }
        else if (/^\{\.S/i.test(v)) { //打包指令
            a1 = a;
            return this.slice(a1);
        }
        else if (/^\{\.|^\{\.V/i.test(v)) { //返回值函数
            a1 = this.warmArg(a, 'value', true);
            a1.as = a1.as || { Func: true };
        }
        return a1; //值
    }
    // 指令条件解释
    contexter.prototype.warmFlags = function (v, flags) {
        if (/^\?|^\!/.test(v)) {
            let con = this.warmArg(v.replace(/^\?/, ''));
            flags.cons = flags.cons || [];
            flags.cons.push(con);
        }
        else if (/^\+/.test(v)) {
            let max = this.warmArg(v.replace(/^\+/, ''));
            let n = Number(max);
            if (!n) {
                flags.max = Infinity;
            }
            else {
                flags.max = n;
            }
        }
        else if (/^\%/.test(v)) {
            let cycle = this.warmArg(v.replace(/^\%/, ''));
            flags.cycle = cycle;
            flags._cyclelog = 0;
        }
    }
    // 指令名解释
    contexter.prototype.warmEntry = function (value1) {
        if (!value1) return;
        let entry1 = value1.split(/:/i);
        // let chaining = entry1[0].split(/\./i);
        let name = entry1[0];
        let cached = entry1[1];
        let entry = { name };
        let source = this.warmArg(name, 'function');
        // 自己的方法
        if (!source) {
            this._throw(`检查指令 ${value1}`);
        }
        entry = { source, name };
        if (cached) {
            entry.cached = cached;
        }
        return entry;
    };
    let isImplicitName = function(context, a){
        const map = contexter.preComplied.get(`${context.constructor.name}${context.source.id}`);
        if(!map || !map.__implicited) return;
        if(map.__implicited.has(a)) return true;
    }
    /**
     * 指令任意字符串解释 <strong>CORE</strong> <strong>核心方法</strong>
     * @param {any} a
     * @param {any} type='value'
     * @param {any} ignoreSimple=false
     * @returns {function|any}
     */
    contexter.prototype.warmArg = function (a, type = 'value', ignoreSimple = false) {
        // 1. 缓存变量名的生成
        let ims; //是否是隐性序列的变量
        if(!isImplicitName(this, a)){
            ims = a.match(/(\~[a-z\d_]+)/gi)
        }
        let vars = a.match(/(?<!\^)(\$[a-z\d_]+)/gi); //是否是局部变量
        let global = /\^/.exec(a); //是否是全局变量
        if (!ims && !vars && !global && type == 'function') {
            if (!this[a]) {
                this._throw(`检查指令 ${a}`);
            }
            return a;
        }
        if (!ims && !vars && !global && !ignoreSimple) return this.warmArgSimple(a);
        let iargs = JSON.parse(JSON.stringify(ims || []));
        let seti = new Set();
        // console.log(iargs);
        iargs.forEach((a) => {
            a = a.replace(/\~/, '');
            seti.add(a.trim());
        })
        iargs = Array.from(seti);
        let args = JSON.parse(JSON.stringify(vars || []));
        let set = new Set();
        args.forEach((a) => {
            a = a.replace(/\$/, '');
            set.add(a.trim());
        })
        args = Array.from(set);
        let st1 = 'const __c = context.cache;\n';
        args.forEach((a) => {
            st1 += `let $${a} = __c.get('${a}');\n`;
        })
        iargs.forEach((a) => {
            st1 += `let __${a} = excontext.${a};\n`;
        })

        // 2. 函数逻辑体的生成
        a = a.replace(/\^/g, '');
        seti.forEach((_a)=>{
            let reg = new RegExp(`~${_a}`, 'gi');
            a = a.replace(reg, `__${_a}`);
        })
        let log;
        let t = type.toLowerCase();
        if (t == 'block') {
            a = a.replace(/\nel\s*/g, '\nelse\t');
            a = a.replace(/\nef\s*\(/g, '\nelse if(');
            let replacer = (matched)=>{
                matched = matched.replace(/;|\n/, '');
                let _m = matched.replace(/\.\.\./, 'let ');
                _m = _m.trim();
                _m += ' = excontext;\n';
                return _m;
            }
            // ...{...} = excontext;
            a = a.replace(/\.\.\.\{[^\{\}]+\}\;?\s*\n/g, replacer);
             // ...[...] = excontext;
            a = a.replace(/\.\.\.\[[^\{\}]+\]\;?\s*\n/g, replacer);
            log = `${a}`;
        }
        else if (t == 'value') {
            log = `const result = ${a};\nreturn result;`;
        }
        else if (t == 'function') {
            log = `const args = (excontext.args || []);\nlet any = ${a}(...args);\nreturn any;`;
        }
        log = '//context.cache.get\n' + st1 + '//function.block\n' + log;
        let dynamic;
        try {
            dynamic = new Function('context', 'excontext', log);
        }
        catch (e) {
            this._throw(log + '\n' + e.message)
        }

        return dynamic;
    }
    contexter.prototype.warmArgSimple = function (a) {
        if (!a) return a;
        if (a.toLowerCase() == 'true') return true;
        if (a.toLowerCase() == 'false') return false;
        if (a.toLowerCase() == 'null') return null;
        if (a.toLowerCase() == 'undefined') return undefined;
        if (/^\s*0x/i.test(a)) {
            return a;
        }
        if (!/[a-z]|[=<>]|[\u4e00-\u9fa5]/i.test(a) && (/\d/i.test(a))) {
            return eval(a);
        }
        let f = parseFloat(a);
        if (!isNaN(f)) {
            return f;
        }
        return a.trim();
    }
    /**
     * js标准值类型或数组类型
     * 参数长度等于1直接返回传入的参数 
     * 参数长度大于1返回一个数组
     * @returns {value|array}
     */
    contexter.prototype.value = function () {
        if (arguments.length < 2) {
            return arguments[0];
        }
        let array = Array.from(arguments);
        return array;
    }
    /**
     * 复制某序列的某些缓存到另一个序列中
     * @example copyCache2B ^$gamePlayer 技能序列 name1 name2 name3 ...
     * @param {Game_Battler|contexter|Game_Character} a 源序列或序列实体
     * @param {Game_Battler|contexter|Game_Character} b 目标序列或序列实体
     * @param {Array<string>} ...caches 缓存名或直接缓存数据
     * @returns {boolean}
     */
    contexter.prototype.copyCacheA2B = function (a, b, ...caches) {
        a = getQuery(a);
        b = getQuery(b);
        if(!a || !b) return;
        caches.forEach((name)=>{
            b.cache.set(name, a.cache.get(name));
        })
        return true;
    }
    /**
     * 线性映射
     * @param {number} x 需要映射的值
     * @param {number} a 原区间左端
     * @param {number} b 原区间右端
     * @param {number} c 现区间左端
     * @param {number} d 现区间右端
     * @returns {number} 映射后的值
     */
    contexter.prototype.linearValue = function (x, a, b, c, d) {
        const r = c + ((x - a) / (b - a)) * (d - c);
        return r;
    }
    /**
     * js标准键值对
     * @returns {object}
     */
    contexter.prototype.json = function () {
        let obj = {};
        Array.from(arguments).forEach((v, i, a) => {
            if (i % 2) return;
            obj[v] = a[i + 1];
        });
        return obj;
    }
    /**
     * js标准Map数据结构
     * @returns {map}
     */
    contexter.prototype.map = function () {
        let obj = new Map();
        Array.from(arguments).forEach((v, i, a) => {
            if (i % 2) return;
            obj.set(v, a[i + 1]);
        });
        return obj;
    }
    /**
     * 随机数生成
     * @param {number} min=0 下限
     * @param {number} max=1 上限
     * @param {number} floorType=0 取整类型 floor-向下 round-向上 ceil-四舍五入 0-无取整
     * @param {number} weight 权重，TODO
     * @returns {number}
     */
    contexter.prototype.random = function (min = 0, max = 1, floorType = 0, weight) {
        let result = (Math.random() * (max - min)) + min;
        if (!floorType) return result;
        else if (/floor/i.test(floorType)) {
            return Math.floor(result);
        }
        else if (/round/i.test(floorType)) {
            return Math.round(result);
        }
        else if (/ceil/i.test(floorType)) {
            return Math.ceil(result);
        }
        return result;
    }
    /**
     * 获取对象.属性名 === value 对象.属性名
     * @param {object} obj 对象
     * @param {string} name 属性名
     * @returns {undefined} 值
     */
    contexter.prototype.prop = function (obj, name) {
        return obj[name];
    }
    /**
     * 自定义函数
     * @deprecated
     * @param {string} a 缓存的函数名或函数体
     * @returns {undefined} 
     * 如果第一个参数是(a,b){...}这样的函数体则返回一个通过new Function生成的函数,
     * 如果第一个参数是函数的名字，后续参数则是这个函数的参数，返回执行后的结果
     */
    contexter.prototype.fn = function () {
        let value = arguments[0];
        let args = Array.from(arguments);
        args.splice(0, 1);
        if (typeof (value) == 'function') {
            let result = value(...args);
            return result;
        }
        this._throw(`未找到${value}`);
    }
    /**
     * 预编译一个临时函数
     * @returns {any}
     */
    contexter.prototype.prefn = function () {
        return new Function(...arguments);
    }
    // todo 连接不同备注的相同部分 精简
    // contexter.prototype.concat = function (id) {
    //     let CLASS = this.CLASS;
    //     if (!CLASS.const || !CLASS.const.database) return;
    //     let database = CLASS.const.database;
    // }
    contexter.prototype.preComplieFn = function () {
        this.query.forEach((q) => {
            let length = q.length;
            let removedCount = 0;
            for (let i = 0; i < length; i++) {
                let data = q[i - removedCount];
                if (!/^fn/i.test(data.name)) continue;
                let f = this.exec(data);
                if (typeof (f) == 'function') {
                    q.splice(i - removedCount, 1);
                    removedCount++;
                }
            }
        })
    }
    /**
     * 执行并返回一个任意函数或方法块
     * @param {function} e 方法块
     * @returns {any}
     */
    contexter.prototype.eval = function (e, ...args) {
        if (typeof (e) != 'function') return;
        let excontext = {};
        args.forEach((value, i)=>{
            if(i % 2) return;
            excontext[value] = args[i + 1];
        })
        return e(this, excontext);
    }
    //
    contexter.prototype.listen = function (...args) {
        let server = this.getServer(this);
        if(!server) return;
        return server.get(...args);
    }
    contexter.prototype._gccb = function (any, cb) {
        if (!cb || !any) return;
        this.gccb.set(any, cb);
        return any;
    }
    /**
     * 回收，真正销毁序列对象(准备进入GC, 任何地方都不应该再引用这个序列)
     * @param {any} any 如为空，视为完全销毁当前序列
     */
    contexter.prototype.gc = function (...ids) {
        if (!ids.length) {
            this.gccb.forEach(cb=>{
                cb ? cb() : 0;
            })
            this.__gcing = true;
            if(this._evTemp){
                this._evTemp.forEach((data, id)=>{
                    data.ev.off(data.ename, data.fn);
                })
                this._evTemp.clear();
            }
            if (this.constructor.running) {
                this.constructor.running.delete(this.id);
            }
            contexter.running.delete(this.id);
            if(this.constructor.running){
                this.constructor.running.delete(this.id);
            }
            return;
        }
        ids.forEach((id)=>{
            let any = this.cache.get(id);
            this.cache.delete(id);
            let cb = this.gccb.get(any);
            this.gccb.delete(any);
            cb ? cb() : 0;
        })
    }
    // 测试序列，通常用于判定序列是否合法
    contexter.prototype._test = function () {
        let name = 'test';
        this.hook(name, true, true, true);
        if (this.__gcing) return;
        return true;
    }
    /**
     * 调试，打印
     * @param {any} v
     */
    contexter.prototype.log = function () {
        if (arguments.length > 1) {
            console.group(`${this.constructor.name} ${this.source.id}`);
            Array.from(arguments).forEach((v) => {
                console.log(v);
            })
            console.groupEnd();
        }
        else {
            console.log(...arguments);
        }
    }

    function Game_CharacterSkill() {
        this.initialize(...arguments);
    }
    Game_CharacterSkill.prototype = Object.create(Game_CharacterBase.prototype);
    Game_CharacterSkill.prototype.constructor = Game_CharacterSkill;

    Game_CharacterSkill.prototype.setupSprite = function (characterName) {
        this._characterName = characterName;
        this.mapObject = this;
        let sprite = new Sprite_Character(this);
        // sprite.removeAllChildren();
        return sprite;
    };

    if(typeof(QSprite) != 'undefined'){
        Game_CharacterSkill.prototype.update = function () {
            this.updateAnimation();
            this.updatePose();
        }
    
        Game_CharacterSkill.prototype.qSprite = function () {
            return QSprite.json[this.isQCharacter()] || null;
        };
    }
    else{
        Game_CharacterSkill.prototype.update = function () {
            
        }
    }
    

    /**
     * 技能对象
     * 预缓存变量有
     * $a 技能使用者
     * $b 结算伤害时的当前目标(会动态变化)
     * @memberof ScriptableQueryObject
     * @extends contexter
     * @class 
     */
    function Skill() { this.initialize(...arguments) };
    Skill.prototype = Object.create(contexter.prototype);
    Skill.prototype.constructor = Skill;

    let Skill_update = Skill.prototype.update;
    Skill.prototype.update = function(){
        if(this._battler.__gcing){
            this.gc();
            return;
        }
        Skill_update.call(this, ...arguments);
    }   
    Skill.prototype.setup = function () {
        this.cache.set('a', this._battler);
        this.cache.set('b', null);
        let test = this._test();
        if (!test) return;
        this.build('life');
        this.build('destroy');
        this.build('trigger');
        this.setting();
        this.hook('life');
        Skill.running.set(this.id, this);
        contexter.running.set(this.id, this);
        return this;
    }
    Skill.prototype.pay = function (type, value) {
        type = type.toLowerCase();
        if (this._battler[type] < value) return;
        switch (type) {
            case 'hp': {
                this._battler._hp -= value;
                break;
            }
            case 'tp': {
                this._battler._tp -= value;
                break;
            }
            case 'mp': {
                this._battler._mp -= value;
                break;
            }
        }
        return true;
    }
    /**
     * 开始销毁序列
     * @param {boolean} reset 重置序列的索引(重头开始)
     * @returns {any}
     */
    Skill.prototype.destroy = function (reset) {
        this.hook('destroy', reset);
    }
    /**
     * 开始伤害序列
     * @param {boolean} reset 重置序列的索引(重头开始)
     * @returns {any}
     */
    Skill.prototype.damage = function (reset) {
        this.hook('damage', reset);
    }
    Skill.prototype.setting = function () {
        this._gcSafe();
        // this.query.get('trigger');
    }


    /**
     * 创建一个碰撞器
     * @param {number} w 宽度
     * @param {number} h 长度
     * @param {number} x 水平坐标
     * @param {number} y 垂直坐标
     * @param {string} type 类型，默认矩形,rect
     * @returns {object} 碰撞器
     */
    Skill.prototype.collider = function (...param) {
        let c;
        if(param[0].parts){
            c = param[0]; //直接碰撞器
        }
        else{
            c = UtilsExtend.matter.createFromParamsNoOffset(param);
        }
        this._gccb(c, this._removeCollider.bind(this, c));
        c.mass = 0.25;
        c.isSensor = true;
        c.label = 'skill';
        SceneManager._scene.addBody(c);
        c.width = c.bounds.max.x - c.bounds.min.x;
        c.height = c.bounds.max.y - c.bounds.min.y;
        return c;
    }
    Skill.prototype._removeCollider = function (collider) {
        collider._removed = true;
        SceneManager._scene.removeBody(collider);
    }
    /**
     * 为碰撞器A应用一个力
     * @param {object} collider 碰撞器A
     * @param {number} value 力度
     * @param {number} radian 弧度
     * @param {boolean} rotate=true 是否根据弧度旋转
     * @param {string} type 类型，默认推力, push
     * @returns {object} 碰撞器A
     */
    Skill.prototype.force = function (collider, value, radian, rotate = true, type) {
        if (!collider) return;
        radian = radian || 0;
        type = type || 'push';
        UtilsExtend.matter.Force(type, collider, radian, 0, value);
        if (rotate) {
            Matter.Body.setAngle(collider, radian);
        }
        return collider;
    }
    // /**
    //  * 为使用者加一个状态
    //  * @param {any} id
    //  * @param {any} target=this._battler 目标
    //  * @returns {any}
    //  */
    // Skill.prototype.addState = function(id, target = this._battler){

    //     let add = target.gameObject.addState(id);
    //     return add;
    // }
    /**
     * @param {any} collider
     * @param {any} radian
     * @param {any} type
     * @returns {undefined}
     */
    Skill.prototype.tween = function (collider, radian, type) {

    }
    /** 技能位图容器
     * @returns {undefined}
     */
    Skill._createSkillOjbectMap = function () {
        let skillObjectMap = SceneManager._scene._skillObjectMap;
        if (skillObjectMap) return skillObjectMap;
        let map = new Sprite();
        map.z = (Number($dataMap.meta.skillobjectz) || 11); //默认无限图层底图之上
        SceneManager._scene._spriteset._tilemap.addChild(map);
        skillObjectMap = SceneManager._scene._skillObjectMap = map;
        return skillObjectMap;
    }
    /**
     * 生成一个精灵，如技能子弹的精灵
     * @param {object} collider 碰撞器
     * @param {string} name 精灵文件名
     * @returns {Sprite} 精灵
     */
    Skill.prototype.sprite = function (collider, name, dir, add = true) {
        if (!collider || !name) return;
        let character = new Game_CharacterSkill();
        let mainSprite = character.setupSprite('&' + name);
        character._direction = dir || 2;
        character.clearPose ? character.clearPose() : character._pose = '';
        character._movespeed = 3;
        character._moveFrequency = 3;
        character.mainSprite = mainSprite;
        character.collider = collider;
        mainSprite.collider = collider;
        mainSprite._c = character;
        this._gccb(mainSprite, this._removeSprite.bind(this, mainSprite));
        mainSprite.on("remove", ()=>{
            mainSprite.destroy();
        })
        character.screenZ = function(){
            return (mainSprite.z == undefined ? 3 : mainSprite.z);
        }
        add ? this.addSkill2scene(mainSprite) : null;
        return mainSprite;
    }
    /**
     * 将技能精灵添加到场景中
     * @param {Sprite} s 精灵
     */
    Skill.prototype.addSkill2scene = function (s) {
        let skillmap = this.source.meta.skillmap;
        if(skillmap){
            const skillObjectMap = Skill._createSkillOjbectMap();
            skillObjectMap.addChild(s);
            return;
        }
        // 240826 BY 精灵层级
        SceneManager._scene._spriteset._tilemap.addChild(s);
        s.z = isNaN(s.z) ? 3 : s.z;
    }
    Skill.prototype.c2Sprite = function (sprite, collider) {
        sprite._c.collider = sprite.collider = collider;
    }
    Skill.prototype._removeSprite = function (s) {
        // if (s && s.parent) {
        //     s.parent.removeChild(s);
        // }
        s.remove();
        this.gc(s.collider);
    }

    /**
     * 同步精灵和碰撞器
     * @param {Sprite} sprite 精灵
     * @param {string} type 类型，pos-位置
     * @param {boolean} rotate 是否同步旋转
     * @param {object=} collider 碰撞器
     * @returns {undefined}
     */
    Skill.prototype.sync = function (sprite, type, rotate, collider, ox = -0.5, oy = -1) {
        if (!sprite) return;
        collider = collider || sprite.collider;
        if (type == 'pos') {
            UtilsExtend.matter.characterSyncBody(collider, sprite._character, ox, oy);
            if (rotate != undefined) {
                sprite.rotation = collider.angle + rotate;
            }
        }
        // skill mapobject only update here
        sprite._character.update();
        // sprite.updatePosition();
    }

    /**
     * 设置碰撞器A的位置
     * @param {object} collider 碰撞器A
     * @param {number} x 水平坐标
     * @param {number} y 垂直坐标
     * @returns {undefined}
     */
    Skill.prototype.pos = function (collider, x, y) {
        Matter.Body.setPosition(collider, { x, y });
    }
    /**
     * 设置碰撞体速度
     * @param {object} collider 碰撞体
     * @param {number} v=0 速度值
     * @returns {any}
     */
    Skill.prototype.speed = function (collider, v = 0) {
        Matter.Body.setSpeed(collider, v);
    }
    /**
     * 设置碰撞体加速度
     * @param {any} collider 碰撞体
     * @param {any} x=0 水平加速度值
     * @param {any} y=0 垂直加速度值
     * @returns {any}
     */
    Skill.prototype.velocity = function (collider, x = 0, y = 0) {
        Matter.Body.setVelocity(collider, { x, y });
    }

    /**
     * 把碰撞器A置于碰撞器B前
     * @param {object} collider 碰撞器A
     * @param {object} collider1 碰撞器B
     * @param {number} radian 弧度
     * @param {boolean} rotate 考虑弧度带来的旋转
     * @param {array} offset 偏移
     * @returns {undefined}
     */
    Skill.prototype.front = function (collider, collider1, radian, rotate, offsetx = 0, offsety = 0) {
        if (!collider || !collider1) return;
        const { x, y } = collider1.position;
        if (rotate) {
            Matter.Body.setAngle(collider, radian);
        }
        radian = radian || 0;
        let cr = Math.cos(radian);
        let sr = Math.sin(radian);
        let r = collider.width / 2 + collider1.width / 2; // 考虑matterjs的左手坐标系和初始设置的width,height
        // let height = collider.height/ 2;
        let x1 = (r + offsetx) * cr + x;
        let y1 = (r + offsety) * sr + y;
        Matter.Body.setPosition(collider, { x: x1, y: y1 });
    }


    /**
     * 碰撞体是否碰撞到地形
     * @param {object} collider 碰撞器
     * @returns {boolean|array} 碰撞结果或地形碰撞器
     */
    Skill.prototype.bangTerrain = function (collider, destroy = true) {
        if (!Matter.RMgroup.terrain) return;
        let result;
        Matter.RMgroup.terrain.forEach((active, body) => {
            if (result && result.length) return;
            result = Matter.Query.collidesWithContexting(collider, [body], new Map());
        })
        if (result && result.length && destroy) {
            this.destroy();
        }
        return result;
    }
    /**
     * 获取碰撞体碰撞到的所有目标
     * @param {object} collider 碰撞体
     * @param {string} team 地图碰撞体组名，如敌人碰撞体组，队伍碰撞体组
     * @param {boolean} nomulti=true 忽略二次伤害
     * @param {boolean} noself=true 忽略施法者
     * @returns {Array} 目标
     */
    Skill.prototype.getTargets = function (collider, team, nomulti = true, noself = true) {
        let targets;
        let bodies = [];
        let contexts = new Map();
        let group = Prefab.runningGroup[team];
        if (!group) return;
        // TODO 过滤优化以及多碰撞器的过滤优化
        this.baseFilter = this.baseFilter || new Map();
        if (noself) {
            this.baseFilter.set(this._battler.prefab, true);
        }
        if (nomulti) {
            let map = new Map();
            group.forEach((v, key) => {
                if (this.baseFilter.get(v)) return;
                map.set(key, v);
            })
            group = map;
        }
        this._updateColliderFilterGroup(group, bodies, contexts);
        let result = Matter.Query.collidesWithContexting(collider, bodies, contexts);
        if (result.length > 0) {
            targets = [];
            result.forEach((v) => {
                if (!v) return;
                let prefab = v.contexts;
                targets.push(prefab.gameObject);
                this.baseFilter.set(prefab, true);
            })
        }
        this._targets = targets;
        // if(targets.length){
        //     this.damage();
        // }
        return targets;
    }
    /**
     * @param {Map|Array} group 源碰撞体数组A
     * @param {Array} bodies 目标碰撞体数组B
     * @param {Map} contexts 建立碰撞数据与碰撞体的映射
     * @returns {undefined}
     */
    Skill.prototype._updateColliderFilterGroup = function (group, bodies, contexts) {
        if (!group) return;
        group.forEach((prefab) => {
            // let fsm = prefab.getCache('fsm');
            // if(fsm.noDamages) return;
            let battleCollider = prefab.getCache('battle-collider');
            if (!battleCollider || prefab.gameObject.nodamage) return;
            bodies.push(battleCollider);
            contexts.set(battleCollider, prefab);
        })
    }
    /**
     * <非通用>
     * 获取角色的状态机
     * @param {Game_Battler|Game_Character|Prefab} a 角色
     * @returns {UtilsExtend.fsm} 状态机
     */
    Skill.prototype.fsm = function (a) {
        let f = a.getCacheFromPrefab('fsm');
        return f;
    }
    Skill.prototype.farFumoAni = function (a) {
        if (a instanceof Sprite) {
            a = a._character;
        }
        let id = $gamePlayer.getFuMoGTAnimation(this.source.id, 'far');
        if (id) {
            const ani = GT_Animation.ShowGTAniForCharacter(a, id);
            ani.on('update', ()=>{
                ani.overridepos = { x:a.screenX(), y:a.screenY() };
                // ani.x = a.screenX();
                // ani.y = a.screenY();
            })
        }
    }
    Skill.prototype.aoyieffect = function (targets) {
        if (targets && targets.length) {
            targets.forEach((t) => {
                if (!t.mapObject) return;
                GT_Animation.ShowGTAniForCharacter(t.mapObject, 47, 0, -135);
            })
        }
        $gameScreen.startFlash([255, 0, 0, 128], 8);
        $gameScreen.startShake(5, 5, 10);
    }
    Skill.prototype.setdir = function (v, target = this._battler) {
        target = target.mapObject;
        if (!target) return;
        target._direction = v;
    }
    Game_Temp.setAIstop = function (value) {
        $gameTemp.allAIstop = value;
    }

    /**
     * <非通用>
     * 技能进入冷却
     * @param {number} time 冷却时间
     * @returns {undefined} 
     */
    Skill.prototype.cd = function (time) {
        // console.log(time);
        let fsm = this._battler.getCacheFromPrefab('fsm');
        if (!fsm) return;
        fsm.lockSkillFromAnySource('cd', this.source.id, { time, _time: time });
    }

    // /**
    //  * <非通用>
    //  * 角色数据缓存
    //  * @param {Game_Battler|Game_Character} character 角色
    //  * @param {string} name 缓存名字
    //  * @returns {undefined} 任意缓存数据
    //  */
    // Skill.prototype.getCache = function(character, name){
    //     if(!character) return;
    //     if(character instanceof contexter){
    //         return character.getCache(name);
    //     }
    //     return character.getCacheFromPrefab(name);
    // }


    Skill.prototype.typeDir = function (type) {
        type = type || 'gtdir';
        let obj = this._battler.mapObject;
        if (!obj) return;
        if (type == 'gtdir') {
            return Input.dir8 || obj._direction;
        }
    }
    Skill.prototype.typeRadian = function (type) {
        if (type == 'gtdir') {
            return this.dir2Radian(Input.dir8 || $gamePlayer._direction);
        }
        else if (type == 'm' || type == 'mouse') {
            $gamePlayer.freshDirBeforeSkillType('mouse');
            return this.angle2Radian($gamePlayer._GTdeg - 90);
        }
    }
    
    Skill.prototype.combo1 = function (id) {
        // console.log(id);
        if (TouchInput.isTriggered()) {
            let fsm = this._battler.getCacheFromPrefab('fsm');
            if (!fsm) return;
            let skill = fsm.useSkill(id, true);
            return skill;
        }
    }
    Skill.prototype.playerAni = function (id) {
        if ($gamePlayer._direction == 2) {
            GT_Animation.ShowGTAniForPlayer(id, 10, -40);
        }
        if ($gamePlayer._direction == 4) {
            GT_Animation.ShowGTAniForPlayer(id, 10, -46);
        }
        if ($gamePlayer._direction == 6) {
            GT_Animation.ShowGTAniForPlayer(id, -16, -46);
        }
        if ($gamePlayer._direction == 8) {
            GT_Animation.ShowGTAniForPlayer(id, -24, -52);
        }
    }
    Skill.prototype.animRemove = function (anim) {
        if (!anim || !anim.parent) return;
        anim.parent.removeChild(state.anim);
    }
    // Skill.prototype.noDamages = function(value, add){
    //     let fsm = this._battler.getCacheFromPrefab('fsm');

    //     if(add){
    //         fsm.noDamages += value;
    //         return;
    //     }
    //     fsm.noDamages = value;
    // }
    Skill.prototype.correctFarAtk = function () {
        let name = `DD2-fuzhi-${$gamePlayer._FuMoPnow}_2x1`;
        return name;
    }
    Skill.prototype.freshDirBeforeSkill = function () {
        $gamePlayer.freshDirBeforeSkill();
    }
    Skill.prototype.unpress = function (name, time) {
        let tTimes = Array.from(arguments).slice(2, arguments.length);
        if (!tTimes.length) return 0;
        let result = !(Input.pressingBehav(name));
        if (!result) return;
        let r = 0;
        tTimes.forEach((v, i) => {
            if (time > v) {
                r = i + 1;
            }
        })
        return r;
    }
    /**
     * 屏幕抖动
     * @returns {any}
     */
    Skill.prototype.shake = function () {
        $gameScreen.startShake(...arguments);
    }
    
    /**
     * 使用技能
     * @param {number} id 技能ID
     * @param {boolean} destroy 销毁当前技能
     * @returns {Skill|undefined} 技能
     */
    Skill.prototype.useskill = function (id, destroy) {
        return this.useSkillForce(...arguments);
        
    }
    /**
     * <非通用>
     * 为目标们应用技能效果
     * @param {array} targets 目标
     * @returns {object} 技能效果(Game_Action)
     */
    Skill.prototype.action = function (...ts) {
        this._action = null;
        if (!ts) return;
        let user = this._battler.gameObject;
        let action = new Game_ActionAdvance(user, { query: this }); //battler
        action.setSkill(this.source.id);
        ts.forEach((targets)=>{
            if (!targets || !targets.length) return;
            // console.log(user);
            this.cache.set('action', action);
            targets.forEach((t) => {
                action.beforeApply(t);
            })
        })
        return action;
    }


    /**
     * 状态对象
     * 预缓存变量有
     * $a 被施加状态者(状态持有者)
     * $b 施加状态者
     * $action 施加状态的数据集(如$action.query通常是一个技能序列，$a受到这个技能的影响从而进入了这个状态)
     * $count 状态的个数，这个通常不用管，也是手动增加的而非自动增加的，更类似与手动记录这个状态被施加了多少次
     * @memberof ScriptableQueryObject
     * @extends contexter
     * @class 
     */
    function State() { this.initialize(...arguments) };
    State.prototype = Object.create(contexter.prototype);
    State.prototype.constructor = State;
    State.const = {
        traitsReverse: {
            210: "mhp", 211: "mmp", 212: "atk", 213: "def", 214: "mat", 215: "mdf", 216: "agi", 217: "luk",
            220: "hit", 221: "eva", 222: "cri", 223: "cev", 224: "mev", 225: "mrf", 226: "cnt", 227: "hrg",
            228: "mrg", 229: "trg",
            230: "tgr", 231: "grd", 232: "rec", 233: "pha", 234: "mcr", 235: "tcr", 236: "pdr", 237: "mdr",
            238: "fdr", 239: "exr",
        },
        database: () => {
            return $dataStates;
        }
    }
    State.prototype.spritedamage = function (target, action = this._action) {
        if (!action) return;
        let data = action.applyList.get(target);
        let damageSprite = target.getCacheFromPrefab('damageSprite');
        if (damageSprite) {
            damageSprite.setup(target, data.result);
        }
    }
    State.prototype.push = function (a, b, action, type1 = false) {
        let meta = action.query.source.meta;
        if (!a || !a.prefab) return;
        if (!b || !b.prefab) return;
        let matter = b.getCacheFromPrefab('matter');
        Matter.Body.setSpeed(matter.collider, 0);
        let toughness1 = Number(meta.toughness) || 1;
        let toughness = b.processMeta('toughness') || 1;
        let force = toughness1 - toughness;
        if (force <= 0) return 0;
        let battleCollider = b.getCacheFromPrefab('battle-collider');
        let battleCollider1 = a.getCacheFromPrefab('battle-collider');
        // 从某个点对某个碰撞器应用推力
        let radian = Matter.Vector.angle(battleCollider1.position, battleCollider.position);
        // 推开前进的击退类型
        if (type1) {
            force = 0.8;
            let x = battleCollider.position.x - battleCollider1.position.x;
            if (x <= 0) radian = 3.04;
            else radian = 0.1;
        }
        UtilsExtend.matter.Force('push', matter.collider, radian, 0, force);
        return force;
    }
    // 原生能力值拓展
    let Game_BattlerBase_sparam = Game_BattlerBase.prototype.sparam;
    Game_BattlerBase.prototype.sparam = function (id) {
        let result = Game_BattlerBase_sparam.call(this, ...arguments);
        let name = State.const.traitsReverse[`23${id}`];
        let newResult = this._prepareParamCaler(name, result);
        return newResult;
    }
    let Game_BattlerBase_xparam = Game_BattlerBase.prototype.xparam;
    Game_BattlerBase.prototype.xparam = function (id) {
        let result = Game_BattlerBase_xparam.call(this, ...arguments);
        let name = State.const.traitsReverse[`22${id}`];
        let newResult = this._prepareParamCaler(name, result);
        return newResult;
    }
    let Game_BattlerBase_param = Game_BattlerBase.prototype.param;
    Game_BattlerBase.prototype.param = function (id) {
        let result = Game_BattlerBase_param.call(this, ...arguments);
        let name = State.const.traitsReverse[`21${id}`];
        let newResult = this._prepareParamCaler(name, result);
        return newResult;
    }
    Game_BattlerBase.prototype._prepareParamCaler = function (name, result) {
        if (!this[`param${name}`]) return result;
        let q = getQuery(this);
        if (!q) return result;
        let data = q.flags.get(name);
        if (!data) return result;
        q.cache.set('0', result);
        let newResult = data.caler();
        q.cache.delete('0');
        return newResult;
    }
    State.prototype.setup = function () {
        this.cache.set('count', 1);
        this.cache.set('a', this._battler);
        this.cache.set('b', this._subject);
        this.cache.set('action', this._action);
        // this.CLASS = State;
        let test = this._test();
        if (!test) return;
        this.build('life');
        this.build('destroy');
        this.build('trigger');
        this.setting();
        this.hook('life');
        State.running.set(this.id, this);
        contexter.running.set(this.id, this);
        return this;
    }
    State.prototype.setting = function () {
        this._gcSafe();
        this.query.get('trigger');
    }
    State.prototype.addCount = function (value) {
        this.cache.set('count', this.cache.get('count') + value);
        console.log(this.cache.get('count'));
        return this.cache.get('count');
    }


    /**
     * Battler 战斗者序列
     * 预缓存变量有
     * $a 自身，和技能使用者$a，状态持有者$a一致
     * @memberof ScriptableQueryObject
     * @class
     */
    function Battler() { this.initialize(...arguments) };
    Battler.prototype = Object.create(contexter.prototype);
    Battler.prototype.constructor = Battler;
    function Ene() { this.initialize(...arguments) };
    Ene.prototype = Object.create(Battler.prototype);
    Ene.prototype.constructor = Ene;
    // Ene.prototype.setup = function(){
    //     let s = Battler.prototype.setup.call(this, ...arguments);
    // }
    Battler.prototype.setup = function () {
        // console.warn(this);
        this.cache.set('a', this._battler);
        // this.CLASS = Battler;
        let test = this._test();
        if (!test) return;
        this.build('life');
        this.build('sprite');
        this.build('destroy');
        this.build('damage');
        this.hook('life');
        this.battlerTemp = {};
        this.flags = new Map();
        this._gcSafe();
        Battler.running.set(this.id, this);
        contexter.running.set(this.id, this);
        return this;
    }
    /**
     * 添加一个原生没有的自定义特性
     * @param {string} name 特性名, 唯一
     * @param {function} formula 含返回值的方法块或函数表达式
     */
    Battler.prototype.trait = function (name, formula) {
        let _this = this;
        if(this._battler.hasOwnProperty(name)) return;
        Object.defineProperty(this._battler, name, {
            get: function () {
                return formula(_this);
            }
        })
    }
    /**
     * 重载一个已有的特性，如攻击力，暴击率等 模板{$0 ...} $0为既有的值的引用
     * @param {string} name 特性名, 唯一
     * @param {function} caler 含返回值的方法块或函数表达式
     * @param {any} type='*' 弃用
     */
    Battler.prototype.param = function (name, caler, type = '*') {
        this._battler[`param${name}`] = true;
        if (typeof (caler) == 'function') {
            caler = caler.bind(this, this);
        }
        this.flags.set(name, { caler, type });
        return caler;
    }

    Battler.prototype._onSprite = function (sprite) {
        if (!sprite) return;
        this.cache.set('mysprite', sprite);
        this.hook('sprite', true);
    }
    Battler.prototype._onDamage = function (action, item) {
        if (!sprite) return;
        this.cache.set('action', { action, item });
        this.hook('damage', true);
    }
    let Battler_gc = Battler.prototype.gc;
    Battler.prototype.gc = function () {
        let gc = Battler_gc.call(this, ...arguments);
        // 240522 死亡消除逻辑 TODO 区分事件和队伍
        if (this.__gcing) {
            this._battler.__gcing = true;
            const mapObject = this._battler.mapObject;
            const mainSprite = this._battler.getCacheFromPrefab('mainSprite');
            if (mainSprite) {
                mainSprite.remove();
                // mapObject.mainSprite.destroy();
            }
            if(!mapObject) return gc; 
            mapObject.refresh = function(){ }; //地图跳转时的兼容
            mapObject.erase ? mapObject.erase() : null;
            if(this._battler.prefab){
                this._battler.prefab.destroy();
            }
        }
        return gc;
    }
    Battler.prototype.updateMapObject = function (a = this._battler, fakeStates = true) {
        const mapObject = a.mapObject;
        const noUpdate = !mapObject || mapObject instanceof Game_Player || mapObject instanceof Game_Event;
        // 这两类有写好的update调用
        if (!noUpdate) {
            mapObject.update();
        }
        fakeStates ? a.updateFakeStates() : null;
    }
    Battler.prototype.sprite = function (name, obj, layer) {
        if (!this.cache.get('mysprite')) return;
        let parent = this.cache.get('mysprite');
        if (!layer) {
            parent.addChild(obj);
        }
        else if (layer == -1) {
            let tilemap = parent.parent;
            if (!tilemap._characterEffector) {
                tilemap.addChildAt(tilemap._characterEffector = new Sprite(), 1);
            }
            tilemap._characterEffector.addChild(obj);
        }
        if (name) {
            parent[name] = obj;
        }
        return obj;
    }
    // Game_Battler.prototype.updateBattlerQuery = function () {
    //     return;
    //     let q = this.getBattlerQuery();
    //     if (!q) return;
    //     q.update();
    // }
    Game_Battler.prototype.getBattlerQuery = function () {
        let q = Battler.running.get(this._queryId);
        if (!q) return;
        return q;
    }

    /**
     * Game_Action拓展
     * 
     */
    function Game_ActionAdvance() { this.initialize.apply(this, arguments) };
    Game_ActionAdvance.prototype = Object.create(Game_Action.prototype);
    Game_ActionAdvance.prototype.constructor = Game_ActionAdvance;
    Game_ActionAdvance.prototype.initialize = function (subject, data = {}) {
        this._forcing = true;
        this.setSubject(subject);
        this.clear();
        this.applyList = new Map();
        Object.assign(this, data);
    }
    // TODO action闭包GC
    Game_ActionAdvance.prototype.setSubject = function (subject) {
        this._subject = subject;
    }
    Game_ActionAdvance.prototype.subject = function () {
        return this._subject;
    }
    /**
     * 等待被应用伤害或效果的目标列表
     * @param {any} target
     * @param {any} data
     * @returns {any}
     */
    Game_ActionAdvance.prototype.beforeApply = function (target, data) {
        const result = target.result();
        this.subject().clearResult();
        result.clear();
        result.used = true;
        result.missed = result.used && Math.random() >= this.itemHit(target);
        result.evaded = !result.missed && Math.random() < this.itemEva(target);
        if (!result.isHit()) return;
        result.physical = this.isPhysical();
        result.drain = this.isDrain();
        if (this.item().damage.type > 0) {
            result._damage = true;
            result.critical = Math.random() < this.itemCri(target);
        }
        let _result = JSON.parse(JSON.stringify(result));
        this.applyList.set(target, { result: _result, data });
    }
    Game_ActionAdvance.prototype.applyAll = function (type = 'all', effectfirst = true) {
        this.applyList.forEach((data, target) => {
            this.apply(target, data.result, ...arguments);
        })
    }
    Game_ActionAdvance.prototype.apply = function (target, result, type = 'all', effectfirst = true) {
        if (!target) return;
        let v;
        if (/all/i.test(type)) {
            if (effectfirst) {
                this.applyEffect(target, result);
                this.applyDamage(target, result);
            }
            else {
                this.applyDamage(target, result);
                this.applyEffect(target, result);
            }
        }
        else if (/effect/i.test(type)) {
            this.applyEffect(target, result);
        }
        else if (/damage/i.test(type)) {
            v = this.applyDamage(target, result);
        }
        return v || 0;
    }
    Game_ActionAdvance.prototype.applyEffect = function (target, result) {
        for (const effect of this.item().effects) {
            this.applyItemEffect(target, effect);
        }
    }
    Game_ActionAdvance.prototype.applyDamage = function (target, result) {
        const value = this.makeDamageValue(target, result.critical);
        // console.log(value);
        this.executeDamage(target, value);
        Object.assign(result, target.result());
        return value;
    }
    Game_Action.prototype.makeDamageValue = function (target, critical) {
        const item = this.item();
        const baseValue = this.evalDamageFormula(target);
        let value = baseValue * this.calcElementRate(target);
        if (this.isPhysical()) {
            value *= target.pdr;
        }
        if (this.isMagical()) {
            value *= target.mdr;
        }
        if (baseValue < 0) {
            value *= target.rec;
        }
        if (critical) {
            value = this.applyCritical(value);
        }
        value = this.applyVariance(value, item.damage.variance);
        value = this.applyGuard(value, target);
        value = Math.round(value);
        return value;
    }
    Game_ActionAdvance.prototype.applyCritical = function (damage) {
        return damage * (this.subject().crv || 2);
    }
    let Game_ActionAdvance_itemEffectAddNormalState = Game_ActionAdvance.prototype.itemEffectAddNormalState;
    Game_ActionAdvance.prototype.itemEffectAddNormalState = function (target, effect) {
        let id = effect.dataId;
        let isAtk = $dataStates[id].meta.atk;
        let data = { action: this };
        this.atkStates = this.atkStates || {};
        // once
        if (isAtk && this.atkStates[id]) return;
        if (isAtk) {
            let state = this._subject.addState(id, data);
            this.atkStates[id] = true;
            return;
        }
        let chance = effect.value1;
        if (!this.isCertainHit()) {
            chance *= target.stateRate(effect.dataId);
            chance *= this.lukEffectRate(target);
        }
        if (Math.random() < chance) {
            target.addState(effect.dataId, data);
            this.makeSuccess(target);
        }
    }
    let Game_ActionAdvance_evalDamageFormula = Game_ActionAdvance.prototype.evalDamageFormula;
    Game_ActionAdvance.prototype.evalDamageFormula = function (target) {
        let query = this.query;
        if (!query) return 0;
        const item = this.item();
        if (!item) return 0;
        let f = item.damage.formula;
        if (!/^:|^：/.test(f)) {
            return Game_ActionAdvance_evalDamageFormula.call(this, ...arguments);
        }
        query.cache.set('b', target);
        const sign = [3, 4].includes(item.damage.type) ? -1 : 1;
        let a = query.warmArg(f.replace(/^:|^：/g, ''));
        const value = Math.max(a(query), 0) * sign;
        query.cache.delete('b');
        return isNaN(value) ? 0 : value;
    }
    let Game_Battler_initialize = Game_Battler.prototype.initialize;
    Game_Battler.prototype.initialize = function () {
        Game_Battler_initialize.call(this, ...arguments);
        this._fakeStates = {};
    }
    Game_Battler.prototype.updateFakeStates = function () {
        for (let id in this._fakeStates) {
            let stateID = this._fakeStates[id];
            let state = State.running.get(stateID);
            if (!state) {
                this._fakeStates[id] = null;
                delete this._fakeStates[id];
                continue;
            }
            state.update();
            if (state.__gcing) {
                this._fakeStates[id] = null;
                delete this._fakeStates[id];
                continue;
            }
        }
    }
    let Game_Battler_addState = Game_Battler.prototype.addState;
    Game_Battler.prototype.addState = function (id, adddata = {}) {
        let data = $dataStates[id];
        if (!data) return;
        if(this.checkFakeState(data)){
            return this.addFakeState(id, adddata);
        }
        return Game_Battler_addState.call(this, ...arguments);
    }
    Game_Battler.prototype.checkFakeState = function(data){
        if(typeof(data) == 'number'){
            data = $dataStates[data];
            return this.checkFakeState(data);
        }
        if (/@life/i.test(data.note)) {
            return true;
        }
    }
    Game_Battler.prototype.addFakeState = function (id, data) {
        let stateID = this._fakeStates[id];
        let refresh = (state) => {
            let action = data.action;
            state._subject = (action ? action.subject() : this);
            state._action = action;
            state.cache.set('action', state._action);
            state.cache.set('b', state._subject);
        }
        if (stateID != undefined) {
            let state = State.running.get(stateID);
            refresh(state);
            state.hook('trigger', true);
            return state;
        }
        let state = new State($dataStates[id]);
        state._battler = data.battler || this;
        refresh(state);
        let setup = state.setup();
        if (!setup) return;
        this._fakeStates[id] = state.id;
        return state;
    }
    Game_Battler.prototype.removeFakeState = function (id) {
        if (!id) {
            for (let id in this._fakeStates) {
                this.removeFakeState(id);
            }
        }
        let stateID = this._fakeStates[id];
        let state = State.running.get(stateID);
        if (!state) return;
        state.destroy();
    }



    function mixer() { }
    mixer.mix = function (_classes, mixer) {
        _classes.forEach((_class) => {
            Object.assign(_class.prototype, mixer.prototype);
            for (let key in mixer) {
                if (_class.prototype.hasOwnProperty(key)) continue;
                if (!mixer[key] || (!mixer[key].get && !mixer[key].set)) continue;
                Object.defineProperty(_class.prototype, key, mixer[key]);
            }
        })
    }
    mixer.prototype.gain = function (type, value, c1, a = this._battler) {
        switch (type.toLowerCase()) {
            case 'hp': {
                a.gainHp(value);
                break;
            }
            case 'tp': {
                a.gainTp(value);
                break;
            }
            case 'mp': {
                a.gainMp(value);
                break;
            }
        }
        if (c1) {
            let damageSprite = a.getCacheFromPrefab('damageSprite');
            if (!damageSprite) return;
            let s = damageSprite.setuplite(value, c1);
            if (s) {
                s.scale.x = s.scale.y = 0.5;
                s.alpha = 0.5;
            }
        }
    }

    mixer.mix([Skill, State, Battler], mixer);

    function mz() { };
    mz.prototype.anim = function (id, setting, a = this._battler) {
        if (typeof (Sprite_AnimationLite) != 'function') return;
        let lite = new Sprite_AnimationLite();
        let mysprite = getCache(a, 'mysprite');
        if (!mysprite) return;
        lite.setTarget(mysprite);
        lite.setup(id, json.string2obj(setting));
        lite.play();
        mysprite.addChild(lite);
        return lite;
    }
    mz.prototype.apply = function (target, type = 'all', effectfirst = true) {
        let action = this.cache.get('action');
        if (!action) return;
        // console.warn(this.id);
        let data = action.applyList.get(target);
        if (!data || !data.result) return;
        const result = action.apply(target, data.result, type, effectfirst);
        return result;
    }
    mz.prototype.applyAll = function (type = 'all', effectfirst = true) {
        let action = this.cache.get('action');
        if (!action) return;
        action.applyAll(...arguments);
    }
    mz._action = {
        get: function () {
            return this.cache.get('action');
        },
        set: function (v) {
            this.cache.set('action', v);
        }
    }
    
    mixer.mix([Battler, Skill, State], mz);

    /**
     * MZARPG专属
     * @memberof ScriptableQueryObject
     * @class
     */
    function mzarpg() { }
    mzarpg.const = {
        9:1, 7:3, 4:6, 2:8,
    }
    /**
     * 连击
     * @param {number} id 技能id
     * @param {string} key 按键，判定为按下判定
     * @returns {Skill|undefined} 使用后技能
     */
    mzarpg.prototype.comboAdvance = function (id, key) {
        if(!key) return;
        if (Input.isTriggered(key)) {
            let fsm = this._battler.getCacheFromPrefab('fsm');
            if (!fsm) return;
            let skill = fsm.useSkill(id, true);
            return skill;
        }
    }
    /**
     * 从角色所拥有的状态获取所需的
     * <strong><a href="./ScriptableQueryObject.contexter.html#sharelite">已被分享的</a></strong>
     * 函数来进行加法/乘法/叠加计算
     * @param {string} name 引用名
     * @param {("caler"|"multi"|"value")} type='caler' 计算方式 加法，乘法，叠加
     * @param {Game_Battler} target=this._battler 角色
     * @returns {any} 任意值
     */
    mzarpg.prototype.collect = function (name, type = 'caler', target = this._battler) {
        let stack = [];
        for (let i in target._fakeStates) {
            let s = State.running.get(target._fakeStates[i]);
            let data = s.getShareLite(name);
            if (!data) continue;
            stack.push(data.value);
        }
        return this._collect(stack, type);
    }
    mzarpg.prototype.collectid = function (id, name, type = 'caler', target = this._battler) {
        let stack = [];
        if (!target._fakeStates[id]) return;
        let s = State.running.get(target._fakeStates[id]);
        let data = s.getShareLite(name);
        if (!data) return;
        stack.push(data.value);
        return this._collect(stack, type);
    }
    mzarpg.prototype._collect = function (stack, type) {
        let l = stack.length;
        let index = 0;
        let result = 0;
        let t = type.toLocaleLowerCase();
        if (t == 'multi') {
            result = 1;
        }
        while (index < l) {
            let v = stack[index];
            if (t == 'caler') {
                result += v();
            }
            else if (t == 'multi') {
                result *= v();
            }
            else if (t == 'value') {
                result += v;
            }
            else if (t == 'over') {
                result = v();
            }
            index++;
        }
        return result;
    }
    mzarpg.prototype.dirFix = function (v = false, a = this._battler) {
        a = a.mapObject;
        if (!a) return;
        a.setDirectionFix(v);
    }
    mzarpg.prototype.skillEl = function (type = 0) {
        // console.log($gamePlayer._FuMoPnowValue);
        if (!type) return $gamePlayer._FuMoPnowValue;
        else if (type == 1 && $gamePlayer._FuMoPtime) {
            return $gamePlayer._FuMoPnowValue;
        }
        return 0;
    }
    /**
     * 获取A与B的距离
     * @param {any} a A
     * @param {any} b B
     * @returns {any} A与B的距离
     */
    mzarpg.prototype.distance = function (a, b, old=false) {
        if(old){
            return this.distance_old(a, b);
        }
        if (!a || !b) return 0;
        if(!a.getCacheFromPrefab || !b.getCacheFromPrefab) return 0; //本项目的单独处理，用碰撞来计算而非格子
        let ba = a.getCacheFromPrefab("battle-collider")
        let bb = b.getCacheFromPrefab("battle-collider")
        let x = Math.abs(ba.position.x - bb.position.x) / $gameMap.tileWidth()
        let y = Math.abs(ba.position.y - bb.position.y) / $gameMap.tileHeight()
        return Math.sqrt(x * x + y * y); 
    }
    mzarpg.prototype.distance_old = function(a, b){
        a = a.mapObject || a;
        b = b.mapObject || b;
        if (!a || !b) return 0;
        let ax = (a._realX == undefined ? a.x : a._realX);
        let ay = (a._realY == undefined ? a.y : a._realY);
        let bx = (b._realX == undefined ? b.x : b._realX);
        let by = (b._realY == undefined ? b.y : b._realY);
        let x = Math.abs(ax - bx);
        let y = Math.abs(ay - by);
        return Math.sqrt(x * x + y * y); 
    }
    /**
     * 使用一个技能并自动朝向目标
     * @param {any} id 技能ID
     * @param {any} a 面向目标
     * @returns {any}
     */
    mzarpg.prototype.useSkill = function (id, a) {
        // !
        // return;
        if($gameMap && $gameMap._interpreter._waitMode == 'transfer') return;
        let fsm = this._battler.getCacheFromPrefab('fsm');
        if (!fsm) return;
        if (fsm.currentState == fsm.skiller) return;
        this.turn2(a);
        let skill = fsm.useSkill(id);
        if (skill) {
            fsm.currentState = fsm.skiller;
        }
        return skill;
    }
    /**
     * 能否使用技能数组
     * @example #canUseSkill:can 1 2 3 4
     * @returns {any} 
     */
    mzarpg.prototype.canUseSkill = function () {
        let fsm = this._battler.getCacheFromPrefab('fsm');
        if (!fsm) return;
        let result = false;
        Array.from(arguments).forEach((id) => {
            result = fsm.canUseSkill(id);
        })
        return result;
    }
    mzarpg.prototype._getMaybePos = function(obj) {
        if(!obj) return;
        obj = obj.mapObject || obj;
        if(obj._realX){ //角色
            return { x:obj._realX, y:obj._realY };
        }
        else if(obj.position){ //碰撞器
            return obj.position; 
        }
        else if(obj.x){ //位置对象或其他
            return obj;
        }
    }
    /**
     * 移动类型拓展
     * @param {Game_Character|Game_Battler|object} tpos 目标
     * @param {Game_Character|Game_Battler|object} pos 当前坐标
     * @param {number} w 修正宽度(通常和角色图像一致)<strong>务必注意单位问题，比如如果是角色和角色之间的修正应为格子，如果是碰撞器则应为像素</strong>
     * @param {number} h 修正高度(通常和角色图像一致)<strong>务必注意单位问题，比如如果是角色和角色之间的修正应为格子，如果是碰撞器则应为像素</strong>
     * @param {string} type='w' 水平类型(通常为2D横版游戏)
     * @returns {number} 弧度值
     */
    mzarpg.prototype.getMoveRadWithAdvancedMode = function (tpos, pos, w, h, type='w') {
        tpos = this._getMaybePos(tpos) || tpos;
        pos = this._getMaybePos(pos) || pos;
        if(!tpos || !pos) return;
        let ax = tpos.x - pos.x;
        let ay = tpos.y - pos.y;
        let r;
        if(/^w/i.test(type) && Math.abs(ax) <= w){
            let d, w2;
            if(Math.abs(ay) < h){
                d = ax <= 0 ? 6 : 4;
                return this.dir2Radian(d);
            }
            w2 = ax <= 0 ? w/2 : -w/2;
            ax += w2;
            return Math.atan2(ay, ax);
        }
        else if(/^h/i.test(type) && Math.abs(ay) <= h && Math.abs(ax) < w){
            let d = ay <= 0 ? 8 : 2;
            r = this.dir2Radian(d);
        }
        else{
            r = Math.atan2(ay, ax);
        }
        return r;
    }
    mzarpg.prototype._move = function (a, b, type = 'toward') {
        const sx = a.deltaXFrom(b.x);
        const sy = a.deltaYFrom(b.y);
        type = type.toLocaleLowerCase();
        if (Math.abs(sx) > Math.abs(sy)) {
            if (type == 'toward') {
                return (sx > 0 ? 4 : 6);
            }
            else if (type == 'away') {
                return (sx > 0 ? 6 : 4);
            }
        } else if (sy !== 0) {
            if (type == 'toward') {
                return (sy > 0 ? 8 : 2);
            }
            else if (type == 'away') {
                return (sy > 0 ? 2 : 8);
            }
        }
        return 0;
    }
    /**
     * 移动
     * close 接近目标
     * away 远离目标
     * random 随机
     * @param {string} type='close' 移动类型
     * @param {Game_Battler} b 目标
     * @param {Game_Battler} a=this._battler 移动者
     * @returns {any}
     */
    mzarpg.prototype.move = function (type = 'close', b, a = this._battler) {
        let fsm = this._battler.getCacheFromPrefab('fsm');
        if (!fsm) return;
        if (fsm.currentState == fsm.skiller) return;
        fsm.currentState = fsm.walk;
        a = a.mapObject;
        b = b.mapObject;
        if (!a || !b) return;
        let t = type.toLocaleLowerCase();
        if (t == 'close') {
            let d = this._move(a, b, 'toward');
            a.moveStraight(d);
        }
        else if (t == 'away') {
            let d = this._move(a, b, 'away');
            a.moveStraight(d);
        }
        else if (t == 'random') {
            if (this.battlerTemp.moved) {
                this.battlerTemp.moved--;
                let d = this.battlerTemp.lastRandom;
                a.moveStraight(d);
                return;
            }
            let d = 2 + Math.randomInt(4) * 2;
            this.battlerTemp.lastRandom = d;
            // console.log(d);
            a.moveStraight(d);
            this.battlerTemp.moved = 10;
        }
        else if (t == 'round') {
            if (this.battlerTemp.moved && this.battlerTemp.lastround) {
                // console.log(this.battlerTemp.lastround.d);
                a.moveStraight(this.battlerTemp.lastround.d);
                this.battlerTemp.moved--;
                return;
            }
            let d;
            this.battlerTemp.lastround = this.battlerTemp.lastround || { type: 'toward', d: 0 };
            if (this.battlerTemp.lastround.type == 'toward') {
                d = this._move(a, b, 'away');
                this.battlerTemp.lastround = { type: 'away', d };
            }
            else if (this.battlerTemp.lastround == 'away') {
                d = this._move(a, b, 'toward');
                this.battlerTemp.lastround = { type: 'toward', d };
            }
            if (!d) return;
            // a.moveStraight(d);
            this.battlerTemp.moved = 20;
        }
    }
    /**
     * <非通用>
     * 让使用者的状态机从施法状态中解放出来
     * @returns {undefined} 
     */
    mzarpg.prototype.free = function (a = this._battler) {
        // console.warn(this.source.id);
        let fsm = a.getCacheFromPrefab('fsm');
        if (!fsm) return;
        fsm.currentState = (fsm._preState == fsm.skiller ? fsm.idle : fsm._preState);
        
    }
    
    /**
     * 移除碰撞器
     * @example removeBody $m $u
     * @param {arguments} ...bs 碰撞器a, b, c ...
     */
    mzarpg.prototype.removeBody = function (...bs) {
        bs.forEach((body)=>{
            SceneManager._scene.removeBody(body);
        })
    }
    /**
     * 锁帧(全局!)
     * @param {number} target=60 目标帧率
     */
    mzarpg.prototype.lockFPS = function (target=60) {
        SceneManager.setTfps ? SceneManager.setTfps(target) : null;
        // const ticker = Graphics._app.ticker;
        // if(!ticker) return;
        // ticker._minElapsedMS = 1000 / target;
    }

    
    mzarpg.prototype.isTryMoveInput = function () {
        // console.log(Input.dir8);
        return Input.dir8;
    }
    mzarpg.prototype.updateMoveInput = function (a = this._battler) {
        let fsm = a.getCacheFromPrefab('fsm');
        if (!fsm) return;
        fsm.updateMoveInput();
    }
    mzarpg.prototype.skilling = function (id) {
        let fsm = a.getCacheFromPrefab('fsm');
        if (!fsm) return;
        let has = fsm.skiller.skillings.has(id);
        return has;
    }
    /**
     * <非通用>
     * 获取某个角色的战斗判定碰撞器
     * @param {Game_Battler|Game_Character|Prefab} a 角色
     * @returns {object} 战斗碰撞器
     */
    mzarpg.prototype.battleCollider = function (a = this._battler) {
        let c = a.getCacheFromPrefab('battle-collider');
        return c;
    }
    /**
     * <非通用>
     * 获取某个角色的移动碰撞器
     * @param {Game_Battler|Game_Character|Prefab} a 角色
     * @returns {object} 移动碰撞器
     */
    mzarpg.prototype.matter = function (a = this._battler) {
        let c = a.getCacheFromPrefab('matter').collider;
        return c;
    }
    mzarpg.prototype.idle = function () {
        let fsm = this._battler.getCacheFromPrefab('fsm');
        if (!fsm) return;
        if (fsm.currentState == fsm.skiller) return;
        fsm.currentState = fsm.idle;
        return true;
    }
    mzarpg.prototype.skilling = function () {
        let fsm = this._battler.getCacheFromPrefab('fsm');
        if (!fsm) return;
        if (fsm.currentState == fsm.skiller) return true;
    }
    mzarpg.prototype.turn2 = function (a) {
        if (!a) return;
        let obj = this._battler.mapObject;
        if (!obj) return;
        obj.turnTowardCharacter(a);
        // obj.poseDirectionFixOnly();
    }
    mzarpg.prototype.toaster = function (m) {
        // $.toaster({ message: m });
    }
    mzarpg.prototype.fumosimple = function () {

    }
    /**
     * 触发“水克火”的效果降低敌人速度时，该次攻击额外造成每层5%的伤害的前置处理
     * @param {any} t
     * @param {any} elcount
     * @returns {any}
     */
    mzarpg.prototype.saveElCount = function (t, elcount) {
        let data = this._action.applyList.get(t);
        data.elcount = elcount;
        console.log(elcount);
    }
    mzarpg.prototype.maxElCount = function () {
        let c = 0;
        this._action.applyList.forEach((data) => {
            c = Math.max(data.elcount || 0, c);
        })
        return c;
    }
    mzarpg.prototype.hpshow = function () {
        let hp = this._battler.getCacheFromPrefab('hpbar');
        if (!hp) return;
        hp.renderablewait = -1;
        hp.renderable = true;
    }
    /**
     * 延迟隐藏血条
     * @param {number} v=60 延迟时间 单位帧
     */
    mzarpg.prototype.hphidden = function (v = 60) {
        let hp = this._battler.getCacheFromPrefab('hpbar');
        if (!hp) return;
        hp.renderablewait = v;
        // hp.renderable = false;
    }
    /**
     * 触发“水克火”的效果降低敌人速度时，该次攻击额外造成每层5%的伤害的后置处理
     * @param {any} t
     * @param {any} base=0.05
     * @returns {any}
     */
    mzarpg.prototype.handled41 = function (t, base = 0.05) {
        let data = this._action.applyList.get(t);
        let elc = data.elcount;
        if (!elc) return;
        this._action.query.cache.set('d41', base * elc);
    }
    // 掉落精灵
    function Sprite_Loot() { this.initialize(...arguments) };
    Sprite_Loot.prototype = Object.create(PIXI.Sprite.prototype);
    /** 掉落显示对象容器
     * @returns {undefined}
     */
    Sprite_Loot._createMap = function () {
        let lootObjectMap = SceneManager._scene._lootObjectMap;
        if (lootObjectMap) return lootObjectMap;
        let map = new Sprite();
        map.z = (Number($dataMap.meta.lootObjectz) || 11); //默认和技能同层
        SceneManager._scene._spriteset._tilemap.addChild(map);
        lootObjectMap = SceneManager._scene._lootObjectMap = map;
        return lootObjectMap;
    }
    Sprite_Loot.prototype.initialize = function () {
        PIXI.Sprite.call(this, ...arguments);
    }
    // TODO 轻量但直观的动画曲线
    Sprite_Loot.prototype.setup = function (info, mapObject, target) {
        let xx = (Math.random() - 0.5);
        xx *= (info.rx == undefined ? 6 : info.rx);
        let yy = (Math.random() - 0.5);
        yy *= (info.ry == undefined ? 0.5 : info.ry);
        // console.log(xx);
        this.info = info;
        this.maxDuration = info.maxDuration || 60 * 300;
        let x = mapObject._realX;
        let y = mapObject._realY + yy;
        this.target = target;
        this._realX = x;
        this._realY = y - 1;
        let endPosition = { _realX: this._realX + xx, _realY: y };
        let t2 = new TWEEN.Tween(this)
            .to(endPosition, info.lifetime / 60 * 1000)
            .easing(TWEEN.Easing[info.easing].Out)
            .onComplete(this.complete.bind(this));
        t2.start();
    }
    Sprite_Loot.prototype.complete = function () {
        if (!this.target.gameObject) {
            this.remove();
            return;
        }
        this.startTracing = true;
    }
    Sprite_Loot.prototype.screenX = function () {
        const tw = $gameMap.tileWidth();
        return Math.floor($gameMap.adjustX(this._realX) * tw + tw / 2);
    }
    Sprite_Loot.prototype.screenY = function () {
        const th = $gameMap.tileHeight();
        return Math.floor($gameMap.adjustY(this._realY) * th + th);
    }
    // 注意 地图传送后会被直接移除
    Sprite_Loot.prototype.update = function () {
        this.x = this.screenX();
        this.y = this.screenY();
        if (!--this.maxDuration) {
            this.remove();
            return;
        }
        if (!this.startTracing) return;
        if (!this.target.gameObject) {
            this.remove();
            return;
        }
        let speed = 0.2;
        let x = this.target._realX;
        let y = this.target._realY - 1; //临时偏移
        let y1 = y - this._realY;
        let x1 = x - this._realX;
        if (Math.abs(y1) + Math.abs(x1) < 0.25) {
            this.complete1();
            return;
        }
        let r = Math.atan2(y1, x1);
        this._realX += Math.cos(r) * (speed);
        this._realY += Math.sin(r) * (speed);
    }
    Sprite_Loot.prototype.complete1 = function () {
        if (!this.target.gameObject) return;
        let info = this.info;
        let b = this.target.gameObject;
        if (info.item.isGold) {
            $gameParty.gainGold(info.count || 1);
        }
        else if (b instanceof Game_Actor) {
            $gameParty.gainItem(info.item, info.count || 1);
        }
        else if (b instanceof Game_Enemy) {
            // $gameParty.gainItem(info.item, info.count || 1);
        }
        // b.gainItem(info.item, 1);
        this.remove();
    }
    /**
     * 
     * 掉落注册 使用..将多个掉落物品同时注册以降低消耗 
     * <a href="#_loot">->具体实现</a> 
     * @example
     * #loot:drops
       i 7 5 10 $a.ltr
       .. g 0 20 100 $a.ltrg 6 10
     * @returns {array} 掉落列表
     */
    mzarpg.prototype.loot = function () {
        let newArgs = this._splitArgs2List(...arguments);
        let list = [];
        newArgs.forEach((l) => {
            let l1 = this._loot(...l);
            if (!l1) return;
            list = list.concat(l1);
            // list.push(info);
            // this._lootStart(info);
        })
        return list;
    }
    /**
     * 开始掉落
     * @param {array} list 掉落列表
     * @param {Game_Character|Game_Battler|Prefab} target 跟踪目标
     * @param {number} rx=6 散落水平偏移范围
     * @param {number} ry=0.5 散落垂直偏移范围
     */
    mzarpg.prototype.lootStart = function (list, target, rx=6, ry=0.5) {
        if (!list) return;
        const length = Math.max(Math.min(rx, list.length), 2);
        list.forEach((info) => {
            info.rx = length;
            info.ry = ry;
            this._lootStart(info, target);
        })
    }
    mzarpg.prototype._lootStart = function (info, target) {
        if (!target) return;
        target = target.mapObject;
        const mapObject = this._battler.mapObject;
        let count = 0;
        let gen = function (bitmap, map, mapObject, info) {
            let tex = PIXI.Texture.from(bitmap._image).clone();
            let sprite = new Sprite_Loot(tex);
            let frame = sprite.genFrame(info.iconIndex, tex);
            if (!frame) return;
            tex.frame = frame;
            map.addChild(sprite);
            info.sort = count++;
            sprite.setup(info, mapObject, target);
        }
        let map = Sprite_Loot._createMap();
        let bitmap = ImageManager.loadBitmapFromUrl('./img/system/IconSet.png');
        bitmap.addLoadListener((b) => {
            for (let i = 0; i < info.count; i++) {
                gen(bitmap, map, mapObject, info);
            }
        })
    }
    /**
     * 单组掉落注册
     * @param {string} type w-武器 i-物品 a-防具 g-金币
     * @param {number} id id
     * @param {number} min=0 最少掉落
     * @param {number} max=1 最多掉落
     * @param {number} w1=0.05 掉落阈值，超过这个值则无掉落(不会进行掉落注册)
     * @param {number} iconIndex=0 图标索引覆盖，为0则按照数据库图标索引处理
     * @param {number} part=1 平均多少个生成一个掉落实体，如将1000个金币处理为10个掉落实体
     * @param {number} lifetime=60 掉落曲线的生命周期
     * @param {number} easing="Cubic" 掉落曲线 {@link https://cdnjs.cloudflare.com/ajax/libs/tween.js/20.0.0/tween.umd.js}
     * @returns {array} 单组掉落信息
     */
    mzarpg.prototype._loot = function (type, id, min = 0, max = 1, w1 = 0.05, iconIndex = 0, part = 1, lifetime = 60, easing = "Cubic") {
        let item = this._getItem(type, id);
        if (!item) return;
        let r = Math.random();
        if (r > w1) return;
        let count = Math.round(Math.random() * (max - min)) + min;
        let p = Math.floor(count / part);
        let p1 = count - p * part;
        let list = [];
        iconIndex = iconIndex || item.iconIndex || 0;
        for (let i = 0; i < p; i++) {
            let info = { item, lifetime, easing, count: part, iconIndex };
            list.push(info);
        }
        if (p1) {
            list.push({ item, lifetime, easing, count: p1, iconIndex });
        }
        return list;
    }
    mzarpg.prototype._getItem = function (c1, c2) {
        let t = c1.toLocaleLowerCase();
        let id = Number(c2);
        if (t == 'w') {
            return $dataWeapons[id];
        }
        else if (t == 'a') {
            return $dataArmors[id];
        }
        else if (t == 'i') {
            return $dataItems[id];
        }
        else if (t == 's') {
            return $dataStates[id];
        }
        else if (t == 'g') {
            return { isGold: true };
        }
    }
    /**
     * Qsprite角色播放Qsprite动作
     * @param {string} name 动作名
     * @param {boolean} loop 循环
     * @param {Game_Character|Game_Battler} chara 角色
     * @returns {undefined}
     */
    mzarpg.prototype.pose = function (name, loop = false, chara = this._battler) {
        if(this._battler.boneInfo && this.posedb){
            return this.posedb(...arguments);
        }
        chara = chara.mapObject || chara;
        if (!name) {
            chara.clearPose();
            return;
        }
        if (!chara || typeof (chara.playPose) != 'function') return;
        chara.playPose(name, undefined, undefined, loop, true /*240613默认可以取消后摇*/);
    }
    mzarpg.prototype.updateMovingPose = function (a = this._battler.mapObject, type=0, move = true) {
        if (!a) return;
        if(!type){
            a.updateMovingPose(Input.dir8, Input.dir8, move);
        }
        else if(type == 1){
            a.updateMovingPose(a._direction, null, move);
        }
        // else if(type == 2){
        //     a.updateMovingPose(a._direction, a._dial, move);
        // }
    }
    /**
     * 当前动作名
     * @param {Game_Battler|Game_Character} a=this._battler
     * @returns {string} 动作名
     */
    mzarpg.prototype.getPose = function (a = this._battler) {
        a = a.mapObject;
        if (!a || typeof(a._pose) != 'string') return;
        return a._pose.substring(0, a._pose.length-1);
    }
    // 240611 地图开始时的物品 TODO 根据<itembar>和gainItem更新ItemBarUI, 血量条图片
    mzarpg.prototype.gainItem = function (type, id, count = 1, max = 1, rate = 1) {
        if (rate < 1) {
            let r = Math.random();
            if (r > rate) return;
        }
        let item = this._getItem(type, id);
        if (!item) return;
        if (item.isGold) {
            const gold = $gameParty._gold || 0;
            if (gold > max) return;
            const c = Math.min(count, max - gold);
            $gameParty.gainGold(c);
        }
        else if (item.id) {
            const ci = $gameParty._items[item.id] || 0;
            if (ci > max) return;
            const c = Math.min(count, max - ci);
            $gameParty.gainItem(item, c);
        }
    }
    mzarpg.prototype.skillKeybind = function (key, id) {
        ConfigManager.skillkeys = ConfigManager.skillkeys || {};
        Array.from(arguments).forEach((v, i, a) => {
            if (i % 2) return;
            const key = v;
            const id = a[i + 1];
            ConfigManager.skillkeys[key] = id;
        })
    }
    mzarpg.prototype.updateSkillInput = function () {
        if (!$gameTemp.ItemBarGlobal) return;
        let c = $gameTemp.ItemBarGlobal.keybindCache;
        c.forEach((i, k) => {
            if (Input.isTriggered(k)) {
                this._battler.useItem(i);
            }
        })
    }

    /**
     * 使用物品(类型仅限于物品)
     * @param {number} id 物品id
     * @param {Game_Character|Game_Battler} a=this._battler 角色
     * @returns {object} 成功使用的物品
     */
    mzarpg.prototype.useItem = function (id, a = this._battler) {
        const c = $gameParty._items[id];
        if (!c) return;
        let item = $dataItems[id];
        a.useItem(item);
        this._afterUseItem(item, a);
        return item;
    }
    mzarpg.prototype._afterUseItem = function (item, target) {
        const action = new Game_Action(target);
        action.setItemObject(item);
        for (let i = 0; i < action.numRepeats(); i++) {
            action.apply(target);
        }
        action.applyGlobal();
    }
    // 240612 消息窗口，延迟收集+合并信息
    mzarpg.delaymessaging = {
        use: new Map(),
        gain: new Map(),
    };
    mzarpg.delaymessaging.gain.set('windowmes', function (map) {
        map.forEach((data, item) => {
            if (typeof (data) == 'function') return;
            const { count, type } = data;
            const icon = item.iconIndex ? `\\\\I[${item.iconIndex}]` : '';
            if (count < 0) {
                // TODO 使用和失去是否要单独分开
                $gameSystem.addLog(`使用${type} ${item.name || ''} ${icon} x${Math.abs(count)}`);
            }
            else if (count > 0) {
                $gameSystem.addLog(`获得${type} ${item.name || ''} ${icon} x${Math.abs(count)}`);
            }
            map.delete(item);
        })
    })
    /**
     * 临时左下角窗口信息
     * @param {string} str 信息
     */
    mzarpg.prototype.windowmes = function (str) {
        $gameSystem.addLog(str);
    }
    mzarpg.prototype.updateDelayWindowMes = function () {
        Object.values(mzarpg.delaymessaging).forEach((map) => {
            const handle = map.get('windowmes');
            if (!handle) return;
            handle(map);
        })
    }
    let Game_Party_gainGold = Game_Party.prototype.gainGold;
    Game_Party.prototype.gainGold = function () {
        const lastNumber = this._gold;
        Game_Party_gainGold.call(this, ...arguments);
        const nowNumber = this._gold;
        const count = nowNumber - lastNumber;
        this.gainGoldWindowMes(count);
    }
    const goldobj = { name: '', iconIndex: 6 };
    Game_Party.prototype.gainGoldWindowMes = function (count) {
        if (!count) return;
        const group = mzarpg.delaymessaging.gain;
        let data = group.get(goldobj);
        if (!data) {
            // 240612 金币获取的消息
            group.set(goldobj, { count: 0, type: '金币' });
            return this.gainGoldWindowMes(...arguments);
        }
        data.count += count;
        
    }
    let Game_Party_gainItem = Game_Party.prototype.gainItem;
    Game_Party.prototype.gainItem = function (item, amount, includeEquip) {
        const lastNumber = this.numItems(item) || 0;
        let max = Number(item.meta.max) || 9999;
        const count = Math.min(amount, max - lastNumber);
        Game_Party_gainItem.call(this, item, count, includeEquip);
        // const nowNumber = this.numItems(item);
        if(count){
            this.gainItemWindowMes(item, count);
        }
    }
    Game_Party.prototype.gainItemWindowMes = function (item, count) {
        if (!count) return;
        const group = mzarpg.delaymessaging.gain;
        let data = group.get(item);
        if (!data) {
            group.set(item, { count: 0, type: '物品' });
            return this.gainItemWindowMes(...arguments);
        }
        data.count += count;

    }
    function format(str, ...args) {
        return str.replace(/%(\d+)/g, (match, number) => {
            return typeof args[number - 1] !== 'undefined' ? args[number - 1] : match;
        });
    }
    // todo 总音量和音量渐变和webaudio的关系问题
    mzarpg.prototype.playse = function () {

    }
    mixer.mix([State, Skill, Battler], mzarpg);

    /**
     * 实体生成
     * @memberof ScriptableQueryObject
     * @class
     */
    function autoPrefab() { };
    autoPrefab.running = new Map();

    /**
     * <a href="#_createPrefab">具体实现</a>
     * 用 .. 分隔多个参数列表
     * @param {any} id
     * @param {any} type
     * @param {any} count
     * @returns {array} 实体列表
     */
    autoPrefab.prototype.createPrefab = function (id, type, count) {
        let newArgs = this._splitArgs2List(...arguments);
        let list = [];
        newArgs.forEach((l) => {
            let l1 = this._createPrefab(...l);
            if (!l1) return;
            list = list.concat(l1);
        })
        return list;
    }
    /**
     * 生成实体，<strong>实体在生成后会自动执行spawn序列(如果存在的话)</strong>
     * <strong>如果id直接为battler即已有的实体数据</strong>，转到<a href="#_createPrefabByBattler">具体实现</a>
     * @param {number} id 数据库ID 
     * @param {string} type="enemy" 类别, enemy敌人, actor玩家队伍
     * @param {number} x=0 位置
     * @param {number} y=0 位置
     * @param {number} count=1 数量
     * @param {string} name Qsprite名
     * @returns {array} 实体数组
     */
    autoPrefab.prototype._createPrefab = function (id, type = "enemy", x = 0, y = 0, count = 1, name = '') {
        if(id instanceof Game_Battler){
            return this._createPrefabByBattler(...arguments);
        }
        let prefabs = [];
        for (let i = 0; i < count; i++) {
            let character = new Game_Character();
            const prefab = UtilsExtend._processCharacterPrefabByMeta(id, type);
            character._prefabId = prefab.id;
            prefab.mapObject = character;
            character._characterName = name;
            character.setPosition(x, y);
            prefabs.push(prefab);
            let q = character.query();
            if (q) {
                q.hook('spawn', true, true, true);
            }
        }
        return prefabs;
    }
    /**
     * 从已有的battler生成实体，<strong>实体在生成后会自动执行spawn序列(如果存在的话)</strong>
     * @param {Game_Battler} b 实体数据
     * @param {number} x=0 位置
     * @param {number} y=0 位置
     * @param {number} count=1 数量
     * @param {string} name Qsprite名
     * @returns {array} 实体数组
     */
    autoPrefab.prototype._createPrefabByBattler = function(b, x=0, y=0, overrideId=0, count=1, name = ''){
        let prefabs = [];
        for (let i = 0; i < count; i++) {
            let character = new Game_Character();
            delete b.__gcing;
            const prefab = b.processPrefab();
            character._prefabId = prefab.id;
            prefab.mapObject = character;
            character._characterName = name;
            character.setPosition(x, y);
            prefabs.push(prefab);
            let q = character.query();
            if (q) {
                q.hook('spawn', true, true, true);
            }
        }
        EV.emit('_createPrefabByBattler', prefabs);
        return prefabs;
    }
    
    /**
     * 添加实体到地图，通常为自动生成的预制体而非事件
     * @param {string} name Qsprite名
     * @param {Game_Battler | Game_Character} a=this._battler 对应的序列实体(或称角色)
     * @param {number} x=undefined 位置
     * @param {number} y=undefined 位置
     */
    autoPrefab.prototype.add2Map = function (name, a = this._battler, x = undefined, y = undefined) {
        let c = a.mapObject;
        if (!c) return;
        c._characterName = name || c._characterName;
        c.setPosition(isNaN(x) ? c._realX : x, isNaN(y) ? c._realY : y);
        let sprite = new Sprite_Character(c);
        c.mainSprite = sprite;
        let tilemap = SceneManager._scene._spriteset._tilemap;
        // this._onSprite(sprite);
        tilemap.addChild(sprite);
    }
    /**
     * 屏幕点击位置到地图位置
     * @returns {object} 包含x, y坐标的对象
     */
    autoPrefab.prototype.touch2Map = function () {
        let x1 = TouchInput._x;
        let y1 = TouchInput._y;
        let {x, y} = common.screen2Map(x1, y1);
        x /= $gameMap.tileWidth();
        y /= $gameMap.tileHeight();
        return { x, y };
    }
    autoPrefab.prototype.touch2World = function () {
        let x1 = TouchInput._x;
        let y1 = TouchInput._y;
        let {x, y} = common.screen2Map(x1, y1);
        return { x, y };
    }
    /**
     * 鼠标位置到角色距离
     * @param {Game_Battler|Game_Character|Prefab} a=this._battler 角色
     * @returns {number} 距离, 单位像素
     */
    autoPrefab.prototype.touch2Char = function(a=this._battler){
        let x1 = TouchInput._x;
        let y1 = TouchInput._y;
        let mapObject = a.mapObject || a;
        if(!mapObject) return;
        let x = mapObject.screenX() - x1;
        let y = mapObject.screenY() - y1;
        let d = Math.sqrt(x * x + y * y);
        return d;
    }
    /**
     * 实体地图位置
     * @param {Game_Battler|Game_Character} a=this._battler 实体
     * @param {number} scale=1 缩放
     * @returns {object} 包含水平坐标x和垂直坐标y的对象
     */
    autoPrefab.prototype.mapObjectPos = function (a = this._battler, scale = 1) {
        const mapObject = a.mapObject;
        if (!mapObject) return {};
        let x = mapObject._realX * scale;
        let y = mapObject._realY * scale;
        return { x, y };
    }
    mixer.mix([State, Skill, Battler], autoPrefab);

    

    /**
     * arpg功能函数集
     * @memberof ScriptableQueryObject
     * @class
     */
    function arpg() { };
    /**
     * 权重计算
     * @param {array|map} list 输入，数组或任意可迭代(forEach)对象
     * @param {object} info <a href="#weightRule">权重规则</a>
     * @param {number} count=1 输出，排序后且裁切后的数组/列表，如为1，输出得分最高的那个
     * @param {boolean} reverse=false 反向排序
     * @returns {any}
     */
    arpg.prototype.weight = function (list, info, count = 1, reverse = false) {
        let getValue = (props, a) => {
            a = a[props.shift()];
            if (!props.length) return a;
            return getValue(props, a);
        };
        let getSorce = (obj) => {
            let score1 = 0;
            for (let name in info) {
                let preset = info[name];
                if (!preset.props) continue;
                let p = JSON.parse(JSON.stringify(preset.props));
                let value = getValue(p, obj);
                (typeof (value) != 'number' ? value = preset.default : null);
                score1 += value * preset.score;
            }
            return score1;
        };
        let newList = [];
        list.forEach((v) => {
            newList.push(v);
        })
        newList.sort((a, b) => {
            let sa = getSorce(a);
            let sb = getSorce(b);
            return sb - sa;
        })
        if (reverse) {
            newList = newList.reverse();
        }
        if (count == 1) {
            return newList[0];
        }
        return newList.slice(0, Math.min(count, newList.length));
    }

    /**
     * <a href="#_weightRule">具体实现</a>
     * 多个权重规则
     * @returns {object} 权重规则
     */
    arpg.prototype.weightRule = function () {
        let args = this._splitArgs2List(...arguments);
        let rules = [];
        args.forEach((l) => {
            let obj = this._weightRule(l[0], l[1], l[2]);
            if (obj.props) {
                rules.push(obj);
            }
        })
        // console.log(rules);
        return rules;
    }
    
    /**
     * 单个权重规则
     * @param {string} props 属性名如atk，允许访问子属性如b.a.atk
     * @param {number} score=10 得分
     * @param {number} _default=0 默认值
     * @returns {object} 权重规则
     */
    arpg.prototype._weightRule = function (props, score = 10, _default = 0) {
        if (!props) return;
        let obj = {};
        obj.props = props.split(/\s*\.\s*/g);
        obj.score = score;
        obj.default = _default;
        return obj;
    }
    arpg.prototype.useSkillForce = function (id, destroy) {
        let fsm = this._battler.getCacheFromPrefab('fsm');
        if (!fsm) return;
        let skill = fsm.useSkill(id, true);
        if (destroy) {
            this.destroy();
        }
        return skill;
    }
    /**
     * 冻结某个角色的某个技能, 注意一个技能的冻结可以有多个来源
     * @param {number} id=this.source.id 技能id
     * @param {any} source=this 来源
     * @param {any} a=this._battler 角色
     * @returns {any}
     */
    arpg.prototype.freeze = function (id = this.source.id, source=this, a=this._battler) {
        let fsm = a.getCacheFromPrefab('fsm');
        if (!fsm) return;
        fsm.lockSkillFromAnySource('freeze', id, source);
    }
    /**
     * 解冻某个角色受到冻结的某个技能的某个来源
     * @param {number} id=this.source.id 技能id
     * @param {any} source=this 来源
     * @param {any} a=this._battler 角色
     * @returns {any}
     */
    arpg.prototype.unfreeze = function (id = this.source.id, source=this, a=this._battler) {
        let fsm = a.getCacheFromPrefab('fsm');
        if (!fsm) return;
        fsm.unlockSkillFromAnySource('freeze', id, source);
    }
    /**
     * 实体分组
     * @param {string} name 组名
     * @param {Game_Battler|Prefab|Game_Character} a=this._battler 实体(如序列的$a就是一个实体)
     */
    arpg.prototype.prefabGroup = function (name, a = this._battler) {
        if (!a.prefab) return;
        a.prefab.setGroup(name);
    }
    /**
     * 实体组的当前队员数量
     * @param {string} type 组名
     * @returns {number} 数量
     */
    arpg.prototype.prefabGroupsCount = function (type) {
        const g = Prefab.runningGroup[type];
        if (!g) return 0;
        return g.size;
    }
    /**
     * 碰撞体是否发生碰撞
     * @example collider $m $skillc1 $skillc2 ...
     * @param {object} c 碰撞体c
     * @param {object} c1 单个碰撞体或多个碰撞体
     * @returns {boolean}
     */
    arpg.prototype.collide = function (c, ...c1) {
        let result = Matter.Query.collidesLite(c, c1);
        if(result && result.length) return true;
    }
    /**
     * 清除所有技能锁定
     * @returns {boolean}
     */
    arpg.prototype.clearFreezes = function (free=true, a = this._battler) {
        let f = a.getCacheFromPrefab('fsm');
        if(!f || !f.skillManagers) return;
        f.skillManagers.forEach((data)=>{
            if(!data.freeze) return;
            data.freeze.clear();
        })
        if(free){
            f.currentState = (f._preState == f.skiller ? f.idle : f._preState);
        }
        return true;
    }
    /**
     *   -1/2             (-1/2)+(1/2)
     *     |                    |
     * 1 —— —— 0    1+(1/2)   —— ——   0+(1/2)
     *     |                    |
     *    1/2              (1/2)+(1/2)
     */
    arpg.const = {};
    arpg.const.radDir = {
        2: { step: 1, offset: 1 / 2, dirs: [6, 4] }, // 1 / 2 [0, 1]
        4: { step: 1 / 2, offset: 3 / 4, dirs: [8, 6, 2, 4] }, // 2 / 4 [0, 1/2, 1, 3/2]
        8: { step: 1 / 4, offset: 5 / 8, dirs: [8, 9, 6, 3, 2, 1, 4, 7] } // 5 / 8 [0, 1/4, 2/4, 3/4, 4/4...]
    }
    arpg.const.dirRad = {
        6: 0, 3: Math.PI * 0.25, 2: Math.PI * 0.5, 1: Math.PI * 0.75, 4: Math.PI * 1,
        7: Math.PI * 1.25, 8: Math.PI * 1.5, 9: Math.PI * 1.75, 5: 0, 0: 0
    }
    /**
     * 对象a和b之间的弧度
     * @param {object} a
     * @param {object} b
     * @returns {number} 弧度
     */
    arpg.prototype.radian2 = function (a, b) {
        a = a.mapObject ? a.mapObject : a;
        b = b.mapObject ? b.mapObject : b;
        if (!a || !b) return;
        let ax = a._realX == undefined ? a.x : a._realX;
        let bx = b._realX == undefined ? b.x : b._realX;
        let ay = a._realY == undefined ? a.y : a._realY;
        let by = b._realY == undefined ? b.y : b._realY;
        let r = Math.atan2(ay - by, ax - bx);
        return r;
    }
    /**
     * 获取角色方向
     * @param {Game_Character|Game_Battler|Prefab} c 角色
     * @returns {number} 角色的方向
     */
    arpg.prototype.dir = function (c = this._battler) {
        c = c.mapObject;
        if (!c) return;
        return c._direction;
    }
    /**
     * 小键盘8方向转弧度
     * @param {number} dir 方向
     * @returns {number} 弧度
     */
    arpg.prototype.dir2Radian = function (dir) {
        return arpg.const.dirRad[dir];
    }

    /**
     * 
     *   -1/2             
     *     |                    
     * 1 —— —— 0    
     *     |                    
     *    1/2              
     * 弧度转方向，弧度是标准弧度(Math.atan2)
     * @param {number} radian 标准弧度
     * @param {number} dirs=4 方向类型，支持2(水平),4,8三种
     * @param {boolean} setdir=false 是否自动设置为角色方向
     * @param {Game_Character|contexter|Game_Battler} a=this._battler 角色
     * @returns {any}
     */
    arpg.prototype.radian2dir = function (radian, dirs = 4, setdir = false, a = this._battler) {
        const target = arpg.const.radDir[dirs];
        if (!target) return;
        let offset = target.offset * Math.PI;
        let r = radian + offset;
        const step = target.step * Math.PI;
        const dirsConst = target.dirs;
        let d = 0;
        for (let i = 0; i < dirs - 1; i++) {
            let start = i * step;
            let end = (i + 1) * step;
            if (r >= start && r < end) {
                d = dirsConst[i];
            }
        }
        //  && d >= (dirs - 1) * step ?
        if (!d) {
            d = dirsConst[dirs - 1];
        }
        if (setdir) {
            let mapObject = a.mapObject;
            mapObject ? mapObject.setDirection(d) : null;
        }
        return d;
    }
    /**
     * 角度转弧度
     * @param {number} a 角度
     * @returns {number} 弧度
     */
    arpg.prototype.angle2Radian = function (a) {
        return Math.PI * (a / 180);
    }
    /**
     * 增加状态
     * @param {number} id
     * @param {Game_Battler|Game_Character} target=this._battler 角色
     * @returns {State|undefined} 增加的状态
     */
    arpg.prototype.addState = function (id, target = this._battler) {
        const gameObject = target.gameObject;
        if(!gameObject) return;
        let state = gameObject.addState(id);
        return state;
    }
    /**
     * 移除状态
     * @param {number} id 状态id
     * @param {Game_Battler|Game_Character} target=this._battler 角色
     */
    arpg.prototype.removeState = function (id, target = this._battler) {
        const gameObject = target.gameObject;
        if(!gameObject) return;
        // let remove;
        if (gameObject._states.indexOf(id) >= 0) {
            gameObject.removeState(id);
        }
        gameObject.removeFakeState(id);
    }
    arpg.prototype.getState = function (id, a = this._battler) {
        let s = State.running.get(a._fakeStates[id]);
        return s;
    }
    let filterSource = function(fid, user={}){
        const f = SCQ_customFilters.maps.get(fid);
        return f.clone(user);
    }
    /**
     * 准备一个自定义着色器
     * @param {string} fid 文件名作为唯一id
     * @param {object} uniforms={} <strong>必须由程序端声明和说明</strong>着色器定义的开发设置，如颜色，混合强度等
     * @returns {PIXI.Filter} 着色器
     */
    arpg.prototype.preparePIXIfilter = function (fid, uniforms={ }) {
        let f = filterSource(fid, uniforms);
        return f;
    }
    /**
     * 添加着色器给目标
     * @param {PIXI.Filter} f 着色器
     * @param {PIXI.Container} target 目标如龙骨
     */
    arpg.prototype.addPIXIfilter = function(f, target, timemout=null){
        if(!target) return;
        if(!(target instanceof PIXI.Container)) return;
        f.add2 ? f.add2(target) : null
        f.resume ? f.resume() : null;
        if(timemout && f.__target){
            setTimeout(()=>{
                f.remove()
            }, timemout * 1000)
        }
    }
    /**
     * 移除着色器
     * @param {PIXI.Filter} f 着色器
     */
    arpg.prototype.removePIXIfilter = function(f){
        f.remove ? f.remove() : null
    }
    /**
     * 移动碰撞器, 可能不同于pos, 会考虑碰撞
     * @param {object} collider 碰撞器
     * @param {number} x 相对距离
     * @param {number} y 相对距离
     */
    arpg.prototype.translate = function(collider, x, y){
        Matter.Body.translate(collider, { x, y });
    }
    mixer.mix([Skill, State, Battler], arpg);


    /**
     * 碰撞拓展1
     * @memberof ScriptableQueryObject
     * @class
     */
    function sat() { };
    function _v2poly(vd){
        let vecs = new Array(vd.length/2).fill(0);
        vecs = vecs.map((v, i)=>{
            return [vd[i], vd[i+1]];
            // return { x:vd[i], y:vd[i+1] };
        })
        decomp.makeCCW(vecs);
        let all = decomp.quickDecomp(vecs);
        let body = Matter.Bodies.fromVertices(0, 0, vecs, {
            isSensor: true, isSleeping: true, positionAuto: true, //默认
        }, true)
        return body;
    }
    sat.update = ()=>{
        if(!sat.autoList.size) return;
        sat.autoList.forEach((autor, body, map)=>{
            if(body.__destroy){
                map.delete(body);
                return;
            }
            const { ox, oy, display, rotate } = autor;
            let vertexData = display.vertexData;
            if(!vertexData) return;
            let verts = [];
            vertexData.forEach((v, i)=>{
                if(i % 2) return;
                const {x, y} = common.screen2Map(v, vertexData[i+1]);
                verts.push({x, y});
            });
            Matter.Body.setVertices(body, verts);
            const {x, y} = Matter.Vertices.centre(verts);
            Matter.Body.setPosition(body, { x, y });
            // let world = display.worldTransform;
            // const {x, y} = common.screen2Map(world.tx + ox, world.ty + oy);
            
            // if(typeof(rotate) == 'number'){
            //     Matter.Body.setAngle(body, display.rotation + rotate);
            // }
        })
    }
    sat.autoList = new Map();
    /**
     * 碰撞器跟随显示对象
     * @param {object} collider 碰撞器
     * @param {PIXI.Container} display 显示对象如龙骨插槽
     * @param {number} rotate=0 旋转偏移, 如不需要旋转同步将此值设置为非数值
     * @param {number} ox=0 水平偏移, 单位像素
     * @param {number} oy=0 垂直偏移, 单位像素
     */
    sat.prototype.colliderAuto = function (collider, display, rotate=0, ox=0, oy=0) {
        if(!collider) return;
        if(!display){
            sat.autoList.delete(collider);
            return;
        }
        if(display instanceof PIXI.SimpleMesh) return;
        // 检查合法
        let vertexData = display.vertexData;
        if(!vertexData) return;
        let valid = vertexData.find((v)=>{
            return v;
        })
        if(!(valid +1)) return;
        sat.autoList.set(collider, { display, ox, oy, rotate })
    }
    sat.prototype.meshCollider = function (m) {
        let poly = _v2poly(m.vertexData);
        console.log(poly);
    }
    mixer.mix([Skill, State, Battler], sat);

    // 快速访问
    function quick() { };
    quick.prototype.addState = function () {
        this.gameObject.addState(...arguments);
    }
    quick.prototype.query = function () {
        return getQuery(this.gameObject);
    }
    quick.prototype.fakeStates = function () {
        let map = new Map();
        let ss = this.gameObject._fakeStates;
        for (let id in ss) {
            map.set(id, getQuery(ss[id]));
        }
        return map;
    }
    mixer.mix([Game_Character], quick);

    


    
    // GC相关 ========================================================

    common.simpleReset = function () {
        Skill.running.clear();
        State.running.clear();
        contexter.running.clear();
        Battler.running.clear();
        // Skill.ID = 0;
    }
    common.simpleLoad = function () {
        State.running = new Map();
    }

    contexter.running = new Map();
    Skill.running = new Map();
    State.running = new Map();
    Battler.running = new Map();
    Ene.running = Battler.running;
    let EV = new evcontext.ev();
    EV.bodyContexting = {
        start: new Map(),
        active: new Map(),
        end: new Map(),
    }
    EV.on('collisionStart', (a, b) => {
        // Matter.setSpeed(a, 0);
        // Matter.setSpeed(a, 0);
        Matter.Body.setSpeed(a, 0);
        Matter.Body.setSpeed(b, 0);
    })
    function gcSafe () {
        if(wf_projectcore.PAUSE_FLAGS.has("query")) return;
        if (!SceneManager._scene._started || !SceneManager._scene._active) return;
        Skill.running.forEach((v) => {
            v.update();
        })
        // 更新的主导权直接交给序列
        Battler.running.forEach((v) => {
            v.update();
        })
        
    }
    let gcInValids = new Set();
    let gcFilterBase = function(gameObject){
        let skip = false;
        gcInValids.forEach((inv)=>{
            if(skip) return;
            skip = inv(gameObject);
        })
        return skip;
    }
    // 敌人和技能清除
    function gcSafeSetup () {
        let eneFix = function (s, i, map) {
            if(gcFilterBase(s._battler)) return;
            else if (!(s._battler instanceof Game_Enemy)) return;
            s.gc();
        }
        Skill.running.forEach(s=>s.gc());
        State.running.forEach(eneFix);
        Battler.running.forEach(eneFix);
        // contexter.running.forEach(eneFix);
    }
    let Game_Map_update = Game_Map.prototype.update;
    Game_Map.prototype.update = function () {
        this.firstUpdate();
        Game_Map_update.call(this, ...arguments);
        if(this.busyByUI) return;
        EV.emit('gamemapupdate');
        EV.emit('gamemap_temp_update');
    }
    EV.on('gamemapupdate', gcSafe);
    EV.on("gamemapupdate", sat.update)

    // 事件模型
    let Game_Map_setup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function () {
        EV.clear('gamemap_temp_update');
        EV.emit('gamemapsetup'); //地图初始化之前
        Game_Map_setup.call(this, ...arguments);
        this._firstUpdate = false;
    }
    let Scene_Map_onMapLoaded = Scene_Map.prototype.onMapLoaded;
    Scene_Map.prototype.onMapLoaded = function() {
        EV.emit('beforemaploaded'); //地图加载完成前，跳转完成前
        Scene_Map_onMapLoaded.call(this, ...arguments);
        EV.emit('maploaded'); //地图加载完成后，跳转完成
    }
    Game_Map.prototype.firstUpdate = function () {
        if (this._firstUpdate) return;
        EV.emit('gamemapfupdate'); //地图初始化之后，首帧更新，地图事件，事件页初始化均已完成
        this._firstUpdate = true;
    }

    EV.on('gamemapsetup', () => {
        gcSafeSetup();
        let fupdate = function(q){
            q.hookoff('mapfupdate');
            q.hook('mapfupdate', true, true);
        }
        Battler.running.forEach(fupdate);
    })



    // 指令预编译
    contexter.preComplied = new Map();
    const preCompliedFix = function (base) {
        console.log('query command preComplie');
        let temp;
        if (base == $dataSkills) {
            temp = new Skill({});
        }
        else if (base == $dataStates) {
            temp = new State({});
        }
        else if (base == $dataActors) {
            temp = new Battler({});
        }
        else if (base == $dataEnemies) {
            temp = new Ene({});
        }
        if (!temp) return;
        base.forEach((data) => {
            preCompliedFixTest(data, temp);
        })

        // console.log(contexter.preComplied);
        // console.log('成功');
    }

    const wrapRelationShip = function(name, top){
        let info = {
            p: 'parent', k:'kill', l:'lock'
        }
        let relation;
        name = name.split(/:/).map(v=>v.trim()); // 父级处理
        let q = name[0];
        let r = name[1];
        if(!r) return q;
        relation = { };
        //parent(a)kill(life,destroy)lock(a,b)
        r.replace(/\w+\([^\(\)]+\)/gi, (m)=>{
            // console.log(m);
            let block = /(\w+)\(([^\(\)]+)\)/i.exec(m).map(v=>v.trim());
            let rname = info[block[1]] || block[1];
            let value = block[2].split(/,/).map(v=>v.trim());
            value = new Set(value);
            relation[rname] = value;
            if(rname == 'parent'){
                value.forEach((p)=>{
                    let parent = top.get(p);
                    if(!parent){
                        top.set(p, parent = {});
                    }
                    parent.children = parent.children || new Set();
                    parent.children.add(q);
                })
            }
        })
        let pre = top.get(q);
        if(pre){
            Object.assign(relation, pre);
        }
        top.set(q, relation);
        return q;
    }
    const preImplicitQuery = function(qname, content, iii){
        if(!/^~/i.test(qname)) return;
        let newContent = content;
        iii.set(qname, true);
        return { newContent };
    }

    // 240820 隐性序列本质是一次循环，循环实现不了的序列特性，隐性序列均不支持
    // 如 暂停，挂起，持续更新等
    const implicitStart = function(context, name, ex={}){ 
        const pre = contexter.preComplied.get(`${context.constructor.name}${context.source.id}`);
        let i = pre.__implicited;
        if(!i) return;
        let q;
        if(!(q = i.get(name))) return;
        ex.CLOSE = function(){
            ex._close = true;
        }
        q.forEach((data)=>{
            if(ex._close) return;
            if(data.name == 'pause') return;
            context.exec(data, ex);
        })
        return true;
    }


    const preCompliedFixTest = function (data, temp = new Battler({})) {
        if (!data) return;
        let all = data.note.match(/@.+\n([^@]+)@end/gi);
        if (!all || !all.length) return;
        let name = temp.constructor.name;
        let id = data.id;
        let cache = new Map();
        let rrr = new Map();
        let iii = new Map();
        contexter.preComplied.set(`${name}${id}`, cache);
        cache.__relation = rrr;
        cache.__implicited = iii;
        let ignore = false;
        let contents = new Map();
        all.forEach((d) => {
            if (ignore) return;
            let list = /@(.+)\n([^@]+)@end/.exec(d);
            if (!list || !list[2]) return;
            let qname = list[1].trim();
            qname = wrapRelationShip(qname, rrr);
            let content = list[2];
            if (qname.toLocaleLowerCase() == 'deprecated') {
                ignore = true;
                return;
            }
            let implicited = preImplicitQuery(qname, content, iii); //隐性序列支持
            if(implicited){
                content = implicited.newContent;
            }
            contents.set(qname, content);
        })
        temp.source = data;
        contents.forEach((content, qname)=>{
            let q = temp._build(content);
            if(iii.has(qname)){
                iii.set(qname, q);
            }
            else{
                cache.set(qname, q);
            }
            Object.freeze(q);
        })
        if(!rrr.size){
            delete cache.__relation;
        }
        if(!iii.size){
            delete cache.__implicited;
        }
        Object.freeze(cache);
        return cache;
    }



    let DataManager_onLoad = DataManager.onLoad;
    DataManager.onLoad = function (obj) {
        DataManager_onLoad.call(this, ...arguments);
        preCompliedFix(obj);
    }

    let reset = function () {
        contexter.running = new Map();
    }

    let DataManager_setupNewGame = DataManager.setupNewGame;
    DataManager.setupNewGame = function () {
        common.simpleReset();
        DataManager_setupNewGame.call(this, ...arguments);
    }



    // 导出
    exports.Skill = Skill;
    exports.State = State;
    exports.contexter = contexter;
    exports.Battler = Battler;
    exports.Ene = Ene;
    exports.mz = mz;
    exports.__version = __version;
    exports.common = common;
    exports.preCompliedFix = preCompliedFix;
    exports.json = json;
    exports.explore = explore;
    exports.shared = shared;
    exports.getQuery = getQuery;
    exports.getCache = getCache;
    exports.setCache = setCache;
    exports.clearCache = clearCache;
    exports.EV = EV;
    exports.mixer = mixer;
    exports.gcFilterBase = gcFilterBase;
    exports.gcInValids = gcInValids;
    
});

