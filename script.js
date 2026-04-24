const plans = {
  starter: {
    title: "Starter Order",
    description: "Order one WASSCE or BECE checker PIN for quick individual result access.",
    plan: "Single PIN",
    quantity: 1,
    price: 25,
  },
  single: {
    title: "Single PIN Order",
    description: "Order one WASSCE or BECE checker PIN and receive it through your preferred channel.",
    plan: "Single PIN",
    quantity: 1,
    price: 25,
  },
  double: {
    title: "Double Access Order",
    description: "Order two checker PINs for multiple candidates, exam types, or backup access.",
    plan: "Double Access",
    quantity: 2,
    price: 45,
  },
  bulk: {
    title: "Bulk Order Request",
    description: "Order multiple WASSCE and BECE checker PINs for schools, tutorial centers, or resellers.",
    plan: "Bulk Order",
    quantity: 10,
    price: 20,
    bulk: true,
  },
};

const storageKeys = {
  inventory: "safarobestInventory",
  orders: "safarobestOrders",
  auth: "safarobestAdminUnlocked",
};

const modal = document.getElementById("orderModal");
const modalTitle = document.getElementById("modalTitle");
const modalDescription = document.getElementById("modalDescription");
const selectedPlan = document.getElementById("selectedPlan");
const selectedPlanKey = document.getElementById("selectedPlanKey");
const selectedPrice = document.getElementById("selectedPrice");
const orderForm = document.getElementById("orderForm");
const formFeedback = document.getElementById("formFeedback");
const quantityGroup = document.getElementById("quantityGroup");
const quantityInput = document.getElementById("quantityInput");
const deliveryCard = document.getElementById("deliveryCard");
const deliverySummary = document.getElementById("deliverySummary");
const deliveryPins = document.getElementById("deliveryPins");

const heroAvailablePins = document.getElementById("heroAvailablePins");
const heroDeliveredPins = document.getElementById("heroDeliveredPins");
const stockAvailable = document.getElementById("stockAvailable");
const stockSold = document.getElementById("stockSold");
const ordersTotal = document.getElementById("ordersTotal");
const stockOrdersTotal = document.getElementById("stockOrdersTotal");
const inventoryTableBody = document.getElementById("inventoryTableBody");
const ordersTableBody = document.getElementById("ordersTableBody");

const adminLoginForm = document.getElementById("adminLoginForm");
const adminPassword = document.getElementById("adminPassword");
const adminFeedback = document.getElementById("adminFeedback");
const adminStatus = document.getElementById("adminStatus");
const adminTools = document.getElementById("adminTools");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");

const inventoryForm = document.getElementById("inventoryForm");
const inventoryInput = document.getElementById("inventoryInput");
const inventoryFeedback = document.getElementById("inventoryFeedback");
const seedDemoBtn = document.getElementById("seedDemoBtn");
const clearDataBtn = document.getElementById("clearDataBtn");

const demoPassword = "#AlmightY";

const getInventory = () => {
  const raw = window.localStorage.getItem(storageKeys.inventory);
  return raw ? JSON.parse(raw) : [];
};

const saveInventory = (inventory) => {
  window.localStorage.setItem(storageKeys.inventory, JSON.stringify(inventory));
};

const getOrders = () => {
  const raw = window.localStorage.getItem(storageKeys.orders);
  return raw ? JSON.parse(raw) : [];
};

const saveOrders = (orders) => {
  window.localStorage.setItem(storageKeys.orders, JSON.stringify(orders));
};

const maskPin = (pin) => {
  if (!pin) return "-";
  const value = String(pin);
  if (value.length <= 4) return value;
  return `${"*".repeat(value.length - 4)}${value.slice(-4)}`;
};

const createDemoInventory = () =>
  Array.from({ length: 24 }, (_, index) => ({
    id: `SB-${String(index + 1).padStart(4, "0")}`,
    serial: `SB-${String(index + 1).padStart(4, "0")}`,
    pin: `84561234${String(index + 1).padStart(4, "0")}`,
    status: "available",
    soldAt: null,
    orderId: null,
  }));

const ensureSeedData = () => {
  if (!getInventory().length) {
    saveInventory(createDemoInventory());
  }
};

const renderStats = () => {
  const inventory = getInventory();
  const orders = getOrders();
  const available = inventory.filter((item) => item.status === "available").length;
  const sold = inventory.filter((item) => item.status === "sold").length;

  if (heroAvailablePins) heroAvailablePins.textContent = available;
  if (heroDeliveredPins) heroDeliveredPins.textContent = sold;
  if (stockAvailable) stockAvailable.textContent = available;
  if (stockSold) stockSold.textContent = sold;
  if (ordersTotal) ordersTotal.textContent = orders.length;
  if (stockOrdersTotal) stockOrdersTotal.textContent = orders.length;
};

const renderInventoryTable = () => {
  const inventory = getInventory().slice(-8).reverse();
  if (!inventoryTableBody) return;

  inventoryTableBody.innerHTML = inventory.length
    ? inventory
        .map(
          (item) => `
            <tr>
              <td>${item.serial}</td>
              <td>${maskPin(item.pin)}</td>
              <td><span class="table-status ${item.status === "available" ? "status-available" : "status-sold"}">${item.status}</span></td>
            </tr>
          `
        )
        .join("")
    : `<tr><td colspan="3">No WASSCE or BECE checker PINs uploaded yet.</td></tr>`;
};

const renderOrdersTable = () => {
  const orders = getOrders().slice(-6).reverse();
  if (!ordersTableBody) return;

  ordersTableBody.innerHTML = orders.length
    ? orders
        .map(
          (order) => `
            <tr>
              <td>${order.name}</td>
              <td>${order.plan}${order.examType ? ` (${order.examType})` : ""}</td>
              <td>${order.quantity}</td>
              <td>${order.delivery}</td>
              <td>${order.pins.map((item) => item.serial).join(", ")}</td>
            </tr>
          `
        )
        .join("")
    : `<tr><td colspan="5">No orders yet.</td></tr>`;
};

const renderDashboard = () => {
  renderStats();
  renderInventoryTable();
  renderOrdersTable();
};

const setAdminState = (unlocked) => {
  window.localStorage.setItem(storageKeys.auth, unlocked ? "true" : "false");
  if (adminStatus) {
    adminStatus.textContent = unlocked ? "Unlocked" : "Locked";
    adminStatus.className = `status-pill ${unlocked ? "success-pill" : ""}`;
  }
  if (adminTools) {
    adminTools.classList.toggle("locked-panel", !unlocked);
  }
  if (adminFeedback) {
    adminFeedback.textContent = unlocked
      ? "Admin tools are open on this browser."
      : "Admin tools are locked.";
  }
};

const getAdminState = () => window.localStorage.getItem(storageKeys.auth) === "true";

const renderDeliveryCard = (order) => {
  deliverySummary.innerHTML = `
    <div><strong>Customer</strong><span>${order.name}</span></div>
    <div><strong>Exam</strong><span>${order.examType || "Not specified"}</span></div>
    <div><strong>Plan</strong><span>${order.plan}</span></div>
    <div><strong>Total</strong><span>GHS ${order.total}</span></div>
    <div><strong>Method</strong><span>${order.delivery}</span></div>
  `;

  deliveryPins.innerHTML = order.pins
    .map(
      (item) => `
        <div class="pin-chip">
          <strong>${item.serial}</strong>
          <span>${item.pin}</span>
        </div>
      `
    )
    .join("");

  deliveryCard.classList.remove("hidden-field");
};

const clearDeliveryCard = () => {
  if (!deliveryCard || !deliverySummary || !deliveryPins) return;
  deliveryCard.classList.add("hidden-field");
  deliverySummary.innerHTML = "";
  deliveryPins.innerHTML = "";
};

const openModal = (planKey) => {
  if (!modal || !modalTitle || !modalDescription || !selectedPlan || !selectedPlanKey || !selectedPrice) {
    return;
  }
  const plan = plans[planKey] || plans.single;
  modalTitle.textContent = plan.title;
  modalDescription.textContent = plan.description;
  selectedPlan.value = plan.plan;
  selectedPlanKey.value = planKey;
  selectedPrice.value = String(plan.price);
  quantityInput.value = String(plan.quantity);
  quantityInput.min = plan.bulk ? "10" : String(plan.quantity);
  quantityInput.readOnly = !plan.bulk;
  quantityGroup.classList.toggle("hidden-field", !plan.bulk);
  clearDeliveryCard();
  formFeedback.textContent = "";
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
};

const closeModal = () => {
  if (!modal) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
};

document.querySelectorAll("[data-open-modal]").forEach((button) => {
  button.addEventListener("click", () => openModal(button.dataset.openModal));
});

document.querySelectorAll("[data-close-modal]").forEach((element) => {
  element.addEventListener("click", closeModal);
});

document.addEventListener("keydown", (event) => {
  if (modal && event.key === "Escape" && modal.classList.contains("open")) {
    closeModal();
  }
});

if (orderForm) {
  orderForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(orderForm);
    const name = String(formData.get("name")).trim();
    const planName = String(formData.get("plan"));
    const planKey = String(formData.get("planKey"));
    const price = Number(formData.get("price"));
    const delivery = String(formData.get("delivery"));
    const examType = String(formData.get("examType") || "").trim();
    const quantity = Math.max(1, Number(formData.get("quantity")) || 1);
    const activePlan = plans[planKey] || plans.single;

    const inventory = getInventory();
    const availablePins = inventory.filter((item) => item.status === "available");

    if (availablePins.length < quantity) {
      formFeedback.textContent = `Only ${availablePins.length} checker PIN(s) are available right now. Add more stock in admin to fulfill this order.`;
      clearDeliveryCard();
      return;
    }

    const assigned = availablePins.slice(0, quantity);
    const orderId = `ORD-${Date.now()}`;

    assigned.forEach((pin) => {
      pin.status = "sold";
      pin.soldAt = new Date().toISOString();
      pin.orderId = orderId;
    });

    saveInventory(inventory);

    const order = {
      id: orderId,
      name,
      phone: String(formData.get("phone")).trim(),
      email: String(formData.get("email")).trim(),
      delivery,
      examType,
      notes: String(formData.get("notes")).trim(),
      plan: planName,
      quantity,
      total: activePlan.bulk ? quantity * price : price,
      createdAt: new Date().toISOString(),
      pins: assigned.map((pin) => ({
        serial: pin.serial,
        pin: pin.pin,
      })),
    };

    const orders = getOrders();
    orders.push(order);
    saveOrders(orders);

    renderDashboard();
    renderDeliveryCard(order);

    const examLabel = examType ? `${examType} ` : "";
    formFeedback.textContent = `Order completed for ${name}. ${quantity} ${examLabel}checker PIN(s) assigned successfully.`;
    orderForm.reset();
    selectedPlan.value = planName;
    selectedPlanKey.value = planKey;
    selectedPrice.value = String(price);
    quantityInput.value = "1";
  });
}

if (adminLoginForm) {
  adminLoginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (adminPassword.value === demoPassword) {
      setAdminState(true);
      adminPassword.value = "";
      return;
    }

    setAdminState(false);
    adminFeedback.textContent =
      "Incorrect password. Use the current admin password to unlock the tools.";
  });
}

if (adminLogoutBtn) {
  adminLogoutBtn.addEventListener("click", () => {
    setAdminState(false);
  });
}

if (inventoryForm) {
  inventoryForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!getAdminState()) {
      inventoryFeedback.textContent = "Unlock the admin area before adding checker PINs.";
      return;
    }

    const lines = inventoryInput.value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (!lines.length) {
      inventoryFeedback.textContent = "Enter at least one checker PIN line.";
      return;
    }

    const inventory = getInventory();
    const additions = lines.map((line, index) => {
      const [rawSerial, rawPin] = line.split("|").map((part) => part && part.trim());
      const serial = rawPin ? rawSerial : `SB-${String(Date.now() + index).slice(-6)}`;
      const pin = rawPin || rawSerial;

      return {
        id: `${serial}-${Date.now()}-${index}`,
        serial,
        pin,
        status: "available",
        soldAt: null,
        orderId: null,
      };
    });

    saveInventory([...inventory, ...additions]);
    inventoryInput.value = "";
    inventoryFeedback.textContent = `${additions.length} checker PIN(s) added to inventory.`;
    renderDashboard();
  });
}

if (seedDemoBtn) {
  seedDemoBtn.addEventListener("click", () => {
    if (!getAdminState()) {
      inventoryFeedback.textContent = "Unlock the admin area before loading demo stock.";
      return;
    }

    saveInventory(createDemoInventory());
    saveOrders([]);
    inventoryFeedback.textContent = "Demo checker inventory loaded successfully.";
    renderDashboard();
  });
}

if (clearDataBtn) {
  clearDataBtn.addEventListener("click", () => {
    if (!getAdminState()) {
      inventoryFeedback.textContent = "Unlock the admin area before clearing data.";
      return;
    }

    saveInventory([]);
    saveOrders([]);
    inventoryFeedback.textContent = "All local inventory and order records have been cleared.";
    renderDashboard();
  });
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

document
  .querySelectorAll(
    ".feature-card, .price-card, .step-card, .quote-card, .faq-list details, .admin-card"
  )
  .forEach((element) => {
    element.classList.add("reveal");
    observer.observe(element);
  });

ensureSeedData();
setAdminState(getAdminState());
renderDashboard();
