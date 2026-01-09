/**
 * Performance Monitoring and Optimization Module
 * Handles image lazy loading, performance metrics collection, resource loading optimization,
 * and Core Web Vitals monitoring for the AI Resume Builder Landing Page
 */

(function() {
  'use strict';

  /**
   * Performance monitoring utilities with structured logging
   */
  const PerformanceMonitor = {
    marks: new Map(),
    measures: new Map(),
    vitals: {
      lcp: null,
      fid: null,
      cls: 0
    },

    /**
     * Create a performance mark
     * @param {string} name - Mark identifier
     */
    mark(name) {
      if (typeof performance === 'undefined' || !performance.mark) {
        return;
      }

      try {
        performance.mark(name);
        this.marks.set(name, performance.now());
        this._log('mark', { name, timestamp: performance.now() });
      } catch (error) {
        this._logError('Failed to create performance mark', error, { name });
      }
    },

    /**
     * Measure performance between two marks
     * @param {string} name - Measure identifier
     * @param {string} startMark - Start mark name
     * @param {string} endMark - End mark name
     * @returns {number|null} Duration in milliseconds
     */
    measure(name, startMark, endMark) {
      if (typeof performance === 'undefined' || !performance.measure) {
        return null;
      }

      try {
        performance.measure(name, startMark, endMark);
        const entries = performance.getEntriesByName(name);
        const measure = entries[entries.length - 1];
        
        if (measure) {
          const duration = measure.duration;
          this.measures.set(name, duration);
          this._log('measure', { 
            name, 
            duration: duration.toFixed(2),
            startMark,
            endMark
          });
          return duration;
        }
      } catch (error) {
        this._logError('Failed to measure performance', error, { 
          name, 
          startMark, 
          endMark 
        });
      }

      return null;
    },

    /**
     * Initialize Core Web Vitals monitoring
     */
    initWebVitals() {
      if (typeof PerformanceObserver === 'undefined') {
        this._log('warn', { message: 'PerformanceObserver not supported' });
        return;
      }

      this._observeLCP();
      this._observeFID();
      this._observeCLS();
      this._observeResourceTiming();
    },

    /**
     * Observe Largest Contentful Paint
     * @private
     */
    _observeLCP() {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          const lcpValue = lastEntry.renderTime || lastEntry.loadTime;
          
          this.vitals.lcp = lcpValue;
          this._log('vital', {
            metric: 'LCP',
            value: lcpValue.toFixed(2),
            rating: this._rateLCP(lcpValue),
            element: lastEntry.element ? lastEntry.element.tagName : 'unknown'
          });
        });

        lcpObserver.observe({ 
          type: 'largest-contentful-paint', 
          buffered: true 
        });
      } catch (error) {
        this._logError('Failed to observe LCP', error);
      }
    },

    /**
     * Observe First Input Delay
     * @private
     */
    _observeFID() {
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            const fidValue = entry.processingStart - entry.startTime;
            this.vitals.fid = fidValue;
            
            this._log('vital', {
              metric: 'FID',
              value: fidValue.toFixed(2),
              rating: this._rateFID(fidValue),
              eventType: entry.name
            });
          });
        });

        fidObserver.observe({ 
          type: 'first-input', 
          buffered: true 
        });
      } catch (error) {
        this._logError('Failed to observe FID', error);
      }
    },

    /**
     * Observe Cumulative Layout Shift
     * @private
     */
    _observeCLS() {
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          
          entries.forEach((entry) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              this.vitals.cls = clsValue;
              
              this._log('vital', {
                metric: 'CLS',
                value: clsValue.toFixed(4),
                rating: this._rateCLS(clsValue),
                sources: entry.sources ? entry.sources.length : 0
              });
            }
          });
        });

        clsObserver.observe({ 
          type: 'layout-shift', 
          buffered: true 
        });
      } catch (error) {
        this._logError('Failed to observe CLS', error);
      }
    },

    /**
     * Observe resource loading timing
     * @private
     */
    _observeResourceTiming() {
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          
          entries.forEach((entry) => {
            if (entry.initiatorType === 'img' || entry.initiatorType === 'css' || entry.initiatorType === 'script') {
              this._log('resource', {
                type: entry.initiatorType,
                name: entry.name.split('/').pop(),
                duration: entry.duration.toFixed(2),
                size: entry.transferSize || 0,
                cached: entry.transferSize === 0
              });
            }
          });
        });

        resourceObserver.observe({ 
          type: 'resource', 
          buffered: true 
        });
      } catch (error) {
        this._logError('Failed to observe resource timing', error);
      }
    },

    /**
     * Rate LCP performance
     * @private
     * @param {number} value - LCP value in milliseconds
     * @returns {string} Rating (good/needs-improvement/poor)
     */
    _rateLCP(value) {
      if (value <= 2500) return 'good';
      if (value <= 4000) return 'needs-improvement';
      return 'poor';
    },

    /**
     * Rate FID performance
     * @private
     * @param {number} value - FID value in milliseconds
     * @returns {string} Rating (good/needs-improvement/poor)
     */
    _rateFID(value) {
      if (value <= 100) return 'good';
      if (value <= 300) return 'needs-improvement';
      return 'poor';
    },

    /**
     * Rate CLS performance
     * @private
     * @param {number} value - CLS value
     * @returns {string} Rating (good/needs-improvement/poor)
     */
    _rateCLS(value) {
      if (value <= 0.1) return 'good';
      if (value <= 0.25) return 'needs-improvement';
      return 'poor';
    },

    /**
     * Get all collected vitals
     * @returns {Object} Web Vitals data
     */
    getVitals() {
      return {
        lcp: this.vitals.lcp,
        fid: this.vitals.fid,
        cls: this.vitals.cls,
        ratings: {
          lcp: this.vitals.lcp ? this._rateLCP(this.vitals.lcp) : null,
          fid: this.vitals.fid ? this._rateFID(this.vitals.fid) : null,
          cls: this._rateCLS(this.vitals.cls)
        }
      };
    },

    /**
     * Structured logging
     * @private
     * @param {string} level - Log level
     * @param {Object} data - Log data
     */
    _log(level, data) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        module: 'performance',
        ...data
      };

      if (level === 'warn' || level === 'error') {
        console.warn('[Performance]', logEntry);
      } else {
        console.log('[Performance]', logEntry);
      }
    },

    /**
     * Error logging with context
     * @private
     * @param {string} message - Error message
     * @param {Error} error - Error object
     * @param {Object} context - Additional context
     */
    _logError(message, error, context = {}) {
      this._log('error', {
        message,
        error: error.message,
        stack: error.stack,
        ...context
      });
    }
  };

  /**
   * Image lazy loading manager with Intersection Observer
   */
  const LazyLoadManager = {
    observer: null,
    config: {
      rootMargin: '50px 0px',
      threshold: 0.01
    },
    loadedImages: new Set(),

    /**
     * Initialize lazy loading
     */
    init() {
      if (!this._isIntersectionObserverSupported()) {
        this._fallbackLoad();
        return;
      }

      this._createObserver();
      this._observeImages();
      
      PerformanceMonitor._log('info', { 
        message: 'Lazy loading initialized',
        imageCount: document.querySelectorAll('img[loading="lazy"]').length
      });
    },

    /**
     * Check if Intersection Observer is supported
     * @private
     * @returns {boolean}
     */
    _isIntersectionObserverSupported() {
      return typeof IntersectionObserver !== 'undefined';
    },

    /**
     * Create Intersection Observer instance
     * @private
     */
    _createObserver() {
      try {
        this.observer = new IntersectionObserver(
          this._handleIntersection.bind(this),
          this.config
        );
      } catch (error) {
        PerformanceMonitor._logError('Failed to create IntersectionObserver', error);
        this._fallbackLoad();
      }
    },

    /**
     * Handle intersection events
     * @private
     * @param {IntersectionObserverEntry[]} entries
     */
    _handleIntersection(entries) {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          this._loadImage(img);
          this.observer.unobserve(img);
        }
      });
    },

    /**
     * Load a single image
     * @private
     * @param {HTMLImageElement} img
     */
    _loadImage(img) {
      if (this.loadedImages.has(img)) {
        return;
      }

      const startTime = performance.now();
      const dataSrc = img.dataset.src;
      const src = img.getAttribute('src');

      if (dataSrc) {
        img.addEventListener('load', () => {
          const loadTime = performance.now() - startTime;
          this.loadedImages.add(img);
          
          PerformanceMonitor._log('info', {
            message: 'Image loaded',
            src: dataSrc.split('/').pop(),
            loadTime: loadTime.toFixed(2),
            cached: loadTime < 10
          });
        }, { once: true });

        img.addEventListener('error', () => {
          PerformanceMonitor._logError('Image load failed', new Error('Load error'), {
            src: dataSrc
          });
        }, { once: true });

        img.src = dataSrc;
        img.removeAttribute('data-src');
      } else if (src && !this.loadedImages.has(img)) {
        this.loadedImages.add(img);
      }
    },

    /**
     * Observe all lazy-loadable images
     * @private
     */
    _observeImages() {
      if (!this.observer) {
        return;
      }

      const lazyImages = document.querySelectorAll('img[loading="lazy"]');
      lazyImages.forEach((img) => {
        this.observer.observe(img);
      });
    },

    /**
     * Fallback for browsers without Intersection Observer
     * @private
     */
    _fallbackLoad() {
      PerformanceMonitor._log('warn', { 
        message: 'Using fallback image loading' 
      });

      const images = document.querySelectorAll('img[data-src]');
      images.forEach((img) => {
        this._loadImage(img);
      });
    },

    /**
     * Manually trigger load for specific image
     * @param {HTMLImageElement} img
     */
    loadImageNow(img) {
      if (this.observer) {
        this.observer.unobserve(img);
      }
      this._loadImage(img);
    }
  };

  /**
   * Resource loading optimizer
   */
  const ResourceOptimizer = {
    /**
     * Preload critical resources
     * @param {string[]} urls - Resource URLs to preload
     * @param {string} type - Resource type (image, script, style, font)
     */
    preload(urls, type = 'image') {
      if (!Array.isArray(urls)) {
        urls = [urls];
      }

      urls.forEach((url) => {
        try {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.href = url;
          link.as = type;
          
          if (type === 'font') {
            link.crossOrigin = 'anonymous';
          }

          document.head.appendChild(link);
          
          PerformanceMonitor._log('info', {
            message: 'Resource preloaded',
            url: url.split('/').pop(),
            type
          });
        } catch (error) {
          PerformanceMonitor._logError('Failed to preload resource', error, { url, type });
        }
      });
    },

    /**
     * Prefetch resources for future navigation
     * @param {string[]} urls - Resource URLs to prefetch
     */
    prefetch(urls) {
      if (!Array.isArray(urls)) {
        urls = [urls];
      }

      urls.forEach((url) => {
        try {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = url;
          document.head.appendChild(link);
          
          PerformanceMonitor._log('info', {
            message: 'Resource prefetched',
            url: url.split('/').pop()
          });
        } catch (error) {
          PerformanceMonitor._logError('Failed to prefetch resource', error, { url });
        }
      });
    },

    /**
     * Optimize Unsplash image URL with parameters
     * @param {string} url - Original Unsplash URL
     * @param {Object} options - Optimization options
     * @returns {string} Optimized URL
     */
    optimizeUnsplashUrl(url, options = {}) {
      const defaults = {
        width: 800,
        quality: 80,
        format: 'auto',
        fit: 'crop'
      };

      const params = { ...defaults, ...options };
      
      try {
        const urlObj = new URL(url);
        
        if (urlObj.hostname.includes('unsplash.com')) {
          urlObj.searchParams.set('w', params.width);
          urlObj.searchParams.set('q', params.quality);
          urlObj.searchParams.set('fm', params.format);
          urlObj.searchParams.set('fit', params.fit);
          
          return urlObj.toString();
        }
      } catch (error) {
        PerformanceMonitor._logError('Failed to optimize Unsplash URL', error, { url });
      }

      return url;
    },

    /**
     * Defer non-critical scripts
     */
    deferNonCriticalScripts() {
      const scripts = document.querySelectorAll('script[data-defer]');
      
      scripts.forEach((script) => {
        script.defer = true;
        PerformanceMonitor._log('info', {
          message: 'Script deferred',
          src: script.src ? script.src.split('/').pop() : 'inline'
        });
      });
    }
  };

  /**
   * Connection-aware loading
   */
  const ConnectionManager = {
    /**
     * Get effective connection type
     * @returns {string} Connection type (4g, 3g, 2g, slow-2g, unknown)
     */
    getConnectionType() {
      if (typeof navigator === 'undefined' || !navigator.connection) {
        return 'unknown';
      }

      const connection = navigator.connection;
      return connection.effectiveType || 'unknown';
    },

    /**
     * Check if connection is slow
     * @returns {boolean}
     */
    isSlowConnection() {
      const type = this.getConnectionType();
      return type === '2g' || type === 'slow-2g';
    },

    /**
     * Check if data saver is enabled
     * @returns {boolean}
     */
    isDataSaverEnabled() {
      if (typeof navigator === 'undefined' || !navigator.connection) {
        return false;
      }

      return navigator.connection.saveData === true;
    },

    /**
     * Get adaptive loading strategy
     * @returns {Object} Loading strategy configuration
     */
    getLoadingStrategy() {
      const isSlow = this.isSlowConnection();
      const dataSaver = this.isDataSaverEnabled();

      return {
        loadImages: !dataSaver,
        imageQuality: isSlow || dataSaver ? 60 : 80,
        enableAnimations: !isSlow && !dataSaver,
        preloadCount: isSlow || dataSaver ? 1 : 3
      };
    }
  };

  /**
   * Initialize all performance features
   */
  function init() {
    try {
      PerformanceMonitor.mark('performance-init-start');

      // Initialize Web Vitals monitoring
      PerformanceMonitor.initWebVitals();

      // Initialize lazy loading
      LazyLoadManager.init();

      // Defer non-critical scripts
      ResourceOptimizer.deferNonCriticalScripts();

      // Log connection info
      const connectionType = ConnectionManager.getConnectionType();
      const strategy = ConnectionManager.getLoadingStrategy();
      
      PerformanceMonitor._log('info', {
        message: 'Performance module initialized',
        connectionType,
        strategy
      });

      PerformanceMonitor.mark('performance-init-end');
      PerformanceMonitor.measure(
        'performance-initialization',
        'performance-init-start',
        'performance-init-end'
      );
    } catch (error) {
      PerformanceMonitor._logError('Performance module initialization failed', error);
    }
  }

  // Auto-initialize if DOM is ready
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  // Export for use in other modules
  if (typeof window !== 'undefined') {
    window.PerformanceUtils = {
      monitor: PerformanceMonitor,
      lazyLoad: LazyLoadManager,
      optimizer: ResourceOptimizer,
      connection: ConnectionManager
    };
  }

  // CommonJS export for testing
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      PerformanceMonitor,
      LazyLoadManager,
      ResourceOptimizer,
      ConnectionManager
    };
  }
})();