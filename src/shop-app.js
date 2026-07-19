const shopState = {
  products: [],
  categories: [],
  preview: false,
  query: "",
  department: "",
  condition: "",
  price: "",
  sort: "newest",
  cart: loadCart(),
  selectedId: ""
};

const productGrid = document.querySelector("#product-grid");
const catalogStatus = document.querySelector("#catalog-status");
const emptyState = document.querySelector("#empty-state");
const departmentFilters = document.querySelector("#department-filters");
const categoryNav = document.querySelector("#category-nav");
const activeFilters = document.querySelector("#active-filters");
const filtersPanel = document.querySelector("#shop-filters");
const filterToggle = document.querySelector("#filter-toggle");
const productDialog = document.querySelector("#product-dialog");
const dialogContent = document.querySelector("#dialog-content");
const cartDrawer = document.querySelector("#cart-drawer");
const drawerBackdrop = document.querySelector("#drawer-backdrop");

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

bootShop();

async function bootShop() {
  bindShopEvents();
  renderCart();
  try {
    const response = await fetch("/api/shop/catalog", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message || "Sortiment konnte nicht geladen werden.");
    shopState.products = Array.isArray(payload.items) ? payload.items : [];
    shopState.categories = Array.isArray(payload.categories) ? payload.categories : [];
    shopState.preview = Boolean(payload.preview);
    renderNavigation();
    renderFeature();
    renderCatalog();
    renderCart();
  } catch (error) {
    catalogStatus.textContent = "Sortiment derzeit nicht erreichbar";
    emptyState.hidden = false;
    emptyState.querySelector("strong").textContent = "Der Shop macht gerade eine kurze Pause.";
    emptyState.querySelector("span").textContent = error.message;
  }
}

function bindShopEvents() {
  document.querySelector("#shop-search").addEventListener("submit", (event) => {
    event.preventDefault();
    shopState.query = document.querySelector("#shop-search-input").value.trim();
    renderCatalog();
    document.querySelector("#catalog").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.querySelector("#shop-search-input").addEventListener("input", (event) => {
    shopState.query = event.target.value.trim();
    renderCatalog();
  });

  document.querySelector("#sort-select").addEventListener("change", (event) => {
    shopState.sort = event.target.value;
    renderCatalog();
  });

  document.querySelectorAll('input[name="condition"]').forEach((input) => {
    input.addEventListener("change", () => {
      shopState.condition = document.querySelector('input[name="condition"]:checked').value;
      renderCatalog();
    });
  });

  document.querySelectorAll('input[name="price"]').forEach((input) => {
    input.addEventListener("change", () => {
      shopState.price = document.querySelector('input[name="price"]:checked').value;
      renderCatalog();
    });
  });

  document.querySelector("#reset-filters").addEventListener("click", resetFilters);
  document.querySelector("[data-reset]").addEventListener("click", resetFilters);

  filterToggle.addEventListener("click", () => {
    const next = filtersPanel.dataset.open !== "true";
    filtersPanel.dataset.open = String(next);
    filterToggle.setAttribute("aria-expanded", String(next));
  });

  productGrid.addEventListener("click", handleProductAction);
  categoryNav.addEventListener("click", handleCategoryAction);
  departmentFilters.addEventListener("change", handleDepartmentFilter);
  activeFilters.addEventListener("click", handleActiveFilter);

  document.querySelector("#feature-action").addEventListener("click", () => openProduct(shopState.selectedId));
  document.querySelector("#dialog-close").addEventListener("click", () => productDialog.close());
  productDialog.addEventListener("click", (event) => {
    if (event.target === productDialog) productDialog.close();
  });
  dialogContent.addEventListener("click", handleProductAction);

  document.querySelector("#cart-button").addEventListener("click", openCart);
  document.querySelector("#cart-close").addEventListener("click", closeCart);
  drawerBackdrop.addEventListener("click", closeCart);
  document.querySelector("#cart-items").addEventListener("click", (event) => {
    const removeButton = event.target.closest("[data-remove-cart]");
    if (!removeButton) return;
    shopState.cart = shopState.cart.filter((id) => id !== removeButton.dataset.removeCart);
    saveCart();
    renderCart();
  });

  document.querySelector("#drop-reminder").addEventListener("click", (event) => {
    event.currentTarget.textContent = "Drop gemerkt";
    event.currentTarget.disabled = true;
  });
}

function renderNavigation() {
  const categories = ["Alle", ...shopState.categories];
  categoryNav.innerHTML = categories.map((category) => `
    <button type="button" data-category="${escapeHtml(category === "Alle" ? "" : category)}" class="${!shopState.department && category === "Alle" ? "active" : ""}">
      ${escapeHtml(category)}
    </button>`).join("");

  departmentFilters.innerHTML = categories.map((category) => {
    const value = category === "Alle" ? "" : category;
    return `<label><input type="radio" name="department" value="${escapeHtml(value)}" ${!value ? "checked" : ""} /> ${escapeHtml(category)}</label>`;
  }).join("");
}

function renderFeature() {
  const section = document.querySelector("#feature-drop");
  const product = shopState.products.find((item) => item.featured)
    || [...shopState.products].sort((left, right) => right.price - left.price)[0];
  if (!product) {
    section.hidden = true;
    return;
  }

  shopState.selectedId = product.id;
  section.hidden = false;
  section.style.backgroundImage = `url("${cssUrl(product.image)}")`;
  document.querySelector("#feature-kicker").textContent = product.badge === "Vorschau" ? "Vorschau auf den ersten Drop" : product.badge;
  document.querySelector("#feature-title").textContent = product.title;
  document.querySelector("#feature-copy").textContent = `${product.condition} · ${euro.format(product.price)} · ${product.department}`;
}

function renderCatalog() {
  const products = filteredProducts();
  catalogStatus.textContent = shopState.preview
    ? `${products.length} Vorschau-Artikel · noch nicht kaufbar`
    : `${products.length} ${products.length === 1 ? "Einzelstück" : "Einzelstücke"}`;

  productGrid.innerHTML = products.map(productCard).join("");
  productGrid.hidden = products.length === 0;
  emptyState.hidden = products.length !== 0;
  renderActiveFilters();
}

function filteredProducts() {
  const query = normalize(shopState.query);
  const [minimum, maximum] = shopState.price
    ? shopState.price.split("-").map(Number)
    : [0, Number.POSITIVE_INFINITY];
  const products = shopState.products.filter((product) => {
    const haystack = normalize([product.title, product.category, product.department, product.franchise, product.condition].join(" "));
    const matchesQuery = !query || query.split(" ").every((part) => haystack.includes(part));
    const matchesDepartment = !shopState.department || product.department === shopState.department;
    const condition = normalize(product.condition);
    const matchesCondition = !shopState.condition
      || (shopState.condition === "gut" && /(neu|sehr gut|gut)/.test(condition))
      || (shopState.condition === "gebraucht" && condition.includes("gebraucht"))
      || (shopState.condition === "prüfen" && condition.includes("prüfen"));
    return matchesQuery && matchesDepartment && matchesCondition && product.price >= minimum && product.price < maximum;
  });

  return products.sort((left, right) => {
    if (shopState.sort === "price-asc") return left.price - right.price;
    if (shopState.sort === "price-desc") return right.price - left.price;
    if (shopState.sort === "title") return left.title.localeCompare(right.title, "de");
    return String(right.publishedAt || "").localeCompare(String(left.publishedAt || ""));
  });
}

function productCard(product) {
  const action = product.purchasable
    ? `<button class="quick-buy" type="button" data-add-cart="${product.id}">In den Warenkorb</button>`
    : `<button class="details-button" type="button" data-product="${product.id}">Details</button>`;
  return `<article class="product-card">
    <button class="product-image" type="button" data-product="${product.id}" aria-label="${escapeHtml(product.title)} ansehen">
      <img src="${escapeHtml(validImage(product.image))}" alt="${escapeHtml(product.title)}" loading="lazy" />
      <span class="product-badge">${escapeHtml(product.badge)}</span>
    </button>
    <div class="product-copy">
      <p>${escapeHtml(product.department)}${product.franchise ? ` · ${escapeHtml(product.franchise)}` : ""}</p>
      <button class="product-title" type="button" data-product="${product.id}">${escapeHtml(product.title)}</button>
      <span class="condition-line">${escapeHtml(product.condition)}</span>
      <div class="product-bottom"><strong>${euro.format(product.price)}</strong>${action}</div>
    </div>
  </article>`;
}

function renderActiveFilters() {
  const filters = [];
  if (shopState.query) filters.push({ key: "query", label: `Suche: ${shopState.query}` });
  if (shopState.department) filters.push({ key: "department", label: shopState.department });
  if (shopState.condition) filters.push({ key: "condition", label: `Zustand: ${shopState.condition}` });
  if (shopState.price) filters.push({ key: "price", label: shopState.price === "0-25" ? "Unter 25 €" : shopState.price === "25-60" ? "25 bis 60 €" : "Über 60 €" });
  activeFilters.innerHTML = filters.map((filter) => `<button type="button" data-clear-filter="${filter.key}">${escapeHtml(filter.label)} <span aria-hidden="true">×</span></button>`).join("");
  activeFilters.hidden = filters.length === 0;
}

function handleProductAction(event) {
  const productButton = event.target.closest("[data-product]");
  const addButton = event.target.closest("[data-add-cart]");
  if (productButton) openProduct(productButton.dataset.product);
  if (addButton) addToCart(addButton.dataset.addCart);
}

function openProduct(id) {
  const product = shopState.products.find((item) => item.id === id);
  if (!product) return;
  shopState.selectedId = id;
  const action = product.purchasable
    ? `<button class="dialog-buy" type="button" data-add-cart="${product.id}">In den Warenkorb</button>`
    : `<button class="dialog-buy" type="button" disabled>Noch nicht im Verkauf</button>`;
  const attributes = product.attributes.length
    ? `<dl>${product.attributes.map((attribute) => {
      const [label, ...rest] = attribute.split(":");
      return `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(rest.join(":").trim() || "–")}</dd></div>`;
    }).join("")}</dl>`
    : "";

  dialogContent.innerHTML = `<div class="dialog-layout">
    <div class="dialog-image"><img src="${escapeHtml(validImage(product.image))}" alt="${escapeHtml(product.title)}" /></div>
    <div class="dialog-details">
      <p>${escapeHtml(product.department)}${product.franchise ? ` · ${escapeHtml(product.franchise)}` : ""}</p>
      <h2 id="dialog-title">${escapeHtml(product.title)}</h2>
      <div class="dialog-price"><strong>${euro.format(product.price)}</strong><span>${escapeHtml(product.badge)}</span></div>
      <section><h3>Zustand</h3><p>${escapeHtml(product.condition)}</p></section>
      <section><h3>Lieferumfang</h3><p>${escapeHtml(product.completeness)}</p></section>
      <section><h3>Beschreibung</h3><p>${escapeHtml(product.description)}</p></section>
      ${attributes}
      ${action}
    </div>
  </div>`;
  productDialog.showModal();
}

function handleCategoryAction(event) {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  shopState.department = button.dataset.category;
  syncDepartmentControls();
  renderCatalog();
  document.querySelector("#catalog").scrollIntoView({ behavior: "smooth", block: "start" });
}

function handleDepartmentFilter(event) {
  if (event.target.name !== "department") return;
  shopState.department = event.target.value;
  syncDepartmentControls();
  renderCatalog();
}

function syncDepartmentControls() {
  categoryNav.querySelectorAll("[data-category]").forEach((button) => button.classList.toggle("active", button.dataset.category === shopState.department));
  const radio = departmentFilters.querySelector(`input[value="${CSS.escape(shopState.department)}"]`);
  if (radio) radio.checked = true;
}

function handleActiveFilter(event) {
  const button = event.target.closest("[data-clear-filter]");
  if (!button) return;
  const key = button.dataset.clearFilter;
  shopState[key] = "";
  if (key === "query") document.querySelector("#shop-search-input").value = "";
  if (key === "department") syncDepartmentControls();
  if (key === "condition") document.querySelector('input[name="condition"][value=""]').checked = true;
  if (key === "price") document.querySelector('input[name="price"][value=""]').checked = true;
  renderCatalog();
}

function resetFilters() {
  shopState.query = "";
  shopState.department = "";
  shopState.condition = "";
  shopState.price = "";
  document.querySelector("#shop-search-input").value = "";
  document.querySelector('input[name="condition"][value=""]').checked = true;
  document.querySelector('input[name="price"][value=""]').checked = true;
  syncDepartmentControls();
  renderCatalog();
}

function addToCart(id) {
  const product = shopState.products.find((item) => item.id === id && item.purchasable);
  if (!product || shopState.cart.includes(id)) return;
  shopState.cart.push(id);
  saveCart();
  renderCart();
  if (productDialog.open) productDialog.close();
  openCart();
}

function renderCart() {
  const products = shopState.cart.map((id) => shopState.products.find((item) => item.id === id)).filter(Boolean);
  document.querySelector("#cart-count").textContent = String(products.length);
  document.querySelector("#cart-items").innerHTML = products.length
    ? products.map((product) => `<article class="cart-line"><img src="${escapeHtml(validImage(product.image))}" alt="" /><div><strong>${escapeHtml(product.title)}</strong><span>${euro.format(product.price)}</span></div><button type="button" data-remove-cart="${product.id}" title="Entfernen" aria-label="${escapeHtml(product.title)} entfernen">×</button></article>`).join("")
    : `<div class="cart-empty"><strong>Noch nichts ausgewählt.</strong><span>Jedes Stück ist nur einmal verfügbar.</span></div>`;
  document.querySelector("#cart-total").textContent = euro.format(products.reduce((total, product) => total + product.price, 0));
}

function openCart() {
  cartDrawer.setAttribute("aria-hidden", "false");
  drawerBackdrop.hidden = false;
  document.body.classList.add("drawer-open");
}

function closeCart() {
  cartDrawer.setAttribute("aria-hidden", "true");
  drawerBackdrop.hidden = true;
  document.body.classList.remove("drawer-open");
}

function loadCart() {
  try {
    const value = JSON.parse(localStorage.getItem("ramrod-shop-cart") || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem("ramrod-shop-cart", JSON.stringify(shopState.cart));
}

function normalize(value) {
  return String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function validImage(value) {
  const image = String(value || "").trim();
  if (/^(https?:\/\/|\/|imports\/)/i.test(image)) return image.startsWith("imports/") ? `/${image}` : image;
  return "/app/assets/ramrod-icon-512.png";
}

function cssUrl(value) {
  return validImage(value).replace(/["\\\n\r]/g, "");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}
