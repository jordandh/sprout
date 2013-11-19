define(['modernizr'], function (modernizr) {
    'use strict';
    // modernizr.retina = ('devicePixelRatio' in window && window.devicePixelRatio > 1) ||
 //                         ('matchMedia' in window && window.matchMedia('(min-resolution:144dpi)') &&
 //                         window.matchMedia('(min-resolution:144dpi)').matches);

    /*
     * retina test
     */
    modernizr.addTest('retina', function () {
        return ('devicePixelRatio' in window && window.devicePixelRatio > 1) ||
               ('matchMedia' in window && window.matchMedia('(min-resolution:144dpi)') && window.matchMedia('(min-resolution:144dpi)').matches);
    });

    return modernizr;
  });