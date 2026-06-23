module.exports = {
  title: "Fluxora",
  description: "Enterprise-grade multi-tenant social media scheduling, optimization, and distribution platform.",
  icon: "icon.png",
  menu: async (kernel) => {
    let installed = await kernel.exists("apps/backend/node_modules");
    let running = await kernel.running("start.js");
    
    if (!installed) {
      return [
        { icon: "fa-solid fa-download", text: "Install", href: "install.js" }
      ];
    }
    
    if (running) {
      return [
        { icon: "fa-solid fa-rocket", text: "Open dashboard", href: "http://localhost:3001", target: "_blank" },
        { icon: "fa-solid fa-stop", text: "Stop Server", href: "stop.js" },
        { icon: "fa-solid fa-rotate", text: "Update Packages", href: "update.js" }
      ];
    } else {
      return [
        { icon: "fa-solid fa-play", text: "Start Server", href: "start.js" },
        { icon: "fa-solid fa-rotate", text: "Update Packages", href: "update.js" },
        { icon: "fa-solid fa-trash", text: "Uninstall", href: "uninstall.js" }
      ];
    }
  }
}
