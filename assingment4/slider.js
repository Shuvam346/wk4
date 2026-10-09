
/*
 * Image Slider Library
 * Vanilla JavaScript — no external carousel library.
 */

(() => {
  "use strict";

  class ImageSlider {
    constructor(root) {
      this.root = root;
      this.track = root.querySelector("[data-track]");
      this.prevButton = root.querySelector("[data-prev]");
      this.nextButton = root.querySelector("[data-next]");
      this.dotsContainer = root.querySelector("[data-dots]");
      this.counter = document.querySelector("#slide-counter");
      this.announcement = root.querySelector("[data-announcement]");

      this.originalSlides = Array.from(this.track.children);
      this.total = this.originalSlides.length;

      this.activeIndex = 0;
      this.position = 1;
      this.isAnimating = false;

      if (this.total === 0) {
        throw new Error("ImageSlider requires at least one slide.");
      }

      this.buildLoopClones();
      this.buildDots();
      this.bindEvents();
      this.render(false);
    }

    // Add clones at both ends for seamless looping.
    buildLoopClones() {
      const firstClone = this.originalSlides[0].cloneNode(true);
      const lastClone = this.originalSlides[
        this.total - 1
      ].cloneNode(true);

      firstClone.dataset.clone = "first";
      lastClone.dataset.clone = "last";

      firstClone.setAttribute("aria-hidden", "true");
      lastClone.setAttribute("aria-hidden", "true");

      this.track.insertBefore(
        lastClone,
        this.originalSlides[0]
      );

      this.track.appendChild(firstClone);
    }

    // Generate one clickable dot per original slide.
    buildDots() {
      const fragment = document.createDocumentFragment();

      this.originalSlides.forEach((slide, index) => {
        const dot = document.createElement("button");

        dot.type = "button";
        dot.className = "slider-dot";
        dot.setAttribute("aria-label", `Go to slide ${index + 1}`);
        dot.setAttribute("aria-controls", "slider-track");

        dot.addEventListener("click", () => {
          this.goTo(index);
        });

        fragment.appendChild(dot);
      });

      this.dotsContainer.replaceChildren(fragment);
      this.dots = Array.from(this.dotsContainer.children);

      this.track.id = "slider-track";
    }

    // Register controls and transition events.
    bindEvents() {
      this.nextButton.addEventListener("click", () => {
        this.next();
      });

      this.prevButton.addEventListener("click", () => {
        this.previous();
      });

      this.track.addEventListener("transitionend", (event) => {
        if (
          event.target !== this.track ||
          event.propertyName !== "transform"
        ) {
          return;
        }

        // We reached the clone after the final original slide.
        if (this.position === this.total + 1) {
          this.position = 1;
          this.render(false);
        }

        // We reached the clone before the first original slide.
        else if (this.position === 0) {
          this.position = this.total;
          this.render(false);
        }

        this.isAnimating = false;
      });

      // Keyboard navigation when focus is inside the slider.
      this.root.addEventListener("keydown", (event) => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          this.next();
        }

        if (event.key === "ArrowLeft") {
          event.preventDefault();
          this.previous();
        }
      });

      // Respond to changes in the viewport's dimensions.
      if ("ResizeObserver" in window) {
        this.resizeObserver = new ResizeObserver(() => {
          this.render(false);
        });

        this.resizeObserver.observe(
          this.root.querySelector(".slider-viewport")
        );
      }
    }

    // Move to the next slide, wrapping at the end.
    next() {
      if (this.isAnimating) return;

      this.activeIndex =
        (this.activeIndex + 1) % this.total;

      this.position += 1;
      this.render(true);
    }

    // Move to the previous slide, wrapping at the start.
    previous() {
      if (this.isAnimating) return;

      this.activeIndex =
        (this.activeIndex - 1 + this.total) % this.total;

      this.position -= 1;
      this.render(true);
    }

    // Navigate directly to a selected dot.
    goTo(index) {
      if (
        this.isAnimating ||
        index === this.activeIndex
      ) {
        return;
      }

      // Last slide → first slide: move forward onto the clone.
      if (
        this.activeIndex === this.total - 1 &&
        index === 0
      ) {
        this.position = this.total + 1;
        this.activeIndex = 0;
      }

      // First slide → last slide: move backward onto the clone.
      else if (
        this.activeIndex === 0 &&
        index === this.total - 1
      ) {
        this.position = 0;
        this.activeIndex = this.total - 1;
      }

      // Other dot selections move directly to the target.
      else {
        this.position = index + 1;
        this.activeIndex = index;
      }

      this.render(true);
    }

    // Update the track, active dot, counter, and announcement.
    render(animate) {
      this.track.style.transition = animate ? "" : "none";

      this.track.style.transform =
        `translate3d(${-this.position * 100}%, 0, 0)`;

      this.isAnimating = animate;

      this.dots.forEach((dot, index) => {
        const active = index === this.activeIndex;

        dot.setAttribute(
          "aria-current",
          String(active)
        );

        dot.setAttribute(
          "aria-label",
          `${active ? "Current slide" : "Go to slide"} ${index + 1}`
        );
      });

      this.counter.textContent =
        `${String(this.activeIndex + 1).padStart(2, "0")} / ` +
        `${String(this.total).padStart(2, "0")}`;

      this.announcement.textContent =
        `Slide ${this.activeIndex + 1} of ${this.total}`;

      if (!animate) {
        // Apply the instant reset before restoring the transition.
        void this.track.offsetHeight;
        this.track.style.transition = "";
      }
    }
  }

  // Initialize every slider on the page.
  document.querySelectorAll("[data-slider]").forEach((slider) => {
    new ImageSlider(slider);
  });
})();