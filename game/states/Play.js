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
