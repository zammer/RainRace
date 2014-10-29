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
