import type { AnimationParams, JSAnimation } from "animejs";
import { animate, onScroll } from "animejs";
import type { Directive } from "vue";

export type TMotionOptions = {
    delay: number;
    duration: number;
    ease: string;
    enter: keyof typeof presets | "none";
    trigger: "mount" | "visible";
};

const presets = {
    "fade": { opacity: { from: 0 } },
    "slide-up": { opacity: { from: 0 }, translateY: { from: 32 } },
    "slide-down": { opacity: { from: 0 }, translateY: { from: -32 } },
    "slide-left": { opacity: { from: 0 }, translateX: { from: 32 } },
    "slide-right": { opacity: { from: 0 }, translateX: { from: -32 } },
    "zoom": { opacity: { from: 0 }, scale: { from: 0.8 } }
} satisfies Record<string, AnimationParams>;

export const motionPresets = Object.keys(presets);

const animations = new WeakMap<HTMLElement, JSAnimation>();

function play(element: HTMLElement, options: TMotionOptions) {
    stop(element);

    if (options.enter === "none" || !presets[options.enter]) {
        return;
    }

    animations.set(element, animate(element, {
        ...presets[options.enter],
        autoplay: options.trigger === "visible" ? onScroll({ repeat: false }) : true,
        delay: options.delay,
        duration: options.duration,
        ease: options.ease
    }));
}

function stop(element: HTMLElement) {
    animations.get(element)?.revert();
    animations.delete(element);
}

export const vMotion: Directive<HTMLElement, TMotionOptions> = {
    mounted(element, { value }) {
        play(element, value);
    },
    updated(element, { oldValue, value }) {
        if (JSON.stringify(oldValue) !== JSON.stringify(value)) {
            play(element, value);
        }
    },
    unmounted(element) {
        stop(element);
    }
};
