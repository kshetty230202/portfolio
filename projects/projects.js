// projects.js — continuous responsive fit (any device/resize), dynamic projects,
// clickable titles, centered first slide, one pinned slide, subtle dark overlay,
// rolling-text nav, no-underline on links.

////////////////////  NAV: rolling text (same as Home)  ////////////////////
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".nav-links a.rolling-text").forEach((el) => {
        if (el.querySelector(".block")) return; // guard if already processed
        const text = el.textContent;
        el.innerHTML = "";
        const b1 = document.createElement("div"); b1.className = "block";
        const b2 = document.createElement("div"); b2.className = "block";
        for (const ch of text) {
            const s = document.createElement("span");
            s.textContent = ch === " " ? "\xa0" : ch;
            b1.appendChild(s);
            b2.appendChild(s.cloneNode(true));
        }
        el.append(b1, b2);
    });
});

// No underline on project links in any state
const styleNoUnderline = document.createElement("style");
styleNoUnderline.textContent = `
    .project-link,
    .project-link:hover,
    .project-link:focus,
    .project-link:active,
    .project-link:visited { text-decoration: none !important; }
`;
document.head.appendChild(styleNoUnderline);

////////////////////  DATA (edit this to add/remove projects)  ////////////////////
const projects = [
    { title: "Portfolio",         link: "projects/field-unit.html",         src: "../assets/imgs/p1.png" },
    { title: "VPN Detection", link: "projects/astral-convergence.html", src: "../assets/imgs/p2.png" },
    { title: "ML Visualization system",       link: "projects/eclipse-core.html",       src: "../assets/imgs/p3.png" },
    { title: "Hate-speech Detection",           link: "projects/luminous.html",           src: "../assets/imgs/p4.png", pin: true },
    { title: "Serenity",           link: "projects/serenity.html",           src: "../assets/imgs/p5.png" },
    // { title: "Nebula Point",       link: "projects/nebula-point.html",       src: "../assets/imgs/p6.png" },
    // { title: "Horizon",            link: "projects/horizon.html",            src: "../assets/imgs/p7.png" },
];

////////////////////  APP  ////////////////////
window.addEventListener("load", () => {
    // Smooth scroll (Lenis)
    const lenis = new Lenis();
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);

    // Tiny mouse tilt
    let mouseX = 0, mouseY = 0, targetRotX = 0, targetRotY = 0;
    window.addEventListener("mousemove", (e) => {
        const nx = (e.clientX / innerWidth) * 2 - 1;
        const ny = (e.clientY / innerHeight) * 2 - 1;
        mouseX += (nx - mouseX) * 0.15;
        mouseY += (ny - mouseY) * 0.15;
    });

    // Scene constants (plane units)
    const totalSlides  = projects.length;
    const slideHeight  = 10;
    const gap          = 3;
    const parentHeight = totalSlides * (slideHeight + gap) + gap;

    const planeWidth = 20;   // keep plane size fixed; we fit with camera distance
    const curvature  = 35;
    const segX = 200, segY = 200;

    // Pin config (pick item with pin:true)
    const PIN_INDEX = Math.max(projects.findIndex(p => p.pin), -1);
    const PIN_START = 0.86;
    const PIN_TARGET = parentHeight - gap - slideHeight;

    // Baseline offsets (center slides on plane)
    const centerTopY = parentHeight/2 - slideHeight/2;
    const firstTop   = gap;
    const lastTop    = (totalSlides-1)*(slideHeight+gap) + gap;
    const OFFSET_START_PLANE = (centerTopY - firstTop) / parentHeight;
    const OFFSET_END_PLANE   = (centerTopY - lastTop)  / parentHeight;

    let OFFSET_START = OFFSET_START_PLANE;
    let OFFSET_END   = OFFSET_END_PLANE;

    // Desired screen coverage of one slide's height (top->bottom) as a fraction
    const TARGET_COVERAGE = 0.62; // ~62% of viewport height feels like the reference

    // We'll compute these per-viewport
    let cornerRadius = 30;   // rounded corners adapt smoothly with viewport
    const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
    const map = (x, a, b, c, d) => c + (d - c) * ((x - a) / (b - a));

    // Three.js globals
    let scene, camera, renderer, parentGeometry, parentMesh, textureCanvas, ctx, texture;
    let curProgress = 0, curOffsetNorm = OFFSET_START;

    // DOM overlay for titles
    const textOverlay = document.createElement("div");
    textOverlay.style.cssText = `
        position:fixed; inset:0; z-index:2; pointer-events:none;
        font-family:'Inter',system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
    `;
    document.body.appendChild(textOverlay);
    const textElements = [];

    // Load images
    const images = new Array(totalSlides);
    function loadAllImages() {
        return Promise.all(projects.map((p, i) => new Promise((resolve) => {
        const img = new Image();
        img.onload = () => { images[i] = img; resolve(); };
        img.onerror = () => { images[i] = null; resolve(); };
        img.src = p.src;
        })));
      }

    function init() {
        // Three.js scene
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(45, innerWidth/innerHeight, 0.1, 1000);
        renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector(".slider-wrapper canvas"),
        antialias: true, alpha: true
        });
        renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
        renderer.setSize(innerWidth, innerHeight);

        textureCanvas = document.createElement("canvas");
        textureCanvas.width = 2048; textureCanvas.height = 8192;
        ctx = textureCanvas.getContext("2d", { alpha:false });
        ctx.imageSmoothingQuality = "high";
        texture = new THREE.CanvasTexture(textureCanvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        parentGeometry = new THREE.PlaneGeometry(planeWidth, parentHeight, segX, segY);
        const pos = parentGeometry.attributes.position;
        for (let i=0;i<pos.count;i++){
            const y = pos.getY(i);
            const t = Math.abs(y/(parentHeight/2));
            pos.setZ(i, Math.pow(t,2)*curvature);
        }
        const parentMaterial = new THREE.MeshBasicMaterial({ map:texture, transparent:true });
        const baseRotX = THREE.MathUtils.degToRad(-20);
        const baseRotY = THREE.MathUtils.degToRad(20);
        parentMesh = new THREE.Mesh(parentGeometry, parentMaterial);
        parentMesh.rotation.set(baseRotX, baseRotY, 0);
        scene.add(parentMesh);

        // --- Fit camera continuously to any viewport (no desktop change unless window is small) ---
        applyResponsiveCameraFit(baseRotY);

        // Render once so matrices are valid
        renderer.render(scene, camera);
        scene.updateMatrixWorld(true);

        // Solve offset so slide #1 is centered on screen (not only plane)
        const solvedStart = solveOffsetForScreenCenter(0, OFFSET_START_PLANE);
        const delta = solvedStart - OFFSET_START_PLANE;
        OFFSET_START = OFFSET_START_PLANE + delta;
        OFFSET_END   = OFFSET_END_PLANE   + delta;

        // Build titles (clickable <a>)
        for (let i = 0; i < totalSlides; i++) {
            const el = document.createElement("div");
            el.style.cssText = `
                position:absolute; left:50%; top:50%;
                transform: translate(-50%,-50%);
                text-align:center; color:#fff; opacity:0;
                text-shadow: 0 1px 2px rgba(0,0,0,.6), 0 6px 18px rgba(0,0,0,.45);
                will-change: transform, opacity;
                pointer-events: none;
            `;
            const link = document.createElement("a");
            link.className = "project-link";
            link.href = projects[i].link || "#";
            link.target = "_self";
            link.setAttribute("aria-label", `${projects[i].title} — view project`);
            link.style.cssText = `
                all: unset; cursor: pointer; pointer-events: auto;
                display: inline-block; color: inherit; text-decoration: none;
            `;

            const h2 = document.createElement("h2");
            h2.className = "project-title";
            h2.textContent = projects[i].title || `Slide ${i+1}`;
            h2.style.cssText = `
                margin:0; font-weight:700; letter-spacing:-.02em; line-height:.88;
                font-size: clamp(2.6rem, 7.2vw, 6.5rem);
            `;
            const num = document.createElement("span");
            num.className = "project-index";
            num.textContent = String(i+1).padStart(2,"0");
            num.style.cssText = `display:block;margin-top:1rem;opacity:.55;font-size:clamp(.95rem,1.9vw,1.3rem);`;

            link.appendChild(h2); link.appendChild(num);
            el.appendChild(link);
            textOverlay.appendChild(el);
            textElements.push(el);
        }

        // First paint
        curOffsetNorm = OFFSET_START;
        updateTexture(curOffsetNorm, 0);
        updateTitles(curOffsetNorm, 0);
        renderer.render(scene, camera);

        // Scroll
        lenis.on("scroll", ({ progress }) => {
            curProgress   = progress;
            curOffsetNorm = lerp(OFFSET_START, OFFSET_END, progress);
            updateTexture(curOffsetNorm, progress);
            updateTitles(curOffsetNorm, progress);
        });

        // Resize
        addEventListener("resize", onResize);

        // RAF
        function animate(){
            requestAnimationFrame(animate);
            const baseX = THREE.MathUtils.degToRad(-20);
            const baseY = THREE.MathUtils.degToRad(20);
            targetRotX += ((baseX + mouseY*0.08) - targetRotX) * 0.08;
            targetRotY += ((baseY + mouseX*0.08) - targetRotY) * 0.08;
            parentMesh.rotation.x = targetRotX;
            parentMesh.rotation.y = targetRotY;
            renderer.render(scene, camera);
        }
        animate();

        function onResize(){
            camera.aspect = innerWidth/innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(innerWidth, innerHeight);

            applyResponsiveCameraFit(baseRotY); // recompute fit for ANY viewport size
            renderer.render(scene, camera);
            scene.updateMatrixWorld(true);

            const solvedStart = solveOffsetForScreenCenter(0, OFFSET_START);
            const d = solvedStart - OFFSET_START;
            OFFSET_START += d; OFFSET_END += d;

            curOffsetNorm = lerp(OFFSET_START, OFFSET_END, curProgress);
            updateTexture(curOffsetNorm, curProgress);
            updateTitles(curOffsetNorm, curProgress);
        }
    }

    // ---------------- Helpers ----------------
    const lerp = (a,b,t)=>a+(b-a)*t;

    function yToZ(y){
        const t = Math.abs(y/(parentHeight/2));
        return Math.pow(t,2)*curvature;
    }

    function worldToScreen(v3){
        const v = v3.clone().applyMatrix4(parentMesh.matrixWorld).project(camera);
        return { x:(v.x*0.5+0.5)*innerWidth, y:(-v.y*0.5+0.5)*innerHeight };
    }

    function slideYTop(i, offsetNorm, progress){
        let y = i*(slideHeight+gap) + gap + offsetNorm*parentHeight;
        if (PIN_INDEX >= 0 && i===PIN_INDEX && progress>=PIN_START) y = PIN_TARGET; // pin if defined
        return y;
    }

    function slideCenterScreenY(i, offsetNorm){
        const yTop = slideYTop(i, offsetNorm, 0);
        const yCenterLocal = parentHeight/2 - (yTop + slideHeight/2);
        const p = worldToScreen(new THREE.Vector3(0, yCenterLocal, yToZ(yCenterLocal)));
        return p.y;
    }

    function solveOffsetForScreenCenter(i, guess){
        let o = guess;
        for (let k=0;k<8;k++){
            const y  = slideCenterScreenY(i, o);
            const y2 = slideCenterScreenY(i, o + 0.001);
            const d  = (y2 - y) / 0.001 || 1;
            o += (innerHeight/2 - y) / d;
        }
        const min = OFFSET_END_PLANE - 0.2, max = OFFSET_START_PLANE + 0.2;
        return Math.max(min, Math.min(max, o));
    }

    // ---- Continuous responsive camera fit ----
    // Find a camera distance so one slide's height projects to TARGET_COVERAGE of the screen.
    function applyResponsiveCameraFit(baseRotY){
        // Smoothly adapt corner radius by the smaller screen dimension (18..30px)
        const minDim = Math.min(innerWidth, innerHeight);
        cornerRadius = Math.round(clamp(map(minDim, 360, 1440, 18, 30), 18, 30));

        // Binary search distance (monotonic: farther => smaller on screen)
        const measureCoverageAt = (dist) => {
            const prev = camera.position.clone();
            camera.position.set(dist * Math.sin(baseRotY), 5, dist * Math.cos(baseRotY));
            camera.lookAt(0, -2, 0);
            camera.updateMatrixWorld(true);
            scene.updateMatrixWorld(true);

            const yTopLocal =  slideHeight/2;
            const yBotLocal = -slideHeight/2;
            const top = worldToScreen(new THREE.Vector3(0, yTopLocal, yToZ(yTopLocal)));
            const bot = worldToScreen(new THREE.Vector3(0, yBotLocal, yToZ(yBotLocal)));
            const cov = Math.abs(top.y - bot.y) / innerHeight;

            // restore (not strictly necessary since we'll set a final value right after)
            camera.position.copy(prev);
            camera.lookAt(0, -2, 0);
            camera.updateMatrixWorld(true);
            return cov;
        };

        // Start around your desktop baseline; widen bounds to be safe for phones/ultrawides
        let lo = 12, hi = 40, best = 17.5;
        for (let i=0;i<16;i++){
            const mid = (lo + hi) / 2;
            const cov = measureCoverageAt(mid);
            best = mid;
            if (cov > TARGET_COVERAGE) lo = mid; else hi = mid; // too big on screen => increase distance
        }

        // Apply final camera position
        camera.position.set(best * Math.sin(baseRotY), 5, best * Math.cos(baseRotY));
        camera.lookAt(0, -2, 0);
        camera.rotation.z = THREE.MathUtils.degToRad(-5);
        camera.updateMatrixWorld(true);
    }

    // ---- Draw images into texture (corners adapt smoothly) ----
    function updateTexture(offsetNorm, progress){
        ctx.fillStyle="#000"; ctx.fillRect(0,0,textureCanvas.width,textureCanvas.height);

        for (let i=0;i<totalSlides;i++){
            const yTop = slideYTop(i, offsetNorm, progress);
            const textureY = (yTop/parentHeight)*textureCanvas.height;

            const rect = {
                x: textureCanvas.width*0.1,
                y: textureY,
                width: textureCanvas.width*0.8,
                height: (slideHeight/parentHeight)*textureCanvas.height
            };

            const img = images[i];
            if (!img) continue;

            // object-fit: cover
            const imgAspect = img.width/img.height;
            const rectAspect = rect.width/rect.height;
            let dw, dh, dx, dy;
            if (imgAspect > rectAspect){
                dh = rect.height; dw = dh*imgAspect; dx = rect.x + (rect.width-dw)/2; dy = rect.y;
            } else {
                dw = rect.width;  dh = dw/imgAspect; dx = rect.x; dy = rect.y + (rect.height-dh)/2;
            }

            ctx.save();
            const r = cornerRadius; // 18..30 depending on viewport; desktop stays ~30
            if (ctx.roundRect){ ctx.beginPath(); ctx.roundRect(rect.x, rect.y, rect.width, rect.height, r); ctx.clip(); }
            else { ctx.beginPath(); ctx.rect(rect.x, rect.y, rect.width, rect.height); ctx.clip(); }
            ctx.drawImage(img, dx, dy, dw, dh);

            // darken for text contrast
            ctx.globalCompositeOperation = "source-over";
            ctx.fillStyle = "rgba(0,0,0,0.35)";
            ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
            ctx.restore();
        }
        texture.needsUpdate = true;
    }

  // Position titles over their images
    function updateTitles(offsetNorm, progress){
        for (let i=0;i<textElements.length;i++){
            const yTop = slideYTop(i, offsetNorm, progress);
            const yCenterLocal = parentHeight/2 - (yTop + slideHeight/2);
            const p = worldToScreen(new THREE.Vector3(0, yCenterLocal, yToZ(yCenterLocal)));
            const el = textElements[i];
            el.style.left = `${p.x}px`;
            el.style.top  = `${p.y}px`;
            el.style.opacity = (p.y > -120 && p.y < innerHeight + 120) ? 1 : 0;
        }
    }

    // Boot
    loadAllImages().then(init);
});
