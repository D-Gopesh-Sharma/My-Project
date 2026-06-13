// loader.js - Global particle loader controls
(function() {
    const loaderEl = document.getElementById('loader');
    const loaderTextEl = document.getElementById('loaderText');

    function showLoader(message) {
        if (loaderTextEl && message) loaderTextEl.textContent = message;
        if (loaderEl) loaderEl.style.display = 'flex';
    }

    function hideLoader() {
        if (loaderEl) loaderEl.style.display = 'none';
    }

    // Expose globally
    window.VSLoader = { show: showLoader, hide: hideLoader };

    // Auto show during page navigation and initial load
    document.addEventListener('readystatechange', () => {
        if (document.readyState === 'loading') {
            showLoader('Loading...');
        }
    });

    window.addEventListener('load', () => {
        hideLoader();
    });

    // Intercept link clicks for SPA-like smoothness (same-origin only)
    document.addEventListener('click', (e) => {
        const target = e.target.closest('a');
        if (!target) return;
        const url = target.getAttribute('href');
        if (!url || url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('tel:')) return;

        // Only show for same-origin navigations
        try {
            const dest = new URL(url, window.location.href);
            if (dest.origin === window.location.origin) {
                showLoader('Loading...');
            }
        } catch (_) {}
    });
})();


