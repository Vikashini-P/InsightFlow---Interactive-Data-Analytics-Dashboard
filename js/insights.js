/* =========================================================
   INSIGHTFLOW – INSIGHTS PAGE JAVASCRIPT
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       THEME TOGGLE
       ===================================================== */

    const themeToggle =
        document.getElementById("themeToggle");

    const themeIcon =
        document.getElementById("themeIcon");


    function applyTheme(theme) {

        if (theme === "dark") {

            document.body.classList.add("dark-mode");

            if (themeIcon) {
                themeIcon.textContent = "☀";
            }

        } else {

            document.body.classList.remove("dark-mode");

            if (themeIcon) {
                themeIcon.textContent = "☾";
            }
        }

        localStorage.setItem(
            "insightflow-theme",
            theme
        );
    }


    // Load saved theme
    const savedTheme =
        localStorage.getItem("insightflow-theme");

    applyTheme(
        savedTheme === "dark"
            ? "dark"
            : "light"
    );


    // Theme button
    if (themeToggle) {

        themeToggle.addEventListener("click", (event) => {

            event.preventDefault();
            event.stopPropagation();

            const isDark =
                document.body.classList.contains("dark-mode");

            applyTheme(
                isDark ? "light" : "dark"
            );

        });

    }


    /* =====================================================
       MOBILE MENU
       ===================================================== */

    const menuToggle =
        document.getElementById("menuToggle");

    const navMenu =
        document.querySelector(".nav-menu");


    if (menuToggle && navMenu) {

        menuToggle.addEventListener("click", (event) => {

            event.preventDefault();

            navMenu.classList.toggle("open");

            menuToggle.classList.toggle("active");

        });


        navMenu.querySelectorAll("a").forEach(link => {

            link.addEventListener("click", () => {

                navMenu.classList.remove("open");

                menuToggle.classList.remove("active");

            });

        });

    }


    /* =====================================================
       HERO BAR ANIMATION
       ===================================================== */

    const bars =
        document.querySelectorAll(
            ".chart-bars span, .performance-chart span"
        );

    bars.forEach((bar, index) => {

        bar.style.animationDelay =
            `${index * 0.1}s`;

    });


    /* =====================================================
       SCROLL REVEAL
       ===================================================== */

    const revealElements =
        document.querySelectorAll(
            ".insight-card, " +
            ".process-card, " +
            ".decision-content, " +
            ".decision-visual, " +
            ".section-heading"
        );


    if ("IntersectionObserver" in window) {

        const observer =
            new IntersectionObserver(
                (entries, obs) => {

                    entries.forEach(entry => {

                        if (entry.isIntersecting) {

                            entry.target.classList.add(
                                "visible"
                            );

                            obs.unobserve(
                                entry.target
                            );

                        }

                    });

                },
                {
                    threshold: 0.12
                }
            );


        revealElements.forEach(element => {

            element.classList.add("reveal");

            observer.observe(element);

        });

    } else {

        revealElements.forEach(element => {

            element.classList.add("visible");

        });

    }


    /* =====================================================
       ACTIVE NAVIGATION
       ===================================================== */

    const currentPage =
        window.location.pathname
            .split("/")
            .pop();


    document.querySelectorAll(
        ".nav-menu .nav-link"
    ).forEach(link => {

        const href =
            link.getAttribute("href");

        if (
            href &&
            href !== "#" &&
            href === currentPage
        ) {

            link.classList.add("active");

        }

    });


    /* =====================================================
       SMOOTH SCROLL
       ===================================================== */

    document.querySelectorAll(
        'a[href^="#"]'
    ).forEach(link => {

        link.addEventListener("click", event => {

            const targetId =
                link.getAttribute("href");

            if (
                !targetId ||
                targetId === "#"
            ) {
                return;
            }


            const target =
                document.querySelector(targetId);


            if (target) {

                event.preventDefault();

                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }

        });

    });


    /* =====================================================
       PAGE LOADED
       ===================================================== */

    document.body.classList.add(
        "page-loaded"
    );

});