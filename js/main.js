/* =====================================================
   INSIGHTFLOW - GLOBAL JAVASCRIPT
   ===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    /* ================= THEME ================= */

    const themeToggle = document.getElementById("themeToggle");
    const themeIcon = document.getElementById("themeIcon");

    const savedTheme = localStorage.getItem("insightflow-theme");

    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");

        if (themeIcon) {
            themeIcon.textContent = "☀";
        }
    }


    if (themeToggle) {

        themeToggle.addEventListener("click", function () {

            document.body.classList.toggle("dark-mode");

            const isDark =
                document.body.classList.contains("dark-mode");

            localStorage.setItem(
                "insightflow-theme",
                isDark ? "dark" : "light"
            );

            if (themeIcon) {
                themeIcon.textContent =
                    isDark ? "☀" : "☾";
            }

        });

    }


    /* ================= MOBILE MENU ================= */

    const menuToggle = document.getElementById("menuToggle");
    const navMenu = document.querySelector(".nav-menu");

    if (menuToggle && navMenu) {

        menuToggle.addEventListener("click", function () {

            navMenu.classList.toggle("open");

        });


        document.querySelectorAll(".nav-link").forEach(function (link) {

            link.addEventListener("click", function () {
                navMenu.classList.remove("open");
            });

        });

    }


    /* ================= CLOSE MENU OUTSIDE ================= */

    document.addEventListener("click", function (event) {

        if (!navMenu || !menuToggle) {
            return;
        }

        if (
            !navMenu.contains(event.target) &&
            !menuToggle.contains(event.target)
        ) {
            navMenu.classList.remove("open");
        }

    });


    /* ================= SCROLL EFFECT ================= */

    const navbar = document.querySelector(".navbar");

    window.addEventListener("scroll", function () {

        if (!navbar) {
            return;
        }

        if (window.scrollY > 20) {
            navbar.style.boxShadow =
                "0 8px 30px rgba(15, 23, 42, 0.08)";
        } else {
            navbar.style.boxShadow = "none";
        }

    });


    /* ================= REVEAL ANIMATION ================= */

    const revealElements =
        document.querySelectorAll(".feature-card, .stat-item");

    const revealObserver = new IntersectionObserver(
        function (entries) {

            entries.forEach(function (entry) {

                if (entry.isIntersecting) {

                    entry.target.style.opacity = "1";
                    entry.target.style.transform = "translateY(0)";

                    revealObserver.unobserve(entry.target);
                }

            });

        },
        {
            threshold: 0.12
        }
    );


    revealElements.forEach(function (element) {

        element.style.opacity = "0";
        element.style.transform = "translateY(20px)";
        element.style.transition =
            "opacity 0.6s ease, transform 0.6s ease";

        revealObserver.observe(element);

    });

});