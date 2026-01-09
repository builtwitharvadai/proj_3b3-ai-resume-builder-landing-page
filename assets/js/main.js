/**
 * Main JavaScript for AI Resume Builder Landing Page
 * Implements hero section animations, parallax effects, and scroll interactions
 */

(function() {
  'use strict';

  // Check if animations are enabled via CSS variable
  const getAnimationEnabled = () => {
    const enableAnimations = getComputedStyle(document.documentElement)
      .getPropertyValue('--enable-animations')
      .trim();
    return enableAnimations !== '0';
  };

  // Check for reduced motion preference
  const prefersReducedMotion = () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  // Parallax scrolling effect for hero background
  let ticking = false;
  let lastScrollY = 0;

  const updateParallax = () => {
    const heroBackground = document.querySelector('[data-parallax]');
    if (!heroBackground) return;

    const scrollY = window.pageYOffset;
    const heroSection = document.getElementById('hero');
    
    if (!heroSection) return;

    const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
    
    // Only apply parallax when hero section is visible
    if (scrollY < heroBottom) {
      const parallaxSpeed = 0.5;
      const translateY = scrollY * parallaxSpeed;
      heroBackground.style.transform = `translate3d(0, ${translateY}px, 0)`;
    }
    
    ticking = false;
  };

  const requestParallaxUpdate = () => {
    lastScrollY = window.pageYOffset;
    
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  };

  // Initialize parallax effect
  const initParallax = () => {
    if (prefersReducedMotion() || !getAnimationEnabled()) {
      return;
    }

    window.addEventListener('scroll', requestParallaxUpdate, { passive: true });
    
    // Initial update
    updateParallax();
  };

  // Smooth scroll for CTA button
  const initSmoothScroll = () => {
    const ctaLink = document.querySelector('.hero-actions a[href^="#"]');
    
    if (!ctaLink) return;

    ctaLink.addEventListener('click', (e) => {
      e.preventDefault();
      
      const targetId = ctaLink.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      if (!targetElement) return;

      const headerOffset = 80;
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    });
  };

  // Intersection Observer for scroll-triggered animations
  const initScrollAnimations = () => {
    if (prefersReducedMotion() || !getAnimationEnabled()) {
      // Make elements visible immediately if animations are disabled
      const animatedElements = document.querySelectorAll('[data-animate-fade-in]');
      animatedElements.forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      });
      return;
    }

    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observerCallback = (entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-visible');
          observer.unobserve(entry.target);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all elements with animation attributes
    const animatedElements = document.querySelectorAll('[data-animate-fade-in]');
    animatedElements.forEach(el => {
      observer.observe(el);
    });
  };

  // Button interaction enhancements
  const initButtonInteractions = () => {
    const ctaButton = document.querySelector('.hero-actions button');
    
    if (!ctaButton) return;

    // Add ripple effect on click
    ctaButton.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        left: ${x}px;
        top: ${y}px;
        pointer-events: none;
        transform: scale(0);
        animation: ripple 0.6s ease-out;
      `;

      this.appendChild(ripple);

      setTimeout(() => ripple.remove(), 600);
    });

    // Add CSS for ripple animation if not exists
    if (!document.getElementById('ripple-animation-style')) {
      const style = document.createElement('style');
      style.id = 'ripple-animation-style';
      style.textContent = `
        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
  };

  // Performance monitoring
  const measurePerformance = () => {
    if (!window.performance || !window.performance.mark) return;

    window.performance.mark('hero-animations-start');

    // Measure time to interactive
    window.addEventListener('load', () => {
      window.performance.mark('hero-animations-complete');
      
      try {
        window.performance.measure(
          'hero-animations-duration',
          'hero-animations-start',
          'hero-animations-complete'
        );

        const measure = window.performance.getEntriesByName('hero-animations-duration')[0];
        
        // Log performance if it exceeds 1 second threshold
        if (measure && measure.duration > 1000) {
          console.warn(`Hero animations took ${measure.duration}ms to complete`);
        }
      } catch (e) {
        // Silently fail if performance measurement is not supported
      }
    });
  };

  // Cleanup function for removing event listeners
  const cleanup = () => {
    window.removeEventListener('scroll', requestParallaxUpdate);
  };

  // Initialize all features
  const init = () => {
    // Start performance measurement
    measurePerformance();

    // Initialize features
    initParallax();
    initSmoothScroll();
    initScrollAnimations();
    initButtonInteractions();

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Pause animations when page is hidden
        ticking = false;
      } else {
        // Resume animations when page is visible
        if (!prefersReducedMotion() && getAnimationEnabled()) {
          requestParallaxUpdate();
        }
      }
    });

    // Handle reduced motion preference changes
    const motionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    motionMediaQuery.addEventListener('change', () => {
      if (motionMediaQuery.matches) {
        cleanup();
        // Reset parallax transform
        const heroBackground = document.querySelector('[data-parallax]');
        if (heroBackground) {
          heroBackground.style.transform = 'translate3d(0, 0, 0)';
        }
      } else {
        initParallax();
      }
    });
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', cleanup);
})();