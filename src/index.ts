import { initButtonClickListeners } from "./scripts/dom";

initButtonClickListeners();

// Extend Window interface to include modulesLoaded
declare global {
  interface Window {
    modulesLoaded: boolean;
  }
}

window.modulesLoaded = true;