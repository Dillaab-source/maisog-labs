"use client";

// Contact surface (plan §9): the end of the trajectory. Uses only the
// repository-approved contact address and existing public copy.
import { useState } from "react";

function legacyCopy(value) {
  const field = document.createElement("textarea");
  field.value = value;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.appendChild(field);
  field.select();
  const ok = document.execCommand("copy");
  field.remove();
  if (!ok) throw new Error("copy failed");
}

export default function ContactSurface({ contact, identity, footer, location }) {
  const [status, setStatus] = useState("");

  const copy = async () => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(contact.email);
      else legacyCopy(contact.email);
      setStatus("Address copied.");
    } catch {
      setStatus(`Copy unavailable — the address is ${contact.email}.`);
    }
  };

  return (
    <div className="contact-layout">
      <p className="contact-invite">{contact.callToAction}.</p>
      <p className="contact-identity">{identity[0]} {identity[1]}</p>
      <div className="contact-actions">
        <a className="contact-email" href={`mailto:${contact.email}`}>{contact.email}</a>
        <button type="button" className="inline-action" onClick={copy}>Copy address</button>
      </div>
      <p className="copy-status" role="status">{status}</p>
      <p className="contact-legal">
        <span>{footer.copyright}</span>
        <span>{location.toUpperCase()}</span>
        <span>{footer.statement}</span>
      </p>
    </div>
  );
}
