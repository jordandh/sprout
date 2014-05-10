define(['modernizr'], function (modernizr) {
    'use strict';

    /*
     * retina test
     */
    modernizr.addTest('retina', function () {
        return ('devicePixelRatio' in window && window.devicePixelRatio > 1) ||
               ('matchMedia' in window && window.matchMedia('(min-resolution:144dpi)') && window.matchMedia('(min-resolution:144dpi)').matches);
    });

    /*
     * localStorageEnabled
     * Returns true if localStorage is supported and enabled.
     */
    modernizr.localStorageEnabled = function () {
        try {
            localStorage.setItem('sprout.env.localStorageEnabled', 'sprout.env.localStorageEnabled');
            localStorage.removeItem('sprout.env.localStorageEnabled');
            return true;
        } catch (ex) {
            return false;
        }
    };

    return modernizr;
});