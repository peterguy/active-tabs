const BASE_URL = "http://localhost:5174";

const currentTitleEl = document.getElementById("current-title");
const currentUrlEl = document.getElementById("current-url");
const addBtn = document.getElementById("add-btn");
const statusEl = document.getElementById("status");
const linksListEl = document.getElementById("links-list");
const searchInput = document.getElementById("search-input");

let currentTab = null;
let allLinks = [];

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;

  currentTitleEl.textContent = tab.title || "Untitled";
  currentUrlEl.textContent = tab.url || "";
  addBtn.disabled = false;

  loadLinks();
}

async function loadLinks() {
  try {
    const res = await fetch(`${BASE_URL}/api/links`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    allLinks = data.links;
    filterAndRender();
  } catch (err) {
    linksListEl.innerHTML = `<div class="empty">Could not load links. Is Active Tabs running?</div>`;
  }
}

function filterAndRender() {
  const query = (searchInput.value || "").toLowerCase().trim();
  const filtered = query
    ? allLinks.filter(
        (l) =>
          (l.title || "").toLowerCase().includes(query) ||
          l.url.toLowerCase().includes(query)
      )
    : allLinks;
  renderLinks(filtered);
}

function renderLinks(links) {
  if (!links.length) {
    linksListEl.innerHTML = `<div class="empty">No saved links yet.</div>`;
    return;
  }

  linksListEl.innerHTML = links
    .map((link) => {
      const faviconUrl = getFaviconUrl(link.url);
      const displayUrl = truncateUrl(link.url, 50);
      return `
        <a class="link-item" href="${escapeHtml(link.url)}" target="_blank" rel="noopener">
          <img class="favicon" src="${escapeHtml(faviconUrl)}" alt="" onerror="this.style.display='none'">
          <div class="info">
            <div class="name">${escapeHtml(link.title || "Untitled")}</div>
            <div class="link-url">${escapeHtml(displayUrl)}</div>
          </div>
        </a>`;
    })
    .join("");
}

function getFaviconUrl(url) {
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?sz=32&domain=${u.hostname}`;
  } catch {
    return "";
  }
}

function truncateUrl(url, maxLen) {
  if (url.length <= maxLen) return url;
  return url.substring(0, maxLen) + "…";
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function showStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  if (type !== "error") {
    setTimeout(() => {
      statusEl.textContent = "";
      statusEl.className = "status";
    }, 3000);
  }
}

searchInput.addEventListener("input", filterAndRender);

addBtn.addEventListener("click", async () => {
  if (!currentTab) return;

  addBtn.disabled = true;
  addBtn.textContent = "Adding...";

  try {
    const res = await fetch(`${BASE_URL}/api/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: currentTab.url, title: currentTab.title }),
    });

    if (res.status === 409) {
      showStatus("This link is already saved.", "duplicate");
    } else if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    } else {
      showStatus("Link added!", "success");
      await loadLinks();
    }
  } catch (err) {
    showStatus("Failed to add link. Is Active Tabs running?", "error");
  } finally {
    addBtn.disabled = false;
    addBtn.textContent = "Add to Active Tabs";
  }
});

init();
