try {
  document.documentElement.dataset.theme = localStorage.getItem("itinera-theme") ||
    (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
} catch {}
