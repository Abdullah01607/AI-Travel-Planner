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
                
                // Render Day Cards dynamically
                renderItineraryCards(data.itinerary);

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

    // Dynamic Itinerary Cards Rendering
    function renderItineraryCards(itinerary) {
        if (!itineraryContent) return;

        if (itinerary.error_parsing || typeof itinerary !== 'object') {
            // Fallback: render raw text/markdown if JSON mode fails
            if (typeof marked !== 'undefined') {
                itineraryContent.innerHTML = marked.parse(itinerary.raw || itinerary);
            } else {
                itineraryContent.innerHTML = `<pre style="white-space: pre-wrap; font-family: inherit; padding: 2rem;">${itinerary.raw || itinerary}</pre>`;
            }
            document.getElementById('general-tips-section')?.classList.add('hidden');
            return;
        }

        // Set destination/duration/style meta fields if present
        if (metaDestination && itinerary.destination) metaDestination.textContent = itinerary.destination;
        if (metaDuration && itinerary.duration) metaDuration.textContent = `${itinerary.duration} Days`;

        // Render each day card
        let html = '';
        const days = itinerary.days || [];
        days.forEach(day => {
            // Process restaurants
            let restaurantsHtml = '';
            if (day.restaurants && Array.isArray(day.restaurants)) {
                day.restaurants.forEach(rest => {
                    restaurantsHtml += `<li>${rest}</li>`;
                });
            }

            html += `
            <div class="itinerary-day-card">
                <div class="day-card-header">
                    <span class="day-badge">Day ${day.dayNumber || ''}</span>
                    <h3 class="day-title">${day.dayTitle || ''}</h3>
                    <div class="day-cost">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="cost-icon"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                        <span>${day.estimatedDailyCost || 'Moderate'}</span>
                    </div>
                </div>
                
                <div class="day-card-timeline">
                    <!-- Morning -->
                    <div class="timeline-item">
                        <div class="timeline-icon morning" title="Morning">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.93 4.93l1.41 1.41"/><path d="M17.66 17.66l1.41 1.41"/><path d="M2 12h2"/><path d="M22 12h2"/><path d="M6.34 17.66l-1.41 1.41"/><path d="M19.07 4.93l-1.41 1.41"/></svg>
                        </div>
                        <div class="timeline-content">
                            <h4>Morning</h4>
                            <p>${day.morning || ''}</p>
                        </div>
                    </div>
                    
                    <!-- Afternoon -->
                    <div class="timeline-item">
                        <div class="timeline-icon afternoon" title="Afternoon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.93 4.93l1.41 1.41"/><path d="M17.66 17.66l1.41 1.41"/><path d="M2 12h2"/><path d="M22 12h2"/><path d="M6.34 17.66l-1.41 1.41"/><path d="M19.07 4.93l-1.41 1.41"/></svg>
                        </div>
                        <div class="timeline-content">
                            <h4>Afternoon</h4>
                            <p>${day.afternoon || ''}</p>
                        </div>
                    </div>
                    
                    <!-- Evening -->
                    <div class="timeline-item">
                        <div class="timeline-icon evening" title="Evening">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                        </div>
                        <div class="timeline-content">
                            <h4>Evening</h4>
                            <p>${day.evening || ''}</p>
                        </div>
                    </div>
                </div>
                
                <div class="day-card-footer">
                    <div class="footer-section restaurants">
                        <h5>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><path d="M12 2v14M12 22v-6M12 16H8.5a3.5 3.5 0 0 1-3.5-3.5V6a2 2 0 0 1 2-2M12 16h3.5a3.5 3.5 0 0 0 3.5-3.5V6a2 2 0 0 0-2-2"/></svg>
                            Recommended Food
                        </h5>
                        <ul>
                            ${restaurantsHtml || '<li>Ask locals for street food favorites!</li>'}
                        </ul>
                    </div>
                    
                    <div class="footer-section day-tips">
                        <h5>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
                            Daily Tip
                        </h5>
                        <p>${day.travelTips || 'Stay flexible and enjoy the adventure!'}</p>
                    </div>
                </div>
            </div>
            `;
        });

        itineraryContent.innerHTML = html;

        // Render General Tips
        const generalTipsSection = document.getElementById('general-tips-section');
        const generalTipsContent = document.getElementById('general-tips-content');
        if (generalTipsSection && generalTipsContent) {
            const generalTips = itinerary.generalTips || [];
            if (generalTips.length > 0) {
                let tipsHtml = '<ul>';
                generalTips.forEach(tip => {
                    tipsHtml += `<li>${tip}</li>`;
                });
                tipsHtml += '</ul>';
                generalTipsContent.innerHTML = tipsHtml;
                generalTipsSection.classList.remove('hidden');
            } else {
                generalTipsSection.classList.add('hidden');
            }
        }
    }

    // Theme Toggle (Dark Mode)
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        // Load initial theme state
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }

        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            if (document.body.classList.contains('dark-theme')) {
                localStorage.setItem('theme', 'dark');
            } else {
                localStorage.setItem('theme', 'light');
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
