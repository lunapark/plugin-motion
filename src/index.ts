import type { TEnv } from "@luna-park/plugin";
import { EInjectionKey, LogicType, makePlugin } from "@luna-park/plugin";

import icon from "@/logo.svg";
import { motionPanel } from "@/panels/motion";
import type { TMotionConfig } from "@/runtime";
import { configureMotion, easeNames } from "@/runtime";

import packageDefinition from "../package.json" with { type: "json" };

const configSchema = LogicType.object({
    duration: LogicType.number({ name: "Default duration (ms)", default: 600 }),
    ease: LogicType.string({ name: "Default easing", default: "outExpo", enum: easeNames }),
    reducedMotion: LogicType.string({ name: "Reduced motion", default: "reduce", enum: ["reduce", "ignore"] })
});

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
        }
    },
    icon,
    lifecycle: {
        mount: applyConfig,
        update: applyConfig
    }
});
