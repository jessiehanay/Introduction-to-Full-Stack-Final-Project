document.getElementById("registration-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("reg-username").value.trim();
  const password = document.getElementById("reg-password").value;
  const confirm = document.getElementById("reg-confirm").value;
  const statusEl = document.getElementById("reg-status");

  if (!username || !password || !confirm) {
    statusEl.innerText = "Please fill all fields";
    statusEl.className = "err";
    return;
  }

  if (password !== confirm) {
    statusEl.innerText = "Passwords do not match";
    statusEl.className = "err";
    return;
  }

  // Calling to server API: register:
  try {
    const res = await fetch("/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const text = await res.text();
    statusEl.innerText = text;
    statusEl.className = res.ok ? "ok" : "err";

    if (res.ok) {
      // If registration is successful- redirect the user to home page after 700 milliseconds:
      setTimeout(() => (window.location.href = "/"), 700);
    }
  } catch (err) {
    statusEl.innerText = "Network error";
    statusEl.className = "err";
  }
});