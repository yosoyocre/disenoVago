;(function($, window, document, undefined) {

  'use strict';

  var pluginName = 'vago';
  var maxX;
  var maxY;

  function getRandomColor() {
    return 'rgba(' +
      Math.floor(Math.random() * 255) + ',' +
      Math.floor(Math.random() * 255) + ',' +
      Math.floor(Math.random() * 255) + ', 1)';
  }

  function cloneArray(a) {
    var b = [];

    for (var i = 0; i < a.length; i++) {
      if (a[i]) {
        b[i] = a[i].slice();
      }
    }

    return b;
  }

  function Vago(element, options) {
    var defaults = {
      background: getRandomColor(),
      color: getRandomColor(),
      points: Math.floor(Math.random() * 3) + 1,
      windowSize: 1,
      maxRadius: null,
      degradationLevel: 0.3,
    };

    this.element = element;
    this.settings = $.extend({}, defaults, options);
    this._defaults = defaults;
    this._name = pluginName;
    this.init();
  }

  $.extend(Vago.prototype, {
    logSettings: function() {
      var p;

      for (p in this.settings) {
        console.log(p, ':', this.settings[p]);
      }
    },

    getAverageRadius: function(matrix, x, y) {
        var i;
        var j;
        var radius;
        var averageRadius = 0;
        var n = 0;

        for (i = (this.settings.windowSize * -1); i <= this.settings.windowSize; i = i + 1) {
          for (j = (this.settings.windowSize * -1); j <= this.settings.windowSize; j = j + 1) {
            if (i === 0 && j === 0) {
              continue;
            }

            radius = this.getRadius(matrix, x + i, y + j);
            if (radius !== null) {
              averageRadius = averageRadius + radius;
              n++;
            }
          }
        }

        return n ? averageRadius / n : null;
      },

    getRadius: function(matrix, x, y) {
        if (x < 0 || x >= maxX) {
          return null;
        }

        if (y < 0 || y >= maxY) {
          return null;
        }

        if (!matrix[x]) {
          return null;
        }

        if (!matrix[x][y]) {
          return null;
        }

        return matrix[x][y];
      },

    init: function() {

      this.canvas = oCanvas.create({ canvas: this.element, background: this.settings.background });

      if (!this.settings.maxRadius) {
        this.settings.maxRadius = Math.floor(Math.min(this.canvas.width, this.canvas.height) / 100);
      }

      maxX = this.canvas.width / (this.settings.maxRadius * 2);
      maxY = this.canvas.height / (this.settings.maxRadius * 2);
      this.matrix = [];

      this.logSettings();

      var shouldIterate = true;
      var auxMatrix = [];
      var n;
      var i = 0;
      var j = 0;
      var degradation;
      var radius;
      var iterations = 0;

      for (n = 0; n < this.settings.points; n = n + 1) {
        i = Math.floor(Math.random() * maxX);
        j = Math.floor(Math.random() * maxY);

        if (!this.matrix[i]) {
          this.matrix[i] = [];
        }

        this.matrix[i][j] = this.settings.maxRadius;
      }

      auxMatrix = cloneArray(this.matrix);

      while (shouldIterate) {
        shouldIterate = false;

        iterations = iterations + 1;

        for (j = 0; j < maxY; j = j + 1) {
          for (i = 0; i < maxX; i = i + 1) {
            if (!auxMatrix[i]) {
              auxMatrix[i] = [];
            }

            if (!auxMatrix[i][j]) {
              radius = this.getAverageRadius(this.matrix, i, j);
              if (radius !== null) {
                degradation = Math.random();
                if (degradation >= this.settings.degradationLevel) {
                  degradation = 1;
                }

                auxMatrix[i][j] = Math.floor(degradation * radius);
                shouldIterate = true;
              }
            }
          }
        }

        this.matrix = cloneArray(auxMatrix);
      }

      this.draw();
    },

    draw: function() {

      var radius;
      var circle;
      var x = this.settings.maxRadius;
      var y = this.settings.maxRadius;
      var image;
      var i;
      var j;

      for (j = 0; j < maxY; j = j + 1) {
        for (i = 0; i < maxX; i = i + 1) {

          radius = this.getRadius(this.matrix, i, j);
          radius = radius ? radius : 1;

          circle = this.canvas.display.ellipse({
            x: x,
            y: y,
            radius: radius,
            fill: this.settings.color,
          });

          this.canvas.addChild(circle, false);

          x = x + this.settings.maxRadius * 2;
        }

        x = this.settings.maxRadius;
        y = y + this.settings.maxRadius * 2;
      }

      image = this.canvas.display.image({
        x: 0,
        y: 0,
        image: 'templates/front.png',
        width: this.canvas.width,
        height: this.canvas.height,
      });

      this.canvas.addChild(image, false);

      this.canvas.redraw();
    },
  });

  $.fn[ pluginName ] = function(options) {
    return this.each(function() {
      if (!$.data(this, 'plugin_' + pluginName)) {
        $.data(this, 'plugin_' + pluginName, new Vago(this, options));
      }
    });
  };

})(jQuery, window, document);
