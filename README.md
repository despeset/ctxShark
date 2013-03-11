# ctxShark

Extend your `<canvas>` `2d context` with the ability to record and play the instructions it recieves.  Written to help isolate drawing-specific performance issues.  Useful for looking under the hood of your animation library or interactive app.

```.js
var ctx = document.getElementById('canvas').getContext('2d');
ctxShark( ctx );            // extend & instrument ctx
ctx.startBuffer();          // begin recording
ctx.stopBuffer();           // end recording
var rec = ctx.getBuffer();  // returns recording
ctx.playBuffer( rec );      // playback & loop recording
```

## Caveats

* Only tested with Chrome.
* Assumes you are using `requestAnimationFrame` -- which you are, right?
* Careful with your recordings -- they can get really large really fast, try just a second or two at first.