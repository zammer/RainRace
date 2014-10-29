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
