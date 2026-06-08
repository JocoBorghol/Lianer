export function createStatusGroup({ label, count, color, cssClass, percent, items }) {
  const group = document.createElement("div");
  group.className = "status-group";

  const toggle = document.createElement("button");
  toggle.className = "status-toggle";

  let dotHtml = "";

  if (cssClass) {
    dotHtml = `<span class="dot ${cssClass}"></span>`;
  } else {
    dotHtml = `<span class="dot" style="background:${color}; box-shadow:0 0 8px ${color};"></span>`;
  }

  toggle.innerHTML = `${dotHtml}<span>${label}: ${count}</span><span class="chevron">▾</span>`;

  toggle.addEventListener("click", () => {
    group.classList.toggle("open");
  });

  const progressWrap = document.createElement("div");
  progressWrap.className = "progress-wrap";

  let barHtml = "";

  if (cssClass) {
    barHtml = `<div class="progress-bar ${cssClass}" style="width: ${percent}%"></div>`;
  } else {
    barHtml = `<div class="progress-bar" style="width: ${percent}%; background:${color}; box-shadow:0 0 10px ${color};"></div>`;
  }

  progressWrap.innerHTML = barHtml;

  const list = document.createElement("ul");
  list.className = "status-list";

  if (!items || items.length === 0) {
    list.innerHTML = `<li style="font-style:italic; opacity:0.5;">Tomt</li>`;
  } else {
    items.forEach(itemText => {
      const li = document.createElement("li");
      li.textContent = itemText;
      li.className = "dashboard-item-text";
      list.append(li);
    });
  }

  group.append(toggle, progressWrap, list);

  return group;
}