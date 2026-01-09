// Carousel functionality with touch/swipe support, automatic rotation, and performance optimizations
(function() {
  'use strict';

  // Carousel state management
  class CarouselController {
    constructor(container) {
      this.container = container;
      this.track = container.querySelector('.carousel-track');
      this.slides = Array.from(container.querySelectorAll('.carousel-slide'));
      this.prevButton = container.querySelector('[data-carousel-prev]');
      this.nextButton = container.querySelector('[data-carousel-next]');
      this.indicators = Array.from(container.querySelectorAll('[data-carousel-indicator]'));
      
      this.currentIndex = 0;
      this.isTransitioning = false;
      this.autoRotateInterval = null;
      this.touchStartX = 0;
      this.touchEndX = 0;
      this.isDisabled = container.dataset.disableCarousel === 'true';
      
      if (!this.isDisabled) {
        this.init();
      }
    }

    init() {
      this.setupEventListeners();
      this.setupIntersectionObserver();
      this.startAutoRotate();
      this.updateAccessibility();
    }

    setupEventListeners() {
      // Button navigation
      this.prevButton.addEventListener('click', () => this.navigate('prev'));
      this.nextButton.addEventListener('click', () => this.navigate('next'));

      // Indicator navigation
      this.indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => this.goToSlide(index));
      });

      // Keyboard navigation
      this.container.addEventListener('keydown', (e) => this.handleKeyboard(e));

      // Touch/swipe support
      this.track.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
      this.track.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: true });
      this.track.addEventListener('touchend', () => this.handleTouchEnd());

      // Mouse drag support
      let isDragging = false;
      let startX = 0;
      let currentX = 0;

      this.track.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.pageX;
        this.track.style.cursor = 'grabbing';
        this.pauseAutoRotate();
      });

      document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        currentX = e.pageX;
      });

      document.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;
        this.track.style.cursor = 'grab';
        
        const diff = startX - currentX;
        if (Math.abs(diff) > 50) {
          if (diff > 0) {
            this.navigate('next');
          } else {
            this.navigate('prev');
          }
        }
        this.startAutoRotate();
      });

      // Pause auto-rotate on hover
      this.container.addEventListener('mouseenter', () => this.pauseAutoRotate());
      this.container.addEventListener('mouseleave', () => this.startAutoRotate());

      // Pause auto-rotate on focus
      this.container.addEventListener('focusin', () => this.pauseAutoRotate());
      this.container.addEventListener('focusout', () => this.startAutoRotate());
    }

    setupIntersectionObserver() {
      // Lazy load images when carousel becomes visible
      const images = this.container.querySelectorAll('img[loading="lazy"]');
      
      if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target;
              if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
              }
              imageObserver.unobserve(img);
            }
          });
        }, {
          rootMargin: '50px'
        });

        images.forEach(img => imageObserver.observe(img));
      }
    }

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

    handleTouchStart(e) {
      this.touchStartX = e.changedTouches[0].screenX;
      this.pauseAutoRotate();
    }

    handleTouchMove(e) {
      this.touchEndX = e.changedTouches[0].screenX;
    }

    handleTouchEnd() {
      const swipeThreshold = 50;
      const diff = this.touchStartX - this.touchEndX;

      if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
          this.navigate('next');
        } else {
          this.navigate('prev');
        }
      }

      this.startAutoRotate();
    }

    navigate(direction) {
      if (this.isTransitioning) return;

      const newIndex = direction === 'next' 
        ? (this.currentIndex + 1) % this.slides.length
        : (this.currentIndex - 1 + this.slides.length) % this.slides.length;

      this.goToSlide(newIndex);
    }

    goToSlide(index) {
      if (this.isTransitioning || index === this.currentIndex) return;

      this.isTransitioning = true;
      this.currentIndex = index;

      // Use CSS transform for smooth transition
      const offset = -index * 100;
      this.track.style.transform = `translateX(${offset}%)`;

      this.updateIndicators();
      this.updateAccessibility();

      // Reset transition lock after animation completes
      setTimeout(() => {
        this.isTransitioning = false;
      }, 350);
    }

    updateIndicators() {
      this.indicators.forEach((indicator, index) => {
        const isActive = index === this.currentIndex;
        indicator.setAttribute('aria-selected', isActive);
        indicator.setAttribute('tabindex', isActive ? '0' : '-1');
      });
    }

    updateAccessibility() {
      this.slides.forEach((slide, index) => {
        const isActive = index === this.currentIndex;
        slide.setAttribute('aria-hidden', !isActive);
        
        // Update focusable elements
        const focusableElements = slide.querySelectorAll('a, button, input, [tabindex]');
        focusableElements.forEach(el => {
          el.setAttribute('tabindex', isActive ? '0' : '-1');
        });
      });

      // Update button states
      const slideText = `Slide ${this.currentIndex + 1} of ${this.slides.length}`;
      this.prevButton.setAttribute('aria-label', `Previous template - ${slideText}`);
      this.nextButton.setAttribute('aria-label', `Next template - ${slideText}`);
    }

    startAutoRotate() {
      this.pauseAutoRotate();
      
      // Auto-rotate every 5 seconds
      this.autoRotateInterval = setInterval(() => {
        this.navigate('next');
      }, 5000);
    }

    pauseAutoRotate() {
      if (this.autoRotateInterval) {
        clearInterval(this.autoRotateInterval);
        this.autoRotateInterval = null;
      }
    }

    destroy() {
      this.pauseAutoRotate();
      // Event listeners will be garbage collected with the element
    }
  }

  // Feature card hover effects
  function initFeatureCards() {
    const featureCards = document.querySelectorAll('.feature-card');
    
    featureCards.forEach(card => {
      card.addEventListener('mouseenter', function() {
        this.style.willChange = 'transform, box-shadow';
      });

      card.addEventListener('mouseleave', function() {
        this.style.willChange = 'auto';
      });
    });
  }

  // Smooth scroll performance optimization
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#') return;

        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();

        // Use native smooth scroll with fallback
        if ('scrollBehavior' in document.documentElement.style) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        } else {
          // Fallback for browsers without smooth scroll support
          const targetPosition = target.getBoundingClientRect().top + window.pageYOffset;
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  // Parallax effect for hero background
  function initParallax() {
    const parallaxElement = document.querySelector('[data-parallax]');
    if (!parallaxElement) return;

    let ticking = false;

    function updateParallax() {
      const scrolled = window.pageYOffset;
      const rate = scrolled * 0.5;
      parallaxElement.style.transform = `translateY(${rate}px)`;
      ticking = false;
    }

    window.addEventListener('scroll', function() {
      if (!ticking) {
        window.requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }, { passive: true });
  }

  // Fade-in animations on scroll
  function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('[data-animate-fade-in]');
    
    if ('IntersectionObserver' in window) {
      const animationObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const delay = entry.target.dataset.animateDelay || 0;
            setTimeout(() => {
              entry.target.style.opacity = '1';
              entry.target.style.transform = 'translateY(0)';
            }, delay);
            animationObserver.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      });

      animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        animationObserver.observe(el);
      });
    } else {
      // Fallback: show all elements immediately
      animatedElements.forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      });
    }
  }

  // Initialize all functionality when DOM is ready
  function init() {
    // Initialize carousel
    const carouselContainer = document.querySelector('[data-carousel]');
    if (carouselContainer) {
      new CarouselController(carouselContainer);
    }

    // Initialize feature cards
    initFeatureCards();

    // Initialize smooth scroll
    initSmoothScroll();

    // Initialize parallax effect
    if (window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
      initParallax();
    }

    // Initialize scroll animations
    initScrollAnimations();
  }

  // Run initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Performance monitoring
  if ('PerformanceObserver' in window) {
    try {
      const perfObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            console.log('LCP:', entry.startTime);
          }
        }
      });
      perfObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      // PerformanceObserver not supported or failed
    }
  }
})();