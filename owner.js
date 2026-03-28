const API_BASE = window.location.origin.includes("localhost:5000") ? "" : "http://localhost:5000";

function currency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function setStatus(element, text, type = "info") {
  if (!element) return;
  element.textContent = text;
  if (type === "success") element.style.color = "#0f9d58";
  else if (type === "error") element.style.color = "#d92d20";
  else element.style.color = "#667085";
}

function getOwnerSession() {
  try {
    const raw = localStorage.getItem("ownerSession");
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function setOwnerSession(user) {
  localStorage.setItem("ownerSession", JSON.stringify({
    id: user.id,
    name: user.name,
    email: user.email,
    supplierId: user.supplierId
  }));
}

function clearOwnerSession() {
  localStorage.removeItem("ownerSession");
}

async function authRequest(path, payload) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const rawText = await response.text();
  let data = null;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch (error) {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.message || rawText || "Authentication failed.");
  }

  return data;
}

function bootOwnerLoginPage() {
  const refs = {
    title: document.getElementById("ownerAuthTitle"),
    signInBtn: document.getElementById("ownerSignInTabBtn"),
    signUpBtn: document.getElementById("ownerSignUpTabBtn"),
    form: document.getElementById("ownerAuthForm"),
    submit: document.getElementById("ownerAuthSubmitBtn"),
    status: document.getElementById("ownerAuthStatus"),
    nameRow: document.getElementById("ownerNameRow"),
    supplierRow: document.getElementById("ownerSupplierRow"),
    name: document.getElementById("ownerName"),
    supplier: document.getElementById("ownerSupplier"),
    email: document.getElementById("ownerEmail"),
    password: document.getElementById("ownerPassword")
  };

  const existing = getOwnerSession();
  if (existing?.id) {
    window.location.href = "/owner-dashboard.html";
    return;
  }

  let mode = "signin";
  const syncMode = () => {
    const isSignIn = mode === "signin";
    refs.title.textContent = isSignIn ? "Owner Sign In" : "Owner Sign Up";
    refs.submit.textContent = isSignIn ? "Sign In" : "Create Owner Account";
    refs.nameRow.classList.toggle("hidden", isSignIn);
    refs.supplierRow.classList.toggle("hidden", isSignIn);
    refs.signInBtn.classList.toggle("active", isSignIn);
    refs.signUpBtn.classList.toggle("active", !isSignIn);
    refs.signInBtn.setAttribute("aria-selected", String(isSignIn));
    refs.signUpBtn.setAttribute("aria-selected", String(!isSignIn));
  };

  refs.signInBtn.addEventListener("click", () => {
    mode = "signin";
    syncMode();
    setStatus(refs.status, "");
  });

  refs.signUpBtn.addEventListener("click", () => {
    mode = "signup";
    syncMode();
    setStatus(refs.status, "");
  });

  refs.form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = refs.email.value.trim();
    const password = refs.password.value.trim();
    const name = refs.name.value.trim();
    const supplierId = refs.supplier.value;

    if (!email || !password) {
      setStatus(refs.status, "Email and password are required.", "error");
      return;
    }

    if (mode === "signup") {
      if (!name) {
        setStatus(refs.status, "Name is required for owner sign up.", "error");
        return;
      }
      if (!supplierId) {
        setStatus(refs.status, "Please select your water plant.", "error");
        return;
      }
    }

    refs.submit.disabled = true;

    try {
      const payload = mode === "signup"
        ? { name, email, password, role: "owner", supplierId }
        : { email, password, role: "owner" };
      const path = mode === "signup" ? "/api/auth/signup" : "/api/auth/signin";

      const result = await authRequest(path, payload);
      setOwnerSession(result.user);
      setStatus(refs.status, result.message || "Authentication successful.", "success");
      window.location.href = "/owner-dashboard.html";
    } catch (error) {
      setStatus(refs.status, error.message || "Owner authentication failed.", "error");
    } finally {
      refs.submit.disabled = false;
    }
  });

  syncMode();
}

async function loadOwnerDashboard(ownerId) {
  const response = await fetch(`${API_BASE}/api/owners/dashboard?ownerId=${encodeURIComponent(ownerId)}`);
  const rawText = await response.text();

  let data = null;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch (error) {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.message || rawText || "Unable to load owner dashboard.");
  }

  return data;
}

function renderOwnerStats(container, stats) {
  const statItems = [
    { label: "Total Orders", value: stats.totalOrders },
    { label: "Paid Orders", value: stats.paidOrders },
    { label: "Pending", value: stats.pendingOrders },
    { label: "Revenue", value: currency(stats.totalRevenue) }
  ];

  container.innerHTML = statItems
    .map((item) => `
      <div class="stat-card">
        <h3>${item.label}</h3>
        <p>${item.value}</p>
      </div>
    `)
    .join("");
}

function renderOwnerOrders(tableBody, orders) {
  tableBody.innerHTML = "";

  if (!orders.length) {
    const row = document.createElement("tr");
    row.innerHTML = '<td colspan="11" class="muted">No orders yet for your plant.</td>';
    tableBody.appendChild(row);
    return;
  }

  orders.forEach((order) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${order.bookingId}</td>
      <td>${order.customerName}</td>
      <td>${order.deliveryDate}</td>
      <td>${order.timeSlot}</td>
      <td>${order.phone}</td>
      <td>${order.address}</td>
      <td>${order.quantity ?? "-"}</td>
      <td>${currency(order.amount)}</td>
      <td>${order.paymentMethod}</td>
      <td>${order.transactionId}</td>
      <td>${order.paymentStatus}</td>
    `;
    tableBody.appendChild(row);
  });
}

function bootOwnerDashboardPage() {
  const refs = {
    welcome: document.getElementById("ownerWelcomeText"),
    stats: document.getElementById("ownerStatsGrid"),
    tableBody: document.getElementById("ownerOrdersBody"),
    status: document.getElementById("ownerDashboardStatus"),
    refreshBtn: document.getElementById("refreshOwnerBtn"),
    logoutBtn: document.getElementById("ownerLogoutBtn")
  };

  const ownerSession = getOwnerSession();
  if (!ownerSession?.id) {
    window.location.href = "/owner-login.html";
    return;
  }

  refs.welcome.textContent = `${ownerSession.name} (${ownerSession.supplierId}) • Private order panel`;

  const fetchAndRender = async () => {
    setStatus(refs.status, "Loading your orders...");
    try {
      const dashboard = await loadOwnerDashboard(ownerSession.id);
      renderOwnerStats(refs.stats, dashboard.stats);
      renderOwnerOrders(refs.tableBody, dashboard.orders);
      setStatus(refs.status, `Loaded ${dashboard.orders.length} order(s).`, "success");
    } catch (error) {
      setStatus(refs.status, error.message || "Could not load dashboard.", "error");
      if (String(error.message || "").toLowerCase().includes("not authorized")) {
        clearOwnerSession();
        window.location.href = "/owner-login.html";
      }
    }
  };

  refs.refreshBtn.addEventListener("click", fetchAndRender);
  refs.logoutBtn.addEventListener("click", () => {
    clearOwnerSession();
    window.location.href = "/owner-login.html";
  });

  fetchAndRender();
}

if (document.getElementById("ownerAuthForm")) {
  bootOwnerLoginPage();
} else if (document.getElementById("ownerOrdersBody")) {
  bootOwnerDashboardPage();
}
