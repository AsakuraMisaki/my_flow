let SQ = ((exports)=>{
    


    let common = {};
    let ID = 0;
    /**
     * 服务器对象
     * @memberof ScriptableQueryObject
     * @class
     */
    function Server() {
        this.init(...arguments);
    }
    // Server.prototype = Object.create(evcontext.ev.prototype);
    Server.prototype.init = function (host, cache) {
        // evcontext.ev.prototype.init.call(this, ...arguments);
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
    Server.prototype.get = function (path, contexterblock, force=true) {
        if (!contexterblock) return;
        this.on(path, (req, _res) => {
            _res = _res || {};
            const res = { server: this, yes: _res.resolve, no: _res.reject };
            let i;
            if((i = this._host.__implicited) && (i.has(contexterblock))){
                implicitStart({ res, req }, this._host, contexterblock, force);
            }
            else{
                contexterblock(this._host, { res, req });
            }
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
    Server.prototype.spread = function (path, req, delay = 1, port = 80, filter = null) {
        let res = _newPromise();
        let _delay = delay;
        if(filter && filter.map){
            filter = filter.map((b) => {
                return getQuery(b);
            })
        }
        let once = () => {
            if (_delay-- <= 0) {
                this.off('update', once);
                this._app.forEach((data, app) => {
                    if (Array.isArray(filter) && filter.indexOf(app) < 0) return;
                    if (typeof (filter) == 'function' && !filter(app)) return;
                    const server = app._server.get(port);
                    if (!server) return;
                    server.emit(path, req, res);
                })
            }
        }
        this.on('update', once);
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
        this._server = new Map();
        this.createServer();
        this.cache.set('id', this.source.id);
        this.cache.set('this', this);
        this.cache.set('exe', this.exec.bind(this));
        
        // 240621 序列间拓展
        let map = contexter.preComplied.get(`${this.constructor.name}${this.source.id}`);
        if (map && map.__relation) {
            this.__relation = map.__relation;
        }
        if (map && map.__implicited) {
            this.__implicited = map.__implicited;
        }
    }
    /**
     * 创建服务器
     * @param {number} port=80 端口
     * @returns {Server}
     */
    contexter.prototype.createServer = function (port = 80) {
        const server = new Server(this);
        this._server.set(port, server);
        return server;
    }
    /**
     * 获取服务器
     * @param {Game_Battler|Game_Character|contexter} a 服务器序列
     * @param {number} port=80 端口
     * @returns {Server}
     */
    contexter.prototype.getServer = function (a=this, port = 80) {
        a = getQuery(a);
        if (!a) return;
        return a._server.get(port);
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
            res.then((data) => {
                let i;
                if((i = app.__implicited) && (i.has(resolved))){
                    implicitStart(data, app, resolved, true);
                }
                else{
                    resolved(app, data);
                }
            })
        }
        if (rejected) {
            res.catch((data) => {
                let i;
                if((i = app.__implicited) && (i.has(rejected))){
                    implicitStart(data, app, rejected, true);
                }
                else{
                    rejected(app, data);
                }
            })
        }
        let _delay = delay;
        let once = () => {
            if (_delay-- <= 0) {
                server.off('update', once);
                server.emit(path, req, res);
            }
        }
        server.on('update', once);
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
    contexter.prototype.exec = function (data) {
        if (this.__gcing) return;
        if (!this._execMeetConditions(data)) return;
        let result;
        if (!Array.isArray(data.list)) {
            let result;
            result = this._exec(data.list);
            return result;
        }
        data.list.forEach((d) => {
            result = this._exec(d);
        })
        return result;
    }
    let tryExec = true;
    if(tryExec){
        contexter.prototype.exec = function (data) {
            if (this.__gcing) return;
            try{
                if (!this._execMeetConditions(data)) return;
                let result;
                if (!Array.isArray(data.list)) {
                    let result;
                    result = this._exec(data.list);
                    return result;
                }
                data.list.forEach((d) => {
                    result = this._exec(d);
                })
                return result;
            }catch(e){
                console.error(e, data, this.constructor.name, this.source.id);
            }
        }   
    }
    contexter.prototype._throw = function (m) {
        throw new Error(`${m} 位置 ${this.constructor.name} ${this.source.id}`);
    }
    contexter.prototype._exec = function (data) {
        this._execingName = data.name;
        let args1 = data.args || [];
        let cache = this.cache;
        let args = [];
        args1.forEach((a) => {
            if (typeof (a) == 'function') {
                if (a.as && a.as.Func) {
                    args.push(a);
                    return;
                }
                args.push(a(this));
                return;
            }
            args.push(a);
        })
        let result, s = data.source;
        if (typeof (s) == 'string') {
            result = this[s](...args);
        }
        else if (typeof (s) == 'function') {
            result = s(this, { args });
        }
        let cacheName = data.cached;
        if (cacheName) {
            // result ? result.__cacheId = cacheName : null;
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
    contexter.prototype._execMeetConditions = function (data) {
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
                r = a(this);
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
    /**
     * 直接执行某些序列的序列指令
     * @param {string} tag 标签，用于获取目标序列组
     * @param {any} group 序列所属组
     * @param {string} commands @example [hook rrr true true, hook b]
     */
    contexter.prototype.knockQobjects = function(tag, group, commands){
        commands = jsyaml.load(`c: ${commands}`).c;
        UEVsys._knockQobjects(tag, group, commands);
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
    contexter.prototype.pauseEvent = function (id, ev=this._battler.mapObject) {
        UEVsys._pauseEvent(ev, id);
    }
    contexter.prototype.resumeEvent = function (id, ev=this._battler.mapObject) {
        UEVsys._resumeEvent(ev, id);
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
        let i, inners;
        if((i = this.__implicited) && (inners = i.get(name))){
            inners.forEach((name)=>{
                this.cache.delete(name);
            })
        }
    }
    contexter.prototype.destroy = function (reset) {
        this.hook('destroy', reset);
    }
    
    
    contexter.prototype.update = function () {
        this._server.forEach((server) => {
            server.update();
        })
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
            if(isTry){
                try{
                    this.exec(data);
                }catch(e){
                    console.error(data, e, this);
                }
            }
            else{
                this.exec(data);
            }
            this._execingQuery = null;
            if (data.flags && data.flags.max > 0) {
                query.hookingQuery.set(i, data);
            }
            query.__index++;
        }
    }
    let isTry = true;


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
        let re = /^\{\.Y|^\{\.B|^\{\.S|^\{\.V|^\{\.|^\{|\}$/gi;
        let a = v.replace(re, '').trim();
        if (!sp) {
            let a1 = this.warmArg(a, 'value');
            if(typeof(a1) == "function"){
                return {type:"valueFunction", value:a};
            }
            else{
                return {type:"raw", value:a};
            }
            return a1;
        }
        // 特性块
        let a1;
        if (/^\{\.Y/i.test(v)) { //yml
            return {type:"yaml", value:a};
            return a;
        }
        else if (/^\{\.B/i.test(v)) { //方法块
            return {type:"block", value:a};
            a1 = this.warmArg(a, 'block', true);
            a1.as = a1.as || { Func: true };
        }
        else if (/^\{\.S/i.test(v)) { //打包指令
            return {type:"innerCommand", value:a};
            a1 = a;
            return this.slice(a1);
        }
        else if (/^\{\.|^\{\.V/i.test(v)) { //返回值函数
            return {type:"valueFunction", value:a};
            a1 = this.warmArg(a, 'value', true);
            a1.as = a1.as || { Func: true };
        }
        return a1; //值
    }
    // 指令条件解释
    contexter.prototype.warmFlags = function (v, flags) {
        if (/^\?|^\!/.test(v)) {
            let a = v.replace(/^\?/, '');
            let con = this.warmArg(a);
            flags.cons = flags.cons || [];
            flags.cons.push({type:"valueFunction", value:a});
        }
        else if (/^\+/.test(v)) {
            let a = v.replace(/^\+/, '');
            flags.max = {type:"raw", value:Number(a)};
            // let max = this.warmArg(v.replace(/^\+/, ''));
            // let n = Number(max);
            // if (!n) {
            //     flags.max = Infinity;
            // }
            // else {
            //     flags.max = n;
            // }
        }
        else if (/^\%/.test(v)) {
            let a = v.replace(/^\%/, '');
            flags.cycle = {type:"valueFunction", value:Number(a)};
            // let cycle = this.warmArg(v.replace(/^\%/, ''));
            // flags.cycle = cycle;
            // flags._cyclelog = 0;
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
        let newEntry = {};
        if(typeof(source) == "function"){
            newEntry = { type:"function", name, cached };
        }
        else{
            newEntry = { type:"self", name, cached };
        }
        return newEntry;
    };
    /**
     * 指令任意字符串解释 <strong>CORE</strong> <strong>核心方法</strong>
     * @param {any} a
     * @param {any} type='value'
     * @param {any} ignoreSimple=false
     * @returns {function|any}
     */
    contexter.prototype.warmArg = function (a, type = 'value', ignoreSimple = false) {
        // 1. 缓存变量名的生成
        let vars = a.match(/(?<!\^)(\$[a-z\d_]+)/gi);
        let global = /\^/.exec(a);
        if (!vars && !global && type == 'function') {
            if (!this[a]) {
                // this._throw(`检查指令 ${a}`);
            }
            return a;
        }
        if (!vars && !global && !ignoreSimple) return this.warmArgSimple(a);
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

        // 2. 函数逻辑体的生成
        a = a.replace(/\^/g, '');
        let log;
        let t = type.toLowerCase();
        if (t == 'block') {
            a = a.replace(/\nel\s*/g, '\nelse\t');
            a = a.replace(/\nef\s*\(/g, '\nelse if(');
            a = a.replace(/\.\.\.\{[^\{\}]+\}\;?\s*\n/g, (matched) => {
                a;
                matched = matched.replace(/;|\n/, '');
                let _m = matched.replace(/\.\.\./, 'let ');
                _m = _m.trim();
                _m += ' = excontext;\n';
                return _m;
            })
            log = `${a}`;
        }
        else if (t == 'value') {
            log = `const result = ${a};\nreturn result;`;
        }
        else if (t == 'function') {
            log = `const args = (excontext.args || []);\nlet any = ${a}(...args);\nreturn any;`;
        }
        log = '//context.cache.get\n' + st1 + '//function.block\n' + log;
        // log = tryLog(log);
        let dynamic;
        try {
            dynamic = new Function('context', 'excontext', log);
        }
        catch (e) {
            this._throw(log + '\n' + e.message)
        }

        return dynamic;
    }
    let tryLog = function(log){
        return `try{ ${log}\n }catch(e){console.error(context, e)}`
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
        if (!/[a-z]|[=<>]/i.test(a) && (/\d/i.test(a))) {
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
     * yaml数据
     * @param {string} value yaml格式字符串
     * @returns {object}
     */
    contexter.prototype.yaml = function(value){
        return jsyaml.load(value);
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
    contexter.prototype.getYaml = function(){
        return this.source.__yaml;
    }
    contexter.prototype.getYamlParse = function(key){
        return JSON.parse(JSON.stringify(this.source.__yaml[key]));
    }
    contexter.prototype.shuffle = function (target) {
        return chance.shuffle(target);
    }
    contexter.prototype.shift = function (target) {
        return target.shift();
    }
    contexter.prototype.splice = function (target, ...remove) {
        remove.forEach((r)=>{
            let i = target.indexOf(r);
            if(i < 0) return;
            target.splice(i, 1);
        })
        return target;
    }
    contexter.prototype.export = function (name, value) {
        USHARED.set(name, value);
        return value;
    }
    contexter.prototype.import = function (name, _default) {
        if(!USHARED.has(name)) return _default;
        return USHARED.get(name);
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
    contexter.prototype.eval = function (e) {
        if (typeof (e) == 'function') {
            return e(this);
        }
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
    /**
     * 常量
     */
    Skill.const = {

        database: () => {
            return $dataSkills;
        }
    }
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
        // this.CLASS = Skill;
        this.build('life');
        this.build('destroy');
        this.build('trigger');
        // this.build('damage');
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
        this.query.get('trigger');
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
        character.clearPose();
        character._movespeed = 3;
        character._moveFrequency = 3;
        character.mainSprite = mainSprite;
        character.collider = collider;
        mainSprite.collider = collider;
        mainSprite._c = character;
        this._gccb(mainSprite, this._removeSprite.bind(this, mainSprite));
        add ? this.addSkill2scene(mainSprite) : null;
        return mainSprite;
    }
    /**
     * 将技能精灵添加到场景中
     * @param {Sprite} s 精灵
     */
    Skill.prototype.addSkill2scene = function (s) {
        const skillObjectMap = Skill._createSkillOjbectMap();
        skillObjectMap.addChild(s);
    }
    Skill.prototype.c2Sprite = function (sprite, collider) {
        sprite._c.collider = sprite.collider = collider;
    }
    Skill.prototype._removeSprite = function (s) {
        if (s && s.parent) {
            s.parent.removeChild(s);
        }
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
    
    Skill.prototype.combo1 = function (id, inputName='atk') {
        // console.log(id);
        if (Input.pressingBehav(inputName)) {
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
        let fsm = this._battler.getCacheFromPrefab('fsm');
        if (!fsm) return;
        let skill = fsm.useSkill(id);
        if (destroy) {
            this.destroy();
        }
        return skill;
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
            // 240919 玩家的弹出特殊处理
            if(target.mapObject instanceof Game_Player){
                target.gameObject._requesting_prop_update = true;
            }
            else{
                damageSprite.setup(target, data.result);
            }
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
    Battler.prototype.setup = function () {
        this.cache.set('a', this._battler);
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
            if(!mapObject) return gc; 
            if (mapObject.mainSprite) {
                mapObject.mainSprite.remove();
                mapObject.mainSprite.destroy();
            }
            mapObject.refresh = function(){ }; //地图跳转时的兼容
            mapObject.erase ? mapObject.erase() : null;
            if(this._battler.prefab){
                this._battler.prefab.destroy();
            }
            EV.emit('game:battler:gc', this._battler, this, this.source);
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
            // 240919 玩家的弹出特殊处理
            if(a.mapObject instanceof Game_Player){
                a.gameObject._requesting_prop_update = true;
            }
            else{
                let s = damageSprite.setuplite(Math.floor(value), c1);
                if (s) {
                    s.scale.x = s.scale.y = 0.5;
                    s.alpha = 0.5;
                }
            }
        }
    }

    mixer.mix([Skill, State, Battler], mixer);

    function mz() { };
    mz.prototype.cev = function(id){
        AGame_Core_MORE._startCommonEvent(id);
    }
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
    mzarpg.prototype.uiRewardStatesGroup = function (key, value) {
        let data = { };
        data.possibleValid = RewardStateChoiceBar.applyFilterWithGroup.bind({}, [key, value]);
        RewardStateChoiceBar.create(data);
    }
    mzarpg.prototype.uiRewardStatesIds = function (id, id1) {
        let data = { };
        data.possibleValid = RewardStateChoiceBar.applyFilterWithIdRange.bind({}, [id, id1]);
        RewardStateChoiceBar.create(data);
    }
    mzarpg.prototype.levelUp = function (count) {
        this._battler.changeLevel(this._battler._level + count, false);
    }
    mzarpg.prototype.getLevel = function(){
        return this._battler._level;
    }
    /**
     * 基础值 基础等级为1就是最初的基础值
     * @param {number} paramId 基础值下标对应基础能力值 如0-最大生命值
     * @param {number} level=1 基础等级
     * @returns {number}
     */
    mzarpg.prototype.getParamBase = function(paramId, level=1){
        return AGame_Core_MORE._getparamBase(paramId, this._battler, level);
    }
    mzarpg.prototype.checkPlayerDefeat = function(ene){
        if(!(this._battler instanceof Game_Actor)) return;
        if(this._battler.hp <= 0){
            EV.emit("game:mission:defeat", ene._enemyId);
        }
    }
    /**
     * 关卡层数增加
     * @param {number} value=1 添加层数
     * @returns {number} 关卡层数
     */
    mzarpg.prototype.mapLevelCountPlus = function(value=1){
        AGame_Core_MORE._missionClear.count += value;
        return AGame_Core_MORE._missionClear.count;
    }
    /**
     * 获取关卡层数
     * @returns {number}
     */
    mzarpg.prototype.mapLevelCount = function(){
        return AGame_Core_MORE._missionClear.count;
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
        let result = this._collect(stack, type)
        // 240905 加入装备计算
        let r1 = 0
        if(target.equips){
            r1 = this.collectEqs(...arguments)
            if (type == 'caler') {
                result += r1;
            }
            else if (type == 'multi') {
                result *= r1;
            }
            else if (type == 'value') {
                result += r1;
            }
            else if (type == 'over') {
                result = r1;
            }
        }
        return result;
    }
    // 240904 BY 加入装备的计算
    mzarpg.prototype.collectEqs = function (name, type = 'caler', target = this._battler) {
        const equips = target.equips()
        let result = 0
        if(type == 'multi') result = 1;
        equips.forEach((item)=>{
            if(!item || !item.__yaml.sharelite || !item.__yaml.sharelite[name]) return
            let value = item.__yaml.sharelite[name]
            if(type == 'caler'){
                result += value
            }
            else if(type == 'multi'){
                result *= value
            }
        })
        return result
    }
    // BY 统计强化数据用到
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
    // 240905 专用 处理侵蚀度
    mzarpg.prototype.gainBad = function (value, add_collect) {
        if(!GT_AGameCore.isMapBattle()) return;
        let add = this.collectEqs(add_collect)
        value *= (1 + add)
        this._battler.gainBad(value)
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
    mzarpg.prototype.distance = function (a, b) {
        a = a.mapObject;
        b = b.mapObject;
        if (!a || !b) return 0;
        let x = Math.abs(a._realX - b._realX);
        let y = Math.abs(a._realY - b._realY);
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
        if($gameMap && (($gamePlayer && $gamePlayer.isTransferring()) 
        || $gameMap._interpreter._waitMode == 'transfer')) return;
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
        // SceneManager.setTfps ? SceneManager.setTfps(target) : null; //240802 整合临时处理
        const ticker = Graphics._app.ticker;
        if(!ticker) return;
        ticker._minElapsedMS = 1000 / target;
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
    mzarpg.prototype.atkspPose = function (el) {
        el = el || 0;
        let char = GT_FuMo.ConstantMap[el];
        let png = `DD1-yueya-${char}_2x9`;
        return png;
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
            sprite.scale.x = sprite.scale.y = 0.6;
            let frame = sprite.genFrame(info.iconIndex, tex);
            if (!frame) return;
            tex.frame = frame;
            map.addChild(sprite);
            info.sort = count++;
            sprite.setup(info, mapObject, target);
        }
        let map = Sprite_Loot._createMap();
        let bitmap = ImageManager.loadBitmapFromUrl('./img/system/IconSet.png'); //默认图标
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
        // 240905 BY 专用 单独兼容掉落量
        count = Math.ceil(count * tempAddDrop(item, this))
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
    // 240905 单独处理掉落量 从玩家装备获取增量
    let tempAddDrop = function(item, _this){
        let battler = $gamePlayer.gameObject
        if(!battler) return 1
        if(item.isGold){
            let _eqs = _this.collectEqs("coin", "caler", battler)
            return (1 + _eqs)
        }
        else if(item){
            let _eqs = _this.collectEqs("items", "caler", battler)
            return (1 + _eqs)
        }
        return 1
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
    function findMaxCD(fsm, id){
        let data = fsm.skillManagers.get(id);
        if(!data || !data.cd) return 0;
        else if(!data.cd.size) return 0;
        let arr = Array.from(data.cd.values())
        if(data.cd.size == 1){
            return arr[0].time / arr[0]._time;
        }
        let target = arr.sort((a, b)=>{
            return a - b;
        })
        return target.time / target._time;
    }
    mzarpg.prototype.MapItemStateBarApplyCD = function(item){
        if(!MapItemStateBar.current) return;
        if(!MapItemStateBar.current.items.get(item)) return;
        let id = this.source.id;
        let fsm = this._battler.getCacheFromPrefab("fsm");
        if(!fsm) return;
        let _update = ()=>{
            let cdPercent = findMaxCD(fsm, id);
            let target = MapItemStateBar.current.items.get(item);
            if(!target || !target.icon) return;
            let ta = 1 - cdPercent;
            target.icon.alpha = ta;
            if(!cdPercent || cdPercent<=0){
                target.icon.alpha = 1;
                MapItemStateBar.current.off("update", _update);
            }
        }
        MapItemStateBar.current.on("update", _update)
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
    mzarpg.prototype.updateHpScreenEf = function(id){
        if(this._battler.hp <= this._battler.mhp * 0.3 && !this.tempScreenEf){
            let lite = new Sprite_AnimationLite();
            // lite.setTarget(mysprite);
            lite.setup(id, {loop:true});
            lite.play();
            lite.anchor.x = -0.3;
            lite.anchor.y = -0.2;
            lite.width = 1000;
            lite.height = 1000;
            lite.alpha = 0.4;
            SceneManager._scene.addChild(lite);
            window.templite = lite;
            this.tempScreenEf = lite;
        }
        else if(this._battler.hp > this._battler.mhp * 0.3 && this.tempScreenEf){
            this.tempScreenEf.remove();
        }
        else if(this._battler.hp <= this._battler.mhp * 0.3 && this.tempScreenEf && !this.tempScreenEf.parent){
            SceneManager._scene.addChild(this.tempScreenEf);
        }
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
        // $gameSystem.addLog(str);
        ($ && $.toaster) ? $.toaster({message:str, repeat:0}) : null;
    }
    mzarpg.prototype.updateDelayWindowMes = function () {
        Object.values(mzarpg.delaymessaging).forEach((map) => {
            const handle = map.get('windowmes');
            if (!handle) return;
            handle(map);
        })
    }
    
    
    function format(str, ...args) {
        return str.replace(/%(\d+)/g, (match, number) => {
            return typeof args[number - 1] !== 'undefined' ? args[number - 1] : match;
        });
    }
    // todo 总音量和音量渐变和webaudio的关系问题
    mzarpg.prototype.playse = function (name, volume=90, pitch=100, pan=0) {
        AudioManager.playSe({name, pan, pitch, volume});
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
    autoPrefab.prototype.createPrefab = function () {
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
            return autoPrefab.prototype._createPrefabByBattler(...arguments);
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
        return prefabs;
    }
    /**
     * 实体组剩余数量
     * @param {string} type 组名
     * @returns {number} 数量
     */
    autoPrefab.prototype.prefabsDynamicCount = function (prefabs) {
        if(!prefabs) return -1;
        if(!prefabs.length) return -1;
        let remain = prefabs.filter((p, i)=>{
            return Prefab.running.get(p.id);
        })
        return remain.length;
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
        let x = (x1 / $gameMap.tileWidth() + $gameMap._displayX);
        let y = (y1 / $gameMap.tileHeight() + $gameMap._displayY);
        return { x, y };
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
     * 事件信号
     * @param {string} tag 标签
     * @param {string} signal 信号
     * @param {boolean} isSelf 仅影响自身，适用于序列混合事件
     * @param {boolean} empty=false 置为空信号
     * @returns {any}
     */
    arpg.prototype.eventSignalChange = function(tag, signal, isSelf, empty=false){
        if(isSelf && this._battler.mapObject.getYaml){
            ComponentEventYaml.__eventSignalChange(this._battler.mapObject, signal, empty);
            return;
        }
        ComponentEventYaml._eventSignalChange(tag, signal, empty);
    }
    arpg.prototype.cev = function(id){
        AGame_Core_MORE._startCommonEvent(id);
    }
    /**
     * 自定义动画
     * @param {object|Prefab} collider 碰撞器/实体
     * @param {number} id 动画id
     * @param {boolean} follow=false 跟随
     */
    arpg.prototype.customAni = function(a, id, follow=true){
        if(a.type == "body"){
            return customAniCollider(a, id, follow);
        }
        else if(a.mapObject){
            return customAniMapObj(a.mapObject, id, follow);
        }
    }
    function customAniCollider(collider, id, follow=true){
        let pos = collider.mapPositionFix;
        if(!pos) return;
        const ani = GT_Animation.ShowGTAniForPositionObj(pos, id);
        if(follow){
            ani.on('update', ()=>{
                let x = GT_Animation.screenX(collider.mapPositionFix);
                let y = GT_Animation.screenY(collider.mapPositionFix);
                ani.overridepos = { x, y };
            })
        }
    }
    function customAniMapObj(a, id, follow=true){
        const ani = GT_Animation.ShowGTAniForCharacter(a, id);
        if(follow){
            ani.on('update', ()=>{
                ani.overridepos = { x:a.screenX(), y:a.screenY() };
            })
        }
    }
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
        console.log(rules);
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
        let d = common._radian2dir(radian, dirs);
        if (setdir) {
            let mapObject = a.mapObject;
            mapObject ? mapObject.setDirection(d) : null;
        }
        return d;
    }
    common._radian2dir = function(radian, dirs){
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
    mixer.mix([Skill, State, Battler], arpg);


    //SAT 自定义碰撞器如网格(piximesh)
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
    sat.prototype.meshCollider = function (m) {
        let poly = _v2poly(m.vertexData);
        console.log(poly);
    }
    mixer.mix([Skill, State, Battler], sat);





    const wrapRelationShip = function(name, top){
        //parent(a)kill(life,destroy)lock(a,b)
        let info = {
            p: 'parent', k:'kill', l:'lock'
        }
        let relation;
        name = name.split(/:/).map(v=>v.trim()); // 父级处理
        let q = name[0];
        let r = name[1];
        if(!r) return q;
        relation = { };
        r.replace(/\w+\([^\(\)]+\)/gi, (m)=>{
            console.log(m);
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
        const nms = new Map();
        let newContent = content.replace(/~res|~req/gi, (m)=>{
            let o = m.replace('~', ``);
            let nm = m.replace('~', `${qname}_`);
            nm = nm.replace(/~/g, '');
            nms.set(o, nm);
            return '$' + nm;
        })
        iii.set(qname, nms);
        return { newContent, nms };
    }

    const implicitStart = function(data, context, name, force=true){
        let i, inners;
        if((i = context.__implicited) && (inners = i.get(name))){
            if(!data) return;
            inners.forEach((nm, o)=>{
                context.cache.set(nm, data[o]);
            })
        }
        let r = context.hook(name, true, true);
        let q;
        if(!r && force && (q = context.currentQueries.get(name))){
            context.resetQuery(q);
        }
    }

    const _preCompliedFixTest = function(all, id, Type=Battler, source={}){
        let temp = new Type({});
        let cache = new Map();
        let rrr = new Map();
        let iii = new Map();
        contexter.preComplied.set(id, cache);
        let ignore = false;
        all.forEach((d) => {
            if (ignore) return;
            let list = /@(.+)\n([^@]+)/.exec(d);
            if (!list || !list[2]) return;
            let qname = list[1].trim();
            qname = wrapRelationShip(qname, rrr);
            let content = list[2];
            let implicited = preImplicitQuery(qname, content, iii);
            if(implicited){
                content = implicited.newContent;
            }
            if (qname.toLocaleLowerCase() == 'deprecated') {
                ignore = true;
                return;
            }
            temp.source = source;
            let q = temp._build(content);
            if (q) {
                cache.set(qname, q);
            }
        })
        if(rrr.size){
            cache.__relation = rrr;
            console.log(rrr);
        }
        if(iii.size){
            cache.__implicited = iii;
        }
        return cache;
    }

    const preCompliedFixTest = function (data, Type=Battler) {
        if (!data) return;
        let all = data.note.match(/@.+\n([^@]+)@end/gi);
        if (!all || !all.length) return;
        let name = Type.name;
        let id = data.id;
        return _preCompliedFixTest(all, `${name}${id}`, Type, data);
    }

    contexter.preComplied = new Map();

    exports.preCompliedFixTest = preCompliedFixTest;
    exports._preCompliedFixTest = _preCompliedFixTest;
    exports.Battler = Battler;
    exports.Skill = Skill;
    exports.State = State;
    exports.Ene = Ene;

    return exports;
})({});



