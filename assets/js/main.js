// Intersection Observer for testimonials animations
(function initTestimonialsAnimations() {
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (prefersReducedMotion) {
    // If user prefers reduced motion, show all testimonials immediately
    const testimonialCards = document.querySelectorAll('.testimonial-card[data-animate-fade-in]');
    testimonialCards.forEach(card => {
      card.style.opacity = '1';
    });
    return;
  }

  // Create Intersection Observer for testimonial cards
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const testimonialObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Get the delay from data attribute or default to 0
        const delay = entry.target.getAttribute('data-animate-delay') || '0';
        const delayMs = parseInt(delay, 10);
        
        // Apply animation with staggered delay
        setTimeout(() => {
          entry.target.style.opacity = '1';
          entry.target.style.animation = 'fadeIn 0.6s ease forwards';
        }, delayMs);
        
        // Stop observing once animated
        testimonialObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe all testimonial cards
  const testimonialCards = document.querySelectorAll('#testimonials .testimonial-card[data-animate-fade-in]');
  testimonialCards.forEach(card => {
    // Reset opacity for animation
    card.style.opacity = '0';
    testimonialObserver.observe(card);
  });

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    testimonialObserver.disconnect();
  });
})();

// Parallax effect for hero background
(function initParallax() {
  const parallaxElement = document.querySelector('[data-parallax]');
  
  if (!parallaxElement) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (prefersReducedMotion) return;

  let ticking = false;

  function updateParallax() {
    const scrolled = window.pageYOffset;
    const rate = scrolled * 0.5;
    
    parallaxElement.style.transform = `translate3d(0, ${rate}px, 0)`;
    ticking = false;
  }

  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }

  window.addEventListener('scroll', requestTick, { passive: true });
})();

// Smooth scroll for navigation links
(function initSmoothScroll() {
  const navLinks = document.querySelectorAll('nav a[href^="#"]');
  
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
})();