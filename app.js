// ===== Configuration =====
const API_BASE = "http://localhost:8080/api";   // change to your deployed backend URL
const CART_KEY = "ecoway-cart";
const CURRENCY = "EGP";
const MAX_QTY = 50;                              // single place for the quantity cap
const SHIPPING_FEE = 70;                         // EGP, added to every order

const CATEGORY_LABELS = {
  soap: "صابون 🧼",
  towels: "فوط 🧻",
  perfume: "عطور 🌸",
  gloves: "قفازات وإسفنج 🧤",
  cleaning: "منظفات 🫧",
  care: "العناية الشخصية 💆",
  bags: "شنط 👜",
  offers: "عروض 🎁",
};

// ===== State =====
let products = [];
let activeCategory = "all";
let cart = loadCart();                            // Map: productId -> quantity
let sending = false;

// ===== DOM refs =====
const $ = (id) => document.getElementById(id);
const grid = $("grid");
const statusEl = $("status");
const searchInput = $("search");
const resultCount = $("resultCount");
const cartEl = $("cart");
const cartItems = $("cartItems");
const cartTotal = $("cartTotal");
const cartCount = $("cartCount");
const checkoutForm = $("checkout");
const waLink = $("waLink");
const waHint = $("waHint");
const sentBox = $("sentBox");
const formError = $("formError");
const overlay = $("overlay");

// ===== Helpers =====
function formatPrice(value) {
  return Number(value).toFixed(2) + " " + CURRENCY;
}

function loadCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY) || "{}");
    return new Map(Object.entries(raw).map(([id, qty]) => [Number(id), Number(qty)]));
  } catch {
    return new Map();
  }
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(Object.fromEntries(cart)));
}

function productById(id) {
  return products.find((p) => p.id === id);
}

// ===== Products (from the API) =====
async function loadProducts() {
  try {
    const res = await fetch(`${API_BASE}/products`);
    if (!res.ok) throw new Error("HTTP " + res.status);
    products = await res.json();
    statusEl.remove();
    renderCategories();
    renderProducts();
  } catch {
    statusEl.textContent = "تعذر تحميل المنتجات. تأكد إن السيرفر شغال.";
    statusEl.classList.add("error");
  }
  renderCart();                                   // products are needed to price the saved cart
}

function renderCategories() {
  const nav = $("categories");
  const make = (key, label, count) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "cat-chip" + (activeCategory === key ? " active" : "");
    b.textContent = `${label} (${count})`;
    b.addEventListener("click", () => {
      activeCategory = key;
      renderCategories();
      renderProducts();
    });
    return b;
  };
  const counts = {};
  for (const p of products) counts[p.category] = (counts[p.category] || 0) + 1;

  const chips = [make("all", "الكل", products.length)];
  for (const key of Object.keys(CATEGORY_LABELS)) {
    if (counts[key]) chips.push(make(key, CATEGORY_LABELS[key], counts[key]));
  }
  nav.replaceChildren(...chips);
}

function renderProducts() {
  const query = searchInput.value.trim().toLowerCase();
  const list = products.filter((p) =>
    (activeCategory === "all" || p.category === activeCategory) &&
    p.name.toLowerCase().includes(query)
  );

  resultCount.textContent = `${list.length} منتج`;
  grid.replaceChildren(...list.map(createProductCard));
}

function createProductCard(p) {
  const card = document.createElement("article");
  card.className = "product";

  const thumb = document.createElement("div");
  thumb.className = "thumb";
  if (p.image) {
    const img = document.createElement("img");
    img.src = p.image;
    img.alt = p.name;
    img.loading = "lazy";
    thumb.appendChild(img);
  } else {
    thumb.textContent = "بدون صورة";
  }

  const title = document.createElement("h3");
  title.textContent = p.name;

  const prices = document.createElement("div");
  prices.className = "prices";
  const price = document.createElement("span");
  price.className = "price";
  price.textContent = formatPrice(p.price);
  prices.appendChild(price);

  if (p.oldPrice) {
    const old = document.createElement("span");
    old.className = "old-price";
    old.textContent = formatPrice(p.oldPrice);
    const tag = document.createElement("span");
    tag.className = "sale-tag";
    tag.textContent = "عرض";
    prices.append(old, tag);
  }

  const btn = document.createElement("button");
  btn.className = "add-btn";
  btn.textContent = "أضف للسلة";
  btn.addEventListener("click", () => addToCart(p.id, card));

  card.append(thumb, title, prices, btn);
  return card;
}

// ===== Cart =====
// The only place quantities are written. Enforces the cap and removes zero/negative quantities.
function setQty(id, qty) {
  if (qty <= 0) cart.delete(id);
  else cart.set(id, Math.min(qty, MAX_QTY));
  saveCart();
  renderCart();
}

function addToCart(id, sourceCard) {
  setQty(id, (cart.get(id) || 0) + 1);
  const p = productById(id);
  if (p) showAddedPopup(p);
  if (sourceCard) flyToCart(sourceCard);
  bumpCartButton();
}

function changeQty(id, delta) {
  setQty(id, (cart.get(id) || 0) + delta);
}

function removeFromCart(id) {
  setQty(id, 0);
}

function renderCart() {
  cartItems.replaceChildren();
  let total = 0;
  let count = 0;

  if (cart.size === 0) {
    const empty = document.createElement("p");
    empty.className = "cart-empty";
    empty.textContent = "السلة فاضية";
    cartItems.appendChild(empty);
  }

  for (const [id, qty] of cart) {
    const p = productById(id);
    if (!p) continue;
    total += p.price * qty;
    count += qty;

    const line = document.createElement("div");
    line.className = "cart-line";

    if (p.image) {
      const thumb = document.createElement("img");
      thumb.className = "cart-thumb";
      thumb.src = p.image;
      thumb.alt = "";
      line.appendChild(thumb);
    }

    const info = document.createElement("div");
    info.className = "cart-info";

    const name = document.createElement("div");
    name.className = "name";
    name.textContent = p.name;

    const sub = document.createElement("div");
    sub.className = "sub";
    sub.textContent = formatPrice(p.price * qty);

    const controls = document.createElement("div");
    controls.className = "cart-controls";

    const minus = document.createElement("button");
    minus.className = "qty-btn";
    minus.type = "button";
    minus.textContent = "−";
    minus.setAttribute("aria-label", "تقليل الكمية");
    minus.addEventListener("click", () => changeQty(id, -1));

    const num = document.createElement("span");
    num.className = "qty-num";
    num.textContent = qty;

    const plus = document.createElement("button");
    plus.className = "qty-btn";
    plus.type = "button";
    plus.textContent = "+";
    plus.setAttribute("aria-label", "زيادة الكمية");
    plus.addEventListener("click", () => changeQty(id, 1));

    const remove = document.createElement("button");
    remove.className = "remove-btn";
    remove.type = "button";
    remove.textContent = "🗑 حذف";
    remove.setAttribute("aria-label", "حذف المنتج من السلة");
    remove.addEventListener("click", () => removeFromCart(id));

    controls.append(minus, num, plus, remove);
    info.append(name, sub, controls);
    line.appendChild(info);
    cartItems.appendChild(line);
  }

  const grand = total > 0 ? total + SHIPPING_FEE : 0;
  cartTotal.textContent = formatPrice(grand);
  cartCount.textContent = count;
  updateSendButton();
}

// ===== Add-to-cart feedback =====
function showAddedPopup(p) {
  document.querySelectorAll(".toast").forEach((el) => el.remove());

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");

  if (p.image) {
    const img = document.createElement("img");
    img.src = p.image;
    img.alt = "";
    toast.appendChild(img);
  }

  const text = document.createElement("div");
  const title = document.createElement("strong");
  title.textContent = "تمت الإضافة للسلة ✓";
  const name = document.createElement("span");
  name.textContent = p.name;
  text.append(title, name);
  toast.appendChild(text);

  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2200);
}

function flyToCart(card) {
  const img = card.querySelector("img");
  const from = (img || card).getBoundingClientRect();
  const to = $("cartToggle").getBoundingClientRect();

  const ghost = document.createElement("div");
  ghost.className = "fly";
  if (img) ghost.appendChild(img.cloneNode());
  ghost.style.left = from.left + "px";
  ghost.style.top = from.top + "px";
  ghost.style.width = from.width + "px";
  ghost.style.height = from.height + "px";
  document.body.appendChild(ghost);

  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);

  ghost.animate(
    [
      { transform: "translate(0, 0) scale(1)", opacity: 1 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.15)`, opacity: 0.2 },
    ],
    { duration: 700, easing: "cubic-bezier(0.5, -0.2, 0.6, 1)" }
  ).onfinish = () => ghost.remove();
}

function bumpCartButton() {
  const btn = $("cartToggle");
  btn.classList.remove("bump");
  void btn.offsetWidth;
  btn.classList.add("bump");
}

// ===== Checkout: send the order through the API =====
function getCustomer() {
  const data = new FormData(checkoutForm);
  return {
    name: data.get("name").trim(),
    email: data.get("email").trim(),
    phone: data.get("phone").trim(),
    address: data.get("address").trim(),
  };
}

function isFormValid() {
  const c = getCustomer();
  return Boolean(c.name && c.email && c.address && checkoutForm.checkValidity());
}

function updateSendButton() {
  const ready = cart.size > 0 && isFormValid() && !sending;
  waLink.classList.toggle("disabled", !ready);
  waLink.setAttribute("aria-disabled", String(!ready));

  if (sending) waHint.textContent = "جاري تجهيز الطلب...";
  else if (cart.size === 0) waHint.textContent = "أضف منتجات للسلة الأول";
  else if (!isFormValid()) waHint.textContent = "اكمل بيانات الطلب عشان تقدر تبعته";
  else waHint.textContent = "تمام! اضغط الزرار عشان تبعت الطلب";
}

waLink.addEventListener("click", async (event) => {
  event.preventDefault();
  if (waLink.classList.contains("disabled") || sending) return;

  sending = true;
  formError.textContent = "";
  updateSendButton();

  // Open a blank window synchronously, inside the click, so browsers don't block it.
  const pending = window.open("", "_blank");

  const payload = {
    ...getCustomer(),
    items: [...cart].map(([productId, quantity]) => ({ productId, quantity })),
  };

  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.whatsappUrl) throw new Error(data.error || "order-failed");

    if (pending) {
      pending.location.href = data.whatsappUrl;
      pending.opener = null;
    } else {
      window.location.href = data.whatsappUrl;    // popup was blocked: use this tab
    }
    sentBox.hidden = false;                       // the cart stays until the customer confirms
  } catch {
    if (pending) pending.close();
    formError.textContent = "حصلت مشكلة في إرسال الطلب، تأكد من البيانات وحاول تاني";
  } finally {
    sending = false;
    updateSendButton();
  }
});

$("orderSentYes").addEventListener("click", () => {
  sentBox.hidden = true;
  cart.clear();
  saveCart();
  renderCart();
});

$("orderSentNo").addEventListener("click", () => {
  sentBox.hidden = true;
});

checkoutForm.addEventListener("input", updateSendButton);

// ===== Cart drawer: open / close =====
function openCart() {
  cartEl.classList.add("open");
  overlay.classList.add("show");
}

function closeCart() {
  cartEl.classList.remove("open");
  overlay.classList.remove("show");
}

$("cartToggle").addEventListener("click", openCart);
$("closeCart").addEventListener("click", closeCart);
overlay.addEventListener("click", closeCart);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeCart();
});

// ===== Logo: back to top =====
$("homeLink").addEventListener("click", (event) => {
  event.preventDefault();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// ===== Search =====
searchInput.addEventListener("input", renderProducts);

// ===== Start =====
loadProducts();
