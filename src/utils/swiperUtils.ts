/**
 * Updates the position of Swiper controls based on whether the Swiper is at the end.
 *
 * @param swiperInstance - The Swiper instance.
 * @param controlsSelector - The CSS selector for the controls container (e.g., '.my-selector-swiper-controls').
 * @param shiftedStateClass - The class to add/remove when the Swiper is at the end (defaults to 'controls-shifted-down').
 */
export function updateSwiperControlsPosition(
  swiperInstance: any, // Swiper instance, using 'any' for broad compatibility
  controlsSelector: string,
  shiftedStateClass: string = 'controls-shifted-down'
) {
  // Find the controls container relative to the swiper element
  const controlsContainer = swiperInstance.el.parentElement?.querySelector(controlsSelector);
  if (!controlsContainer) return; // Exit if controls not found

  if (swiperInstance.isEnd) {
    // We are on the last slide
    controlsContainer.classList.add(shiftedStateClass);
  } else {
    // We are NOT on the last slide
    controlsContainer.classList.remove(shiftedStateClass);
  }
}
