(function () {
  const SCRIPT_URL = document.currentScript.src;
  const BASE_URL = SCRIPT_URL.substring(0, SCRIPT_URL.lastIndexOf("/"));
  const BOT_ID = document.currentScript.getAttribute("data-bot-id");

  if (!BOT_ID) {
    console.error("Nexus Widget: Missing data-bot-id attribute.");
    return;
  }

  // Define styles
    const styles = `
    #nexus-widget-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    #nexus-trigger {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: #1A1714;
      border: 1px solid rgba(234,181,100,0.4);
      box-shadow: 0 20px 50px rgba(26,23,20,0.4);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      padding: 0;
      outline: none;
      color: #EAB564;
    }
    #nexus-trigger:hover {
      transform: translateY(-4px) scale(1.08);
      background: #EAB564;
      color: #1A1714;
      box-shadow: 0 25px 60px rgba(234,181,100,0.3);
      border-color: #EAB564;
    }
    #nexus-trigger svg {
      width: 32px;
      height: 32px;
      fill: currentColor;
    }
    #nexus-window {
      position: absolute;
      bottom: 85px;
      right: 0;
      width: 420px;
      height: 600px;
      max-height: calc(100vh - 120px);
      background: #F7F4EF;
      border-radius: 24px;
      box-shadow: 0 25px 70px rgba(26,23,20,0.15);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transform: translateY(30px) scale(0.95);
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1);
      border: 1px solid rgba(226, 217, 204, 0.8);
    }
    #nexus-window.active {
      transform: translateY(0) scale(1);
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
    }
    #nexus-iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
    #nexus-halo {
      position: fixed;
      bottom: 25px;
      right: 25px;
      width: 50px;
      height: 50px;
      border-radius: 999px;
      background: radial-gradient(circle, #EAB564, transparent 70%);
      opacity: 0;
      filter: blur(15px);
      pointer-events: none;
      z-index: 999998;
      transition: all 0.6s ease;
    }
    #nexus-widget-container:hover #nexus-halo {
      opacity: 0.35;
      transform: scale(2.5);
    }
    @media (max-width: 480px) {
      #nexus-window {
        width: calc(100vw - 32px);
        height: calc(100vh - 100px);
        bottom: 80px;
        right: -8px;
        border-radius: 20px;
      }
    }
  `;

  // Icons
  const starIcon = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" /><circle cx="19" cy="5" r="1.5" /><circle cx="5" cy="19" r="1" opacity="0.6" /></svg>`;
  const closeIcon = `<svg viewBox="0 0 24 24" style="width:28px;height:28px;stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

  // Create halo
  const halo = document.createElement("div");
  halo.id = "nexus-halo";
  document.body.appendChild(halo);

  // Create container and Shadow DOM
  const container = document.createElement("div");
  container.id = "nexus-widget-root";
  document.body.appendChild(container);

  const shadow = container.attachShadow({ mode: "open" });

  // Add styles
  const styleTag = document.createElement("style");
  styleTag.textContent = styles;
  shadow.appendChild(styleTag);

  // Layout
  const widgetContainer = document.createElement("div");
  widgetContainer.id = "nexus-widget-container";
  
  const trigger = document.createElement("button");
  trigger.id = "nexus-trigger";
  trigger.innerHTML = starIcon;
  
  const windowFrame = document.createElement("div");
  windowFrame.id = "nexus-window";
  
  const iframe = document.createElement("iframe");
  iframe.id = "nexus-iframe";
  iframe.title = "Nexus Chatbot";
  iframe.loading = "eager";
  iframe.src = `${BASE_URL.replace("/public", "")}/embed/${BOT_ID}`;
  
  windowFrame.appendChild(iframe);
  widgetContainer.appendChild(windowFrame);
  widgetContainer.appendChild(trigger);
  shadow.appendChild(widgetContainer);

  // Logic
  let isOpen = false;
  trigger.onclick = function() {
    isOpen = !isOpen;
    if (isOpen) {
      windowFrame.classList.add("active");
      trigger.innerHTML = closeIcon;
    } else {
      windowFrame.classList.remove("active");
      trigger.innerHTML = starIcon;
    }
  };
})();
