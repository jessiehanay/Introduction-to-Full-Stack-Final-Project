const statusEl = document.getElementById("status");
const titleEl = document.getElementById("page-title");
const messagesEl = document.getElementById("messages");


// Functions //

function setStatus(message, ok) {
  statusEl.innerText = message;
  statusEl.className = ok ? "ok" : "err";
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Function to get messages and write them in HTML page:
function renderMessages(text) {
  const lines = String(text || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return '<p class="muted">No messages.</p>';

  // Expected format: "Datetime username: message":
  return (
    "<ul>" +
    lines
      .map((line) => {
        const idx = line.indexOf(":");
        if (idx === -1) return `<li>${escapeHtml(line)}</li>`;

        const left = line.slice(0, idx);
        const right = line.slice(idx + 1);

        const tokens = left.trim().split(/\s+/);
        const username = tokens.length ? tokens[tokens.length - 1] : "";
        const datetime = tokens.slice(0, -1).join(" ");

        return `<li>${escapeHtml(datetime)} <strong>${escapeHtml(
          username
        )}</strong>: ${escapeHtml(right.trim())}</li>`;
      })
      .join("") +
    "</ul>"
  );
}

// Function to get messages by username:
async function fetchUserMessages(username) {
  setStatus("Loading...", true);
  try {
    // Calling to server API: mypage with username:
    const res = await fetch(`/mypage?username=${encodeURIComponent(username)}`);
    const text = await res.text();

    if (!res.ok) {
      setStatus(text || "Failed to load messages", false);
      messagesEl.innerHTML = "";
      return;
    }

    setStatus("Loaded", true);
    messagesEl.innerHTML = renderMessages(text);
  } catch (err) {
    setStatus("Network error while loading", false);
    messagesEl.innerHTML = "";
  }
}

// Function to create new message:
async function postMessage(username, message) {
  setStatus("Posting...", true);
  try {
    // Calling to server API: post-message (create new message):
    const res = await fetch("/post-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, message }),
    });

    const text = await res.text();
    if (!res.ok) {
      setStatus(text || "Failed to post message", false);
      return false;
    }

    setStatus(text || "Message posted", true);
    return true;
  } catch (err) {
    setStatus("Network error while posting", false);
    return false;
  }
}

// Function to get all messages:
async function fetchAllMessages() {
  setStatus("Loading all messages...", true);
  try {
    // Calling to server API: messages/all (get last 50 messages):
    const res = await fetch("/messages/all");
    const text = await res.text();

    if (!res.ok) {
      setStatus(text || "Failed to load all messages", false);
      messagesEl.innerHTML = "";
      return;
    }

    setStatus("Loaded", true);
    messagesEl.innerHTML = renderMessages(text);
  } catch (err) {
    setStatus("Network error while loading all messages", false);
    messagesEl.innerHTML = "";
  }
}

// Main //

// Get current user from local storage:
const currentUser = localStorage.getItem("username");

if (!currentUser) {
  titleEl.innerText = "No user is logged in";
  setStatus("Please sign in first", false);
} else {
  titleEl.innerText = `This is ${currentUser} page`;
  fetchUserMessages(currentUser);
}

document.getElementById("post-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!currentUser) {
    setStatus("Please sign in first", false);
    return;
  }

  const input = document.getElementById("message-input");
  const message = input.value.trim();

  if (!message) {
    setStatus("Message cannot be empty", false);
    return;
  }

  const ok = await postMessage(currentUser, message);
  if (ok) {
    input.value = "";
    fetchUserMessages(currentUser);
  }
});

document.getElementById("other-user-form").addEventListener("submit", (e) => {
  e.preventDefault();

  const other = document.getElementById("other-username").value.trim();
  if (!other) {
    setStatus("Please enter a username", false);
    return;
  }

  fetchUserMessages(other);
});

document.getElementById("all-messages-btn").addEventListener("click", () => {
  fetchAllMessages();
});