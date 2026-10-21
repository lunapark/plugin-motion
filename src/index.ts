import type { TEnv } from "@luna-park/plugin";
import { EInjectionKey, LogicType, makePlugin } from "@luna-park/plugin";

import icon from "@/logo.svg";
import { motionPanel } from "@/panels/motion";
import type { TMotionConfig } from "@/runtime";
import { configureMotion, easeNames, makeMotionScroll, MotionScroll } from "@/runtime";

import packageDefinition from "../package.json" with { type: "json" };

const configSchema = LogicType.object({
    duration: LogicType.number({ name: "Default duration (ms)", default: 600 }),
    ease: LogicType.string({ name: "Default easing", default: "outExpo", enum: easeNames }),
    reducedMotion: LogicType.string({ name: "Reduced motion", default: "reduce", enum: ["reduce", "ignore"] }),
    smoothScroll: LogicType.boolean({ name: "Smooth scroll", default: false }),
    smoothScrollLerp: LogicType.number({
        name: "Smooth scroll intensity",
        default: 0.1,
        description: "Lower is smoother.",
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

function applyConfig({ config }: TEnv<typeof configSchema>) {
    configureMotion(config as TMotionConfig);
}

export default makePlugin({
    id: "motion",
    name: "Motion",
    description: "Animate elements with anime.js.",
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
    editor: {
        panel: {
            element: [motionPanel]
        },
        wrapper: getWrapper
    },
    icon,
    lifecycle: {
        mount: applyConfig,
        update: applyConfig
    }
});
