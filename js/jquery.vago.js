;(function($, window, document, undefined) {

  'use strict';

  var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                              window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
  window.requestAnimationFrame = requestAnimationFrame;

  var pluginName = 'vago';
  var grayLuminance = getLuminance(200, 200, 200);

  function cloneArray(a) {
    var b = [];

    for (var i = 0; i < a.length; i++) {
      if (a[i]) {
        b[i] = a[i].slice();
      }
    }

    return b;
  }

  function getLuminance(r, g, b) {
    // Fórmula: http://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
    var rgba = [r,g,b];
    var rgb;

    for (var i = 0; i < 3; i++) {
      rgb = rgba[i];

      rgb /= 255;

      rgb = rgb < 0.03928 ? rgb / 12.92 : Math.pow((rgb + 0.055) / 1.055, 2.4);

      rgba[i] = rgb;
    }

    return 0.2126 * rgba[0] + 0.7152 * rgba[1] + 0.0722 * rgba[2];
  }

  function getContrastWidthGrey(r, g, b) {
    var l1 = getLuminance(r, g, b) + 0.05;
    var l2 = grayLuminance;
    var ratio = l1 / l2;

    if (l2 > l1) {
      ratio = 1 / ratio;
    }

    return ratio;
  }

  function getRandomColor() {
    var r;
    var g;
    var b;
    var rgba;
    var contrast;

    r = Math.floor(Math.random() * 255);
    g = Math.floor(Math.random() * 255);
    b = Math.floor(Math.random() * 255);

    rgba = 'rgba(' + r + ', ' + g + ', ' + b + ', 1)';

    contrast = getContrastWidthGrey(r, g, b);

    if (contrast < 2) {
      // Para mejorar la legibilidad de "OCRE es VAGO", descartamos los colores
      // con poco contraste con el gris

      return getRandomColor();
    }

    return rgba;
  }

  function Vago(element, options) {

    var defaults = {
      background: null,
      color: null,
      points: null,
      windowSize: 1,
      maxRadius: null,
      degradationLevel: 0.3,
      stepByStep: false,
      addTitle: true,
    };

    this.getRadius = function(matrix, x, y) {
        if (x < 0 || x >= this.maxX) {
          return null;
        }

        if (y < 0 || y >= this.maxY) {
          return null;
        }

        if (!matrix[x]) {
          return null;
        }

        if (!matrix[x][y]) {
          return null;
        }

        return matrix[x][y];
      };

    this.getAverageRadius = function(matrix, windowSize, x, y) {
        var i;
        var j;
        var radius;
        var averageRadius = 0;
        var n = 0;

        for (i = (windowSize * -1); i <= windowSize; i = i + 1) {
          for (j = (windowSize * -1); j <= windowSize; j = j + 1) {
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
      };

    this.element = element;
    this._defaults = defaults;
    this._name = pluginName;

    this.iteration = 1;

    this.settings = $.extend({}, defaults, options);

    if (!this.settings.background) {
      this.settings.background = getRandomColor();
    }

    if (!this.settings.color) {
      this.settings.color = getRandomColor();
    }

    if (!this.settings.points) {
      this.settings.points = Math.floor(Math.random() * 3) + 1;
    }

    this.init();
  }

  $.extend(Vago.prototype, {
    logSettings: function() {
      var p;

      for (p in this.settings) {
        if (p === 'background' || p === 'color') {
          console.log(p + ' : %c' + this.settings[p], 'color: ' + this.settings[p]);
        } else {
          console.log(p, ':', this.settings[p]);
        }
      }
    },

    iterate: function() {
      var auxMatrix = cloneArray(this.matrix);
      var shouldIterate = false;
      var radius;
      var degradation;
      var i = 0;
      var j = 0;

      for (j = 0; j < this.maxY; j = j + 1) {
        for (i = 0; i < this.maxX; i = i + 1) {
          if (!auxMatrix[i]) {
            auxMatrix[i] = [];
          }

          if (!auxMatrix[i][j]) {
            radius = this.getAverageRadius(this.matrix, this.settings.windowSize, i, j);
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

      return shouldIterate;
    },

    init: function() {

      this.canvas = this.element;

      if (!this.settings.maxRadius) {
        this.settings.maxRadius = Math.floor(Math.max(this.canvas.width, this.canvas.height) / 100);
      }

      this.maxX = this.canvas.width / (this.settings.maxRadius * 2);
      this.maxY = this.canvas.height / (this.settings.maxRadius * 2);
      this.matrix = [];
      this.circles = [];

      this.cover = new Image();
      this.cover.src = 'templates/front.png';

      this.logSettings();

      var shouldIterate = true;
      var n;
      var i = 0;
      var j = 0;
      var image;
      var x = this.settings.maxRadius;
      var y = this.settings.maxRadius;

      for (n = 0; n < this.settings.points; n = n + 1) {
        i = Math.floor(Math.random() * this.maxX);
        j = Math.floor(Math.random() * this.maxY);

        if (!this.matrix[i]) {
          this.matrix[i] = [];
        }

        this.matrix[i][j] = this.settings.maxRadius;
      }

      this.draw();
    },

    draw: function() {
      this.iteration++;

      var shouldIterate = this.iterate();

      if (this.settings.stepByStep) {
        this.stepDraw();
      }

      if (shouldIterate) {
        if (this.settings.stepByStep) {
          var _this = this;
          requestAnimationFrame(function() {
            _this.draw();
          });
        } else {
          this.draw();
        }
      } else {
        console.log(this.iteration + ' iteraciones');

        if (!this.settings.stepByStep) {
          this.stepDraw();
        }
      }
    },

    stepDraw: function() {

      var radius;
      var i;
      var j;
      var ctx = this.canvas.getContext('2d');
      var path;
      var x;
      var y = this.settings.maxRadius;

      ctx.fillStyle = this.settings.background;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      ctx.fillStyle = this.settings.color;

      for (j = 0; j < this.maxY; j = j + 1) {
        x = this.settings.maxRadius;

        for (i = 0; i < this.maxX; i = i + 1) {

          radius = this.getRadius(this.matrix, i, j);
          radius = radius ? radius : 1;

          path = new Path2D();
          path.arc(x, y, radius, 0, 2 * Math.PI);

          ctx.fill(path);
          x += 2 * this.settings.maxRadius;
        }

        y += 2 * this.settings.maxRadius;
      }

      if (this.settings.addTitle) {
        ctx.drawImage(this.cover, 0, 0, this.canvas.width, this.canvas.height);
      }
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
