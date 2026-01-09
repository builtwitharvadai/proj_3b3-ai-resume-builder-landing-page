// Form Validation Module
// Provides comprehensive form validation utilities with real-time feedback,
// error handling, and accessibility support

(function() {
  'use strict';

  // ===================================
  // Constants and Configuration
  // ===================================

  // Email validation regex (RFC 5322 simplified)
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Validation messages
  const VALIDATION_MESSAGES = Object.freeze({
    required: 'Email address is required',
    invalid: 'Please enter a valid email address',
    tooShort: 'Email address is too short',
    tooLong: 'Email address is too long (max 254 characters)',
    success: 'Thank you! We\'ll be in touch soon.',
    error: 'Something went wrong. Please try again.',
    networkError: 'Network error. Please check your connection and try again.',
    timeout: 'Request timed out. Please try again.'
  });

  // Validation constraints
  const CONSTRAINTS = Object.freeze({
    email: {
      minLength: 3,
      maxLength: 254
    },
    debounceDelay: 300,
    submitTimeout: 10000
  });

  // ===================================
  // Core Validation Functions
  // ===================================

  /**
   * Validates email input with comprehensive checks
   * @param {string} email - Email address to validate
   * @returns {Object} Validation result with isValid and message
   */
  function validateEmail(email) {
    // Check for empty or whitespace-only input
    if (!email || email.trim() === '') {
      return {
        isValid: false,
        message: VALIDATION_MESSAGES.required
      };
    }

    const trimmedEmail = email.trim();

    // Check minimum length
    if (trimmedEmail.length < CONSTRAINTS.email.minLength) {
      return {
        isValid: false,
        message: VALIDATION_MESSAGES.tooShort
      };
    }

    // Check maximum length (RFC 5321)
    if (trimmedEmail.length > CONSTRAINTS.email.maxLength) {
      return {
        isValid: false,
        message: VALIDATION_MESSAGES.tooLong
      };
    }

    // Check email format
    if (!EMAIL_REGEX.test(trimmedEmail)) {
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
   * Validates required field
   * @param {string} value - Field value to validate
   * @param {string} fieldName - Name of the field for error message
   * @returns {Object} Validation result
   */
  function validateRequired(value, fieldName) {
    if (!value || value.trim() === '') {
      return {
        isValid: false,
        message: `${fieldName} is required`
      };
    }

    return {
      isValid: true,
      message: ''
    };
  }

  /**
   * Sanitizes input to prevent XSS attacks
   * @param {string} input - Input to sanitize
   * @returns {string} Sanitized input
   */
  function sanitizeInput(input) {
    if (typeof input !== 'string') {
      return '';
    }

    return input
      .trim()
      .replace(/[<>]/g, '') // Remove angle brackets
      .substring(0, CONSTRAINTS.email.maxLength); // Enforce max length
  }

  // ===================================
  // UI State Management
  // ===================================

  /**
   * Updates input field UI based on validation state
   * @param {HTMLInputElement} input - Input element
   * @param {HTMLElement} errorElement - Error message element
   * @param {boolean} isValid - Validation state
   * @param {string} message - Error message
   */
  function updateInputState(input, errorElement, isValid, message) {
    if (!input) {
      console.error('updateInputState: input element is required');
      return;
    }

    try {
      // Update ARIA attributes for accessibility
      input.setAttribute('aria-invalid', !isValid);

      // Update error message
      if (errorElement) {
        errorElement.textContent = message;
        errorElement.setAttribute('aria-live', 'polite');
      }

      // Update visual state
      if (!isValid) {
        input.classList.add('error');
      } else {
        input.classList.remove('error');
      }
    } catch (error) {
      console.error('Error updating input state:', error);
    }
  }

  /**
   * Shows form submission feedback
   * @param {HTMLFormElement} form - Form element
   * @param {boolean} isSuccess - Success state
   * @param {string} message - Feedback message
   */
  function showFormFeedback(form, isSuccess, message) {
    if (!form) {
      console.error('showFormFeedback: form element is required');
      return;
    }

    try {
      // Create or update feedback element
      let feedback = form.querySelector('.form-feedback');

      if (!feedback) {
        feedback = document.createElement('div');
        feedback.className = 'form-feedback';
        feedback.setAttribute('role', 'status');
        feedback.setAttribute('aria-live', 'polite');
        form.appendChild(feedback);
      }

      feedback.textContent = message;
      feedback.className = `form-feedback ${isSuccess ? 'success' : 'error'}`;
      feedback.style.cssText = `
        padding: var(--space-md, 1rem);
        margin-top: var(--space-md, 1rem);
        border-radius: var(--border-radius, 4px);
        text-align: center;
        font-weight: 500;
        background: ${isSuccess ? 'var(--color-success, #10b981)' : 'var(--color-error, #ef4444)'};
        color: white;
        animation: slideIn 0.3s ease-out;
      `;

      // Remove feedback after 5 seconds
      setTimeout(() => {
        if (feedback && feedback.parentNode) {
          feedback.style.animation = 'slideOut 0.3s ease-out';
          setTimeout(() => {
            if (feedback && feedback.parentNode) {
              feedback.remove();
            }
          }, 300);
        }
      }, 5000);
    } catch (error) {
      console.error('Error showing form feedback:', error);
    }
  }

  /**
   * Updates submit button state
   * @param {HTMLButtonElement} button - Submit button
   * @param {boolean} isLoading - Loading state
   */
  function updateButtonState(button, isLoading) {
    if (!button) {
      console.error('updateButtonState: button element is required');
      return;
    }

    try {
      button.setAttribute('aria-busy', isLoading);
      button.disabled = isLoading;

      if (isLoading) {
        button.dataset.originalText = button.textContent;
        button.textContent = 'Sending...';
      } else if (button.dataset.originalText) {
        button.textContent = button.dataset.originalText;
        delete button.dataset.originalText;
      }
    } catch (error) {
      console.error('Error updating button state:', error);
    }
  }

  // ===================================
  // Form State Management
  // ===================================

  /**
   * Creates a debounced function
   * @param {Function} func - Function to debounce
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} Debounced function
   */
  function debounce(func, delay) {
    let timeoutId;

    return function debounced(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  }

  /**
   * Resets form to initial state
   * @param {HTMLFormElement} form - Form element
   * @param {HTMLInputElement} input - Input element
   * @param {HTMLElement} errorElement - Error message element
   */
  function resetFormState(form, input, errorElement) {
    if (!form) {
      console.error('resetFormState: form element is required');
      return;
    }

    try {
      form.reset();

      if (input) {
        updateInputState(input, errorElement, true, '');
      }

      // Remove any existing feedback
      const feedback = form.querySelector('.form-feedback');
      if (feedback) {
        feedback.remove();
      }
    } catch (error) {
      console.error('Error resetting form state:', error);
    }
  }

  /**
   * Gets form data as object
   * @param {HTMLFormElement} form - Form element
   * @returns {Object} Form data
   */
  function getFormData(form) {
    if (!form) {
      console.error('getFormData: form element is required');
      return {};
    }

    try {
      const formData = new FormData(form);
      const data = {};

      for (const [key, value] of formData.entries()) {
        data[key] = sanitizeInput(value);
      }

      return data;
    } catch (error) {
      console.error('Error getting form data:', error);
      return {};
    }
  }

  // ===================================
  // Form Submission Handler
  // ===================================

  /**
   * Simulates form submission with timeout
   * @param {Object} data - Form data
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise} Submission promise
   */
  function submitFormData(data, timeout = CONSTRAINTS.submitTimeout) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('timeout'));
      }, timeout);

      // Simulate API call
      setTimeout(() => {
        clearTimeout(timeoutId);

        // Simulate random success/failure for demo
        if (Math.random() > 0.1) {
          resolve({ success: true, data });
        } else {
          reject(new Error('server_error'));
        }
      }, 1000);
    });
  }

  // ===================================
  // Public API
  // ===================================

  // Export validation utilities
  window.FormValidation = Object.freeze({
    // Core validation functions
    validateEmail,
    validateRequired,
    sanitizeInput,

    // UI state management
    updateInputState,
    showFormFeedback,
    updateButtonState,

    // Form state management
    resetFormState,
    getFormData,
    debounce,

    // Form submission
    submitFormData,

    // Constants
    VALIDATION_MESSAGES,
    CONSTRAINTS,
    EMAIL_REGEX
  });

  // Log initialization
  if (typeof console !== 'undefined' && console.log) {
    console.log('Form validation module loaded successfully');
  }

})();