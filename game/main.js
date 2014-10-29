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
