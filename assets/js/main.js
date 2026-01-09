/**
 * Main JavaScript for AI Resume Builder Landing Page
 * Handles performance monitoring, accessibility features, and user interactions
 */

(function() {
  'use strict';

  // Performance monitoring
  const performanceMonitor = {
    marks: new Map(),
    
    mark(name) {
      if (typeof performance !== 'undefined' && performance.mark) {
        try {
          performance.mark(name);
          this.marks.set(name, performance.now());
        } catch (e) {
          console.warn('Performance marking failed:', e);
        }
      }
    },
    
    measure(name, startMark, endMark) {
      if (typeof performance !== 'undefined' && performance.measure) {
        try {
          performance.measure(name, startMark, endMark);
          const measure = performance.getEntriesByName(name)[0];
          if (measure) {
            console.log(`${name}: ${measure.duration.toFixed(2)}ms`);
          }
        } catch (e) {
          console.warn('Performance measurement failed:', e);
        }
      }
    },
    
    reportWebVitals() {
      if (typeof PerformanceObserver === 'undefined') return;
      
      try {
        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        
        // First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            console.log('FID:', entry.processingStart - entry.startTime);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        
        // Cumulative Layout Shift
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              console.log('CLS:', clsValue);
            }
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.warn('Web Vitals monitoring failed:', e);
      }
    }
  };

  // Reduced motion detection
  const prefersReducedMotion = () => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  // Intersection Observer for lazy loading and animations
  const observerConfig = {
    rootMargin: '50px 0px',
    threshold: 0.1
  };

  const animationObserver = typeof IntersectionObserver !== 'undefined' 
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !prefersReducedMotion()) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            animationObserver.unobserve(entry.target);
          }
        });
      }, observerConfig)
    : null;

  // Image lazy loading observer
  const imageObserver = typeof IntersectionObserver !== 'undefined'
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
            }
            imageObserver.unobserve(img);
          }
        });
      }, observerConfig)
    : null;

  // Initialize animations
  function initAnimations() {
    if (!animationObserver || prefersReducedMotion()) return;
    
    const animatedElements = document.querySelectorAll('[data-animate-fade-in]');
    animatedElements.forEach((el) => {
      animationObserver.observe(el);
    });
  }

  // Initialize lazy loading
  function initLazyLoading() {
    if (!imageObserver) {
      // Fallback: load all images immediately
      document.querySelectorAll('img[data-src]').forEach((img) => {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      });
      return;
    }
    
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    lazyImages.forEach((img) => {
      imageObserver.observe(img);
    });
  }

  // Keyboard navigation enhancement
  function enhanceKeyboardNavigation() {
    // Trap focus in modal-like elements if needed
    const focusableSelectors = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Skip to main content with '/' key
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const mainContent = document.getElementById('main');
        if (mainContent && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
          e.preventDefault();
          mainContent.focus();
          mainContent.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });

    // Enhance focus visibility
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });
  }

  // Focus management for dynamic content
  function manageFocus() {
    // Store last focused element before navigation
    let lastFocusedElement = null;
    
    document.addEventListener('focusin', (e) => {
      lastFocusedElement = e.target;
    });

    // Return focus helper
    window.returnFocus = function() {
      if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        lastFocusedElement.focus();
      }
    };
  }

  // Announce dynamic content changes to screen readers
  function announceToScreenReader(message, priority = 'polite') {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  // Form validation with accessibility
  function initFormValidation() {
    const form = document.querySelector('form');
    if (!form) return;

    const emailInput = form.querySelector('#email');
    const emailError = form.querySelector('#email-error');

    if (!emailInput || !emailError) return;

    emailInput.addEventListener('blur', () => {
      validateEmail(emailInput, emailError);
    });

    emailInput.addEventListener('input', () => {
      if (emailInput.getAttribute('aria-invalid') === 'true') {
        validateEmail(emailInput, emailError);
      }
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const isValid = validateEmail(emailInput, emailError);
      
      if (isValid) {
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
          submitButton.setAttribute('aria-busy', 'true');
          submitButton.disabled = true;
        }
        
        announceToScreenReader('Form submitted successfully', 'assertive');
        
        // Simulate form submission
        setTimeout(() => {
          if (submitButton) {
            submitButton.setAttribute('aria-busy', 'false');
            submitButton.disabled = false;
          }
          announceToScreenReader('Thank you for joining our waitlist!', 'polite');
          form.reset();
        }, 1000);
      }
    });
  }

  function validateEmail(input, errorElement) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const value = input.value.trim();
    
    if (!value) {
      input.setAttribute('aria-invalid', 'true');
      errorElement.textContent = 'Email address is required';
      return false;
    }
    
    if (!emailRegex.test(value)) {
      input.setAttribute('aria-invalid', 'true');
      errorElement.textContent = 'Please enter a valid email address';
      return false;
    }
    
    input.setAttribute('aria-invalid', 'false');
    errorElement.textContent = '';
    return true;
  }

  // Smooth scroll with reduced motion support
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          
          if (prefersReducedMotion()) {
            target.scrollIntoView();
          } else {
            target.scrollIntoView({ behavior: 'smooth' });
          }
          
          // Set focus to target for accessibility
          if (target.hasAttribute('tabindex')) {
            target.focus();
          } else {
            target.setAttribute('tabindex', '-1');
            target.focus();
            target.addEventListener('blur', () => {
              target.removeAttribute('tabindex');
            }, { once: true });
          }
        }
      });
    });
  }

  // Initialize all features
  function init() {
    performanceMonitor.mark('init-start');
    
    try {
      // Start performance monitoring
      performanceMonitor.reportWebVitals();
      
      // Initialize features
      initAnimations();
      initLazyLoading();
      enhanceKeyboardNavigation();
      manageFocus();
      initFormValidation();
      initSmoothScroll();
      
      performanceMonitor.mark('init-end');
      performanceMonitor.measure('initialization', 'init-start', 'init-end');
      
      // Announce page ready to screen readers
      announceToScreenReader('Page loaded and ready', 'polite');
    } catch (error) {
      console.error('Initialization error:', error);
      // Graceful degradation - page still works without enhancements
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export for testing purposes
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      performanceMonitor,
      prefersReducedMotion,
      announceToScreenReader
    };
  }
})();