document.addEventListener("DOMContentLoaded", () => {
    // Rolling text navigation effect
    document.querySelectorAll(".rolling-text").forEach(element => {
        const text = element.textContent;
        element.innerHTML = "";

        const block1 = document.createElement("div");
        block1.classList.add("block");

        const block2 = document.createElement("div");
        block2.classList.add("block");

        for (const ch of text) {
            const span = document.createElement("span");
            span.textContent = ch === " " ? "\xa0" : ch;
            block1.appendChild(span);
            block2.appendChild(span.cloneNode(true));
        }

        element.append(block1, block2);
    });

    // nav-bar scroll animation
    const navBar = document.querySelector('.nav-bar');
    const navLinks = navBar.querySelectorAll('a.rolling-text, #contact');
    let availableForWork;

    if (window.matchMedia('(min-width: 769px)').matches) {
        ScrollTrigger.create({
            start: "top top",
            end: "+=99999",
            onUpdate: (self) => {
                if (self.direction === 1 && self.scroll() > 50) {
                    navBar.style.padding = "0.3rem 1rem 0.3rem 0.6rem";
                    navLinks.forEach(link => link.style.display = "none");

                    if (!availableForWork) {
                        availableForWork = document.createElement("span");
                        availableForWork.textContent = "Available for work";
                        availableForWork.style.color = "#fff";
                        availableForWork.style.fontSize = "1rem";
                        availableForWork.style.display = "flex";
                        availableForWork.style.alignItems = "center";
                        availableForWork.style.gap = "0.4rem";

                        const dot = document.createElement("span");
                        dot.style.width = "8px";
                        dot.style.height = "8px";
                        dot.style.borderRadius = "50%";
                        dot.style.background = "rgb(208, 255, 113)";
                        availableForWork.appendChild(dot);
                        navBar.appendChild(availableForWork);
                    }
                } else if (self.direction === -1) {
                    navBar.style.padding = "0.5rem 0.6rem";
                    navLinks.forEach(link => link.style.display = "");

                    if (availableForWork) {
                        navBar.removeChild(availableForWork);
                        availableForWork = null;
                    }
                }
            }
        });
    }

    // Services accordion functionality
    const accordionHeaders = document.querySelectorAll(".services-accordion-header");
    accordionHeaders.forEach(clickedButton => {
        clickedButton.addEventListener("click", () => {
            const isAlreadyActive = clickedButton.classList.contains("active");
            accordionHeaders.forEach(button => {
                button.classList.remove("active");
                button.parentElement.classList.remove("active");
                button.nextElementSibling.style.maxHeight = "0px";
                button.querySelector("ion-icon").setAttribute("name", "chevron-down-outline");
            });
            if (!isAlreadyActive) {
                const accordionItem = clickedButton.parentElement;
                const accordionBody = clickedButton.nextElementSibling;
                const icon = clickedButton.querySelector("ion-icon");
                clickedButton.classList.add("active");
                accordionItem.classList.add("active");
                accordionBody.style.maxHeight = accordionBody.scrollHeight + "px";
                icon.setAttribute("name", "chevron-up-outline");
            }
        });
    });

    gsap.registerPlugin(ScrollTrigger);

    // === HERO: simple page-load fade-in ===
    if (window.gsap) {
        const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

        tl.to(".hero-headline",      { opacity: 1, y: 0, duration: 0.30 })
            .to(".hero-left-title",    { opacity: 1, y: 0, duration: 0.45 }, "-=0.10")
            .to(".hero-right-title",   { opacity: 1, y: 0, duration: 0.45 }, "-=0.35")
            .to(".hero-center .hero-pfp", { opacity: 1, y: 0, scale: 1, duration: 0.55 }, "-=0.35")
            .to(".hero-tagline",       { opacity: 1, y: 0, duration: 0.30 }, "-=0.20");
    }

    // --- ✅ NEW: About Section Animations ---

    // 1. Left Content: Fade in from bottom
    gsap.from(".about-text-content", {
        scrollTrigger: {
            trigger: ".about-section",
            start: "top 80%", // When the top of the section is 80% from the top of the viewport
            toggleActions: "play none none none"
        },
        opacity: 0,
        y: 80, // Start 50px below its final position
        duration: 1.2,
        ease: "power1.inOut"
    });

    // 2. Right Content: Fade in from right
    gsap.from(".my-music", {
        scrollTrigger: {
            trigger: ".about-section",
            start: "top 80%",
            toggleActions: "play none none none"
        },
        opacity: 0,
        x: 50, // Start 50px to the right of its final position
        duration: 1.2,
        ease: "power1.inOut",
        delay: 0.6 // A slight delay to make the entrance feel more dynamic
    });

    // --- ✅ NEW: Services Section Animations ---

    // 1. Left side: Fade in its place
    gsap.from(".services-left-content", {
        scrollTrigger: {
            trigger: ".services-section",
            start: "top 80%",
            toggleActions: "play none none none",
        },
        opacity: 0,
        duration: 1.2,
        ease: "power1.inOut",
    });

    // 2. Right side: Accordion items slide in one-by-one
    gsap.from(".services-right-content .services-accordion-item", {
        scrollTrigger: {
            trigger: ".services-section",
            start: "top 80%",
            toggleActions: "play none none none",
        },
        opacity: 0,
        y: 50,
        duration: 0.5,
        ease: "power1.out",
        delay: 0.6,
        stagger: 0.4, // This creates the one-by-one effect
    });

    const cards = gsap.utils.toArray(".project-card");
    const browseButton = document.querySelector(".browse-button-container");

    // Set the initial stacking order (z-index)
    gsap.set(cards, {
        zIndex: (i) => i
    });

    // The Main Animation Timeline
    const timeline = gsap.timeline({
        scrollTrigger: {
            trigger: ".projects-stack", // We pin the stack of cards
            pin: true,
            scrub: 1,
            start: "center center", // Pin when the center of the stack hits the center of the screen
            end: "+=2000", // The animation lasts for 2000px of scrolling
        }
    });

    // Add a starting pause for "breathing room" on the first card
    timeline.to({}, { duration: 0.2 });

    // Animate the cards moving away
    timeline
        .to(cards[2], { yPercent: -120, scale: 0.9, duration: 1 })
        .to({}, { duration: 0.2 }) // Pause for breathing room
        .to(cards[1], { yPercent: -120, scale: 0.95, duration: 1 });

    // Animate the header scrolling out of view separately
    gsap.to(".projects-header", {
        yPercent: -150,
        opacity: 0,
        ease: "power2.inOut",
        scrollTrigger: {
            trigger: ".projects-section",
            start: "top 40%",
            end: "top top",
            scrub: 2
        }
    });

    gsap.to(".browse-button-container", {
        opacity: 1,
        y: 0,
        ease: "power1.inOut",
        scrollTrigger: {
            trigger: ".browse-button-container",
            start: "top 90%", // Starts fading in when the button enters the bottom of the screen
            end: "top 75%",
            scrub: true,
        }
    });

     // --- ✅ NEW: FAQ Section Animations ---
    
    // 1. Left side: Fade in its place
    gsap.from(".faq-left-content", {
        scrollTrigger: {
            trigger: ".faq-section",
            start: "top 80%",
            toggleActions: "play none none none",
        },
        opacity: 0,
        duration: 1.2,
        ease: "power1.inOut",
    });

    // 2. Right side: Accordion items slide in one-by-one
    gsap.from(".faq-right-content .services-accordion-item", {
        scrollTrigger: {
            trigger: ".faq-section",
            start: "top 80%",
            toggleActions: "play none none none",
        },
        opacity: 0,
        y: 50,
        duration: 1,
        ease: "power1.out",
        delay: 0.6,
        stagger: 0.4, 
    });


    // --- ✅ NEW: Contact Section Animation ---
    gsap.from(".contact-content-grid", {
        scrollTrigger: {
            trigger: ".contact-section",
            start: "top 80%",
            toggleActions: "play none none none",
        },
        opacity: 0,
        duration: 1.2,
        ease: "power1.inOut",
    });

    // --- ✅ NEW: Contact Form Submission Logic ---
    const form = document.getElementById('contact-form');
    const formSubmitText = document.getElementById('form-submit-text');

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(form);
        
        formSubmitText.textContent = 'Submitting...';

        fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                formSubmitText.textContent = 'Success!';
                form.reset();
            } else {
                formSubmitText.textContent = 'Error!';
                console.log('Error', data);
            }
            // Reset button text after a few seconds
            setTimeout(() => {
                formSubmitText.textContent = 'Submit';
            }, 4000);
        })
        .catch(error => {
            console.log('Error:', error);
            formSubmitText.textContent = 'Error!';
             setTimeout(() => {
                formSubmitText.textContent = 'Submit';
            }, 4000);
        });
    });

    // ===== Mobile nav: open/close glass sheet (fixed) =====
    const navToggle = document.querySelector('.nav-toggle');
    const navSheet  = document.getElementById('nav-sheet');
    const navClose  = document.querySelector('.nav-close');

    function openSheet(){
        if (!navSheet) return;
        navSheet.hidden = false;                 // remove display:none from [hidden]
        document.body.classList.add('nav-locked'); // lock scroll
        requestAnimationFrame(()=> navSheet.classList.add('open')); // fade/scale in
    }

    function closeSheet(){
        if (!navSheet) return;
        navSheet.classList.remove('open');       // start fade/scale out
        navSheet.addEventListener('transitionend', ()=>{
                navSheet.hidden = true;                // put back display:none
                document.body.classList.remove('nav-locked'); // unlock scroll
        }, { once: true });
    }

    navToggle?.addEventListener('click', (e)=>{
        e.stopPropagation();
        (navSheet?.hidden ?? true) ? openSheet() : closeSheet();
    });
    navClose?.addEventListener('click', (e)=>{ e.stopPropagation(); closeSheet(); });

    // click outside to close
    document.addEventListener('click', (e)=>{
        if (!navSheet || navSheet.hidden) return;
        if (!navSheet.contains(e.target) && !navToggle.contains(e.target)) closeSheet();
    });

    // Esc to close
    document.addEventListener('keydown', (e)=>{
        if (e.key === 'Escape' && navSheet && !navSheet.hidden) closeSheet();
    });

});