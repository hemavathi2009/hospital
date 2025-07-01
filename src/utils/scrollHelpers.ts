/**
 * Scrolls the window to the top of the page with optional smooth behavior
 * @param smooth Whether to use smooth scrolling animation
 */
export const scrollToTop = (smooth: boolean = true) => {
  window.scrollTo({
    top: 0,
    behavior: smooth ? 'smooth' : 'auto'
  });
};

/**
 * Scrolls to a specific element by ID with optional offset and smooth behavior
 * @param elementId The ID of the element to scroll to
 * @param offset Optional offset from the top of the element in pixels
 * @param smooth Whether to use smooth scrolling animation
 */
export const scrollToElement = (elementId: string, offset: number = 0, smooth: boolean = true) => {
  const element = document.getElementById(elementId);
  if (element) {
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;
    
    window.scrollTo({
      top: offsetPosition,
      behavior: smooth ? 'smooth' : 'auto'
    });
  }
};
