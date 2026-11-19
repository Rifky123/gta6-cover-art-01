// main.js — boots DUSKLINE: wire the editor, then apply any URL session
// (demo presets or the embed-only cover render).

import { initUI } from "./ui.js";
import { applyUrlParams } from "./sessions.js";
import { touch } from "./state.js";

initUI();
applyUrlParams().then(() => touch());
