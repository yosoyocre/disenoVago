;(function($, window, document, undefined) {

  'use strict';

  var pluginName = 'vago';
  var grayLuminance = getLuminance(200, 200, 200);
  var maxX;
  var maxY;

  function cloneArray(a) {
    var b = [];

    for (var i = 0; i < a.length; i++) {
      if (a[i]) {
        b[i] = a[i].slice();
      }
    }

    return b;
  }

  function getRadius(matrix, x, y) {
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
    }

  function getAverageRadius(matrix, windowSize, x, y) {
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

          radius = getRadius(matrix, x + i, y + j);
          if (radius !== null) {
            averageRadius = averageRadius + radius;
            n++;
          }
        }
      }

      return n ? averageRadius / n : null;
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
    };

    this.element = element;
    this._defaults = defaults;
    this._name = pluginName;

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
        console.log(p, ':', this.settings[p]);
      }
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
              radius = getAverageRadius(this.matrix, this.settings.windowSize, i, j);
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
      var square;
      var i;
      var j;

      for (j = 0; j < maxY; j = j + 1) {
        for (i = 0; i < maxX; i = i + 1) {

          radius = getRadius(this.matrix, i, j);
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

      square = this.canvas.display.rectangle({
        x: this.canvas.width - 200,
        y: this.canvas.height - 200,
        width: 200,
        height: 200,
        fill: this.settings.background,
      });

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
