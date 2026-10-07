import { makePlugin } from "@luna-park/plugin";

import icon from "@/logo.svg";
import { motionPanel } from "@/panels/motion";

import packageDefinition from "../package.json" with { type: "json" };

export default makePlugin({
    id: "motion",
    name: "Motion",
    description: "Animate elements with anime.js.",
    build: {
        frontImports: [{ name: packageDefinition.name, version: packageDefinition.version }]
    },
    editor: {
        panel: {
            element: [motionPanel]
        }
    },
    icon
});
