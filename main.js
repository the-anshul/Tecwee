(function initNavbar() {
  const navbar = document.getElementById("navbar");
  if (!navbar) return;

  const update = () => {
    navbar.classList.toggle("scrolled", window.scrollY > 10);
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
})();

(function initHamburger() {
  const btn = document.getElementById("hamburger");
  const nav = document.getElementById("navLinks");
  if (!btn || !nav) return;

  const close = () => {
    btn.classList.remove("open");
    nav.classList.remove("open");
    document.body.style.overflow = "";
  };

  btn.addEventListener("click", (event) => {
    event.stopPropagation();
    const open = btn.classList.toggle("open");
    nav.classList.toggle("open", open);
    document.body.style.overflow = open ? "hidden" : "";
  });

  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", close));

  document.addEventListener("click", (event) => {
    if (!event.target.closest("#navbar")) close();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 760) close();
  });
})();

(function initContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const label = btn.querySelector("span") || btn;
    const original = label.textContent;

    btn.disabled = true;
    label.textContent = "Sending...";

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: document.getElementById("firstName").value,
          lastName: document.getElementById("lastName").value,
          email: document.getElementById("email").value,
          subject: document.getElementById("subject").value,
          message: document.getElementById("message").value,
        }),
      });

      if (!response.ok) throw new Error("Message could not be sent");

      label.textContent = "Message sent";
      btn.style.background = "#006970";
      form.reset();
    } catch (error) {
      console.error("Submission failed", error);
      label.textContent = "Error sending";
      btn.style.background = "#ba1a1a";
    } finally {
      window.setTimeout(() => {
        label.textContent = original;
        btn.style.background = "";
        btn.disabled = false;
      }, 2600);
    }
  });
})();

(function initLoginForm() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const original = btn.textContent;

    btn.disabled = true;
    btn.textContent = "Signing in...";

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: document.getElementById("loginEmail").value,
          password: document.getElementById("loginPassword").value,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Login failed");

      if (data.user && data.user.role === "admin") {
        localStorage.setItem("tecweeToken", data.token);
        localStorage.setItem("tecweeUser", JSON.stringify(data.user));
        btn.textContent = "Opening dashboard";
        window.location.href = "admin.html";
        return;
      }

      btn.textContent = "Admin access required";
      btn.style.background = "#ba1a1a";
      form.reset();
    } catch (error) {
      console.error("Login error", error);
      btn.textContent = error.message;
      btn.style.background = "#ba1a1a";
    } finally {
      window.setTimeout(() => {
        btn.textContent = original;
        btn.style.background = "";
        btn.disabled = false;
      }, 2400);
    }
  });
})();

(function initRegisterForm() {
  const form = document.getElementById("registerForm");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const original = btn.textContent;
    const password = document.getElementById("registerPassword").value;
    const confirmPassword = document.getElementById("registerConfirmPassword").value;

    btn.disabled = true;
    btn.textContent = "Creating account...";

    try {
      if (password !== confirmPassword) throw new Error("Passwords do not match");

      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: document.getElementById("registerEmail").value,
          password,
          confirmPassword,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Registration failed");

      btn.textContent = "Account created";
      btn.style.background = "#006970";
      form.reset();
      window.setTimeout(() => {
        window.location.href = "login.html";
      }, 900);
    } catch (error) {
      console.error("Register error", error);
      btn.textContent = error.message;
      btn.style.background = "#ba1a1a";
    } finally {
      window.setTimeout(() => {
        btn.textContent = original;
        btn.style.background = "";
        btn.disabled = false;
      }, 2400);
    }
  });
})();

(function initPageFade() {
  document.body.style.opacity = "0";
  document.body.style.transition = "opacity 0.35s ease";
  window.addEventListener("load", () => {
    document.body.style.opacity = "1";
  });
})();
