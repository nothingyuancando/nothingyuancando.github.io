const root = document.documentElement;
const toggle = document.querySelector("#theme-toggle");
const modes = ["system", "light", "dark"];
const labels = {
  system: "跟随系统主题",
  light: "浅色模式",
  dark: "深色模式"
};

function applyTheme(mode) {
  if (mode === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", mode);
  }

  if (toggle) {
    toggle.textContent = labels[mode];
  }
}

const savedMode = localStorage.getItem("theme-mode");
let currentMode = modes.includes(savedMode) ? savedMode : "system";
applyTheme(currentMode);

if (toggle) {
  toggle.addEventListener("click", () => {
    const nextIndex = (modes.indexOf(currentMode) + 1) % modes.length;
    currentMode = modes[nextIndex];
    localStorage.setItem("theme-mode", currentMode);
    applyTheme(currentMode);
  });
}
