# Motion plugin

Animates any layout element. Set its fields as `plugin.motion.<field>` attributes, with `:` for numbers, booleans, objects and bindings: `<div plugin.motion.preset="slide-up" plugin.motion.trigger="visible" :plugin.motion.duration="800" />`.

## Presets
- Enter, from a start state to the element's normal look: `fade`, `slide-up`, `slide-down`, `slide-left`, `slide-right`, `zoom`, `blur`, `count` (counts the first number in the text from `countFrom` up to its value).
- Emphasis, from the normal look to a target: `grow`, `shrink`, `lift`, `tilt`.
- Ambient, looping forever: `pulse`, `float`, `spin`, `shake`, `blink`, `wiggle`.
- `custom`: animates from `from` to `to`, both objects with `x`, `y` (px), `scale`, `rotate` (degrees), `opacity` and `blur` (px). Missing keys use the normal look (`x: 0, y: 0, scale: 1, rotate: 0, opacity: 1, blur: 0`). `from`/`to` are ignored by other presets.

## Triggers
- `mount` (default): plays when the element is mounted.
- `visible`: plays once, the first time the element enters the screen.
- `scroll`: progress follows the scroll position. `scrollAnchor` (`top`/`center`), `scrollTarget` (screen % where it ends, default 50) and `scrollMode` (`stop`, `continue`, `hold`) tune it.
- `hover`, `press`, `focus`: plays forward on enter and backward on leave.
- `state`: follows the `state` boolean, e.g. `:plugin.motion.state="menuOpen"`. The first value is applied instantly (`true` shows the end, `false` the start); later changes play forward (`true`) or backward (`false`).

## Timing
- `duration` and `delay` are in milliseconds. `duration` defaults to the plugin setting (600 ms), `delay` to 0.
- `loop`: extra repetitions. `0` plays once, `-1` repeats forever. Without it, ambient presets loop forever and the others play once.
- `alternate`: plays every other repetition backward.
- `ease`: `linear`, `outQuad`, `outCubic`, `outExpo` (default), `inOutSine`, `outBack`, `outElastic`, `outBounce`.
- `stagger` (ms) plays the children one after another, from `staggerFrom` (`first`, `center`, `last`, `random`). Sibling elements with the same settings are staggered together.
- `split` (`chars`, `words`, `lines`) splits the text and staggers the pieces. It rewrites the element's text, so only use it on static text.

## Notes
- Motion sets inline `transform`, `opacity` and `filter` styles, and turns `inline` targets into `inline-block`.
- When the visitor prefers reduced motion (plugin setting `reducedMotion: "reduce"`), animations finish instantly and looping or scroll animations are skipped.
- The Motion panel's Replay button replays the selected element's animation in the editor. It does not rerun the page's logic or reset its variables; reopen the page for that.
- To replay an animation from logic, prefer the `state` trigger and toggle its variable, instead of hiding and showing the element.
