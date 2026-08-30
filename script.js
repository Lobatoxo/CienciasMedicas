(function () {
  const root = document.documentElement;
  const themeButton = document.querySelector("[data-theme-toggle]");
  const savedTheme = localStorage.getItem("ficha-theme");

  if (savedTheme === "dark" || savedTheme === "light") {
    root.dataset.theme = savedTheme;
  }

  function updateThemeLabel() {
    if (!themeButton) return;
    const dark = root.dataset.theme === "dark";
    themeButton.textContent = dark ? "Modo claro" : "Modo oscuro";
    themeButton.setAttribute("aria-label", dark ? "Activar modo claro" : "Activar modo oscuro");
  }

  updateThemeLabel();

  themeButton?.addEventListener("click", function () {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem("ficha-theme", root.dataset.theme);
    updateThemeLabel();
  });

  const search = document.querySelector("[data-search]");
  const filters = Array.from(document.querySelectorAll("[data-filter]"));
  const notes = Array.from(document.querySelectorAll("[data-note]"));
  const empty = document.querySelector("[data-empty]");
  let activeFilter = "todos";

  function applyFilters() {
    const query = (search?.value || "").trim().toLocaleLowerCase("es");
    let visible = 0;

    notes.forEach(function (note) {
      const text = note.textContent.toLocaleLowerCase("es");
      const categories = (note.dataset.category || "").split(" ");
      const matchesQuery = !query || text.includes(query);
      const matchesFilter = activeFilter === "todos" || categories.includes(activeFilter);
      const show = matchesQuery && matchesFilter;

      note.hidden = !show;
      if (show) visible += 1;
    });

    document.querySelectorAll(".anatomy-area").forEach(function (area) {
      const hasVisibleNotes = Array.from(area.querySelectorAll("[data-note]")).some(function (note) {
        return !note.hidden;
      });
      area.hidden = !hasVisibleNotes;
    });

    empty?.classList.toggle("visible", visible === 0);
  }

  search?.addEventListener("input", applyFilters);

  filters.forEach(function (filter) {
    filter.addEventListener("click", function () {
      activeFilter = filter.dataset.filter || "todos";
      filters.forEach(function (item) {
        item.setAttribute("aria-pressed", String(item === filter));
      });
      applyFilters();
    });
  });

  const article = document.querySelector("article.apunte");
  const tocLinks = Array.from(document.querySelectorAll(".toc a[href^='#']"));

  if (article) {
    const progress = document.createElement("div");
    progress.className = "reading-progress";
    progress.setAttribute("aria-hidden", "true");
    document.body.prepend(progress);

    function updateReadingProgress() {
      const articleTop = article.offsetTop;
      const articleHeight = Math.max(article.scrollHeight - window.innerHeight, 1);
      const travelled = Math.min(Math.max(window.scrollY - articleTop, 0), articleHeight);
      progress.style.width = `${(travelled / articleHeight) * 100}%`;
    }

    updateReadingProgress();
    window.addEventListener("scroll", updateReadingProgress, { passive: true });
    window.addEventListener("resize", updateReadingProgress);
  }

  if (tocLinks.length && "IntersectionObserver" in window) {
    const targets = tocLinks
      .map(function (link) {
        try {
          return document.querySelector(link.getAttribute("href"));
        } catch (_) {
          return null;
        }
      })
      .filter(Boolean);

    const observer = new IntersectionObserver(function (entries) {
      const visible = entries
        .filter(function (entry) { return entry.isIntersecting; })
        .sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; });

      if (!visible.length) return;
      const currentId = visible[0].target.id;

      tocLinks.forEach(function (link) {
        const active = link.getAttribute("href") === `#${currentId}`;
        if (active) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    }, { rootMargin: "-15% 0px -70% 0px", threshold: 0 });

    targets.forEach(function (target) { observer.observe(target); });
  }
})();
