/*
    cScroller - Content Scroller

    Author: Mariusz (email: mariusz@wp-developer.pl)
    Homepage: http://wp-developer.pl/cscroller
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

        continousLoop : true, // Whether to make copies of content to scroll them one after another in loop
        scrollDirection : 'forward',
		scrollSpeed : 100, // [pixels/second]
		fastScrollSpeedMultiplier : 10,
		width : 640,
        height : 480

    }

    /*
     * pixelsIntervalToSpeedRatio - is a private variable and cannot be modified
     * through the plugin interface or initial settings.
     *
     *
     * The Content Scroller animation was designed to consist with many "short distance"
     * animations:
     *     - it allows us to implement Active Item detection mechanism ( with a detection
     *       resolution equal to "short distance" interval, see below ).
     *
     *
     * Every "short distance" animation moves on a distance of pixelsInterval value.
     * The '_play' function, which is responsible for "short distance" animations,
     * also implements Active Item detection mechanism.
     *     - Active Item - is an element inside the scrolling content with an
     *       'active-item' class,
     *     - by implication pixelsInterval is a resolution of Active Item detection
     *       ( so to make sure an Active Item will be detected, its haight need to be
     *         bigger then pixelsInterval )
     *
     *
     * "short distance" animation time = 1000 * pixelsInterval / speed ( [ms] * [px] / [px/s] ).
     * To make similar scrolling experience for different settings ( scroll speed,
     * pixelsInterval ), the "short distance" animation time has been fixed (constant value
     * of pixelsIntervalToSpeedRatio ) making those settings relate one to another ( NOTE:
     * user can change only speed value ):
     *
     *     - pixelsInterval = speed / pixelsIntervalToSpeedRatio;
     *
     * This way the '_play' function is recalled on equal time intervals.
     * ( so for example, pixelsIntervalToSpeedRatio = 10 implicate animation time
     *   of 0.1[s] = 100[ms]. If speed = 100[px/s] then pixelsInterval = 10[px]. If
     *   we change speed to 500[px/s], then pixelsInterval would be equal 50[px] )
     *
     * NOTICE: In fact pixelsInterval = Math.max( 1, settings.scrollSpeed / pixelsIntervalToSpeedRatio )
     *         which means that its value is bigger of the two ( '1' and
     *         'speed / pixelsIntervalToSpeedRatio' ). This is to avoid the
     *         animation time being less then 1[ms]. This also mean that for very low speed values
     *         animation time is different from what pixelsIntervalToSpeedRatio implicate.
     *
     * SUMMING UP: pixelsIntervalToSpeedRatio sets ratio between pixelsInterval
     *             and speed. The plugin interface allows only to modify
     *             the speed value ( to make it easier ), so by setting
     *             speed you affect the resolution of the Active Item detection mechanism.
     *
     *             For example:
     *             assuming pixelsIntervalToSpeedRatio = 10, if speed will
     *             be equal 10[px/s], then pixelsInterval will be equal 1[px].
     *             1[px] for pixelInterval mean high resolution, but it also mean
     *             that the animationTime will be equal 1[ms].
     *             However 1[ms] for animationTime may affect browser responsivnes.
     *
     *             From the other side if you set speed to be equal 10000[px/s], then pixelsInterval
     *             value will be high ( in this case 1000[px] and this is quite low resolution
     *             for Active Item detection ).
     *
     */
    var pixelsIntervalToSpeedRatio = 10;

    var methods = {

        init : function( options ) {

            var settings = {};
            if ( options ) { $.extend( settings, settingsDefault, options ); }

            var cScrollerBaseUrl = options.url || false;
            if ( !cScrollerBaseUrl ) { return; }

            var cScrollerContentUrl = options.contentUrl || false;
            if ( !cScrollerContentUrl ) { cScrollerContentUrl = cScrollerBaseUrl + '/data.php'; }

            return this.each( function() {

                var $this = $( this );
                var cScrollerData = $this.data( 'cScroller' );

                // If the plugin hasn't been initialized yet
                if ( !cScrollerData ) {

                    var cScrollerData = {

                        contentUrl : cScrollerContentUrl,
                        continousLoop : settings.continousLoop,
                        contentCopiesOrder : [ 0 ], // This variable is useful only when continousLoop is true

                        /* pixelsInterval - "single animation" distance in pixels.
                         * Animation is made with looped "single animation" calls.
                         * That way we can examine different conditions every pixelsInterval.
                         */
                        pixelsInterval : Math.max( 1, settings.scrollSpeed / pixelsIntervalToSpeedRatio ),
                        scrollDirection : settings.scrollDirection, // Current direction
                        normalScrollDirection : settings.scrollDirection,
                        scrollSpeed : settings.scrollSpeed, // Current speed
                        fastScrollSpeed : settings.fastScrollSpeedMultiplier * settings.scrollSpeed,
                        fastScrollSpeedMode : 'relative',
                        normalScrollSpeed : settings.scrollSpeed,
                        fastScrollSpeedMultiplier : settings.fastScrollSpeedMultiplier,
                        timer : false, // Hold the setInterval's return value
                        url : cScrollerBaseUrl,
                        width : settings.width,
                        height : settings.height

                    }

                    $this.data( 'cScroller', cScrollerData );

                }
                
                $this.width( cScrollerData.width ).height( cScrollerData.height );

                // Load cScroller html structure
                $.get( cScrollerBaseUrl + '/templates/cScroller.html', $.proxy( function( result ) {

                    var $this = this; // $ prefix just to mark that this is a jQuery collection
                    $this.append( result );

                    var $ctn = $this.find( '.cS-ctn' );
                    var btWidth = parseInt( $ctn.css( 'border-top-width' ) );
                    var brWidth = parseInt( $ctn.css( 'border-right-width' ) );
                    var bbWidth = parseInt( $ctn.css( 'border-bottom-width' ) );
                    var blWidth = parseInt( $ctn.css( 'border-left-width' ) );
                    $ctn.width( cScrollerData.width - blWidth - brWidth ).height( cScrollerData.height - btWidth - bbWidth );

                    // Load cScroller content
                    $.get( cScrollerContentUrl, $.proxy( function( result ) {

                        var $this = this; // $ prefix just to mark that this is a jQuery collection
                        var $ctn = $this.find( '.cS-ctn' );

                        var $body = $ctn.find( '.cS-content' )
                                        .css( 'top', 0 )
                                        .find( '.cS-content-body' );

                        var $tmpCtn = $( '<div id="tmpResultCtn123">' + result + '</div>' );

                        var loadContent = function() {

                            var $ctn = $this.find( '.cS-ctn' );
                            $ctn.find( '.cS-loader' ).hide();
                            
                            var $result = $tmpCtn.contents();
                            $body.html('').append( $result );

                            var cScrollerData = $this.data( 'cScroller' );

                            if ( cScrollerData.continousLoop ) {

                                var contentStartTop = $ctn.find( '.cS-content .cS-content-start' ).offset().top;
                                var contentEndTop = $ctn.find( '.cS-content .cS-content-end' ).offset().top;

                                var contentHeight = contentEndTop - contentStartTop;
                                var ctnHeight = cScrollerData.height;
                      			var ctnOffsetTop = $ctn.offset().top;
                                var numberOfCopiesBasedOnContainerHeight = Math.ceil( 2 * ctnHeight / contentHeight );
                                var numberOfCopiesBasedOnSpeed = Math.ceil( cScrollerData.pixelsInterval / contentHeight );
                                var numberOfCopies = Math.max( numberOfCopiesBasedOnContainerHeight, numberOfCopiesBasedOnSpeed );
                                for ( var i = 0 ; i < numberOfCopies ; i++ ) {

                                    var $tmpContentCopy = $ctn.find( '.cS-content' ).first().clone().addClass( 'cS-content-copy ' + ( i + 1 ) );                                    
                                    $tmpContentCopy.css( 'top', parseFloat( $ctn.find( '.cS-content .cS-content-end:last' ).offset().top - ctnOffsetTop ) );
                                    $ctn.find( '.cS-nav' ).before( $tmpContentCopy );
                                    cScrollerData.contentCopiesOrder.push( i + 1 );

                                }
                                $this.data( 'cScroller', cScrollerData );

                            }

                            $this.triggerHandler( 'content-loaded', result );

                            $body.find( '.active-item' ).each( $.proxy( function( index, element ) {

                                var $this = $( this );
                                $this.triggerHandler( 'active-item-loaded', element );

                            }, $this ) );

                            $this.cScroller( 'play', cScrollerData.scrollSpeed, cScrollerData.scrollDirection );

                        }
       
                        var $contentImages = $tmpCtn.find( 'img' );
                        var imagesCount = $contentImages.length;
                        if ( 0 != imagesCount ) {

                            $contentImages.on( 'load error', function() {

                                if ( --imagesCount === 0 ) {

                                    loadContent();

                                }

                            } );

                        } else {

                            loadContent();

                        }

                        $ctn.find( '.cS-nav li.play-pause' ).click( function( event ) {

                            event.preventDefault();
                            event.stopPropagation();

                            var $this = $( this );
                            $this.hasClass( 'play' ) ? $ctn.parent().cScroller( 'stop' ) : $ctn.parent().cScroller( 'play' );                            

                        } );

                        $ctn.find( '.cS-nav li.up-down' ).click( function( event ) {

                            event.preventDefault();
                            event.stopPropagation();

                            var $this = $( this );
                            $ctn.parent().cScroller( 'stop' );
                            $this.hasClass( 'up' ) ? $ctn.parent().cScroller( 'setDirection', 'backward', 'makeItDefault' ) : $ctn.parent().cScroller( 'setDirection', 'forward', 'makeItDefault' );
                            $ctn.parent().cScroller( 'play' );

                        } );

                        $ctn.find( '.cS-nav li.fast-forward, .cS-nav li.fast-backward' ).click( function( event ) {

                            event.preventDefault();
                            event.stopPropagation();

                        } );

                        $ctn.find( '.cS-nav li.fast-forward, .cS-nav li.fast-backward' ).mousedown( function( event ) {

                            event.preventDefault();
                            event.stopPropagation();

                            var $this = $( this );
                            $ctn.parent().cScroller( 'stop' );
                            if ( $this.hasClass( 'fast-forward' ) ) {

                                if ( $ctn.find( '.cS-nav li.up-down' ).hasClass( 'down' ) ) {

                                    $ctn.parent().cScroller( 'setDirection', 'forward' );

                                }

                            } else {

                                if ( $ctn.find( '.cS-nav li.up-down' ).hasClass( 'up' ) ) {

                                    $ctn.parent().cScroller( 'setDirection', 'backward' );

                                }

                            }
                            $ctn.parent().cScroller( 'setSpeed', cScrollerData.fastScrollSpeed );
                            $ctn.parent().cScroller( 'play' );

                        } );

                        $ctn.find( '.cS-nav li.fast-forward, .cS-nav li.fast-backward' ).mouseup( function( event ) {

                            event.preventDefault();
                            event.stopPropagation();

                            var $this = $( this );
                            $ctn.parent().cScroller( 'stop' );
                            var cScrollerData = $ctn.parent().data( 'cScroller' );
                            $ctn.parent().cScroller( 'setDirection', cScrollerData.normalScrollDirection );
                            $ctn.parent().cScroller( 'setSpeed', cScrollerData.normalScrollSpeed );
                            $ctn.parent().data( 'cScroller', cScrollerData );
                            $ctn.parent().cScroller( 'play' );

                        } );

                    }, $this ) );

                }, $this ) );

            });

        },

        getSettings : function( option ) {

            var $this = this // $ prefix just to mark that this is a jQuery collection
            var cScrollerData = $this.data( 'cScroller' );
            var settingsToExpose = [ 
                'width', 
                'height', 
                'url', 
                'contentUrl', 
                'continousLoop', 
                'scrollDirection', 
                'scrollSpeed', 
                'fastScrollSpeedMultiplier', 
                'fastScrollSpeed', 
                'fastScrollSpeedMode'
            ];

            if ( option && cScrollerData.hasOwnProperty( option ) && $.inArray( option, settingsToExpose ) ) {

                return cScrollerData[ option ];

            } else if ( option ) {

                return 'Option ' + option + ' does not exist on the Scroller settings';

            }

            var settings = {};
            for( var i = 0 ; i < settingsToExpose.length ; i++ ) {

                var key = settingsToExpose[ i ];
                settings[ key ] = cScrollerData[ key ];

            }

            return settings;

        },

        setFastSpeedMultiplier : function( multiplier ) {

            var $this = this // $ prefix just to mark that this is a jQuery collection
            var cScrollerData = $this.data( 'cScroller' );
            cScrollerData.fastScrollSpeedMultiplier = multiplier;
            cScrollerData.fastScrollSpeedMode = 'relative';
            $this.data( 'cScroller', cScrollerData );

            $this.cScroller( 'setSpeed', cScrollerData.scrollSpeed, 'makeItDefault' );

        },

        setFastSpeed : function( speed ) {

            var $this = this // $ prefix just to mark that this is a jQuery collection
            var cScrollerData = $this.data( 'cScroller' );
            cScrollerData.fastScrollSpeed = speed;
            cScrollerData.fastScrollSpeedMode = 'absolute';
            $this.data( 'cScroller', cScrollerData );

        },

        setSpeed : function( speed, mode ) {

            var $this = this // $ prefix just to mark that this is a jQuery collection
            var cScrollerData = $this.data( 'cScroller' );

            cScrollerData.scrollSpeed = speed;
            if ( 'makeItDefault' === mode ) {

                cScrollerData.normalScrollSpeed = speed;
                if ( 'relative' === cScrollerData.fastScrollSpeedMode ) {

                    cScrollerData.fastScrollSpeed = cScrollerData.fastScrollSpeedMultiplier * speed;

                }

            }

            cScrollerData.pixelsInterval = Math.max( 1, speed / pixelsIntervalToSpeedRatio );
            $this.data( 'cScroller', cScrollerData );

        },

        setDirection : function( direction, mode ) {

            var $this = this // $ prefix just to mark that this is a jQuery collection

            var cScrollerData = $this.data( 'cScroller' );
            cScrollerData.scrollDirection = direction;
            if ( 'makeItDefault' === mode ) {

                cScrollerData.normalScrollDirection = direction;

            }

            var upDownButton = $this.find( '.cS-ctn .cS-nav li.up-down' );
            upDownButton.removeClass( 'up down' );
            ( 'forward' === direction ) ? upDownButton.addClass( 'up' ) : upDownButton.addClass( 'down' );

            $this.data( 'cScroller', cScrollerData );

        },

        // This is only for single animation on the pixelsInterval distance. For continous animation use 'play' method instead
        _play : function( speed, direction, pixelsInterval ) {

            var $this = this; // $ prefix just to mark that this is a jQuery collection

            var animationTime = 1000 * pixelsInterval / speed;

  			var $ctn = $this.find( '.cS-ctn' );
  			var ctnOffsetTop = $ctn.offset().top;

            var cScrollerData = $this.data( 'cScroller' );
            
            var $contentItems = $this.find( '.cS-content' );
            var contentCopiesOrder = cScrollerData.contentCopiesOrder;
            var newContentCopiesOrder = [].concat( contentCopiesOrder ); // Array copy
            var j = 0;

            for( var i = 0 ; i < contentCopiesOrder.length ; i++ ) {

                if ( 'forward' === direction ) {

                    j = i;

                } else if ( 'backward' === direction ) {

                    // Reverse contentCopiesOrder
                    j = contentCopiesOrder.length - i - 1;

                }

                var $content = $contentItems.eq( contentCopiesOrder[ j ] );
                var $contentStart = $content.find( '.cS-content-start' );
                var $contentEnd = $content.find( '.cS-content-end' );
                var contentStartOffsetTop = $contentStart.offset().top - ctnOffsetTop;
                var contentEndOffsetTop = $contentEnd.offset().top - ctnOffsetTop;

                var contentEndPos = contentEndOffsetTop;
                var contentStartPos = contentStartOffsetTop;

                if ( 'forward' === direction ) {

                    if ( contentEndPos < 0 ) {

                        if ( 1 === $contentItems.length ) {

                            $content.css( 'top', $ctn.height() );

                        } else {

                            var lastItemIndex = newContentCopiesOrder[ newContentCopiesOrder.length - 1 ];
                            var $lastItem = $contentItems.eq( lastItemIndex );

                            $content.css( 'top', parseFloat( $lastItem.find( '.cS-content-end' ).offset().top - ctnOffsetTop ) );

                            var firstItemIndex = newContentCopiesOrder.shift();
                            newContentCopiesOrder = newContentCopiesOrder.concat( [ firstItemIndex ] );                            

                        }

                    }

                } else if ( 'backward' === direction ) {

                    if ( contentStartPos > $ctn.height() ) {

                        if ( 1 === $contentItems.length ) {

                            $content.css( 'top', 0 - $content.height() );

                        } else {

                            var firstItemIndex = newContentCopiesOrder[ 0 ];
                            var $firstItem = $contentItems.eq( firstItemIndex );

                            $content.css( 'top', parseFloat( $firstItem.find( '.cS-content-start' ).offset().top - ctnOffsetTop - $content.height() ) );

                            var lastItemIndex = newContentCopiesOrder.pop();
                            newContentCopiesOrder = [ lastItemIndex ].concat( newContentCopiesOrder );

                        }

                    }

                }

            }

            cScrollerData.contentCopiesOrder = newContentCopiesOrder;
            cScrollerData = $this.data( 'cScroller', cScrollerData );

            $this.find( '.active-item' ).each( function( index ) {
            
                var $ctn = $this.find( '.cS-ctn' );
                var ctnMiddle = $ctn.height() / 2;
            
                var $ai = $( this ); // Active item element
                var aiHeight = $ai.height();
                var aiTop = $ai.offset().top - $ctn.offset().top;
                var aiBottom = aiTop + aiHeight;

                // Body of an element with .active-item class is over the middle of the container
                if ( aiTop < ctnMiddle && aiBottom > ctnMiddle ) {

                    $this.find( '.active-item' ).removeClass( 'active' );
                    $ai.addClass( 'active' );
                    $this.triggerHandler( 'active-item-detected', $ai );

                }

            } );

            $this.find( '.cS-content' ).animate(

			    { top : ( 'forward' === direction ) ? '-=' + pixelsInterval + 'px' : '+=' + pixelsInterval + 'px' },
			    animationTime, 'linear'

		    );

        },

        play : function( speed, direction ) {

            var $this = this // $ prefix just to mark that this is a jQuery collection
            $this.cScroller( 'stop' );

            if ( direction ) {

                $this.cScroller( 'setDirection', direction, 'makeItDefault' );

            }
            
            if ( speed ) {

                $this.cScroller( 'setSpeed', speed, 'makeItDefault' );

            }

            var cScrollerData = $this.data( 'cScroller' );
            var playDirection = cScrollerData.scrollDirection;
            var playSpeed = cScrollerData.scrollSpeed;
            var pixelsInterval = cScrollerData.pixelsInterval;

            var _playRepeat = function() {

                $this.find( '.cS-content' ).stop( true, true );
                $this.cScroller( '_play', playSpeed, playDirection, pixelsInterval );

            };

            /* 1000 * cScrollerData.pixelsInterval / speed - the same value as inside the '_play' method for animation call.
             * Speed is given in pixels per second so we need to multiply by 1000 to get value in miliseconds, which is required by setInterval
             */
            cScrollerData.timer = setInterval( _playRepeat, 1000 * cScrollerData.pixelsInterval / playSpeed );
            $this.find( '.cS-ctn .cS-nav li.play-pause' ).removeClass( 'play pause' ).addClass( 'play' );
            $this.data( 'cScroller', cScrollerData );

        },

        stop : function() {

            var $this = this // $ prefix just to mark that this is a jQuery collection
            var cScrollerData = $this.data( 'cScroller' );
            clearInterval( cScrollerData.timer );
            $this.find( '.cS-content' ).stop();
            $this.find( '.cS-ctn .cS-nav li.play-pause' ).removeClass( 'play pause' ).addClass( 'pause' );
            $this.data( 'cScroller', cScrollerData );

        }

    }

    $.fn.cScroller = function( method ) {

        if ( methods[ method ] ) {

            return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ) );

        } else if ( typeof method === 'object' || !method ) {

            return methods.init.apply( this, arguments );

        } else {

            $.error( 'Method ' +  method + ' does not exist on jQuery cScroller plugin' );

        }

    }

}( jQuery ) );

