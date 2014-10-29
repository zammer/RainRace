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
