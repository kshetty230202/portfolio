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

    gsap.registerPlugin(ScrollTrigger);

    // === ABOUT HERO: simple page-load fade-in ===
    if (window.gsap) {
        const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

        tl.to(".hero-section .hero-text-content .section-heading", {
            opacity: 1, y: 0, duration: 0.35
            })
            .to(".hero-section .hero-image .pfp-card", {
            opacity: 1, y: 0, scale: 1, duration: 0.50
            }, "-=0.20")
            .to(
            [".hero-section .hero-text-content .social-container",
            ".hero-section .hero-text-content .about-pg"],
            { opacity: 1, y: 0, duration: 0.35, stagger: 0.06 },
            "-=0.20"
            );
    }


    const aboutTextContainer = document.querySelector(".about-left-content");

    if (aboutTextContainer) {
        const subtitle = aboutTextContainer.querySelector(".section-subtitle");
        const summary = aboutTextContainer.querySelector(".my-summary");
        
        const splitSummary = new SplitType(summary, { types: "chars" });

        const aboutTl = gsap.timeline({
            scrollTrigger: {
                trigger: aboutTextContainer,
                start: "top 75%",
                end: "top top",
                scrub: true,
            }
        });

        // 1. Heading fades in first
        aboutTl.from(subtitle, { 
            autoAlpha: 0, 
            y: 20,
            duration: 8 
        });

        // 2. Then the paragraph text reveals
        aboutTl.from(splitSummary.chars, {
            autoAlpha: 0.2,
            stagger: 0.05,
        }, "-=2"); 

        // This second timeline handles the color change independently
        gsap.to(summary.querySelectorAll("span .char"), {
            color: "rgb(208, 255, 113)",
            stagger: 0.05,
            scrollTrigger: {
                trigger: aboutTextContainer,
                start: "top 75%",
                end: "top top",
                scrub: true,
            }
        });
    }


    const lenis = new Lenis();
    requestAnimationFrame(function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    });

    // ✅ NEW: SLIDE-IN ANIMATION FOR EXPERIENCE HEADER
    gsap.from(".exp-header", {
        scrollTrigger: {
            trigger: ".exp-section",
            start: "top 80%",
            toggleActions: "play none none none"
        },
        autoAlpha: 0,
        x: -100,
        duration: 1.5,
        ease: "power2.out"
    });

    const timelineItems = document.querySelectorAll(".timeline-item");

    timelineItems.forEach(item => {
        const card = item.querySelector('.internship-card');
        const isLeft = item.classList.contains('left');

        gsap.set(card, { 
            autoAlpha: 0, 
            x: isLeft ? -80 : 80 
        });

        gsap.to(card, {
            autoAlpha: 1,
            x: 0,
            duration: 0.8,
            ease: "power2.out",
            clearProps: "transform",
            scrollTrigger: {
                trigger: item,
                start: "top 85%",
                toggleActions: "play none none none"
            }
        });
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

    const form = document.getElementById('contact-form');
    const formSubmitText = document.getElementById('form-submit-text');

    if (form) {
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
    }
    
    // ===== Mobile nav: open/close glass sheet =====
    const navToggle = document.querySelector('.nav-toggle');
    const navSheet  = document.getElementById('nav-sheet');
    const navClose  = document.querySelector('.nav-close');

    function openSheet(){
        if (!navSheet) return;
        navSheet.hidden = false;
        document.body.classList.add('nav-locked');
        requestAnimationFrame(()=> navSheet.classList.add('open'));
    }

    function closeSheet(){
        if (!navSheet) return;
        navSheet.classList.remove('open');
        navSheet.addEventListener('transitionend', ()=>{
                navSheet.hidden = true;
                document.body.classList.remove('nav-locked');
        }, { once: true });
    }

    navToggle?.addEventListener('click', (e)=>{
        e.stopPropagation();
        (navSheet?.hidden ?? true) ? openSheet() : closeSheet();
    });

    navClose?.addEventListener('click', (e)=>{ e.stopPropagation(); closeSheet(); });

    // click outside / Esc to close
    document.addEventListener('click', (e)=>{
        if (!navSheet || navSheet.hidden) return;
        if (!navSheet.contains(e.target) && !navToggle.contains(e.target)) closeSheet();
    });

    document.addEventListener('keydown', (e)=>{
        if (e.key === 'Escape' && navSheet && !navSheet.hidden) closeSheet();
    });
});