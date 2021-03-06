/**
@author	leeluolee
@version	0.1.5
@homepage	https://github.com/leeluolee/stateman
*/
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define('stateman',factory);
	else if(typeof exports === 'object')
		exports["StateMan"] = factory();
	else
		root["StateMan"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var StateMan = __webpack_require__(1);
	StateMan.Histery = __webpack_require__(2);
	StateMan.util = __webpack_require__(3);
	StateMan.State = __webpack_require__(4);

	module.exports = StateMan;


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var State = __webpack_require__(4),
	  Histery = __webpack_require__(2),
	  brow = __webpack_require__(5),
	  _ = __webpack_require__(3),
	  stateFn = State.prototype.state;



	function StateMan(options){
	  if(this instanceof StateMan === false){ return new StateMan(options)}
	  options = options || {};
	  if(options.history) this.history = options.history;
	  this._states = {};
	  this._stashCallback = [];
	  this.current = this.active = this;
	}


	_.extend( _.emitable( StateMan ), {
	    // start StateMan

	    state: function(stateName, config){
	      var active = this.active;
	      if(typeof stateName === "string" && active.name){
	         stateName = stateName.replace("~", active.name)
	         if(active.parent) stateName = stateName.replace("^", active.parent.name || "");
	      }
	      // ^ represent current.parent
	      // ~ represent  current
	      // only 
	      return stateFn.apply(this, arguments);
	    },
	    start: function(options){
	      if( !this.history ) this.history = new Histery(options); 
	      if( !this.history.isStart ){
	        this.history.on("change", _.bind(this._afterPathChange, this));
	        this.history.start();
	      } 
	      return this;
	    },
	    stop: function(){
	      this.history.stop();
	    },
	    // @TODO direct go the point state
	    go: function(state, option, callback){
	      option = option || {};
	      if(typeof state === "string") state = this.state(state);

	      if(typeof option === "function"){
	        callback = option;
	        option = {};
	      }

	      if(option.encode !== false){
	        var url = state.encode(option.param)
	        this.nav(url, {silent: true, replace: option.replace});
	        this.path = url;
	      }
	      this._go(state, option, callback);
	      return this;
	    },
	    nav: function(url, options, callback){
	      if(typeof option === "function"){
	        callback = option;
	        option = {};
	      }
	      callback && (this._cb = callback)

	      this.history.nav( url, options);
	      this._cb = null;
	      return this;
	    },
	    decode: function(path){
	      var pathAndQuery = path.split("?");
	      var query = this._findQuery(pathAndQuery[1]);
	      path = pathAndQuery[0];
	      var state = this._findState(this, path);
	      if(state) _.extend(state.param, query);
	      return state;
	    },
	    encode: State.prototype.encode,
	    // notify specify state
	    // check the active statename whether to match the passed condition (stateName and param)
	    is: function(stateName, param, isStrict){
	      if(!stateName) return false;
	      var stateName = (stateName.name || stateName);
	      var current = this.current, currentName = current.name;
	      var matchPath = isStrict? currentName === stateName : (currentName + ".").indexOf(stateName + ".")===0;
	      return matchPath && (!param || _.eql(param, this.param)); 
	    },
	    // after pathchange changed
	    // @TODO: afterPathChange need based on decode
	    _afterPathChange: function(path){

	      this.emit("history:change", path);


	      var found = this.decode(path), callback = this._cb;

	      this.path = path;

	      if(!found){
	        // loc.nav("$default", {silent: true})
	        var $notfound = this.state("$notfound");
	        if($notfound) this._go($notfound, {path: path}, callback);

	        return this.emit("notfound", {path: path});
	      }


	      this._go( found, { param: found.param}, callback );
	    },

	    // goto the state with some option
	    _go: function(state, option, callback){
	      var over;

	      if(typeof state === "string") state = this.state(state);


	      if(!state) return _.log("destination is not defined")

	      // not touch the end in previous transtion

	      if(this.active !== this.current){
	        // we need return

	        _.log("naving to [" + this.current.name + "] will be stoped, trying to ["+state.name+"] now");
	        if(this.active.done){
	          this.active.done(false);
	        }
	        this.current = this.active;
	        // back to before
	      }
	      option.param = option.param || {};
	      this.param = option.param;

	      var current = this.current,
	        baseState = this._findBase(current, state),
	        self = this;

	      if( typeof callback === "function" ) this._stashCallback.push(callback);
	      // if we done the navigating when start
	      var done = function(success){
	        over = true;
	        self.current = self.active;
	        if( success !== false ) self.emit("end")
	        self._popStash();
	      }
	      
	      if(current !== state){
	        self.emit("begin", {
	          previous: current,
	          current: state,
	          stop: function(){
	            done(false);
	          }
	        });
	        if(over === true) return;
	        this.previous = current;
	        this.current = state;
	        this._leave(baseState, option, function(success){
	          self._checkQueryAndParam(baseState, option);
	          if(success === false) return done(success)
	          self._enter(state, option, done)
	        })
	      }else{
	        self._checkQueryAndParam(baseState, option);
	        done();
	      }
	      
	    },
	    _popStash: function(){
	      var stash = this._stashCallback, len = stash.length;
	      this._stashCallback = [];
	      if(!len) return;

	      for(var i = 0; i < len; i++){
	        stash[i].call(this)
	      }

	    },

	    _findQuery: function(querystr){
	      var queries = querystr && querystr.split("&"), query= {};
	      if(queries){
	        var len = queries.length;
	        var query = {};
	        for(var i =0; i< len; i++){
	          var tmp = queries[i].split("=");
	          query[tmp[0]] = tmp[1];
	        }
	      }
	      return query;
	    },
	    _findState: function(state, path){
	      var states = state._states, found, param;

	      // leaf-state has the high priority upon branch-state
	      if(state.hasNext){
	        for(var i in states) if(states.hasOwnProperty(i)){
	          found = this._findState( states[i], path );
	          if( found ) return found;
	        }
	      }
	      param = state.regexp && state.decode(path);
	      if(param){
	        state.param = param;
	        return state;
	      }else{
	        return false;
	      }
	    },
	    // find the same branch;
	    _findBase: function(now, before){
	      if(!now || !before || now == this || before == this) return this;
	      var np = now, bp = before, tmp;
	      while(np && bp){
	        tmp = bp;
	        while(tmp){
	          if(np === tmp) return tmp;
	          tmp = tmp.parent;
	        }
	        np = np.parent;
	      }
	      return this;
	    },
	    _enter: function(end, options, callback){

	      callback = callback || _.noop;

	      var active = this.active;

	      if(active == end) return callback();
	      var stage = [];
	      while(end !== active && end){
	        stage.push(end);
	        end = end.parent;
	      }
	      this._enterOne(stage, options, callback)
	    },
	    _enterOne: function(stage, options, callback){

	      var cur = stage.pop(), self = this;
	      if(!cur) return callback();

	      this.active = cur;

	      cur.done = function(success){
	        cur._pending = false;
	        cur.done = null;
	        cur.visited = true;
	        if(success !== false){
	          self._enterOne(stage, options, callback)
	          
	        }else{
	          return callback(success);
	        }
	      }

	      if(!cur.enter) cur.done();
	      else {
	        var success = cur.enter(options);
	        if(!cur._pending && cur.done) cur.done(success);
	      }
	    },
	    _leave: function(end, options, callback){
	      callback = callback || _.noop;
	      if(end == this.active) return callback();
	      this._leaveOne(end, options,callback)
	    },
	    _leaveOne: function(end, options, callback){
	      if( end === this.active ) return callback();
	      var cur = this.active, self = this;
	      cur.done = function( success ){
	        cur._pending = false;
	        cur.done = null;
	        if(success !== false){
	          if(cur.parent) self.active = cur.parent;
	          self._leaveOne(end, options, callback)
	        }else{
	          return callback(success);
	        }
	      }
	      if(!cur.leave) cur.done();
	      else{
	        var success = cur.leave(options);
	        if( !cur._pending && cur.done) cur.done(success);
	      }
	    },
	    // check the query and Param
	    _checkQueryAndParam: function(baseState, options){
	      var from = baseState;
	      while( from !== this ){
	        from.update && from.update(options);
	        from = from.parent;
	      }
	    }

	}, true)



	module.exports = StateMan;

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	
	// MIT
	// Thx Backbone.js 1.1.2  and https://github.com/cowboy/jquery-hashchange/blob/master/jquery.ba-hashchange.js
	// for iframe patches in old ie.

	var browser = __webpack_require__(5);
	var _ = __webpack_require__(3);


	// the mode const
	var QUIRK = 3,
	  HASH = 1,
	  HISTORY = 2;



	// extract History for test
	// resolve the conficlt with the Native History
	function Histery(options){
	  options = options || {};

	  // Trick from backbone.history for anchor-faked testcase 
	  this.location = options.location || browser.location;

	  // mode config, you can pass absolute mode (just for test);
	  this.html5 = options.html5;
	  this.mode = options.html5 && browser.history ? HISTORY: HASH; 
	  if( !browser.hash ) this.mode = QUIRK;
	  if(options.mode) this.mode = options.mode;

	  // hash prefix , used for hash or quirk mode
	  this.prefix = "#" + (options.prefix || "") ;
	  this.rPrefix = new RegExp(this.prefix + '(.*)$');
	  this.interval = options.interval || 66;

	  // the root regexp for remove the root for the path. used in History mode
	  this.root = options.root ||  "/" ;
	  this.rRoot = new RegExp("^" +  this.root);

	  this._fixInitState();

	  this.autolink = options.autolink!==false;

	  this.curPath = undefined;
	}

	_.extend( _.emitable(Histery), {
	  // check the 
	  start: function(){
	    var path = this.getPath();
	    this._checkPath = _.bind(this.checkPath, this);

	    if( this.isStart ) return;
	    this.isStart = true;

	    if(this.mode === QUIRK){
	      this._fixHashProbelm(path); 
	    }

	    switch ( this.mode ){
	      case HASH: 
	        browser.on(window, "hashchange", this._checkPath); 
	        break;
	      case HISTORY:
	        browser.on(window, "popstate", this._checkPath);
	        break;
	      case QUIRK:
	        this._checkLoop();
	    }
	    // event delegate
	    this.autolink && this._autolink();

	    this.curPath = path;

	    this.emit("change", path);
	  },
	  // the history teardown
	  stop: function(){

	    browser.off(window, 'hashchange', this._checkPath)  
	    browser.off(window, 'popstate', this._checkPath)  
	    clearTimeout(this.tid);
	    this.isStart = false;
	    this._checkPath = null;
	  },
	  // get the path modify
	  checkPath: function(ev){

	    var path = this.getPath(), curPath = this.curPath;

	    //for oldIE hash history issue
	    if(path === curPath && this.iframe){
	      path = this.getPath(this.iframe.location);
	    }

	    if( path !== curPath ) {
	      this.iframe && this.nav(path, {silent: true});
	      this.curPath = path;
	      this.emit('change', path);
	    }
	  },
	  // get the current path
	  getPath: function(location){
	    var location = location || this.location, tmp;
	    if( this.mode !== HISTORY ){
	      tmp = location.href.match(this.rPrefix);
	      return tmp && tmp[1]? tmp[1]: "";

	    }else{
	      return _.cleanPath(( location.pathname + location.search || "" ).replace( this.rRoot, "/" ))
	    }
	  },

	  nav: function(to, options ){

	    var iframe = this.iframe;

	    options = options || {};

	    to = _.cleanPath(to);

	    if(this.curPath == to) return;

	    // pushState wont trigger the checkPath
	    // but hashchange will
	    // so we need set curPath before to forbit the CheckPath
	    this.curPath = to;

	    // 3 or 1 is matched
	    if( this.mode !== HISTORY ){
	      this._setHash(this.location, to, options.replace)
	      if( iframe && this.getPath(iframe.location) !== to ){
	        if(!options.replace) iframe.document.open().close();
	        this._setHash(this.iframe.location, to, options.replace)
	      }
	    }else{
	      history[options.replace? 'replaceState': 'pushState']( {}, options.title || "" , _.cleanPath( this.root + to ) )
	    }

	    if( !options.silent ) this.emit('change', to);
	  },
	  _autolink: function(){
	    if(this.mode!==HISTORY) return;
	    // only in html5 mode, the autolink is works
	    // if(this.mode !== 2) return;
	    var prefix = this.prefix, self = this;
	    browser.on( document.body, "click", function(ev){
	      var target = ev.target || ev.srcElement;
	      if( target.tagName.toLowerCase() !== "a" ) return;
	      var tmp = (browser.getHref(target)||"").match(self.rPrefix);
	      var hash = tmp && tmp[1]? tmp[1]: "";

	      if(!hash) return;
	      
	      ev.preventDefault && ev.preventDefault();
	      self.nav( hash )
	      return (ev.returnValue = false);
	    } )
	  },
	  _setHash: function(location, path, replace){
	    var href = location.href.replace(/(javascript:|#).*$/, '');
	    if (replace){
	      location.replace(href + this.prefix+ path);
	    }
	    else location.hash = this.prefix+ path;
	  },
	  // for browser that not support onhashchange
	  _checkLoop: function(){
	    var self = this; 
	    this.tid = setTimeout( function(){
	      self._checkPath();
	      self._checkLoop();
	    }, this.interval );
	  },
	  // if we use real url in hash env( browser no history popstate support)
	  // or we use hash in html5supoort mode (when paste url in other url)
	  // then , histery should repara it
	  _fixInitState: function(){
	    var pathname = _.cleanPath(this.location.pathname), hash, hashInPathName;

	    // dont support history popstate but config the html5 mode
	    if( this.mode !== HISTORY && this.html5){

	      hashInPathName = pathname.replace(this.rRoot, "")
	      if(hashInPathName) this.location.replace(this.root + this.prefix + hashInPathName);

	    }else if( this.mode === HISTORY /* && pathname === this.root*/){

	      hash = this.location.hash.replace(this.prefix, "");
	      if(hash) history.replaceState({}, document.title, _.cleanPath(this.root + hash))

	    }
	  },
	  // Thanks for backbone.history and https://github.com/cowboy/jquery-hashchange/blob/master/jquery.ba-hashchange.js
	  // for helping stateman fixing the oldie hash history issues when with iframe hack
	  _fixHashProbelm: function(path){
	    var iframe = document.createElement('iframe'), body = document.body;
	    iframe.src = 'javascript:;';
	    iframe.style.display = 'none';
	    iframe.tabIndex = -1;
	    iframe.title = "";
	    this.iframe = body.insertBefore(iframe, body.firstChild).contentWindow;
	    this.iframe.document.open().close();
	    this.iframe.location.hash = '#' + path;
	  }
	  
	})





	module.exports = Histery;

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	var _ = module.exports = {};
	var slice = [].slice, o2str = ({}).toString;


	// merge o2's properties to Object o1. 
	_.extend = function(o1, o2, override){
	  for(var i in o2) if(override || o1[i] === undefined){
	    o1[i] = o2[i]
	  }
	  return o1;
	}


	// Object.create shim
	_.ocreate = Object.create || function(o) {
	  var Foo = function(){};
	  Foo.prototype = o;
	  return new Foo;
	}


	_.slice = function(arr, index){
	  return slice.call(arr, index);
	}

	_.typeOf = function typeOf (o) {
	  return o == null ? String(o) : o2str.call(o).slice(8, -1).toLowerCase();
	}

	//strict eql
	_.eql = function(o1, o2){
	  var t1 = _.typeOf(o1), t2 = _.typeOf(o2);
	  if( t1 !== t2) return false;
	  if(t1 === 'object'){
	    var equal = true;
	    // only check the first's propertie
	    for(var i in o1){
	      if( o1[i] !== o2[i] ) equal = false;
	    }
	    return equal;
	  }
	  return o1 === o2;
	}


	// small emitter 
	_.emitable = (function(){
	  var API = {
	    once: function(event, fn){
	      var callback = function(){
	        fn.apply(this, arguments)
	        this.off(event, callback)
	      }
	      return this.on(event, callback)
	    },
	    on: function(event, fn) {
	      if(typeof event === 'object'){
	        for (var i in event) {
	          this.on(i, event[i]);
	        }
	      }else{
	        var handles = this._handles || (this._handles = {}),
	          calls = handles[event] || (handles[event] = []);
	        calls.push(fn);
	      }
	      return this;
	    },
	    off: function(event, fn) {
	      if(!event || !this._handles) this._handles = {};
	      if(!this._handles) return;

	      var handles = this._handles , calls;

	      if (calls = handles[event]) {
	        if (!fn) {
	          handles[event] = [];
	          return this;
	        }
	        for (var i = 0, len = calls.length; i < len; i++) {
	          if (fn === calls[i]) {
	            calls.splice(i, 1);
	            return this;
	          }
	        }
	      }
	      return this;
	    },
	    emit: function(event){
	      var args = _.slice(arguments, 1),
	        handles = this._handles, calls;

	      if (!handles || !(calls = handles[event])) return this;
	      for (var i = 0, len = calls.length; i < len; i++) {
	        calls[i].apply(this, args)
	      }
	      return this;
	    }
	  }
	  return function(obj){
	      obj = typeof obj == "function" ? obj.prototype : obj;
	      return _.extend(obj, API)
	  }
	})();


	_.noop = function(){}

	_.bind = function(fn, context){
	  return function(){
	    return fn.apply(context, arguments);
	  }
	}

	var rDbSlash = /\/+/g, // double slash
	  rEndSlash = /\/$/;    // end slash

	_.cleanPath = function (path){
	  return ("/" + path).replace( rDbSlash,"/" ).replace( rEndSlash, "" ) || "/";
	}

	// normalize the path
	function normalizePath(path) {
	  // means is from 
	  // (?:\:([\w-]+))?(?:\(([^\/]+?)\))|(\*{2,})|(\*(?!\*)))/g
	  var preIndex = 0;
	  var keys = [];
	  var index = 0;
	  var matches = "";

	  path = _.cleanPath(path);

	  var regStr = path
	    //  :id(capture)? | (capture)   |  ** | * 
	    .replace(/\:([\w-]+)(?:\(([^\/]+?)\))?|(?:\(([^\/]+)\))|(\*{2,})|(\*(?!\*))/g, 
	      function(all, key, keyformat, capture, mwild, swild, startAt) {
	        // move the uncaptured fragment in the path
	        if(startAt > preIndex) matches += path.slice(preIndex, startAt);
	        preIndex = startAt + all.length;
	        if( key ){
	          matches += "(" + key + ")";
	          keys.push(key)
	          return "("+( keyformat || "[\\w-]+")+")";
	        }
	        matches += "(" + index + ")";

	        keys.push( index++ );

	        if( capture ){
	           // sub capture detect
	          return "(" + capture +  ")";
	        } 
	        if(mwild) return "(.*)";
	        if(swild) return "([^\\/]*)";
	    })

	  if(preIndex !== path.length) matches += path.slice(preIndex)

	  return {
	    regexp: new RegExp("^" + regStr +"/?$"),
	    keys: keys,
	    matches: matches || path
	  }
	}

	_.log = function(msg, type){
	  typeof console !== "undefined" && console[type || "log"](msg)
	}


	_.normalize = normalizePath;



/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(3);

	function State(option){
	  this._states = {};
	  this._pending = false;
	  this.visited = false;
	  if(option) this.config(option);
	}


	//regexp cache
	State.rCache = {};

	_.extend( _.emitable( State ), {
	  
	  state: function(stateName, config){
	    if(_.typeOf(stateName) === "object"){
	      for(var i in stateName){
	        this.state(i, stateName[i])
	      }
	      return this;
	    }
	    var current, next, nextName, states = this._states, i=0;

	    if( typeof stateName === "string" ) stateName = stateName.split(".");

	    var slen = stateName.length, current = this;
	    var stack = [];


	    do{
	      nextName = stateName[i];
	      next = states[nextName];
	      stack.push(nextName);
	      if(!next){
	        if(!config) return;
	        next = states[nextName] = new State();
	        _.extend(next, {
	          parent: current,
	          manager: current.manager || current,
	          name: stack.join("."),
	          currentName: nextName
	        })
	        current.hasNext = true;
	        next.configUrl();
	      }
	      current = next;
	      states = next._states;
	    }while((++i) < slen )

	    if(config){
	       next.config(config);
	       return this;
	    } else {
	      return current;
	    }
	  },

	  config: function(configure){
	    if(!configure ) return;
	    configure = this._getConfig(configure);

	    for(var i in configure){
	      var prop = configure[i];
	      switch(i){
	        case "url": 
	          if(typeof prop === "string"){
	            this.url = prop;
	            this.configUrl();
	          }
	          break;
	        case "events": 
	          this.on(prop)
	          break;
	        default:
	          this[i] = prop;
	      }
	    }
	  },

	  // children override
	  _getConfig: function(configure){
	    return typeof configure === "function"? {enter: configure} : configure;
	  },

	  //from url 

	  configUrl: function(){
	    var url = "" , base = this, currentUrl;
	    var _watchedParam = [];

	    while( base ){

	      url = (typeof base.url === "string" ? base.url: (base.currentName || "")) + "/" + url;

	      // means absolute;
	      if(url.indexOf("^/") === 0) {
	        url = url.slice(1);
	        break;
	      }
	      base = base.parent;
	    }
	    this.pattern = _.cleanPath("/" + url);
	    var pathAndQuery = this.pattern.split("?");
	    this.pattern = pathAndQuery[0];
	    // some Query we need watched

	    _.extend(this, _.normalize(this.pattern), true);
	  },
	  encode: function(stateName, param){
	    var state;
	    stateName = stateName || {};
	    if( _.typeOf(stateName) === "object" ){
	      state = this;
	      param = stateName;
	    }else{
	      state = this.state(stateName);
	    }
	    var param = param || {};

	    var matched = "%";

	    var url = state.matches.replace(/\(([\w-]+)\)/g, function(all, capture){
	      var sec = param[capture] || "";
	      matched+= capture + "%";
	      return sec;
	    }) + "?";

	    // remained is the query, we need concat them after url as query
	    for(var i in param) {
	      if( matched.indexOf("%"+i+"%") === -1) url += i + "=" + param[i] + "&";
	    }
	    return _.cleanPath( url.replace(/(?:\?|&)$/,"") )
	  },
	  decode: function( path ){
	    var matched = this.regexp.exec(path),
	      keys = this.keys;

	    if(matched){

	      var param = {};
	      for(var i =0,len=keys.length;i<len;i++){
	        param[keys[i]] = matched[i+1] 
	      }
	      return param;
	    }else{
	      return false;
	    }
	  },
	  async: function(){
	    var self = this;
	    this._pending = true;
	    return this.done;
	  }

	})


	module.exports = State;

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	
	var win = window, 
	  doc = document;



	var b = module.exports = {
	  hash: "onhashchange" in win && (!doc.documentMode || doc.documentMode > 7),
	  history: win.history && "onpopstate" in win,
	  location: win.location,
	  getHref: function(node){
	    return "href" in node ? node.getAttribute("href", 2) : node.getAttribute("href");
	  },
	  on: "addEventListener" in win ?  // IE10 attachEvent is not working when binding the onpopstate, so we need check addEventLister first
	      function(node,type,cb){return node.addEventListener( type, cb )}
	    : function(node,type,cb){return node.attachEvent( "on" + type, cb )},
	    
	  off: "removeEventListener" in win ? 
	      function(node,type,cb){return node.removeEventListener( type, cb )}
	    : function(node,type,cb){return node.detachEvent( "on" + type, cb )}
	}

	b.msie = parseInt((/msie (\d+)/.exec(navigator.userAgent.toLowerCase()) || [])[1]);
	if (isNaN(b.msie)) {
	  b.msie = parseInt((/trident\/.*; rv:(\d+)/.exec(navigator.userAgent.toLowerCase()) || [])[1]);
	}


/***/ }
/******/ ])
});

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define('restate',['stateman'], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('stateman'));
    } else {
        // Browser globals (root is window)
        root.restate = factory(root.Regularjs, root.StateMan);
    }
}(this, function (StateMan) {

  var _ = StateMan.util;

  var restate = function(option){
    option = option || {};
    var stateman = option.stateman || new StateMan(option);
    var preStae = stateman.state;
    var BaseComponent = option.Component;
    var globalView = option.view || document.body;

    var filters = {
      encode: function(value, param){
        return stateman.history.prefix + (stateman.encode(value, param || {}) || "");
      }
    }

    stateman.state = function(name, Component, config){

      if(!Component) return preStae.call(stateman, name);

      if(BaseComponent){
        // 1. regular template or parsed ast
        if(typeof Component === "string" || Array.isArray( Component )){
          Component = BaseComponent.extend({
            template: Component
          })
        }
        // 2. it a Object, but need regularifi
        if(typeof Component === "object" && Component.regularify ){
          Component = BaseComponent.extend( Component );
        }
      }

      // 3. duck check is a Regular Component
      if( Component.extend && Component.__after__ ){

        if(!Component.filter("encode")){
          Component.filter(filters);
        }
        var state = {
          component: null,
          enter: function( step ){
            var data = { $param: step.param },
              component = this.component,
              noComponent = !component, 
              view;

            if(noComponent){
              component = this.component = new Component({
                data: data,
                $state: stateman
              });

            }
            _.extend(component.data, data, true);

            var parent = this.parent, view;
            if(parent.component){
              var view = parent.component.$refs.view;
              if(!view) throw this.parent.name + " should have a element with [ref=view]";
            }
            component.$inject( view || globalView )
            var result = component.enter && component.enter(step);
            component.$mute(false);
            if(noComponent) component.$update();
            return result;
          },
          leave: function( option){
            var component = this.component;
            if(!component) return;
            component.$inject(false);
            component.leave && component.leave(option);
            component.$mute(true);
          },
          update: function(option){
            var component = this.component;
            if(!component) return;
            component.update && component.update(option);
            component.$update({
              $param: option.param
            })
            component.$emit("state:update", option);
          }
        }

        if(typeof config === "string") config = {url: config};
        _.extend(state, config || {});

        preStae.call(stateman, name, state);

      }else{
        preStae.call(stateman, name, Component);
      }
      return this;
    }
    return stateman;
  }

  restate.StateMan = StateMan;

  return restate;

}));

/**
@author	leeluolee
@version	0.3.0-pre
@homepage	http://regularjs.github.io
*/
;(function(){


/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    throwError()
    return
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module._resolving && !module.exports) {
    var mod = {};
    mod.exports = {};
    mod.client = mod.component = true;
    module._resolving = true;
    module.call(this, mod.exports, require.relative(resolved), mod);
    delete module._resolving;
    module.exports = mod.exports;
  }

  function throwError () {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.exts = [
    '',
    '.js',
    '.json',
    '/index.js',
    '/index.json'
 ];

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  for (var i = 0; i < 5; i++) {
    var fullPath = path + require.exts[i];
    if (require.modules.hasOwnProperty(fullPath)) return fullPath;
    if (require.aliases.hasOwnProperty(fullPath)) return require.aliases[fullPath];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {

  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' === path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }
  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throwError()
    return
  }
  require.aliases[to] = from;

  function throwError () {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' === c) return path.slice(1);
    if ('.' === c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = segs.length;
    while (i--) {
      if (segs[i] === 'deps') {
        break;
      }
    }
    path = segs.slice(0, i + 2).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("regularjs/src/Regular.js", function(exports, require, module){

var Lexer = require("./parser/Lexer.js");
var Parser = require("./parser/Parser.js");
var dom = require("./dom.js");
var config = require("./config.js");
var Group = require('./group.js');
var _ = require('./util');
var extend = require('./helper/extend.js');
var Event = require('./helper/event.js');
var combine = require('./helper/combine.js');
var Watcher = require('./helper/watcher.js');
var parse = require('./helper/parse.js');
var doc = typeof document==='undefined'? {} : document;
var env = require('./env.js');


/**
* `Regular` is regularjs's NameSpace and BaseClass. Every Component is inherited from it
* 
* @class Regular
* @module Regular
* @constructor
* @param {Object} options specification of the component
*/
var Regular = function(options){
  var prevRunning = env.isRunning;
  env.isRunning = true;
  var node, template;

  options = options || {};
  options.data = options.data || {};
  options.computed = options.computed || {};
  options.events = options.events || {};
  if(this.data) _.extend(options.data, this.data);
  if(this.computed) _.extend(options.computed, this.computed);
  if(this.events) _.extend(options.events, this.events);

  _.extend(this, options, true);
  if(this.$parent){
     this.$parent._append(this);
  }
  this._children = [];
  this.$refs = {};

  template = this.template;

  // template is a string (len < 40). we will find it container first
  if((typeof template === 'string' && template.length < 40) && (node = dom.find(template))) {
    template = node.innerHTML;
  }
  // if template is a xml
  if(template && template.nodeType) template = template.innerHTML;
  if(typeof template === 'string') this.template = new Parser(template).parse();

  this.computed = handleComputed(this.computed);
  this.$context = this.$context || this;
  this.$root = this.$root || this;
  // if have events
  if(this.events){
    this.$on(this.events);
  }

  this.config && this.config(this.data);
  // handle computed
  if(template){
    this.group = this.$compile(this.template, {namespace: options.namespace});
    combine.node(this);
  }


  if(this.$root === this) this.$update();
  this.$ready = true;
  if(this.$context === this) this.$emit("$init");
  if( this.init ) this.init(this.data);

  // @TODO: remove, maybe , there is no need to update after init; 
  // if(this.$root === this) this.$update();
  env.isRunning = prevRunning;

  // children is not required;
}


var walkers = require('./walkers.js');
walkers.Regular = Regular;


// description
// -------------------------
// 1. Regular and derived Class use same filter
_.extend(Regular, {
  // private data stuff
  _directives: { __regexp__:[] },
  _plugins: {},
  _protoInheritCache: [ 'directive', 'use'] ,
  __after__: function(supr, o) {

    var template;
    this.__after__ = supr.__after__;

    if(o.name) supr.component(o.name, this);
    // this.prototype.template = dom.initTemplate(o)
    if(template = o.template){
      var node, name;
      if( typeof template === 'string' && template.length < 20 && ( node = dom.find( template )) ){
        template = node.innerHTML;
        if(name = dom.attr(node, 'name')) Regular.component(name, this);
      }

      if(template.nodeType) template = template.innerHTML;

      if(typeof template === 'string'){
        this.prototype.template = new Parser(template).parse();
      }
    }

    if(o.computed) this.prototype.computed = handleComputed(o.computed);
    // inherit directive and other config from supr
    Regular._inheritConfig(this, supr);

  },
  /**
   * Define a directive
   *
   * @method directive
   * @return {Object} Copy of ...
   */  
  directive: function(name, cfg){

    if(_.typeOf(name) === "object"){
      for(var k in name){
        if(name.hasOwnProperty(k)) this.directive(k, name[k]);
      }
      return this;
    }
    var type = _.typeOf(name);
    var directives = this._directives, directive;
    if(cfg == null){
      if( type === "string" && (directive = directives[name]) ) return directive;
      else{
        var regexp = directives.__regexp__;
        for(var i = 0, len = regexp.length; i < len ; i++){
          directive = regexp[i];
          var test = directive.regexp.test(name);
          if(test) return directive;
        }
      }
      return undefined;
    }
    if(typeof cfg === 'function') cfg = { link: cfg } 
    if(type === 'string') directives[name] = cfg;
    else if(type === 'regexp'){
      cfg.regexp = name;
      directives.__regexp__.push(cfg)
    }
    return this
  },
  plugin: function(name, fn){
    var plugins = this._plugins;
    if(fn == null) return plugins[name];
    plugins[name] = fn;
    return this;
  },
  use: function(fn){
    if(typeof fn === "string") fn = Regular.plugin(fn);
    if(typeof fn !== "function") return this;
    fn(this, Regular);
    return this;
  },
  // config the Regularjs's global
  config: function(name, value){
    var needGenLexer = false;
    if(typeof name === "object"){
      for(var i in name){
        // if you config
        if( i ==="END" || i==='BEGIN' )  needGenLexer = true;
        config[i] = name[i];
      }
    }
    if(needGenLexer) Lexer.setup();
  },
  expression: parse.expression,
  parse: parse.parse,

  Parser: Parser,
  Lexer: Lexer,

  _addProtoInheritCache: function(name, transform){
    if( Array.isArray( name ) ){
      return name.forEach(Regular._addProtoInheritCache);
    }
    var cacheKey = "_" + name + "s"
    Regular._protoInheritCache.push(name)
    Regular[cacheKey] = {};
    if(Regular[name]) return;
    Regular[name] = function(key, cfg){
      var cache = this[cacheKey];

      if(typeof key === "object"){
        for(var i in key){
          if(key.hasOwnProperty(i)) this[name](i, key[i]);
        }
        return this;
      }
      if(cfg == null) return cache[key];
      cache[key] = transform? transform(cfg) : cfg;
      return this;
    }
  },
  _inheritConfig: function(self, supr){

    // prototype inherit some Regular property
    // so every Component will have own container to serve directive, filter etc..
    var defs = Regular._protoInheritCache;
    var keys = _.slice(defs);
    keys.forEach(function(key){
      self[key] = supr[key];
      var cacheKey = '_' + key + 's';
      if(supr[cacheKey]) self[cacheKey] = _.createObject(supr[cacheKey]);
    })
    return self;
  }

});

extend(Regular);

Regular._addProtoInheritCache("component")

Regular._addProtoInheritCache("filter", function(cfg){
  return typeof cfg === "function"? {get: cfg}: cfg;
})


Event.mixTo(Regular);
Watcher.mixTo(Regular);

Regular.implement({
  init: function(){},
  config: function(){},
  destroy: function(){
    // destroy event wont propgation;
    if(this.$context === this) this.$emit("$destroy");
    this.group && this.group.destroy(true);
    this.group = null;
    this.parentNode = null;
    this._watchers = null;
    this._children = [];
    var parent = this.$parent;
    if(parent){
      var index = parent._children.indexOf(this);
      parent._children.splice(index,1);
    }
    this.$parent = null;
    this.$root = null;
    this._handles = null;
    this.$refs = null;
  },

  /**
   * compile a block ast ; return a group;
   * @param  {Array} parsed ast
   * @param  {[type]} record
   * @return {[type]}
   */
  $compile: function(ast, options){
    options = options || {};
    if(typeof ast === 'string'){
      ast = new Parser(ast).parse()
    }
    var preNs = this.__ns__,
      record = options.record, 
      records;
    if(options.namespace) this.__ns__ = options.namespace;
    if(record) this._record();
    var group = this._walk(ast, options);
    if(record){
      records = this._release();
      var self = this;
      if(records.length){
        // auto destroy all wather;
        group.ondestroy = function(){ self.$unwatch(records); }
      }
    }
    if(options.namespace) this.__ns__ = preNs;
    return group;
  },


  /**
   * create two-way binding with another component;
   * *warn*: 
   *   expr1 and expr2 must can operate set&get, for example: the 'a.b' or 'a[b + 1]' is set-able, but 'a.b + 1' is not, 
   *   beacuse Regular dont know how to inverse set through the expression;
   *   
   *   if before $bind, two component's state is not sync, the component(passed param) will sync with the called component;
   *
   * *example: *
   *
   * ```javascript
   * // in this example, we need to link two pager component
   * var pager = new Pager({}) // pager compoennt
   * var pager2 = new Pager({}) // another pager component
   * pager.$bind(pager2, 'current'); // two way bind throw two component
   * pager.$bind(pager2, 'total');   // 
   * // or just
   * pager.$bind(pager2, {"current": "current", "total": "total"}) 
   * ```
   * 
   * @param  {Regular} component the
   * @param  {String|Expression} expr1     required, self expr1 to operate binding
   * @param  {String|Expression} expr2     optional, other component's expr to bind with, if not passed, the expr2 will use the expr1;
   * @return          this;
   */
  $bind: function(component, expr1, expr2){
    var type = _.typeOf(expr1);
    if( expr1.type === 'expression' || type === 'string' ){
      this._bind(component, expr1, expr2)
    }else if( type === "array" ){ // multiply same path binding through array
      for(var i = 0, len = expr1.length; i < len; i++){
        this._bind(component, expr1[i]);
      }
    }else if(type === "object"){
      for(var i in expr1) if(expr1.hasOwnProperty(i)){
        this._bind(component, i, expr1[i]);
      }
    }
    // digest
    component.$update();
    return this;
  },
  /**
   * unbind one component( see $bind also)
   *
   * unbind will unbind all relation between two component
   * 
   * @param  {Regular} component [description]
   * @return {This}    this
   */
  $unbind: function(){
    // todo
  },
  $inject: function(node, position, options){
    var fragment = combine.node(this);

    if(node === false) {
      if(!this._fragContainer)  this._fragContainer = dom.fragment();
      return this.$inject(this._fragContainer);
    }
    if(typeof node === 'string') node = dom.find(node);
    if(!node) throw 'injected node is not found';
    if(!fragment) return this;
    dom.inject(fragment, node, position);
    this.$emit("$inject", node);
    this.parentNode = Array.isArray(fragment)? fragment[0].parentNode: fragment.parentNode;
    return this;
  },
  $mute: function(isMute){

    isMute = !!isMute;

    var needupdate = isMute === false && this._mute;

    this._mute = !!isMute;

    if(needupdate) this.$update();
    return this;
  },
  // private bind logic
  _bind: function(component, expr1, expr2){

    var self = this;
    // basic binding

    if(!component || !(component instanceof Regular)) throw "$bind() should pass Regular component as first argument";
    if(!expr1) throw "$bind() should  pass as least one expression to bind";

    if(!expr2) expr2 = expr1;

    expr1 = parse.expression( expr1 );
    expr2 = parse.expression( expr2 );

    // set is need to operate setting ;
    if(expr2.set){
      var wid1 = this.$watch( expr1, function(value){
        component.$update(expr2, value)
      });
      component.$on('$destroy', function(){
        self.$unwatch(wid1)
      })
    }
    if(expr1.set){
      var wid2 = component.$watch(expr2, function(value){
        self.$update(expr1, value)
      });
      // when brother destroy, we unlink this watcher
      this.$on('$destroy', component.$unwatch.bind(component,wid2))
    }
    // sync the component's state to called's state
    expr2.set(component, expr1.get(this));
  },
  _walk: function(ast, arg1){
    if( _.typeOf(ast) === 'array' ){
      var res = [];

      for(var i = 0, len = ast.length; i < len; i++){
        res.push( this._walk(ast[i], arg1) );
      }

      return new Group(res);
    }
    if(typeof ast === 'string') return doc.createTextNode(ast)
    return walkers[ast.type || "default"].call(this, ast, arg1);
  },
  _append: function(component){
    this._children.push(component);
    component.$root = this.$root;
    component.$parent = this;
  },
  _handleEvent: function(elem, type, value, attrs){
    var Component = this.constructor,
      fire = typeof value !== "function"? _.handleEvent.call( this, value, type ) : value,
      handler = Component.event(type), destroy;

    if ( handler ) {
      destroy = handler.call(this, elem, fire, attrs);
    } else {
      dom.on(elem, type, fire);
    }
    return handler ? destroy : function() {
      dom.off(elem, type, fire);
    }
  },
  // find filter
  _f_: function(name){
    var Component = this.constructor;
    var filter = Component.filter(name);
    if(!filter) throw 'filter ' + name + ' is undefined';
    return filter;
  },
  // simple accessor get
  _sg_:function(path, defaults, needComputed){
    if(needComputed){
      var computed = this.computed,
        computedProperty = computed[path];
      if(computedProperty){
        if(computedProperty.get)  return computedProperty.get(this);
        else _.log("the computed '" + path + "' don't define the get function,  get data."+path + " altnately", "error")
      }
    }
    if(typeof defaults === "undefined" || typeof path == "undefined" ) return undefined;
    return defaults[path];

  },
  // simple accessor set
  _ss_:function(path, value, data , op, computed){
    var computed = this.computed,
      op = op || "=", prev, 
      computedProperty = computed? computed[path]:null;

    if(op !== '='){
      prev = computedProperty? computedProperty.get(this): data[path];
      switch(op){
        case "+=":
          value = prev + value;
          break;
        case "-=":
          value = prev - value;
          break;
        case "*=":
          value = prev * value;
          break;
        case "/=":
          value = prev / value;
          break;
        case "%=":
          value = prev % value;
          break;
      }
    }
    if(computedProperty) {
      if(computedProperty.set) return computedProperty.set(this, value);
      else _.log("the computed '" + path + "' don't define the set function,  assign data."+path + " altnately", "error" )
    }
    data[path] = value;
    return value;
  }
});

Regular.prototype.inject = Regular.prototype.$inject;


// only one builtin filter
Regular.filter("json", function(value, minify){
  if(typeof JSON !== 'undefined' && JSON.stringify){
    return JSON.stringify(value);
  }else{
    return value
  }
})

module.exports = Regular;



var handleComputed = (function(){
  // wrap the computed getter;
  function wrapGet(get){
    return function(context){
      var ctx = context.$context;
      return get.call(ctx, ctx.data );
    }
  }
  // wrap the computed setter;
  function wrapSet(set){
    return function(context, value){
      var ctx = context.$context;
      set.call( ctx, value, ctx.data );
      return value;
    }
  }

  return function(computed){
    if(!computed) return;
    var parsedComputed = {}, handle, pair, type;
    for(var i in computed){
      handle = computed[i]
      type = typeof handle;

      if(handle.type === 'expression'){
        parsedComputed[i] = handle;
        continue;
      }
      if( type === "string" ){
        parsedComputed[i] = parse.expression(handle)
      }else{
        pair = parsedComputed[i] = {type: 'expression'};
        if(type === "function" ){
          pair.get = wrapGet(handle);
        }else{
          if(handle.get) pair.get = wrapGet(handle.get);
          if(handle.set) pair.set = wrapSet(handle.set);
        }
      } 
    }
    return parsedComputed;
  }
})();

});
require.register("regularjs/src/util.js", function(exports, require, module){
require('./helper/shim.js');
var _  = module.exports;
var entities = require('./helper/entities.js');
var slice = [].slice;
var o2str = ({}).toString;
var win = typeof window !=='undefined'? window: global;


_.noop = function(){};
_.uid = (function(){
  var _uid=0;
  return function(){
    return _uid++;
  }
})();

_.varName = '_d_';
_.setName = '_p_';
_.ctxName = '_c_';

_.rWord = /^[\$\w]+$/;
_.rSimpleAccessor = /^[\$\w]+(\.[\$\w]+)*$/;

_.nextTick = typeof setImmediate === 'function'? 
  setImmediate.bind(win) : 
  function(callback) {
    setTimeout(callback, 0) 
  }



var prefix =  "var " + _.ctxName + "=context.$context||context;" + "var " + _.varName + "=context.data;";


_.host = "data";


_.slice = function(obj, start, end){
  var res = [];
  for(var i = start || 0, len = end || obj.length; i < len; i++){
    var item = obj[i];
    res.push(item)
  }
  return res;
}

_.typeOf = function (o) {
  return o == null ? String(o) : ({}).toString.call(o).slice(8, -1).toLowerCase();
}


_.extend = function( o1, o2, override ){
  if(_.typeOf(override) === 'array'){
   for(var i = 0, len = override.length; i < len; i++ ){
    var key = override[i];
    o1[key] = o2[key];
   } 
  }else{
    for(var i in o2){
      if( typeof o1[i] === "undefined" || override === true ){
        o1[i] = o2[i]
      }
    }
  }
  return o1;
}

_.makePredicate = function makePredicate(words, prefix) {
    if (typeof words === "string") {
        words = words.split(" ");
    }
    var f = "",
    cats = [];
    out: for (var i = 0; i < words.length; ++i) {
        for (var j = 0; j < cats.length; ++j){
          if (cats[j][0].length === words[i].length) {
              cats[j].push(words[i]);
              continue out;
          }
        }
        cats.push([words[i]]);
    }
    function compareTo(arr) {
        if (arr.length === 1) return f += "return str === '" + arr[0] + "';";
        f += "switch(str){";
        for (var i = 0; i < arr.length; ++i){
           f += "case '" + arr[i] + "':";
        }
        f += "return true}return false;";
    }

    // When there are more than three length categories, an outer
    // switch first dispatches on the lengths, to save on comparisons.
    if (cats.length > 3) {
        cats.sort(function(a, b) {
            return b.length - a.length;
        });
        f += "switch(str.length){";
        for (var i = 0; i < cats.length; ++i) {
            var cat = cats[i];
            f += "case " + cat[0].length + ":";
            compareTo(cat);
        }
        f += "}";

        // Otherwise, simply generate a flat `switch` statement.
    } else {
        compareTo(words);
    }
    return new Function("str", f);
}


_.trackErrorPos = (function (){
  // linebreak
  var lb = /\r\n|[\n\r\u2028\u2029]/g;
  function findLine(lines, pos){
    var tmpLen = 0;
    for(var i = 0,len = lines.length; i < len; i++){
      var lineLen = (lines[i] || "").length;
      if(tmpLen + lineLen > pos) return {num: i, line: lines[i], start: pos - tmpLen};
      // 1 is for the linebreak
      tmpLen = tmpLen + lineLen + 1;
    }
    
  }
  return function(input, pos){
    if(pos > input.length-1) pos = input.length-1;
    lb.lastIndex = 0;
    var lines = input.split(lb);
    var line = findLine(lines,pos);
    var len = line.line.length;

    var min = line.start - 10;
    if(min < 0) min = 0;

    var max = line.start + 10;
    if(max > len) max = len;

    var remain = line.line.slice(min, max);
    var prefix = (line.num+1) + "> " + (min > 0? "..." : "")
    var postfix = max < len ? "...": "";

    return prefix + remain + postfix + "\n" + new Array(line.start + prefix.length + 1).join(" ") + "^";
  }
})();


var ignoredRef = /\((\?\!|\?\:|\?\=)/g;
_.findSubCapture = function (regStr) {
  var left = 0,
    right = 0,
    len = regStr.length,
    ignored = regStr.match(ignoredRef); // ignored uncapture
  if(ignored) ignored = ignored.length
  else ignored = 0;
  for (; len--;) {
    var letter = regStr.charAt(len);
    if (len === 0 || regStr.charAt(len - 1) !== "\\" ) { 
      if (letter === "(") left++;
      if (letter === ")") right++;
    }
  }
  if (left !== right) throw "RegExp: "+ regStr + "'s bracket is not marched";
  else return left - ignored;
};


_.escapeRegExp = function( str){// Credit: XRegExp 0.6.1 (c) 2007-2008 Steven Levithan <http://stevenlevithan.com/regex/xregexp/> MIT License
  return str.replace(/[-[\]{}()*+?.\\^$|,#\s]/g, function(match){
    return '\\' + match;
  });
};


var rEntity = new RegExp("&(" + Object.keys(entities).join('|') + ');', 'gi');

_.convertEntity = function(chr){

  return ("" + chr).replace(rEntity, function(all, capture){
    return String.fromCharCode(entities[capture])
  });

}


// simple get accessor

_.createObject = function(o, props){
    function Foo() {}
    Foo.prototype = o;
    var res = new Foo;
    if(props) _.extend(res, props);
    return res;
}

_.createProto = function(fn, o){
    function Foo() { this.constructor = fn;}
    Foo.prototype = o;
    return (fn.prototype = new Foo());
}


/**
clone
*/
_.clone = function clone(obj){
    var type = _.typeOf(obj);
    if(type === 'array'){
      var cloned = [];
      for(var i=0,len = obj.length; i< len;i++){
        cloned[i] = obj[i]
      }
      return cloned;
    }
    if(type === 'object'){
      var cloned = {};
      for(var i in obj) if(obj.hasOwnProperty(i)){
        cloned[i] = obj[i];
      }
      return cloned;
    }
    return obj;
  }


_.equals = function(now, old){
  var type = _.typeOf(now);
  if(type === 'array'){
    var splices = ld(now, old||[]);
    return splices;
  }
  if(type === 'number' && typeof old === 'number'&& isNaN(now) && isNaN(old)) return true
  return now === old;
}


//Levenshtein_distance
//=================================================
//1. http://en.wikipedia.org/wiki/Levenshtein_distance
//2. github.com:polymer/observe-js

var ld = (function(){
  function equals(a,b){
    return a === b;
  }
  function ld(array1, array2){
    var n = array1.length;
    var m = array2.length;
    var matrix = [];
    for(var i = 0; i <= n; i++){
      matrix.push([i]);
    }
    for(var j=1;j<=m;j++){
      matrix[0][j]=j;
    }
    for(var i = 1; i <= n; i++){
      for(var j = 1; j <= m; j++){
        if(equals(array1[i-1], array2[j-1])){
          matrix[i][j] = matrix[i-1][j-1];
        }else{
          matrix[i][j] = Math.min(
            matrix[i-1][j]+1, //delete
            matrix[i][j-1]+1//add
            )
        }
      }
    }
    return matrix;
  }
  function whole(arr2, arr1) {
      var matrix = ld(arr1, arr2)
      var n = arr1.length;
      var i = n;
      var m = arr2.length;
      var j = m;
      var edits = [];
      var current = matrix[i][j];
      while(i>0 || j>0){
      // the last line
        if (i === 0) {
          edits.unshift(3);
          j--;
          continue;
        }
        // the last col
        if (j === 0) {
          edits.unshift(2);
          i--;
          continue;
        }
        var northWest = matrix[i - 1][j - 1];
        var west = matrix[i - 1][j];
        var north = matrix[i][j - 1];

        var min = Math.min(north, west, northWest);

        if (min === west) {
          edits.unshift(2); //delete
          i--;
          current = west;
        } else if (min === northWest ) {
          if (northWest === current) {
            edits.unshift(0); //no change
          } else {
            edits.unshift(1); //update
            current = northWest;
          }
          i--;
          j--;
        } else {
          edits.unshift(3); //add
          j--;
          current = north;
        }
      }
      var LEAVE = 0;
      var ADD = 3;
      var DELELE = 2;
      var UPDATE = 1;
      var n = 0;m=0;
      var steps = [];
      var step = {index: null, add:0, removed:[]};

      for(var i=0;i<edits.length;i++){
        if(edits[i] > 0 ){ // NOT LEAVE
          if(step.index === null){
            step.index = m;
          }
        } else { //LEAVE
          if(step.index != null){
            steps.push(step)
            step = {index: null, add:0, removed:[]};
          }
        }
        switch(edits[i]){
          case LEAVE:
            n++;
            m++;
            break;
          case ADD:
            step.add++;
            m++;
            break;
          case DELELE:
            step.removed.push(arr1[n])
            n++;
            break;
          case UPDATE:
            step.add++;
            step.removed.push(arr1[n])
            n++;
            m++;
            break;
        }
      }
      if(step.index != null){
        steps.push(step)
      }
      return steps
    }
    return whole;
  })();



_.throttle = function throttle(func, wait){
  var wait = wait || 100;
  var context, args, result;
  var timeout = null;
  var previous = 0;
  var later = function() {
    previous = +new Date;
    timeout = null;
    result = func.apply(context, args);
    context = args = null;
  };
  return function() {
    var now = + new Date;
    var remaining = wait - (now - previous);
    context = this;
    args = arguments;
    if (remaining <= 0 || remaining > wait) {
      clearTimeout(timeout);
      timeout = null;
      previous = now;
      result = func.apply(context, args);
      context = args = null;
    } else if (!timeout) {
      timeout = setTimeout(later, remaining);
    }
    return result;
  };
};

// hogan escape
// ==============
_.escape = (function(){
  var rAmp = /&/g,
      rLt = /</g,
      rGt = />/g,
      rApos = /\'/g,
      rQuot = /\"/g,
      hChars = /[&<>\"\']/;

  return function(str) {
    return hChars.test(str) ?
      str
        .replace(rAmp, '&amp;')
        .replace(rLt, '&lt;')
        .replace(rGt, '&gt;')
        .replace(rApos, '&#39;')
        .replace(rQuot, '&quot;') :
      str;
  }
})();

_.cache = function(max){
  max = max || 1000;
  var keys = [],
      cache = {};
  return {
    set: function(key, value) {
      if (keys.length > this.max) {
        cache[keys.shift()] = undefined;
      }
      // 
      if(cache[key] === undefined){
        keys.push(key);
      }
      cache[key] = value;
      return value;
    },
    get: function(key) {
      if (key === undefined) return cache;
      return cache[key];
    },
    max: max,
    len:function(){
      return keys.length;
    }
  };
}

// setup the raw Expression
_.touchExpression = function(expr){
  if(expr.type === 'expression'){
    if(!expr.get){
      expr.get = new Function("context", prefix + "return (" + expr.body + ")");
      expr.body = null;
      if(expr.setbody){
        expr.set = function(ctx, value){
          if(expr.setbody){
            expr.set = new Function('context', _.setName ,  prefix + expr.setbody);
            expr.setbody = null;
          }
          return expr.set(ctx, value);
        }
      }
    }
  }
  return expr;
}


// handle the same logic on component's `on-*` and element's `on-*`
// return the fire object
_.handleEvent = function(value, type ){
  var self = this, evaluate;
  if(value.type === 'expression'){ // if is expression, go evaluated way
    evaluate = value.get;
  }
  if(evaluate){
    return function fire(obj){
      self.data.$event = obj;
      var res = evaluate(self);
      if(res === false && obj && obj.preventDefault) obj.preventDefault();
      delete self.data.$event;
      self.$update();
    }
  }else{
    return function fire(){
      var args = slice.call(arguments)      
      args.unshift(value);
      self.$emit.apply(self.$context, args);
      self.$update();
    }
  }
}

// only call once
_.once = function(fn){
  var time = 0;
  return function(){
    if( time++ === 0) fn.apply(this, arguments);
  }
}








_.log = function(msg, type){
  if(typeof console !== "undefined")  console[type || "log"](msg);
}




//http://www.w3.org/html/wg/drafts/html/master/single-page.html#void-elements
_.isVoidTag = _.makePredicate("area base br col embed hr img input keygen link menuitem meta param source track wbr r-content");
_.isBooleanAttr = _.makePredicate('selected checked disabled readOnly required open autofocus controls autoplay compact loop defer multiple');

_.isFalse - function(){return false}
_.isTrue - function(){return true}


_.assert = function(test, msg){
  if(!test) throw msg;
}



_.defineProperty = function(){
  
}


});
require.register("regularjs/src/walkers.js", function(exports, require, module){
var node = require("./parser/node.js");
var dom = require("./dom.js");
var animate = require("./helper/animate.js");
var Group = require('./group.js');
var _ = require('./util');
var combine = require('./helper/combine.js');

var walkers = module.exports = {};

walkers.list = function(ast){

  var Regular = walkers.Regular;  
  var placeholder = document.createComment("Regular list"),
    namespace = this.__ns__;
  // proxy Component to implement list item, so the behaviar is similar with angular;
  var Section =  Regular.extend( { 
    template: ast.body, 
    $context: this.$context,
    // proxy the event to $context
    $on: this.$context.$on.bind(this.$context),
    $off: this.$context.$off.bind(this.$context),
    $emit: this.$context.$emit.bind(this.$context)
  });
  Regular._inheritConfig(Section, this.constructor);

  // var fragment = dom.fragment();
  // fragment.appendChild(placeholder);
  var self = this;
  var group = new Group();
  group.push(placeholder);
  var indexName = ast.variable + '_index';
  var variable = ast.variable;
  // group.push(placeholder);


  function update(newValue, splices){
    newValue = newValue || [];
    if(!splices || !splices.length) return;
    var cur = placeholder;
    var m = 0, len = newValue.length,
      mIndex = splices[0].index;

    for(var i = 0; i < splices.length; i++){ //init
      var splice = splices[i];
      var index = splice.index; // beacuse we use a comment for placeholder

      for(var k = m; k < index; k++){ // no change
        var sect = group.get( k + 1 );
        sect.data[indexName] = k;
      }
      for(var j = 0, jlen = splice.removed.length; j< jlen; j++){ //removed
        var removed = group.children.splice( index + 1, 1)[0];
        removed.destroy(true);
      }

      for(var o = index; o < index + splice.add; o++){ //add
        // prototype inherit
        var item = newValue[o];
        var data = _.createObject(self.data);
        data[indexName] = o;
        data[variable] = item;

        var section = new Section({data: data, $parent: self , namespace: namespace});

        // autolink
        var insert =  combine.last(group.get(o));
        // animate.inject(combine.node(section),insert,'after')
        if(insert.parentNode){
          animate.inject(combine.node(section),insert, 'after');
        }
        // insert.parentNode.insertBefore(combine.node(section), insert.nextSibling);
        group.children.splice( o + 1 , 0, section);
      }
      m = index + splice.add - splice.removed.length;
      m  = m < 0? 0 : m;

    }
    if(m < len){
      for(var i = m; i < len; i++){
        var pair = group.get(i + 1);
        pair.data[indexName] = i;
      }
    }
  }

  this.$watch(ast.sequence, update, { init: true });
  return group;
}

// {#include }
walkers.template = function(ast){
  var content = ast.content, compiled;
  var placeholder = document.createComment('inlcude');
  var compiled, namespace = this.__ns__;
  // var fragment = dom.fragment();
  // fragment.appendChild(placeholder);
  var group = new Group();
  group.push(placeholder);
  if(content){
    var self = this;
    this.$watch(content, function(value){
      if( compiled = group.get(1)){
        compiled.destroy(true); 
        group.children.pop();
      }
      group.push( compiled =  self.$compile(value, {record: true, namespace: namespace}) ); 
      if(placeholder.parentNode) animate.inject(combine.node(compiled), placeholder, 'before')
    }, {
      init: true
    });
  }
  return group;
};


// how to resolve this problem
var ii = 0;
walkers['if'] = function(ast, options){
  var self = this, consequent, alternate;
  if(options && options.element){ // attribute inteplation
    var update = function(nvalue){
      if(!!nvalue){
        if(alternate) combine.destroy(alternate)
        if(ast.consequent) consequent = self.$compile(ast.consequent, {record: true, element: options.element });
      }else{
        if(consequent) combine.destroy(consequent)
        if(ast.alternate) alternate = self.$compile(ast.alternate, {record: true, element: options.element});
      }
    }
    this.$watch(ast.test, update, { force: true });
    return {
      destroy: function(){
        if(consequent) combine.destroy(consequent);
        else if(alternate) combine.destroy(alternate);
      }
    }
  }


  var test, consequent, alternate, node;
  var placeholder = document.createComment("Regular if" + ii++);
  var group = new Group();
  group.push(placeholder);
  var preValue = null, namespace= this.__ns__;


  var update = function (nvalue, old){
    var value = !!nvalue;
    if(value === preValue) return;
    preValue = value;
    if(group.children[1]){
      group.children[1].destroy(true);
      group.children.pop();
    }
    if(value){ //true
      if(ast.consequent && ast.consequent.length){
        consequent = self.$compile( ast.consequent , {record:true, namespace: namespace })
        // placeholder.parentNode && placeholder.parentNode.insertBefore( node, placeholder );
        group.push(consequent);
        if(placeholder.parentNode){
          animate.inject(combine.node(consequent), placeholder, 'before');
        }
      }
    }else{ //false
      if(ast.alternate && ast.alternate.length){
        alternate = self.$compile(ast.alternate, {record:true, namespace: namespace});
        group.push(alternate);
        if(placeholder.parentNode){
          animate.inject(combine.node(alternate), placeholder, 'before');
        }
      }
    }
  }
  this.$watch(ast.test, update, {force: true, init: true});

  return group;
}


walkers.expression = function(ast){
  var node = document.createTextNode("");
  this.$watch(ast, function(newval){
    dom.text(node, "" + (newval == null? "": "" + newval) );
  })
  return node;
}
walkers.text = function(ast){
  var node = document.createTextNode(_.convertEntity(ast.text));
  return node;
}



var eventReg = /^on-(.+)$/

/**
 * walkers element (contains component)
 */
walkers.element = function(ast){
  var attrs = ast.attrs, 
    component, self = this,
    Constructor=this.constructor,
    children = ast.children,
    namespace = this.__ns__, ref, group, 
    Component = Constructor.component(ast.tag);


  if(ast.tag === 'svg') var namespace = "svg";


  if(children && children.length){
    group = this.$compile(children, {namespace: namespace });
  }


  if(Component){
    var data = {},events;
    for(var i = 0, len = attrs.length; i < len; i++){
      var attr = attrs[i];
      var value = attr.value||"";
      _.touchExpression(value);
      var name = attr.name;
      var etest = name.match(eventReg);
      // bind event proxy
      if(etest){
        events = events || {};
        events[etest[1]] = _.handleEvent.call(this, value, etest[1]);
        continue;
      }

      if(value.type !== 'expression'){
        data[attr.name] = value;
      }else{
        data[attr.name] = value.get(self); 
      }
      if( attr.name === 'ref'  && value != null){
        ref = value.type === 'expression'? value.get(self): value;
      }

    }

    var $body;
    if(ast.children) $body = ast.children;
    var component = new Component({data: data, events: events, $body: $body, $parent: this, namespace: namespace});
    if(ref &&  self.$context.$refs) self.$context.$refs[ref] = component;
    for(var i = 0, len = attrs.length; i < len; i++){
      var attr = attrs[i];
      var value = attr.value||"";
      if(value.type === 'expression' && attr.name.indexOf('on-')===-1){
        this.$watch(value, component.$update.bind(component, attr.name))
        if(value.set) component.$watch(attr.name, self.$update.bind(self, value))
      }
    }
    if(ref){
      component.$on('destroy', function(){
        if(self.$context.$refs) self.$context.$refs[ref] = null;
      })
    }
    return component;
  }
  else if(ast.tag === 'r-content' && this.$body){
    return this.$body;
  }

  var element = dom.create(ast.tag, namespace, attrs);
  // context element

  var child;

  if(group && !_.isVoidTag(ast.tag)){
    dom.inject( combine.node(group) , element)
  }

  // sort before
  attrs.sort(function(a1, a2){
    var d1 = Constructor.directive(a1.name),
      d2 = Constructor.directive(a2.name);
    if(d1 && d2) return (d2.priority || 1) - (d1.priority || 1);
    if(d1) return 1;
    if(d2) return -1;
    if(a2.name === "type") return 1;
    return -1;
  })
  // may distinct with if else
  var destroies = walkAttributes.call(this, attrs, element, destroies);



  var res  = {
    type: "element",
    group: group,
    node: function(){
      return element;
    },
    last: function(){
      return element;
    },
    destroy: function(first){
      if( first ){
        animate.remove( element, group? group.destroy.bind( group ): _.noop );
      }else if(group) {
        group.destroy();
      }
      // destroy ref
      if( destroies.length ) {
        destroies.forEach(function( destroy ){
          if( destroy ){
            if( typeof destroy.destroy === 'function' ){
              destroy.destroy()
            }else{
              destroy();
            }
          }
        })
      }
    }
  }
  return res;
}

function walkAttributes(attrs, element){
  var bindings = []
  for(var i = 0, len = attrs.length; i < len; i++){
    var binding = this._walk(attrs[i], {element: element, fromElement: true, attrs: attrs})
    if(binding) bindings.push(binding);
  }
  return bindings;
}

walkers.attribute = function(ast ,options){
  var attr = ast;
  var Component = this.constructor;
  var self = this;
  var element = options.element;
  var name = attr.name,
    value = attr.value || "", directive = Component.directive(name);

  _.touchExpression(value);


  if(directive && directive.link){
    var binding = directive.link.call(self, element, value, name, options.attrs);
    if(typeof binding === 'function') binding = {destroy: binding}; 
    return binding;
  }else{
    if( name === 'ref'  && value != null && options.fromElement){
      var ref = value.type === 'expression'? value.get(self): value;
      var refs = this.$context.$refs;
      if(refs){
        refs[ref] = element
        return {
          destroy: function(){
            refs[ref] = null;
          }
        }
      }
    }
    if(value.type === 'expression' ){

      this.$watch(value, function(nvalue, old){
        dom.attr(element, name, nvalue);
      }, {init: true});
    }else{
      if(_.isBooleanAttr(name)){
        dom.attr(element, name, true);
      }else{
        dom.attr(element, name, value);
      }
    }
    if(!options.fromElement){
      return {
        destroy: function(){
          dom.attr(element, name, null);
        }
      }
    }
  }

}


});
require.register("regularjs/src/env.js", function(exports, require, module){
// some fixture test;
// ---------------
var _ = require('./util');
exports.svg = (function(){
  return typeof document !== "undefined" && document.implementation.hasFeature( "http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1" );
})();


exports.transition = (function(){
  
})();

// whether have component in initializing
exports.exprCache = _.cache(1000);
exports.isRunning = false;

});
require.register("regularjs/src/index.js", function(exports, require, module){
module.exports = require("./Regular.js");

require("./directive/base.js");
require("./directive/animation.js");
require("./module/timeout.js");

module.exports.dom = require("./dom.js");
module.exports.util = require("./util.js");
module.exports.env = require("./env.js");


});
require.register("regularjs/src/dom.js", function(exports, require, module){

// thanks for angular && mootools for some concise&cross-platform  implemention
// =====================================

// The MIT License
// Copyright (c) 2010-2014 Google, Inc. http://angularjs.org

// ---
// license: MIT-style license. http://mootools.net

var dom = module.exports;
var env = require("./env.js");
var _ = require("./util");
var tNode = document.createElement('div')
var addEvent, removeEvent;
var noop = function(){}

var namespaces = {
  html: "http://www.w3.org/1999/xhtml",
  svg: "http://www.w3.org/2000/svg"
}

dom.body = document.body;

dom.doc = document;

// camelCase
function camelCase(str){
  return ("" + str).replace(/-\D/g, function(match){
    return match.charAt(1).toUpperCase();
  });
}


dom.tNode = tNode;

if(tNode.addEventListener){
  addEvent = function(node, type, fn) {
    node.addEventListener(type, fn, false);
  }
  removeEvent = function(node, type, fn) {
    node.removeEventListener(type, fn, false) 
  }
}else{
  addEvent = function(node, type, fn) {
    node.attachEvent('on' + type, fn);
  }
  removeEvent = function(node, type, fn) {
    node.detachEvent('on' + type, fn); 
  }
}


dom.msie = parseInt((/msie (\d+)/.exec(navigator.userAgent.toLowerCase()) || [])[1]);
if (isNaN(dom.msie)) {
  dom.msie = parseInt((/trident\/.*; rv:(\d+)/.exec(navigator.userAgent.toLowerCase()) || [])[1]);
}

dom.find = function(sl){
  if(document.querySelector) {
    try{
      return document.querySelector(sl);
    }catch(e){

    }
  }
  if(sl.indexOf('#')!==-1) return document.getElementById( sl.slice(1) );
}

dom.inject = function(node, refer, position){

  position = position || 'bottom';

  if(Array.isArray(node)){
    var tmp = node;
    node = dom.fragment();
    for(var i = 0,len = tmp.length; i < len ;i++){
      node.appendChild(tmp[i]);
    }
  }

  var firstChild, next;
  switch(position){
    case 'bottom':
      refer.appendChild( node );
      break;
    case 'top':
      if( firstChild = refer.firstChild ){
        refer.insertBefore( node, refer.firstChild );
      }else{
        refer.appendChild( node );
      }
      break;
    case 'after':
      if( next = refer.nextSibling ){
        next.parentNode.insertBefore( node, next );
      }else{
        refer.parentNode.appendChild( node );
      }
      break;
    case 'before':
      refer.parentNode.insertBefore( node, refer );
  }
}


dom.id = function(id){
  return document.getElementById(id);
}

// createElement 
dom.create = function(type, ns, attrs){
  if(ns === 'svg'){
    if(!env.svg) throw Error('the env need svg support')
    ns = namespaces.svg;
  }
  return !ns? document.createElement(type): document.createElementNS(ns, type);
}

// documentFragment
dom.fragment = function(){
  return document.createDocumentFragment();
}



var specialAttr = {
  'class': function(node, value){
    ('className' in node && (node.namespaceURI === namespaces.html || !node.namespaceURI)) ?
      node.className = (value || '') : node.setAttribute('class', value);
  },
  'for': function(node, value){
    ('htmlFor' in node) ? node.htmlFor = value : node.setAttribute('for', value);
  },
  'style': function(node, value){
    (node.style) ? node.style.cssText = value : node.setAttribute('style', value);
  },
  'value': function(node, value){
    node.value = (value != null) ? value : '';
  }
}


// attribute Setter & Getter
dom.attr = function(node, name, value){
  if (_.isBooleanAttr(name)) {
    if (typeof value !== 'undefined') {
      if (!!value) {
        node[name] = true;
        node.setAttribute(name, name);
        // lt ie7 . the javascript checked setting is in valid
        //http://bytes.com/topic/javascript/insights/799167-browser-quirk-dynamically-appended-checked-checkbox-does-not-appear-checked-ie
        if(dom.msie && dom.msie <=7 ) node.defaultChecked = true
      } else {
        node[name] = false;
        node.removeAttribute(name);
      }
    } else {
      return (node[name] ||
               (node.attributes.getNamedItem(name)|| noop).specified) ? name : undefined;
    }
  } else if (typeof (value) !== 'undefined') {
    // if in specialAttr;
    if(specialAttr[name]) specialAttr[name](node, value);
    else if(value === null) node.removeAttribute(name)
    else node.setAttribute(name, value);
  } else if (node.getAttribute) {
    // the extra argument "2" is to get the right thing for a.href in IE, see jQuery code
    // some elements (e.g. Document) don't have get attribute, so return undefined
    var ret = node.getAttribute(name, 2);
    // normalize non-existing attributes to undefined (as jQuery)
    return ret === null ? undefined : ret;
  }
}


dom.on = function(node, type, handler){
  var types = type.split(' ');
  handler.real = function(ev){
    handler.call(node, new Event(ev));
  }
  types.forEach(function(type){
    type = fixEventName(node, type);
    addEvent(node, type, handler.real);
  });
}
dom.off = function(node, type, handler){
  var types = type.split(' ');
  handler = handler.real || handler;
  types.forEach(function(type){
    type = fixEventName(node, type);
    removeEvent(node, type, handler);
  })
}


dom.text = (function (){
  var map = {};
  if (dom.msie && dom.msie < 9) {
    map[1] = 'innerText';    
    map[3] = 'nodeValue';    
  } else {
    map[1] = map[3] = 'textContent';
  }
  
  return function (node, value) {
    var textProp = map[node.nodeType];
    if (value == null) {
      return textProp ? node[textProp] : '';
    }
    node[textProp] = value;
  }
})();


dom.html = function( node, html ){
  if(typeof html === "undefined"){
    return node.innerHTML;
  }else{
    node.innerHTML = html;
  }
}

dom.replace = function(node, replaced){
  if(replaced.parentNode) replaced.parentNode.replaceChild(node, replaced);
}

dom.remove = function(node){
  if(node.parentNode) node.parentNode.removeChild(node);
}

// css Settle & Getter from angular
// =================================
// it isnt computed style 
dom.css = function(node, name, value){
  if( _.typeOf(name) === "object" ){
    for(var i in name){
      if( name.hasOwnProperty(i) ){
        dom.css( node, i, name[i] );
      }
    }
    return;
  }
  if ( typeof value !== "undefined" ) {

    name = camelCase(name);
    if(name) node.style[name] = value;

  } else {

    var val;
    if (dom.msie <= 8) {
      // this is some IE specific weirdness that jQuery 1.6.4 does not sure why
      val = node.currentStyle && node.currentStyle[name];
      if (val === '') val = 'auto';
    }
    val = val || node.style[name];
    if (dom.msie <= 8) {
      val = val === '' ? undefined : val;
    }
    return  val;
  }
}

dom.addClass = function(node, className){
  var current = node.className || "";
  if ((" " + current + " ").indexOf(" " + className + " ") === -1) {
    node.className = current? ( current + " " + className ) : className;
  }
}

dom.delClass = function(node, className){
  var current = node.className || "";
  node.className = (" " + current + " ").replace(" " + className + " ", " ").trim();
}

dom.hasClass = function(node, className){
  var current = node.className || "";
  return (" " + current + " ").indexOf(" " + className + " ") !== -1;
}



// simple Event wrap

//http://stackoverflow.com/questions/11068196/ie8-ie7-onchange-event-is-emited-only-after-repeated-selection
function fixEventName(elem, name){
  return (name === 'change'  &&  dom.msie < 9 && 
      (elem && elem.tagName && elem.tagName.toLowerCase()==='input' && 
        (elem.type === 'checkbox' || elem.type === 'radio')
      )
    )? 'click': name;
}

var rMouseEvent = /^(?:click|dblclick|contextmenu|DOMMouseScroll|mouse(?:\w+))$/
var doc = document;
doc = (!doc.compatMode || doc.compatMode === 'CSS1Compat') ? doc.documentElement : doc.body;
function Event(ev){
  ev = ev || window.event;
  if(ev._fixed) return ev;
  this.event = ev;
  this.target = ev.target || ev.srcElement;

  var type = this.type = ev.type;
  var button = this.button = ev.button;

  // if is mouse event patch pageX
  if(rMouseEvent.test(type)){ //fix pageX
    this.pageX = (ev.pageX != null) ? ev.pageX : ev.clientX + doc.scrollLeft;
    this.pageY = (ev.pageX != null) ? ev.pageY : ev.clientY + doc.scrollTop;
    if (type === 'mouseover' || type === 'mouseout'){// fix relatedTarget
      var related = ev.relatedTarget || ev[(type === 'mouseover' ? 'from' : 'to') + 'Element'];
      while (related && related.nodeType === 3) related = related.parentNode;
      this.relatedTarget = related;
    }
  }
  // if is mousescroll
  if (type === 'DOMMouseScroll' || type === 'mousewheel'){
    // ff ev.detail: 3    other ev.wheelDelta: -120
    this.wheelDelta = (ev.wheelDelta) ? ev.wheelDelta / 120 : -(ev.detail || 0) / 3;
  }
  
  // fix which
  this.which = ev.which || ev.keyCode;
  if( !this.which && button !== undefined){
    // http://api.jquery.com/event.which/ use which
    this.which = ( button & 1 ? 1 : ( button & 2 ? 3 : ( button & 4 ? 2 : 0 ) ) );
  }
  this._fixed = true;
}

_.extend(Event.prototype, {
  immediateStop: _.isFalse,
  stop: function(){
    this.preventDefault().stopPropagation();
  },
  preventDefault: function(){
    if (this.event.preventDefault) this.event.preventDefault();
    else this.event.returnValue = false;
    return this;
  },
  stopPropagation: function(){
    if (this.event.stopPropagation) this.event.stopPropagation();
    else this.event.cancelBubble = true;
    return this;
  },
  stopImmediatePropagation: function(){
    if(this.event.stopImmediatePropagation) this.event.stopImmediatePropagation();
  }
})


dom.nextFrame = (function(){
    var request = window.requestAnimationFrame ||
                  window.webkitRequestAnimationFrame ||
                  window.mozRequestAnimationFrame|| 
                  function(callback){
                    setTimeout(callback, 16)
                  }

    var cancel = window.cancelAnimationFrame ||
                 window.webkitCancelAnimationFrame ||
                 window.mozCancelAnimationFrame ||
                 window.webkitCancelRequestAnimationFrame ||
                 function(tid){
                    clearTimeout(tid)
                 }
  
  return function(callback){
    var id = request(callback);
    return function(){ cancel(id); }
  }
})();

// 3ks for angular's raf  service
var k;
dom.nextReflow = function(callback){
  dom.nextFrame(function(){
    k = document.body.offsetWidth;
    callback();
  })
}




});
require.register("regularjs/src/group.js", function(exports, require, module){
var _ = require('./util');
var combine = require('./helper/combine')

function Group(list){
  this.children = list || [];
}


_.extend(Group.prototype, {
  destroy: function(first){
    combine.destroy(this.children, first);
    if(this.ondestroy) this.ondestroy();
    this.children = null;
  },
  get: function(i){
    return this.children[i]
  },
  push: function(item){
    this.children.push( item );
  }

})



module.exports = Group;



});
require.register("regularjs/src/config.js", function(exports, require, module){

module.exports = {
'BEGIN': '{',
'END': '}'
}
});
require.register("regularjs/src/parser/Lexer.js", function(exports, require, module){
var _ = require("../util.js");
var config = require("../config.js");

// some custom tag  will conflict with the Lexer progress
var conflictTag = {"}": "{", "]": "["}, map1, map2;
// some macro for lexer
var macro = {
  'NAME': /(?:[:_A-Za-z][-\.:_0-9A-Za-z]*)/,
  'IDENT': /[\$_A-Za-z][_0-9A-Za-z\$]*/,
  'SPACE': /[\r\n\f ]/
}


var test = /a|(b)/.exec("a");
var testSubCapure = test && test[1] === undefined? 
  function(str){ return str !== undefined }
  :function(str){return !!str};

function wrapHander(handler){
  return function(all){
    return {type: handler, value: all }
  }
}

function Lexer(input, opts){
  if(conflictTag[config.END]){
    this.markStart = conflictTag[config.END];
    this.markEnd = config.END;
  }

  this.input = (input||"").trim();
  this.opts = opts || {};
  this.map = this.opts.mode !== 2?  map1: map2;
  this.states = ["INIT"];
  if(opts && opts.expression){
     this.states.push("JST");
     this.expression = true;
  }
}

var lo = Lexer.prototype


lo.lex = function(str){
  str = (str || this.input).trim();
  var tokens = [], split, test,mlen, token, state;
  this.input = str, 
  this.marks = 0;
  // init the pos index
  this.index=0;
  var i = 0;
  while(str){
    i++
    state = this.state();
    split = this.map[state] 
    test = split.TRUNK.exec(str);
    if(!test){
      this.error('Unrecoginized Token');
    }
    mlen = test[0].length;
    str = str.slice(mlen)
    token = this._process.call(this, test, split, str)
    if(token) tokens.push(token)
    this.index += mlen;
    // if(state == 'TAG' || state == 'JST') str = this.skipspace(str);
  }

  tokens.push({type: 'EOF'});

  return tokens;
}

lo.error = function(msg){
  throw "Parse Error: " + msg +  ':\n' + _.trackErrorPos(this.input, this.index);
}

lo._process = function(args, split,str){
  // console.log(args.join(","), this.state())
  var links = split.links, marched = false, token;

  for(var len = links.length, i=0;i<len ;i++){
    var link = links[i],
      handler = link[2],
      index = link[0];
    // if(args[6] === '>' && index === 6) console.log('haha')
    if(testSubCapure(args[index])) {
      marched = true;
      if(handler){
        token = handler.apply(this, args.slice(index, index + link[1]))
        if(token)  token.pos = this.index;
      }
      break;
    }
  }
  if(!marched){ // in ie lt8 . sub capture is "" but ont 
    switch(str.charAt(0)){
      case "<":
        this.enter("TAG");
        break;
      default:
        this.enter("JST");
        break;
    }
  }
  return token;
}
lo.enter = function(state){
  this.states.push(state)
  return this;
}

lo.state = function(){
  var states = this.states;
  return states[states.length-1];
}

lo.leave = function(state){
  var states = this.states;
  if(!state || states[states.length-1] === state) states.pop()
}


Lexer.setup = function(){
  macro.END = config.END;
  macro.BEGIN = config.BEGIN;
  //
  map1 = genMap([
    // INIT
    rules.ENTER_JST,
    rules.ENTER_TAG,
    rules.TEXT,

    //TAG
    rules.TAG_NAME,
    rules.TAG_OPEN,
    rules.TAG_CLOSE,
    rules.TAG_PUNCHOR,
    rules.TAG_ENTER_JST,
    rules.TAG_UNQ_VALUE,
    rules.TAG_STRING,
    rules.TAG_SPACE,
    rules.TAG_COMMENT,

    // JST
    rules.JST_OPEN,
    rules.JST_CLOSE,
    rules.JST_COMMENT,
    rules.JST_EXPR_OPEN,
    rules.JST_IDENT,
    rules.JST_SPACE,
    rules.JST_LEAVE,
    rules.JST_NUMBER,
    rules.JST_PUNCHOR,
    rules.JST_STRING,
    rules.JST_COMMENT
    ])

  // ignored the tag-relative token
  map2 = genMap([
    // INIT no < restrict
    rules.ENTER_JST2,
    rules.TEXT,
    // JST
    rules.JST_COMMENT,
    rules.JST_OPEN,
    rules.JST_CLOSE,
    rules.JST_EXPR_OPEN,
    rules.JST_IDENT,
    rules.JST_SPACE,
    rules.JST_LEAVE,
    rules.JST_NUMBER,
    rules.JST_PUNCHOR,
    rules.JST_STRING,
    rules.JST_COMMENT
    ])
}


function genMap(rules){
  var rule, map = {}, sign;
  for(var i = 0, len = rules.length; i < len ; i++){
    rule = rules[i];
    sign = rule[2] || 'INIT';
    ( map[sign] || (map[sign] = {rules:[], links:[]}) ).rules.push(rule);
  }
  return setup(map);
}

function setup(map){
  var split, rules, trunks, handler, reg, retain, rule;
  function replaceFn(all, one){
    return typeof macro[one] === 'string'? 
      _.escapeRegExp(macro[one]) 
      : String(macro[one]).slice(1,-1);
  }

  for(var i in map){

    split = map[i];
    split.curIndex = 1;
    rules = split.rules;
    trunks = [];

    for(var j = 0,len = rules.length; j<len; j++){
      rule = rules[j]; 
      reg = rule[0];
      handler = rule[1];

      if(typeof handler === 'string'){
        handler = wrapHander(handler);
      }
      if(_.typeOf(reg) === 'regexp') reg = reg.toString().slice(1, -1);

      reg = reg.replace(/\{(\w+)\}/g, replaceFn)
      retain = _.findSubCapture(reg) + 1; 
      split.links.push([split.curIndex, retain, handler]); 
      split.curIndex += retain;
      trunks.push(reg);
    }
    split.TRUNK = new RegExp("^(?:(" + trunks.join(")|(") + "))")
  }
  return map;
}

var rules = {

  // 1. INIT
  // ---------------

  // mode1's JST ENTER RULE
  ENTER_JST: [/[^\x00<]*?(?={BEGIN})/, function(all){
    this.enter('JST');
    if(all) return {type: 'TEXT', value: all}
  }],

  // mode2's JST ENTER RULE
  ENTER_JST2: [/[^\x00]*?(?={BEGIN})/, function(all){
    this.enter('JST');
    if(all) return {type: 'TEXT', value: all}
  }],

  ENTER_TAG: [/[^\x00<>]*?(?=<)/, function(all){ 
    this.enter('TAG');
    if(all) return {type: 'TEXT', value: all}
  }],

  TEXT: [/[^\x00]+/, 'TEXT'],

  // 2. TAG
  // --------------------
  TAG_NAME: [/{NAME}/, 'NAME', 'TAG'],
  TAG_UNQ_VALUE: [/[^\{}&"'=><`\r\n\f ]+/, 'UNQ', 'TAG'],

  TAG_OPEN: [/<({NAME})\s*/, function(all, one){
    return {type: 'TAG_OPEN', value: one}
  }, 'TAG'],
  TAG_CLOSE: [/<\/({NAME})[\r\n\f ]*>/, function(all, one){
    this.leave();
    return {type: 'TAG_CLOSE', value: one }
  }, 'TAG'],

    // mode2's JST ENTER RULE
  TAG_ENTER_JST: [/(?={BEGIN})/, function(){
    this.enter('JST');
  }, 'TAG'],


  TAG_PUNCHOR: [/[\>\/=&]/, function(all){
    if(all === '>') this.leave();
    return {type: all, value: all }
  }, 'TAG'],
  TAG_STRING:  [ /'([^']*)'|"([^"]*)"/, function(all, one, two){ //"'
    var value = one || two || "";

    return {type: 'STRING', value: value}
  }, 'TAG'],

  TAG_SPACE: [/{SPACE}+/, null, 'TAG'],
  TAG_COMMENT: [/<\!--([^\x00]*?)--\>/, null ,'TAG'],

  // 3. JST
  // -------------------

  JST_OPEN: ['{BEGIN}#{SPACE}*({IDENT})', function(all, name){
    return {
      type: 'OPEN',
      value: name
    }
  }, 'JST'],
  JST_LEAVE: [/{END}/, function(all){
    if(this.markEnd === all && this.expression) return {type: this.markEnd, value: this.markEnd};
    if(!this.markEnd || !this.marks ){
      this.firstEnterStart = false;
      this.leave('JST');
      return {type: 'END'}
    }else{
      this.marks--;
      return {type: this.markEnd, value: this.markEnd}
    }
  }, 'JST'],
  JST_CLOSE: [/{BEGIN}\s*\/({IDENT})\s*{END}/, function(all, one){
    this.leave('JST');
    return {
      type: 'CLOSE',
      value: one
    }
  }, 'JST'],
  JST_COMMENT: [/{BEGIN}\!([^\x00]*?)\!{END}/, function(){
    this.leave();
  }, 'JST'],
  JST_EXPR_OPEN: ['{BEGIN}',function(all, one){
    if(all === this.markStart){
      if(this.expression) return { type: this.markStart, value: this.markStart };
      if(this.firstEnterStart || this.marks){
        this.marks++
        this.firstEnterStart = false;
        return { type: this.markStart, value: this.markStart };
      }else{
        this.firstEnterStart = true;
      }
    }
    return {
      type: 'EXPR_OPEN',
      escape: false
    }

  }, 'JST'],
  JST_IDENT: ['{IDENT}', 'IDENT', 'JST'],
  JST_SPACE: [/[ \r\n\f]+/, null, 'JST'],
  JST_PUNCHOR: [/[=!]?==|[-=><+*\/%\!]?\=|\|\||&&|\@\(|\.\.|[<\>\[\]\(\)\-\|\{}\+\*\/%?:\.!,]/, function(all){
    return { type: all, value: all }
  },'JST'],

  JST_STRING:  [ /'([^']*)'|"([^"]*)"/, function(all, one, two){ //"'
    return {type: 'STRING', value: one || two || ""}
  }, 'JST'],
  JST_NUMBER: [/(?:[0-9]*\.[0-9]+|[0-9]+)(e\d+)?/, function(all){
    return {type: 'NUMBER', value: parseFloat(all, 10)};
  }, 'JST']
}


// setup when first config
Lexer.setup();



module.exports = Lexer;

});
require.register("regularjs/src/parser/node.js", function(exports, require, module){
module.exports = {
  element: function(name, attrs, children){
    return {
      type: 'element',
      tag: name,
      attrs: attrs,
      children: children
    }
  },
  attribute: function(name, value){
    return {
      type: 'attribute',
      name: name,
      value: value
    }
  },
  "if": function(test, consequent, alternate){
    return {
      type: 'if',
      test: test,
      consequent: consequent,
      alternate: alternate
    }
  },
  list: function(sequence, variable, body){
    return {
      type: 'list',
      sequence: sequence,
      variable: variable,
      body: body
    }
  },
  expression: function( body, setbody, constant ){
    return {
      type: "expression",
      body: body,
      constant: constant || false,
      setbody: setbody || false
    }
  },
  text: function(text){
    return {
      type: "text",
      text: text
    }
  },
  template: function(template){
    return {
      type: 'template',
      content: template
    }
  }
}

});
require.register("regularjs/src/parser/Parser.js", function(exports, require, module){
var _ = require("../util.js");

var config = require("../config.js");
var node = require("./node.js");
var Lexer = require("./Lexer.js");
var varName = _.varName;
var ctxName = _.ctxName;
var isPath = _.makePredicate("STRING IDENT NUMBER");
var isKeyWord = _.makePredicate("true false undefined null this Array Date JSON Math NaN RegExp decodeURI decodeURIComponent encodeURI encodeURIComponent parseFloat parseInt Object");




function Parser(input, opts){
  opts = opts || {};

  this.input = input;
  this.tokens = new Lexer(input, opts).lex();
  this.pos = 0;
  this.noComputed =  opts.noComputed;
  this.length = this.tokens.length;
}


var op = Parser.prototype;


op.parse = function(){
  this.pos = 0;
  var res= this.program();
  if(this.ll().type === 'TAG_CLOSE'){
    this.error("You may got a unclosed Tag")
  }
  return res;
}

op.ll =  function(k){
  k = k || 1;
  if(k < 0) k = k + 1;
  var pos = this.pos + k - 1;
  if(pos > this.length - 1){
      return this.tokens[this.length-1];
  }
  return this.tokens[pos];
}
  // lookahead
op.la = function(k){
  return (this.ll(k) || '').type;
}

op.match = function(type, value){
  var ll;
  if(!(ll = this.eat(type, value))){
    ll  = this.ll();
    this.error('expect [' + type + (value == null? '':':'+ value) + ']" -> got "[' + ll.type + (value==null? '':':'+ll.value) + ']', ll.pos)
  }else{
    return ll;
  }
}

op.error = function(msg, pos){
  msg =  "Parse Error: " + msg +  ':\n' + _.trackErrorPos(this.input, typeof pos === 'number'? pos: this.ll().pos||0);
  throw new Error(msg);
}

op.next = function(k){
  k = k || 1;
  this.pos += k;
}
op.eat = function(type, value){
  var ll = this.ll();
  if(typeof type !== 'string'){
    for(var len = type.length ; len--;){
      if(ll.type === type[len]) {
        this.next();
        return ll;
      }
    }
  }else{
    if( ll.type === type && (typeof value === 'undefined' || ll.value === value) ){
       this.next();
       return ll;
    }
  }
  return false;
}

// program
//  :EOF
//  | (statement)* EOF
op.program = function(){
  var statements = [],  ll = this.ll();
  while(ll.type !== 'EOF' && ll.type !=='TAG_CLOSE'){

    statements.push(this.statement());
    ll = this.ll();
  }
  // if(ll.type === 'TAG_CLOSE') this.error("You may have unmatched Tag")
  return statements;
}

// statement
//  : xml
//  | jst
//  | text
op.statement = function(){
  var ll = this.ll();
  switch(ll.type){
    case 'NAME':
    case 'TEXT':
      var text = ll.value;
      this.next();
      while(ll = this.eat(['NAME', 'TEXT'])){
        text += ll.value;
      }
      return node.text(text);
    case 'TAG_OPEN':
      return this.xml();
    case 'OPEN': 
      return this.directive();
    case 'EXPR_OPEN':
      return this.interplation();
    case 'PART_OPEN':
      return this.template();
    default:
      this.error('Unexpected token: '+ this.la())
  }
}

// xml 
// stag statement* TAG_CLOSE?(if self-closed tag)
op.xml = function(){
  var name, attrs, children, selfClosed;
  name = this.match('TAG_OPEN').value;
  attrs = this.attrs();
  selfClosed = this.eat('/')
  this.match('>');
  if( !selfClosed && !_.isVoidTag(name) ){
    children = this.program();
    if(!this.eat('TAG_CLOSE', name)) this.error('expect </'+name+'> got'+ 'no matched closeTag')
  }
  return node.element(name, attrs, children);
}

// xentity
//  -rule(wrap attribute)
//  -attribute
//
// __example__
//  name = 1 |  
//  ng-hide |
//  on-click={{}} | 
//  {{#if name}}on-click={{xx}}{{#else}}on-tap={{}}{{/if}}

op.xentity = function(ll){
  var name = ll.value, value;
  if(ll.type === 'NAME'){
    if( this.eat("=") ) value = this.attvalue();
    return node.attribute( name, value );
  }else{
    if( name !== 'if') this.error("current version. ONLY RULE #if #else #elseif is valid in tag, the rule #" + name + ' is invalid');
    return this['if'](true);
  }

}

// stag     ::=    '<' Name (S attr)* S? '>'  
// attr    ::=     Name Eq attvalue
op.attrs = function(isAttribute){
  var eat
  if(!isAttribute){
    eat = ["NAME", "OPEN"]
  }else{
    eat = ["NAME"]
  }

  var attrs = [], ll;
  while (ll = this.eat(eat)){
    attrs.push(this.xentity( ll ))
  }
  return attrs;
}

// attvalue
//  : STRING  
//  | NAME
op.attvalue = function(){
  var ll = this.ll();
  switch(ll.type){
    case "NAME":
    case "UNQ":
    case "STRING":
      this.next();
      var value = ll.value;
      if(~value.indexOf(config.BEGIN) && ~value.indexOf(config.END)){
        var constant = true;
        var parsed = new Parser(value, { mode: 2 }).parse();
        if(parsed.length === 1 && parsed[0].type === 'expression') return parsed[0];
        var body = [];
        parsed.forEach(function(item){
          if(!item.constant) constant=false;
          // silent the mutiple inteplation
            body.push(item.body || "'" + item.text + "'");        
        });
        body = "[" + body.join(",") + "].join('')";
        value = node.expression(body, null, constant);
      }
      return value;
    case "EXPR_OPEN":
      return this.interplation();
    default:
      this.error('Unexpected token: '+ this.la())
  }
}


// {{#}}
op.directive = function(){
  var name = this.ll().value;
  this.next();
  if(typeof this[name] === 'function'){
    return this[name]()
  }else{
    this.error('Undefined directive['+ name +']');
  }
}

// {{}}
op.interplation = function(){
  this.match('EXPR_OPEN');
  var res = this.expression(true);
  this.match('END');
  return res;
}

// {{~}}
op.include = function(){
  var content = this.expression();
  this.match('END');
  return node.template(content);
}

// {{#if}}
op["if"] = function(tag){
  var test = this.expression();
  var consequent = [], alternate=[];

  var container = consequent;
  var statement = !tag? "statement" : "attrs";

  this.match('END');

  var ll, close;
  while( ! (close = this.eat('CLOSE')) ){
    ll = this.ll();
    if( ll.type === 'OPEN' ){
      switch( ll.value ){
        case 'else':
          container = alternate;
          this.next();
          this.match( 'END' );
          break;
        case 'elseif':
          this.next();
          alternate.push( this["if"](tag) );
          return node['if']( test, consequent, alternate );
        default:
          container.push( this[statement](true) );
      }
    }else{
      container.push(this[statement](true));
    }
  }
  // if statement not matched
  if(close.value !== "if") this.error('Unmatched if directive')
  return node["if"](test, consequent, alternate);
}


// @mark   mustache syntax have natrure dis, canot with expression
// {{#list}}
op.list = function(){
  // sequence can be a list or hash
  var sequence = this.expression(), variable, ll;
  var consequent = [], alternate=[];
  var container = consequent;

  this.match('IDENT', 'as');

  variable = this.match('IDENT').value;

  this.match('END');

  while( !(ll = this.eat('CLOSE')) ){
    if(this.eat('OPEN', 'else')){
      container =  alternate;
      this.match('END');
    }else{
      container.push(this.statement());
    }
  }
  if(ll.value !== 'list') this.error('expect ' + 'list got ' + '/' + ll.value + ' ', ll.pos );
  return node.list(sequence, variable, consequent, alternate);
}


op.expression = function(){
  var expression;
  if(this.eat('@(')){ //once bind
    expression = this.expr();
    expression.once = true;
    this.match(')')
  }else{
    expression = this.expr();
  }
  return expression;
}

op.expr = function(){
  this.depend = [];

  var buffer = this.filter()

  var body = buffer.get || buffer;
  var setbody = buffer.set;
  return node.expression(body, setbody, !this.depend.length);
}


// filter
// assign ('|' filtername[':' args]) * 
op.filter = function(){
  var left = this.assign();
  var ll = this.eat('|');
  var buffer = [], setBuffer, prefix,
    attr = "_t_", 
    set = left.set, get, 
    tmp = "";

  if(ll){
    if(set) setBuffer = [];

    prefix = "(function(" + attr + "){";

    do{

      tmp = attr + " = " + ctxName + "._f_('" + this.match('IDENT').value+ "' ).get.call( "+_.ctxName +"," + attr ;
      if(this.eat(':')){
        tmp +=", "+ this.arguments("|").join(",") + ");"
      }else{
        tmp += ');'
      }
      buffer.push(tmp);
      setBuffer && setBuffer.unshift( tmp.replace(" ).get.call", " ).set.call") );

    }while(ll = this.eat('|'));
    buffer.push("return " + attr );
    setBuffer && setBuffer.push("return " + attr);

    get =  prefix + buffer.join("") + "})("+left.get+")";
    // we call back to value.
    if(setBuffer){
      // change _ss__(name, _p_) to _s__(name, filterFn(_p_));
      set = set.replace(_.setName, 
        prefix + setBuffer.join("") + "})("+　_.setName　+")" );

    }
    // the set function is depend on the filter definition. if it have set method, the set will work
    return this.getset(get, set);
  }
  return left;
}

// assign
// left-hand-expr = condition
op.assign = function(){
  var left = this.condition(), ll;
  if(ll = this.eat(['=', '+=', '-=', '*=', '/=', '%='])){
    if(!left.set) this.error('invalid lefthand expression in assignment expression');
    return this.getset( left.set.replace("_p_", this.condition().get).replace("'='", "'"+ll.type+"'"), left.set);
    // return this.getset('(' + left.get + ll.type  + this.condition().get + ')', left.set);
  }
  return left;
}

// or
// or ? assign : assign
op.condition = function(){

  var test = this.or();
  if(this.eat('?')){
    return this.getset([test.get + "?", 
      this.assign().get, 
      this.match(":").type, 
      this.assign().get].join(""));
  }

  return test;
}

// and
// and && or
op.or = function(){

  var left = this.and();

  if(this.eat('||')){
    return this.getset(left.get + '||' + this.or().get);
  }

  return left;
}
// equal
// equal && and
op.and = function(){

  var left = this.equal();

  if(this.eat('&&')){
    return this.getset(left.get + '&&' + this.and().get);
  }
  return left;
}
// relation
// 
// equal == relation
// equal != relation
// equal === relation
// equal !== relation
op.equal = function(){
  var left = this.relation(), ll;
  // @perf;
  if( ll = this.eat(['==','!=', '===', '!=='])){
    return this.getset(left.get + ll.type + this.equal().get);
  }
  return left
}
// relation < additive
// relation > additive
// relation <= additive
// relation >= additive
// relation in additive
op.relation = function(){
  var left = this.additive(), ll;
  // @perf
  if(ll = (this.eat(['<', '>', '>=', '<=']) || this.eat('IDENT', 'in') )){
    return this.getset(left.get + ll.value + this.relation().get);
  }
  return left
}
// additive :
// multive
// additive + multive
// additive - multive
op.additive = function(){
  var left = this.multive() ,ll;
  if(ll= this.eat(['+','-']) ){
    return this.getset(left.get + ll.value + this.additive().get);
  }
  return left
}
// multive :
// unary
// multive * unary
// multive / unary
// multive % unary
op.multive = function(){
  var left = this.range() ,ll;
  if( ll = this.eat(['*', '/' ,'%']) ){
    return this.getset(left.get + ll.type + this.multive().get);
  }
  return left;
}

op.range = function(){
  var left = this.unary(), ll, right;

  if(ll = this.eat('..')){
    right = this.unary();
    var body = 
      "(function(start,end){var res = [],step=end>start?1:-1; for(var i = start; end>start?i <= end: i>=end; i=i+step){res.push(i); } return res })("+left.get+","+right.get+")"
    return this.getset(body);
  }

  return left;
}



// lefthand
// + unary
// - unary
// ~ unary
// ! unary
op.unary = function(){
  var ll;
  if(ll = this.eat(['+','-','~', '!'])){
    return this.getset('(' + ll.type + this.unary().get + ')') ;
  }else{
    return this.member()
  }
}

// call[lefthand] :
// member args
// member [ expression ]
// member . ident  

op.member = function(base, last, pathes, prevBase){
  var ll, path;


  var onlySimpleAccessor = false;
  if(!base){ //first
    path = this.primary();
    var type = typeof path;
    if(type === 'string'){ 
      pathes = [];
      pathes.push( path );
      last = path;
      base = ctxName + "._sg_('" + path + "', " + varName + ", 1)";
      onlySimpleAccessor = true;
    }else{ //Primative Type
      if(path.get === 'this'){
        base = ctxName;
        pathes = ['this'];
      }else{
        pathes = null;
        base = path.get;
      }
    }
  }else{ // not first enter
    if(typeof last === 'string' && isPath( last) ){ // is valid path
      pathes.push(last);
    }else{
      if(pathes && pathes.length) this.depend.push(pathes);
      pathes = null;
    }
  }
  if(ll = this.eat(['[', '.', '('])){
    switch(ll.type){
      case '.':
          // member(object, property, computed)
        var tmpName = this.match('IDENT').value;
        prevBase = base;
        if( this.la() !== "(" ){ 
          base = ctxName + "._sg_('" + tmpName + "', " + base + ")";
        }else{
          base += "['" + tmpName + "']";
        }
        return this.member( base, tmpName, pathes,  prevBase);
      case '[':
          // member(object, property, computed)
        path = this.assign();
        prevBase = base;
        if( this.la() !== "(" ){ 
        // means function call, we need throw undefined error when call function
        // and confirm that the function call wont lose its context
          base = ctxName + "._sg_(" + path.get + ", " + base + ")";
        }else{
          base += "[" + path.get + "]";
        }
        this.match(']')
        return this.member(base, path, pathes, prevBase);
      case '(':
        // call(callee, args)
        var args = this.arguments().join(',');
        base =  base+"(" + args +")";
        this.match(')')
        return this.member(base, null, pathes);
    }
  }
  if( pathes && pathes.length ) this.depend.push( pathes );
  var res =  {get: base};
  if(last){
    res.set = ctxName + "._ss_(" + 
        (last.get? last.get : "'"+ last + "'") + 
        ","+ _.setName + ","+ 
        (prevBase?prevBase:_.varName) + 
        ", '=', "+ ( onlySimpleAccessor? 1 : 0 ) + ")";
  
  }
  return res;
}

/**
 * 
 */
op.arguments = function(end){
  end = end || ')'
  var args = [];
  do{
    if(this.la() !== end){
      args.push(this.assign().get)
    }
  }while( this.eat(','));
  return args
}


// primary :
// this 
// ident
// literal
// array
// object
// ( expression )

op.primary = function(){
  var ll = this.ll();
  switch(ll.type){
    case "{":
      return this.object();
    case "[":
      return this.array();
    case "(":
      return this.paren();
    // literal or ident
    case 'STRING':
      this.next();
      return this.getset("'" + ll.value + "'")
    case 'NUMBER':
      this.next();
      return this.getset(""+ll.value);
    case "IDENT":
      this.next();
      if(isKeyWord(ll.value)){
        return this.getset( ll.value );
      }
      return ll.value;
    default: 
      this.error('Unexpected Token: ' + ll.type);
  }
}

// object
//  {propAssign [, propAssign] * [,]}

// propAssign
//  prop : assign

// prop
//  STRING
//  IDENT
//  NUMBER

op.object = function(){
  var code = [this.match('{').type];

  var ll = this.eat( ['STRING', 'IDENT', 'NUMBER'] );
  while(ll){
    code.push("'" + ll.value + "'" + this.match(':').type);
    var get = this.assign().get;
    code.push(get);
    ll = null;
    if(this.eat(",") && (ll = this.eat(['STRING', 'IDENT', 'NUMBER'])) ) code.push(",");
  }
  code.push(this.match('}').type);
  return {get: code.join("")}
}

// array
// [ assign[,assign]*]
op.array = function(){
  var code = [this.match('[').type], item;
  if( this.eat("]") ){

     code.push("]");
  } else {
    while(item = this.assign()){
      code.push(item.get);
      if(this.eat(',')) code.push(",");
      else break;
    }
    code.push(this.match(']').type);
  }
  return {get: code.join("")};
}

// '(' expression ')'
op.paren = function(){
  this.match('(');
  var res = this.filter()
  res.get = '(' + res.get + ')';
  this.match(')');
  return res;
}

op.getset = function(get, set){
  return {
    get: get,
    set: set
  }
}



module.exports = Parser;

});
require.register("regularjs/src/helper/extend.js", function(exports, require, module){
// (c) 2010-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
// Backbone may be freely distributed under the MIT license.
// For all details and documentation:
// http://backbonejs.org

// klass: a classical JS OOP façade
// https://github.com/ded/klass
// License MIT (c) Dustin Diaz 2014
  
// inspired by backbone's extend and klass
var _ = require("../util.js"),
  fnTest = /xy/.test(function(){"xy";}) ? /\bsupr\b/:/.*/,
  isFn = function(o){return typeof o === "function"};


function wrap(k, fn, supro) {
  return function () {
    var tmp = this.supr;
    this.supr = supro[k];
    var ret = fn.apply(this, arguments);
    this.supr = tmp;
    return ret;
  }
}

function process( what, o, supro ) {
  for ( var k in o ) {
    if (o.hasOwnProperty(k)) {

      what[k] = isFn( o[k] ) && isFn( supro[k] ) && 
        fnTest.test( o[k] ) ? wrap(k, o[k], supro) : o[k];
    }
  }
}

// if the property is ["events", "data", "computed"] , we should merge them
var merged = ["events", "data", "computed"], mlen = merged.length;
module.exports = function extend(o){
  o = o || {};
  var supr = this, proto,
    supro = supr && supr.prototype || {};

  if(typeof o === 'function'){
    proto = o.prototype;
    o.implement = implement;
    o.extend = extend;
    return o;
  } 
  
  function fn() {
    supr.apply(this, arguments);
  }

  proto = _.createProto(fn, supro);

  function implement(o){
    // we need merge the merged property
    var len = mlen;
    for(;len--;){
      var prop = merged[len];
      if(o.hasOwnProperty(prop) && proto.hasOwnProperty(prop)){
        _.extend(proto[prop], o[prop], true) 
        delete o[prop];
      }
    }


    process(proto, o, supro); 
    return this;
  }



  fn.implement = implement
  fn.implement(o)
  if(supr.__after__) supr.__after__.call(fn, supr, o);
  fn.extend = extend;
  return fn;
}


});
require.register("regularjs/src/helper/shim.js", function(exports, require, module){
// shim for es5
var slice = [].slice;
var tstr = ({}).toString;

function extend(o1, o2 ){
  for(var i in o2) if( o1[i] === undefined){
    o1[i] = o2[i]
  }
}

// String proto ;
extend(String.prototype, {
  trim: function(){
    return this.replace(/^\s+|\s+$/g, '');
  }
});


// Array proto;
extend(Array.prototype, {
  indexOf: function(obj, from){
    from = from || 0;
    for (var i = from, len = this.length; i < len; i++) {
      if (this[i] === obj) return i;
    }
    return -1;
  },
  forEach: function(callback, context){
    for (var i = 0, len = this.length; i < len; i++) {
      callback.call(context, this[i], i, this);
    }
  },
  filter: function(callback, context){
    var res = [];
    for (var i = 0, length = this.length; i < length; i++) {
      var pass = callback.call(context, this[i], i, this);
      if(pass) res.push(this[i]);
    }
    return res;
  },
  map: function(callback, context){
    var res = [];
    for (var i = 0, length = this.length; i < length; i++) {
      res.push(callback.call(context, this[i], i, this));
    }
    return res;
  }
});

// Function proto;
extend(Function.prototype, {
  bind: function(context){
    var fn = this;
    var preArgs = slice.call(arguments, 1);
    return function(){
      var args = preArgs.concat(slice.call(arguments));
      return fn.apply(context, args);
    }
  }
})

// Object
extend(Object, {
  keys: function(obj){
    var keys = [];
    for(var i in obj) if(obj.hasOwnProperty(i)){
      keys.push(i);
    }
    return keys;
  } 
})

// Date
extend(Date, {
  now: function(){
    return +new Date;
  }
})
// Array
extend(Array, {
  isArray: function(arr){
    return tstr.call(arr) === "[object Array]";
  }
})

});
require.register("regularjs/src/helper/parse.js", function(exports, require, module){
var exprCache = require('../env').exprCache;
var _ = require("../util");
var Parser = require("../parser/Parser.js");
module.exports = {
  expression: function(expr, simple){
    // @TODO cache
    if( typeof expr === 'string' && ( expr = expr.trim() ) ){
      expr = exprCache.get( expr ) || exprCache.set( expr, new Parser( expr, { mode: 2, expression: true } ).expression() )
    }
    if(expr) return _.touchExpression( expr );
  },
  parse: function(template){
    return new Parser(template).parse();
  }
}


});
require.register("regularjs/src/helper/watcher.js", function(exports, require, module){
var _ = require('../util.js');
var parseExpression = require('./parse.js').expression;


function Watcher(){}

var methods = {
  $watch: function(expr, fn, options){
    var get, once, test, rlen; //records length
    if(!this._watchers) this._watchers = [];
    options = options || {};
    if(options === true){
       options = { deep: true }
    }
    var uid = _.uid('w_');
    if(Array.isArray(expr)){
      var tests = [];
      for(var i = 0,len = expr.length; i < len; i++){
          tests.push(parseExpression(expr[i]).get) 
      }
      var prev = [];
      test = function(context){
        var equal = true;
        for(var i =0, len = tests.length; i < len; i++){
          var splice = tests[i](context);
          if(!_.equals(splice, prev[i])){
             equal = false;
             prev[i] = _.clone(splice);
          }
        }
        return equal? false: prev;
      }
    }else{
      expr = this.$expression? this.$expression(expr) : parseExpression(expr);
      get = expr.get;
      once = expr.once || expr.constant;
    }

    var watcher = {
      id: uid, 
      get: get, 
      fn: fn, 
      once: once, 
      force: options.force,
      test: test,
      deep: options.deep
    }
    
    this._watchers.push( watcher );

    rlen = this._records && this._records.length;
    if(rlen) this._records[rlen-1].push(uid)
    // init state.
    if(options.init === true){
      this.$phase = 'digest';
      this._checkSingleWatch( watcher, this._watchers.length-1 );
      this.$phase = null;
    }
    return uid;
  },
  $unwatch: function(uid){
    if(!this._watchers) this._watchers = [];
    if(Array.isArray(uid)){
      for(var i =0, len = uid.length; i < len; i++){
        this.$unwatch(uid[i]);
      }
    }else{
      var watchers = this._watchers, watcher, wlen;
      if(!uid || !watchers || !(wlen = watchers.length)) return;
      for(;wlen--;){
        watcher = watchers[wlen];
        if(watcher && watcher.id === uid ){
          watchers.splice(wlen, 1);
        }
      }
    }
  },
  /**
   * the whole digest loop ,just like angular, it just a dirty-check loop;
   * @param  {String} path  now regular process a pure dirty-check loop, but in parse phase, 
   *                  Regular's parser extract the dependencies, in future maybe it will change to dirty-check combine with path-aware update;
   * @return {Void}   
   */

  $digest: function(){
    if(this.$phase === 'digest' || this._mute) return;
    this.$phase = 'digest';
    var dirty = false, n =0;
    while(dirty = this._digest()){

      if((++n) > 20){ // max loop
        throw 'there may a circular dependencies reaches' 
      }
    }
    if( n > 0 && this.$emit) this.$emit("$update");
    this.$phase = null;
  },
  // private digest logic
  _digest: function(){
    // if(this.context) return this.context.$digest();
    // if(this.$emit) this.$emit('digest');
    var watchers = this._watchers;
    var dirty = false, children, watcher, watcherDirty;
    if(watchers && watchers.length){
      for(var i = 0, len = watchers.length;i < len; i++){
        watcher = watchers[i];
        watcherDirty = this._checkSingleWatch(watcher, i);
        if(watcherDirty) dirty = true;
      }
    }
    // check children's dirty.
    children = this._children;
    if(children && children.length){
      for(var m = 0, mlen = children.length; m < mlen; m++){
        if(children[m]._digest()) dirty = true;
      }
    }
    return dirty;
  },
  // check a single one watcher 
  _checkSingleWatch: function(watcher, i){
    var dirty = false;
    if(!watcher) return;
    if(watcher.test) { //multi 
      var result = watcher.test(this);
      if(result){
        dirty = true;
        watcher.fn.apply(this, result)
      }
    }else{

      var now = watcher.get(this);
      var last = watcher.last;
      var eq = true;

      if(_.typeOf( now ) === 'object' && watcher.deep){
        if(!watcher.last){
           eq = false;
         }else{
          for(var j in now){
            if(watcher.last[j] !== now[j]){
              eq = false;
              break;
            }
          }
          if(eq !== false){
            for(var n in last){
              if(last[n] !== now[n]){
                eq = false;
                break;
              }
            }
          }
        }
      }else{
        eq = _.equals(now, watcher.last);
      }
      if(eq === false || watcher.force){ // in some case. if undefined, we must force digest.
        eq = false;
        watcher.force = null;
        dirty = true;
        watcher.fn.call(this, now, watcher.last);
        if(typeof now !== 'object'|| watcher.deep){
          watcher.last = _.clone(now);
        }else{
          watcher.last = now;
        }
      }else{ // if eq == true
        if( _.typeOf(eq) === 'array' && eq.length ){
          watcher.last = _.clone(now);
          watcher.fn.call(this, now, eq);
          dirty = true;
        }else{
          eq = true;
        }
      }
      // @TODO
      if(dirty && watcher.once) this._watchers.splice(i, 1);

      return dirty;
    }
  },

  /**
   * **tips**: whatever param you passed in $update, after the function called, dirty-check(digest) phase will enter;
   * 
   * @param  {Function|String|Expression} path  
   * @param  {Whatever} value optional, when path is Function, the value is ignored
   * @return {this}     this 
   */
  $set: function(path, value){
    if(path != null){
      var type = _.typeOf(path);
      if( type === 'string' || path.type === 'expression' ){
        path = parseExpression(path);
        path.set(this, value);
      }else if(type === 'function'){
        path.call(this, this.data);
      }else{
        for(var i in path) {
          this.$set(i, path[i])
        }
      }
    }
  },
  $get: function(expr){
    return parseExpression(expr).get(this);
  },
  $update: function(){
    this.$set.apply(this, arguments);
    if(this.$root) this.$root.$digest()
  },
  // auto collect watchers for logic-control.
  _record: function(){
    if(!this._records) this._records = [];
    this._records.push([]);
  },
  _release: function(){
    return this._records.pop();
  }
}


_.extend(Watcher.prototype, methods)


Watcher.mixTo = function(obj){
  obj = typeof obj === "function" ? obj.prototype : obj;
  return _.extend(obj, methods)
}

module.exports = Watcher;
});
require.register("regularjs/src/helper/event.js", function(exports, require, module){
// simplest event emitter 60 lines
// ===============================
var slice = [].slice, _ = require("../util.js");
var buildin = ['$inject', "$init", "$destroy", "$update"];
var API = {
    $on: function(event, fn) {
        if(typeof event === "object"){
            for (var i in event) {
                this.$on(i, event[i]);
            }
        }else{
            // @patch: for list
            var context = this;
            var handles = context._handles || (context._handles = {}),
                calls = handles[event] || (handles[event] = []);
            calls.push(fn);
        }
        return this;
    },
    $off: function(event, fn) {
        var context = this;
        if(!context._handles) return;
        if(!event) this._handles = {};
        var handles = context._handles,
            calls;

        if (calls = handles[event]) {
            if (!fn) {
                handles[event] = [];
                return context;
            }
            for (var i = 0, len = calls.length; i < len; i++) {
                if (fn === calls[i]) {
                    calls.splice(i, 1);
                    return context;
                }
            }
        }
        return context;
    },
    // bubble event
    $emit: function(event){
        // @patch: for list
        var context = this;
        var handles = context._handles, calls, args, type;
        if(!event) return;
        var args = slice.call(arguments, 1);
        var type = event;

        if(!handles) return context;
        // @deprecated 0.3.0
        // will be removed when completely remove the old events('destroy' 'init') support

        /*@remove 0.4.0*/
        var isBuildin = ~buildin.indexOf(type);
        if(calls = handles[type.slice(1)]){
            for (var j = 0, len = calls.length; j < len; j++) {
                calls[j].apply(context, args)
            }
        }
        /*/remove*/

        if (!(calls = handles[type])) return context;
        for (var i = 0, len = calls.length; i < len; i++) {
            calls[i].apply(context, args)
        }
        // if(calls.length) context.$update();
        return context;
    },
    // capture  event
    $broadcast: function(){
        
    }
}
// container class
function Event() {
  if (arguments.length) this.$on.apply(this, arguments);
}
_.extend(Event.prototype, API)

Event.mixTo = function(obj){
  obj = typeof obj === "function" ? obj.prototype : obj;
  _.extend(obj, API)
}
module.exports = Event;
});
require.register("regularjs/src/helper/animate.js", function(exports, require, module){
var _ = require("../util");
var dom  = require("../dom.js");
var animate = {};
var env = require("../env.js");


var 
  transitionEnd = 'transitionend', 
  animationEnd = 'animationend', 
  transitionProperty = 'transition', 
  animationProperty = 'animation';

if(!('ontransitionend' in window)){
  if('onwebkittransitionend' in window) {
    
    // Chrome/Saf (+ Mobile Saf)/Android
    transitionEnd += ' webkitTransitionEnd';
    transitionProperty = 'webkitTransition'
  } else if('onotransitionend' in dom.tNode || navigator.appName === 'Opera') {

    // Opera
    transitionEnd += ' oTransitionEnd';
    transitionProperty = 'oTransition';
  }
}
if(!('onanimationend' in window)){
  if ('onwebkitanimationend' in window){
    // Chrome/Saf (+ Mobile Saf)/Android
    animationEnd += ' webkitAnimationEnd';
    animationProperty = 'webkitAnimation';

  }else if ('onoanimationend' in dom.tNode){
    // Opera
    animationEnd += ' oAnimationEnd';
    animationProperty = 'oAnimation';
  }
}

/**
 * inject node with animation
 * @param  {[type]} node      [description]
 * @param  {[type]} refer     [description]
 * @param  {[type]} direction [description]
 * @return {[type]}           [description]
 */
animate.inject = function( node, refer ,direction, callback ){
  callback = callback || _.noop;
  if( Array.isArray(node) ){
    var fragment = dom.fragment();
    var count=0;

    for(var i = 0,len = node.length;i < len; i++ ){
      fragment.appendChild(node[i]); 
    }
    dom.inject(fragment, refer, direction);

    var enterCallback = function (){
      count++;
      if( count === len ) callback();
    }
    if(len === count) callback();
    for( i = 0; i < len; i++ ){
      if(node[i].onenter){
        node[i].onenter(enterCallback);
      }else{
        enterCallback();
      }
    }
  }else{
    dom.inject( node, refer, direction );
    if(node.onenter){
      node.onenter(callback)
    }else{
      callback();
    }
    // if( node.nodeType === 1 && callback !== false ){
    //   return startClassAnimate( node, 'r-enter', callback , 2);
    // }
    // ignored else
    
  }
}

/**
 * remove node with animation
 * @param  {[type]}   node     [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
animate.remove = function(node, callback){
  callback = callback || _.noop;
  if(node.onleave){
    node.onleave(function(){
      dom.remove(node);
    })
  }else{
    dom.remove(node) 
    callback && callback();
  }
}



animate.startClassAnimate = function ( node, className,  callback, mode ){
  var activeClassName, timeout, tid, onceAnim;
  if( (!animationEnd && !transitionEnd) || env.isRunning ){
    return callback();
  }


  onceAnim = _.once(function onAnimateEnd(){
    if(tid) clearTimeout(tid);

    if(mode === 2) {
      dom.delClass(node, activeClassName);
    }
    if(mode !== 3){ // mode hold the class
      dom.delClass(node, className);
    }
    dom.off(node, animationEnd, onceAnim)
    dom.off(node, transitionEnd, onceAnim)

    callback();

  });
  if(mode === 2){ // auto removed
    dom.addClass( node, className );

    activeClassName = className.split(/\s+/).map(function(name){
       return name + '-active';
    }).join(" ");

    dom.nextReflow(function(){
      dom.addClass( node, activeClassName );
      timeout = getMaxTimeout( node );
      tid = setTimeout( onceAnim, timeout );
    });

  }else{

    dom.nextReflow(function(){
      dom.addClass( node, className );
      timeout = getMaxTimeout( node );
      tid = setTimeout( onceAnim, timeout );
    });

  }


  dom.on( node, animationEnd, onceAnim )
  dom.on( node, transitionEnd, onceAnim )
  return onceAnim;
}


animate.startStyleAnimate = function(node, styles, callback){
  var timeout, onceAnim, tid;

  dom.nextReflow(function(){
    dom.css( node, styles );
    timeout = getMaxTimeout( node );
    tid = setTimeout( onceAnim, timeout );
  });


  onceAnim = _.once(function onAnimateEnd(){
    if(tid) clearTimeout(tid);

    dom.off(node, animationEnd, onceAnim)
    dom.off(node, transitionEnd, onceAnim)

    callback();

  });

  dom.on( node, animationEnd, onceAnim )
  dom.on( node, transitionEnd, onceAnim )

  return onceAnim;
}


/**
 * get maxtimeout
 * @param  {Node} node 
 * @return {[type]}   [description]
 */
function getMaxTimeout(node){
  var timeout = 0,
    tDuration = 0,
    tDelay = 0,
    aDuration = 0,
    aDelay = 0,
    ratio = 5 / 3,
    styles ;

  if(window.getComputedStyle){

    styles = window.getComputedStyle(node),
    tDuration = getMaxTime( styles[transitionProperty + 'Duration']) || tDuration;
    tDelay = getMaxTime( styles[transitionProperty + 'Delay']) || tDelay;
    aDuration = getMaxTime( styles[animationProperty + 'Duration']) || aDuration;
    aDelay = getMaxTime( styles[animationProperty + 'Delay']) || aDelay;
    timeout = Math.max( tDuration+tDelay, aDuration + aDelay );

  }
  return timeout * 1000 * ratio;
}

function getMaxTime(str){

  var maxTimeout = 0, time;

  if(!str) return 0;

  str.split(",").forEach(function(str){

    time = parseFloat(str);
    if( time > maxTimeout ) maxTimeout = time;

  });

  return maxTimeout;
}

module.exports = animate;
});
require.register("regularjs/src/helper/combine.js", function(exports, require, module){
// some nested  operation in ast 
// --------------------------------

var dom = require("../dom.js");

var combine = module.exports = {

  // get the initial dom in object
  node: function(item){
    var children,node;
    if(item.element) return item.element;
    if(typeof item.node === "function") return item.node();
    if(typeof item.nodeType === "number") return item;
    if(item.group) return combine.node(item.group)
    if(children = item.children){
      if(children.length === 1){
        
        return combine.node(children[0]);
      }
      var nodes = [];
      for(var i = 0, len = children.length; i < len; i++ ){
        node = combine.node(children[i]);
        if(Array.isArray(node)){
          nodes.push.apply(nodes, node)
        }else{
          nodes.push(node)
        }
      }
      return nodes;
    }
  },

  // get the last dom in object(for insertion operation)
  last: function(item){
    var children = item.children;

    if(typeof item.last === "function") return item.last();
    if(typeof item.nodeType === "number") return item;

    if(children && children.length) return combine.last(children[children.length - 1]);
    if(item.group) return combine.last(item.group);

  },

  destroy: function(item, first){
    if(!item) return;
    if(Array.isArray(item)){
      for(var i = 0, len = item.length; i < len; i++ ){
        combine.destroy(item[i], first);
      }
    }
    var children = item.children;
    if(typeof item.destroy === "function") return item.destroy(first);
    if(typeof item.nodeType === "number" && first)  dom.remove(item);
    if(children && children.length){
      combine.destroy(children, true);
      item.children = null;
    }
  }

}
});
require.register("regularjs/src/helper/entities.js", function(exports, require, module){
// http://stackoverflow.com/questions/1354064/how-to-convert-characters-to-html-entities-using-plain-javascript
var entities = {
  'quot':34, 
  'amp':38, 
  'apos':39, 
  'lt':60, 
  'gt':62, 
  'nbsp':160, 
  'iexcl':161, 
  'cent':162, 
  'pound':163, 
  'curren':164, 
  'yen':165, 
  'brvbar':166, 
  'sect':167, 
  'uml':168, 
  'copy':169, 
  'ordf':170, 
  'laquo':171, 
  'not':172, 
  'shy':173, 
  'reg':174, 
  'macr':175, 
  'deg':176, 
  'plusmn':177, 
  'sup2':178, 
  'sup3':179, 
  'acute':180, 
  'micro':181, 
  'para':182, 
  'middot':183, 
  'cedil':184, 
  'sup1':185, 
  'ordm':186, 
  'raquo':187, 
  'frac14':188, 
  'frac12':189, 
  'frac34':190, 
  'iquest':191, 
  'Agrave':192, 
  'Aacute':193, 
  'Acirc':194, 
  'Atilde':195, 
  'Auml':196, 
  'Aring':197, 
  'AElig':198, 
  'Ccedil':199, 
  'Egrave':200, 
  'Eacute':201, 
  'Ecirc':202, 
  'Euml':203, 
  'Igrave':204, 
  'Iacute':205, 
  'Icirc':206, 
  'Iuml':207, 
  'ETH':208, 
  'Ntilde':209, 
  'Ograve':210, 
  'Oacute':211, 
  'Ocirc':212, 
  'Otilde':213, 
  'Ouml':214, 
  'times':215, 
  'Oslash':216, 
  'Ugrave':217, 
  'Uacute':218, 
  'Ucirc':219, 
  'Uuml':220, 
  'Yacute':221, 
  'THORN':222, 
  'szlig':223, 
  'agrave':224, 
  'aacute':225, 
  'acirc':226, 
  'atilde':227, 
  'auml':228, 
  'aring':229, 
  'aelig':230, 
  'ccedil':231, 
  'egrave':232, 
  'eacute':233, 
  'ecirc':234, 
  'euml':235, 
  'igrave':236, 
  'iacute':237, 
  'icirc':238, 
  'iuml':239, 
  'eth':240, 
  'ntilde':241, 
  'ograve':242, 
  'oacute':243, 
  'ocirc':244, 
  'otilde':245, 
  'ouml':246, 
  'divide':247, 
  'oslash':248, 
  'ugrave':249, 
  'uacute':250, 
  'ucirc':251, 
  'uuml':252, 
  'yacute':253, 
  'thorn':254, 
  'yuml':255, 
  'fnof':402, 
  'Alpha':913, 
  'Beta':914, 
  'Gamma':915, 
  'Delta':916, 
  'Epsilon':917, 
  'Zeta':918, 
  'Eta':919, 
  'Theta':920, 
  'Iota':921, 
  'Kappa':922, 
  'Lambda':923, 
  'Mu':924, 
  'Nu':925, 
  'Xi':926, 
  'Omicron':927, 
  'Pi':928, 
  'Rho':929, 
  'Sigma':931, 
  'Tau':932, 
  'Upsilon':933, 
  'Phi':934, 
  'Chi':935, 
  'Psi':936, 
  'Omega':937, 
  'alpha':945, 
  'beta':946, 
  'gamma':947, 
  'delta':948, 
  'epsilon':949, 
  'zeta':950, 
  'eta':951, 
  'theta':952, 
  'iota':953, 
  'kappa':954, 
  'lambda':955, 
  'mu':956, 
  'nu':957, 
  'xi':958, 
  'omicron':959, 
  'pi':960, 
  'rho':961, 
  'sigmaf':962, 
  'sigma':963, 
  'tau':964, 
  'upsilon':965, 
  'phi':966, 
  'chi':967, 
  'psi':968, 
  'omega':969, 
  'thetasym':977, 
  'upsih':978, 
  'piv':982, 
  'bull':8226, 
  'hellip':8230, 
  'prime':8242, 
  'Prime':8243, 
  'oline':8254, 
  'frasl':8260, 
  'weierp':8472, 
  'image':8465, 
  'real':8476, 
  'trade':8482, 
  'alefsym':8501, 
  'larr':8592, 
  'uarr':8593, 
  'rarr':8594, 
  'darr':8595, 
  'harr':8596, 
  'crarr':8629, 
  'lArr':8656, 
  'uArr':8657, 
  'rArr':8658, 
  'dArr':8659, 
  'hArr':8660, 
  'forall':8704, 
  'part':8706, 
  'exist':8707, 
  'empty':8709, 
  'nabla':8711, 
  'isin':8712, 
  'notin':8713, 
  'ni':8715, 
  'prod':8719, 
  'sum':8721, 
  'minus':8722, 
  'lowast':8727, 
  'radic':8730, 
  'prop':8733, 
  'infin':8734, 
  'ang':8736, 
  'and':8743, 
  'or':8744, 
  'cap':8745, 
  'cup':8746, 
  'int':8747, 
  'there4':8756, 
  'sim':8764, 
  'cong':8773, 
  'asymp':8776, 
  'ne':8800, 
  'equiv':8801, 
  'le':8804, 
  'ge':8805, 
  'sub':8834, 
  'sup':8835, 
  'nsub':8836, 
  'sube':8838, 
  'supe':8839, 
  'oplus':8853, 
  'otimes':8855, 
  'perp':8869, 
  'sdot':8901, 
  'lceil':8968, 
  'rceil':8969, 
  'lfloor':8970, 
  'rfloor':8971, 
  'lang':9001, 
  'rang':9002, 
  'loz':9674, 
  'spades':9824, 
  'clubs':9827, 
  'hearts':9829, 
  'diams':9830, 
  'OElig':338, 
  'oelig':339, 
  'Scaron':352, 
  'scaron':353, 
  'Yuml':376, 
  'circ':710, 
  'tilde':732, 
  'ensp':8194, 
  'emsp':8195, 
  'thinsp':8201, 
  'zwnj':8204, 
  'zwj':8205, 
  'lrm':8206, 
  'rlm':8207, 
  'ndash':8211, 
  'mdash':8212, 
  'lsquo':8216, 
  'rsquo':8217, 
  'sbquo':8218, 
  'ldquo':8220, 
  'rdquo':8221, 
  'bdquo':8222, 
  'dagger':8224, 
  'Dagger':8225, 
  'permil':8240, 
  'lsaquo':8249, 
  'rsaquo':8250, 
  'euro':8364
}



module.exports  = entities;
});
require.register("regularjs/src/directive/base.js", function(exports, require, module){
// Regular
var _ = require("../util.js");
var dom = require("../dom.js");
var animate = require("../helper/animate.js");
var Regular = require("../Regular.js");



require("./event.js");
require("./form.js");


// **warn**: class inteplation will override this directive 

Regular.directive('r-class', function(elem, value){
  this.$watch(value, function(nvalue){
    var className = ' '+ elem.className.replace(/\s+/g, ' ') +' ';
    for(var i in nvalue) if(nvalue.hasOwnProperty(i)){
      className = className.replace(' ' + i + ' ',' ');
      if(nvalue[i] === true){
        className += i+' ';
      }
    }
    elem.className = className.trim();
  },true);

});

// **warn**: style inteplation will override this directive 

Regular.directive('r-style', function(elem, value){
  this.$watch(value, function(nvalue){
    for(var i in nvalue) if(nvalue.hasOwnProperty(i)){
      dom.css(elem, i, nvalue[i]);
    }
  },true);
});

// when expression is evaluate to true, the elem will add display:none
// Example: <div r-hide={{items.length > 0}}></div>

Regular.directive('r-hide', function(elem, value){
  var preBool = null, compelete;
  this.$watch(value, function(nvalue){
    var bool = !!nvalue;
    if(bool === preBool) return; 
    preBool = bool;
    if(bool){
      if(elem.onleave){
        compelete = elem.onleave(function(){
          elem.style.display = "none"
          compelete = null;
        })
      }else{
        elem.style.display = "none"
      }
      
    }else{
      if(compelete) compelete();
      elem.style.display = "";
      if(elem.onenter){
        elem.onenter();
      }
    }
  });

});

// unescaped inteplation. xss is not be protect
Regular.directive('r-html', function(elem, value){
  this.$watch(value, function(nvalue){
    nvalue = nvalue || "";
    dom.html(elem, nvalue)
  }, {force: true});
});










});
require.register("regularjs/src/directive/form.js", function(exports, require, module){
// Regular
var _ = require("../util.js");
var dom = require("../dom.js");
var Regular = require("../Regular.js");

var modelHandlers = {
  "text": initText,
  "select": initSelect,
  "checkbox": initCheckBox,
  "radio": initRadio
}


// @TODO


// two-way binding with r-model
// works on input, textarea, checkbox, radio, select

Regular.directive("r-model", function(elem, value){
  var tag = elem.tagName.toLowerCase();
  var sign = tag;
  if(sign === "input") sign = elem.type || "text";
  else if(sign === "textarea") sign = "text";
  if(typeof value === "string") value = Regular.expression(value);

  if( modelHandlers[sign] ) return modelHandlers[sign].call(this, elem, value);
  else if(tag === "input"){
    return modelHandlers.text.call(this, elem, value);
  }
});



// binding <select>

function initSelect( elem, parsed){
  var self = this;
  var inProgress = false;
  this.$watch(parsed, function(newValue){
    if(inProgress) return;
    var children = _.slice(elem.getElementsByTagName('option'))
    children.forEach(function(node, index){
      if(node.value == newValue){
        elem.selectedIndex = index;
      }
    })
  });

  function handler(){
    parsed.set(self, this.value);
    inProgress = true;
    self.$update();
    inProgress = false;
  }

  dom.on(elem, "change", handler);
  
  if(parsed.get(self) === undefined && elem.value){
     parsed.set(self, elem.value);
  }
  return function destroy(){
    dom.off(elem, "change", handler);
  }
}

// input,textarea binding

function initText(elem, parsed){
  var inProgress = false;
  var self = this;
  this.$watch(parsed, function(newValue){
    if(inProgress){ return; }
    if(elem.value !== newValue) elem.value = newValue == null? "": "" + newValue;
  });

  // @TODO to fixed event
  var handler = function handler(ev){
    var that = this;
    if(ev.type==='cut' || ev.type==='paste'){
      _.nextTick(function(){
        var value = that.value
        parsed.set(self, value);
        inProgress = true;
        self.$update();
      })
    }else{
        var value = that.value
        parsed.set(self, value);
        inProgress = true;
        self.$update();
    }
    inProgress = false;
  };

  if(dom.msie !== 9 && "oninput" in dom.tNode ){
    elem.addEventListener("input", handler );
  }else{
    dom.on(elem, "paste", handler)
    dom.on(elem, "keyup", handler)
    dom.on(elem, "cut", handler)
    dom.on(elem, "change", handler)
  }
  if(parsed.get(self) === undefined && elem.value){
     parsed.set(self, elem.value);
  }
  return function destroy(){
    if(dom.msie !== 9 && "oninput" in dom.tNode ){
      elem.removeEventListener("input", handler );
    }else{
      dom.off(elem, "paste", handler)
      dom.off(elem, "keyup", handler)
      dom.off(elem, "cut", handler)
      dom.off(elem, "change", handler)
    }
  }
}


// input:checkbox  binding

function initCheckBox(elem, parsed){
  var inProgress = false;
  var self = this;
  this.$watch(parsed, function(newValue){
    if(inProgress) return;
    dom.attr(elem, 'checked', !!newValue);
  });

  var handler = function handler(){
    var value = this.checked;
    parsed.set(self, value);
    inProgress= true;
    self.$update();
    inProgress = false;
  }
  if(parsed.set) dom.on(elem, "change", handler)

  if(parsed.get(self) === undefined){
    parsed.set(self, !!elem.checked);
  }

  return function destroy(){
    if(parsed.set) dom.off(elem, "change", handler)
  }
}


// input:radio binding

function initRadio(elem, parsed){
  var self = this;
  var inProgress = false;
  this.$watch(parsed, function( newValue ){
    if(inProgress) return;
    if(newValue == elem.value) elem.checked = true;
    else elem.checked = false;
  });


  var handler = function handler(){
    var value = this.value;
    parsed.set(self, value);
    inProgress= true;
    self.$update();
    inProgress = false;
  }
  if(parsed.set) dom.on(elem, "change", handler)
  // beacuse only after compile(init), the dom structrue is exsit. 
  if(parsed.get(self) === undefined){
    if(elem.checked) parsed.set(self, elem.value);
  }

  return function destroy(){
    if(parsed.set) dom.off(elem, "change", handler)
  }
}

});
require.register("regularjs/src/directive/animation.js", function(exports, require, module){
var // packages
  _ = require("../util.js"),
 animate = require("../helper/animate.js"),
 dom = require("../dom.js"),
 Regular = require("../Regular.js");


var // variables
  rClassName = /^[-\w]+(\s[-\w]+)*$/,
  rCommaSep = /[\r\n\f ]*,[\r\n\f ]*(?=\w+\:)/, //  dont split comma in  Expression
  rStyles = /^\{.*\}$/, //  for Simpilfy
  rSpace = /\s+/, //  for Simpilfy
  WHEN_COMMAND = "when",
  EVENT_COMMAND = "on",
  THEN_COMMAND = "then";

/**
 * Animation Plugin
 * @param {Component} Component 
 */


function createSeed(type){

  var steps = [], current = 0, callback = _.noop;
  var key;

  var out = {
    type: type,
    start: function(cb){
      key = _.uid();
      if(typeof cb === "function") callback = cb;
      if(current> 0 ){
        current = 0 ;
      }else{
        out.step();
      }
      return out.compelete;
    },
    compelete: function(){
      key = null;
      callback && callback();
      callback = _.noop;
      current = 0;
    },
    step: function(){
      if(steps[current]) steps[current ]( out.done.bind(out, key) );
    },
    done: function(pkey){
      if(pkey !== key) return; // means the loop is down
      if( current < steps.length - 1 ) {
        current++;
        out.step();
      }else{
        out.compelete();
      }
    },
    push: function(step){
      steps.push(step)
    }
  }

  return out;
}

Regular._addProtoInheritCache("animation")


// builtin animation
Regular.animation({
  "wait": function( step ){
    var timeout = parseInt( step.param ) || 0
    return function(done){
      // _.log("delay " + timeout)
      setTimeout( done, timeout );
    }
  },
  "class": function(step){
    var tmp = step.param.split(","),
      className = tmp[0] || "",
      mode = parseInt(tmp[1]) || 1;

    return function(done){
      // _.log(className)
      animate.startClassAnimate( step.element, className , done, mode );
    }
  },
  "call": function(step){
    var fn = Regular.expression(step.param).get, self = this;
    return function(done){
      // _.log(step.param, 'call')
      fn(self);
      self.$update();
      done()
    }
  },
  "emit": function(step){
    var param = step.param;
    var self = this;
    return function(done){
      self.$emit(param, step);
      done();
    }
  },
  // style: left {{10}}pxkk,
  style: function(step){
    var styles = {}, 
      param = step.param,
      pairs = param.split(","), valid;
    pairs.forEach(function(pair){
      pair = pair.trim();
      if(pair){
        var tmp = pair.split( rSpace ),
          name = tmp.shift(),
          value = tmp.join(" ");

        if( !name || !value ) throw "invalid style in command: style";
        styles[name] = value;
        valid = true;
      }
    })

    return function(done){
      if(valid){
        animate.startStyleAnimate(step.element, styles, done);
      }else{
        done();
      }
    }
  }
})



// hancdle the r-animation directive
// el : the element to process
// value: the directive value
function processAnimate( element, value ){
  value = value.trim();

  var composites = value.split(";"), 
    composite, context = this, seeds = [], seed, destroies = [], destroy,
    command, param , current = 0, tmp, animator, self = this;

  function reset( type ){
    seed && seeds.push( seed )
    seed = createSeed( type );
  }

  function whenCallback(start, value){
    if( !!value ) start()
  }

  function animationDestroy(element){
    return function(){
      element.onenter = undefined;
      element.onleave = undefined;
    } 
  }

  for( var i = 0, len = composites.length; i < len; i++ ){

    composite = composites[i];
    tmp = composite.split(":");
    command = tmp[0] && tmp[0].trim();
    param = tmp[1] && tmp[1].trim();

    if( !command ) continue;

    if( command === WHEN_COMMAND ){
      reset("when");
      this.$watch(param, whenCallback.bind( this, seed.start ) );
      continue;
    }

    if( command === EVENT_COMMAND){
      reset(param);
      if(param === "leave"){
        element.onleave = seed.start;
      }else if(param === "enter"){
        element.onenter = seed.start;
      }else{
        destroy = this._handleEvent( element, param, seed.start );
      }

      destroies.push( destroy? destroy : animationDestroy(element) );
      destroy = null;
      continue
    }

    var animator =  Regular.animation(command) 
    if( animator && seed ){
      seed.push(
        animator.call(this,{
          element: element,
          done: seed.done,
          param: param 
        })
      )
    }else{
      throw "you need start with `on` or `event` in r-animation";
    }
  }

  if(destroies.length){
    return function(){
      destroies.forEach(function(destroy){
        destroy();
      })
    }
  }
}


Regular.directive( "r-animation", processAnimate)



});
require.register("regularjs/src/directive/event.js", function(exports, require, module){
/**
 * event directive  bundle
 *
 */
var _ = require("../util.js");
var dom = require("../dom.js");
var Regular = require("../Regular.js");

Regular._addProtoInheritCache("event");

Regular.event( "enter" , function(elem, fire) {
  function update( ev ) {
    if ( ev.which === 13 ) {
      ev.preventDefault();
      fire(ev);
    }
  }
  dom.on( elem, "keypress", update );

  return function() {
    dom.off( elem, "keypress", update );
  }
})


Regular.directive( /^on-\w+$/, function( elem, value, name , attrs) {
  if ( !name || !value ) return;
  var type = name.split("-")[1];
  return this._handleEvent( elem, type, value, attrs );
});
// TODO.
/**
- $('dx').delegate()
*/
Regular.directive( /^delegate-\w+$/, function( elem, value, name, attrs ) {
  var root = this.$root;
  var _delegates = root._delegates || ( root._delegates = {} );
  if ( !name || !value ) return;
  var type = name.split("-")[1];
  var fire = _.handleEvent.call(this, value, type);

  function delegateEvent(ev){
    matchParent(ev, _delegates[type]);
  }

  if( !_delegates[type] ){
    _delegates[type] = [];

    root.$on( "$inject", function( newParent ){
      var preParent = this.parentNode;
      if( preParent ){
        dom.off(preParent, type, delegateEvent);
      }
      dom.on(newParent, type, delegateEvent);
    })

    root.$on("$destroy", function(){
      if(root.parentNode) dom.off(root.parentNode, type, delegateEvent)
      root._delegates[type] = null;
    })
  }
  var delegate = {
    element: elem,
    fire: fire
  }
  _delegates[type].push( delegate );

  return function(){
    var delegates = _delegates[type];
    if(!delegates || !delegates.length) return;
    for( var i = 0, len = delegates.length; i < len; i++ ){
      if( delegates[i] === delegate ) delegates.splice(i, 1);
    }
  }

});


function matchParent(ev , delegates){
  var target = ev.target;
  while(target && target !== dom.doc){
    for( var i = 0, len = delegates.length; i < len; i++ ){
      if(delegates[i].element === target){
        delegates[i].fire(ev);
      }
    }
    target = target.parentNode;
  }
}
});
require.register("regularjs/src/module/timeout.js", function(exports, require, module){
var Regular = require("../Regular.js");

/**
 * Timeout Module
 * @param {Component} Component 
 */
function TimeoutModule(Component){

  Component.implement({
    /**
     * just like setTimeout, but will enter digest automately
     * @param  {Function} fn    
     * @param  {Number}   delay 
     * @return {Number}   timeoutid
     */
    $timeout: function(fn, delay){
      delay = delay || 0;
      return setTimeout(function(){
        fn.call(this);
        this.$update(); //enter digest
      }.bind(this), delay);
    },
    /**
     * just like setInterval, but will enter digest automately
     * @param  {Function} fn    
     * @param  {Number}   interval 
     * @return {Number}   intervalid
     */
    $interval: function(fn, interval){
      interval = interval || 1000/60;
      return setInterval(function(){
        fn.call(this);
        this.$update(); //enter digest
      }.bind(this), interval);
    }
  });
}


Regular.plugin('timeout', TimeoutModule);
Regular.plugin('$timeout', TimeoutModule);
});
require.alias("regularjs/src/index.js", "regularjs/index.js");
if (typeof exports == 'object') {
  module.exports = require('regularjs');
} else if (typeof define == 'function' && define.amd) {
  define('regularjs',['regularjs'],function(){ return require('regularjs'); });
} else {
  window['Regular'] = require('regularjs');
}})();
define('rgl',{load: function(id){throw new Error("Dynamic load not allowed: " + id);}});

define("rgl!module/app.html", function(){ return [{"type":"element","tag":"nav","attrs":[{"type":"attribute","name":"class","value":"navbar navbar-inverse navbar-fixed-top"}],"children":[{"type":"text","text":"\n  "},{"type":"element","tag":"div","attrs":[{"type":"attribute","name":"class","value":"container-fluid"}],"children":[{"type":"text","text":"\n    "},{"type":"element","tag":"div","attrs":[{"type":"attribute","name":"class","value":"navbar-header"}],"children":[{"type":"text","text":"\n      "},{"type":"element","tag":"button","attrs":[{"type":"attribute","name":"type","value":"button"},{"type":"attribute","name":"class","value":"navbar-toggle collapsed"},{"type":"attribute","name":"data-toggle","value":"collapse"},{"type":"attribute","name":"data-target","value":"#navbar"},{"type":"attribute","name":"aria-expanded","value":"false"},{"type":"attribute","name":"aria-controls","value":"navbar"}],"children":[{"type":"text","text":"\n        "},{"type":"element","tag":"span","attrs":[{"type":"attribute","name":"class","value":"sr-only"}],"children":[{"type":"text","text":"Toggle navigation"}]},{"type":"text","text":"\n        "},{"type":"element","tag":"span","attrs":[{"type":"attribute","name":"class","value":"icon-bar"}],"children":[]},{"type":"text","text":"\n        "},{"type":"element","tag":"span","attrs":[{"type":"attribute","name":"class","value":"icon-bar"}],"children":[]},{"type":"text","text":"\n        "},{"type":"element","tag":"span","attrs":[{"type":"attribute","name":"class","value":"icon-bar"}],"children":[]},{"type":"text","text":"\n      "}]},{"type":"text","text":"\n      "},{"type":"element","tag":"span","attrs":[{"type":"attribute","name":"class","value":"navbar-brand"},{"type":"attribute","name":"href","value":"#"}],"children":[{"type":"text","text":"theme from "},{"type":"element","tag":"a","attrs":[{"type":"attribute","name":"href","value":"http://getbootstrap.com/examples/dashboard/"}],"children":[{"type":"text","text":"[bootstrap]"}]},{"type":"text","text":" "}]},{"type":"text","text":"\n    "}]},{"type":"text","text":"\n    "},{"type":"element","tag":"div","attrs":[{"type":"attribute","name":"id","value":"navbar"},{"type":"attribute","name":"class","value":"navbar-collapse collapse"}],"children":[{"type":"text","text":"\n      "},{"type":"if","test":{"type":"expression","body":"(!_c_._sg_('user', _c_._sg_('$state', _c_)))","constant":false,"setbody":false},"consequent":[{"type":"text","text":"\n      "},{"type":"element","tag":"form","attrs":[{"type":"attribute","name":"class","value":"navbar-form navbar-right"}],"children":[{"type":"text","text":"\n        "},{"type":"element","tag":"input","attrs":[{"type":"attribute","name":"type","value":"text"},{"type":"attribute","name":"class","value":"form-control"},{"type":"attribute","name":"placeholder","value":"User name"},{"type":"attribute","name":"r-model","value":"username"}]},{"type":"text","text":"\n        "},{"type":"element","tag":"input","attrs":[{"type":"attribute","name":"type","value":"text"},{"type":"attribute","name":"class","value":"form-control"},{"type":"attribute","name":"placeholder","value":"Password..."},{"type":"attribute","name":"r-model","value":"password"}]},{"type":"text","text":"\n        "},{"type":"element","tag":"a","attrs":[{"type":"attribute","name":"href","value":"javascript:;"},{"type":"attribute","name":"class","value":"btn btn-primary"},{"type":"attribute","name":"on-click","value":{"type":"expression","body":"_c_['login'](_c_._sg_('username', _d_, 1),_c_._sg_('password', _d_, 1))","constant":false,"setbody":false}}],"children":[{"type":"text","text":"login"}]},{"type":"text","text":"\n      "}]},{"type":"text","text":"\n      "}],"alternate":[{"type":"text","text":"\n      "},{"type":"element","tag":"div","attrs":[{"type":"attribute","name":"class","value":"navbar-brand navbar-right"}],"children":[{"type":"text","text":"Welcome, "},{"type":"expression","body":"_c_._sg_('name', _c_._sg_('user', _c_._sg_('$state', _c_)))","constant":false,"setbody":"_c_._ss_('name',_p_,_c_._sg_('user', _c_._sg_('$state', _c_)), '=', 0)"},{"type":"text","text":" "},{"type":"element","tag":"a","attrs":[{"type":"attribute","name":"href","value":"#"},{"type":"attribute","name":"class","value":"btn btn-primary"},{"type":"attribute","name":"on-click","value":{"type":"expression","body":"_c_['logout']()","constant":false,"setbody":false}}],"children":[{"type":"text","text":"logout"}]}]},{"type":"text","text":"\n      "}]},{"type":"text","text":"\n    "}]},{"type":"text","text":"\n  "}]},{"type":"text","text":"\n"}]},{"type":"text","text":"\n"},{"type":"element","tag":"div","attrs":[{"type":"attribute","name":"class","value":"container-fluid"}],"children":[{"type":"text","text":"\n  "},{"type":"element","tag":"div","attrs":[{"type":"attribute","name":"class","value":"row"}],"children":[{"type":"text","text":"\n    "},{"type":"element","tag":"div","attrs":[{"type":"attribute","name":"class","value":"col-sm-3 col-md-2 sidebar"}],"children":[{"type":"text","text":"\n      "},{"type":"element","tag":"app-menu","attrs":[{"type":"attribute","name":"menus","value":{"type":"expression","body":"_c_._sg_('menus', _d_, 1)","constant":false,"setbody":"_c_._ss_('menus',_p_,_d_, '=', 1)"}},{"type":"attribute","name":"state","value":{"type":"expression","body":"_c_._sg_('$state', _c_)","constant":false,"setbody":"_c_._ss_('$state',_p_,_c_, '=', 0)","once":true}}],"children":[]},{"type":"text","text":"\n    "}]},{"type":"text","text":"\n    "},{"type":"element","tag":"div","attrs":[{"type":"attribute","name":"class","value":"col-sm-9 col-sm-offset-3 col-md-10 col-md-offset-2 main"}],"children":[{"type":"text","text":"\n      "},{"type":"element","tag":"div","attrs":[{"type":"attribute","name":"ref","value":"view"}],"children":[]},{"type":"text","text":"\n      "},{"type":"element","tag":"footer","attrs":[],"children":[{"type":"text","text":"\n        "},{"type":"element","tag":"p","attrs":[],"children":[{"type":"text","text":"© Company 2014"}]},{"type":"text","text":"\n      "}]},{"type":"text","text":"\n    "}]},{"type":"text","text":"\n  "}]},{"type":"text","text":"\n"}]}] });


define("rgl!components/menu.html", function(){ return [{"type":"element","tag":"ul","attrs":[{"type":"attribute","name":"class","value":"nav nav-sidebar"}],"children":[{"type":"text","text":"\n  "},{"type":"list","sequence":{"type":"expression","body":"_c_._sg_('menus', _d_, 1)","constant":false,"setbody":"_c_._ss_('menus',_p_,_d_, '=', 1)"},"variable":"menu","body":[{"type":"text","text":"\n    "},{"type":"element","tag":"li","attrs":[{"type":"attribute","name":"class","value":{"type":"expression","body":"_c_._sg_('state', _d_, 1)['is'](_c_._sg_('state', _c_._sg_('menu', _d_, 1)))?'active':''","constant":false,"setbody":false}}],"children":[{"type":"element","tag":"a","attrs":[{"type":"attribute","name":"href","value":{"type":"expression","body":"['#!',_c_._sg_('url', _c_._sg_('menu', _d_, 1))].join('')","constant":false,"setbody":false}}],"children":[{"type":"expression","body":"_c_._sg_('name', _c_._sg_('menu', _d_, 1))","constant":false,"setbody":"_c_._ss_('name',_p_,_c_._sg_('menu', _d_, 1), '=', 0)"}]}]},{"type":"text","text":"\n  "}]},{"type":"text","text":"\n"}]}] });

define('components/menu.js',["regularjs", "rgl!./menu.html"], function( Regular, tpl ){

  var Menu = Regular.extend({
    template: tpl,
    config: function(data){
      data.state.on("end", this.$update.bind(this))
    }
  })

  Regular.component("app-menu", Menu);

  return Menu;
});
define('module/app.js',["regularjs", "rgl!./app.html", "../components/menu.js"], function( Regular, tpl ){


  return Regular.extend({
    template: tpl,

    config: function(data){
      data.menus = [
        {url: '/',name: "Home", state: "app.index" },
        {url: '/blog', name: "Blog", state: 'app.blog'},
        {url: '/chat', name: "Chat", state: 'app.chat'}
      ]
    },
    login: function(username, password){
      this.$state.user = {
        name: username,
        id: -1,
        avatar: "https://avatars1.githubusercontent.com/u/731333?v=3&s=460"
      }

      try{
        localStorage.setItem("username", username);
      }catch(e){}
      

      return false;
    },
    logout: function(){

      this.$state.user = null;
      this.$state.go("app.index");
      try{
        localStorage.setItem("username", "");
      }catch(e){}
      return false;
    }
  })
});

define("rgl!module/blog.html", function(){ return [{"type":"element","tag":"h1","attrs":[{"type":"attribute","name":"class","value":"page-header"}],"children":[{"type":"text","text":"Blog"}]},{"type":"text","text":"\n"},{"type":"element","tag":"nav","attrs":[{"type":"attribute","name":"class","value":"navbar navbar-default"}],"children":[{"type":"text","text":"\n  "},{"type":"element","tag":"div","attrs":[{"type":"attribute","name":"class","value":"container-fluid"}],"children":[{"type":"text","text":"\n    "},{"type":"element","tag":"div","attrs":[{"type":"attribute","name":"id","value":"navbar"},{"type":"attribute","name":"class","value":"navbar-collapse collapse"}],"children":[{"type":"text","text":"\n      "},{"type":"element","tag":"ul","attrs":[{"type":"attribute","name":"class","value":"nav navbar-nav"}],"children":[{"type":"text","text":"\n        "},{"type":"element","tag":"li","attrs":[{"type":"attribute","name":"class","value":{"type":"expression","body":"_c_._sg_('$state', _c_)['is']('app.blog.list')?'active':''","constant":false,"setbody":false}}],"children":[{"type":"text","text":"\n          "},{"type":"element","tag":"a","attrs":[{"type":"attribute","name":"href","value":{"type":"expression","body":"(function(_t_){_t_ = _c_._f_('encode' ).get.call( _c_,_t_);return _t_})('app.blog.list')","constant":true,"setbody":false}}],"children":[{"type":"text","text":"List"}]},{"type":"text","text":"\n        "}]},{"type":"text","text":"\n        "},{"type":"element","tag":"li","attrs":[{"type":"attribute","name":"class","value":{"type":"expression","body":"_c_._sg_('$state', _c_)['is']('app.blog.detail')?'active':''","constant":false,"setbody":false}}],"children":[{"type":"text","text":"\n          "},{"type":"element","tag":"a","attrs":[{"type":"attribute","name":"href","value":"javascript:;"}],"children":[{"type":"text","text":"Detail"}]},{"type":"text","text":"\n        "}]},{"type":"text","text":"\n        "},{"type":"element","tag":"li","attrs":[{"type":"attribute","name":"class","value":{"type":"expression","body":"_c_._sg_('$state', _c_)['is']('app.blog.edit')?'active':''","constant":false,"setbody":false}}],"children":[{"type":"text","text":"\n          "},{"type":"element","tag":"a","attrs":[{"type":"attribute","name":"href","value":{"type":"expression","body":"(function(_t_){_t_ = _c_._f_('encode' ).get.call( _c_,_t_, {'id':(-1)});return _t_})('app.blog.edit')","constant":true,"setbody":false}}],"children":[{"type":"text","text":"Edit"}]},{"type":"text","text":"\n        "}]},{"type":"text","text":"\n      "}]},{"type":"text","text":"\n    "}]},{"type":"text","text":"\n    "}]},{"type":"text","text":"\n  "}]},{"type":"text","text":"\n"},{"type":"element","tag":"div","attrs":[{"type":"attribute","name":"class","value":"col-sm-12"},{"type":"attribute","name":"ref","value":"view"}],"children":[]},{"type":"text","text":"\n\n\n\n\n"}] });

define('module/blog.js',["regularjs", "rgl!./blog.html"], function( Regular, tpl ){
  return Regular.extend({
    template: tpl,
    config: function(){
      this.$state.on("end", this.$update.bind(this,null));
    }
  })
});
define('mock.js',[],function(){
  // for chat root



  var i = 0;

  var random = function(min, max){
    return Math.floor(Math.random() * ( max - min + 1 )) + min;
  }


  // for chat
  i = 0;
  var users = []
  while( (i++) < 100 ) {
    users.push({
      id: i,
      name: "user " + i,
      email: random(10, 30) + "@163.com" ,
      avatar: "http://www.gravatar.com/avatar/205e460b479e2e5b48aec07710c08d10"
    })
  }

  i=0;
  var messages = []
  while( (i++) < 3 ) {
    messages.push({
      id: i,
      user: users[random(0, 99)],
      content: new Array(10).join(" message " + i + " content "),
      time: +new Date,
      reply:[]
    })
  }

  i = 0;
  var blogs = []
  while( (i++) < 100 ) {
    blogs.push({
      id: i,
      title: "post " + i,
      content: new Array(100).join(" post " + i + " content "),
      user: users[random(0, 99)],
      time: +new Date()
    })
  }


  var limit = 10;

  return {
    blogs: blogs,
    users: users,
    messages: messages,
    // help us to find specifed item in mock list.
    find: function(id, list){
      var len = list.length;
      for(;len--;){
        if(list[len].id == id) return list[len]
      }
    },
    remove: function(id, list){
      var len = list.length;
      for(;len--;){
        if(list[len].id == id) return list.splice(len,1);
      }
    },
    random: random
  }
});

define("rgl!module/chat.html", function(){ return [{"type":"element","tag":"div","attrs":[{"type":"attribute","name":"class","value":"panel panel-primary"}],"children":[{"type":"text","text":"\n  "},{"type":"element","tag":"div","attrs":[{"type":"attribute","name":"class","value":"panel-heading"}],"children":[{"type":"text","text":"\n    "},{"type":"element","tag":"h3","attrs":[{"type":"attribute","name":"class","value":"panel-title"}],"children":[{"type":"text","text":"Chat Room "},{"type":"element","tag":"span","attrs":[{"type":"attribute","name":"class","value":"badge"}],"children":[{"type":"expression","body":"_c_._sg_('length', _c_._sg_('messages', _d_, 1))","constant":false,"setbody":"_c_._ss_('length',_p_,_c_._sg_('messages', _d_, 1), '=', 0)"}]}]},{"type":"text","text":"\n  "}]},{"type":"text","text":"\n  "},{"type":"element","tag":"div","attrs":[{"type":"attribute","name":"class","value":"panel-body"}],"children":[{"type":"text","text":"\n  "},{"type":"element","tag":"div","attrs":[{"type":"attribute","name":"class","value":"message-list"}],"children":[{"type":"text","text":"\n  "},{"type":"list","sequence":{"type":"expression","body":"_c_._sg_('messages', _d_, 1)","constant":false,"setbody":"_c_._ss_('messages',_p_,_d_, '=', 1)"},"variable":"message","body":[{"type":"text","text":"\n  "},{"type":"element","tag":"div","attrs":[{"type":"attribute","name":"class","value":"media"},{"type":"attribute","name":"r-animation","value":"on: enter; class: animated fadeInY; on: leave; class: animated fadeOutY;"}],"children":[{"type":"text","text":"\n    "},{"type":"element","tag":"a","attrs":[{"type":"attribute","name":"class","value":"media-left"},{"type":"attribute","name":"href","value":"#"}],"children":[{"type":"text","text":"\n      "},{"type":"element","tag":"img","attrs":[{"type":"attribute","name":"src","value":{"type":"expression","body":"_c_._sg_('avatar', _c_._sg_('user', _c_._sg_('message', _d_, 1)))","constant":false,"setbody":"_c_._ss_('avatar',_p_,_c_._sg_('user', _c_._sg_('message', _d_, 1)), '=', 0)"}},{"type":"attribute","name":"style","value":"width: 64px; height: 64px;"}]},{"type":"text","text":"\n    "}]},{"type":"text","text":"\n    "},{"type":"element","tag":"div","attrs":[{"type":"attribute","name":"class","value":"media-body"}],"children":[{"type":"text","text":"\n      "},{"type":"element","tag":"h4","attrs":[{"type":"attribute","name":"class","value":"media-heading"}],"children":[{"type":"element","tag":"a","attrs":[{"type":"attribute","name":"href","value":{"type":"expression","body":"['#!/user/',_c_._sg_('id', _c_._sg_('user', _c_._sg_('message', _d_, 1)))].join('')","constant":false,"setbody":false}}],"children":[{"type":"expression","body":"_c_._sg_('name', _c_._sg_('user', _c_._sg_('message', _d_, 1)))","constant":false,"setbody":"_c_._ss_('name',_p_,_c_._sg_('user', _c_._sg_('message', _d_, 1)), '=', 0)"}]},{"type":"text","text":" \n      "},{"type":"element","tag":"span","attrs":[{"type":"attribute","name":"class","value":"small"}],"children":[{"type":"expression","body":"(function(_t_){_t_ = _c_._f_('format' ).get.call( _c_,_t_);return _t_})(_c_._sg_('time', _c_._sg_('message', _d_, 1)))","constant":false,"setbody":"_c_._ss_('time',(function(_t_){_t_ = _c_._f_('format' ).set.call( _c_,_t_);return _t_})(_p_),_c_._sg_('message', _d_, 1), '=', 0)"}]},{"type":"text","text":"\n      "},{"type":"element","tag":"a","attrs":[{"type":"attribute","name":"href","value":"#"},{"type":"attribute","name":"r-hide","value":{"type":"expression","body":"_c_._sg_('user', _c_._sg_('message', _d_, 1))!==_c_._sg_('user', _c_._sg_('$state', _c_))","constant":false,"setbody":false}},{"type":"attribute","name":"on-click","value":{"type":"expression","body":"_c_['remove'](_c_._sg_('message_index', _d_, 1))","constant":false,"setbody":false}}],"children":[{"type":"text","text":"delete"}]},{"type":"text","text":"\n      "}]},{"type":"text","text":"\n      "},{"type":"expression","body":"_c_._sg_('content', _c_._sg_('message', _d_, 1))","constant":false,"setbody":"_c_._ss_('content',_p_,_c_._sg_('message', _d_, 1), '=', 0)"},{"type":"text","text":" \n    "}]},{"type":"text","text":"\n  "}]},{"type":"text","text":"\n  "}]},{"type":"text","text":"\n  "}]},{"type":"text","text":"\n    \n  "}]},{"type":"text","text":"\n    "},{"type":"element","tag":"div","attrs":[{"type":"attribute","name":"class","value":"row"}],"children":[{"type":"text","text":"\n      "},{"type":"element","tag":"div","attrs":[{"type":"attribute","name":"class","value":"col-sm-12"}],"children":[{"type":"text","text":"\n        "},{"type":"element","tag":"div","attrs":[{"type":"attribute","name":"class","value":"input-group"}],"children":[{"type":"text","text":"\n          "},{"type":"element","tag":"input","attrs":[{"type":"attribute","name":"type","value":"text"},{"type":"attribute","name":"class","value":"form-control"},{"type":"attribute","name":"r-model","value":{"type":"expression","body":"_c_._sg_('text', _d_, 1)","constant":false,"setbody":"_c_._ss_('text',_p_,_d_, '=', 1)"}},{"type":"attribute","name":"placeholder","value":"Say something for..."}]},{"type":"text","text":"\n          "},{"type":"element","tag":"span","attrs":[{"type":"attribute","name":"class","value":"input-group-btn"}],"children":[{"type":"text","text":"\n            "},{"type":"element","tag":"button","attrs":[{"type":"attribute","name":"class","value":"btn btn-primary"},{"type":"attribute","name":"type","value":"button"},{"type":"attribute","name":"on-click","value":{"type":"expression","body":"_c_['post'](_c_._sg_('text', _d_, 1))","constant":false,"setbody":false}}],"children":[{"type":"text","text":"Post Message!"}]},{"type":"text","text":"\n          "}]},{"type":"text","text":"\n        "}]}]}]}]}] });

define('module/chat.js',['require','../mock.js','rgl!./chat.html'],function(require){
  var mock = require("../mock.js");
  return {
    regularify: true,
    template: require("rgl!./chat.html"),
    enter: function(option){
      var page = option.page || 1;
      this.data.messages = mock.messages;
    },
    post: function(text){
      this.data.messages.push({
        id: mock.random(1000, 99999),
        user: this.$state.user,
        content: text,
        time: +new Date
      })

      this.data.text = "";
    },
    remove: function(index){
      this.data.messages.splice(index, 1);
      return false;
    }

  }
});

define("rgl!module/index.html", function(){ return [{"type":"element","tag":"div","attrs":[{"type":"attribute","name":"class","value":"jumbotron"}],"children":[{"type":"text","text":"\n  "},{"type":"element","tag":"div","attrs":[{"type":"attribute","name":"class","value":"container"}],"children":[{"type":"text","text":"\n    "},{"type":"element","tag":"h1","attrs":[],"children":[{"type":"text","text":"Hello!"}]},{"type":"text","text":"\n    "},{"type":"element","tag":"p","attrs":[],"children":[{"type":"text","text":"\n      This is a template for a simple marketing or informational website. It includes a large callout called a jumbotron and three supporting pieces of content. Use it as a starting point to create something more unique.\n    "}]},{"type":"text","text":"\n    "},{"type":"element","tag":"p","attrs":[],"children":[{"type":"text","text":"\n      "},{"type":"element","tag":"a","attrs":[{"type":"attribute","name":"class","value":"btn btn-primary btn-lg"},{"type":"attribute","name":"href","value":"#!/blog"},{"type":"attribute","name":"role","value":"button"}],"children":[{"type":"text","text":"See Blogs »"}]},{"type":"text","text":"\n    "}]},{"type":"text","text":"\n  "}]},{"type":"text","text":"\n"}]},{"type":"text","text":"\n"},{"type":"element","tag":"div","attrs":[{"type":"attribute","name":"class","value":"row"}],"children":[{"type":"text","text":"\n  "},{"type":"element","tag":"div","attrs":[{"type":"attribute","name":"class","value":"col-md-4"}],"children":[{"type":"text","text":"\n    "},{"type":"element","tag":"h2","attrs":[],"children":[{"type":"text","text":"Heading"},{"type":"element","tag":"span","attrs":[{"type":"attribute","name":"class","value":"label label-default"}],"children":[{"type":"text","text":"New"}]}]},{"type":"text","text":"\n    "},{"type":"element","tag":"p","attrs":[],"children":[{"type":"text","text":"\n      Donec id elit non mi porta gravida at eget metus. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Etiam porta sem malesuada magna mollis euismod. Donec sed odio dui.\n    "}]},{"type":"text","text":"\n    "},{"type":"element","tag":"p","attrs":[],"children":[{"type":"text","text":"\n    "}]},{"type":"text","text":"\n  "}]},{"type":"text","text":"\n  "},{"type":"element","tag":"div","attrs":[{"type":"attribute","name":"class","value":"col-md-4"}],"children":[{"type":"text","text":"\n    "},{"type":"element","tag":"h2","attrs":[],"children":[{"type":"text","text":"Heading"},{"type":"element","tag":"span","attrs":[{"type":"attribute","name":"class","value":"label label-default"}],"children":[{"type":"text","text":"New"}]}]},{"type":"text","text":"\n    "},{"type":"element","tag":"p","attrs":[],"children":[{"type":"text","text":"\n      Donec id elit non mi porta gravida at eget metus. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Etiam porta sem malesuada magna mollis euismod. Donec sed odio dui.\n    "}]},{"type":"text","text":"\n    "},{"type":"element","tag":"p","attrs":[],"children":[{"type":"text","text":"\n    "}]},{"type":"text","text":"\n  "}]},{"type":"text","text":"\n  "},{"type":"element","tag":"div","attrs":[{"type":"attribute","name":"class","value":"col-md-4"}],"children":[{"type":"text","text":"\n    "},{"type":"element","tag":"h2","attrs":[],"children":[{"type":"text","text":"Heading"},{"type":"element","tag":"span","attrs":[{"type":"attribute","name":"class","value":"label label-default"}],"children":[{"type":"text","text":"New"}]}]},{"type":"text","text":"\n    "},{"type":"element","tag":"p","attrs":[],"children":[{"type":"text","text":"\n      Donec id elit non mi porta gravida at eget metus. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Etiam porta sem malesuada magna mollis euismod. Donec sed odio dui.\n    "}]},{"type":"text","text":"\n    "},{"type":"element","tag":"p","attrs":[],"children":[{"type":"text","text":"\n    "}]},{"type":"text","text":"\n  "}]},{"type":"text","text":"\n"}]}] });


define("rgl!module/user.html", function(){ return [{"type":"element","tag":"div","attrs":[],"children":[{"type":"text","text":"User Page"}]},{"type":"text","text":"\n"},{"type":"element","tag":"div","attrs":[{"type":"attribute","name":"ref","value":"view"}],"children":[]}] });

define('module/user.js',["regularjs", "rgl!./user.html"], function( Regular, tpl ){

  return Regular.extend({
    template: tpl
  })

});

define("rgl!module/blog.detail.html", function(){ return [{"type":"element","tag":"div","attrs":[{"type":"attribute","name":"class","value":"blog-post"}],"children":[{"type":"text","text":"\n  "},{"type":"element","tag":"h2","attrs":[{"type":"attribute","name":"class","value":"blog-post-title"}],"children":[{"type":"expression","body":"_c_._sg_('title', _c_._sg_('blog', _d_, 1))","constant":false,"setbody":"_c_._ss_('title',_p_,_c_._sg_('blog', _d_, 1), '=', 0)"},{"type":"text","text":"\n  "},{"type":"if","test":{"type":"expression","body":"_c_._sg_('preview', _d_, 1)","constant":false,"setbody":"_c_._ss_('preview',_p_,_d_, '=', 1)"},"consequent":[{"type":"text","text":"\n  "},{"type":"element","tag":"span","attrs":[{"type":"attribute","name":"class","value":"badge"}],"children":[{"type":"text","text":"preview"}]},{"type":"text","text":"\n  "},{"type":"element","tag":"a","attrs":[{"type":"attribute","name":"href","value":{"type":"expression","body":"(function(_t_){_t_ = _c_._f_('encode' ).get.call( _c_,_t_, {'id':_c_._sg_('id', _c_._sg_('blog', _d_, 1))});return _t_})('app.blog.edit')","constant":false,"setbody":false}}],"children":[{"type":"text","text":"Return Edit"}]},{"type":"text","text":"\n  "}],"alternate":[{"type":"text","text":"\n  "},{"type":"element","tag":"a","attrs":[{"type":"attribute","name":"href","value":{"type":"expression","body":"(function(_t_){_t_ = _c_._f_('encode' ).get.call( _c_,_t_, {'id':_c_._sg_('id', _c_._sg_('blog', _d_, 1))});return _t_})('app.blog.edit')","constant":false,"setbody":false}}],"children":[{"type":"text","text":"Edit"}]},{"type":"text","text":"\n  "}]},{"type":"text","text":"\n"}]},{"type":"text","text":"\n"},{"type":"element","tag":"div","attrs":[{"type":"attribute","name":"class","value":"blog-post-meta"}],"children":[{"type":"text","text":"\n  "},{"type":"expression","body":"(function(_t_){_t_ = _c_._f_('format' ).get.call( _c_,_t_);return _t_})(_c_._sg_('time', _c_._sg_('blog', _d_, 1)))","constant":false,"setbody":"_c_._ss_('time',(function(_t_){_t_ = _c_._f_('format' ).set.call( _c_,_t_);return _t_})(_p_),_c_._sg_('blog', _d_, 1), '=', 0)"},{"type":"text","text":"\n  "},{"type":"element","tag":"a","attrs":[{"type":"attribute","name":"href","value":"javascript:;"}],"children":[{"type":"expression","body":"_c_._sg_('name', _c_._sg_('user', _c_._sg_('blog', _d_, 1)))","constant":false,"setbody":"_c_._ss_('name',_p_,_c_._sg_('user', _c_._sg_('blog', _d_, 1)), '=', 0)"}]},{"type":"text","text":"\n\n  "},{"type":"element","tag":"div","attrs":[{"type":"attribute","name":"class","value":"content"},{"type":"attribute","name":"r-html","value":{"type":"expression","body":"_c_._sg_('content', _c_._sg_('blog', _d_, 1))","constant":false,"setbody":"_c_._ss_('content',_p_,_c_._sg_('blog', _d_, 1), '=', 0)"}}],"children":[]},{"type":"text","text":"\n"}]},{"type":"text","text":"\n\n"}]}] });


define('module/blog.detail.js',["regularjs", "rgl!./blog.detail.html",'../mock.js'], function( Regular, tpl , mock){

  return Regular.extend({
    template: tpl,
    // when preview in edit page
    config: function(data){
      if(data.title){
        data.blog = {
          title: data.title,
          content: data.content
        }
        data.preview = true;
      }
    },
    enter: function(option){
      this.update(option);
    },
    update: function(option){
      var data = this.data;
      var id = parseInt(option.param.id);
      data.blog = mock.find( id, mock.blogs)
    }
  })
});

define("rgl!module/blog.list.html", function(){ return [{"type":"element","tag":"h2","attrs":[{"type":"attribute","name":"class","value":"sub-header"}],"children":[{"type":"text","text":"Bloging List"}]},{"type":"text","text":"\n"},{"type":"element","tag":"div","attrs":[{"type":"attribute","name":"class","value":"table-responsive"}],"children":[{"type":"text","text":"\n"},{"type":"element","tag":"pager","attrs":[{"type":"attribute","name":"total","value":{"type":"expression","body":"_c_._sg_('total', _d_, 1)","constant":false,"setbody":"_c_._ss_('total',_p_,_d_, '=', 1)"}},{"type":"attribute","name":"current","value":{"type":"expression","body":"_c_._sg_('current', _d_, 1)","constant":false,"setbody":"_c_._ss_('current',_p_,_d_, '=', 1)"}},{"type":"attribute","name":"on-nav","value":{"type":"expression","body":"_c_['refresh'](_c_._sg_('page', _c_._sg_('$event', _d_, 1)),true)","constant":false,"setbody":false}}],"children":[]},{"type":"text","text":"\n  "},{"type":"element","tag":"table","attrs":[{"type":"attribute","name":"class","value":"table table-striped"}],"children":[{"type":"text","text":"\n    "},{"type":"element","tag":"thead","attrs":[],"children":[{"type":"text","text":"\n      "},{"type":"element","tag":"tr","attrs":[],"children":[{"type":"text","text":"\n        "},{"type":"element","tag":"th","attrs":[],"children":[{"type":"text","text":"id"}]},{"type":"text","text":"\n        "},{"type":"element","tag":"th","attrs":[],"children":[{"type":"text","text":"author"}]},{"type":"text","text":"\n        "},{"type":"element","tag":"th","attrs":[],"children":[{"type":"text","text":"time"}]},{"type":"text","text":"\n        "},{"type":"element","tag":"th","attrs":[],"children":[{"type":"text","text":"title"}]},{"type":"text","text":"\n        "},{"type":"element","tag":"th","attrs":[],"children":[{"type":"text","text":"abstract"}]},{"type":"text","text":"\n        "},{"type":"element","tag":"th","attrs":[],"children":[{"type":"text","text":"action"}]},{"type":"text","text":"\n      "}]},{"type":"text","text":"\n    "}]},{"type":"text","text":"\n    "},{"type":"element","tag":"tbody","attrs":[],"children":[{"type":"text","text":"\n      "},{"type":"list","sequence":{"type":"expression","body":"_c_._sg_('blogs', _d_, 1)","constant":false,"setbody":"_c_._ss_('blogs',_p_,_d_, '=', 1)"},"variable":"blog","body":[{"type":"text","text":"\n      "},{"type":"element","tag":"tr","attrs":[],"children":[{"type":"text","text":"\n        "},{"type":"element","tag":"td","attrs":[],"children":[{"type":"expression","body":"_c_._sg_('id', _c_._sg_('blog', _d_, 1))","constant":false,"setbody":"_c_._ss_('id',_p_,_c_._sg_('blog', _d_, 1), '=', 0)"}]},{"type":"text","text":"\n        "},{"type":"element","tag":"td","attrs":[],"children":[{"type":"expression","body":"_c_._sg_('name', _c_._sg_('user', _c_._sg_('blog', _d_, 1)))","constant":false,"setbody":"_c_._ss_('name',_p_,_c_._sg_('user', _c_._sg_('blog', _d_, 1)), '=', 0)"}]},{"type":"text","text":"\n        "},{"type":"element","tag":"td","attrs":[],"children":[{"type":"expression","body":"(function(_t_){_t_ = _c_._f_('format' ).get.call( _c_,_t_);return _t_})(_c_._sg_('time', _c_._sg_('blog', _d_, 1)))","constant":false,"setbody":"_c_._ss_('time',(function(_t_){_t_ = _c_._f_('format' ).set.call( _c_,_t_);return _t_})(_p_),_c_._sg_('blog', _d_, 1), '=', 0)"}]},{"type":"text","text":"\n        "},{"type":"element","tag":"td","attrs":[],"children":[{"type":"expression","body":"_c_._sg_('title', _c_._sg_('blog', _d_, 1))","constant":false,"setbody":"_c_._ss_('title',_p_,_c_._sg_('blog', _d_, 1), '=', 0)"}]},{"type":"text","text":"\n        "},{"type":"element","tag":"td","attrs":[],"children":[{"type":"expression","body":"_c_._sg_('content', _c_._sg_('blog', _d_, 1))['slice'](0,30)+'...'","constant":false,"setbody":false}]},{"type":"text","text":"\n        "},{"type":"element","tag":"td","attrs":[],"children":[{"type":"text","text":"\n        "},{"type":"element","tag":"div","attrs":[{"type":"attribute","name":"class","value":"btn-group"},{"type":"attribute","name":"role","value":"group"},{"type":"attribute","name":"aria-label","value":"..."}],"children":[{"type":"text","text":"\n          "},{"type":"element","tag":"a","attrs":[{"type":"attribute","name":"href","value":{"type":"expression","body":"(function(_t_){_t_ = _c_._f_('encode' ).get.call( _c_,_t_, {'id':_c_._sg_('id', _c_._sg_('blog', _d_, 1))});return _t_})('app.blog.edit')","constant":false,"setbody":false}},{"type":"attribute","name":"class","value":"btn btn-default"}],"children":[{"type":"text","text":"edit"}]},{"type":"text","text":"\n          "},{"type":"element","tag":"a","attrs":[{"type":"attribute","name":"href","value":{"type":"expression","body":"(function(_t_){_t_ = _c_._f_('encode' ).get.call( _c_,_t_, {'id':_c_._sg_('id', _c_._sg_('blog', _d_, 1))});return _t_})('app.blog.detail')","constant":false,"setbody":false}},{"type":"attribute","name":"class","value":"btn btn-default"}],"children":[{"type":"text","text":"view"}]},{"type":"text","text":"\n          "},{"type":"element","tag":"a","attrs":[{"type":"attribute","name":"href","value":"#"},{"type":"attribute","name":"on-click","value":{"type":"expression","body":"_c_['remove'](_c_._sg_('blog', _d_, 1),_c_._sg_('blog_index', _d_, 1))","constant":false,"setbody":false}},{"type":"attribute","name":"class","value":"btn btn-danger"}],"children":[{"type":"text","text":"delete"}]},{"type":"text","text":"\n        "}]},{"type":"text","text":"\n      "}]},{"type":"text","text":"\n      "}]},{"type":"text","text":"\n      "}]},{"type":"text","text":"\n    "}]},{"type":"text","text":"\n  "}]},{"type":"text","text":"\n  "},{"type":"element","tag":"pager","attrs":[{"type":"attribute","name":"total","value":{"type":"expression","body":"_c_._sg_('total', _d_, 1)","constant":false,"setbody":"_c_._ss_('total',_p_,_d_, '=', 1)"}},{"type":"attribute","name":"current","value":{"type":"expression","body":"_c_._sg_('current', _d_, 1)","constant":false,"setbody":"_c_._ss_('current',_p_,_d_, '=', 1)"}},{"type":"attribute","name":"on-nav","value":{"type":"expression","body":"_c_['refresh'](_c_._sg_('page', _c_._sg_('$event', _d_, 1)),true)","constant":false,"setbody":false}}],"children":[]},{"type":"text","text":"\n"}]}] });


define("rgl!components/pager.html", function(){ return [{"type":"element","tag":"ul","attrs":[{"type":"attribute","name":"class","value":"pagination"}],"children":[{"type":"text","text":"\n  "},{"type":"element","tag":"li","attrs":[{"type":"attribute","name":"on-click","value":{"type":"expression","body":"_c_['nav'](_c_._sg_('current', _d_, 1)-1)","constant":false,"setbody":false}},{"type":"attribute","name":"class","value":{"type":"expression","body":"['pageprv ',_c_._sg_('current', _d_, 1)==1?'disabled':''].join('')","constant":false,"setbody":false}}],"children":[{"type":"element","tag":"a","attrs":[{"type":"attribute","name":"href","value":"#"}],"children":[{"type":"text","text":"PREV"}]}]},{"type":"text","text":"\n  "},{"type":"if","test":{"type":"expression","body":"_c_._sg_('total', _d_, 1)-5>_c_._sg_('show', _d_, 1)*2","constant":false,"setbody":false},"consequent":[{"type":"text","text":" \n  "},{"type":"element","tag":"li","attrs":[{"type":"attribute","name":"on-click","value":{"type":"expression","body":"_c_['nav'](1)","constant":false,"setbody":false}},{"type":"attribute","name":"class","value":{"type":"expression","body":"_c_._sg_('current', _d_, 1)==1?'active':''","constant":false,"setbody":false}}],"children":[{"type":"element","tag":"a","attrs":[{"type":"attribute","name":"href","value":"#"}],"children":[{"type":"text","text":"1"}]}]},{"type":"text","text":"\n  "},{"type":"element","tag":"li","attrs":[],"children":[{"type":"if","test":{"type":"expression","body":"_c_._sg_('begin', _d_, 1)>2","constant":false,"setbody":false},"consequent":[{"type":"element","tag":"a","attrs":[],"children":[{"type":"text","text":"..."}]}],"alternate":[]}]},{"type":"text","text":"\n  "},{"type":"list","sequence":{"type":"expression","body":"(function(start,end){var res = [],step=end>start?1:-1; for(var i = start; end>start?i <= end: i>=end; i=i+step){res.push(i); } return res })(_c_._sg_('begin', _d_, 1),_c_._sg_('end', _d_, 1))","constant":false,"setbody":false},"variable":"i","body":[{"type":"text","text":"\n    "},{"type":"element","tag":"li","attrs":[{"type":"attribute","name":"on-click","value":{"type":"expression","body":"_c_['nav'](_c_._sg_('i', _d_, 1))","constant":false,"setbody":false}},{"type":"attribute","name":"class","value":{"type":"expression","body":"_c_._sg_('current', _d_, 1)==_c_._sg_('i', _d_, 1)?'active':''","constant":false,"setbody":false}}],"children":[{"type":"element","tag":"a","attrs":[{"type":"attribute","name":"href","value":"#"}],"children":[{"type":"expression","body":"_c_._sg_('i', _d_, 1)","constant":false,"setbody":"_c_._ss_('i',_p_,_d_, '=', 1)"}]}]},{"type":"text","text":" \n  "}]},{"type":"text","text":"\n  "},{"type":"if","test":{"type":"expression","body":"(_c_._sg_('end', _d_, 1)<_c_._sg_('total', _d_, 1)-1)","constant":false,"setbody":false},"consequent":[{"type":"element","tag":"li","attrs":[],"children":[{"type":"element","tag":"a","attrs":[],"children":[{"type":"text","text":"..."}]}]},{"type":"text","text":" "}],"alternate":[]},{"type":"text","text":"\n  "},{"type":"element","tag":"li","attrs":[{"type":"attribute","name":"on-click","value":{"type":"expression","body":"_c_['nav'](_c_._sg_('total', _d_, 1))","constant":false,"setbody":false}},{"type":"attribute","name":"class","value":{"type":"expression","body":"_c_._sg_('current', _d_, 1)==_c_._sg_('total', _d_, 1)?'active':''","constant":false,"setbody":false}}],"children":[{"type":"element","tag":"a","attrs":[{"type":"attribute","name":"href","value":"#"}],"children":[{"type":"expression","body":"_c_._sg_('total', _d_, 1)","constant":false,"setbody":"_c_._ss_('total',_p_,_d_, '=', 1)"}]}]},{"type":"text","text":" \n  "}],"alternate":[{"type":"text","text":"\n  "},{"type":"list","sequence":{"type":"expression","body":"(function(start,end){var res = [],step=end>start?1:-1; for(var i = start; end>start?i <= end: i>=end; i=i+step){res.push(i); } return res })(1,_c_._sg_('total', _d_, 1))","constant":false,"setbody":false},"variable":"i","body":[{"type":"text","text":" \n  "},{"type":"element","tag":"li","attrs":[{"type":"attribute","name":"on-click","value":{"type":"expression","body":"_c_['nav'](_c_._sg_('i', _d_, 1))","constant":false,"setbody":false}},{"type":"attribute","name":"class","value":{"type":"expression","body":"_c_._sg_('current', _d_, 1)==_c_._sg_('i', _d_, 1)?'active':''","constant":false,"setbody":false}}],"children":[{"type":"element","tag":"a","attrs":[{"type":"attribute","name":"href","value":"#"}],"children":[{"type":"expression","body":"_c_._sg_('i', _d_, 1)","constant":false,"setbody":"_c_._ss_('i',_p_,_d_, '=', 1)"}]}]},{"type":"text","text":" \n  "}]},{"type":"text","text":"\n  "}]},{"type":"text","text":"\n  "},{"type":"element","tag":"li","attrs":[{"type":"attribute","name":"on-click","value":{"type":"expression","body":"_c_['nav'](_c_._sg_('current', _d_, 1)+1)","constant":false,"setbody":false}},{"type":"attribute","name":"class","value":{"type":"expression","body":"['pagenxt ',_c_._sg_('current', _d_, 1)==_c_._sg_('total', _d_, 1)?'disabled':''].join('')","constant":false,"setbody":false}}],"children":[{"type":"element","tag":"a","attrs":[{"type":"attribute","name":"href","value":"#"}],"children":[{"type":"text","text":"NEXT"}]}]},{"type":"text","text":"\n"}]}] });

define('components/pager.js',["regularjs", "rgl!./pager.html"], function( Regular, tpl ){

  var Pager = Regular.extend({
      template: tpl,
      // is called before compile. 一般用来处理数据
      config: function(data){
        var count =  5;
        var show = data.show = Math.floor( count/2 );
        data.current = parseInt(data.current || 1);
        data.total = parseInt(data.total || 1);

        this.$watch(['current', 'total'], function( current, total ){
          data.begin = current - show;
          data.end = current + show;
          if(data.begin < 2) data.begin = 2;
          if(data.end > data.total-1) data.end = data.total-1;
          if(current-data.begin <= 1) data.end = data.end + show + data.begin- current;
          if(data.end - current <= 1) data.begin = data.begin-show-current+ data.end;
        });
      },
      nav: function(page){
        var data = this.data;
        if(page < 1) return false;
        if(page > data.total) return false;
        if(page === data.current) return false;
        var evObj = {page: page}
        this.$emit('nav', evObj);
        if(!evObj.stop){
          data.current = page;
        }
        // preventDefault
        return false;
      }
    });

  return Pager
})
;
define('module/blog.list.js',[
  "regularjs", 
  "rgl!./blog.list.html", 
  '../components/pager.js',
  '../mock.js'
  ], function( Regular, tpl ,Pager, mock ){

  return Regular.extend({
    template: tpl,
    enter: function(option){
      this.update(option);
    },
    update: function(option){
      this.refresh(option.param.page || 1);
    },
    refresh: function(page, redirect){
      if(redirect) return this.$state.go("~", {param: {page: page}})
      var data = this.data;
      page = parseInt(page, 10);
      data.total = Math.floor(mock.blogs.length / 10);
      data.blogs = mock.blogs.slice( (page-1) * 10, page * 10);
      data.current = page;
      return false;
    },
    remove: function( blog, index){
      var data = this.data;

      mock.remove(blog.id, mock.blogs); 

      data.blogs.splice(index,1);
      
      return false; 
    }

  }).component("pager", Pager);
  
})



;

define("rgl!module/blog.edit.html", function(){ return [{"type":"element","tag":"h2","attrs":[],"children":[{"type":"expression","body":"_c_._sg_('id', _c_._sg_('$param', _d_, 1))=='-1'?'Add':'Edit'","constant":false,"setbody":false},{"type":"text","text":" Post"}]},{"type":"text","text":"\n"},{"type":"element","tag":"div","attrs":[{"type":"attribute","name":"class","value":"row"}],"children":[{"type":"text","text":"\n  "},{"type":"element","tag":"div","attrs":[{"type":"attribute","name":"class","value":"col-md-10"}],"children":[{"type":"text","text":"\n    "},{"type":"element","tag":"form","attrs":[],"children":[{"type":"text","text":"\n      "},{"type":"element","tag":"div","attrs":[{"type":"attribute","name":"class","value":"form-group"}],"children":[{"type":"text","text":"\n        "},{"type":"element","tag":"label","attrs":[{"type":"attribute","name":"for","value":"title"}],"children":[{"type":"text","text":"Title"}]},{"type":"text","text":"\n        "},{"type":"element","tag":"input","attrs":[{"type":"attribute","name":"type","value":"text"},{"type":"attribute","name":"class","value":"form-control"},{"type":"attribute","name":"r-model","value":{"type":"expression","body":"_c_._sg_('title', _d_, 1)","constant":false,"setbody":"_c_._ss_('title',_p_,_d_, '=', 1)"}},{"type":"attribute","name":"placeholder","value":"Enter Title"}]},{"type":"text","text":"\n      "}]},{"type":"text","text":"\n      "},{"type":"element","tag":"div","attrs":[{"type":"attribute","name":"class","value":"form-group"}],"children":[{"type":"text","text":"\n        "},{"type":"element","tag":"label","attrs":[{"type":"attribute","name":"for","value":"content"}],"children":[{"type":"text","text":"Tag"}]},{"type":"text","text":"\n        "},{"type":"element","tag":"input","attrs":[{"type":"attribute","name":"r-model","value":{"type":"expression","body":"(function(_t_){_t_ = _c_._f_('split' ).get.call( _c_,_t_);return _t_})(_c_._sg_('tags', _d_, 1))","constant":false,"setbody":"_c_._ss_('tags',(function(_t_){_t_ = _c_._f_('split' ).set.call( _c_,_t_);return _t_})(_p_),_d_, '=', 1)"}},{"type":"attribute","name":"placeholder","value":"Blog Content"},{"type":"attribute","name":"class","value":"form-control"},{"type":"attribute","name":"rows","value":"20"}]},{"type":"text","text":"\n        "},{"type":"expression","body":"(function(_t_){_t_ = _c_._f_('json' ).get.call( _c_,_t_);return _t_})(_c_._sg_('tags', _d_, 1))","constant":false,"setbody":"_c_._ss_('tags',(function(_t_){_t_ = _c_._f_('json' ).set.call( _c_,_t_);return _t_})(_p_),_d_, '=', 1)"},{"type":"text","text":"\n      "}]},{"type":"text","text":"\n      "},{"type":"element","tag":"div","attrs":[{"type":"attribute","name":"class","value":"form-group"}],"children":[{"type":"text","text":"\n        "},{"type":"element","tag":"label","attrs":[{"type":"attribute","name":"for","value":"content"}],"children":[{"type":"text","text":"Content"}]},{"type":"text","text":"\n        "},{"type":"element","tag":"textarea","attrs":[{"type":"attribute","name":"r-model","value":{"type":"expression","body":"_c_._sg_('content', _d_, 1)","constant":false,"setbody":"_c_._ss_('content',_p_,_d_, '=', 1)"}},{"type":"attribute","name":"placeholder","value":"Blog Content"},{"type":"attribute","name":"class","value":"form-control"},{"type":"attribute","name":"rows","value":"20"}],"children":[]},{"type":"text","text":"\n      "}]},{"type":"text","text":"\n       "},{"type":"element","tag":"a","attrs":[{"type":"attribute","name":"class","value":"btn btn-primary"},{"type":"attribute","name":"on-click","value":{"type":"expression","body":"_c_['submit'](_c_._sg_('title', _d_, 1),_c_._sg_('content', _d_, 1),_c_._sg_('id', _c_._sg_('$param', _d_, 1)))","constant":false,"setbody":false}}],"children":[{"type":"text","text":"Submit"}]},{"type":"text","text":"\n    "}]},{"type":"text","text":"\n  "}]},{"type":"text","text":"\n"}]}] });

define('module/blog.edit.js',["regularjs", "rgl!./blog.edit.html", "./blog.detail.js" ,"../mock.js"], function( Regular, tpl , BlogDetail , mock){
  return Regular.extend({
    template: tpl,
    submit: function( title, content, id){
      var data = this.data;
      var $state = this.$state, id= parseInt(id);
      if(id == "-1"){ //add
        mock.blogs.unshift({
          user: $state.user,
          time: +new Date,
          content: content,
          title: title,
          id: mock.random(20000,100000000)
        })
        alert("add success")
        this.$state.go("app.blog.list");
      }else{
        var blog = mock.find(id, mock.blogs)
        blog.title = title;
        blog.content = content;
        blog.time = +new Date;
        alert("edit success")
        this.$state.go("app.blog.detail", {param: {id: id}});
      }
    },
    config: function(data){
      data.tags = [];
    },
    enter: function(option){
      this.update(option);
    },
    update: function(option){
      var blog;
      var id = parseInt(option.param.id);
      if(option.param.id != "-1"){
        blog = mock.find( id , mock.blogs);
      }else{
        blog = {}
      }
      this.data.title = blog.title;
      this.data.content = blog.content;
    }
   
  }).component("blog-preview", BlogDetail)
  .filter('split', {
    get: function(value, split){
      return value.join(split || "-");
    },
    set: function(value, split){
      return  value.split(split || "-");
    }
  })
});

require.config({
    paths : {
        "rgl": '../bower_components/requirejs-regular/rgl',
        "regularjs": '../bower_components/regularjs/dist/regular',
        "restate": '../restate',
        "stateman": '../bower_components/stateman/stateman'
    },
    rgl: {
      BEGIN: '{',
      END: '}'
    }
});


require([
  'restate',
  'regularjs',
  "./module/app.js",
  "./module/blog.js",
  "./module/chat.js",
  "rgl!./module/index.html",
  "./module/user.js",
  "./module/blog.detail.js",
  "./module/blog.list.js",
  "./module/blog.edit.js"
], function(
    restate,
    Regular,
    Application,
    Blog,
    Chat,
    Index,
    User,
    BlogDetail,
    BlogList,
    BlogEdit
  ){


  var format = function(){
    function fix(str){
      str = "" + (str || "");
      return str.length <= 1? "0" + str : str;
    }
    var maps = {
      'yyyy': function(date){return date.getFullYear()},
      'MM': function(date){return fix(date.getMonth() + 1); },
      'dd': function(date){ return fix(date.getDate()) },
      'HH': function(date){ return fix(date.getHours()) },
      'mm': function(date){ return fix(date.getMinutes())}
    }

    var trunk = new RegExp(Object.keys(maps).join('|'),'g');
    return function(value, format){
      format = format || "yyyy-MM-dd HH:mm";
      value = new Date(value);

      return format.replace(trunk, function(capture){
        return maps[capture]? maps[capture](value): "";
      });
    }
  }();

  Regular.filter("format", format)



  // Start Stateman.

  var stateman = restate({
    view: document.getElementById("#app"), 
    Component: Regular
  });

  // store infomation in 
  try{
      var username = localStorage.getItem("username");
      if(username) stateman.user = {name: username, id: -1}
  }catch(e){}


  stateman
    // application core
    .state("app", Application, "")

    // home page
    .state("app.index", Index, { url: ""})

    // blog
    .state("app.blog", Blog)
    .state("app.blog.detail", BlogDetail, ":id/detail")
    .state("app.blog.list", BlogList, "")
    .state("app.blog.edit", BlogEdit, ":id/edit")

    //chat 
    .state("app.chat", Chat)

    // user
    .state("app.user", User, "user/:uid")

    // redirect when notfound
    .on("notfound", function(){
      this.go("app.index", {replace: true})
    })

    // authen, need login first
    .on("begin", function(option){
      if(option.current.name !== "app.index" && !this.user){
        option.stop();
        this.go("app.index", {replace: true})
        alert("You need Login first")
      } 
    })

    // start the routing
    .start({html5: false, prefix: "!"})


    window.Regular = Regular;


});

define("index", function(){});

