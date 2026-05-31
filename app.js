document.getElementById("sign-in").addEventListener("submit", async (e) => {
  e.preventDefault();

  const password = document.getElementById("password").value;
  const username = document.getElementById("username").value.trim();
  const statusEl = document.getElementById("status");

  if (!username || !password) {
    statusEl.innerText = "Please fill username and password";
    statusEl.className = "err";
    return;
  }

  // Calling server API: sign-in:
  try {
    const res = await fetch("/sign-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const text = await res.text();
    statusEl.innerText = text;
    statusEl.className = res.ok ? "ok" : "err";

    // If sign-in is successful:
    if (res.ok) {
      // Store username in local storage:
      localStorage.setItem("username", username);

      // Redirect the user to mypage:
      window.location.href = "/mypage.html";
    }
  } catch (err) {
    statusEl.innerText = "Network error";
    statusEl.className = "err";
  }
});