/**
 * Carousel Module - Template Preview Carousel with Touch Support
 * 
 * Provides a production-ready carousel implementation with:
 * - Touch/swipe gesture support
 * - Keyboard navigation
 * - Automatic rotation with pause on interaction
 * - Accessibility features (ARIA, focus management)
 * - Performance optimizations (RAF, lazy loading)
 * - Kill switch support via data attribute
 * 
 * @module carousel
 */

(function() {
  'use strict';

  /**
   * Carousel Controller Class
   * Manages carousel state, navigation, and user interactions
   */
  class CarouselController {
    /**
     * Initialize carousel controller
     * @param {HTMLElement} container - Carousel container element
     */
    constructor(container) {
      if (!container) {
        throw new Error('Carousel container element is required');
      }

      this.container = container;
      this.track = container.querySelector('.carousel-track');
      this.slides = Array.from(container.querySelectorAll('.carousel-slide'));
      this.prevButton = container.querySelector('[data-carousel-prev]');
      this.nextButton = container.querySelector('[data-carousel-next]');
      this.indicators = Array.from(container.querySelectorAll('[data-carousel-indicator]'));
      
      // Validate required elements
      if (!this.track || this.slides.length === 0) {
        console.error('Carousel: Missing required elements (track or slides)');
        return;
      }

      // State management
      this.currentIndex = 0;
      this.isTransitioning = false;
      this.autoRotateInterval = null;
      this.touchStartX = 0;
      this.touchEndX = 0;
      this.isDisabled = container.dataset.disableCarousel === 'true';
      
      // Configuration
      this.config = {
        autoRotateDelay: 5000,
        transitionDuration: 350,
        swipeThreshold: 50,
        dragThreshold: 50
      };

      // Bound methods for event listeners
      this.boundHandleKeyboard = this.handleKeyboard.bind(this);
      this.boundHandleTouchStart = this.handleTouchStart.bind(this);
      this.boundHandleTouchMove = this.handleTouchMove.bind(this);
      this.boundHandleTouchEnd = this.handleTouchEnd.bind(this);
      this.boundHandleMouseEnter = this.pauseAutoRotate.bind(this);
      this.boundHandleMouseLeave = this.startAutoRotate.bind(this);
      this.boundHandleFocusIn = this.pauseAutoRotate.bind(this);
      this.boundHandleFocusOut = this.startAutoRotate.bind(this);

      if (!this.isDisabled) {
        this.init();
      } else {
        console.log('Carousel: Disabled via data-disable-carousel attribute');
      }
    }

    /**
     * Initialize carousel functionality
     */
    init() {
      try {
        this.setupEventListeners();
        this.setupIntersectionObserver();
        this.startAutoRotate();
        this.updateAccessibility();
        console.log('Carousel: Initialized successfully with', this.slides.length, 'slides');
      } catch (error) {
        console.error('Carousel: Initialization failed', error);
      }
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
      // Button navigation
      if (this.prevButton) {
        this.prevButton.addEventListener('click', () => this.navigate('prev'));
      }
      if (this.nextButton) {
        this.nextButton.addEventListener('click', () => this.navigate('next'));
      }

      // Indicator navigation
      this.indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => this.goToSlide(index));
      });

      // Keyboard navigation
      this.container.addEventListener('keydown', this.boundHandleKeyboard);

      // Touch/swipe support
      this.track.addEventListener('touchstart', this.boundHandleTouchStart, { passive: true });
      this.track.addEventListener('touchmove', this.boundHandleTouchMove, { passive: true });
      this.track.addEventListener('touchend', this.boundHandleTouchEnd);

      // Mouse drag support
      this.setupMouseDrag();

      // Pause auto-rotate on hover
      this.container.addEventListener('mouseenter', this.boundHandleMouseEnter);
      this.container.addEventListener('mouseleave', this.boundHandleMouseLeave);

      // Pause auto-rotate on focus
      this.container.addEventListener('focusin', this.boundHandleFocusIn);
      this.container.addEventListener('focusout', this.boundHandleFocusOut);
    }

    /**
     * Setup mouse drag functionality
     */
    setupMouseDrag() {
      let isDragging = false;
      let startX = 0;
      let currentX = 0;

      const handleMouseDown = (e) => {
        isDragging = true;
        startX = e.pageX;
        this.track.style.cursor = 'grabbing';
        this.pauseAutoRotate();
      };

      const handleMouseMove = (e) => {
        if (!isDragging) return;
        currentX = e.pageX;
      };

      const handleMouseUp = () => {
        if (!isDragging) return;
        isDragging = false;
        this.track.style.cursor = 'grab';
        
        const diff = startX - currentX;
        if (Math.abs(diff) > this.config.dragThreshold) {
          if (diff > 0) {
            this.navigate('next');
          } else {
            this.navigate('prev');
          }
        }
        this.startAutoRotate();
      };

      this.track.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    /**
     * Setup intersection observer for lazy loading
     */
    setupIntersectionObserver() {
      const images = this.container.querySelectorAll('img[loading="lazy"]');
      
      if (!('IntersectionObserver' in window)) {
        console.warn('Carousel: IntersectionObserver not supported, loading all images');
        images.forEach(img => {
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
        });
        return;
      }

      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              img.addEventListener('load', () => {
                console.log('Carousel: Image loaded successfully');
              });
              img.addEventListener('error', () => {
                console.error('Carousel: Image failed to load', img.dataset.src);
              });
            }
            imageObserver.unobserve(img);
          }
        });
      }, {
        rootMargin: '50px'
      });

      images.forEach(img => imageObserver.observe(img));
    }

    /**
     * Handle keyboard navigation
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyboard(e) {
      switch(e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          this.navigate('prev');
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.navigate('next');
          break;
        case 'Home':
          e.preventDefault();
          this.goToSlide(0);
          break;
        case 'End':
          e.preventDefault();
          this.goToSlide(this.slides.length - 1);
          break;
      }
    }

    /**
     * Handle touch start event
     * @param {TouchEvent} e - Touch event
     */
    handleTouchStart(e) {
      this.touchStartX = e.changedTouches[0].screenX;
      this.pauseAutoRotate();
    }

    /**
     * Handle touch move event
     * @param {TouchEvent} e - Touch event
     */
    handleTouchMove(e) {
      this.touchEndX = e.changedTouches[0].screenX;
    }

    /**
     * Handle touch end event
     */
    handleTouchEnd() {
      const diff = this.touchStartX - this.touchEndX;

      if (Math.abs(diff) > this.config.swipeThreshold) {
        if (diff > 0) {
          this.navigate('next');
        } else {
          this.navigate('prev');
        }
      }

      this.startAutoRotate();
    }

    /**
     * Navigate to next or previous slide
     * @param {string} direction - 'next' or 'prev'
     */
    navigate(direction) {
      if (this.isTransitioning) {
        console.log('Carousel: Navigation blocked - transition in progress');
        return;
      }

      const newIndex = direction === 'next' 
        ? (this.currentIndex + 1) % this.slides.length
        : (this.currentIndex - 1 + this.slides.length) % this.slides.length;

      this.goToSlide(newIndex);
    }

    /**
     * Go to specific slide
     * @param {number} index - Target slide index
     */
    goToSlide(index) {
      if (this.isTransitioning || index === this.currentIndex) {
        return;
      }

      if (index < 0 || index >= this.slides.length) {
        console.error('Carousel: Invalid slide index', index);
        return;
      }

      this.isTransitioning = true;
      const previousIndex = this.currentIndex;
      this.currentIndex = index;

      // Use CSS transform for smooth transition
      const offset = -index * 100;
      this.track.style.transform = `translateX(${offset}%)`;

      this.updateIndicators();
      this.updateAccessibility();

      console.log(`Carousel: Navigated from slide ${previousIndex + 1} to ${index + 1}`);

      // Reset transition lock after animation completes
      setTimeout(() => {
        this.isTransitioning = false;
      }, this.config.transitionDuration);
    }

    /**
     * Update indicator states
     */
    updateIndicators() {
      if (this.indicators.length === 0) return;

      this.indicators.forEach((indicator, index) => {
        const isActive = index === this.currentIndex;
        indicator.setAttribute('aria-selected', isActive.toString());
        indicator.setAttribute('tabindex', isActive ? '0' : '-1');
      });
    }

    /**
     * Update accessibility attributes
     */
    updateAccessibility() {
      this.slides.forEach((slide, index) => {
        const isActive = index === this.currentIndex;
        slide.setAttribute('aria-hidden', (!isActive).toString());
        
        // Update focusable elements
        const focusableElements = slide.querySelectorAll('a, button, input, [tabindex]');
        focusableElements.forEach(el => {
          el.setAttribute('tabindex', isActive ? '0' : '-1');
        });
      });

      // Update button states
      if (this.prevButton && this.nextButton) {
        const slideText = `Slide ${this.currentIndex + 1} of ${this.slides.length}`;
        this.prevButton.setAttribute('aria-label', `Previous template - ${slideText}`);
        this.nextButton.setAttribute('aria-label', `Next template - ${slideText}`);
      }
    }

    /**
     * Start automatic rotation
     */
    startAutoRotate() {
      this.pauseAutoRotate();
      
      this.autoRotateInterval = setInterval(() => {
        this.navigate('next');
      }, this.config.autoRotateDelay);

      console.log('Carousel: Auto-rotate started');
    }

    /**
     * Pause automatic rotation
     */
    pauseAutoRotate() {
      if (this.autoRotateInterval) {
        clearInterval(this.autoRotateInterval);
        this.autoRotateInterval = null;
        console.log('Carousel: Auto-rotate paused');
      }
    }

    /**
     * Destroy carousel and cleanup
     */
    destroy() {
      this.pauseAutoRotate();
      
      // Remove event listeners
      this.container.removeEventListener('keydown', this.boundHandleKeyboard);
      this.track.removeEventListener('touchstart', this.boundHandleTouchStart);
      this.track.removeEventListener('touchmove', this.boundHandleTouchMove);
      this.track.removeEventListener('touchend', this.boundHandleTouchEnd);
      this.container.removeEventListener('mouseenter', this.boundHandleMouseEnter);
      this.container.removeEventListener('mouseleave', this.boundHandleMouseLeave);
      this.container.removeEventListener('focusin', this.boundHandleFocusIn);
      this.container.removeEventListener('focusout', this.boundHandleFocusOut);

      console.log('Carousel: Destroyed and cleaned up');
    }
  }

  // Export for use in other modules
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CarouselController };
  } else if (typeof window !== 'undefined') {
    window.CarouselController = CarouselController;
  }
})();