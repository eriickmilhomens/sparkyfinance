import { useEffect } from "react";

/** Call with `true` when a modal/overlay opens. The floating dock auto-hides. */
export const useDockVisibility = (isOpen: boolean) => {
  useEffect(() => {
    if (isOpen) {
      window.dispatchEvent(new Event("sparky-dock-hide"));
    } else {
      window.dispatchEvent(new Event("sparky-dock-show"));
    }
  }, [isOpen]);
};
