import vue from "@vitejs/plugin-vue";
import path from "path";
import type { UserConfig } from "vite";
import { defineConfig } from "vite";

import packageDefinition from "./package.json" with { type: "json" };

export default defineConfig(() => {
    const config: UserConfig = {
        build: {
            lib: {
                name: "@luna-park/plugin-motion",
                entry: {
                    index: "src/index.ts",
                    runtime: "src/runtime/index.ts"
                },
                formats: ["es"]
            },
            rolldownOptions: {
                external: [...Object.keys(packageDefinition.peerDependencies || {})]
            }
        },
        plugins: [
            vue()
        ],
        preview: {
            allowedHosts: [
                "localhost",
                "127.0.0.1",
                "https://luna-park.app"
            ],
            host: "127.0.0.1",
            port: 2084
        },
        resolve: {
            alias: {
                "@": path.resolve(import.meta.dirname, "src")
            }
        }
    };

    return config;
});
