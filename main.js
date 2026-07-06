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
       3. SCROLL TO FORM ON CLICK
       ========================================== */
    planningButtons.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                closeMenu();
                const formSection = document.getElementById('planning-form');
                if (formSection) {
                    formSection.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }
    });

    /* ==========================================
       4. CUSTOM TOAST NOTIFICATION
       ========================================== */
    const showFormToast = (destination) => {
        let existingToast = document.querySelector('.roamai-toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = 'roamai-toast';
        
        Object.assign(toast.style, {
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#0f172a',
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

        toast.innerHTML = `
            <span style="font-size: 1.2rem;">✨</span>
            <span>Itinerary data for <strong>${destination}</strong> logged to console!</span>
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        }, 50);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(15px)';
            setTimeout(() => {
                toast.remove();
            }, 400);
        }, 4000);
    };

    /* ==========================================
       5. FORM SUBMISSION
       ========================================== */
    const itineraryForm = document.getElementById('itineraryForm');
    const generateBtn = document.getElementById('generateBtn');
    const itinerarySection = document.getElementById('itinerary-section');
    const itineraryContent = document.getElementById('itinerary-content');
    const itineraryTitle = document.getElementById('itinerary-title');
    const metaDestination = document.getElementById('meta-destination');
    const metaDuration = document.getElementById('meta-duration');
    const metaStyle = document.getElementById('meta-style');
    const printBtn = document.getElementById('printBtn');

    if (itineraryForm && generateBtn) {
        itineraryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Get form values
            const formData = new FormData(itineraryForm);
            const interests = [];
            formData.getAll('interests').forEach(val => interests.push(val));
            
            const payload = {
                destination: formData.get('destination'),
                startDate: formData.get('startDate'),
                endDate: formData.get('endDate'),
                duration: formData.get('duration'),
                travelers: formData.get('travelers'),
                budget: formData.get('budget'),
                travelStyle: formData.get('travelStyle'),
                interests: interests
            };
            
            // Put button into loading state
            const originalBtnContent = generateBtn.innerHTML;
            generateBtn.classList.add('loading');
            generateBtn.disabled = true;
            generateBtn.innerHTML = `
                <div class="spinner"></div>
                Generating Custom Itinerary...
            `;
            
            // Hide previous itinerary if any
            if (itinerarySection) {
                itinerarySection.classList.add('hidden');
            }

            try {
                // Call local backend endpoint
                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data.error || 'Server responded with an error');
                }

                // Fill details in UI
                if (metaDestination) metaDestination.textContent = payload.destination;
                if (metaDuration) metaDuration.textContent = `${payload.duration} Days`;
                if (metaStyle) metaStyle.textContent = payload.travelStyle.charAt(0).toUpperCase() + payload.travelStyle.slice(1);
                if (itineraryTitle) itineraryTitle.textContent = `Your Custom Itinerary for ${payload.destination}`;
                
                // Parse and inject Markdown content
                if (itineraryContent && typeof marked !== 'undefined') {
                    itineraryContent.innerHTML = marked.parse(data.itinerary);
                } else if (itineraryContent) {
                    // Fallback if marked library fails to load
                    itineraryContent.innerHTML = `<pre style="white-space: pre-wrap; font-family: inherit;">${data.itinerary}</pre>`;
                }

                // Show itinerary section
                if (itinerarySection) {
                    itinerarySection.classList.remove('hidden');
                    // Scroll smoothly to it
                    setTimeout(() => {
                        itinerarySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                }

            } catch (err) {
                console.error('Error generating itinerary:', err);
                alert(`Oops! We couldn't generate your itinerary. ${err.message}`);
            } finally {
                // Restore button state
                generateBtn.classList.remove('loading');
                generateBtn.disabled = false;
                generateBtn.innerHTML = originalBtnContent;
            }
        });
    }

    // Print functionality
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            window.print();
        });
    }
});
