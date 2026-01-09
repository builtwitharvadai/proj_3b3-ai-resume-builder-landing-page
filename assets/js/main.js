/**
 * AI Resume Builder - Main JavaScript Module
 * Production-ready interactive functionality with modern ES6+ patterns
 * 
 * @module main
 * @version 1.0.0
 * @description Core JavaScript functionality for landing page interactions,
 *              smooth scrolling, mobile navigation, and animation triggers
 */

(function() {
  'use strict';

  /**
   * Application state management
   * Centralized state for tracking UI interactions and component states
   */
  const AppState = {
    mobileMenuOpen: false,
    scrollPosition: 0,
    isScrolling: false,
    activeSection: null,
    observers: new Map(),
    
    /**
     * Update state and trigger side effects
     * @param {string} key - State property to update
     * @param {*} value - New value
     */
    setState(key, value) {
      this[key] = value;
      this.notifyObservers(key, value);
    },
    
    /**
     * Register observer for state changes
     * @param {string} key - State property to observe
     * @param {Function} callback - Callback function
     */
    observe(key, callback) {
      if (!this.observers.has(key)) {
        this.observers.set(key, new Set());
      }
      this.observers.get(key).add(callback);
    },
    
    /**
     * Notify all observers of state change
     * @param {string} key - Changed state property
     * @param {*} value - New value
     */
    notifyObservers(key, value) {
      const callbacks = this.observers.get(key);
      if (callbacks) {
        callbacks.forEach(callback => {
          try {
            callback(value);
          } catch (error) {
            console.error(`Observer callback error for ${key}:`, error);
          }
        });
      }
    }
  };

  /**
   * DOM element cache for performance optimization
   * Prevents repeated DOM queries
   */
  const DOMCache = {
    elements: new Map(),
    
    /**
     * Get cached element or query and cache it
     * @param {string} selector - CSS selector
     * @returns {Element|null} DOM element
     */
    get(selector) {
      if (!this.elements.has(selector)) {
        const element = document.querySelector(selector);
        if (element) {
          this.elements.set(selector, element);
        }
        return element;
      }
      return this.elements.get(selector);
    },
    
    /**
     * Get all matching elements
     * @param {string} selector - CSS selector
     * @returns {NodeList} List of DOM elements
     */
    getAll(selector) {
      return document.querySelectorAll(selector);
    },
    
    /**
     * Clear cache (useful for dynamic content)
     */
    clear() {
      this.elements.clear();
    }
  };

  /**
   * Smooth scroll utility with easing
   * Provides smooth scrolling to target elements with configurable behavior
   */
  const SmoothScroll = {
    /**
     * Scroll to target element with smooth animation
     * @param {Element} target - Target element to scroll to
     * @param {Object} options - Scroll options
     */
    scrollTo(target, options = {}) {
      if (!target) {
        console.warn('SmoothScroll: Target element not found');
        return;
      }

      const {
        offset = 80,
        behavior = 'smooth',
        block = 'start'
      } = options;

      const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
      
      try {
        window.scrollTo({
          top: targetPosition,
          behavior: behavior
        });
      } catch (error) {
        console.error('SmoothScroll error:', error);
        window.scrollTo(0, targetPosition);
      }
    },

    /**
     * Initialize smooth scroll for all anchor links
     */
    init() {
      const anchorLinks = DOMCache.getAll('a[href^="#"]');
      
      anchorLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          const href = link.getAttribute('href');
          
          if (href === '#' || href === '#!') {
            e.preventDefault();
            return;
          }

          const targetId = href.substring(1);
          const target = document.getElementById(targetId);

          if (target) {
            e.preventDefault();
            this.scrollTo(target);
            
            if (AppState.mobileMenuOpen) {
              MobileMenu.close();
            }

            if ('pushState' in history) {
              history.pushState(null, '', href);
            }
          }
        });
      });
    }
  };

  /**
   * Mobile navigation menu controller
   * Handles mobile menu toggle, accessibility, and animations
   */
  const MobileMenu = {
    button: null,
    menu: null,
    initialized: false,

    /**
     * Initialize mobile menu functionality
     */
    init() {
      if (this.initialized) return;

      this.button = DOMCache.get('[aria-controls="mobile-menu"]');
      this.menu = DOMCache.get('#mobile-menu');

      if (!this.button || !this.menu) {
        console.warn('MobileMenu: Required elements not found');
        return;
      }

      this.button.addEventListener('click', () => this.toggle());
      
      this.menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => this.close());
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && AppState.mobileMenuOpen) {
          this.close();
        }
      });

      this.initialized = true;
    },

    /**
     * Toggle mobile menu open/closed
     */
    toggle() {
      if (AppState.mobileMenuOpen) {
        this.close();
      } else {
        this.open();
      }
    },

    /**
     * Open mobile menu
     */
    open() {
      if (!this.menu || !this.button) return;

      this.menu.classList.remove('hidden');
      this.button.setAttribute('aria-expanded', 'true');
      AppState.setState('mobileMenuOpen', true);
      
      document.body.style.overflow = 'hidden';
      
      this.menu.querySelectorAll('a')[0]?.focus();
    },

    /**
     * Close mobile menu
     */
    close() {
      if (!this.menu || !this.button) return;

      this.menu.classList.add('hidden');
      this.button.setAttribute('aria-expanded', 'false');
      AppState.setState('mobileMenuOpen', false);
      
      document.body.style.overflow = '';
      
      this.button.focus();
    }
  };

  /**
   * Intersection Observer for scroll animations
   * Triggers animations when elements enter viewport
   */
  const ScrollAnimations = {
    observer: null,
    animatedElements: new WeakSet(),

    /**
     * Initialize scroll-triggered animations
     */
    init() {
      if (!('IntersectionObserver' in window)) {
        console.warn('IntersectionObserver not supported');
        return;
      }

      const options = {
        root: null,
        rootMargin: '0px 0px -100px 0px',
        threshold: 0.1
      };

      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.animatedElements.has(entry.target)) {
            this.animateElement(entry.target);
            this.animatedElements.add(entry.target);
          }
        });
      }, options);

      this.observeElements();
    },

    /**
     * Observe elements for animation
     */
    observeElements() {
      const elementsToAnimate = [
        ...DOMCache.getAll('section'),
        ...DOMCache.getAll('article'),
        ...DOMCache.getAll('.animate-on-scroll')
      ];

      elementsToAnimate.forEach(element => {
        if (element) {
          this.observer.observe(element);
        }
      });
    },

    /**
     * Apply animation to element
     * @param {Element} element - Element to animate
     */
    animateElement(element) {
      element.style.opacity = '0';
      element.style.transform = 'translateY(20px)';
      
      requestAnimationFrame(() => {
        element.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
      });
    },

    /**
     * Cleanup observer
     */
    destroy() {
      if (this.observer) {
        this.observer.disconnect();
      }
    }
  };

  /**
   * Active section tracker for navigation highlighting
   * Updates navigation based on scroll position
   */
  const SectionTracker = {
    sections: [],
    navLinks: [],

    /**
     * Initialize section tracking
     */
    init() {
      this.sections = Array.from(DOMCache.getAll('section[id]'));
      this.navLinks = Array.from(DOMCache.getAll('nav a[href^="#"]'));

      if (this.sections.length === 0) return;

      let ticking = false;
      
      window.addEventListener('scroll', () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            this.updateActiveSection();
            ticking = false;
          });
          ticking = true;
        }
      });

      this.updateActiveSection();
    },

    /**
     * Update active section based on scroll position
     */
    updateActiveSection() {
      const scrollPosition = window.pageYOffset + 100;

      let currentSection = null;

      for (const section of this.sections) {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;

        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          currentSection = section.id;
          break;
        }
      }

      if (currentSection !== AppState.activeSection) {
        AppState.setState('activeSection', currentSection);
        this.highlightNavLink(currentSection);
      }
    },

    /**
     * Highlight active navigation link
     * @param {string} sectionId - Active section ID
     */
    highlightNavLink(sectionId) {
      this.navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === `#${sectionId}`) {
          link.classList.add('text-blue-600', 'font-semibold');
        } else {
          link.classList.remove('text-blue-600', 'font-semibold');
        }
      });
    }
  };

  /**
   * Form validation and handling
   * Provides client-side validation for contact form
   */
  const FormHandler = {
    /**
     * Initialize form handling
     */
    init() {
      const form = DOMCache.get('form[action="/contact"]');
      if (!form) return;

      form.addEventListener('submit', (e) => this.handleSubmit(e, form));

      const inputs = form.querySelectorAll('input, textarea');
      inputs.forEach(input => {
        input.addEventListener('blur', () => this.validateField(input));
        input.addEventListener('input', () => this.clearError(input));
      });
    },

    /**
     * Handle form submission
     * @param {Event} e - Submit event
     * @param {HTMLFormElement} form - Form element
     */
    handleSubmit(e, form) {
      e.preventDefault();

      const isValid = this.validateForm(form);

      if (isValid) {
        console.log('Form is valid, ready for submission');
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        console.log('Form data:', data);
      }
    },

    /**
     * Validate entire form
     * @param {HTMLFormElement} form - Form to validate
     * @returns {boolean} Validation result
     */
    validateForm(form) {
      const inputs = form.querySelectorAll('input[required], textarea[required]');
      let isValid = true;

      inputs.forEach(input => {
        if (!this.validateField(input)) {
          isValid = false;
        }
      });

      return isValid;
    },

    /**
     * Validate individual field
     * @param {HTMLInputElement} field - Field to validate
     * @returns {boolean} Validation result
     */
    validateField(field) {
      const value = field.value.trim();
      const type = field.type;
      let isValid = true;
      let errorMessage = '';

      if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = 'This field is required';
      } else if (type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          isValid = false;
          errorMessage = 'Please enter a valid email address';
        }
      }

      if (!isValid) {
        this.showError(field, errorMessage);
      } else {
        this.clearError(field);
      }

      return isValid;
    },

    /**
     * Show field error
     * @param {HTMLInputElement} field - Field with error
     * @param {string} message - Error message
     */
    showError(field, message) {
      this.clearError(field);

      field.classList.add('border-red-500');
      field.setAttribute('aria-invalid', 'true');

      const errorDiv = document.createElement('div');
      errorDiv.className = 'text-red-500 text-sm mt-1';
      errorDiv.textContent = message;
      errorDiv.setAttribute('role', 'alert');

      field.parentElement.appendChild(errorDiv);
    },

    /**
     * Clear field error
     * @param {HTMLInputElement} field - Field to clear error from
     */
    clearError(field) {
      field.classList.remove('border-red-500');
      field.removeAttribute('aria-invalid');

      const errorDiv = field.parentElement.querySelector('.text-red-500');
      if (errorDiv) {
        errorDiv.remove();
      }
    }
  };

  /**
   * Performance monitoring utility
   * Tracks page performance metrics
   */
  const PerformanceMonitor = {
    /**
     * Log performance metrics
     */
    logMetrics() {
      if (!('performance' in window)) return;

      window.addEventListener('load', () => {
        setTimeout(() => {
          const perfData = window.performance.timing;
          const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
          const connectTime = perfData.responseEnd - perfData.requestStart;
          const renderTime = perfData.domComplete - perfData.domLoading;

          console.log('Performance Metrics:', {
            pageLoadTime: `${pageLoadTime}ms`,
            connectTime: `${connectTime}ms`,
            renderTime: `${renderTime}ms`
          });
        }, 0);
      });
    }
  };

  /**
   * Application initialization
   * Coordinates initialization of all modules
   */
  const App = {
    /**
     * Initialize application
     */
    init() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.bootstrap());
      } else {
        this.bootstrap();
      }
    },

    /**
     * Bootstrap all application modules
     */
    bootstrap() {
      try {
        SmoothScroll.init();
        MobileMenu.init();
        ScrollAnimations.init();
        SectionTracker.init();
        FormHandler.init();
        PerformanceMonitor.logMetrics();

        console.log('AI Resume Builder initialized successfully');
      } catch (error) {
        console.error('Application initialization error:', error);
      }
    }
  };

  App.init();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      AppState,
      SmoothScroll,
      MobileMenu,
      ScrollAnimations,
      SectionTracker,
      FormHandler
    };
  }
})();