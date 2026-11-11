import type { TEnv } from "@luna-park/plugin";
import { EInjectionKey, LogicType, makePlugin } from "@luna-park/plugin";

import llm from "@/llm.md?raw";
import icon from "@/logo.svg";
import { motionPanel } from "@/panels/motion";
import type { TMotionConfig } from "@/runtime";
import { configureMotion, easeNames, makeMotionScroll, MotionScroll } from "@/runtime";

import packageDefinition from "../package.json" with { type: "json" };
const configSchema = LogicType.object({
    anchorOffset: LogicType.number({
        default: 0,
        description: "Space kept above a section reached from a link, e.g. the height of a sticky header.",
        name: "Anchor offset",
        options: { suffix: "px" }
    }),
    anchorScroll: LogicType.boolean({
        default: false,
        description: "Links to a section of the page (#pricing) scroll to it smoothly.",
        name: "Smooth anchor links"
    }),
    duration: LogicType.number({ default: 600, name: "Default duration (ms)" }),
    ease: LogicType.string({ default: "outExpo", enum: easeNames, name: "Default easing" }),
    reducedMotion: LogicType.string({ default: "reduce", enum: ["reduce", "ignore"], name: "Reduced motion" }),
    smoothScroll: LogicType.boolean({ default: false, name: "Smooth scroll" }),
    smoothScrollLerp: LogicType.number({
        default: 0.1,
        description: "Lower is smoother.",
        name: "Smooth scroll intensity",
        options: { clamp: true, max: 1, min: 0.01, step: 0.01 }
    })
});

const EditorMotionScroll = makeMotionScroll(true);

function getWrapper({ config, mode }: TEnv<typeof configSchema>) {
    if (mode === "editor") {
        return { component: EditorMotionScroll, name: "MotionScroll" };
    }

    if (!config.smoothScroll) {
        return undefined;
    }

    return {
        attributes: { ":lerp": String(config.smoothScrollLerp) },
        component: MotionScroll,
        name: "MotionScroll"
    };
}

function getAnchorCss({ config, mode }: TEnv<typeof configSchema>) {
    if (mode === "editor" || !config.anchorScroll) {
        return "";
    }

    const offset = `[id] { scroll-margin-top: ${ config.anchorOffset }px; }`;

    if (config.smoothScroll) {
        return offset;
    }

    const smooth = "html { scroll-behavior: smooth; }";
    return `${ offset } ${ config.reducedMotion === "reduce" ? `@media (prefers-reduced-motion: no-preference) { ${ smooth } }` : smooth }`;
}

function applyConfig({ config }: TEnv<typeof configSchema>) {
    configureMotion(config as TMotionConfig);
}

export default makePlugin({
    build: {
        frontImports: [{ name: packageDefinition.name, version: packageDefinition.version }],
        injections: ({ config }) => ({
            [EInjectionKey.AppImport]: `import { MotionScroll } from "${ packageDefinition.name }/runtime";`,
            [EInjectionKey.AppBody]: `app.component("MotionScroll", MotionScroll);`,
            [EInjectionKey.AppSetup]: `
import { configureMotion } from "${ packageDefinition.name }/runtime";
configureMotion(${ JSON.stringify(config) });
`
        })
    },
    config: configSchema,
    description: "Animate elements with anime.js.",
    editor: {
        panel: {
            element: [motionPanel]
        },
        wrapper: getWrapper
    },
    icon,
    id: "motion",
    inject: {
        css: getAnchorCss
    },
    lifecycle: {
        mount: applyConfig,
        update: applyConfig
    },
    llm,
    name: "Motion"
});
