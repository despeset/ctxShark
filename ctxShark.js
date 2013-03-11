/*****************************************************************************************

     ctxShark 0.1 - Javascript canvas 2d context tapping, recording & playback
     http://github.com/danielmendel/ctxShark

     Copyright (c) 2012 Daniel Mendel Espeset (http://danielmendel.com)         
     MIT Licence ( http://github.com/danielmendel/glitz.js/license.txt )        

*****************************************************************************************/
!!!function(scope){
    'use strict';
    /**
     *  All 2D context properties
     */
    
    var stateProps = [
          'webkitImageSmoothingEnabled'
        , 'webkitBackingStorePixelRatio'
        , 'fillStyle'
        , 'strokeStyle'
        , 'textBaseline'
        , 'textAlign'
        , 'font'
        , 'lineDashOffset'
        , 'shadowColor'
        , 'shadowBlur'
        , 'shadowOffsetY'
        , 'shadowOffsetX'
        , 'miterLimit'
        , 'lineJoin'
        , 'lineCap'
        , 'lineWidth'
        , 'globalCompositeOperation'
        , 'globalAlpha'
    ]
    
    /**
     *  All 2D context methods
     */

    , outputMethods = [
          'save'
        , 'restore'
        , 'scale'
        , 'rotate'
        , 'translate'
        , 'transform'
        , 'setTransform'
        , 'createLinearGradient'
        , 'createRadialGradient'
        , 'getLineDash'
        , 'clearRect'
        , 'fillRect'
        , 'beginPath'
        , 'closePath'
        , 'moveTo'
        , 'lineTo'
        , 'quadraticCurveTo'
        , 'bezierCurveTo'
        , 'arcTo'
        , 'rect'
        , 'arc'
        , 'fill'
        , 'stroke'
        , 'clip'
        , 'isPointInPath'
        , 'measureText'
        , 'setAlpha'
        , 'setCompositeOperation'
        , 'setLineWidth'
        , 'setLineCap'
        , 'setLineJoin'
        , 'setMiterLimit'
        , 'clearShadow'
        , 'fillText'
        , 'strokeText'
        , 'setStrokeColor'
        , 'setFillColor'
        , 'strokeRect'
        , 'drawImage'
        , 'drawImageFromRect'
        , 'setShadow'
        , 'putImageData'
        , 'webkitPutImageDataHD'
        , 'createPattern'
        , 'createImageData'
        , 'getImageData'
        , 'webkitGetImageDataHD'
        , 'setLineDash'
    ];

    /**
     *  buildIndex
     *
     *  @param    arr     array of unique strings
     *  @returns  object  index for arr where { val: index }
     */

    function buildIndex( arr ){
        var i = arr.length
          , dex = {}
        ;
        while( i-- ){
            dex[arr[i]] = i;
        }
        return dex;
    };

    var outputMethodsIndex = buildIndex( outputMethods )
      , statePropsIndex    = buildIndex( stateProps    )
    ;

    /**
     *  clone
     *
     *  Cheap way to clone an object, must be possible to serialize ( no cyclic references )
     *
     *  @param  nonCyclicObject  non-cyclic object to clone
     */

    function clone( nonCyclicObject ){
        return JSON.parse( JSON.stringify( nonCyclicObject ));
    }

    /**
     *  ctxShark -- instruments the provided context object and returns it
     */
    
    scope.ctxShark = function( ctx ){
        console && console.log && console.log('~~~∆~~~ <( shark!!! ) ~~~~');

        var buffer = []         // stores the recording
          , frame  = []         // tracks the state so state changes can be pushed into buffer
          , state  = {}         // toggle writing to the buffer
          , recording = false   // record automatically, starts now
        ;

        /**
         *  updateState
         *  
         *  Checks the state object against the current value of each context property
         *  to detect updates and push them as state change instructions into the buffer
         *  
         *  Runs whenever a drawing method is invoked before being recorded or executed
         */

        function updateState(){
            var i = stateProps.length;
            while( i-- ){
                var k = stateProps[i]
                if( state[k] !== ctx[k] ){
                    state[k] = ctx[k];
                    frame.push([ statePropsIndex[k], '=', ctx[k] ])
                }
            }
        }

        /**
         *  markFrame
         *
         *  Used when recording to start a new frame in the buffer
         *  called by `requestAnimationFrame`.
         */

        function markFrame(){
            if( recording ){
                buffer.push(frame);
                frame = []; 
                requestAnimationFrame( markFrame );
            }
        }

        /**
         *  sinkTeethInto
         *
         *  The meat and potatoes, instruments the context to enable recording
         *  And adds a bunch of functionality for 
         *
         *  @param    ctx  2d context to instrument & extend
         *  @returns  ctx  instrumented & extended 2d context
         */

        function sinkTeethInto( ctx ){

            /**
             *  Instrument 
             *  
             *  Wrap all the drawing methods with recording function.
             */

            for( var k in ctx ){
                if( typeof ctx[k] === 'function' && outputMethodsIndex.hasOwnProperty(k) ){
                    (function(k){
                        console && console.log && console.log( 'patching ' + k );
                        var _super = ctx[k];
                        ctx[k] = function(){
                            if( recording ){
                                updateState();
                                frame.push([ outputMethodsIndex[k], arguments ]);
                            }
                            _super.apply( this, arguments );
                        }
                    })(k);  
                }
            }

            /**
             *  Extend
             *
             *  Add some methods for starting, stopping and retrieving the recording.
             */

            ctx.startBuffer = function(){
                requestAnimationFrame( markFrame );
                return recording = true;
            }

            ctx.stopBuffer = function(){
                return recording = false;
            }
            
            ctx.getBuffer = function(){
                return buffer;
            }

            /**
             *  playBuffer
             *
             *  Plays back the provided buffer object, defaults to the internal recording buffer if none passed.
             *  
             *
             *  @param  inputBuffer  recorded buffer array  
             */

            ctx.playBuffer = function( inputBuffer ){
                var frames = clone( inputBuffer || buffer )     // clone the buffer
                  , played = []                                 // frames are spooled here as they are played
                ;


                function playFrame(){
                    var frame = frames.shift()                  // get array of instructions for this frame
                      , playedFrame = []                        // instructions are spooled here as they're performed
                    ;
                    while( frame.length ){
                        var inst = frame.shift();               // get next instruction
                        if( inst.length === 3 ) {               // instruction is a state change
                            ctx[stateProps[inst[0]]] = inst[2];
                        }
                        if( inst.length === 2 ) {               // instruction is a drawing method
                            var args = [], i = 0;

                            /**
                             *  Here we have to convert argument objects to arrays in order to pass to apply, 
                             *  this is strange, but it is because:
                             *
                             *  (function(a,b){ return JSON.stringify( arguments ) === '{"0":1,"1":2}' })(1,2); 
                             *
                             */

                            while( typeof inst[1][i] !== 'undefined' ){ args.push(inst[1][i++]) }
                            ctx[outputMethods[inst[0]]].apply( ctx, args );
                        }
                        playedFrame.push( inst );               // spool completed instruction
                    }
                    played.push( playedFrame );                 // spool completed frame
                    if( !frames.length ){                       // loop
                        frames = played;
                        played = [];
                    }
                    requestAnimationFrame( playFrame );         // play next frame ( recurse )
                };
                requestAnimationFrame( playFrame );             // start playback
            }

            return ctx;

        }   // end sinkTeethInto

        return sinkTeethInto( ctx );

    }  // end ctxShark

}(this);