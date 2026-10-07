import type { AnimationParams, JSAnimation, TextSplitter } from "animejs";
import { animate, onScroll, splitText, stagger } from "animejs";
import type { Directive } from "vue";
import { reactive } from "vue";

export type TMotionTrigger = "mount" | "visible" | "scroll" | "hover" | "press" | "focus" | "state";
export type TMotionValues = { blur: number; opacity: number; rotate: number; scale: number; x: number; y: number; };
export type TMotionSplit = "chars" | "words" | "lines";
export type TMotionStaggerFrom = "first" | "center" | "last" | "random";

export type TMotionOptions = {
    alternate?: boolean;
    delay?: number;
    duration?: number;
    ease?: string;
    from?: Partial<TMotionValues>;
    loop?: number;
    preset: string;
    split?: TMotionSplit;
    stagger?: number;
    staggerFrom?: TMotionStaggerFrom;
    state?: boolean;
    to?: Partial<TMotionValues>;
    trigger: TMotionTrigger;
};

export type TMotionConfig = {
    duration: number;
    ease: string;
    reducedMotion: "reduce" | "ignore";
};

type TPreset = {
    alternate?: boolean;
    category: "enter" | "emphasis" | "ambient";
    ease?: string;
    loop?: boolean;
    params: AnimationParams;
};

type TController = {
    animations: Array<JSAnimation>;
    cleanups: Array<() => void>;
    key: string;
    looping: boolean;
    splitter?: TextSplitter;
    state?: boolean;
};

type TContext = {
    controller: TController;
    element: HTMLElement;
    options: TMotionOptions;
    preset: TPreset;
    reduced: boolean;
    trigger: TMotionTrigger;
};

export const easeNames = ["linear", "outQuad", "outCubic", "outExpo", "inOutSine", "outBack", "outElastic", "outBounce"];

export const motionConfig = reactive<TMotionConfig>({
    duration: 600,
    ease: "outExpo",
    reducedMotion: "reduce"
});

export function configureMotion(config: Partial<TMotionConfig>) {
    Object.assign(motionConfig, config);
}

export const presets: Record<string, TPreset> = {
    "fade": { category: "enter", params: { opacity: { from: 0 } } },
    "slide-up": { category: "enter", params: { opacity: { from: 0 }, translateY: { from: 32 } } },
    "slide-down": { category: "enter", params: { opacity: { from: 0 }, translateY: { from: -32 } } },
    "slide-left": { category: "enter", params: { opacity: { from: 0 }, translateX: { from: 32 } } },
    "slide-right": { category: "enter", params: { opacity: { from: 0 }, translateX: { from: -32 } } },
    "zoom": { category: "enter", params: { opacity: { from: 0 }, scale: { from: 0.8 } } },
    "blur": { category: "enter", params: { filter: { from: "blur(8px)", to: "blur(0px)" }, opacity: { from: 0 } } },
    "grow": { category: "emphasis", params: { scale: 1.05 } },
    "shrink": { category: "emphasis", params: { scale: 0.95 } },
    "lift": { category: "emphasis", params: { translateY: -6 } },
    "tilt": { category: "emphasis", params: { rotate: 3 } },
    "pulse": { alternate: true, category: "ambient", ease: "inOutSine", loop: true, params: { scale: 1.06 } },
    "float": { alternate: true, category: "ambient", ease: "inOutSine", loop: true, params: { translateY: -8 } },
    "spin": { category: "ambient", ease: "linear", loop: true, params: { rotate: 360 } },
    "shake": { category: "ambient", ease: "linear", loop: true, params: { translateX: [0, -6, 6, -6, 6, 0] } },
    "blink": { alternate: true, category: "ambient", ease: "inOutSine", loop: true, params: { opacity: 0.4 } },
    "wiggle": { alternate: true, category: "ambient", ease: "inOutSine", loop: true, params: { rotate: { from: -3, to: 3 } } }
};

const naturalValues: TMotionValues = { blur: 0, opacity: 1, rotate: 0, scale: 1, x: 0, y: 0 };

const controllers = new WeakMap<HTMLElement, TController>();

function getCustomPreset(options: TMotionOptions): TPreset {
    const params: AnimationParams = {};

    for (const key of Object.keys(naturalValues) as Array<keyof TMotionValues>) {
        const from = options.from?.[key] ?? naturalValues[key];
        const to = options.to?.[key] ?? naturalValues[key];

        if (from === to) {
            continue;
        }

        switch (key) {
            case "blur":
                params.filter = { from: `blur(${ from }px)`, to: `blur(${ to }px)` };
                break;
            case "x":
                params.translateX = { from, to };
                break;
            case "y":
                params.translateY = { from, to };
                break;
            default:
                params[key] = { from, to };
        }
    }

    return { category: "enter", params };
}

function getPreset(options: TMotionOptions) {
    return options.preset === "custom" ? getCustomPreset(options) : presets[options.preset];
}

function isReduced() {
    return motionConfig.reducedMotion === "reduce" && typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getKey(options: TMotionOptions) {
    const { state: _, ...rest } = options;
    return JSON.stringify(rest);
}

function getLoop({ options, preset, reduced }: TContext) {
    if (reduced) {
        return false;
    }

    if (options.loop === undefined) {
        return preset.loop ?? false;
    }

    return options.loop < 0 ? true : options.loop;
}

function getStep({ options, reduced }: TContext) {
    return reduced ? undefined : options.stagger ?? (options.split ? 30 : undefined);
}

function getDelay(context: TContext, start = context.options.delay ?? 0) {
    if (context.reduced) {
        return 0;
    }

    const step = getStep(context);
    return step === undefined ? start : stagger(step, { from: context.options.staggerFrom ?? "first", start });
}

function getSiblingDelay(context: TContext, index: number, total: number, start = context.options.delay ?? 0) {
    if (context.reduced) {
        return 0;
    }

    const step = getStep(context) ?? 0;

    switch (context.options.staggerFrom) {
        case "last":
            return start + (total - 1 - index) * step;
        case "center":
            return start + Math.abs(index - (total - 1) / 2) * step;
        case "random":
            return start + Math.random() * (total - 1) * step;
        default:
            return start + index * step;
    }
}

function getAutoplay(element: HTMLElement, trigger: TMotionTrigger) {
    switch (trigger) {
        case "mount":
            return true;
        case "visible":
            return onScroll({ repeat: false, target: element });
        case "scroll":
            return onScroll({ sync: true, target: element });
        default:
            return false;
    }
}

function isVisualElement(node: Node): node is HTMLElement {
    return node instanceof HTMLElement && !["LINK", "META", "SCRIPT", "STYLE", "TEMPLATE"].includes(node.tagName);
}

function getChildren(element: HTMLElement) {
    return [...element.children].filter(isVisualElement);
}

function sortByDocument(contexts: Array<TContext>) {
    return contexts.sort((a, b) => a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
}

function isCurrent({ controller, element }: TContext) {
    return controllers.get(element) === controller;
}

function play(context: TContext, targets: HTMLElement | Array<HTMLElement>, delay: NonNullable<AnimationParams["delay"]>, autoplay = getAutoplay(context.element, context.trigger)) {
    const { controller, options, preset, reduced } = context;
    const animation = animate(targets, {
        ...preset.params,
        alternate: options.alternate ?? preset.alternate ?? false,
        autoplay,
        delay,
        duration: reduced ? 0 : options.duration ?? motionConfig.duration,
        ease: options.ease ?? preset.ease ?? motionConfig.ease,
        loop: getLoop(context)
    });

    controller.animations.push(animation);
    return animation;
}

function observeChildren({ controller, element }: TContext, callback: (added: Array<HTMLElement>) => void) {
    const observer = new MutationObserver((records) => {
        const added = records.flatMap((record) => [...record.addedNodes]).filter(isVisualElement);

        if (added.length || records.some((record) => [...record.removedNodes].some(isVisualElement))) {
            callback(added);
        }
    });

    observer.observe(element, { childList: true });
    controller.cleanups.push(() => observer.disconnect());
}

function staggerChildren(context: TContext) {
    play(context, getChildren(context.element), getDelay(context));
    observeChildren(context, (added) => {
        if (added.length) {
            play(context, added, getDelay(context, 0));
        }
    });
}

function revealSiblings(contexts: Array<TContext>) {
    const byElement = new Map(contexts.map((context) => [context.element as Element, context]));
    const observer = new IntersectionObserver((records) => {
        const visible = sortByDocument(records
            .filter((record) => record.isIntersecting)
            .map((record) => byElement.get(record.target))
            .filter((context): context is TContext => !!context && isCurrent(context)));

        visible.forEach((context, index) => {
            observer.unobserve(context.element);

            const timeout = setTimeout(() => forward(context.controller), getSiblingDelay(context, index, visible.length, 0));
            context.controller.cleanups.push(() => clearTimeout(timeout));
        });
    });

    for (const context of contexts) {
        play(context, context.element, context.options.delay ?? 0, false).seek(0);
        observer.observe(context.element);
        context.controller.cleanups.push(() => observer.unobserve(context.element));
    }
}

const parentIds = new WeakMap<Element, number>();
let parentCounter = 0;
let pendingGroups = new Map<string, Array<TContext>>();

function getParentId(parent: Element | null) {
    if (!parent) {
        return "none";
    }

    if (!parentIds.has(parent)) {
        parentIds.set(parent, parentCounter++);
    }

    return String(parentIds.get(parent));
}

function queueStagger(context: TContext) {
    if (!pendingGroups.size) {
        queueMicrotask(flushStagger);
    }

    const groupId = `${ getParentId(context.element.parentElement) }/${ context.controller.key }`;
    pendingGroups.set(groupId, [...pendingGroups.get(groupId) ?? [], context]);
}

function flushStagger() {
    const groups = [...pendingGroups.values()];
    pendingGroups = new Map();

    for (const group of groups) {
        const contexts = sortByDocument(group.filter(isCurrent));

        if (contexts.length === 1) {
            staggerChildren(contexts[0]!);
        }
        else if (contexts[0]?.trigger === "visible") {
            revealSiblings(contexts);
        }
        else {
            contexts.forEach((context, index) => play(context, context.element, getSiblingDelay(context, index, contexts.length)));
        }
    }
}

function listen({ controller, element }: TContext, events: Array<string>, handler: () => void) {
    for (const event of events) {
        element.addEventListener(event, handler);
        controller.cleanups.push(() => element.removeEventListener(event, handler));
    }
}

function forward(controller: TController) {
    controller.animations.forEach((animation) => animation.play());
}

function backward(controller: TController) {
    controller.animations.forEach((animation) => controller.looping ? animation.pause().seek(0) : animation.reverse());
}

function applyState(controller: TController, state: boolean, initial: boolean) {
    if (controller.state === state) {
        return;
    }

    controller.state = state;

    if (initial && !controller.looping) {
        controller.animations.forEach((animation) => animation.seek(state ? animation.duration : 0));
        return;
    }

    if (state) {
        forward(controller);
    }
    else {
        backward(controller);
    }
}

function bindTrigger(context: TContext) {
    const { controller, options, trigger } = context;

    switch (trigger) {
        case "hover":
            listen(context, ["pointerenter"], () => forward(controller));
            listen(context, ["pointerleave"], () => backward(controller));
            break;
        case "press":
            listen(context, ["pointerdown"], () => forward(controller));
            listen(context, ["pointerup", "pointerleave", "pointercancel"], () => backward(controller));
            break;
        case "focus":
            listen(context, ["focusin"], () => forward(controller));
            listen(context, ["focusout"], () => backward(controller));
            break;
        case "state":
            applyState(controller, !!options.state, true);
            return;
        default:
            return;
    }

    controller.animations.forEach((animation) => animation.seek(0));
}

function setup(element: HTMLElement, options: TMotionOptions) {
    stop(element);

    const controller: TController = { animations: [], cleanups: [], key: getKey(options), looping: false };
    controllers.set(element, controller);

    const preset = getPreset(options);
    const reduced = isReduced();

    if (!preset || (reduced && (preset.loop || options.trigger === "scroll"))) {
        return;
    }

    const context: TContext = {
        controller,
        element,
        options,
        preset,
        reduced,
        trigger: reduced && options.trigger === "visible" ? "mount" : options.trigger
    };

    controller.looping = getLoop(context) === true;

    if (options.split) {
        controller.splitter = splitText(element, { [options.split]: true });
        play(context, controller.splitter[options.split] as Array<HTMLElement>, getDelay(context));
    }
    else if (options.stagger === undefined) {
        play(context, element, getDelay(context));
    }
    else if (context.trigger === "mount" || context.trigger === "visible") {
        queueStagger(context);
        return;
    }
    else {
        play(context, getChildren(element), getDelay(context));
        observeChildren(context, () => setup(element, options));
    }

    bindTrigger(context);
}

function stop(element: HTMLElement) {
    const controller = controllers.get(element);

    if (!controller) {
        return;
    }

    controller.cleanups.forEach((cleanup) => cleanup());
    controller.animations.forEach((animation) => animation.revert());
    controller.splitter?.revert();
    controllers.delete(element);
}

export const vMotion: Directive<HTMLElement, TMotionOptions> = {
    mounted(element, { value }) {
        setup(element, value);
    },
    updated(element, { value }) {
        const controller = controllers.get(element);

        if (!controller || controller.key !== getKey(value)) {
            setup(element, value);
            return;
        }

        if (value.trigger === "state") {
            applyState(controller, !!value.state, false);
        }
    },
    unmounted(element) {
        stop(element);
    }
};
