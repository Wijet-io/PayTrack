// Simple script to hide Emergent badge
(function() {
    function hideEmergentBadge() {
        try {
            // Remove the emergent badge
            const badge = document.getElementById('emergent-badge');
            if (badge) {
                badge.remove();
            }
            
            // Hide any elements containing emergent text
            document.querySelectorAll('*').forEach(el => {
                if (el.textContent && el.textContent.toLowerCase().includes('emergent')) {
                    el.style.display = 'none';
                }
            });
        } catch(e) {
            console.log('Badge hiding error:', e);
        }
    }
    
    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', hideEmergentBadge);
    } else {
        hideEmergentBadge();
    }
    
    // Run periodically
    setInterval(hideEmergentBadge, 2000);
})();