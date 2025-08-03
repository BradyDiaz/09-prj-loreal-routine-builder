const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const selectedList = document.getElementById("selectedProductsList");
const generateBtn = document.getElementById("generateRoutine");
const clearBtn = document.getElementById("clearSelection");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const userInput = document.getElementById("userInput");

// Modal elements
const modal = document.getElementById("productModal");
const modalImage = document.getElementById("modalImage");
const modalName = document.getElementById("modalName");
const modalBrand = document.getElementById("modalBrand");
const modalDesc = document.getElementById("modalDesc");
const closeModal = document.querySelector(".close-modal");

let selectedProducts =
  JSON.parse(localStorage.getItem("selectedProducts")) || [];
let allProducts = [];
const messages = [
  {
    role: "system",
    content:
      "You are a L’Oréal skincare and beauty assistant. Based on selected products, give a tailored skincare or beauty routine. Be concise and user-friendly.",
  },
];

// Append message to chat (unchanged)
function appendMessage(sender, text, isLoading = false) {
  const wrapper = document.createElement("div");
  wrapper.className = `msg ${sender}`;
  const label = document.createElement("div");
  label.className = "sender";
  label.textContent = sender === "user" ? "You" : "L’Oréal Chatbot";
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  wrapper.append(label, bubble);
  if (isLoading) wrapper.classList.add("loading");
  chatWindow.appendChild(wrapper);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return wrapper;
}

// Load products from JSON
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  allProducts = data.products;
  return data.products;
}

// Render product cards with description toggle button
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map((p) => {
      const selected = selectedProducts.includes(p.id) ? "selected" : "";
      return `
      <div class="product-card ${selected}" data-id="${p.id}">
        <img src="${p.image}" alt="${p.name}">
        <div class="product-info">
          <h3>${p.name}</h3>
          <p>${p.brand}</p>
          <button class="desc-toggle" data-id="${p.id}">View Description</button>
        </div>
      </div>`;
    })
    .join("");
}

// Update selected product UI
function updateSelectedUI() {
  selectedList.innerHTML = selectedProducts
    .map((id) => {
      const product = allProducts.find((p) => p.id === id);
      return `<div class="selected-item">${product.name}</div>`;
    })
    .join("");
  localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
}

// Handle product card click for selection toggle
productsContainer.addEventListener("click", (e) => {
  // If clicked View Description button -> open modal
  if (e.target.classList.contains("desc-toggle")) {
    const id = parseInt(e.target.dataset.id);
    const product = allProducts.find((p) => p.id === id);
    if (!product) return;

    modalImage.src = product.image;
    modalImage.alt = product.name;
    modalName.textContent = product.name;
    modalBrand.textContent = product.brand;
    modalDesc.textContent = product.description;
    modal.classList.remove("hidden");
    return; // prevent toggling selection when clicking description button
  }

  // Else if clicked product card -> toggle selection
  const card = e.target.closest(".product-card");
  if (!card) return;

  const id = parseInt(card.dataset.id);
  if (selectedProducts.includes(id)) {
    selectedProducts = selectedProducts.filter((pid) => pid !== id);
    card.classList.remove("selected");
  } else {
    selectedProducts.push(id);
    card.classList.add("selected");
  }
  updateSelectedUI();
});

// Close modal handlers
closeModal.addEventListener("click", () => {
  modal.classList.add("hidden");
});

window.addEventListener("click", (e) => {
  if (e.target === modal) modal.classList.add("hidden");
});

// Clear selected products
clearBtn.addEventListener("click", () => {
  selectedProducts = [];
  updateSelectedUI();
  document.querySelectorAll(".product-card.selected").forEach((card) => {
    card.classList.remove("selected");
  });
});

// Filter products by category (show products only after category chosen)
categoryFilter.addEventListener("change", async (e) => {
  const value = e.target.value;
  const products = await loadProducts();
  const filtered = products.filter((p) => p.category === value);
  displayProducts(filtered);
  updateSelectedUI();
});

// Generate routine (unchanged)
generateBtn.addEventListener("click", async () => {
  if (selectedProducts.length === 0) {
    appendMessage("ai", "⚠️ Select products before generating a routine.");
    return;
  }

  const selectedData = selectedProducts
    .map((id) => allProducts.find((p) => p.id === id))
    .map((p) => `${p.name} by ${p.brand}`);

  const intro = `The user has selected the following L’Oréal products: ${selectedData.join(
    ", "
  )}. Build a beauty routine using only these products.`;
  messages.push({ role: "user", content: intro });

  const loadingEl = appendMessage("ai", "Building your routine...", true);

  try {
    const response = await fetch(
      "https://loreal-chattin.bradydiaz13.workers.dev/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      }
    );

    const data = await response.json();
    const reply = data.choices[0].message.content;
    messages.push({ role: "assistant", content: reply });
    loadingEl.remove();
    appendMessage("ai", reply);
  } catch (err) {
    loadingEl.remove();
    appendMessage("ai", "⚠️ Something went wrong. Try again soon.");
    console.error(err);
  }
});

// Chat follow-up (unchanged)
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = userInput.value.trim();
  if (!input) return;
  appendMessage("user", input);
  messages.push({ role: "user", content: input });
  userInput.value = "";
  const loadingEl = appendMessage("ai", "Typing...", true);

  try {
    const response = await fetch(
      "https://loreal-chattin.bradydiaz13.workers.dev/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      }
    );
    const data = await response.json();
    const reply = data.choices[0].message.content;
    messages.push({ role: "assistant", content: reply });
    loadingEl.remove();
    appendMessage("ai", reply);
  } catch (err) {
    loadingEl.remove();
    appendMessage("ai", "⚠️ Something went wrong. Try again soon.");
    console.error(err);
  }
});

// Search input (unchanged)
const searchInput = document.createElement("input");
searchInput.type = "search";
searchInput.placeholder = "Search products...";
searchInput.className = "search-bar";
document.querySelector(".search-section").appendChild(searchInput);

searchInput.addEventListener("input", () => {
  const keyword = searchInput.value.toLowerCase();
  const filtered = allProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(keyword) ||
      p.description.toLowerCase().includes(keyword)
  );
  displayProducts(filtered);
  updateSelectedUI();
});
