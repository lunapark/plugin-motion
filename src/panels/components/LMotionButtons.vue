<template>
    <div class="motion-buttons">
        <LTooltip
            v-for="option of options"
            :key="option.id"
            class="button-wrapper"
            :class="{fill}"
            :title="option.title"
        >
            <LButton
                class="button"
                :icon="option.icon"
                :primary="option.id === modelValue"
                small
                :square="!fill"
                :wide="fill"
                @click="$emit('update:modelValue', option.id)"
            >
                <slot
                    :name="option.id"
                />
            </LButton>
        </LTooltip>
    </div>
</template>

<script setup lang="ts">
import type { IconDefinition } from "@fortawesome/pro-solid-svg-icons";
import { LButton, LTooltip } from "@luna-park/design";

export type TMotionButton = {
    icon?: IconDefinition;
    id: string;
    title: string;
};

defineProps<{
    fill?: boolean;
    modelValue?: string;
    options: Array<TMotionButton>;
}>();

defineEmits<(e: "update:modelValue", value: string) => void>();
</script>

<style scoped>
.motion-buttons {
    display: flex;
    gap: var(--length-xxxxs);

    .button-wrapper {
        &.fill {
            flex: 1 1 0;

            &:deep(.button) {
                padding: 0;
            }
        }

        &:not(:first-child) .button {
            border-top-left-radius: 0;
            border-bottom-left-radius: 0;
        }

        &:not(:last-child) .button {
            border-top-right-radius: 0;
            border-bottom-right-radius: 0;
        }
    }
}
</style>
