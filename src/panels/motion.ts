import { faWandMagicSparkles } from "@fortawesome/pro-solid-svg-icons";
import type { TElementPanel } from "@luna-park/plugin";
import { LogicType } from "@luna-park/plugin";

import { motionPresets, vMotion } from "@/runtime";

import packageDefinition from "../../package.json" with { type: "json" };

export const motionPanel: TElementPanel = {
    id: "motion",
    label: "Motion",
    directive: {
        build: { from: `${ packageDefinition.name }/runtime`, name: "vMotion" },
        value: vMotion
    },
    icon: faWandMagicSparkles,
    properties: {
        enter: LogicType.string({ name: "Enter", default: "none", enum: ["none", ...motionPresets] }),
        trigger: LogicType.string({ name: "Trigger", default: "mount", enum: ["mount", "visible"] }),
        duration: LogicType.number({ name: "Duration (ms)", default: 600 }),
        delay: LogicType.number({ name: "Delay (ms)", default: 0 }),
        ease: LogicType.string({
            name: "Easing",
            default: "outExpo",
            enum: ["linear", "outQuad", "outCubic", "outExpo", "inOutSine", "outBack", "outElastic", "outBounce"]
        })
    }
};
