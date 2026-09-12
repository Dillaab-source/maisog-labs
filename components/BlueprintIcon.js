const paths = {
  foundation: <><path d="m12 3 7.5 4.2v9.6L12 21l-7.5-4.2V7.2L12 3Z" /><path d="m4.5 7.2 7.5 4.3 7.5-4.3M12 11.5V21" /></>,
  experience: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 8h18M7 6h.01M10 6h.01M7 12h5M7 16h10" /></>,
  systems: <><path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" /><circle cx="12" cy="12" r="4" /></>,
  security: <><path d="M12 3 4.5 6v5.2c0 4.6 3.1 8.7 7.5 9.8 4.4-1.1 7.5-5.2 7.5-9.8V6L12 3Z" /><path d="m8.8 12 2.1 2.1 4.5-4.5" /></>,
  automation: <><circle cx="5" cy="12" r="2" /><circle cx="19" cy="5" r="2" /><circle cx="19" cy="19" r="2" /><path d="M7 12h4a4 4 0 0 0 4-4V5M7 12h4a4 4 0 0 1 4 4v3" /></>,
  lab: <><path d="M9 3h6M10 3v5l-5.4 9.2A2.5 2.5 0 0 0 6.8 21h10.4a2.5 2.5 0 0 0 2.2-3.8L14 8V3" /><path d="M7.5 16h9M9 12h6" /></>,
  contact: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
  arrow: <><path d="M5 12h14M14 7l5 5-5 5" /></>,
};

export default function BlueprintIcon({ name, size = 24 }) {
  return (
    <svg aria-hidden="true" className="blueprint-icon" fill="none" height={size} viewBox="0 0 24 24" width={size}>
      {paths[name] || paths.foundation}
    </svg>
  );
}
