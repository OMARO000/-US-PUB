"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/conversation",
    label: "[conversation]",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    badge: false,
  },
  {
    href: "/connections",
    label: "[connections]",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    badge: true,
  },
  {
    href: "/insights",
    label: "[insights]",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 16v-4"/>
        <path d="M12 8h.01"/>
      </svg>
    ),
    badge: false,
  },
  {
    href: "/journal",
    label: "[journal]",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
    badge: false,
  },
  {
    href: "/about",
    label: "[about]",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 16v-4"/>
        <path d="M12 8h.01"/>
      </svg>
    ),
    badge: false,
  },
  {
    href: "/profile",
    label: "[profile]",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="8" r="4"/>
        <path d="M20 21a8 8 0 1 0-16 0"/>
      </svg>
    ),
    badge: false,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside style={{
      width: "220px",
      height: "100dvh",
      background: "var(--bg)",
      borderRight: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch",
      padding: "20px 12px",
      gap: "4px",
      flexShrink: 0,
      position: "fixed",
      left: 0,
      top: 0,
      zIndex: 50,
    }}>

      {/* Logo */}
      <Link href="/conversation" aria-label="[us] home" style={{
        width: "110px",
        height: "110px",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        marginBottom: "4px",
        paddingLeft: "8px",
        textDecoration: "none",
        color: "var(--amber)",
        fontFamily: "var(--font-sans)",
        fontSize: "38px",
        fontWeight: 300,
        letterSpacing: "-0.5px",
      }}>
        [us]
      </Link>

      <div style={{ width: "100%", height: "1px", background: "var(--border)", margin: "4px 0" }} />

      {/* Nav items */}
      {navItems.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            style={{
              width: "100%",
              height: "44px",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "0 12px",
              position: "relative",
              background: active ? "var(--bg3)" : "transparent",
              color: active ? "var(--amber)" : "var(--muted)",
              transition: "background 0.15s, color 0.15s",
              textDecoration: "none",
            }}
          >
            <span style={{ width: "18px", height: "18px", display: "flex", flexShrink: 0 }}>
              {item.icon}
            </span>
            <span style={{
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.03em",
              whiteSpace: "nowrap",
            }}>
              {item.label}
            </span>
            {item.badge && (
              <span aria-label="new" style={{
                marginLeft: "auto",
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "var(--rose)",
                flexShrink: 0,
              }} />
            )}
          </Link>
        );
      })}

      <div style={{ width: "100%", height: "1px", background: "var(--border)", margin: "4px 0" }} />

      {/* Settings */}
      <Link
        href="/settings"
        aria-label="[settings]"
        aria-current={pathname === "/settings" ? "page" : undefined}
        style={{
          width: "100%",
          height: "44px",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "0 12px",
          background: pathname === "/settings" ? "var(--bg3)" : "transparent",
          color: pathname === "/settings" ? "var(--amber)" : "var(--muted)",
          transition: "background 0.15s",
          textDecoration: "none",
        }}
      >
        <span style={{ width: "18px", height: "18px", display: "flex", flexShrink: 0 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </span>
        <span style={{
          fontSize: "12px",
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.03em",
          whiteSpace: "nowrap",
        }}>
          [settings]
        </span>
      </Link>

      <div style={{ flex: 1 }} />

      {/* Avatar */}
      <button
        aria-label="your profile"
        style={{
          width: "100%",
          height: "44px",
          borderRadius: "10px",
          background: "var(--bg4)",
          border: "1.5px solid var(--border2)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "0 12px",
          cursor: "pointer",
          fontFamily: "var(--font-sans)",
        }}
      >
        <span style={{
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          background: "var(--bg3)",
          border: "1px solid var(--border2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "11px",
          fontWeight: 500,
          color: "var(--muted)",
          flexShrink: 0,
        }}>B</span>
        <span style={{
          fontSize: "12px",
          fontFamily: "var(--font-mono)",
          color: "var(--muted)",
          letterSpacing: "0.03em",
        }}>
          [you]
        </span>
      </button>
    </aside>
  );
}
