// Aggressive script to hide Emergent badge
(function() {
    function hideEmergentBadge() {
        // Hide all elements that might contain the emergent badge
        const selectors = [
            '[alt*="emergent" i]',
            '[alt*="made with" i]',
            '[class*="emergent" i]',
            '[id*="emergent" i]',
            'div[style*="position: fixed"][style*="bottom"]',
            'div[style*="position: fixed"][style*="right"]',
            '*[style*="z-index: 999999"]',
            '*[style*="z-index: 9999"]'
        ];
        
        selectors.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    el.style.display = 'none !important';
                    el.style.visibility = 'hidden !important';
                    el.style.opacity = '0 !important';
                    el.remove();
                });
            } catch(e) {}
        });
        
        // Check for any fixed elements in bottom right
        const allElements = document.querySelectorAll('*');
        allElements.forEach(el => {
            const style = window.getComputedStyle(el);
            if (style.position === 'fixed') {
                const rect = el.getBoundingClientRect();
                const isBottomRight = rect.bottom > window.innerHeight - 100 && rect.right > window.innerWidth - 200;
                if (isBottomRight || el.textContent.toLowerCase().includes('emergent') || el.textContent.toLowerCase().includes('made with')) {
                    el.style.display = 'none !important';
                    el.remove();
                }
            }
        });
    }
    
    // Run immediately
    hideEmergentBadge();
    
    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', hideEmergentBadge);
    }
    
    // Keep running periodically
    setInterval(hideEmergentBadge, 1000);
    
    // Observer for new elements
    const observer = new MutationObserver(hideEmergentBadge);
    observer.observe(document.body, { 
        childList: true, 
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class', 'id']
    });
})();