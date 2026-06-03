(function() {
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    const sections = document.querySelectorAll('.view-section');
    const mainContent = document.querySelector('.main-content');

    // Flag to prevent scroll event immediately after section switch
    let isTransitioning = false;
    let transitionTimeout = null;

    /**
     * Toggles the active view based on the section ID.
     * @param {string} sectionId - The ID of the section to display.
     */
    function showSection(sectionId) {
        // Set transitioning flag to prevent scroll event from firing
        isTransitioning = true;

        // Clear any existing transition timeout
        if (transitionTimeout) {
            clearTimeout(transitionTimeout);
        }

        // Hide all sections and deactivate all nav links
        sections.forEach(s => s.classList.remove('active'));
        navLinks.forEach(l => l.classList.remove('active'));

        // Show the targeted section
        const target = document.getElementById(sectionId);
        if (target) {
            target.classList.add('active');
            // Reset scroll position to top when switching views
            mainContent.scrollTop = 0;
        }

        // Activate the corresponding navigation link
        const activeLink = document.querySelector(`.sidebar-nav a[data-section="${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // Clear transitioning flag after a short delay
        transitionTimeout = setTimeout(() => {
            isTransitioning = false;
        }, 300);
    }

    /**
     * Gets the currently active section ID.
     * @returns {string} The ID of the active section.
     */
    function getActiveSectionId() {
        const activeSection = document.querySelector('.view-section.active');
        return activeSection ? activeSection.id : '';
    }

    /**
     * Gets the next section ID in navigation order.
     * @returns {string|null} The next section ID or null if at the end.
     */
    function getNextSectionId() {
        const activeId = getActiveSectionId();
        const sectionOrder = Array.from(navLinks).map(link => link.getAttribute('data-section'));
        const currentIndex = sectionOrder.indexOf(activeId);

        if (currentIndex !== -1 && currentIndex < sectionOrder.length - 1) {
            return sectionOrder[currentIndex + 1];
        }
        return null;
    }

    /**
     * Gets the previous section ID in navigation order.
     * @returns {string|null} The previous section ID or null at the beginning.
     */
    function getPreviousSectionId() {
        const activeId = getActiveSectionId();
        const sectionOrder = Array.from(navLinks).map(link => link.getAttribute('data-section'));
        const currentIndex = sectionOrder.indexOf(activeId);

        if (currentIndex > 0) {
            return sectionOrder[currentIndex - 1];
        }
        return null;
    }

    /**
     * Handles scroll-based navigation.
     * Automatically transitions to next/previous section when scrolling past boundaries.
     */
    let scrollTimeout = null;
    mainContent.addEventListener('scroll', function() {
        // Ignore scroll events during transition
        if (isTransitioning) {
            return;
        }

        // Clear previous timeout to debounce
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }

        scrollTimeout = setTimeout(() => {
            // Check again after debounce in case transition started
            if (isTransitioning) {
                return;
            }

            const scrollPosition = mainContent.scrollTop;
            const scrollHeight = mainContent.scrollHeight - mainContent.clientHeight;

            // Scrolled to bottom - go to next section
            if (scrollPosition >= scrollHeight - 10) {
                const nextSection = getNextSectionId();
                if (nextSection) {
                    showSection(nextSection);
                }
            }
            // Scrolled to top - go to previous section
            else if (scrollPosition <= 0 && getActiveSectionId() !== 'home') {
                const previousSection = getPreviousSectionId();
                if (previousSection) {
                    showSection(previousSection);
                }
            }
        }, 100); // 100ms debounce to prevent rapid transitions
    });

    // Hybrid portfolio logic
    let currentLang = 'en';
    let translations = {};
    let geoConfig = {};

    function applyTranslations(lang) {
        if (!translations) return;
        
        Object.keys(translations).forEach(selector => {
            const elements = document.querySelectorAll(selector);
            const text = translations[selector][lang];
            if (text) {
                elements.forEach(el => {
                    // If it's a link in sidebar-nav, we only want to change the text node, not the ::after
                    if (el.classList.contains('sidebar-nav') || el.closest('.sidebar-nav')) {
                        el.childNodes[0].textContent = text;
                    } else {
                        el.textContent = text;
                    }
                });
            }
        });

        // Update active state in switcher
        document.querySelectorAll('.lang-link').forEach(link => {
            link.classList.toggle('active', link.getAttribute('data-lang') === lang);
        });

        currentLang = lang;
        localStorage.setItem('portfolio-lang', lang);
    }

    async function detectLanguage() {
        const savedLang = localStorage.getItem('portfolio-lang');
        if (savedLang) return savedLang;

        try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            const country = data.country_code;
            return geoConfig[country] || 'en';
        } catch (err) {
            console.warn('Geo-detection failed, defaulting to EN', err);
            return 'en';
        }
    }

    async function initPortfolio() {
        // Load configurations
        try {
            const [projRes, transRes] = await Promise.all([
                fetch('./projects.json'),
                fetch('./translations.json')
            ]);
            
            const projData = await projRes.json();
            const transData = await transRes.json();
            
            translations = transData.translations;
            geoConfig = transData; // Contains country mappings at root

            // Handle Language
            const lang = await detectLanguage();
            applyTranslations(lang);

            // Handle Role/Filtering
            const urlParams = new URLSearchParams(window.location.search);
            const role = urlParams.get('role');
            
            const config = projData.personas && projData.personas[role];
            if (config) {
                const heroTitle = document.getElementById('heroTitle');
                const heroSubtitle = document.getElementById('heroSubtitle');

                // Handle hero_title (can be string or object with en/bs)
                if (heroTitle && config.hero_title) {
                    const titleText = typeof config.hero_title === 'object' ? config.hero_title[lang] || config.hero_title['en'] : config.hero_title;
                    heroTitle.textContent = titleText;
                }

                // Handle hero_subtitle (can be string or object with en/bs)
                if (heroSubtitle && config.hero_subtitle) {
                    const subtitleText = typeof config.hero_subtitle === 'object' ? config.hero_subtitle[lang] || config.hero_subtitle['en'] : config.hero_subtitle;
                    heroSubtitle.textContent = subtitleText;
                }

                const expertiseList = document.getElementById('heroExpertise');
                // Handle hero_expertise (can be array or object with en/bs arrays)
                if (expertiseList && config.hero_expertise) {
                    const expertiseItems = Array.isArray(config.hero_expertise) ? config.hero_expertise : (config.hero_expertise[lang] || config.hero_expertise['en']);
                    if (Array.isArray(expertiseItems)) {
                        expertiseList.innerHTML = '';
                        expertiseItems.forEach(item => {
                            const el = document.createElement('div');
                            el.className = 'expertise-item';
                            el.textContent = item;
                            expertiseList.appendChild(el);
                        });
                    }
                }

                const projects = document.querySelectorAll('.framework-showcase[id]');
                projects.forEach(project => {
                    project.style.display = config.visible_project_ids.includes(project.id) ? 'block' : 'none';
                });

                const productSection = document.getElementById('product');
                if (productSection) {
                    const visibleInProduct = productSection.querySelectorAll('[id]:not([style*="display: none"])');
                    if (visibleInProduct.length === 0) {
                        productSection.style.display = 'none';
                        const navLink = document.querySelector('.sidebar-nav a[data-section="product"]');
                        if (navLink) navLink.style.display = 'none';
                    }
                }

                const capabilitiesSection = document.getElementById('capabilities');
                if (capabilitiesSection) {
                    const visibleInCapabilities = capabilitiesSection.querySelectorAll('[id]:not([style*="display: none"])');
                    if (visibleInCapabilities.length === 0) {
                        capabilitiesSection.style.display = 'none';
                        const navLink = document.querySelector('.sidebar-nav a[data-section="capabilities"]');
                        if (navLink) navLink.style.display = 'none';
                    }
                }

                // Hide navigation items based on persona configuration
                if (config.hidden_nav && Array.isArray(config.hidden_nav)) {
                    config.hidden_nav.forEach(sectionId => {
                        const navLink = document.querySelector(`.sidebar-nav a[data-section="${sectionId}"]`);
                        if (navLink) navLink.style.display = 'none';
                    });
                }
            }
        } catch (err) {
            console.error('Error initializing portfolio:', err);
        }
    }

    // Add click event listeners to navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section');
            showSection(sectionId);
        });
    });

    // Add language switcher listeners
    document.querySelectorAll('.lang-link').forEach(link => {
        link.addEventListener('click', function() {
            applyTranslations(this.getAttribute('data-lang'));
        });
    });

    // Call init on load
    window.addEventListener('load', initPortfolio);

    // Screenshot modal behavior
    const screenshotModal = document.getElementById('screenshotModal');
    const screenshotModalTitle = document.getElementById('screenshotModalTitle');
    const screenshotModalBody = screenshotModal ? screenshotModal.querySelector('.screenshot-modal-body') : null;

    function openScreenshotModal(title, src) {
        if (!screenshotModal || !screenshotModalTitle || !screenshotModalBody) return;
        screenshotModalTitle.textContent = title || 'Screenshot';
        if (src) {
            screenshotModalBody.innerHTML = `<img src="${src}" alt="${title || 'Screenshot'}">`;
        } else {
            screenshotModalBody.innerHTML = `<span class="placeholder-fallback">No screenshot provided yet. Replace with: screenshot.jpg</span>`;
        }
        screenshotModal.classList.add('active');
        screenshotModal.setAttribute('aria-hidden', 'false');
    }

    function closeScreenshotModal() {
        if (!screenshotModal) return;
        screenshotModal.classList.remove('active');
        screenshotModal.setAttribute('aria-hidden', 'true');
    }

    document.addEventListener('click', function(event) {
        const trigger = event.target.closest('.modal-trigger');
        if (trigger) {
            const title = trigger.getAttribute('data-modal-title') || '';
            const src = trigger.getAttribute('data-modal-src') || '';
            openScreenshotModal(title, src);
            return;
        }

        const closeTrigger = event.target.closest('[data-modal-close]');
        if (closeTrigger) {
            closeScreenshotModal();
            return;
        }

        if (event.target === screenshotModal) {
            closeScreenshotModal();
        }
    });

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeScreenshotModal();
        }
    });

    document.addEventListener('click', function(event) {
        const btn = event.target.closest('.filter-btn');
        if (!btn) return;

        const filterBar = btn.closest('.section-filters');
        if (!filterBar) return;

        const filterValue = btn.getAttribute('data-filter') || 'all';
        const container = filterBar.closest('.view-section');
        if (!container) return;

        filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const projects = container.querySelectorAll('.framework-showcase[id]');
        projects.forEach(project => {
            if (filterValue === 'all') {
                project.style.display = '';
                return;
            }
            const categories = (project.getAttribute('data-category') || '').split(' ').map(s => s.trim()).filter(Boolean);
            project.style.display = categories.includes(filterValue) ? '' : 'none';
        });
    });

    // Default initialization is handled by the 'active' class in the HTML.
    // Future expansion: Add hash-based routing support here.
})();
