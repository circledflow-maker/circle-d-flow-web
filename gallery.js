document.addEventListener('DOMContentLoaded', () => {
    
    // --- Custom Cursor ---
    const cursor = document.getElementById('cursor');
    
    if (cursor) {
        document.addEventListener('mousemove', (e) => {
            if (window.innerWidth > 768) {
                cursor.style.transform = `translate(${e.clientX - 24}px, ${e.clientY - 24}px)`;
            }
        });

        // Hover Effect for Links and Buttons
        const interactiveElements = document.querySelectorAll('a, button, .comparison-container');
        
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.classList.add('cursor-active');
            });
            el.addEventListener('mouseleave', () => {
                cursor.classList.remove('cursor-active');
            });
        });
    }
    
    // --- Hero Split Screen Interaction ---
    const heroContainer = document.getElementById('hero-split');
    const topLayer = document.getElementById('hero-top-layer');
    
    if (heroContainer && topLayer) {
        heroContainer.addEventListener('mousemove', (e) => {
            // Calculate percentage of mouse position relative to container width
            const rect = heroContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const width = rect.width;
            let percentage = (x / width) * 100;
            
            // Clamp percentage slightly to avoid edge issues
            percentage = Math.max(0, Math.min(100, percentage));
            
            topLayer.style.width = `${percentage}%`;
        });

        // Reset on mouse leave (optional, maybe center it?)
        heroContainer.addEventListener('mouseleave', () => {
            topLayer.style.transition = 'width 0.5s ease-out';
            topLayer.style.width = '50%';
            setTimeout(() => {
                topLayer.style.transition = 'none'; // Remove transition for instant mouse tracking
            }, 500);
        });
    }

    // --- Comparison Sliders ---
    const sliders = document.querySelectorAll('.comparison-container');

    sliders.forEach(slider => {
        const overlay = slider.querySelector('.comparison-overlay');
        const handle = slider.querySelector('.comparison-slider-handle');
        let isDragging = false;

        const updateSlider = (x) => {
            const rect = slider.getBoundingClientRect();
            let position = x - rect.left;
            let percentage = (position / rect.width) * 100;
            
            // Clamp
            percentage = Math.max(0, Math.min(100, percentage));
            
            overlay.style.width = `${percentage}%`;
            handle.style.left = `${percentage}%`;
        };

        // Mouse Events
        slider.addEventListener('mousedown', (e) => {
            isDragging = true;
            updateSlider(e.clientX);
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            updateSlider(e.clientX);
        });

        window.addEventListener('mouseup', () => {
            isDragging = false;
        });

        // Touch Events (for mobile)
        slider.addEventListener('touchstart', (e) => {
            isDragging = true;
            updateSlider(e.touches[0].clientX);
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            updateSlider(e.touches[0].clientX);
        }, { passive: false });

        window.addEventListener('touchend', () => {
            isDragging = false;
        });
        
        // Hover effect for desktop (optional alternative to drag)
        // If user prefers hover over drag, we can enable this. 
        // For now, drag is more explicit and works better on touch.
        /*
        slider.addEventListener('mousemove', (e) => {
            if (window.matchMedia('(hover: hover)').matches) {
                updateSlider(e.clientX);
            }
        });
        */
    });

    // --- Booking Modal Logic ---
    const bookingModal = document.getElementById('booking-modal');
    const closeBookingBtn = document.getElementById('close-booking-btn');
    const bookBtns = document.querySelectorAll('a[href*="contact"], a[href*="calendar"], a[href*="mailto"]'); // Hijack existing contact links
    
    // State
    let bookingState = {
        step: 1,
        service: '',
        details: {}
    };

    // Elements
    const steps = [
        document.getElementById('step-1'),
        document.getElementById('step-2'),
        document.getElementById('step-3')
    ];
    const progressBar = document.getElementById('booking-progress');
    const stepTitle = document.getElementById('booking-step-title');
    const stepDesc = document.getElementById('booking-step-desc');
    
    // Step Info
    const stepInfo = [
        { title: "Select Service", desc: "Choose the experience that fits your vision." },
        { title: "Your Details", desc: "Tell us a bit about yourself and your ideas." },
        { title: "Confirm Booking", desc: "Review your details before sending." }
    ];

    function updateModalUI() {
        // Show/Hide Steps
        steps.forEach((el, index) => {
            if (index + 1 === bookingState.step) {
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        });

        // Update Progress
        progressBar.style.width = `${(bookingState.step / 3) * 100}%`;

        // Update Text (Desktop Left Panel)
        if (stepTitle && stepDesc) {
            stepTitle.textContent = stepInfo[bookingState.step - 1].title;
            stepDesc.textContent = stepInfo[bookingState.step - 1].desc;
        }
    }

    function openBookingModal(preselectedService = null) {
        bookingModal.classList.remove('hidden');
        setTimeout(() => bookingModal.classList.remove('opacity-0'), 10);
        
        // Reset
        bookingState.step = 1;
        if (preselectedService) {
            bookingState.service = preselectedService;
            bookingState.step = 2; // Skip to step 2 if service known
        }
        updateModalUI();
    }

    function closeBookingModal() {
        bookingModal.classList.add('opacity-0');
        setTimeout(() => bookingModal.classList.add('hidden'), 500);
    }

    // Event Listeners
    
    // Open Modal (Hijack links)
    bookBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            // Try to guess service from context or text
            let service = null;
            if (btn.closest('.group')) {
                const title = btn.closest('.group').querySelector('h3');
                if (title) service = title.textContent;
            }
            openBookingModal(service);
        });
    });

    closeBookingBtn.addEventListener('click', closeBookingModal);

    // Step 1: Service Selection
    document.querySelectorAll('.service-option').forEach(btn => {
        btn.addEventListener('click', () => {
            bookingState.service = btn.dataset.service;
            bookingState.step = 2;
            updateModalUI();
        });
    });

    // Step 2: Form -> Step 3
    document.getElementById('to-step-3').addEventListener('click', (e) => {
        e.preventDefault();
        const form = document.getElementById('booking-form');
        const formData = new FormData(form);
        
        // Simple Validation
        const name = formData.get('name');
        const email = formData.get('email');
        
        if (!name || !email) {
            alert('Please fill in your name and email.');
            return;
        }

        bookingState.details = {
            name: name,
            email: email,
            direction: formData.get('direction')
        };

        // Populate Summary
        document.getElementById('summary-service').textContent = bookingState.service;
        document.getElementById('summary-name').textContent = bookingState.details.name;
        document.getElementById('summary-email').textContent = bookingState.details.email;
        document.getElementById('summary-vision').textContent = bookingState.details.direction || "No specific vision provided.";

        bookingState.step = 3;
        updateModalUI();
    });

    // Back Buttons
    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (bookingState.step > 1) {
                bookingState.step--;
                updateModalUI();
            }
        });
    });

    // Confirm Booking
    document.getElementById('confirm-booking').addEventListener('click', () => {
        // Here we would send data to backend
        console.log("Booking Confirmed:", bookingState);
        
        // Simulate loading
        const btn = document.getElementById('confirm-booking');
        const originalText = btn.textContent;
        btn.textContent = "Processing...";
        btn.disabled = true;

        setTimeout(() => {
            window.location.href = 'thankyou.html';
        }, 1500);
    });

});
