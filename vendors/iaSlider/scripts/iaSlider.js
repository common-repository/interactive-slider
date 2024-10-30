/*
    iaSlider - Interactive Slider

    Author: Mariusz (email: mariusz@wp-developer.pl)
    Homepage: http://wp-developer.pl/iaslider
    License: MIT
    Version: 1.0.0
 */
 
/*   
    The MIT License (MIT)

    Copyright (c) 2014 Mariusz (email: mariusz@wp-developer.pl)

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.
 */

( function( $ ) {

    // Default settings
    var settingsDefault = {

        width : 755,
        height : 365,
        gapBetweenSlidesAndScroller : 3, // [px]
        cScroller : {

            continousLoop : true, // Whether to make copies of content to scroll them one after another in loop
            scrollDirection : 'forward',
		    scrollSpeed : 40, // [pixels/second]
		    fastScrollSpeedMultiplier : 15,
		    width : 200,
            height : 365

        }

    }

    var methods = {

        init : function( options ) {

            var settings = {};
            if ( options ) { $.extend( settings, settingsDefault, options ); }

            var iaSliderBaseUrl = options.url || false;
            if ( !iaSliderBaseUrl ) { return; }

            var cScrollerBaseUrl = options.cScrollerUrl || false;
            if ( !cScrollerBaseUrl ) { return; }
            settings.cScroller.url = cScrollerBaseUrl;

            var cScrollerContentUrl = options.cScrollerContentUrl || false;
            if ( cScrollerContentUrl ) {

                settings.cScroller.contentUrl = cScrollerContentUrl;

            }

            return this.each( function() {

                var $this = $( this );
                var iaSliderData = $this.data( 'iaSlider' );

                // If the plugin hasn't been initialized yet
                if ( !iaSliderData ) {

                    var iaSliderData = {

                        url : iaSliderBaseUrl,
                        width : settings.width,
                        height : settings.height,
                        gapBetweenSlidesAndScroller : settings.gapBetweenSlidesAndScroller,
                        cScroller : settings.cScroller,
                        cScrollerCtn : null

                    }
                    iaSliderData.cScroller.height = iaSliderData.height;

                    $this.data( 'iaSlider', iaSliderData );

                }

                $this.width( iaSliderData.width ).height( iaSliderData.height );

                // Load iaSlider HTML structure
                $.get( iaSliderBaseUrl + '/templates/iaSlider.html', $.proxy( function( result ) {

                    var $this = this; // $ prefix just to mark that this is a jQuery collection
                    $this.append( result );

                    var $ctn = $this.find( '.iaS-ctn' );
                    $ctn.css( 'margin-right', parseInt( iaSliderData.gapBetweenSlidesAndScroller ) + 'px' );
                    
                    var btWidth = parseInt( $ctn.css( 'border-top-width' ) );
                    var brWidth = parseInt( $ctn.css( 'border-right-width' ) );
                    var bbWidth = parseInt( $ctn.css( 'border-bottom-width' ) );
                    var blWidth = parseInt( $ctn.css( 'border-left-width' ) );
                    var mrWidth = parseInt( $ctn.css( 'margin-right' ) );
                    var csWidth = iaSliderData.cScroller.width;
                    $ctn.width( iaSliderData.width - blWidth - brWidth - mrWidth - csWidth ).height( iaSliderData.height - btWidth - bbWidth );

                    $ctn.css( 'visibility', 'visible' );

                    var $cScrollerCtn = $this.find( '.cScroller' );
                    iaSliderData.cScrollerCtn = $cScrollerCtn;
                    $this.data( 'iaSlider', iaSliderData );

                    $cScrollerCtn.on( 'active-item-detected', function( event, item ) {

                        var $item = $( item );
                        var $img = $item.find( 'img[data-largesrc]:first' );
                        var $detected = $ctn.find( 'img[src="' + $img.attr( 'data-largesrc' ) + '"]' );
                        var $currentlyActive = $ctn.find( 'img[class*="iaS-image-active"]' );

                        if ( 0 === $currentlyActive.length ) {

                            $detected.addClass( 'iaS-image-active' ).fadeIn( 'slow' );

                        } else if ( $currentlyActive.attr( 'src' ) != $detected.attr( 'src' ) ) {

                            $ctn.find( 'img' ).removeClass( 'iaS-image-active' );
                            $currentlyActive.fadeOut( 'slow' );
                            $detected.addClass( 'iaS-image-active' ).fadeIn( 'slow' );

                        }

                    } );

                    $cScrollerCtn.on( 'content-loaded', function( event, content ) {

                        $cScrollerCtn.cScroller( 'stop' );
                        var $content = $( '<div/>' ).html( content );
                        var images = [];
                        $content.find( '.active-item img' ).each( function( index, image ) {

                            images.push( $( image ).attr( 'data-largesrc' ) );

                        } );

                        var ctnWidth = $ctn.width();
                        var ctnHeight = $ctn.height();
                        var $ctn_ = $ctn;

                        var $images = $( $.map( images, function( value ) {

                            return '<img class="iaS-image" src="' + value + '" />';

                        } ).join( '' ) );
                        
                        var imagesCount = images.length;
                        $images.on( 'load error', function( event ) {

                            $( this ).appendTo( $ctn_ );

                            if ( 'load' === event.type ) {

                                var ctnRatio = ctnWidth / ctnHeight;
                                var imgRatio = $( this ).width() && $( this ).height() ? $( this ).width() / $( this ).height() : 1;

                                if ( ( ctnRatio >= 1 && imgRatio > ctnRatio ) || ( ctnRatio < 1 && imgRatio >= ctnRatio ) ) {

                                    $( this ).css( {
                                        height : ctnHeight,
                                        width : ctnHeight * imgRatio,
                                        top : 0,
                                        left : ( ctnWidth - ( ctnHeight * imgRatio ) ) / 2
                                    } );

                                }

                                if ( ( ctnRatio >= 1 && imgRatio <= ctnRatio ) || ( ctnRatio < 1 && imgRatio < ctnRatio ) ) {

                                    $( this ).css( {
                                        height : ctnWidth / imgRatio,
                                        width : ctnWidth,
                                        top : ( ctnHeight - ( ctnWidth / imgRatio ) ) / 2,
                                        left : 0
                                    } );

                                }

                            } else if ( 'error' === event.type ) {

                                $( this ).css( {
                                    top : ( ctnHeight - $( this ).height() ) / 2,
                                    left : ( ctnWidth - $( this ).width() ) / 2
                                } );

                            }
                            
                            if ( --imagesCount === 0 ) {

                                $ctn_.find( '.iaS-loader' ).hide();
                                $images.css( {
                                    'visibility' : 'visible'
                                } ).hide();

                            }

                        } ); 

                    } );

                    $cScrollerCtn.cScroller( iaSliderData.cScroller );

                }, $this ) );

            });

        },

        getCScroller : function() {
        
            var $this = this //$ prefix just to mark that this is a jQuery collection
            var iaSliderData = $this.data( 'iaSlider' );
            
            return iaSliderData.cScrollerCtn;
        
        },

        getSettings : function( option ) {
        
            var $this = this //$ prefix just to mark that this is a jQuery collection
            var iaSliderData = $this.data( 'iaSlider' );
            var settingsToExpose = [ 'width', 'height', 'url', 'gapBetweenSlidesAndScroller' ];

            if ( option && iaSliderData.hasOwnProperty( option ) &&
                    $.inArray( option, settingsToExpose ) || 'cScroller' === option ) {

                if ( 'cScroller' === option ) {

                    return iaSliderData.cScrollerCtn.cScroller( 'getSettings' );

                }

                return iaSliderData[ option ];
            
            } else if ( option ) {
            
                return 'Option ' + option + ' does not exist on the Slider settings';
                
            }
            
            var settings = {};
            for( var i = 0 ; i < settingsToExpose.length ; i++ ) {

                var key = settingsToExpose[ i ];
                settings[ key ] = iaSliderData[ key ];

            }

            return settings;            
        
        },

    }

    $.fn.iaSlider = function( method ) {

        if ( methods[ method ] ) {

            return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ) );

        } else if ( typeof method === 'object' || !method ) {

            return methods.init.apply( this, arguments );

        } else {

            $.error( 'Method ' +  method + ' does not exist on jQuery iaSlider plugin' );

        }

    }

}( jQuery ) );

