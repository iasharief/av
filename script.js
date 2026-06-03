/*
  American Vanguard site behavior.
  Non-obvious decisions: form submissions are stored locally so the site works
  on GitHub Pages, and event calendar files are generated in-browser.
*/
const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  siteNav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      siteNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });
}

const writeDemoEntry = (form, kind) => {
  const data = Object.fromEntries(new FormData(form).entries());
  data.kind = kind;
  data.savedAt = new Date().toISOString();
  const entries = JSON.parse(localStorage.getItem("avCampaignEntries") || "[]");
  entries.push(data);
  localStorage.setItem("avCampaignEntries", JSON.stringify(entries));
  return data;
};

document.querySelectorAll("form[data-form]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const status = form.querySelector(".form-status");
    const kind = form.getAttribute("data-form") || "campaign";
    const data = writeDemoEntry(form, kind);

    if (status) {
      if (kind === "donation") {
        status.textContent = `Contribution step saved for $${data.amount}. Secure processing can be connected through an approved processor.`;
      } else if (kind === "event-rsvp") {
        status.textContent = "RSVP saved. The campaign will follow up with event details.";
      } else {
        status.textContent = "Thank you. The campaign will follow up soon.";
      }
    }

    if (kind !== "event-rsvp") {
      form.reset();
    }
  });
});

const selectedRoleInput = document.querySelector("#selected-role");
const selectedRoleText = document.querySelector(".selected-role-text strong");

document.querySelectorAll(".role-card").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".role-card").forEach((item) => item.classList.remove("is-selected"));
    button.classList.add("is-selected");
    const role = button.getAttribute("data-role") || "";
    if (selectedRoleInput) selectedRoleInput.value = role;
    if (selectedRoleText) selectedRoleText.textContent = role;
  });
});

const selectedAmountInput = document.querySelector("#selected-amount");

document.querySelectorAll(".amount-button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".amount-button").forEach((item) => item.classList.remove("is-selected"));
    button.classList.add("is-selected");
    if (selectedAmountInput) {
      selectedAmountInput.value = button.getAttribute("data-amount") || "5";
    }
  });
});

const rsvpDialog = document.querySelector("#rsvp-dialog");
const rsvpTitle = document.querySelector("#rsvp-title");
const rsvpMeta = document.querySelector("#rsvp-meta");
const rsvpEventTitle = document.querySelector("#rsvp-event-title");
const rsvpEventDate = document.querySelector("#rsvp-event-date");
const rsvpEventLocation = document.querySelector("#rsvp-event-location");
let activeEvent = null;

const formatEventDate = (dateText, timeText) => {
  const date = new Date(`${dateText}T${timeText || "12:00"}:00`);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
};

document.querySelectorAll(".rsvp-button").forEach((button) => {
  button.addEventListener("click", () => {
    const card = button.closest(".event-card");
    if (!card || !(rsvpDialog instanceof HTMLDialogElement)) return;

    activeEvent = {
      title: card.getAttribute("data-event-title") || "Campaign event",
      date: card.getAttribute("data-event-date") || "",
      time: card.getAttribute("data-event-time") || "12:00",
      location: card.getAttribute("data-event-location") || "Campaign location"
    };

    if (rsvpTitle) rsvpTitle.textContent = activeEvent.title;
    if (rsvpMeta) {
      rsvpMeta.textContent = `${formatEventDate(activeEvent.date, activeEvent.time)} at ${activeEvent.location}`;
    }
    if (rsvpEventTitle) rsvpEventTitle.value = activeEvent.title;
    if (rsvpEventDate) rsvpEventDate.value = activeEvent.date;
    if (rsvpEventLocation) rsvpEventLocation.value = activeEvent.location;
    rsvpDialog.showModal();
  });
});

document.querySelectorAll(".download-ics").forEach((button) => {
  button.addEventListener("click", () => {
    if (!activeEvent) return;
    const start = new Date(`${activeEvent.date}T${activeEvent.time}:00`);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const stamp = (date) => date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//American Vanguard//Campaign Events//EN",
      "BEGIN:VEVENT",
      `UID:${activeEvent.date}-${activeEvent.title.replace(/\s+/g, "-").toLowerCase()}@american-vanguard`,
      `DTSTAMP:${stamp(new Date())}`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(end)}`,
      `SUMMARY:${activeEvent.title}`,
      `LOCATION:${activeEvent.location}`,
      "DESCRIPTION:Isaac Sharief for President campaign event.",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeEvent.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  });
});
