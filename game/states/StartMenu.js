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
