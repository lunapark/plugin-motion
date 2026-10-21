# 🪄 Motion plugin for Luna Park

**Animate any element of your app** (entrances, hover effects, scroll reveals, looping details) from a single **Motion** panel in the inspector, without writing a line of animation code.

Powered by [anime.js](https://animejs.com), and what you see in the editor preview is exactly what runs once deployed.

## ✨ What you get

| | |
|---|---|
| 🎬 **18 ready-made presets** | Enter, emphasis and ambient animations, one click away. |
| 🔢 **Count-up** | Numbers count up from 0 (e.g. `0 → 4.9`) when they appear, or as you scroll. |
| 🌄 **Scroll-linked & parallax** | Tie any animation to the scroll position, stopping at the center of the page or continuing past it. |
| 🧈 **Smooth scroll** | Lenis-powered inertia scrolling for the whole app, in one switch. |
| 🎛️ **Custom from/to** | Animate opacity, position, scale, rotation and blur between your own values. |
| 🎯 **7 triggers** | On mount, when visible, synced with scroll, on hover, on press, on focus, or driven by a state. |
| 🌊 **Stagger** | Cascade the animation over children, over sibling elements (lists!), from the first, last, center or at random. |
| 🔤 **Split text** | Animate a text letter by letter, word by word, or line by line. |
| ♿ **Reduced motion** | Respects the visitor's `prefers-reduced-motion` setting out of the box. |

## 🚀 Getting started

1. In Luna Park, open **Library → Install Plugins**, search for **Motion** and install it.
2. Select an element and open the **Motion** panel in the inspector.
3. Pick a **trigger**, an **animation** and an **easing**. Hit **Replay** (↺) in the panel header to watch it again.

## 🎬 Presets

| Category | Presets | Typical use |
|---|---|---|
| **Enter** | `fade`, `slide-up`, `slide-down`, `slide-left`, `slide-right`, `zoom`, `blur`, `count` | Make an element appear (on mount, when scrolled into view…). |
| **Emphasis** | `grow`, `shrink`, `lift`, `tilt` | Small feedback on interaction, best with hover, press, focus or state. |
| **Ambient** | `pulse`, `float`, `spin`, `shake`, `blink`, `wiggle` | Loop forever to draw attention. |
| **Custom** | `custom` | Animate from your **From** values to your **To** values (`opacity`, `x`, `y`, `scale`, `rotate`, `blur`). |

## 🎯 Triggers

| Trigger | Behavior |
|---|---|
| **On mount** | Plays as soon as the element appears. |
| **When visible** | Plays once, the first time the element scrolls into view. |
| **Synced with scroll** | Progress follows the scroll position, between the moment the element enters the screen and the moment it reaches the **Scroll target**. See [Scroll options](#-scroll-options). |
| **On hover** | Plays when the pointer enters, rewinds when it leaves. |
| **On press** | Plays while the element is pressed, rewinds on release. |
| **On focus** | Plays when the element (or one of its children) gets focus, rewinds when it loses it. |
| **From a state** | Bind **State** to a boolean: `true` plays the animation, `false` rewinds it. The initial value is applied without animating. |

## 🎛️ Options

| Option | What it does |
|---|---|
| **Duration** / **Delay** | In milliseconds. Duration falls back to the plugin default. |
| **Easing** | `linear`, `outQuad`, `outCubic`, `outExpo`, `inOutSine`, `outBack`, `outElastic`, `outBounce`. |
| **Loops** | Number of repetitions, `-1` for infinite. Ambient presets loop by default. |
| **Alternate** | Play back and forth instead of restarting each loop. |
| **Stagger** | Delay between each animated item, in milliseconds. |
| **Stagger from** | Where the cascade starts: `first`, `center`, `last` or `random`. |
| **Scroll anchor** / **Scroll target** / **Scroll mode** | With **Synced with scroll**, see [Scroll options](#-scroll-options). |
| **Split text** | Split the element's text into `chars`, `words` or `lines` and animate each piece (with a 30 ms stagger by default). |

> [!TIP]
> **Count** animates the first number found in the element's text, keeping what surrounds it: `4.9★`, `$1,200`, `+87%`. Decimals and thousands separators are kept. Set **Count from** to start from another value.
>
> **Parallax**: pick **Synced with scroll**, **Continue past target** and a **Custom** animation with **From → Y** set to e.g. `100px`. The element is `100px` low when it enters, in place at the target, and keeps rising at the same pace afterwards, so it moves faster than the page. Use a negative value to make it lag behind, like a background. **Continue past target** uses `linear` easing unless you pick one.

> [!TIP]
> **Stagger** adapts to what you put it on:
> - On a **single element**, its children are animated one after the other. Children added later are animated too.
> - On **repeated siblings** sharing the same motion (e.g. a list rendered from an array), the siblings cascade together. With **When visible**, they are revealed in order as they come into view.

## 📜 Scroll options

With the **Synced with scroll** trigger, the animation is tied to where the element is on the screen. Positions are measured from the top of the screen: `0%` is the top, `100%` the bottom.

| Option | Default | What it does |
|---|---|---|
| **Scroll anchor** | `Top` | Edge of the element (`Top` or `Center`) that starts the animation when it enters at the bottom of the screen, and that has to reach the target. |
| **Scroll target** | `50%` | Screen position where the animation ends. |
| **Scroll mode** | `Stop at target` | What happens once the target is reached (see below). |

| Mode | Behavior |
|---|---|
| **Stop at target** | Holds the end state until the element leaves. |
| **Continue past target** | Keeps going at the same pace past the target, up to 4 times the entry distance. Count-up and ambient presets stop at the target instead. |
| **Hold, then reverse** | A dead zone: the animation is done once the anchor reaches `max(target, 100 − target)`, holds until the opposite edge (bottom for `Top`, center for `Center`) reaches `min(target, 100 − target)`, then plays back as the element leaves. With `30%`, it holds between `70%` and `30%`. With `50%`, it peaks at the center. |

With the defaults, the animation starts when the top of the element appears and ends when that top is at the center of the screen.

## ⚙️ Settings

| Setting | Default | What it does |
|---|---|---|
| **Default duration (ms)** | `600` | Used by every animation without its own duration. |
| **Default easing** | `outExpo` | Used by every animation without its own easing (ambient presets have their own). |
| **Smooth scroll** | `false` | Smooth the scroll of the whole app with [Lenis](https://lenis.darkroom.engineering). |
| **Smooth scroll intensity** | `0.1` | Lenis `lerp`, between `0.01` and `1`. Lower is smoother. |
| **Reduced motion** | `reduce` | With `reduce`, visitors who prefer reduced motion get instant transitions, no delays, no looping or scroll-synced animations, and no smooth scroll. Use `ignore` to always play everything. |

## 📦 In your deployed app

When you build your project:

- **Runtime**: the plugin and `animejs` are added to your frontend dependencies automatically.
- **Directive**: animated elements use the `v-motion` directive from `@luna-park/plugin-motion/runtime`.
- **Configuration**: the plugin settings are applied when the app starts.
- **Smooth scroll**: when enabled, the app is wrapped in the `MotionScroll` component.

## 🛠️ Development

```bash
pnpm install
pnpm build      # build the plugin
pnpm dev        # rebuild on change
pnpm preview    # serve it to the Luna Park editor (http://127.0.0.1:2084)
```

The package ships two entries:

- `@luna-park/plugin-motion`: the editor plugin (settings and Motion panel).
- `@luna-park/plugin-motion/runtime`: the browser runtime used by the generated app (`vMotion`, `MotionScroll`, `configureMotion`, `replayMotion`, `presets`).

---

Made with 💙 by [Luna Park](https://luna-park.app).
