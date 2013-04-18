# ctxShark

Extend your `<canvas>` `2d context` with the ability to record and play the instructions it recieves.  Written to help isolate drawing-specific performance issues.  Useful for looking under the hood of your animation library or interactive app.

### setup
```.js
var ctx = document.getElementById('canvas').getContext('2d');
ctxShark( ctx );            // extend & instrument ctx
```

### record
```.js
ctx.startBuffer();          // begin recording
ctx.stopBuffer();           // end recording
```
alternatively, you can provide a duration (in milliseconds) to `startBuffer` and it will stop automatically.
```.js
ctx.startBuffer(2000);      // recording for 2 seconds
```

### play
```.js
var rec = ctx.getBuffer();  // get the last recording
ctx.playBuffer( rec );      // playback & loop recording
```

## Caveats

* Only tested with Chrome.
* Assumes you are using `requestAnimationFrame` – you are, right?
* Careful with your recordings – they can get get huge quickly, try just a second or two at first.