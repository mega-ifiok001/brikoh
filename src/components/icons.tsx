import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const Storefront = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M3 9.5 4.6 4.2A1 1 0 0 1 5.6 3.5h12.8a1 1 0 0 1 1 .7L21 9.5" />
    <path d="M3 9.5h18M5 9.5v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" />
    <path d="M9.5 19.5v-5.2a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v5.2" />
    <path d="M3.2 9.5a2.6 2.6 0 0 0 4.8 0 2.6 2.6 0 0 0 4.4 0 2.6 2.6 0 0 0 4.4 0 2.6 2.6 0 0 0 4 0" />
  </svg>
);

export const Receipt = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M5 3.5h14v17l-2.5-1.4-2.5 1.4-2-1.4-2 1.4L5 20.5z" />
    <path d="M8.5 8h7M8.5 12h7M8.5 16h4" />
  </svg>
);

export const ChartUp = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4 4v15a1 1 0 0 0 1 1h15" />
    <path d="M7.5 15l3.2-3.6 2.8 2.2 4-5.2" />
    <path d="M14.5 8.4h3v3" />
  </svg>
);

export const Wallet = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4 7.5A1.5 1.5 0 0 1 5.5 6H18a1.5 1.5 0 0 1 1.5 1.5V8" />
    <path d="M3 8.5v9A1.5 1.5 0 0 0 4.5 19h15a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 19.5 9H5.5A2.5 2.5 0 0 1 3 8.5z" />
    <circle cx="16.5" cy="13.5" r="1.3" fill="currentColor" stroke="none" />
  </svg>
);

export const Box = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 3 4 7.2v9.6L12 21l8-4.2V7.2z" />
    <path d="M4 7.2 12 11.4l8-4.2M12 11.4V21" />
    <path d="M8 5.2 16 9.4" />
  </svg>
);

export const Truck = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M2.5 6.5h10v9h-10z" />
    <path d="M12.5 9.5h4l3 3v3h-7" />
    <circle cx="6" cy="17.5" r="1.8" />
    <circle cx="16.5" cy="17.5" r="1.8" />
  </svg>
);

export const Users = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="9" cy="8.5" r="3" />
    <path d="M3.5 19.5a5.5 5.5 0 0 1 11 0" />
    <path d="M16 6.2a3 3 0 0 1 0 5.6M16.5 19.5a5.5 5.5 0 0 0-2.3-4.5" />
  </svg>
);

export const User = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </svg>
);

export const Badge = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="9" r="5" />
    <path d="M9.2 12.8 8 21l4-2.3L16 21l-1.2-8.2" />
  </svg>
);

export const Calculator = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <rect x="8" y="6" width="8" height="3" rx="1" />
    <path d="M8.5 13h.01M12 13h.01M15.5 13h.01M8.5 16.5h.01M12 16.5h.01M15.5 16.5v.01" />
  </svg>
);

export const Barcode = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4 5v14M7 5v14M10.5 5v14M13.5 5v9M16.5 5v14M20 5v14" />
  </svg>
);

export const Building = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M3.5 20.5h17" />
    <path d="M5 20.5V7l7-3.5v17" />
    <path d="M12 20.5V10l7 3v7.5" />
    <path d="M8 9v.01M8 12v.01M8 15v.01" />
  </svg>
);

export const Refresh = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M20 11.5A8 8 0 0 0 6.3 6.3L4 8.5" />
    <path d="M4 4v4.5h4.5" />
    <path d="M4 12.5a8 8 0 0 0 13.7 5.2L20 15.5" />
    <path d="M20 20v-4.5h-4.5" />
  </svg>
);

export const Globe = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.4 2.5 15.6 0 18M12 3c-2.5 2.4-2.5 15.6 0 18" />
  </svg>
);

export const Bell = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
    <path d="M10.5 19a1.8 1.8 0 0 0 3 0" />
  </svg>
);

export const Check = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4.5 12.5 9.5 17.5 19.5 6.5" />
  </svg>
);

export const ArrowRight = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4 12h16M14 6l6 6-6 6" />
  </svg>
);

export const Star = (p: IconProps) => (
  <svg {...base} fill="currentColor" stroke="none" {...p}>
    <path d="M12 2.5l2.6 5.7 6.2.6-4.7 4.1 1.4 6.1L12 15.9 6.5 19l1.4-6.1-4.7-4.1 6.2-.6z" />
  </svg>
);

export const Shield = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 3 5 6v5c0 4.5 3 7.8 7 9 4-1.2 7-4.5 7-9V6z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

export const Sparkles = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 3.5 13.6 9 19 10.6 13.6 12.2 12 17.7 10.4 12.2 5 10.6 10.4 9z" />
    <path d="M18 4v3M19.5 5.5h-3M6 16v2.5M7.25 17.25h-2.5" />
  </svg>
);

export const Play = (p: IconProps) => (
  <svg {...base} fill="currentColor" stroke="none" {...p}>
    <path d="M8 5.5v13l11-6.5z" />
  </svg>
);

export const Quote = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M9.5 6C6.5 7.3 4.8 9.8 4.8 13.2c0 2.7 1.6 4.5 3.9 4.5 2 0 3.5-1.5 3.5-3.5 0-1.9-1.3-3.3-3.1-3.3-.3 0-.7 0-1 .2.4-1.6 1.7-2.9 3.4-3.7L9.5 6zm9 0c-3 1.3-4.7 3.8-4.7 7.2 0 2.7 1.6 4.5 3.9 4.5 2 0 3.5-1.5 3.5-3.5 0-1.9-1.3-3.3-3.1-3.3-.3 0-.7 0-1 .2.4-1.6 1.7-2.9 3.4-3.7L18.5 6z" />
  </svg>
);

export const Plus = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const Menu = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const Close = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const Graduation = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M2 9l10-4 10 4-10 4z" />
    <path d="M6 11v4.5c0 1.2 2.7 2.5 6 2.5s6-1.3 6-2.5V11" />
    <path d="M22 9v5" />
  </svg>
);

export const Network = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="5" r="2.2" />
    <circle cx="5" cy="18" r="2.2" />
    <circle cx="19" cy="18" r="2.2" />
    <path d="M12 7.2 5.6 15.8M12 7.2l6.4 8.6M7 18h10" />
  </svg>
);

export const Bolt = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M13 3 5 13h6l-1 8 8-10h-6z" />
  </svg>
);

export const Mail = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);

export const Lock = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="5" y="10.5" width="14" height="10" rx="2" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    <path d="M12 14.5v2.5" />
  </svg>
);

export const Eye = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="2.8" />
  </svg>
);

export const EyeOff = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4 4l16 16" />
    <path d="M9.9 5.7A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16.7 16.7 0 0 1-3 3.8M6.2 7.4A15.7 15.7 0 0 0 2.5 12S6 18.5 12 18.5c1.3 0 2.5-.3 3.5-.8" />
    <path d="M9.9 10.1a3 3 0 0 0 4 4" />
  </svg>
);

export const ArrowLeft = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);

export const AlertCircle = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v4.5M12 15.8v.01" />
  </svg>
);

export const CheckCircle = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12.2 2.4 2.4 4.8-5" />
  </svg>
);

export const LogOut = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M9 4.5H5.5A1.5 1.5 0 0 0 4 6v12a1.5 1.5 0 0 0 1.5 1.5H9" />
    <path d="M15.5 8 20 12l-4.5 4M20 12H9.5" />
  </svg>
);

export const Google = (p: IconProps) => (
  <svg viewBox="0 0 24 24" {...p}>
    <path
      fill="#4285F4"
      d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.46a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.27-2.1 3.57-5.17 3.57-8.82z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.96-1.08 7.94-2.91l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A12 12 0 0 0 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.27 14.28a7.2 7.2 0 0 1 0-4.56V6.63H1.29a12 12 0 0 0 0 10.74l3.98-3.09z"
    />
    <path
      fill="#EA4335"
      d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44A11.98 11.98 0 0 0 1.29 6.63l3.98 3.09C6.22 6.88 8.87 4.77 12 4.77z"
    />
  </svg>
);

export const Apple = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M16.36 12.9c.03 3.04 2.66 4.05 2.69 4.07-.02.07-.42 1.44-1.38 2.85-.83 1.22-1.7 2.43-3.06 2.46-1.34.02-1.77-.8-3.3-.8-1.53 0-2.01.77-3.27.82-1.31.05-2.31-1.32-3.15-2.53-1.71-2.48-3.02-7-1.26-10.05.87-1.51 2.43-2.47 4.12-2.5 1.29-.02 2.5.87 3.29.87.79 0 2.27-1.07 3.82-.92.65.03 2.48.26 3.66 1.98-.1.06-2.19 1.28-2.16 3.75zM13.66 3.92c.7-.85 1.17-2.02 1.04-3.2-1.01.04-2.22.67-2.95 1.52-.64.74-1.21 1.93-1.06 3.07 1.12.09 2.26-.57 2.97-1.39z" />
  </svg>
);

export const Search = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export const ChevronRight = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);

export const Download = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 4v11M7 10l5 5 5-5M4 19h16" />
  </svg>
);

export const Clock = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const Calendar = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="4" y="5.5" width="16" height="15" rx="2" />
    <path d="M4 10h16M8 3.5v4M16 3.5v4" />
  </svg>
);

export const MapPin = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

export const Phone = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M5 4h4l1.5 4.5L8 10a12 12 0 0 0 6 6l1.5-2.5L20 15v4a1.5 1.5 0 0 1-1.7 1.5C10 19.6 4.4 14 3.5 5.7A1.5 1.5 0 0 1 5 4z" />
  </svg>
);

export const MessageCircle = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.5L3 21l2-5.6A8.5 8.5 0 1 1 21 11.5z" />
  </svg>
);

export const Book = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21z" />
    <path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20" />
  </svg>
);

export const Award = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="9" r="5" />
    <path d="M8.5 13.5 7 21l5-2.5L17 21l-1.5-7.5" />
  </svg>
);

export const FileText = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M6 3h9l4 4v14H6z" />
    <path d="M15 3v4h4M9.5 12h5M9.5 15.5h5" />
  </svg>
);

export const Key = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="8" cy="15" r="4" />
    <path d="m11 12 8-8M16 7l3 3M14 9l2 2" />
  </svg>
);

export const Rocket = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2" />
    <path d="M14.5 4.5C18 6 20 9 20 13l-5 5c-4 0-7-2-8.5-5.5L14.5 4.5z" />
    <circle cx="15" cy="9" r="1.5" />
    <path d="M9.5 14.5c-1 2-3 3.5-3 3.5s1.5-2 3.5-3" />
  </svg>
);

export const Target = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
  </svg>
);

export const Heart = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 20.5S4 15 4 9.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15 12 20.5 12 20.5z" />
  </svg>
);

export const Headphones = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
    <rect x="3.5" y="13" width="4" height="6" rx="1.5" />
    <rect x="16.5" y="13" width="4" height="6" rx="1.5" />
  </svg>
);

export const Server = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="4" y="4" width="16" height="7" rx="1.5" />
    <rect x="4" y="13" width="16" height="7" rx="1.5" />
    <path d="M8 7.5h.01M8 16.5h.01" />
  </svg>
);

export const Fingerprint = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 11a4 4 0 0 1 4 4c0 2 .2 4.5.5 6M8 15a4 4 0 0 0 8 0M12 7a8 8 0 0 0-8 8M12 7a8 8 0 0 1 8 8M12 11v3M9 9a5 5 0 0 0-1 3" />
  </svg>
);

export const Layers = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="m12 3 9 5-9 5-9-5z" />
    <path d="m3 13 9 5 9-5" />
  </svg>
);

export const Trending = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M3 17l6-6 4 4 8-8" />
    <path d="M15 7h6v6" />
  </svg>
);

export const Video = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="3" y="6" width="13" height="12" rx="2" />
    <path d="m16 10 5-3v10l-5-3" />
  </svg>
);

export const Home = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="m4 10.5 8-6.5 8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z" />
  </svg>
);

export const Settings = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2.5v3M12 18.5v3M4.6 5.1l2.6 1.5M16.8 17.4l2.6 1.5M2.5 12h3M18.5 12h3M4.6 18.9l2.6-1.5M16.8 6.6l2.6-1.5" />
  </svg>
);

export const LayoutGrid = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="4" y="4" width="7" height="7" rx="1.5" />
    <rect x="13" y="4" width="7" height="7" rx="1.5" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" />
    <rect x="13" y="13" width="7" height="7" rx="1.5" />
  </svg>
);

export const ShoppingBag = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M5.5 8h13l-.8 11a1.5 1.5 0 0 1-1.5 1.4H7.8A1.5 1.5 0 0 1 6.3 19z" />
    <path d="M9 10.5V6a3 3 0 0 1 6 0v4.5" />
  </svg>
);

export const CreditCard = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 10h18M7 15h4" />
  </svg>
);

export const Pencil = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10z" />
    <path d="m13.5 6.5 3 3" />
  </svg>
);

export const Trash = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4 7h16M9.5 7V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2M6.5 7l.7 12a1.5 1.5 0 0 0 1.5 1.4h6.6a1.5 1.5 0 0 0 1.5-1.4l.7-12" />
  </svg>
);

export const MoreHorizontal = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="5" cy="12" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="19" cy="12" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

export const ChevronDown = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const ArrowUpRight = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M7 17 17 7M8 7h9v9" />
  </svg>
);

export const ArrowDownRight = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="m7 7 10 10M17 8v9H8" />
  </svg>
);

export const Coins = (p: IconProps) => (
  <svg {...base} {...p}>
    <ellipse cx="12" cy="6" rx="7" ry="3" />
    <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
    <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
  </svg>
);

export const Image = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="9" cy="9.5" r="1.6" />
    <path d="m4 18 5-5 3.5 3.5L17 12l4 4" />
  </svg>
);

export const Upload = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 16V5M7 9.5 12 4.5l5 5M4 20h16" />
  </svg>
);

export const ArrowRightLeft = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M8 4 4 8l4 4M4 8h16M16 20l4-4-4-4M20 16H4" />
  </svg>
);

export const ClipboardList = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <path d="M9 4.5V3.8A1.3 1.3 0 0 1 10.3 2.5h3.4A1.3 1.3 0 0 1 15 3.8v.7M9 9.5h6M9 13h6M9 16.5h3.5" />
  </svg>
);

export const UserPlus = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="9" cy="8.5" r="3" />
    <path d="M3.5 19.5a5.5 5.5 0 0 1 11 0" />
    <path d="M18 8v6M15 11h6" />
  </svg>
);

export const Percent = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M18 6 6 18" />
    <circle cx="8" cy="8" r="2.5" />
    <circle cx="16" cy="16" r="2.5" />
  </svg>
);

export const ScrollText = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M6 3h13v15a2 2 0 0 1-2 2H7a3 3 0 0 1-3-3V5a2 2 0 0 1 2-2z" />
    <path d="M6 3v14a3 3 0 0 0 3 3M9 8h6M9 12h6" />
  </svg>
);

export const QrCode = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="4" y="4" width="6" height="6" rx="1" />
    <rect x="14" y="4" width="6" height="6" rx="1" />
    <rect x="4" y="14" width="6" height="6" rx="1" />
    <path d="M14 14h3v3h-3zM20 14v6M14 20h3" />
  </svg>
);

export const Tag = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M3.5 12V4.5A1.5 1.5 0 0 1 5 3h7.5a1.5 1.5 0 0 1 1.1.4l7 7a1.5 1.5 0 0 1 0 2.2l-7 7a1.5 1.5 0 0 1-2.2 0l-7-7A1.5 1.5 0 0 1 3.5 12z" />
    <circle cx="8.5" cy="8.5" r="1.6" />
  </svg>
);

export const Send = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4 12 20 4l-4 16-3.5-5.5L4 12z" />
    <path d="M20 4 12.5 14.5" />
  </svg>
);

export const Printer = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M7 8V3h10v5M7 17H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="7" y="14" width="10" height="7" rx="1.5" />
  </svg>
);

export const Eye2 = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="2.8" />
  </svg>
);

export const Copy = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15H4.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5" />
  </svg>
);

export const Minus = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M5 12h14" />
  </svg>
);

export const X = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const Sun = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
  </svg>
);

export const Moon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z" />
  </svg>
);

export const Ban = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m5.5 5.5 13 13" />
  </svg>
);

export const Ticket = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M3 8.5a2 2 0 0 0 2 2 2 2 0 0 1 0 4 2 2 0 0 0 2 2v3h14v-3a2 2 0 0 1 0-4 2 2 0 0 1 0-4V5H5v3a2 2 0 0 0 2-2" />
  </svg>
);

export const Megaphone = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M3 10v4a1 1 0 0 0 1 1h2l4 5V4L6 9H4a1 1 0 0 0-1 1z" />
    <path d="M14 8.5a4.5 4.5 0 0 1 0 7" />
    <path d="M17 6a8 8 0 0 1 0 12" />
  </svg>
);

export const Palette = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 3a9 9 0 1 0 0 18c1.2 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.2 0-.8.7-1.5 1.5-1.5H16a5 5 0 0 0 5-5c0-3.9-4-7-9-7z" />
    <circle cx="7.5" cy="11" r="1" fill="currentColor" stroke="none" />
    <circle cx="10" cy="7" r="1" fill="currentColor" stroke="none" />
    <circle cx="14.5" cy="7.2" r="1" fill="currentColor" stroke="none" />
    <circle cx="17" cy="10.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const Wrench = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M14.5 6.5a4.5 4.5 0 0 1 5.8-4.4l-3.2 3.2 1.6 1.6 3.2-3.2a4.5 4.5 0 0 1-6 5.8L5 20.5a1.8 1.8 0 0 1-2.5-2.5l10.6-10.6c.5.5 1 .9 1.4 1.1z" />
  </svg>
);

export const Banknote = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="2.5" y="6.5" width="19" height="11" rx="2" />
    <circle cx="12" cy="12" r="2.5" />
    <path d="M6 10v.01M18 14v.01" />
  </svg>
);

export const WhatsApp = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M17.5 14.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.5 0 1.47 1.07 2.9 1.22 3.1.15.2 2.1 3.2 5.1 4.49.71.3 1.27.49 1.7.63.72.23 1.37.2 1.88.12.57-.09 1.76-.72 2-1.42.25-.7.25-1.3.18-1.42-.08-.13-.28-.2-.58-.35zM12.05 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.44 4.43-9.87 9.88-9.87a9.8 9.8 0 0 1 6.98 2.9 9.8 9.8 0 0 1 2.9 6.99c0 5.44-4.44 9.87-9.87 9.87zm8.4-18.27A11.8 11.8 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.9 11.9 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.9 0-3.18-1.24-6.16-3.49-8.41z" />
  </svg>
);
