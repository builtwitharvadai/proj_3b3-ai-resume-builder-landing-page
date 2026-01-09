// Form validation and smooth scroll navigation
(function() {
  'use strict';

  // ===================================
  // Form Validation
  // ===================================
  
  const contactForm = document.querySelector('#contact form');
  const emailInput = document.getElementById('email');
  const emailError = document.getElementById('email-error');
  const submitButton = contactForm?.querySelector('button[type="submit"]');

  // Email validation regex (RFC 5322 simplified)
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Validation messages
  const VALIDATION_MESSAGES = {
    required: 'Email address is required',
    invalid: 'Please enter a valid email address',
    success: 'Thank you! We\'ll be in touch soon.',
    error: 'Something went wrong. Please try again.'
  };

  /**
   * Validates email input
   * @param {string} email - Email address to validate
   * @returns {Object} Validation result with isValid and message
   */
  function validateEmail(email) {
    if (!email || email.trim() === '') {
      return {
        isValid: false,
        message: VALIDATION_MESSAGES.required
      };
    }

    if (!EMAIL_REGEX.test(email)) {
      return {
        isValid: false,
        message: VALIDATION_MESSAGES.invalid
      };
    }

    return {
      isValid: true,
      message: ''
    };
  }

  /**
   * Updates input field UI based on validation state
   * @param {HTMLInputElement} input - Input element
   * @param {boolean} isValid - Validation state
   * @param {string} message - Error message
   */
  function updateInputState(input, isValid, message) {
    if (!input) return;

    input.setAttribute('aria-invalid', !isValid);
    
    if (emailError) {
      emailError.textContent = message;
    }

    if (!isValid) {
      input.classList.add('error');
    } else {
      input.classList.remove('error');
    }
  }

  /**
   * Handles real-time email validation
   */
  function handleEmailInput() {
    if (!emailInput) return;

    const email = emailInput.value;
    const validation = validateEmail(email);

    // Only show errors after user has started typing
    if (email.length > 0) {
      updateInputState(emailInput, validation.isValid, validation.message);
    } else {
      updateInputState(emailInput, true, '');
    }
  }

  /**
   * Handles form submission
   * @param {Event} event - Submit event
   */
  async function handleFormSubmit(event) {
    event.preventDefault();

    if (!emailInput || !submitButton) return;

    const email = emailInput.value;
    const validation = validateEmail(email);

    // Show validation errors
    updateInputState(emailInput, validation.isValid, validation.message);

    if (!validation.isValid) {
      emailInput.focus();
      return;
    }

    // Update button state
    submitButton.setAttribute('aria-busy', 'true');
    submitButton.disabled = true;

    try {
      // Simulate form submission (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Success state
      showFormFeedback(true, VALIDATION_MESSAGES.success);
      contactForm.reset();
      updateInputState(emailInput, true, '');

    } catch (error) {
      // Error state
      showFormFeedback(false, VALIDATION_MESSAGES.error);
      console.error('Form submission error:', error);

    } finally {
      // Reset button state
      submitButton.setAttribute('aria-busy', 'false');
      submitButton.disabled = false;
    }
  }

  /**
   * Shows form submission feedback
   * @param {boolean} isSuccess - Success state
   * @param {string} message - Feedback message
   */
  function showFormFeedback(isSuccess, message) {
    if (!contactForm) return;

    // Create or update feedback element
    let feedback = contactForm.querySelector('.form-feedback');
    
    if (!feedback) {
      feedback = document.createElement('div');
      feedback.className = 'form-feedback';
      feedback.setAttribute('role', 'status');
      feedback.setAttribute('aria-live', 'polite');
      contactForm.appendChild(feedback);
    }

    feedback.textContent = message;
    feedback.className = `form-feedback ${isSuccess ? 'success' : 'error'}`;
    feedback.style.cssText = `
      padding: var(--space-md);
      margin-top: var(--space-md);
      border-radius: var(--border-radius);
      text-align: center;
      font-weight: 500;
      background: ${isSuccess ? 'var(--color-success)' : 'var(--color-error)'};
      color: white;
    `;

    // Remove feedback after 5 seconds
    setTimeout(() => {
      if (feedback && feedback.parentNode) {
        feedback.remove();
      }
    }, 5000);
  }

  // ===================================
  // Smooth Scroll Navigation
  // ===================================

  /**
   * Smoothly scrolls to target element
   * @param {HTMLElement} target - Target element to scroll to
   */
  function smoothScrollTo(target) {
    if (!target) return;

    const headerOffset = 80; // Account for fixed header
    const elementPosition = target.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }

  /**
   * Handles navigation link clicks
   * @param {Event} event - Click event
   */
  function handleNavigationClick(event) {
    const link = event.target.closest('a[href^="#"]');
    
    if (!link) return;

    const href = link.getAttribute('href');
    
    // Skip if it's just "#" or empty
    if (!href || href === '#') return;

    const targetId = href.substring(1);
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      event.preventDefault();
      smoothScrollTo(targetElement);

      // Update focus for accessibility
      targetElement.setAttribute('tabindex', '-1');
      targetElement.focus();

      // Update URL without triggering scroll
      if (history.pushState) {
        history.pushState(null, null, href);
      }
    }
  }

  // ===================================
  // Keyboard Navigation
  // ===================================

  /**
   * Handles keyboard navigation
   * @param {KeyboardEvent} event - Keyboard event
   */
  function handleKeyboardNavigation(event) {
    // Handle Enter key on navigation links
    if (event.key === 'Enter') {
      const link = event.target.closest('a[href^="#"]');
      if (link) {
        link.click();
      }
    }

    // Handle Escape key to close any open modals/overlays
    if (event.key === 'Escape') {
      const feedback = document.querySelector('.form-feedback');
      if (feedback) {
        feedback.remove();
      }
    }
  }

  // ===================================
  // Initialization
  // ===================================

  /**
   * Initializes form validation and navigation
   */
  function init() {
    // Form validation setup
    if (emailInput) {
      // Real-time validation on input
      emailInput.addEventListener('input', handleEmailInput);
      
      // Validation on blur
      emailInput.addEventListener('blur', handleEmailInput);
    }

    if (contactForm) {
      contactForm.addEventListener('submit', handleFormSubmit);
    }

    // Smooth scroll navigation setup
    document.addEventListener('click', handleNavigationClick);
    
    // Keyboard navigation
    document.addEventListener('keydown', handleKeyboardNavigation);

    // Handle initial hash in URL
    if (window.location.hash) {
      const targetId = window.location.hash.substring(1);
      const targetElement = document.getElementById(targetId);
      
      if (targetElement) {
        // Delay to ensure page is fully loaded
        setTimeout(() => {
          smoothScrollTo(targetElement);
        }, 100);
      }
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();