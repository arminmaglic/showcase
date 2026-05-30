(function() {
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    const sections = document.querySelectorAll('.view-section');
    const mainContent = document.querySelector('.main-content');

    /**
     * Toggles the active view based on the section ID.
     * @param {string} sectionId - The ID of the section to display.
     */
    function showSection(sectionId) {
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
    }

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
