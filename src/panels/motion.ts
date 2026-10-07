import { faRotateLeft, faWandMagicSparkles } from "@fortawesome/pro-solid-svg-icons";
import type { TElementPanel } from "@luna-park/plugin";
import { LogicType } from "@luna-park/plugin";
import { markRaw } from "vue";

import LMotionPanel from "@/panels/LMotionPanel.vue";
import type { TMotionOptions } from "@/runtime";
import { easeNames, presets, replayMotion, vMotion } from "@/runtime";

import packageDefinition from "../../package.json" with { type: "json" };

const triggers = ["mount", "visible", "scroll", "hover", "press", "focus", "state"];

function getValuesSchema(name: string) {
    return LogicType.object({
        blur: LogicType.number({ default: 0, name: "Blur", options: { suffix: "px" } }),
        opacity: LogicType.number({ default: 1, name: "Opacity" }),
        rotate: LogicType.number({ default: 0, name: "Rotate (deg)" }),
        scale: LogicType.number({ default: 1, name: "Scale" }),
        x: LogicType.number({ default: 0, name: "X", options: { suffix: "px" } }),
        y: LogicType.number({ default: 0, name: "Y", options: { suffix: "px" } })
    }, { name, options: { hidden: (values: TMotionOptions) => values.preset !== "custom" } });
}

export const motionPanel: TElementPanel = {
    component: markRaw(LMotionPanel),
    directive: {
        build: { from: `${ packageDefinition.name }/runtime`, name: "vMotion" },
        value: vMotion
    },
    icon: faWandMagicSparkles,
    id: "motion",
    label: "Motion",
    actions: [{
        icon: faRotateLeft,
        onClick: ({ getElements }) => replayMotion(getElements()),
        title: "Replay"
    }],
    properties: {
        alternate: LogicType.boolean({ default: true, name: "Alternate", optional: true }),
        delay: LogicType.number({ default: 0, name: "Delay", optional: true, options: { suffix: "ms" } }),
        duration: LogicType.number({ default: 600, name: "Duration", optional: true, options: { suffix: "ms" } }),
        ease: LogicType.string({
            default: "outExpo",
            enum: easeNames,
            name: "Easing",
            optional: true,
            options: { hidden: true }
        }),
        from: getValuesSchema("From"),
        loop: LogicType.number({ default: -1, description: "-1 = infinite", name: "Loops", optional: true }),
        preset: LogicType.string({
            default: "fade",
            enum: [...Object.keys(presets), "custom"],
            name: "Preset",
            options: { hidden: true }
        }),
        split: LogicType.string({
            default: "chars",
            enum: ["chars", "words", "lines"],
            name: "Split text",
            optional: true
        }),
        stagger: LogicType.number({ default: 60, name: "Stagger", optional: true, options: { suffix: "ms" } }),
        staggerFrom: LogicType.string({
            default: "first",
            enum: ["first", "center", "last", "random"],
            name: "Stagger from",
            optional: true,
            options: { hidden: (values: TMotionOptions) => values.stagger === undefined && !values.split }
        }),
        state: LogicType.boolean({
            default: false,
            name: "State",
            options: { hidden: (values: TMotionOptions) => values.trigger !== "state" }
        }),
        to: getValuesSchema("To"),
        trigger: LogicType.string({ default: "mount", enum: triggers, name: "Trigger", options: { hidden: true } })
    }
};
