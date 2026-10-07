<template>
    <div class="motion-card">
        <div class="header">
            <div class="title">
                <LIcon
                    class="icon"
                    :icon="icon"
                />
                {{ title }}
                <span
                    v-if="hint"
                    class="hint"
                >{{ hint }}</span>
            </div>
            <slot name="header" />
        </div>
        <slot />
    </div>
</template>

<script setup lang="ts">
import type { IconDefinition } from "@fortawesome/pro-solid-svg-icons";
import { LIcon } from "@luna-park/design";

defineProps<{
    hint?: string;
    icon: IconDefinition;
    title: string;
}>();
</script>

<style scoped>
.motion-card {
    display: flex;
    flex-direction: column;
    gap: var(--length-xxs);
    background: var(--color-background-dark);
    padding: var(--length-xs);
    border-radius: var(--length-radius-s);

    .header {
        font-size: var(--font-size-xs);
        color: var(--color-content-lite);
        display: flex;
        align-items: center;
        gap: var(--length-xxs);

        .title {
            flex: 1;
            display: flex;
            align-items: center;
            gap: var(--length-xxs);

            .icon {
                font-size: var(--font-icon-xxs);
                color: var(--color-content-liter);
            }

            .hint {
                color: var(--color-content-litest);
            }
        }
    }
}
</style>
