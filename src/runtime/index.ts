import type { AnimationParams, JSAnimation, ScrollObserver, TextSplitter } from "animejs";
import { animate, onScroll, splitText, stagger } from "animejs";
import Lenis from "lenis";
import type { Directive } from "vue";
import { defineComponent, h, reactive, ref, watchEffect } from "vue";

export type TMotionTrigger = "mount" | "visible" | "scroll" | "hover" | "press" | "focus" | "state";
export type TMotionValues = { blur: number; opacity: number; rotate: number; scale: number; x: number; y: number; };
export type TMotionSplit = "chars" | "words" | "lines";
export type TMotionStaggerFrom = "first" | "center" | "last" | "random";
export type TMotionScrollAnchor = "top" | "center";
export type TMotionScrollMode = "stop" | "continue" | "hold";

export type TMotionOptions = {
    alternate?: boolean;
    countFrom?: number;
    delay?: number;
    duration?: number;
    ease?: string;
    from?: Partial<TMotionValues>;
    loop?: number;
    preset: string;
    scrollAnchor?: TMotionScrollAnchor;
    scrollMode?: TMotionScrollMode;
    scrollTarget?: number;
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
    smoothScroll: boolean;
    smoothScrollLerp: number;
};

type TPreset = {
    alternate?: boolean;
    category: "enter" | "emphasis" | "ambient";
    count?: boolean;
    duration?: number;
    ease?: string;
    from?: Partial<TMotionValues>;
    loop?: boolean;
    params?: AnimationParams;
    to?: Partial<TMotionValues>;
};

type TCounter = {
    decimals: number;
    from: number;
    grouping: boolean;
    node: Text;
    original: string;
    prefix: string;
    rendered: string;
    suffix: string;
    to: number;
    value: number;
};

type TController = {
    animations: Array<JSAnimation>;
    cleanups: Array<() => void>;
    key: string;
    looping: boolean;
    revealed: boolean;
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
    reducedMotion: "reduce",
    smoothScroll: false,
    smoothScrollLerp: 0.1
});

export function configureMotion(config: Partial<TMotionConfig>) {
    Object.assign(motionConfig, config);
}

export const presets: Record<string, TPreset> = {
    "fade": { category: "enter", from: { opacity: 0 } },
    "slide-up": { category: "enter", from: { opacity: 0, y: 32 } },
    "slide-down": { category: "enter", from: { opacity: 0, y: -32 } },
    "slide-left": { category: "enter", from: { opacity: 0, x: 32 } },
    "slide-right": { category: "enter", from: { opacity: 0, x: -32 } },
    "zoom": { category: "enter", from: { opacity: 0, scale: 0.8 } },
    "blur": { category: "enter", from: { blur: 8, opacity: 0 } },
    "count": { category: "enter", count: true, duration: 1600 },
    "grow": { category: "emphasis", to: { scale: 1.05 } },
    "shrink": { category: "emphasis", to: { scale: 0.95 } },
    "lift": { category: "emphasis", to: { y: -6 } },
    "tilt": { category: "emphasis", to: { rotate: 3 } },
    "pulse": { alternate: true, category: "ambient", ease: "inOutSine", loop: true, params: { scale: 1.06 } },
    "float": { alternate: true, category: "ambient", ease: "inOutSine", loop: true, params: { translateY: -8 } },
    "spin": { category: "ambient", ease: "linear", loop: true, params: { rotate: 360 } },
    "shake": { category: "ambient", ease: "linear", loop: true, params: { translateX: [0, -6, 6, -6, 6, 0] } },
    "blink": { alternate: true, category: "ambient", ease: "inOutSine", loop: true, params: { opacity: 0.4 } },
    "wiggle": { alternate: true, category: "ambient", ease: "inOutSine", loop: true, params: { rotate: { from: -3, to: 3 } } }
};

const naturalValues: TMotionValues = { blur: 0, opacity: 1, rotate: 0, scale: 1, x: 0, y: 0 };

const anchorRatios: Record<TMotionScrollAnchor, number> = { center: 0.5, top: 0 };
const continueFactor = 4;

const controllers = new WeakMap<HTMLElement, TController>();
const latestOptions = new WeakMap<HTMLElement, TMotionOptions>();

function getValueParams({ from: fromValues, to: toValues }: TPreset, continued: boolean) {
    const params: AnimationParams = {};

    for (const key of Object.keys(naturalValues) as Array<keyof TMotionValues>) {
        const from = fromValues?.[key] ?? naturalValues[key];
        const to = toValues?.[key] ?? naturalValues[key];

        if (from === to) {
            continue;
        }

        const extended = to + (to - from) * continueFactor;
        const after = key === "blur" || key === "scale" ? Math.max(0, extended) : extended;
        const values = continued ? [from, to, after] : [from, to];

        switch (key) {
            case "blur":
                params.filter = values.map((value) => `blur(${ value }px)`);
                break;
            case "x":
                params.translateX = values;
                break;
            case "y":
                params.translateY = values;
                break;
            default:
                params[key] = values;
        }
    }

    return params;
}

function getPreset(options: TMotionOptions) {
    return options.preset === "custom" ? { category: "enter", from: options.from, to: options.to } satisfies TPreset : presets[options.preset];
}

function isContinued({ options, preset, trigger }: TContext) {
    return trigger === "scroll" && options.scrollMode === "continue" && !preset.params && !preset.count;
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

function getScrollContainer(element: HTMLElement) {
    const root = element.closest<HTMLElement>("[data-scroll-root]");
    if (root) {
        return root;
    }

    for (let parent = element.parentElement; parent; parent = parent.parentElement) {
        if (/auto|scroll|overlay/.test(getComputedStyle(parent).overflowY) && parent.scrollHeight > parent.clientHeight) {
            return parent;
        }
    }

    return undefined;
}

function clamp01(value: number) {
    return Math.min(1, Math.max(0, value));
}

function getScrollProgress(context: TContext, observer: ScrollObserver, progress: number) {
    const { options } = context;
    const height = observer.container.height;
    const distance = observer.distance || 1;
    const size = Math.max(distance - height, 0);
    const anchor = anchorRatios[options.scrollAnchor ?? "top"];
    const target = clamp01((options.scrollTarget ?? 50) / 100);
    const at = (edge: number, position: number) => (height + edge * size - position * height) / distance;
    const begin = at(anchor, 1);
    const reach = at(anchor, target);
    const span = Math.max(reach - begin, 0.0001);

    if (options.scrollMode === "hold") {
        const hold = at(anchor, Math.max(target, 1 - target));
        const release = at(1 - anchor, Math.min(target, 1 - target));
        const exit = at(1 - anchor, 0);

        if (progress < hold) {
            return clamp01((progress - begin) / Math.max(hold - begin, 0.0001));
        }

        return progress <= release ? 1 : clamp01((exit - progress) / Math.max(exit - release, 0.0001));
    }

    if (isContinued(context)) {
        return progress < reach ? 0.5 * clamp01((progress - begin) / span) : 0.5 + 0.5 * Math.min(1, (progress - reach) / span / continueFactor);
    }

    return clamp01((progress - begin) / span);
}

function syncWithScroll(context: TContext) {
    const container = getScrollContainer(context.element);
    const observer: ScrollObserver = onScroll({
        container,
        enter: "end start",
        leave: "start end",
        sync: (progress: number) => getScrollProgress(context, observer, progress),
        target: context.element
    });

    refreshOnResize(context, observer, container);
    return observer;
}

function refreshOnResize({ controller, element }: TContext, observer: ScrollObserver, container?: HTMLElement) {
    const resizeObserver = new ResizeObserver(() => observer.container.refresh());

    resizeObserver.observe(element);
    [...(container ?? document.body).children].forEach((child) => resizeObserver.observe(child));
    controller.cleanups.push(() => resizeObserver.disconnect());
}

function getAutoplay(context: TContext) {
    switch (context.trigger) {
        case "mount":
            return true;
        case "visible":
            return context.controller.revealed;
        case "scroll":
            return syncWithScroll(context);
        default:
            return false;
    }
}

function revealOnVisible(context: TContext) {
    const observer = new IntersectionObserver((records) => {
        if (records.some((record) => record.isIntersecting)) {
            observer.disconnect();
            context.controller.revealed = true;
            forward(context.controller);
        }
    });

    observer.observe(context.element);
    context.controller.cleanups.push(() => observer.disconnect());
}

const numberPattern = /-?\d[\d,]*(\.\d+)?/;

function getCounter(element: HTMLElement, from: number): TCounter | undefined {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);

    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const text = node as Text;
        const match = numberPattern.exec(text.data);

        if (match) {
            return {
                decimals: match[1] ? match[1].length - 1 : 0,
                from,
                grouping: match[0].includes(","),
                node: text,
                original: text.data,
                prefix: text.data.slice(0, match.index),
                rendered: text.data,
                suffix: text.data.slice(match.index + match[0].length),
                to: Number(match[0].replaceAll(",", "")),
                value: from
            };
        }
    }

    return undefined;
}

function renderCounter(counter: TCounter) {
    const value = counter.value.toLocaleString("en-US", {
        maximumFractionDigits: counter.decimals,
        minimumFractionDigits: counter.decimals,
        useGrouping: counter.grouping
    });

    counter.rendered = counter.prefix + value + counter.suffix;
    counter.node.data = counter.rendered;
}

function restoreCounter(counter: TCounter) {
    if (counter.node.data === counter.rendered) {
        counter.node.data = counter.original;
    }
}

function getCounters({ controller, options }: TContext, targets: HTMLElement | Array<HTMLElement>) {
    const counters = (Array.isArray(targets) ? targets : [targets])
        .map((target) => getCounter(target, options.countFrom ?? 0))
        .filter((counter) => !!counter);

    controller.cleanups.push(() => counters.forEach(restoreCounter));
    return counters;
}

function animateCounters(counters: Array<TCounter>, params: AnimationParams) {
    return animate(counters, {
        ...params,
        onUpdate: () => counters.forEach(renderCounter),
        value: { from: (_, index) => counters[index!]!.from, to: (_, index) => counters[index!]!.to }
    });
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

function makeTransformable({ controller }: TContext, targets: HTMLElement | Array<HTMLElement>) {
    for (const target of Array.isArray(targets) ? targets : [targets]) {
        if (getComputedStyle(target).display !== "inline") {
            continue;
        }

        const display = target.style.display;
        target.style.display = "inline-block";
        controller.cleanups.push(() => {
            target.style.display = display;
        });
    }
}

function play(context: TContext, targets: HTMLElement | Array<HTMLElement>, delay: NonNullable<AnimationParams["delay"]>, autoplay = getAutoplay(context)) {
    const { controller, options, preset, reduced } = context;
    const continued = isContinued(context);
    const counters = preset.count ? getCounters(context, targets) : [];

    if (!preset.count) {
        makeTransformable(context, targets);
    }

    const params: AnimationParams = {
        alternate: options.alternate ?? preset.alternate ?? false,
        autoplay,
        delay,
        duration: reduced ? 0 : options.duration ?? preset.duration ?? motionConfig.duration,
        ease: options.ease ?? (continued ? "linear" : preset.ease ?? motionConfig.ease),
        loop: getLoop(context)
    };
    const animation = preset.count ? animateCounters(counters, params) : animate(targets, { ...preset.params ?? getValueParams(preset, continued), ...params });

    counters.forEach(renderCounter);

    if (context.trigger === "visible" && !autoplay) {
        animation.seek(0);
    }

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
    bindTrigger(context);
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
        play(context, context.element, context.options.delay ?? 0, false);
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
        case "visible":
            revealOnVisible(context);
            return;
        default:
            return;
    }

    controller.animations.forEach((animation) => animation.seek(0));
}

function setup(element: HTMLElement, options: TMotionOptions) {
    stop(element);

    const controller: TController = { animations: [], cleanups: [], key: getKey(options), looping: false, revealed: false };
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

    if (options.split && !preset.count) {
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

export function replayMotion(elements: Array<HTMLElement>) {
    for (const element of elements) {
        const options = latestOptions.get(element);

        if (options) {
            setup(element, options);
        }
    }
}

export const vMotion: Directive<HTMLElement, TMotionOptions> = {
    mounted(element, { value }) {
        latestOptions.set(element, value);
        setup(element, value);
    },
    updated(element, { value }) {
        latestOptions.set(element, value);

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
        latestOptions.delete(element);
        stop(element);
    }
};

export function makeMotionScroll(scoped: boolean) {
    return defineComponent((props: { lerp?: number; }, { slots }) => {
        const element = ref<HTMLElement>();

        watchEffect((onCleanup) => {
            if (!element.value || !motionConfig.smoothScroll || isReduced()) {
                return;
            }

            const wrapper = scoped ? element.value.closest<HTMLElement>("[data-scroll-root]") ?? undefined : getScrollContainer(element.value);

            if (scoped && !wrapper) {
                return;
            }

            const lenis = new Lenis({
                autoRaf: true,
                content: wrapper ? element.value : undefined,
                lerp: props.lerp ?? motionConfig.smoothScrollLerp,
                wrapper
            });

            onCleanup(() => lenis.destroy());
        }, { flush: "post" });

        return () => h("div", { ref: element }, slots.default?.());
    }, { name: "MotionScroll", props: { lerp: Number } });
}

export const MotionScroll = makeMotionScroll(false);
