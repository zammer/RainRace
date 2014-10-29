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
