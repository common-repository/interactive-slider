interactiveSliderLoader.load = function( options ) {

    var options = options || {};

    if ( ! options.id ) { return; }

    var iaSliderBaseUrl = this.iaSliderBaseUrl.replace( /[/\\]+$/, '' );
    var iaSliderRequestUrl = this.iaSliderRequestUrl.replace( /[/\\]+$/, '' );
    var cScrollerBaseUrl = this.cScrollerBaseUrl.replace( /[/\\]+$/, '' );
    var cScrollerRequestUrl = this.cScrollerRequestUrl.replace( /[/\\]+$/, '' );
    var vendorsBaseUrl = this.vendorsBaseUrl.replace( /[/\\]+$/, '' );
    var pluginUrl = this.pluginUrl.replace( /[/\\]+$/, '' );

    var interactiveSliderVersion = options.interactiveSliderVersion;
    var cScrollerVersion = options.cScrollerVersion;
    var iaSliderVersion = options.iaSliderVersion;
    var foundationIconsVersion = options.foundationIconsVersion;

    options.url = iaSliderRequestUrl;
    options.cScrollerUrl = cScrollerRequestUrl;
    options.cScrollerContentUrl = options.dataUrl;
    options.width = options.width;
    options.height = options.height;
    options.gapBetweenSlidesAndScroller = options.gapBetweenSlidesAndScroller;
    options.cScroller = {

        continousLoop   : options.continousLoop,
        scrollSpeed     : options.speed,
        scrollDirection : options.direction,
        width           : options.scrollerWidth,
        height          : options.height

    }

    toast(
        pluginUrl + '/styles/interactive-slider.css?ver=' + interactiveSliderVersion + '.css',
        cScrollerBaseUrl + '/styles/cScroller.css?ver=' + cScrollerVersion + '.css',
        iaSliderBaseUrl + '/styles/iaSlider.css?ver=' + iaSliderVersion + '.css',
        vendorsBaseUrl + '/foundation icons/foundation-icons/foundation-icons.css?ver=' + foundationIconsVersion + '.css',
        [ cScrollerBaseUrl + '/scripts/cScroller.js?ver=' + cScrollerVersion + '.js', function() { return jQuery && jQuery.fn.cScroller } ],
        [ iaSliderBaseUrl + '/scripts/iaSlider.js?ver=' + iaSliderVersion + '.js', function() { return jQuery.fn.iaSlider } ],
        function() {

            jQuery( document ).ready(function() {

                var $ctn = jQuery( '#' + options.id );
                $ctn.iaSlider( options );

            });

        });

}

