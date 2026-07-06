document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const navbar = document.querySelector('.navbar');
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Start Planning Buttons
    const planningButtons = [
        document.getElementById('startPlanningBtnNav'),
        document.getElementById('startPlanningBtnHero'),
        document.getElementById('startPlanningBtnCTA'),
        document.querySelector('.btn-mobile-cta')
    ];

    /* ==========================================
       1. NAVBAR SCROLL EFFECT
       ========================================== */
    const handleScroll = () => {
        if (navbar) {
            if (window.scrollY > 20) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
    };
    
    if (navbar) {
        window.addEventListener('scroll', handleScroll);
        handleScroll(); // Check initial state
    }

    /* ==========================================
       2. MOBILE MENU TOGGLE
       ========================================== */
    const toggleMenu = () => {
        if (menuToggle && navMenu) {
            menuToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
            // Prevent body scroll when menu is active
            document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
        }
    };

    const closeMenu = () => {
        if (menuToggle) menuToggle.classList.remove('active');
        if (navMenu) navMenu.classList.remove('active');
        document.body.style.overflow = '';
    };

    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMenu);
    }

    // Close menu when clicking a link
    if (navLinks) {
        navLinks.forEach(link => {
            link.addEventListener('click', closeMenu);
        });
    }

    /* ==========================================
       3. CUSTOM TOAST NOTIFICATION
       ========================================== */
    const showComingSoonToast = () => {
        // Close menu if open (on mobile)
        closeMenu();

        // Check if toast already exists
        let existingToast = document.querySelector('.roamai-toast');
        if (existingToast) {
            existingToast.remove();
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.className = 'roamai-toast';
        
        // Inline styles for toast container
        Object.assign(toast.style, {
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#0f172a', // Deep slate
            color: '#ffffff',
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3), 0 8px 10px -6px rgba(15, 23, 42, 0.3)',
            zIndex: '9999',
            fontFamily: "'Outfit', sans-serif",
            fontSize: '0.95rem',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            opacity: '0',
            transform: 'translateY(20px)',
            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            pointerEvents: 'none'
        });

        // Toast content
        toast.innerHTML = `
            <span style="font-size: 1.2rem;">🚀</span>
            <span>Planning Form is coming in the next step!</span>
        `;

        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        }, 50);

        // Animate out and remove
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(15px)';
            setTimeout(() => {
                toast.remove();
            }, 400);
        }, 3500);
    };

    // Attach listeners to all start planning buttons
    planningButtons.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                showComingSoonToast();
            });
        }
    });
});
