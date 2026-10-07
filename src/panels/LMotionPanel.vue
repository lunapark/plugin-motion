<template>
    <div class="motion-panel">
        <LInspectorRow title="Trigger">
            <LMotionButtons
                fill
                :model-value="modelValue.trigger"
                :options="triggerOptions"
                @update:model-value="update('trigger', $event)"
            />
        </LInspectorRow>
        <div class="cards">
            <LMotionCard
                :hint="startCase(modelValue.preset)"
                :icon="faWandMagicSparkles"
                title="Animation"
            >
                <template #header>
                    <LMotionButtons
                        :model-value="category"
                        :options="categoryOptions"
                        @update:model-value="selectCategory"
                    />
                </template>
                <LMotionButtons
                    v-if="category !== 'custom'"
                    fill
                    :model-value="modelValue.preset"
                    :options="presetOptions"
                    @update:model-value="update('preset', $event)"
                />
            </LMotionCard>
            <LMotionCard
                :hint="modelValue.ease ?? `${ motionConfig.ease } (default)`"
                :icon="faChartLine"
                title="Easing"
            >
                <LMotionButtons
                    fill
                    :model-value="modelValue.ease ?? motionConfig.ease"
                    :options="easeOptions"
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
                </LMotionButtons>
            </LMotionCard>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { IconDefinition } from "@fortawesome/pro-solid-svg-icons";
import {
    faArrowDown,
    faArrowLeft,
    faArrowPointer,
    faArrowRight,
    faArrowsLeftRight,
    faArrowsRotate,
    faArrowUp,
    faArrowUpFromLine,
    faBullseye,
    faChartLine,
    faCircleHalfStroke,
    faDownLeftAndUpRightToCenter,
    faDroplet,
    faExpand,
    faEye,
    faFeather,
    faHandPointer,
    faHeartPulse,
    faLightbulb,
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
import { LInspectorRow } from "@luna-park/design";
import type { TLayoutSchema } from "@luna-park/plugin";
import { eases } from "animejs";
import { computed, ref, watch } from "vue";

import type { TMotionButton } from "@/panels/components/LMotionButtons.vue";
import LMotionButtons from "@/panels/components/LMotionButtons.vue";
import LMotionCard from "@/panels/components/LMotionCard.vue";
import type { TMotionOptions } from "@/runtime";
import { easeNames, motionConfig, presets } from "@/runtime";

const props = defineProps<{
    modelValue: TMotionOptions;
    schema: TLayoutSchema;
}>();

const emits = defineEmits<(e: "update:modelValue", value: TMotionOptions) => void>();

const presetIcons: Record<string, IconDefinition> = {
    "fade": faCircleHalfStroke,
    "slide-up": faArrowUp,
    "slide-down": faArrowDown,
    "slide-left": faArrowLeft,
    "slide-right": faArrowRight,
    "zoom": faExpand,
    "blur": faDroplet,
    "grow": faUpRightAndDownLeftFromCenter,
    "shrink": faDownLeftAndUpRightToCenter,
    "lift": faArrowUpFromLine,
    "tilt": faRotateRight,
    "pulse": faHeartPulse,
    "float": faFeather,
    "spin": faArrowsRotate,
    "shake": faArrowsLeftRight,
    "blink": faLightbulb,
    "wiggle": faWaveSquare
};

const triggerOptions: Array<TMotionButton> = [
    { id: "mount", icon: faPlay, title: "On mount" },
    { id: "visible", icon: faEye, title: "When visible" },
    { id: "scroll", icon: faScroll, title: "Synced with scroll" },
    { id: "hover", icon: faArrowPointer, title: "On hover" },
    { id: "press", icon: faHandPointer, title: "On press" },
    { id: "focus", icon: faBullseye, title: "On focus" },
    { id: "state", icon: faToggleOn, title: "From a state" }
];

const categoryOptions: Array<TMotionButton> = [
    { id: "enter", icon: faRightToBracket, title: "Enter" },
    { id: "emphasis", icon: faSparkles, title: "Emphasis" },
    { id: "ambient", icon: faRepeat, title: "Ambient" },
    { id: "custom", icon: faSliders, title: "Custom from/to" }
];

const easeOptions: Array<TMotionButton> = easeNames.map((ease) => ({ id: ease, title: ease }));

const category = ref(getCategory(props.modelValue.preset));

watch(() => props.modelValue.preset, (preset) => {
    category.value = getCategory(preset);
});

const presetOptions = computed<Array<TMotionButton>>(() => Object.entries(presets)
    .filter(([, preset]) => preset.category === category.value)
    .map(([id]) => ({ id, icon: presetIcons[id], title: startCase(id) })));

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
