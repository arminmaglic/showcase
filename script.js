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

    // Add click event listeners to navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section');
            showSection(sectionId);
        });
    });

    // Default initialization is handled by the 'active' class in the HTML.
    // Future expansion: Add hash-based routing support here.
})();
