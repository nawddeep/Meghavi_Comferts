// --- Carousel Drag/Touch Interactivity ---
let isDesignDragging = false;
let designDragStartX = 0;
let designDragStartOffset = 0;
let designDragLastX = 0;
let designDragLastTime = 0;


function onDesignPointerDown(e) {
  if (!designCarousel3d) return;
  isDesignDragging = true;
  designDragStartX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
  designDragLastX = designDragStartX;
  designDragStartOffset = designCarousel3dOffset;
  designDragLastTime = performance.now();
  designCarousel3d.style.transition = 'none';
  window.addEventListener('pointermove', onDesignPointerMove);
  window.addEventListener('pointerup', onDesignPointerUp);
  window.addEventListener('touchmove', onDesignPointerMove, { passive: false });
  window.addEventListener('touchend', onDesignPointerUp);
}

function onDesignPointerMove(e) {
  if (!isDesignDragging) return;
  let clientX;
  if (e.type.startsWith('touch')) {
    clientX = e.touches[0]?.clientX ?? designDragLastX;
  } else {
    clientX = e.clientX;
  }
  const dx = clientX - designDragLastX;
  designDragLastX = clientX;
  const now = performance.now();
  const dt = now - designDragLastTime;
  designDragLastTime = now;
  designCarousel3dOffset -= dx;
  wrapDesignOffset();
  applydesignCarousel3dOffset();
  if (e.cancelable) e.preventDefault();
}

function onDesignPointerUp(e) {
  if (!isDesignDragging) return;
  isDesignDragging = false;
  designCarousel3d.style.transition = '';
  // Snap to nearest image
  const slideWidth = designCarousel3d.querySelector('.section-design__frame')?.offsetWidth || 220;
  const gap = parseFloat(getComputedStyle(designCarousel3d).gap) || 16;
  const moveBy = slideWidth + gap;
  let snapIndex = Math.round(designCarousel3dOffset / moveBy);
  let targetOffset = snapIndex * moveBy;
  // Wrap
  if (targetOffset < 0) targetOffset += designCarousel3dHalfWidth;
  if (targetOffset >= designCarousel3dHalfWidth) targetOffset -= designCarousel3dHalfWidth;
  animatedesignCarousel3dTo(targetOffset);
  window.removeEventListener('pointermove', onDesignPointerMove);
  window.removeEventListener('pointerup', onDesignPointerUp);
  window.removeEventListener('touchmove', onDesignPointerMove);
  window.removeEventListener('touchend', onDesignPointerUp);
}

function animatedesignCarousel3dTo(targetOffset) {
  const startOffset = designCarousel3dOffset;
  const duration = 420;
  const startTime = performance.now();
  function animate(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    designCarousel3dOffset = startOffset + (targetOffset - startOffset) * ease;
    wrapDesignOffset();
    applydesignCarousel3dOffset();
    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      designCarousel3dOffset = targetOffset;
      wrapDesignOffset();
      applydesignCarousel3dOffset();
    }
  }
  requestAnimationFrame(animate);
}
const BASE_SCENE_WIDTH = 2509;
const BASE_SCENE_HEIGHT = 654;
const SCENE_LOOP_OFFSET = 2180;
const AUTO_TRAVEL_DURATION_MS = 42000;
// Foreground should move exactly with the background (no parallax) so use a
// 1:1 shift ratio. This ensures the indiv SVG stays perfectly aligned over the bg.
const FOREGROUND_SHIFT_RATIO = 1.0;
const FOREGROUND_LOOP_OFFSET = SCENE_LOOP_OFFSET * FOREGROUND_SHIFT_RATIO;
// Multiplier to scale the hero scene. Values < 1.0 make the scene smaller (1.0 = no scale change).
// Lowered to make the hero composition smaller.
// Reduce this value to make the scene appear smaller on screen.
const HERO_ZOOM = 0.6;
const DRAG_TRAVEL_MULTIPLIER = 1.15;
const SCENE_RESUME_SETTLE_MS = 140;
const SCENE_DRAG_THRESHOLD_PX = 10;
const SCENE_CLICK_SUPPRESS_MS = 350;
const MOBILE_FOREGROUND_LOOP_REVEAL_TRAVEL_PX = 120;

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)");

const sceneScreen = document.getElementById("sceneScreen");
const stage = document.getElementById("sceneStage");
const panorama = document.getElementById("scenePanorama");
const foreground = document.getElementById("sceneForeground");
const sceneStatus = document.getElementById("sceneStatus");
const siteHeader = document.querySelector(".site-header");
const siteHeaderToggle = document.getElementById("siteHeaderToggle");
const primaryNavigation = document.getElementById("primaryNavigation");

const panoramaLoopClone = createSceneLoopClone(panorama, "scene-panorama--loop");
// Ensure the foreground overlay is cloned as well so it repeats with the panorama
// This keeps the `wdcoverlay.svg` visible across the entire looping scene
const foregroundLoopClone = createSceneLoopClone(foreground, "scene-foreground--loop");

const hotspotButtons = Array.from(
  document.querySelectorAll(".scene-foreground .hero-link-hotspot"),
);
const deferredHeroOverlayImages = Array.from(
  document.querySelectorAll("[data-hero-overlay-src]"),
);
const scrollLinks = Array.from(document.querySelectorAll("[data-scroll-link]"));
const sections = Array.from(document.querySelectorAll("[data-section]"));
const revealNodes = Array.from(document.querySelectorAll("[data-reveal]"));
const designPrev = document.getElementById("designPrev");
const designNext = document.getElementById("designNext");
const designCarousel3d = document.getElementById("designCarousel3d");
const designSection = document.getElementById("design-section");
const designMobileCarousel = document.getElementById("design-mobile-carousel");
const designCarouselDots = document.getElementById("design-carousel-dots");

const designStudioImages = [
  { src: "./assets/design-studio/13.jpg", alt: "Design Studio floral installation detail" },
  { src: "./assets/design-studio/14.jpg", alt: "Design Studio decor moodboard setup" },
  // { src: "./assets/design-studio/15.jpeg", alt: "Design Studio styling concept preview" },
  { src: "./assets/design-studio/16.jpg", alt: "Design Studio event styling mockup" },
  { src: "./assets/design-studio/17.jpg", alt: "Design Studio floral workshop scene" },
  { src: "./assets/design-studio/19.jpg", alt: "Design Studio installation planning detail" },
  { src: "./assets/design-studio/7.jpg", alt: "Design Studio installation mockup" },
  { src: "./assets/design-studio/20.JPG", alt: "Design Studio visual concept board" },
  { src: "./assets/design-studio/8.jpg", alt: "Design Studio floral build" },
  { src: "./assets/design-studio/23.jpeg", alt: "Design Studio ceremony installation" },
  { src: "./assets/design-studio/22.jpg", alt: "Design Studio centerpiece detail" },
  { src: "./assets/design-studio/4.jpg", alt: "Design Studio tablescape concept" },
  { src: "./assets/design-studio/5.jpg", alt: "Design Studio decor styling sample" },
  { src: "./assets/design-studio/6.jpg", alt: "Design Studio fabric and floral arrangement" },
  { src: "./assets/design-studio/1.jpg", alt: "Design Studio venue styling board" },
  { src: "./assets/design-studio/9.jpg", alt: "Design Studio stage composition" },
  { src: "./assets/design-studio/3.jpg", alt: "Design Studio event environment study" },
  { src: "./assets/design-studio/2.jpg", alt: "Design Studio lighting and floral test" },
];

const DESIGN_3D_AUTO_ADVANCE_MS = 3000;
const DESIGN_AUTO_SCROLL_PX_PER_SEC = 46;
const DESIGN_SCROLL_NUDGE_MULTIPLIER = 6;

// --- 3D Carousel Logic ---
let design3dIndex = 0;
let design3dNodes = [];
let is3dAnimating = false;
let hasInitializedDesignCarousel = false;
let hasLoadedDeferredHeroOverlays = false;
let baraatMobileRepaintTimer = null;
let foregroundLoopReadyTimer = null;
let foregroundLoopRevealQueued = false;

function renderDesignMobileCarousel() {
  if (!designMobileCarousel || !designCarouselDots || !designStudioImages.length) return;

  designMobileCarousel.innerHTML = "";
  designCarouselDots.innerHTML = "";

  /* Phones get the 640px-wide rendition of each photograph (~95KB rather than
     ~650KB); the cards are never wider than that. */
  const mobileSrc = (src) => src.replace(/\/design-studio\//, "/design-studio/640w/");

  const pending = [];

  designStudioImages.forEach((imageData, index) => {
    const card = document.createElement("div");
    card.className = "design-mobile-card";

    const img = document.createElement("img");
    img.alt = imageData.alt;
    img.loading = "lazy";
    img.decoding = "async";

    /* `loading="lazy"` alone is unreliable inside a horizontal scroller —
       browsers treat the whole strip as near-viewport and fetch every frame.
       Hold the URL back and attach it as each card actually approaches. */
    if (index < 2) {
      img.src = mobileSrc(imageData.src);
    } else {
      img.dataset.src = mobileSrc(imageData.src);
      pending.push(img);
    }

    card.appendChild(img);
    designMobileCarousel.appendChild(card);

    const dot = document.createElement("span");
    dot.className = `carousel-dot${index === 0 ? " active" : ""}`;
    designCarouselDots.appendChild(dot);
  });

  if (!pending.length) return;

  if (!("IntersectionObserver" in window)) {
    pending.forEach((img) => { img.src = img.dataset.src; });
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          delete img.dataset.src;
        }
        io.unobserve(img);
      });
    },
    { root: designMobileCarousel, rootMargin: "200px 400px" }
  );

  pending.forEach((img) => io.observe(img));
}

function loadDeferredHeroOverlays() {
  if (hasLoadedDeferredHeroOverlays || !deferredHeroOverlayImages.length) return;
  hasLoadedDeferredHeroOverlays = true;

  deferredHeroOverlayImages.forEach((image) => {
    const src = image.dataset.heroOverlaySrc;
    if (!src || image.getAttribute("src")) return;
    image.src = src;
  });
}

function scheduleDeferredHeroOverlayLoad() {
  if (!deferredHeroOverlayImages.length) return;

  const loadWhenIdle = () => {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(loadDeferredHeroOverlays, { timeout: 2000 });
    } else {
      window.setTimeout(loadDeferredHeroOverlays, 1200);
    }
  };

  if (document.readyState === "complete") {
    loadWhenIdle();
    return;
  }

  window.addEventListener("load", loadWhenIdle, { once: true });
}

function setForegroundLoopReadyState(isReady) {
  if (!sceneScreen || !foregroundLoopClone) return;
  sceneScreen.classList.toggle("is-foreground-loop-ready", isReady);
}

function scheduleForegroundLoopReady() {
  if (!sceneScreen || !foregroundLoopClone) return;

  const panoramaImgEl = panorama?.querySelector(".scene-panorama__bg");
  const baraatImgEl = foreground?.querySelector(".scene-foreground__img--baraat");
  const imagesReady = Boolean(panoramaImgEl?.complete && baraatImgEl?.complete);
  const isCompactScreen = window.matchMedia("(max-width: 820px)").matches;
  const travelReady = !isCompactScreen || currentTravel >= MOBILE_FOREGROUND_LOOP_REVEAL_TRAVEL_PX;

  window.clearTimeout(foregroundLoopReadyTimer);

  if (!imagesReady) {
    if (panoramaImgEl && !panoramaImgEl.complete && !panoramaImgEl.dataset.loopReadyBound) {
      panoramaImgEl.dataset.loopReadyBound = "true";
      panoramaImgEl.addEventListener("load", scheduleForegroundLoopReady, { once: true });
    }
    if (baraatImgEl && !baraatImgEl.complete && !baraatImgEl.dataset.loopReadyBound) {
      baraatImgEl.dataset.loopReadyBound = "true";
      baraatImgEl.addEventListener("load", scheduleForegroundLoopReady, { once: true });
    }
    setForegroundLoopReadyState(false);
    return;
  }

  if (!travelReady) {
    setForegroundLoopReadyState(false);
    return;
  }

  foregroundLoopReadyTimer = window.setTimeout(() => {
    foregroundLoopReadyTimer = null;
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setForegroundLoopReadyState(true);
        foregroundLoopRevealQueued = false;
      });
    });
  }, 60);
}

function maybeRevealForegroundLoopDuringTravel() {
  if (!sceneScreen || !foregroundLoopClone) return;
  if (sceneScreen.classList.contains("is-foreground-loop-ready")) return;
  if (foregroundLoopRevealQueued) return;
  if (!window.matchMedia("(max-width: 820px)").matches) return;
  if (currentTravel < MOBILE_FOREGROUND_LOOP_REVEAL_TRAVEL_PX) return;

  foregroundLoopRevealQueued = true;
  scheduleForegroundLoopReady();
}

function forceMobileBaraatRepaint() {
  const isCompactScreen = window.matchMedia("(max-width: 820px)").matches;
  if (!isCompactScreen) return;

  const baraatEls = document.querySelectorAll(".scene-foreground__img--baraat");
  if (!baraatEls.length) return;

  baraatEls.forEach((el) => {
    if (!el.complete) {
      el.addEventListener("load", () => scheduleMobileBaraatRepaint(0), { once: true });
      return;
    }

    el.style.visibility = "hidden";
    void el.offsetHeight;

    window.requestAnimationFrame(() => {
      el.style.visibility = "visible";
      el.style.opacity = "0.999";
      el.style.transform = "none";

      window.requestAnimationFrame(() => {
        el.style.opacity = "";
      });
    });
  });
}

function scheduleMobileBaraatRepaint(delay = 80) {
  window.clearTimeout(baraatMobileRepaintTimer);
  baraatMobileRepaintTimer = window.setTimeout(() => {
    baraatMobileRepaintTimer = null;
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        forceMobileBaraatRepaint();
      });
    });
  }, delay);
}

function renderDesignCarousel3d() {
  if (!designCarousel3d || !designStudioImages.length) return;
  const total = designStudioImages.length;
  const leftIdx = (design3dIndex - 1 + total) % total;
  const centerIdx = design3dIndex;
  const rightIdx = (design3dIndex + 1) % total;
  const desired = [leftIdx, centerIdx, rightIdx];
  const roles = ['left', 'center', 'right'];

  if (design3dNodes.length === 0) {
    desired.forEach((imgIndex, i) => {
      const container = document.createElement('div');
      container.className = 'carousel3d-slide ' + roles[i];
      container.setAttribute('data-role', roles[i]);

      const img = document.createElement('img');
      img.className = 'carousel3d-img';
      img.decoding = 'async';
      img.loading = 'eager';
      img.draggable = false;
      const imgData = designStudioImages[imgIndex];
      img.src = imgData.preloaded ? imgData.preloaded.src : imgData.src;
      img.alt = imgData.alt;

      container.appendChild(img);
      container.classList.toggle('is-portrait', Boolean(imgData.isPortrait));
      container.classList.toggle('is-landscape', !imgData.isPortrait);

      container.addEventListener('click', () => {
        const role = container.getAttribute('data-role');
        if (role === 'left') moveDesign3d(-1);
        else moveDesign3d(1);
      });

      designCarousel3d.appendChild(container);
      design3dNodes.push(container);
    });
  } else {
    design3dNodes.forEach((container, i) => {
      const img = container.querySelector('img');
      const imgIndex = desired[i];
      const imgData = designStudioImages[imgIndex];
      img.src = imgData.preloaded ? imgData.preloaded.src : imgData.src;
      img.alt = imgData.alt;
      container.className = 'carousel3d-slide ' + roles[i];
      container.classList.toggle('is-portrait', Boolean(imgData.isPortrait));
      container.classList.toggle('is-landscape', !imgData.isPortrait);
      container.setAttribute('data-role', roles[i]);
    });
  }
}

function preloadDesignStudioImages() {
  designStudioImages.forEach((imageData) => {
    if (imageData.preloaded) return;
    const preloaded = new Image();
    preloaded.decoding = 'async';
    preloaded.loading = 'eager';
    preloaded.src = imageData.src;
    preloaded.alt = imageData.alt;
    preloaded.addEventListener('load', () => {
      imageData.isPortrait = preloaded.naturalHeight > preloaded.naturalWidth;
      renderDesignCarousel3d();
    }, { once: true });
    imageData.preloaded = preloaded;
  });
}

function initDesignCarousel3d() {
  if (hasInitializedDesignCarousel || !designCarousel3d) return;
  hasInitializedDesignCarousel = true;
  preloadDesignStudioImages();
  renderDesignCarousel3d();
  syncdesignCarousel3dMetrics();
  startDesign3dAutoAdvance();
}

function scheduleDesignCarousel3dInit() {
  if (!designCarousel3d) return;

  if (!("IntersectionObserver" in window) || !designSection) {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(() => initDesignCarousel3d(), { timeout: 1500 });
    } else {
      window.setTimeout(initDesignCarousel3d, 1200);
    }
    return;
  }

  const designInitObserver = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      initDesignCarousel3d();
      designInitObserver.disconnect();
    },
    {
      rootMargin: "300px 0px",
      threshold: 0.01,
    },
  );

  designInitObserver.observe(designSection);
}

function startDesign3dAutoAdvance() {
  if (
    !hasInitializedDesignCarousel ||
    prefersReducedMotion.matches ||
    design3dAutoActive ||
    designStudioImages.length <= 1
  ) return;
  design3dAutoActive = true;
  design3dAutoElapsed = 0;
  // Initialize timer to current time to avoid large jump on first tick
  lastDesignAnimationTime = performance.now();
}

function stopDesign3dAutoAdvance() {
  if (!design3dAutoActive) return;
  design3dAutoActive = false;
  design3dAutoElapsed = 0;
}

function resetDesign3dAutoAdvance() {
  stopDesign3dAutoAdvance();
  startDesign3dAutoAdvance();
}

function moveDesign3d(direction) {
  if (is3dAnimating) return;
  const total = designStudioImages.length;
  if (!designCarousel3d || design3dNodes.length < 3) {
    // fallback
    design3dIndex = (design3dIndex + direction + total) % total;
    renderDesignCarousel3d();
    return;
  }
  // Create a temporary incoming slide so the new image can animate in from
  // the correct side (left or right) instead of teleporting into place.
  is3dAnimating = true;
  const newIndex = (design3dIndex + direction + total) % total;

  const leftNode = design3dNodes[0];
  const centerNode = design3dNodes[1];
  const rightNode = design3dNodes[2];

  // Helper to create a slide element for a given image data and initial class
  function createTempSlide(imgData, initialClass, startTransform) {
    const container = document.createElement('div');
    container.className = 'carousel3d-slide ' + initialClass;
    container.setAttribute('data-role', initialClass);

    const img = document.createElement('img');
    img.className = 'carousel3d-img';
    img.decoding = 'async';
    img.loading = 'eager';
    img.draggable = false;
    img.src = imgData.preloaded ? imgData.preloaded.src : imgData.src;
    img.alt = imgData.alt;

    container.appendChild(img);

    // Mirror click behaviour of the persistent slides
    container.addEventListener('click', () => {
      const role = container.getAttribute('data-role');
      if (role === 'left') moveDesign3d(-1);
      else moveDesign3d(1);
    });

    // Position the incoming slide offscreen using an inline transform so we can
    // animate it into its target CSS transform when we clear the inline style.
    if (startTransform) container.style.transform = startTransform;

    return container;
  }

  if (direction === 1) {
    // Moving forward: incoming slide should appear from the right
    const newRightIndex = (newIndex + 1) % total;
    const nextImgData = designStudioImages[newRightIndex];

    // start far to the right so it animates into the "right" slot
    const startTransform = 'translate(-50%, -50%) rotateY(-45deg) translateZ(-350px) translateX(900px) scale(0.8)';
    const temp = createTempSlide(nextImgData, 'right', startTransform);
    designCarousel3d.appendChild(temp);

    // Force layout so the start transform applies, then trigger the simultaneous
    // animations: center->left, right->center, temp(farRight)->right
    void temp.offsetWidth;
    requestAnimationFrame(() => {
      centerNode.className = 'carousel3d-slide left';
      rightNode.className = 'carousel3d-slide center';
      // clearing inline transform lets the stylesheet 'right' transform take effect
      temp.style.transform = '';
    });

    function onTransitionEnd(e) {
      if (e.propertyName !== 'transform') return;
      designCarousel3d.removeEventListener('transitionend', onTransitionEnd);

      // Remove the old left node and keep the new set [center, right, temp]
      if (leftNode && leftNode.parentNode) leftNode.parentNode.removeChild(leftNode);
      design3dNodes = [centerNode, rightNode, temp];

      design3dIndex = newIndex;
      const roles = ['left', 'center', 'right'];
      design3dNodes.forEach((node, i) => {
        node.className = 'carousel3d-slide ' + roles[i];
        node.setAttribute('data-role', roles[i]);
      });

      is3dAnimating = false;
    }

    designCarousel3d.addEventListener('transitionend', onTransitionEnd);
  } else {
    // Moving backward: incoming slide should appear from the left
    const newLeftIndex = (newIndex - 1 + total) % total;
    const prevImgData = designStudioImages[newLeftIndex];

    const startTransform = 'translate(-50%, -50%) rotateY(45deg) translateZ(-350px) translateX(-900px) scale(0.8)';
    const temp = createTempSlide(prevImgData, 'left', startTransform);
    designCarousel3d.appendChild(temp);

    void temp.offsetWidth;
    requestAnimationFrame(() => {
      centerNode.className = 'carousel3d-slide right';
      leftNode.className = 'carousel3d-slide center';
      temp.style.transform = '';
    });

    function onTransitionEnd(e) {
      if (e.propertyName !== 'transform') return;
      designCarousel3d.removeEventListener('transitionend', onTransitionEnd);

      // Remove the old right node and keep [temp, leftNode, centerNode]
      if (rightNode && rightNode.parentNode) rightNode.parentNode.removeChild(rightNode);
      design3dNodes = [temp, leftNode, centerNode];

      design3dIndex = newIndex;
      const roles = ['left', 'center', 'right'];
      design3dNodes.forEach((node, i) => {
        node.className = 'carousel3d-slide ' + roles[i];
        node.setAttribute('data-role', roles[i]);
      });

      is3dAnimating = false;
    }

    designCarousel3d.addEventListener('transitionend', onTransitionEnd);
  }
}

// Drag/touch for 3D carousel
let is3dDragging = false;
let drag3dStartX = 0;
let drag3dAccum = 0;
function on3dPointerDown(e) {
  stopDesign3dAutoAdvance();
  is3dDragging = true;
  drag3dStartX = e.type && e.type.startsWith && e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
  drag3dAccum = 0;
  window.addEventListener('pointermove', on3dPointerMove);
  window.addEventListener('pointerup', on3dPointerUp);
  window.addEventListener('touchmove', on3dPointerMove, { passive: false });
  window.addEventListener('touchend', on3dPointerUp);
}
function on3dPointerMove(e) {
  if (!is3dDragging) return;
  let clientX = e.type && e.type.startsWith && e.type.startsWith('touch') ? e.touches[0]?.clientX : e.clientX;
  if (clientX == null) return;
  drag3dAccum = clientX - drag3dStartX;
  if (Math.abs(drag3dAccum) > 48) {
    moveDesign3d(drag3dAccum < 0 ? 1 : -1);
    is3dDragging = false;
    window.removeEventListener('pointermove', on3dPointerMove);
    window.removeEventListener('pointerup', on3dPointerUp);
    window.removeEventListener('touchmove', on3dPointerMove);
    window.removeEventListener('touchend', on3dPointerUp);
  }
  if (e.cancelable) e.preventDefault();
}
function on3dPointerUp(e) {
  is3dDragging = false;
  window.removeEventListener('pointermove', on3dPointerMove);
  window.removeEventListener('pointerup', on3dPointerUp);
  window.removeEventListener('touchmove', on3dPointerMove);
  window.removeEventListener('touchend', on3dPointerUp);
  startDesign3dAutoAdvance();
}

let sceneScale = 1;
let maxBackgroundShift = 0;
let currentTravel = 0;
let lastAnimationTime = 0;
let isPaused = false;
let sceneInView = true;
let activePointerId = null;
let pendingPointerId = null;
let lastPointerX = 0;
let pointerStartX = 0;
let pointerStartY = 0;
let suppressSceneClickUntil = 0;
// Start with no active section so nav links aren't highlighted on load
let activeSectionId = null;
let targetSectionTimer = null;
let design3dAutoActive = false;
let design3dAutoElapsed = 0;
let lastInteractionWasKeyboard = false;
let scenePlaybackTimer = null;
let designCarousel3dHalfWidth = 0;
let designCarousel3dOffset = 0;
let lastDesignAnimationTime = 0;

// clamp removed (unused)

function wrapSceneTravel(value) {
  if (maxBackgroundShift <= 0) return 0;

  return ((value % maxBackgroundShift) + maxBackgroundShift) % maxBackgroundShift;
}

function createSceneLoopClone(layer, cloneClass) {
  if (!layer) return null;

  const clone = layer.cloneNode(true);
  clone.removeAttribute("id");
  clone.classList.add(cloneClass);
  clone.setAttribute("aria-hidden", "true");

  clone.querySelectorAll("[id]").forEach((node) => {
    node.removeAttribute("id");
  });

  clone.querySelectorAll("img").forEach((image) => {
    image.alt = "";
    image.setAttribute("aria-hidden", "true");
  });

  clone.querySelectorAll(".scene-hotspot, .hero-link-hotspot").forEach((button) => {
    button.tabIndex = -1;
    button.setAttribute("aria-hidden", "true");
  });

  layer.after(clone);

  // The Baraat parallax offset is now computed dynamically in applyBaraatParallax
  // to ensure a perfectly seamless loop regardless of screen size.
  return clone;
}

function setHeaderMenuState(isOpen) {
  if (!siteHeader || !siteHeaderToggle || !primaryNavigation) return;

  siteHeader.classList.toggle("is-menu-open", isOpen);
  primaryNavigation.classList.toggle("open", isOpen);
  siteHeaderToggle.setAttribute("aria-expanded", String(isOpen));
  siteHeaderToggle.setAttribute(
    "aria-label",
    isOpen ? "Close navigation menu" : "Open navigation menu",
  );
}

function applydesignCarousel3dOffset() {
  if (!designCarousel3d || designCarousel3dHalfWidth <= 0) return;

  designCarousel3d.style.transform = `translate3d(${-designCarousel3dOffset.toFixed(2)}px, 0, 0)`;
}

function wrapDesignOffset() {
  if (designCarousel3dHalfWidth <= 0) {
    designCarousel3dOffset = 0;
    return;
  }

  designCarousel3dOffset =
    ((designCarousel3dOffset % designCarousel3dHalfWidth) + designCarousel3dHalfWidth) % designCarousel3dHalfWidth;
}

function syncdesignCarousel3dMetrics() {
  if (!designCarousel3d) return;

  designCarousel3dHalfWidth = designCarousel3d.scrollWidth / 2;
  wrapDesignOffset();
  applydesignCarousel3dOffset();
}

// legacy carousel helpers removed (unused)

function renderPauseState() {
  if (!sceneScreen) return;
  sceneScreen.classList.toggle(
    "is-paused",
    prefersReducedMotion.matches || isPaused || activePointerId !== null,
  );
}

function setSceneStatus(label) {
  if (sceneStatus) {
    sceneStatus.textContent = label;
  }

  renderPauseState();
}

function applySceneTravel() {
  if (!sceneScreen) return;
  const backgroundShift = -currentTravel;
  const foregroundShift = backgroundShift * FOREGROUND_SHIFT_RATIO;

  sceneScreen.style.setProperty("--bg-shift", `${backgroundShift.toFixed(2)}px`);
  sceneScreen.style.setProperty("--fg-shift", `${foregroundShift.toFixed(2)}px`);
  // update baraat parallax to move slightly faster than the foreground
  try {
    applyBaraatParallax(backgroundShift);
  } catch (e) {
    // noop
  }
}

// Parallax: move baraat overlay slightly faster than foreground to create depth
const BARAAT_SPEED_MULT = 1.1; // 12% faster than foreground

function applyBaraatParallax(backgroundShift) {
  if (!sceneScreen) return;
  const baraatEls = document.querySelectorAll('.scene-foreground__img--baraat');
  if (!baraatEls || baraatEls.length === 0) return;

  const isCompactScreen = window.matchMedia("(max-width: 820px)").matches;
  if (isCompactScreen) {
    baraatEls.forEach((el) => {
      el.style.transform = "none";
    });
    return;
  }

  const foregroundShift = backgroundShift * FOREGROUND_SHIFT_RATIO;
  // compute only the additional shift to apply on top of the foreground transform
  const extraShift = foregroundShift * (BARAAT_SPEED_MULT - 1);

  const BARAAT_RIGHT_SHIFT = 150; // Base shift for original

  baraatEls.forEach((el) => {
    const total = extraShift + BARAAT_RIGHT_SHIFT;
    el.style.transform = `translateX(${total.toFixed(2)}px)`;
  });
}

function syncCycleStart(now = performance.now()) {
  lastAnimationTime = now;
}

function hasKeyboardFocusInScene() {
  if (!sceneScreen) return false;
  return lastInteractionWasKeyboard && sceneScreen.contains(document.activeElement);
}

function syncScenePlayback(label = "Paused for interaction") {
  if (prefersReducedMotion.matches) {
    setSceneStatus("Motion reduced");
    return;
  }

  if (!sceneInView) {
    isPaused = false;
    setSceneStatus("Scroll to explore");
    return;
  }

  if (activePointerId !== null) {
    pauseScene("Dragging scene");
    return;
  }

  const isHoveringSceneLayer =
    supportsHover.matches &&
    (
      panorama?.matches(":hover") ||
      foreground?.matches(":hover") ||
      panoramaLoopClone?.matches(":hover") ||
      foregroundLoopClone?.matches(":hover")
    );

  if (isHoveringSceneLayer || hasKeyboardFocusInScene()) {
    pauseScene(label);
    return;
  }

  if (activeSectionId) {
    updateActiveLinks(activeSectionId);
  } else {
    setActiveHotspot(null);
  }

  resumeScene();
}

function scheduleScenePlaybackSync(delay = SCENE_RESUME_SETTLE_MS) {
  window.clearTimeout(scenePlaybackTimer);
  scenePlaybackTimer = window.setTimeout(() => {
    scenePlaybackTimer = null;
    syncScenePlayback();
  }, delay);
}

function updateSceneMetrics() {
  if (!sceneScreen) return;
  const previousMaxShift = maxBackgroundShift;
  const previousProgress = previousMaxShift > 0 ? currentTravel / previousMaxShift : 0;

  const width = sceneScreen.clientWidth;
  const height = sceneScreen.clientHeight;
  const basePadding = width < 820 ? 16 : 32;
  // Compute base scale so the scene fits, then apply a gentle hero zoom multiplier.
  sceneScale = Math.min((height - basePadding * 2) / BASE_SCENE_HEIGHT, 1) * HERO_ZOOM;

  // Measure the actual displayed widths of the panorama and foreground layers so
  // the loop clone can be positioned exactly after the original image. Using the
  // element offsetWidth (layout width before transform) ensures the left offset
  // matches the stage coordinate system where the clone is positioned.
  let panoramaDisplayWidth = SCENE_LOOP_OFFSET;

  try {
    const panoramaImgEl = panorama?.querySelector('.scene-panorama__bg');
    const foregroundImgEl = foreground?.querySelector('.scene-foreground__img--baraat');

    // If we have a panorama element, prefer its offsetWidth (layout width).
    if (panorama && typeof panorama.offsetWidth === 'number' && panorama.offsetWidth > 0) {
      panoramaDisplayWidth = panorama.offsetWidth;
    } else if (panoramaImgEl && typeof panoramaImgEl.offsetWidth === 'number' && panoramaImgEl.offsetWidth > 0) {
      panoramaDisplayWidth = panoramaImgEl.offsetWidth;
    }

    // If image elements haven't loaded yet, attach listeners so we recompute once they do.
    if (panoramaImgEl && !panoramaImgEl.complete) {
      panoramaImgEl.addEventListener('load', updateSceneMetrics, { once: true });
    }
    if (foregroundImgEl && !foregroundImgEl.complete) {
      foregroundImgEl.addEventListener('load', updateSceneMetrics, { once: true });
    }
  } catch (e) {
    // Defensive: fall back to constants
    panoramaDisplayWidth = SCENE_LOOP_OFFSET;
  }

  // Foreground overlays must repeat on the exact same loop boundary as the panorama.
  const foregroundDisplayWidth = Math.round(panoramaDisplayWidth * FOREGROUND_SHIFT_RATIO);

  maxBackgroundShift = panoramaDisplayWidth;

  currentTravel = wrapSceneTravel(previousProgress * maxBackgroundShift);

  sceneScreen.style.setProperty("--scene-scale", sceneScale.toFixed(4));
  // Nudge the stage slightly up for a tighter composition. Use a small value based
  // on basePadding so the nudge scales with viewport size. Negative moves the stage up.
  const sceneBottom = `${Math.max(4, Math.round(16 - basePadding * 0.25))}px`;
  sceneScreen.style.setProperty("--scene-bottom", sceneBottom);
  sceneScreen.style.setProperty("--scene-origin-x", `${basePadding}px`);
  sceneScreen.style.setProperty("--scene-loop-offset", `${panoramaDisplayWidth}px`);
  sceneScreen.style.setProperty("--scene-loop-offset-fg", `${foregroundDisplayWidth}px`);

  // On narrow viewports, apply a visual horizontal scale so the panorama
  // appears enlarged without changing clone positioning. Scale factor >1.
  try {
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    // Disable visual scaling when images are allowed to take intrinsic width
    sceneScreen.style.setProperty('--scene-visual-scale', '1');
  } catch (e) {
    // noop
  }

  syncCycleStart();
  applySceneTravel();
  // Apply baraat parallax immediately after initial travel apply
  applyBaraatParallax(-currentTravel);
  scheduleForegroundLoopReady();
  scheduleMobileBaraatRepaint();
}

function setActiveHotspot(hotspotId) {
  hotspotButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.hotspot === hotspotId);
  });
}

function updateActiveLinks(targetId) {
  scrollLinks.forEach((link) => {
    link.classList.toggle("is-active", link.dataset.scrollLink === targetId);
  });

  const activeHotspot =
    hotspotButtons.find((button) => button.dataset.target === targetId)?.dataset.hotspot ?? null;

  setActiveHotspot(activeHotspot);
}

function highlightSection(target) {
  window.clearTimeout(targetSectionTimer);
  sections.forEach((section) => section.classList.remove("is-targeted"));
  target.classList.add("is-targeted");

  targetSectionTimer = window.setTimeout(() => {
    target.classList.remove("is-targeted");
  }, 1800);
}

function jumpToElement(target) {
  if (!target) return;

  if (target.id === "top") {
    activeSectionId = "top";
    updateActiveLinks("top");
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: prefersReducedMotion.matches ? "auto" : "smooth",
    });
    return;
  }

  if (target.hasAttribute("data-section")) {
    highlightSection(target);
    activeSectionId = target.id;
    updateActiveLinks(activeSectionId);
  }

  target.scrollIntoView({
    behavior: prefersReducedMotion.matches ? "auto" : "smooth",
    block: "start",
  });
}

function pauseScene(label = "Paused for interaction") {
  isPaused = true;
  setSceneStatus(sceneInView ? label : "Scroll to explore");
}

function resumeScene(label = "Auto travelling") {
  isPaused = false;

  if (prefersReducedMotion.matches) {
    setSceneStatus("Motion reduced");
    return;
  }

  syncCycleStart();
  setSceneStatus(sceneInView ? label : "Scroll to explore");
}

function tick(now) {
  const deltaTime = lastAnimationTime === 0 ? 0 : now - lastAnimationTime;
  lastAnimationTime = now;

  if (
    !prefersReducedMotion.matches &&
    sceneInView &&
    !isPaused &&
    activePointerId === null &&
    maxBackgroundShift > 0 &&
    !document.hidden
  ) {
    const travelPerMillisecond = maxBackgroundShift / AUTO_TRAVEL_DURATION_MS;
    currentTravel = wrapSceneTravel(currentTravel + travelPerMillisecond * deltaTime);
    applySceneTravel();
    maybeRevealForegroundLoopDuringTravel();
  }

  if (
    design3dAutoActive &&
    !prefersReducedMotion.matches &&
    !is3dAnimating &&
    !document.hidden
  ) {
    if (lastDesignAnimationTime > 0) {
      design3dAutoElapsed += (now - lastDesignAnimationTime);
    }
    if (design3dAutoElapsed >= DESIGN_3D_AUTO_ADVANCE_MS) {
      design3dAutoElapsed = 0;
      moveDesign3d(1);
    }
  }
  lastDesignAnimationTime = now;

  // Design Studio uses 3D carousel; disable legacy horizontal auto-scroll to avoid conflicts.

  window.requestAnimationFrame(tick);
}

scrollLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const targetId = link.dataset.scrollLink;
    const target = document.getElementById(targetId);

    if (!target) return;

    event.preventDefault();
    jumpToElement(target);
    setHeaderMenuState(false);
  });
});

document.querySelectorAll('a[href="#top"]:not([data-scroll-link])').forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    jumpToElement(document.getElementById("top"));
    setHeaderMenuState(false);
  });
});

siteHeaderToggle?.addEventListener("click", () => {
  const isOpen = siteHeader?.classList.contains("is-menu-open") ?? false;
  setHeaderMenuState(!isOpen);
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 920) {
    setHeaderMenuState(false);
  }

  scheduleMobileBaraatRepaint(120);
});

window.addEventListener("orientationchange", () => {
  scheduleMobileBaraatRepaint(180);
});

window.addEventListener("load", () => {
  scheduleMobileBaraatRepaint(120);
});

window.visualViewport?.addEventListener("resize", () => {
  scheduleMobileBaraatRepaint(120);
});

// Services submenu: accessible toggle for mobile and keyboard support
(() => {
  const navItems = Array.from(document.querySelectorAll('.nav-item'));
  if (!navItems.length) return;

  function isMobile() {
    return window.matchMedia('(max-width: 920px)').matches;
  }

  navItems.forEach(item => {
    const trigger = item.querySelector(':scope > a');
    const toggle = item.querySelector(':scope > .nav-item__toggle');
    const submenu = item.querySelector(':scope > .nav-submenu');
    if (!trigger || !submenu) return;

    trigger.setAttribute('aria-haspopup', 'true');
    trigger.setAttribute('aria-expanded', 'false');
    toggle?.setAttribute('aria-expanded', 'false');

    function setSubmenuState(isOpen) {
      item.classList.toggle('is-open', isOpen);
      trigger.setAttribute('aria-expanded', String(isOpen));
      toggle?.setAttribute('aria-expanded', String(isOpen));
    }

    // Toggle on click for mobile
    trigger.addEventListener('click', (e) => {
      if (!isMobile()) return; // let desktop hover handle it
      e.preventDefault();
      const open = !item.classList.contains('is-open');
      setSubmenuState(open);
    });

    toggle?.addEventListener('click', (e) => {
      e.preventDefault();
      const open = !item.classList.contains('is-open');
      setSubmenuState(open);
    });

    // Keyboard accessibility: Enter / Space toggles submenu
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (!isMobile()) {
          e.preventDefault();
          const open = !item.classList.contains('is-open');
          setSubmenuState(open);
        }
      }
    });

    // Close submenu when focus leaves
    item.addEventListener('focusout', (e) => {
      // small delay to allow focus to move to submenu children
      setTimeout(() => {
        if (!item.contains(document.activeElement)) {
          setSubmenuState(false);
        }
      }, 10);
    });
  });
})();

// --- Interactive Map Marker Editor (dev only) ---
(function () {
  try {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('map-edit')) return;

    const panel = document.createElement('div');
    panel.id = 'map-edit-panel';
    panel.innerHTML = `
      <div style="font-weight:700;margin-bottom:.4rem">Map Editor</div>
      <button id="map-edit-copy" style="display:block;margin-bottom:.4rem">Copy coords</button>
      <div id="map-edit-list" style="max-height:220px;overflow:auto;font-size:12px;min-width:220px"></div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      #map-edit-panel{position:fixed;right:1rem;bottom:1rem;background:#fff;padding:.6rem;border:1px solid rgba(0,0,0,.06);z-index:99999;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.07);font-family:Inter,Segoe UI,Roboto,system-ui}
      #map-edit-panel button{padding:.35rem .5rem;border-radius:6px;border:1px solid rgba(0,0,0,.06);background:#fafafa;cursor:pointer}
      #map-edit-panel div{color:#111}
    `;

    document.head.appendChild(style);
    document.body.appendChild(panel);

    const maps = document.querySelectorAll('.destination-map');
    if (!maps.length) {
      const list = panel.querySelector('#map-edit-list');
      list.textContent = 'No maps found on this page.';
      return;
    }

    maps.forEach(map => {
      const frame = map.querySelector('.destination-map__frame');
      const points = map.querySelectorAll('.destination-map__points button');
      points.forEach(btn => {
        btn.style.touchAction = 'none';
        btn.style.userSelect = 'none';
        btn.style.cursor = 'move';
        btn.addEventListener('pointerdown', startDrag);
      });
    });

    function startDrag(e) {
      e.preventDefault();
      const btn = e.currentTarget;
      const frame = btn.closest('.destination-map__frame');
      if (!frame) return;
      const rect = frame.getBoundingClientRect();

      function onMove(ev) {
        const x = (ev.clientX - rect.left) / rect.width * 100;
        const y = (ev.clientY - rect.top) / rect.height * 100;
        btn.style.left = Math.min(100, Math.max(0, x)).toFixed(2) + '%';
        btn.style.top = Math.min(100, Math.max(0, y)).toFixed(2) + '%';
        updatePanel();
      }

      function onUp() {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
      }

      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
    }

    function updatePanel() {
      const list = panel.querySelector('#map-edit-list');
      list.innerHTML = '';
      maps.forEach(map => {
        const mapName = map.classList.contains('destination-map--indian') ? 'indian' : 'international';
        const points = map.querySelectorAll('.destination-map__points button');
        points.forEach(btn => {
          const id = btn.id || '';
          const left = btn.style.left || getComputedStyle(btn).left;
          const top = btn.style.top || getComputedStyle(btn).top;
          const row = document.createElement('div');
          row.style.marginBottom = '.28rem';
          row.textContent = `${mapName} ${id} — left: ${left}, top: ${top}`;
          list.appendChild(row);
        });
      });
    }

    const copyBtn = panel.querySelector('#map-edit-copy');
    copyBtn.addEventListener('click', () => {
      const result = {};
      maps.forEach(map => {
        const key = map.classList.contains('destination-map--indian') ? 'indian' : 'international';
        result[key] = result[key] || {};
        const points = map.querySelectorAll('.destination-map__points button');
        points.forEach(btn => {
          const id = btn.id || Math.random().toString(36).slice(2, 8);
          const left = btn.style.left || getComputedStyle(btn).left;
          const top = btn.style.top || getComputedStyle(btn).top;
          result[key][id] = { left, top };
        });
      });

      const json = JSON.stringify(result, null, 2);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(json).then(() => {
          copyBtn.textContent = 'Copied!';
          setTimeout(() => copyBtn.textContent = 'Copy coords', 1500);
        }).catch(() => {
          alert(json);
        });
      } else {
        alert(json);
      }
    });

    updatePanel();
  } catch (err) {
    // Fail silently in production
    console.error('Map editor error', err);
  }
})();

hotspotButtons.forEach((button) => {
  button.addEventListener("mouseenter", () => {
    loadDeferredHeroOverlays();

    if (!supportsHover.matches) return;

    pauseScene();
    setActiveHotspot(button.dataset.hotspot);
  });

  button.addEventListener("focus", () => {
    loadDeferredHeroOverlays();
    setActiveHotspot(button.dataset.hotspot);

    if (!lastInteractionWasKeyboard) return;

    pauseScene();
  });

  button.addEventListener("click", (event) => {
    loadDeferredHeroOverlays();
    setActiveHotspot(button.dataset.hotspot);

    const targetId = button.dataset.target;
    if (!targetId) return;

    const target = document.getElementById(targetId);
    if (!target) return;

    event.preventDefault();
    jumpToElement(target);
    scheduleScenePlaybackSync();
  });
});

scheduleDeferredHeroOverlayLoad();

designPrev?.addEventListener("click", () => {
  moveDesign3d(-1);
  resetDesign3dAutoAdvance();
});

designNext?.addEventListener("click", () => {
  moveDesign3d(1);
  resetDesign3dAutoAdvance();
});

designCarousel3d?.addEventListener("mouseenter", () => {
  if (!supportsHover.matches) return;
  stopDesign3dAutoAdvance();
});

designCarousel3d?.addEventListener("mouseleave", () => {
  if (!supportsHover.matches) return;
  startDesign3dAutoAdvance();
});

designCarousel3d?.addEventListener("focusin", () => {
  stopDesign3dAutoAdvance();
});

designCarousel3d?.addEventListener("focusout", () => {
  startDesign3dAutoAdvance();
});

// Hover no longer pauses the hero auto-travel to keep the scene continuously moving.
// Removed mouseenter/mouseleave handlers that previously called pauseScene()/syncScenePlayback().

// Pause auto-travel when the user intentionally hovers any scene layer.
// Resume when the pointer leaves that layer.
[
  { node: panorama, label: "Hovering panorama" },
  { node: panoramaLoopClone, label: "Hovering panorama" },
  { node: foreground, label: "Hovering foreground" },
  { node: foregroundLoopClone, label: "Hovering foreground" },
].forEach(({ node, label }) => {
  if (!node) return;

  node.addEventListener("mouseenter", () => {
    if (!supportsHover.matches) return;
    pauseScene(label);
  });

  node.addEventListener("mouseleave", () => {
    if (!supportsHover.matches) return;
    syncScenePlayback();
  });
});

if (sceneScreen) {
  sceneScreen.addEventListener("focusin", () => {
    if (!lastInteractionWasKeyboard) return;

    pauseScene();
  });
}

// IntersectionObserver: when the About section (`#wdc-section`) enters viewport,
// move the hero away on the Z axis and fade it to reveal a white background.
// Replace abrupt IntersectionObserver toggle with a scroll-driven progressive fade.
// The hero will interpolate transform and opacity as the page scrolls toward
// the `#wdc-section`. The `.hero--away` class is only set when the fade reaches
// its end state to preserve layout changes tied to that class.
(function setupHeroProgressiveFade() {
  const aboutSection = document.getElementById('wdc-section');
  const heroEl = document.querySelector('.hero');
  if (!aboutSection || !heroEl) return;

  let ticking = false;
  let lastHeroHeight = 0;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function updateHero() {
    ticking = false;

    const rect = aboutSection.getBoundingClientRect();
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    const isCompactScreen = window.matchMedia("(max-width: 920px)").matches;

    /* On phones/tablets (<= 920px), the hero is in normal document flow directly above
       the About/CTA section, so it scrolls naturally with the page without gaps or jumps. */
    if (isCompactScreen) {
      if (heroEl.style.display === "none") heroEl.style.display = "";
      heroEl.style.opacity = "";
      heroEl.style.transform = "";
      heroEl.style.visibility = "";
      heroEl.style.pointerEvents = "";
      heroEl.inert = false;
      heroEl.removeAttribute("aria-hidden");
      heroEl.classList.remove("hero--away");
      document.body.classList.remove("hero-away");
      return;
    }

    // Compute progress so the hero is fully faded when the about section's top
    // reaches the viewport (i.e., becomes visible). We start fading when the
    // about section is just below the fold to make the transition feel natural.
    const startOffset = vh * 0.15; // start fading shortly before it appears
    const fadeRange = vh * .75; // range over which to fade
    const distanceFromViewportTop = rect.top; // distance from top of viewport

    // When distanceFromViewportTop <= vh, the about section is visible.
    // Map distance from (vh + startOffset) -> (vh - fadeRange) into 0..1
    const startAt = vh + startOffset;
    const endAt = vh - fadeRange;
    const p = clamp((startAt - distanceFromViewportTop) / (startAt - endAt), 0, 1);

    // Keep desktop hotspots interactive on initial load. We only disable the
    // fixed hero once the first content section has visibly entered the viewport.
    const disableThreshold = Math.max(48, vh * 0.06);
    const shouldDisableHero = rect.top <= vh - disableThreshold;
    const shouldVisuallyHideHero = p >= 0.985;
    const shouldHardHideHero = isCompactScreen && shouldVisuallyHideHero;
    const eased = p;

    if (!shouldHardHideHero && heroEl.style.display === "none") {
      heroEl.style.display = "";
    }

    heroEl.style.opacity = shouldHardHideHero ? "0" : String(1 - eased);
    heroEl.style.transform = shouldHardHideHero
      ? "none"
      : `translate3d(0, ${-eased * 8}px, 0) scale(${1 - eased * 0.02})`;
    heroEl.style.pointerEvents = shouldDisableHero ? "none" : "";
    heroEl.style.visibility = shouldVisuallyHideHero ? "hidden" : "visible";
    heroEl.inert = shouldDisableHero;
    heroEl.setAttribute("aria-hidden", shouldVisuallyHideHero ? "true" : "false");

    if (shouldHardHideHero) {
      heroEl.style.display = "none";
    }

    // Only toggle the away class when fully faded or fully visible to avoid abrupt layout changes
    if (p >= 0.999) {
      if (!heroEl.classList.contains('hero--away')) {
        heroEl.classList.add('hero--away');
        document.body.classList.add('hero-away');
      }
    } else if (p <= 0.001) {
      if (heroEl.classList.contains('hero--away')) {
        heroEl.classList.remove('hero--away');
        document.body.classList.remove('hero-away');
      }
    }
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateHero);
  }

  // initialize
  updateHero();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
})();

if (sceneScreen) {
  sceneScreen.addEventListener("focusout", () => {
    if (sceneScreen.contains(document.activeElement) || activePointerId !== null) {
      return;
    }
    syncScenePlayback();
  });
}

function isSceneHotspotTarget(target) {
  return target instanceof Element && Boolean(target.closest(".scene-hotspot, .hero-link-hotspot"));
}

function resetScenePointerState() {
  if (!sceneScreen) return;

  const pointerIdToRelease = activePointerId ?? pendingPointerId;
  activePointerId = null;
  pendingPointerId = null;
  sceneScreen.classList.remove("is-dragging");

  if (
    pointerIdToRelease !== null &&
    sceneScreen.hasPointerCapture(pointerIdToRelease)
  ) {
    sceneScreen.releasePointerCapture(pointerIdToRelease);
  }

  syncScenePlayback();
}

function startSceneDrag(event) {
  if (!sceneScreen) return;

  activePointerId = event.pointerId;
  pendingPointerId = null;
  suppressSceneClickUntil = performance.now() + SCENE_CLICK_SUPPRESS_MS;
  sceneScreen.classList.add("is-dragging");

  if (!sceneScreen.hasPointerCapture(event.pointerId)) {
    sceneScreen.setPointerCapture(event.pointerId);
  }

  pauseScene("Dragging scene");
}

if (sceneScreen) {
  sceneScreen.addEventListener("pointerdown", (event) => {
    if (prefersReducedMotion.matches) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (activePointerId !== null || pendingPointerId !== null) return;

    const startedOnHotspot = isSceneHotspotTarget(event.target);

    lastPointerX = event.clientX;
    pointerStartX = event.clientX;
    pointerStartY = event.clientY;

    if (event.pointerType === "mouse") {
      if (startedOnHotspot) return;
      startSceneDrag(event);
      return;
    }

    pendingPointerId = event.pointerId;
    if (!sceneScreen.hasPointerCapture(event.pointerId)) {
      sceneScreen.setPointerCapture(event.pointerId);
    }
  });

  sceneScreen.addEventListener("pointermove", (event) => {
    if (event.pointerId === pendingPointerId) {
      const totalDeltaX = event.clientX - pointerStartX;
      const totalDeltaY = event.clientY - pointerStartY;

      if (
        Math.abs(totalDeltaX) < SCENE_DRAG_THRESHOLD_PX &&
        Math.abs(totalDeltaY) < SCENE_DRAG_THRESHOLD_PX
      ) {
        return;
      }

      if (Math.abs(totalDeltaY) > Math.abs(totalDeltaX)) {
        pendingPointerId = null;
        return;
      }

      startSceneDrag(event);
    }

    if (event.pointerId !== activePointerId) return;

    const deltaX = lastPointerX - event.clientX;
    lastPointerX = event.clientX;

    currentTravel = wrapSceneTravel(currentTravel + deltaX * DRAG_TRAVEL_MULTIPLIER);
    applySceneTravel();
  });

  sceneScreen.addEventListener("pointerup", finishDrag);
  sceneScreen.addEventListener("pointercancel", finishDrag);
  sceneScreen.addEventListener("lostpointercapture", (event) => {
    if (event.pointerId !== activePointerId) return;
    resetScenePointerState();
  });
  sceneScreen.addEventListener(
    "click",
    (event) => {
      if (performance.now() >= suppressSceneClickUntil) return;
      if (!isSceneHotspotTarget(event.target)) return;

      event.preventDefault();
      event.stopPropagation();
    },
    true,
  );
}

function finishDrag(event) {
  if (!sceneScreen) return;
  if (event.pointerId === pendingPointerId) {
    if (sceneScreen.hasPointerCapture(event.pointerId)) {
      sceneScreen.releasePointerCapture(event.pointerId);
    }
    pendingPointerId = null;
    return;
  }
  if (event.pointerId !== activePointerId) return;
  resetScenePointerState();
}

window.addEventListener("resize", updateSceneMetrics);
window.addEventListener("resize", syncdesignCarousel3dMetrics);
window.addEventListener("blur", () => {
  if (activePointerId === null && pendingPointerId === null) return;
  resetScenePointerState();
});
window.addEventListener("resize", () => {
  if (window.innerWidth > 920) {
    setHeaderMenuState(false);
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden || prefersReducedMotion.matches) return;
  syncCycleStart();
  lastDesignAnimationTime = performance.now();
});

document.addEventListener("keydown", (event) => {
  if (!event.altKey && !event.ctrlKey && !event.metaKey) {
    lastInteractionWasKeyboard = true;
  }

  if (event.key === "Escape") {
    setHeaderMenuState(false);
  }
});

document.addEventListener("pointerdown", () => {
  lastInteractionWasKeyboard = false;
});

document.addEventListener("click", (event) => {
  if (!siteHeader?.classList.contains("is-menu-open")) return;
  if (siteHeader.contains(event.target)) return;

  setHeaderMenuState(false);
});

// Toggle header scrolled state: header is transparent at top, white when scrolled
function updateHeaderScrolledState() {
  const header = siteHeader || document.querySelector('.site-header');
  if (!header) return;
  header.classList.remove('is-scrolled');
}

window.addEventListener('scroll', updateHeaderScrolledState, { passive: true });
updateHeaderScrolledState();

if (typeof prefersReducedMotion.addEventListener === "function") {
  prefersReducedMotion.addEventListener("change", () => {
    updateSceneMetrics();
    syncdesignCarousel3dMetrics();

    if (prefersReducedMotion.matches) {
      setSceneStatus("Motion reduced");
      applydesignCarousel3dOffset();
    } else {
      resumeScene();
      lastDesignAnimationTime = performance.now();
    }
  });
}

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.18,
      rootMargin: "0px 0px -8% 0px",
    },
  );

  revealNodes.forEach((node) => revealObserver.observe(node));

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        // Do not mark sections active while the hero is still in view
        // This prevents the first content section (e.g. 'Our Team') from
        // appearing active on initial load when the hero occupies the viewport.
        if (sceneInView) return;

        activeSectionId = entry.target.id;
        updateActiveLinks(activeSectionId);
      });
    },
    {
      threshold: 0,
      rootMargin: "-35% 0px -45% 0px",
    },
  );

  sections.forEach((section) => sectionObserver.observe(section));

  const sceneObserver = new IntersectionObserver(
    (entries) => {
      sceneInView = entries[0]?.isIntersecting ?? true;

      if (sceneInView) {
        activeSectionId = "top";
        updateActiveLinks("top");
      }

      if (prefersReducedMotion.matches) {
        setSceneStatus("Motion reduced");
        return;
      }

      if (!sceneInView) {
        window.clearTimeout(scenePlaybackTimer);
        scenePlaybackTimer = null;
        isPaused = false;
        setSceneStatus("Scroll to explore");
        return;
      }

      syncScenePlayback();
    },
    {
      threshold: 0.18,
    },
  );

  if (sceneScreen) {
    sceneObserver.observe(sceneScreen);
  }
} else {
  revealNodes.forEach((node) => node.classList.add("is-visible"));
}

updateSceneMetrics();
renderDesignMobileCarousel();
if (designCarousel3d) {
  designCarousel3d.addEventListener('pointerdown', on3dPointerDown);
  designCarousel3d.addEventListener('touchstart', on3dPointerDown, { passive: false });
}

/* The 3D carousel is display:none below 920px, but initialising it still
   eagerly preloads every Design Studio photograph (~11MB). Phones already
   have the lazy-loaded .design-mobile-carousel, so only start the 3D one
   once the viewport is actually wide enough to show it. */
const designDesktopQuery = window.matchMedia("(min-width: 921px)");
function initDesignCarouselWhenWideEnough() {
  if (designDesktopQuery.matches) {
    scheduleDesignCarousel3dInit();
    return true;
  }
  return false;
}
if (!initDesignCarouselWhenWideEnough()) {
  const onDesignViewportChange = () => {
    if (initDesignCarouselWhenWideEnough()) {
      designDesktopQuery.removeEventListener("change", onDesignViewportChange);
    }
  };
  designDesktopQuery.addEventListener("change", onDesignViewportChange);
}

if (revealNodes.length && !("IntersectionObserver" in window)) {
  revealNodes.forEach((node) => node.classList.add("is-visible"));
}

if (prefersReducedMotion.matches) {
  setSceneStatus("Motion reduced");
  applySceneTravel();
  applydesignCarousel3dOffset();
} else {
  setSceneStatus("Auto travelling");
}

lastDesignAnimationTime = performance.now();

updateActiveLinks(activeSectionId);
window.requestAnimationFrame(tick);

// --- Scroll-to-top rocket behavior ---
(function () {
  const scrollTopBtn = document.querySelector('.scroll-top');
  if (!scrollTopBtn) return;

  const SHOW_AT = 240; // show after this many px scrolled

  function onScroll() {
    if (window.scrollY > SHOW_AT) scrollTopBtn.classList.add('is-visible');
    else scrollTopBtn.classList.remove('is-visible');
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  scrollTopBtn.addEventListener('click', (e) => {
    // Visual launch effect (non-blocking) — the anchor's href="#top" will handle scrolling
    if (!prefersReducedMotion.matches) {
      scrollTopBtn.classList.add('is-launching');
      window.setTimeout(() => scrollTopBtn.classList.remove('is-launching'), 900);
    }
    // close mobile menu if open
    setHeaderMenuState(false);
  });

  scrollTopBtn.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: prefersReducedMotion.matches ? 'auto' : 'smooth',
    });
  });
})();

// --- Service Title Staggered Reveal Animation (scroll-dependent) ---
(function () {
  const serviceTitles = document.querySelectorAll('.service-title-animate');
  if (!serviceTitles.length) return;

  const animatedTitles = new Set();

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const title = entry.target;
      const isVisible = entry.isIntersecting && entry.boundingClientRect.top < window.innerHeight && entry.boundingClientRect.bottom > 0;

      if (isVisible && !animatedTitles.has(title)) {
        animatedTitles.add(title);
        const words = title.querySelectorAll('span');
        words.forEach((word, i) => {
          word.classList.remove('revealed');

          setTimeout(() => {
            word.classList.add('revealed');
          }, i * 100 + Math.random() * 100);
        });
      } else if (!isVisible) {
        animatedTitles.delete(title);
      }
    });
  }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });

  serviceTitles.forEach(title => observer.observe(title));
})();

// --- Service Image Reveal Animation ---
(function () {
  const images = document.querySelectorAll('.service-image-animate');
  if (!images.length) return;

  const animatedImages = new Set();

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const img = entry.target;
      const isVisible = entry.isIntersecting && entry.boundingClientRect.top < window.innerHeight && entry.boundingClientRect.bottom > 0;

      if (isVisible && !animatedImages.has(img)) {
        animatedImages.add(img);
        setTimeout(() => {
          img.classList.add('revealed');
        }, 200);
      } else if (!isVisible) {
        animatedImages.delete(img);
      }
    });
  }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });

  images.forEach(img => observer.observe(img));
})();

// --- Destination Tab Switching ---
(function () {
  const tabs = document.querySelectorAll('.destination-tab');
  const maps = document.querySelectorAll('.destination-map');

  if (!tabs.length || !maps.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      maps.forEach(map => {
        map.classList.remove('active');
        if (map.classList.contains('destination-map--' + target)) {
          map.classList.add('active');
        }
      });
    });
  });
})();

// --- Mobile Carousel Dots Sync ---
(function () {
  const carousel = document.getElementById('services-mobile-carousel');
  const dots = document.querySelectorAll('#carousel-dots .carousel-dot');

  if (!carousel || !dots.length) return;

  carousel.addEventListener('scroll', () => {
    // Determine which card is in view
    const scrollLeft = carousel.scrollLeft;
    // We add a tiny offset to trigger the dot change slightly before perfectly centered
    const cardWidth = carousel.offsetWidth;
    const activeIndex = Math.round(scrollLeft / cardWidth);

    dots.forEach((dot, index) => {
      if (index === activeIndex) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  });
})();

// --- Design Studio Mobile Carousel Dots Sync ---
(function () {
  const carousel = document.getElementById('design-mobile-carousel');

  if (!carousel) return;

  carousel.addEventListener('scroll', () => {
    const dots = carousel.parentElement?.querySelectorAll('#design-carousel-dots .carousel-dot') || [];
    if (!dots.length || !carousel.children.length) return;
    const scrollLeft = carousel.scrollLeft;
    const cardWidth = carousel.children[0].offsetWidth + parseInt(window.getComputedStyle(carousel).gap || 0);
    const activeIndex = Math.round(scrollLeft / cardWidth);

    dots.forEach((dot, index) => {
      if (index === activeIndex) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  });
})();

// --- Contact Form (WhatsApp Direct Submission) ---
(function () {
  const form = document.getElementById("contact-form") || document.querySelector(".contact-form");
  if (!form) return;

  const statusNode = form.querySelector(".form-status");
  const dateEl = form.querySelector('[name="event_date"]');

  // Set min date to today
  if (dateEl) {
    try {
      const today = new Date().toISOString().split("T")[0];
      dateEl.setAttribute("min", today);
    } catch (e) {}
  }

  function setStatus(message, isError) {
    if (!statusNode) return;
    statusNode.textContent = message;
    if (isError) {
      statusNode.style.color = "#ffcccc";
      statusNode.dataset.state = "error";
    } else {
      statusNode.style.color = "inherit";
      delete statusNode.dataset.state;
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (event.stopImmediatePropagation) event.stopImmediatePropagation();

    const emailEl = form.querySelector('[name="email"]');
    const subjectEl = form.querySelector('[name="subject"]');
    const messageEl = form.querySelector('[name="message"]');

    const emailVal = emailEl ? emailEl.value.trim() : "";
    const dateVal = dateEl ? dateEl.value.trim() : "";
    const subjectVal = subjectEl ? subjectEl.value.trim() : "";
    const messageVal = messageEl ? messageEl.value.trim() : "";

    if (!emailVal || !dateVal || !subjectVal || !messageVal) {
      setStatus("Please fill in all required fields including the event date.", true);
      return;
    }

    setStatus("", false);

    let formattedDate = dateVal;
    try {
      const parts = dateVal.split("-");
      if (parts.length === 3) {
        const dObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        formattedDate = dObj.toLocaleDateString("en-US", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      }
    } catch (e) {
      formattedDate = dateVal;
    }

    const messageText =
      "Hello Meghavi Comferts,\n\n" +
      "I would like to enquire about your wedding and event services.\n\n" +
      "Email: " + emailVal + "\n\n" +
      "Event Date: " + formattedDate + " (" + dateVal + ")\n\n" +
      "Subject: " + subjectVal + "\n\n" +
      "Message:\n" + messageVal + "\n\n" +
      "Please get in touch with me regarding my enquiry.\n\n" +
      "Thank you.";

    const whatsappUrl =
      "https://wa.me/918005912079?text=" + encodeURIComponent(messageText);

    window.location.href = whatsappUrl;
  });
})();

// --- Gallery & Lightbox Controller ---
(function initGallery() {
  const galleryGrid = document.getElementById("galleryGrid");
  const filterBtns = document.querySelectorAll(".gallery-filter-btn");
  const lightbox = document.getElementById("galleryLightbox");
  if (!galleryGrid || !lightbox) return;

  const lightboxBackdrop = document.getElementById("galleryLightboxBackdrop");
  const lightboxClose = document.getElementById("galleryLightboxClose");
  const lightboxPrev = document.getElementById("galleryLightboxPrev");
  const lightboxNext = document.getElementById("galleryLightboxNext");
  const lightboxMedia = document.getElementById("galleryLightboxMedia");
  const lightboxTitle = document.getElementById("galleryLightboxTitle");
  const lightboxCounter = document.getElementById("galleryLightboxCounter");

  const cards = Array.from(galleryGrid.querySelectorAll(".gallery-card"));
  let currentFilter = "all";
  let visibleCards = [...cards];
  let currentIndex = 0;

  // Hover video previews (desktop)
  cards.forEach((card) => {
    if (card.dataset.type === "video") {
      const video = card.querySelector("video");
      if (video) {
        card.addEventListener("mouseenter", () => {
          video.play().catch(() => {});
        });
        card.addEventListener("mouseleave", () => {
          video.pause();
          video.currentTime = 0.5;
        });
      }
    }

    card.addEventListener("click", () => {
      const activeIdx = visibleCards.indexOf(card);
      if (activeIdx !== -1) {
        openLightbox(activeIdx);
      }
    });
  });

  // Filter Buttons
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter;
      currentFilter = filter;

      filterBtns.forEach((b) => {
        const isActive = b === btn;
        b.classList.toggle("is-active", isActive);
        b.setAttribute("aria-selected", isActive ? "true" : "false");
      });

      cards.forEach((card) => {
        const matches = filter === "all" || card.dataset.type === filter;
        card.classList.toggle("is-hidden", !matches);
      });

      visibleCards = cards.filter((card) => !card.classList.contains("is-hidden"));
    });
  });

  function openLightbox(index) {
    if (!visibleCards.length) return;
    currentIndex = (index + visibleCards.length) % visibleCards.length;
    renderLightboxContent();
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lightboxMedia) {
      const video = lightboxMedia.querySelector("video");
      if (video) video.pause();
      lightboxMedia.innerHTML = "";
    }
  }

  function renderLightboxContent() {
    if (!lightboxMedia || !visibleCards[currentIndex]) return;
    const card = visibleCards[currentIndex];
    const type = card.dataset.type;
    const title = card.querySelector(".gallery-card__title")?.textContent || "";

    lightboxMedia.innerHTML = "";

    if (type === "video") {
      const originalVideo = card.querySelector("video");
      const video = document.createElement("video");
      video.src = originalVideo ? originalVideo.src.split("#")[0] : "";
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      video.className = "gallery-lightbox__video";
      lightboxMedia.appendChild(video);
    } else {
      const originalImg = card.querySelector("img");
      const img = document.createElement("img");
      img.src = originalImg ? originalImg.src : "";
      img.alt = originalImg ? originalImg.alt : "";
      img.className = "gallery-lightbox__img";
      lightboxMedia.appendChild(img);
    }

    if (lightboxTitle) lightboxTitle.textContent = title;
    if (lightboxCounter) {
      lightboxCounter.textContent = `${currentIndex + 1} / ${visibleCards.length}`;
    }
  }

  function nextLightbox() {
    if (!visibleCards.length) return;
    openLightbox(currentIndex + 1);
  }

  function prevLightbox() {
    if (!visibleCards.length) return;
    openLightbox(currentIndex - 1);
  }

  lightboxClose?.addEventListener("click", closeLightbox);
  lightboxBackdrop?.addEventListener("click", closeLightbox);
  lightboxNext?.addEventListener("click", nextLightbox);
  lightboxPrev?.addEventListener("click", prevLightbox);

  window.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("is-open")) return;
    if (e.key === "Escape") closeLightbox();
    else if (e.key === "ArrowRight") nextLightbox();
    else if (e.key === "ArrowLeft") prevLightbox();
  });

  // Touch swipe support in lightbox for mobile
  let touchStartX = 0;
  let touchEndX = 0;
  lightbox.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  lightbox.addEventListener("touchend", (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextLightbox();
      else prevLightbox();
    }
  }, { passive: true });
})();






