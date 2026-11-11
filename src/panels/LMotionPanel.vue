<template>
    <div class="motion-panel">
        <div class="cards">
            <LMotionCard
                :hint="triggerOptions.find((option) => option.value === modelValue.trigger)?.title"
                :icon="faBolt"
                title="Trigger"
            >
                <LSegmented
                    :model-value="modelValue.trigger"
                    :options="triggerOptions"
                    small
                    wide
                    @update:model-value="update('trigger', $event)"
                />
                <template v-if="modelValue.trigger === 'scroll'">
                    <div class="option">
                        <span class="label">Anchor</span>
                        <LSegmented
                            :model-value="modelValue.scrollAnchor ?? 'top'"
                            :options="anchorOptions"
                            small
                            @update:model-value="update('scrollAnchor', $event)"
                        />
                    </div>
                    <div class="option">
                        <span class="label">Mode</span>
                        <LSegmented
                            :model-value="modelValue.scrollMode ?? 'stop'"
                            :options="scrollModeOptions"
                            small
                            @update:model-value="update('scrollMode', $event)"
                        />
                    </div>
                    <div class="option">
                        <span class="label">Target</span>
                        <LInput
                            class="input"
                            :model-value="modelValue.scrollTarget ?? 50"
                            :options="{ clamp: true, max: 100, min: 0, suffix: '%' }"
                            small
                            type="number"
                            @update:model-value="update('scrollTarget', Number($event))"
                        />
                    </div>
                </template>
            </LMotionCard>
            <LMotionCard
                :hint="startCase(modelValue.preset)"
                :icon="faWandMagicSparkles"
                title="Animation"
            >
                <template #header>
                    <LSegmented
                        :model-value="category"
                        :options="categoryOptions"
                        small
                        @update:model-value="selectCategory($event!)"
                    />
                </template>
                <LSegmented
                    v-if="category !== 'custom'"
                    :model-value="modelValue.preset"
                    :options="presetOptions"
                    small
                    wide
                    @update:model-value="update('preset', $event)"
                />
            </LMotionCard>
            <LMotionCard
                :hint="modelValue.ease ?? `${ motionConfig.ease } (default)`"
                :icon="faChartLine"
                title="Easing"
            >
                <LSegmented
                    :model-value="modelValue.ease ?? motionConfig.ease"
                    :options="easeOptions"
                    small
                    wide
                    @update:model-value="update('ease', $event)"
                >
                    <template
                        v-for="ease in easeNames"
                        :key="ease"
                        #[ease]
                    >
                        <svg
                            class="curve"
                            viewBox="0 0 24 24"
                        >
                            <polyline :points="getCurve(ease)" />
                        </svg>
                    </template>
                </LSegmented>
            </LMotionCard>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { IconDefinition } from "@fortawesome/pro-solid-svg-icons";
import {
    faAnglesLeft,
    faArrowDown,
    faArrowLeft,
    faArrowPointer,
    faArrowRight,
    faArrowRightToLine,
    faArrowsLeftRight,
    faArrowsLeftRightToLine,
    faArrowsRotate,
    faArrowUp,
    faArrowUp19,
    faArrowUpFromLine,
    faBolt,
    faBullseye,
    faChartLine,
    faCircleHalfStroke,
    faDownLeftAndUpRightToCenter,
    faDroplet,
    faExpand,
    faEye,
    faFeather,
    faForward,
    faHandPointer,
    faHeartPulse,
    faLightbulb,
    faObjectsAlignCenterVertical,
    faObjectsAlignTop,
    faPlay,
    faRepeat,
    faRightToBracket,
    faRotateRight,
    faScroll,
    faSliders,
    faSparkles,
    faToggleOn,
    faUpRightAndDownLeftFromCenter,
    faWandMagicSparkles,
    faWaveSquare
} from "@fortawesome/pro-solid-svg-icons";
import type { TOption } from "@luna-park/design";
import { LInput, LSegmented } from "@luna-park/design";
import type { TElementPanelProps } from "@luna-park/plugin";
import { eases } from "animejs";
import { computed, ref, watch } from "vue";

import LMotionCard from "@/panels/components/LMotionCard.vue";
import type { TMotionOptions } from "@/runtime";
import { easeNames, motionConfig, presets } from "@/runtime";

const props = defineProps<TElementPanelProps<TMotionOptions>>();

const emits = defineEmits<(e: "update:modelValue", value: TMotionOptions) => void>();

const presetIcons: Record<string, IconDefinition> = {
    "blink": faLightbulb,
    "blur": faDroplet,
    "count": faArrowUp19,
    "fade": faCircleHalfStroke,
    "float": faFeather,
    "grow": faUpRightAndDownLeftFromCenter,
    "lift": faArrowUpFromLine,
    "marquee": faAnglesLeft,
    "pulse": faHeartPulse,
    "shake": faArrowsLeftRight,
    "shrink": faDownLeftAndUpRightToCenter,
    "slide-down": faArrowDown,
    "slide-left": faArrowLeft,
    "slide-right": faArrowRight,
    "slide-up": faArrowUp,
    "spin": faArrowsRotate,
    "tilt": faRotateRight,
    "wiggle": faWaveSquare,
    "zoom": faExpand
};

const triggerOptions: Array<TOption> = [
    { icon: { icon: faPlay }, label: "", title: "On mount", value: "mount" },
    { icon: { icon: faEye }, label: "", title: "When visible", value: "visible" },
    { icon: { icon: faScroll }, label: "", title: "Synced with scroll", value: "scroll" },
    { icon: { icon: faArrowPointer }, label: "", title: "On hover", value: "hover" },
    { icon: { icon: faHandPointer }, label: "", title: "On press", value: "press" },
    { icon: { icon: faBullseye }, label: "", title: "On focus", value: "focus" },
    { icon: { icon: faToggleOn }, label: "", title: "From a state", value: "state" }
];

const categoryOptions: Array<TOption> = [
    { icon: { icon: faRightToBracket }, label: "", title: "Enter", value: "enter" },
    { icon: { icon: faSparkles }, label: "", title: "Emphasis", value: "emphasis" },
    { icon: { icon: faRepeat }, label: "", title: "Ambient", value: "ambient" },
    { icon: { icon: faSliders }, label: "", title: "Custom from/to", value: "custom" }
];

const anchorOptions: Array<TOption> = [
    { icon: { icon: faObjectsAlignTop }, label: "", title: "Top edge of the element", value: "top" },
    { icon: { icon: faObjectsAlignCenterVertical }, label: "", title: "Center of the element", value: "center" }
];

const scrollModeOptions: Array<TOption> = [
    { icon: { icon: faArrowRightToLine }, label: "", title: "Stop at target", value: "stop" },
    { icon: { icon: faForward }, label: "", title: "Continue past target", value: "continue" },
    { icon: { icon: faArrowsLeftRightToLine }, label: "", title: "Hold between target and 100 − target, then reverse", value: "hold" }
];

const easeOptions: Array<TOption> = easeNames.map((ease) => ({ label: "", title: ease, value: ease }));

const category = ref(getCategory(props.modelValue.preset));

watch(() => props.modelValue.preset, (preset) => {
    category.value = getCategory(preset);
});

const presetOptions = computed<Array<TOption>>(() => Object.entries(presets)
    .filter(([, preset]) => preset.category === category.value)
    .map(([id]) => ({ icon: { icon: presetIcons[id]! }, label: "", title: startCase(id), value: id })));

function getCategory(preset: string) {
    return preset === "custom" ? "custom" : presets[preset]?.category ?? "enter";
}

function selectCategory(value: string) {
    category.value = value;

    const preset = value === "custom" ? "custom" : Object.keys(presets).find((id) => presets[id]!.category === value);

    if (preset && getCategory(props.modelValue.preset) !== value) {
        update("preset", preset);
    }
}

function update(key: keyof TMotionOptions, value: unknown) {
    emits("update:modelValue", { ...props.modelValue, [key]: value });
}

function startCase(value: string) {
    return value.replaceAll("-", " ").replace(/^\w/, (letter) => letter.toUpperCase());
}

function getCurve(name: string) {
    const base = eases[name as keyof typeof eases] as (value?: number) => number | ((value: number) => number);
    const ease = typeof base(0.5) === "function" ? base() as (value: number) => number : base as (value: number) => number;

    return Array.from({ length: 33 }, (_, index) => {
        const x = index / 32;
        return `${ 3 + x * 18 },${ 17 - ease(x) * 10 }`;
    }).join(" ");
}
</script>

<style scoped>
.motion-panel {
    display: flex;
    flex-direction: column;

    .cards {
        margin: var(--length-xs);
        display: flex;
        flex-direction: column;
        gap: var(--length-xs);
    }

    .option {
        display: flex;
        align-items: center;
        gap: var(--length-xs);

        .label {
            width: 48px;
            font-size: var(--font-size-xs);
            color: var(--color-content-liter);
        }

        .input {
            flex: 1;
        }
    }

    .curve {
        width: 16px;
        height: 16px;

        polyline {
            fill: none;
            stroke: currentColor;
            stroke-width: 1.5;
            stroke-linecap: round;
            stroke-linejoin: round;
        }
    }
}
</style>
