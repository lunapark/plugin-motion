# Motion plugin

Animates any layout element. Set its fields as `plugin.motion.<field>` attributes, with `:` for numbers, booleans, objects and bindings: `<div plugin.motion.preset="slide-up" plugin.motion.trigger="visible" :plugin.motion.duration="800" />`.

## Presets
- Enter, from a start state to the element's normal look: `fade`, `slide-up`, `slide-down`, `slide-left`, `slide-right`, `zoom`, `blur`, `count` (counts the first number in the text from `countFrom` up to its value).
- Emphasis, from the normal look to a target: `grow`, `shrink`, `lift`, `tilt`.
- Ambient, looping forever: `pulse`, `float`, `spin`, `shake`, `blink`, `wiggle`, `marquee`.
- `custom`: animates from `from` to `to`, both objects with `x`, `y` (px), `scale`, `scaleX`, `scaleY`, `rotate` (degrees), `opacity` and `blur` (px). Missing keys use the normal look (`x: 0, y: 0, scale: 1, scaleX: 1, scaleY: 1, rotate: 0, opacity: 1, blur: 0`). `from`/`to` are ignored by other presets.
- `keyframes` adds evenly spaced steps between `from` and `to` of a `custom` preset, as an array of the same objects. A jelly squash on hover: `plugin.motion.preset="custom" plugin.motion.trigger="hover" :plugin.motion.keyframes="[{scaleX:1.08,scaleY:0.92},{scaleX:0.94,scaleY:1.06},{scaleX:1.03,scaleY:0.97}]" :plugin.motion.duration="520"`. A wiggle that ends where it started: `:plugin.motion.keyframes="[{rotate:-3},{rotate:3}]"`.
- `marquee` scrolls the children of a row sideways forever, for tickers and logo strips. Put it on a flex row (`display:flex`) inside a parent with `overflow:hidden`, and list the items once: Motion repeats them, hides the copies from screen readers and loops seamlessly, `gap` included. `duration` is the time of one pass (default 20000 ms).

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
- `stepped`: plays in that many jumps instead of a smooth move, like CSS `steps()`. `:plugin.motion.stepped="2"` with `alternate` and `loop` makes a two-frame wobble.
- `stagger` (ms) plays the children one after another, from `staggerFrom` (`first`, `center`, `last`, `random`). Sibling elements with the same settings are staggered together.
- `split` (`chars`, `words`, `lines`) splits the text and staggers the pieces. It rewrites the element's text, so only use it on static text.

## Loops and interaction states
- Use Motion for looping decoration instead of `@keyframes` in `.inject/style.css`. Ambient presets cover the common loops: a blinking light is `plugin.motion.preset="blink"`, a bobbing mascot `float`, a breathing badge `pulse`.
- Any other two-state loop is a `custom` preset with `loop` and `alternate`: `plugin.motion.preset="custom" :plugin.motion.to="{scale:0.55,rotate:45}" :plugin.motion.loop="-1" :plugin.motion.alternate="true" plugin.motion.ease="inOutSine" :plugin.motion.duration="1300"`. `duration` is one direction, so a 2.6 s CSS cycle is 1300 ms. Without `alternate` the loop restarts from the start, which suits a one-way slide with `ease="linear"`.
- Offset identical loops with `delay` so they do not move in unison.
- Hover, press and focus feedback that moves, scales or rotates the element uses the `hover`, `press` and `focus` triggers, e.g. `plugin.motion.preset="shrink" plugin.motion.trigger="press"`. Feedback that changes colours, shadows or outlines uses the layout's own `style:hover`, `style:active` and `style:focus-visible` states, never a `data-*` attribute styled from global CSS.
- Keep `@keyframes` in `.inject/style.css` only for properties Motion does not animate (colours, shadows, clip paths). Multi-step moves use `keyframes`, stepped timing uses `stepped`, tickers use `marquee`.

## Plugin settings
- `anchorScroll` makes links to a section (`href="#pricing"`) scroll smoothly, and `anchorOffset` (px) keeps that much space above the section, e.g. the height of a sticky header. Turn it on instead of writing `scroll-behavior` and `scroll-margin-top` in `.inject/style.css`. It follows `reducedMotion` and works with `smoothScroll`.
- `smoothScroll` adds inertia to the whole page scroll (`smoothScrollLerp` tunes it).

## Notes
- Motion sets inline `transform`, `opacity` and `filter` styles, and turns `inline` targets into `inline-block`.
- When the visitor prefers reduced motion (plugin setting `reducedMotion: "reduce"`), animations finish instantly and looping or scroll animations are skipped.
- The Motion panel's Replay button replays the selected element's animation in the editor. It does not rerun the page's logic or reset its variables; reopen the page for that.
- To replay an animation from logic, prefer the `state` trigger and toggle its variable, instead of hiding and showing the element.
