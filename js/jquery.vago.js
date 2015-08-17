;(function($, window, document, undefined) {

  'use strict';

  var _this;
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
    };

    _this = this;

    _this.getRadius = function(matrix, x, y) {
        if (x < 0 || x >= _this.maxX) {
          return null;
        }

        if (y < 0 || y >= _this.maxY) {
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

    _this.getAverageRadius = function(matrix, windowSize, x, y) {
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

            radius = _this.getRadius(matrix, x + i, y + j);
            if (radius !== null) {
              averageRadius = averageRadius + radius;
              n++;
            }
          }
        }

        return n ? averageRadius / n : null;
      };

    _this.element = element;
    _this._defaults = defaults;
    _this._name = pluginName;

    _this.iteration = 1;

    _this.settings = $.extend({}, defaults, options);

    if (!_this.settings.background) {
      _this.settings.background = getRandomColor();
    }

    if (!_this.settings.color) {
      _this.settings.color = getRandomColor();
    }

    if (!_this.settings.points) {
      _this.settings.points = Math.floor(Math.random() * 3) + 1;
    }

    _this.init();
  }

  $.extend(Vago.prototype, {
    logSettings: function() {
      var p;

      for (p in _this.settings) {
        console.log(p, ':', _this.settings[p]);
      }
    },

    iterate: function() {
      var auxMatrix = cloneArray(_this.matrix);
      var shouldIterate = false;
      var radius;
      var degradation;
      var i = 0;
      var j = 0;

      for (j = 0; j < _this.maxY; j = j + 1) {
        for (i = 0; i < _this.maxX; i = i + 1) {
          if (!auxMatrix[i]) {
            auxMatrix[i] = [];
          }

          if (!auxMatrix[i][j]) {
            radius = _this.getAverageRadius(_this.matrix, _this.settings.windowSize, i, j);
            if (radius !== null) {
              degradation = Math.random();
              if (degradation >= _this.settings.degradationLevel) {
                degradation = 1;
              }

              auxMatrix[i][j] = Math.floor(degradation * radius);
              shouldIterate = true;
            }
          }
        }
      }

      _this.matrix = cloneArray(auxMatrix);

      return shouldIterate;
    },

    init: function() {

      _this.canvas = oCanvas.create({ canvas: _this.element, background: _this.settings.background });

      if (!_this.settings.maxRadius) {
        _this.settings.maxRadius = Math.floor(Math.min(_this.canvas.width, _this.canvas.height) / 100);
      }

      _this.maxX = _this.canvas.width / (_this.settings.maxRadius * 2);
      _this.maxY = _this.canvas.height / (_this.settings.maxRadius * 2);
      _this.matrix = [];
      _this.circles = [];

      _this.logSettings();

      var shouldIterate = true;
      var n;
      var i = 0;
      var j = 0;
      var image;
      var x = _this.settings.maxRadius;
      var y = _this.settings.maxRadius;

      for (n = 0; n < _this.settings.points; n = n + 1) {
        i = Math.floor(Math.random() * _this.maxX);
        j = Math.floor(Math.random() * _this.maxY);

        if (!_this.matrix[i]) {
          _this.matrix[i] = [];
        }

        _this.matrix[i][j] = _this.settings.maxRadius;
      }

      for (j = 0; j < _this.maxY; j = j + 1) {
        for (i = 0; i < _this.maxX; i = i + 1) {

          if (!_this.circles[i]) {
            _this.circles[i] = [];
          }

          _this.circles[i][j] = _this.canvas.display.ellipse({
            x: x,
            y: y,
            radius: 1,
            fill: _this.settings.color,
          });

          _this.canvas.addChild(_this.circles[i][j], false);

          x = x + _this.settings.maxRadius * 2;
        }

        x = _this.settings.maxRadius;
        y = y + _this.settings.maxRadius * 2;
      }

      image = _this.canvas.display.image({
        x: 0,
        y: 0,
        image: 'templates/front.png',
        width: _this.canvas.width,
        height: _this.canvas.height,
      });

      _this.canvas.addChild(image, false);

      _this.draw();
    },

    draw: function() {
      _this.iteration++;

      var shouldIterate = _this.iterate();

      if (_this.settings.stepByStep) {
        _this.stepDraw();
      }

      if (shouldIterate) {
        if (_this.settings.stepByStep) {
          setTimeout(_this.draw, 100);
        } else {
          _this.draw();
        }
      } else {
        console.log(_this.iteration + ' iteraciones');

        if (!_this.settings.stepByStep) {
          _this.stepDraw();
        }
      }
    },

    stepDraw: function() {

      var radius;
      var circle;
      var image;
      var i;
      var j;

      for (j = 0; j < _this.maxY; j = j + 1) {
        for (i = 0; i < _this.maxX; i = i + 1) {

          radius = _this.getRadius(_this.matrix, i, j);
          radius = radius ? radius : 1;

          _this.circles[i][j].radius = radius;
        }
      }

      _this.canvas.redraw();
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
