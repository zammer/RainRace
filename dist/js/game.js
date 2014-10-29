(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Lawnchair!
 * ---
 * clientside json store
 *
 */
var Lawnchair = function (options, callback) {
  // ensure Lawnchair was called as a constructor
  if (!(this instanceof Lawnchair)) return new Lawnchair(options, callback);

  // lawnchair requires json
  if (!JSON) throw 'JSON unavailable! Include http://www.json.org/json2.js to fix.'
  // options are optional; callback is not
  if (arguments.length <= 2 && arguments.length > 0) {
    callback = (typeof arguments[0] === 'function') ? arguments[0] : arguments[1];
    options  = (typeof arguments[0] === 'function') ? {} : arguments[0];
  } else {
    throw 'Incorrect # of ctor args!'
  }
  // TODO perhaps allow for pub/sub instead?
  if (typeof callback !== 'function') throw 'No callback was provided';

  // default configuration
  this.record = options.record || 'record'  // default for records
  this.name   = options.name   || 'records' // default name for underlying store

  // mixin first valid  adapter
  var adapter
  // if the adapter is passed in we try to load that only
  if (options.adapter) {
    for (var i = 0, l = Lawnchair.adapters.length; i < l; i++) {
      if (Lawnchair.adapters[i].adapter === options.adapter) {
        adapter = Lawnchair.adapters[i].valid() ? Lawnchair.adapters[i] : undefined;
        break;
      }
    }
    // otherwise find the first valid adapter for this env
  }
  else {
    for (var i = 0, l = Lawnchair.adapters.length; i < l; i++) {
      adapter = Lawnchair.adapters[i].valid() ? Lawnchair.adapters[i] : undefined
      if (adapter) break
    }
  }

  // we have failed
  if (!adapter) throw 'No valid adapter.'

  // yay! mixin the adapter
  for (var j in adapter)
    this[j] = adapter[j]

  // call init for each mixed in plugin
  for (var i = 0, l = Lawnchair.plugins.length; i < l; i++)
    Lawnchair.plugins[i].call(this)

  // init the adapter
  this.init(options, callback)
}

Lawnchair.adapters = []

/**
 * queues an adapter for mixin
 * ===
 * - ensures an adapter conforms to a specific interface
 *
 */
Lawnchair.adapter = function (id, obj) {
  // add the adapter id to the adapter obj
  // ugly here for a  cleaner dsl for implementing adapters
  obj['adapter'] = id
  // methods required to implement a lawnchair adapter
  var implementing = 'adapter valid init keys save batch get exists all remove nuke'.split(' ')
    ,   indexOf = this.prototype.indexOf
  // mix in the adapter
  for (var i in obj) {
    if (indexOf(implementing, i) === -1) throw 'Invalid adapter! Nonstandard method: ' + i
  }
  // if we made it this far the adapter interface is valid
  // insert the new adapter as the preferred adapter
  Lawnchair.adapters.splice(0,0,obj)
}

Lawnchair.plugins = []

/**
 * generic shallow extension for plugins
 * ===
 * - if an init method is found it registers it to be called when the lawnchair is inited
 * - yes we could use hasOwnProp but nobody here is an asshole
 */
Lawnchair.plugin = function (obj) {
  for (var i in obj)
    i === 'init' ? Lawnchair.plugins.push(obj[i]) : this.prototype[i] = obj[i]
}

/**
 * helpers
 *
 */
Lawnchair.prototype = {

  isArray: Array.isArray || function(o) { return Object.prototype.toString.call(o) === '[object Array]' },

  /**
   * this code exists for ie8... for more background see:
   * http://www.flickr.com/photos/westcoastlogic/5955365742/in/photostream
   */
  indexOf: function(ary, item, i, l) {
    if (ary.indexOf) return ary.indexOf(item)
    for (i = 0, l = ary.length; i < l; i++) if (ary[i] === item) return i
    return -1
  },

  // awesome shorthand callbacks as strings. this is shameless theft from dojo.
  lambda: function (callback) {
    return this.fn(this.record, callback)
  },

  // first stab at named parameters for terse callbacks; dojo: first != best // ;D
  fn: function (name, callback) {
    return typeof callback == 'string' ? new Function(name, callback) : callback
  },

  // returns a unique identifier (by way of Backbone.localStorage.js)
  // TODO investigate smaller UUIDs to cut on storage cost
  uuid: function () {
    var S4 = function () {
      return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    }
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
  },

  // a classic iterator
  each: function (callback) {
    var cb = this.lambda(callback)
    // iterate from chain
    if (this.__results) {
      for (var i = 0, l = this.__results.length; i < l; i++) cb.call(this, this.__results[i], i)
    }
    // otherwise iterate the entire collection
    else {
      this.all(function(r) {
        for (var i = 0, l = r.length; i < l; i++) cb.call(this, r[i], i)
      })
    }
    return this
  }
// --
};
/**
 * dom storage adapter
 * ===
 * - originally authored by Joseph Pecoraro
 *
 */
//
// TODO does it make sense to be chainable all over the place?
// chainable: nuke, remove, all, get, save, all
// not chainable: valid, keys
//
Lawnchair.adapter('dom', (function() {
  var storage = window.localStorage
  // the indexer is an encapsulation of the helpers needed to keep an ordered index of the keys
  var indexer = function(name) {
    return {
      // the key
      key: name + '._index_',
      // returns the index
      all: function() {
        var a  = storage.getItem(this.key)
        if (a) {
          a = JSON.parse(a)
        }
        if (a === null) storage.setItem(this.key, JSON.stringify([])) // lazy init
        return JSON.parse(storage.getItem(this.key))
      },
      // adds a key to the index
      add: function (key) {
        var a = this.all()
        a.push(key)
        storage.setItem(this.key, JSON.stringify(a))
      },
      // deletes a key from the index
      del: function (key) {
        var a = this.all(), r = []
        // FIXME this is crazy inefficient but I'm in a strata meeting and half concentrating
        for (var i = 0, l = a.length; i < l; i++) {
          if (a[i] != key) r.push(a[i])
        }
        storage.setItem(this.key, JSON.stringify(r))
      },
      // returns index for a key
      find: function (key) {
        var a = this.all()
        for (var i = 0, l = a.length; i < l; i++) {
          if (key === a[i]) return i
        }
        return false
      }
    }
  }

  // adapter api
  return {

    // ensure we are in an env with localStorage
    valid: function () {
      return !!storage
    },

    init: function (options, callback) {
      this.indexer = indexer(this.name)
      if (callback) this.fn(this.name, callback).call(this, this)
    },

    save: function (obj, callback) {
      var key = obj.key ? this.name + '.' + obj.key : this.name + '.' + this.uuid()
      // if the key is not in the index push it on
      if (this.indexer.find(key) === false) this.indexer.add(key)
      // now we kil the key and use it in the store colleciton
      delete obj.key;
      storage.setItem(key, JSON.stringify(obj))
      obj.key = key.slice(this.name.length + 1)
      if (callback) {
        this.lambda(callback).call(this, obj)
      }
      return this
    },

    batch: function (ary, callback) {
      var saved = []
      // not particularily efficient but this is more for sqlite situations
      for (var i = 0, l = ary.length; i < l; i++) {
        this.save(ary[i], function(r){
          saved.push(r)
        })
      }
      if (callback) this.lambda(callback).call(this, saved)
      return this
    },

    // accepts [options], callback
    keys: function(callback) {
      if (callback) {
        var name = this.name
          ,   keys = this.indexer.all().map(function(r){ return r.replace(name + '.', '') })
        this.fn('keys', callback).call(this, keys)
      }
      return this // TODO options for limit/offset, return promise
    },

    get: function (key, callback) {
      if (this.isArray(key)) {
        var r = []
        for (var i = 0, l = key.length; i < l; i++) {
          var k = this.name + '.' + key[i]
          var obj = storage.getItem(k)
          if (obj) {
            obj = JSON.parse(obj)
            obj.key = key[i]
            r.push(obj)
          }
        }
        if (callback) this.lambda(callback).call(this, r)
      } else {
        var k = this.name + '.' + key
        var  obj = storage.getItem(k)
        if (obj) {
          obj = JSON.parse(obj)
          obj.key = key
        }
        if (callback) this.lambda(callback).call(this, obj)
      }
      return this
    },

    exists: function (key, cb) {
      var exists = this.indexer.find(this.name+'.'+key) === false ? false : true ;
      this.lambda(cb).call(this, exists);
      return this;
    },
    // NOTE adapters cannot set this.__results but plugins do
    // this probably should be reviewed
    all: function (callback) {
      var idx = this.indexer.all()
        ,   r   = []
        ,   o
        ,   k
      for (var i = 0, l = idx.length; i < l; i++) {
        k     = idx[i] //v
        o     = JSON.parse(storage.getItem(k))
        o.key = k.replace(this.name + '.', '')
        r.push(o)
      }
      if (callback) this.fn(this.name, callback).call(this, r)
      return this
    },

    remove: function (keyOrObj, callback) {
      var key = this.name + '.' + ((keyOrObj.key) ? keyOrObj.key : keyOrObj)
      this.indexer.del(key)
      storage.removeItem(key)
      if (callback) this.lambda(callback).call(this)
      return this
    },

    nuke: function (callback) {
      this.all(function(r) {
        for (var i = 0, l = r.length; i < l; i++) {
          this.remove(r[i]);
        }
        if (callback) this.lambda(callback).call(this)
      })
      return this
    }
  }})());
// window.name code courtesy Remy Sharp: http://24ways.org/2009/breaking-out-the-edges-of-the-browser
Lawnchair.adapter('window-name', (function(index, store) {

  var data = window.top.name ? JSON.parse(window.top.name) : {}

  return {

    valid: function () {
      return typeof window.top.name != 'undefined'
    },

    init: function (options, callback) {
      data[this.name] = data[this.name] || {index:[],store:{}}
      index = data[this.name].index
      store = data[this.name].store
      this.fn(this.name, callback).call(this, this)
    },

    keys: function (callback) {
      this.fn('keys', callback).call(this, index)
      return this
    },

    save: function (obj, cb) {
      // data[key] = value + ''; // force to string
      // window.top.name = JSON.stringify(data);
      var key = obj.key || this.uuid()
      if (obj.key) delete obj.key
      this.exists(key, function(exists) {
        if (!exists) index.push(key)
        store[key] = obj
        window.top.name = JSON.stringify(data) // TODO wow, this is the only diff from the memory adapter
        obj.key = key
        if (cb) {
          this.lambda(cb).call(this, obj)
        }
      })
      return this
    },

    batch: function (objs, cb) {
      var r = []
      for (var i = 0, l = objs.length; i < l; i++) {
        this.save(objs[i], function(record) {
          r.push(record)
        })
      }
      if (cb) this.lambda(cb).call(this, r)
      return this
    },

    get: function (keyOrArray, cb) {
      var r;
      if (this.isArray(keyOrArray)) {
        r = []
        for (var i = 0, l = keyOrArray.length; i < l; i++) {
          r.push(store[keyOrArray[i]])
        }
      } else {
        r = store[keyOrArray]
        if (r) r.key = keyOrArray
      }
      if (cb) this.lambda(cb).call(this, r)
      return this
    },

    exists: function (key, cb) {
      this.lambda(cb).call(this, !!(store[key]))
      return this
    },

    all: function (cb) {
      var r = []
      for (var i = 0, l = index.length; i < l; i++) {
        var obj = store[index[i]]
        obj.key = index[i]
        r.push(obj)
      }
      this.fn(this.name, cb).call(this, r)
      return this
    },

    remove: function (keyOrArray, cb) {
      var del = this.isArray(keyOrArray) ? keyOrArray : [keyOrArray]
      for (var i = 0, l = del.length; i < l; i++) {
        delete store[del[i]]
        index.splice(this.indexOf(index, del[i]), 1)
      }
      window.top.name = JSON.stringify(data)
      if (cb) this.lambda(cb).call(this)
      return this
    },

    nuke: function (cb) {
      storage = {}
      index = []
      window.top.name = JSON.stringify(data)
      if (cb) this.lambda(cb).call(this)
      return this
    }
  }
/////
})());

module.exports = Lawnchair;

},{}],2:[function(require,module,exports){
'use strict';

//global variables
window.onload = function () {
  var game = new Phaser.Game(640, 960, Phaser.AUTO, 'rain-race');

  // Game States
  game.state.add('Boot', require('./states/Boot'));
  game.state.add('Choose', require('./states/Choose'));
  game.state.add('GameOver', require('./states/GameOver'));
  game.state.add('Play', require('./states/Play'));
  game.state.add('Preload', require('./states/Preload'));
  game.state.add('StartMenu', require('./states/StartMenu'));
  

  game.state.start('Boot');
};

},{"./states/Boot":3,"./states/Choose":4,"./states/GameOver":5,"./states/Play":6,"./states/Preload":7,"./states/StartMenu":8}],3:[function(require,module,exports){
'use strict';

function Boot() {
}

Boot.prototype = {

  preload: function() {
    this.load.image('preloader', 'assets/ajax-loader.gif');
  },

  create: function() {
    this.stage.forcePortrait = true;
    this.scale.setScreenSize(true);
    this.game.input.maxPointers = 1;
    this.game.state.start('Preload');
  }
};

module.exports = Boot;

},{}],4:[function(require,module,exports){
'use strict';

function Choose() {
  this.background;
  this.raindropsArray = [];
  this.odds = [];
  this.tokens;
  this.chosenRaindrop;
  this.chooseText;
  this.menu;
  this.tokenTotal;
};

Choose.prototype = {
  init: function(tokens){
    if(tokens)
    this.tokens = tokens;
  },

  preload: function() {

  },

  create: function() {
    this.odds = ['two', 'three', 'four'];
    this.background = this.add.sprite(0, 0, 'chooseMenuBG');

    this.menu = this.add.sprite(510, 0, 'menu');
    this.tokenTotal = this.add.sprite(10, 0, 'tokenTotal');

    this.createOddsIcons();
    this.createText();
  },

  createText: function(){
    this.chooseText = this.add.sprite(80, 200, 'chooseText');
  },

  createOddsIcons: function(){
    var index, randnum, raindrop;
    for(var i = 0; i < 5; i++) {
      index = i + 1,
        randnum = this.game.rnd.integerInRange(0, 2),
        raindrop = this.add.sprite((60*index)-45, 420, this.odds[randnum]);
      raindrop.scale.x = 0.4;
      raindrop.scale.y = 0.4;
      raindrop.inputEnabled = true;
      raindrop.events.onInputDown.add(this.chooseHandler, this);
      raindrop.name = 'Raindrop' + index;
      raindrop.odds = this.odds[randnum];
      this.raindropsArray.push(raindrop);
    }
  },

  chooseHandler: function(){
    this.chosenRaindrop = this.name;
    this.tokens--;
  },

  update: function() {
    if(this.game.input.activePointer.justPressed()) {
      this.game.state.start('Play', true, false, this.tokens, this.chosenRaindrop);
    }
  }
};

module.exports = Choose;

},{}],5:[function(require,module,exports){
'use strict';
var Lawnchair = require('../lib/Lawnchair');
function GameOver() {
  this.winningRaindrop;
}

GameOver.prototype = {
  init: function (tokens, winner) {
    this.tokens = tokens;
    this.winningRaindrop = winner;
  },

  preload: function () {
    Lawnchair(function(){
      var date = new Date();
      this.save({'app-config': {
        tokens: this.tokens,
        date: date
      }})
    })
  },
  create: function () {
    this.background = this.game.add.sprite(0, 0, 'background');
    this.createText();
  },

  createText: function(){
    var text = 'The winning raindrop was: \n \n' + this.winningRaindrop,
        style = { font: '20px helvetica', fill: '#000000', align: 'center'},
        t = this.add.text(this.world.centerX-120, this.world.centerY-60, text, style);
  },

  update: function () {

  }
};
module.exports = GameOver;

},{"../lib/Lawnchair":1}],6:[function(require,module,exports){
  'use strict';
  var Play = function () {
    this.background = null;
    this.totalRaindrops;
    this.raindrops;
    this.timer;
    this.winningline;
    this.maxYVelocity = 100;
    this.minYVelocity = 10;
    this.maxXVelocity = 6;
    this.minXVelocity = -6;
    this.maxTime = 2000;
    this.minTime = 200;
    this.tokensLeft;
    this.chosenRaindrop;
    this.won;
  }

  Play.prototype = {
    init: function (tokens, chosenRaindrop) {
      this.tokensLeft = tokens;
      this.chosenRaindrop = chosenRaindrop;
    },

    create: function() {
      var self = this;
      this.totalRaindrops = 5;
      this.won = false;

      this.timer = this.time.create(false);
      this.timer.loop(this.game.rnd.integerInRange(this.minTime, this.maxTime), this.changeVelocity, self);

      this.buildGame();
      this.tokensLeftText();
      this.addMenu();
      this.timer.start();
    },

    addMenu: function(){
      this.menu = this.add.sprite(510, 0, 'menu');
    },

    changeVelocity: function(){
      var self = this;
      this.raindrops.forEach(function(r){
        r.body.velocity.x = self.game.rnd.integerInRange(self.minXVelocity, self.maxXVelocity);
        r.body.velocity.y = self.game.rnd.integerInRange(self.minYVelocity, self.maxYVelocity);
      })
    },

    tokensLeftText: function() {
      this.tokenTotal = this.add.sprite(10, 0, 'tokenTotal');
      var text = this.tokensLeft;
      var style = { font: '20px helvetica', fill: '#000000', align: 'center'};
      var t = this.add.text(10, 10, text, style);
    },

    buildGame: function(){
      var r, index;
      this.game.physics.startSystem(Phaser.Physics.ARCADE);
      this.background = this.game.add.sprite(0, 0, 'background');
      this.winningline = this.game.add.sprite(0, 848, 'winningline');
      this.winningline.enableBody = true;
      this.game.physics.arcade.enable(this.winningline);

      this.raindrops = this.game.add.group();
      this.raindrops.enableBody = true;

      for (var i = 0; i < this.totalRaindrops; i++){
        index =  i + 1;
        r = this.raindrops.create((136*index) - 90, 20, 'slowRaindrop');
        this.game.physics.arcade.enable(r);
        r.name = 'Raindrop ' + (i+1);
        r.body.velocity.x = this.game.rnd.integerInRange(this.minXVelocity, this.maxXVelocity);
        r.body.velocity.y = this.game.rnd.integerInRange(this.minYVelocity, this.maxYVelocity);
        r.anchor.setTo(0.5, 0.5);
      }
    },

    winDetection: function(w, r){
      if(r.name === this.chosenRaindrop){
        this.won = true;
      }
      this.game.state.start('GameOver', true, false, this.won, this.tokensLeft);
    },

    update: function() {
      this.game.physics.arcade.overlap(this.raindrops, this.winningline, this.winDetection, null, this);
    }
  };

  module.exports = Play;

},{}],7:[function(require,module,exports){
'use strict';
var Lawnchair = require('../lib/Lawnchair');

function Preload() {
  this.asset = null;
  this.ready = false;
  this.tokens = null;
  this.date;
}

Preload.prototype = {

  preload: function() {
    this.date = new Date();

    this.asset = this.add.sprite(this.world.width / 2,  this.world.height / 2, 'preloader');
    this.asset.anchor.setTo(0.5, 0.5);

    this.load.onLoadComplete.addOnce(this.onLoadComplete, this);
    this.load.setPreloadSprite(this.asset);
    this.load.image('startMenuBG', 'assets/Raindrops.jpg');
    this.load.image('chooseMenuBG', 'assets/RaindropsChoose.jpg');
    this.load.image('chooseText', 'assets/chooseRaindropText.png');
    this.load.image('background', 'assets/Background.jpg');
    this.load.image('raceBtn', 'assets/raceBtn.png');
    this.load.image('slowRaindrop', 'assets/slowRaindrop.png');
    this.load.image('fastRaindrop', 'assets/fastRaindrop.png');
    this.load.image('menu', 'assets/menu.png');
    this.load.image('tokenTotal', 'assets/tokentotal.png');
    this.load.image('two', 'assets/2-1.png');
    this.load.image('three', 'assets/3-1.png');
    this.load.image('four', 'assets/4-1.png');
    this.load.image('winningline', 'assets/winningline.png');

    Lawnchair(function(){
      var timeDiff;
      this.get('app-config', function(config) {

        if(config && config.date){
          timeDiff = Preload.date - config.date;
        }

        if(config && config.tokens){
          if(config.tokens === 0 && timeDiff > 86400000){
            Preload.tokens = 10;
          } else {
            Preload.tokens = config.tokens;
          }
        } else {
          Preload.tokens = 10;
        }
      })
    })
  },

  create: function() {
    this.asset.cropEnabled = false;
  },

  update: function() {
    if(!!this.ready) {
      this.game.state.start('StartMenu', true, false, this.tokens);
    }
  },

  onLoadComplete: function() {
    this.ready = true;
  }
};

module.exports = Preload;

},{"../lib/Lawnchair":1}],8:[function(require,module,exports){
'use strict';

var Menu = function () {
  this.background;
  this.tokens;
};

Menu.prototype = {
  init: function(tokens){
    this.tokens = tokens;
  },

  preload: function() {

  },

  create: function() {
    this.background = this.add.sprite(0, 0, 'startMenuBG');
    this.raceBtn = this.add.sprite((this.world.width / 2) - 159, 600, 'raceBtn');
  },

  update: function() {
    if(this.game.input.activePointer.justPressed()) {
      this.game.state.start('Choose', true, false, this.tokens);
    }
  }
};

module.exports = Menu;

},{}]},{},[2])