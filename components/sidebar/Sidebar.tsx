"use client";
import { useState, useEffect } from "react";
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
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("us_sidebar_collapsed") === "true";
  });

  // Sync CSS variable on mount and on change
  useEffect(() => {
    const width = collapsed ? "64px" : "220px";
    document.documentElement.style.setProperty("--sidebar-width", width);
  }, [collapsed]);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("us_sidebar_collapsed", String(next));
      document.documentElement.style.setProperty("--sidebar-width", next ? "64px" : "220px");
      return next;
    });
  }

  const w = collapsed ? "64px" : "220px";

  return (
    <aside style={{
      width: w,
      height: "100dvh",
      background: "var(--bg)",
      borderRight: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch",
      padding: collapsed ? "20px 0" : "20px 12px",
      gap: "4px",
      flexShrink: 0,
      position: "fixed",
      left: 0,
      top: 0,
      zIndex: 50,
      transition: "width 0.2s ease",
      overflow: "hidden",
    }}>

      {/* Logo */}
      <Link href="/conversation" aria-label="[us] home" style={{
        width: "100%",
        height: "110px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "4px",
        textDecoration: "none",
        color: "var(--amber)",
        fontFamily: "var(--font-sans)",
        fontSize: "38px",
        fontWeight: 300,
        letterSpacing: "-0.5px",
        flexShrink: 0,
      }}>
        {!collapsed && "[us]"}
        {collapsed && (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        )}
      </Link>

      <div style={{ width: collapsed ? "40px" : "100%", height: "1px", background: "var(--border)", margin: "4px auto" }} />

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
              justifyContent: collapsed ? "center" : "flex-start",
              gap: collapsed ? 0 : "12px",
              padding: collapsed ? "0" : "0 12px",
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
            {!collapsed && (
              <span style={{
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.03em",
                whiteSpace: "nowrap",
              }}>
                {item.label}
              </span>
            )}
            {!collapsed && item.badge && (
              <span aria-label="new" style={{
                marginLeft: "auto",
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "var(--rose)",
                flexShrink: 0,
              }} />
            )}
            {collapsed && item.badge && (
              <span aria-label="new" style={{
                position: "absolute",
                top: "8px",
                right: "10px",
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "var(--rose)",
              }} />
            )}
          </Link>
        );
      })}

      <div style={{ width: collapsed ? "40px" : "100%", height: "1px", background: "var(--border)", margin: "4px auto" }} />

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
          justifyContent: collapsed ? "center" : "flex-start",
          gap: collapsed ? 0 : "12px",
          padding: collapsed ? "0" : "0 12px",
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
        {!collapsed && (
          <span style={{
            fontSize: "12px",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.03em",
            whiteSpace: "nowrap",
          }}>
            [settings]
          </span>
        )}
      </Link>

      <div style={{ flex: 1 }} />

      {/* Collapse toggle */}
      <button
        onClick={toggle}
        aria-label={collapsed ? "expand sidebar" : "collapse sidebar"}
        style={{
          width: "100%",
          height: "36px",
          borderRadius: "10px",
          background: "transparent",
          border: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "var(--dim)",
          marginBottom: "4px",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {collapsed
            ? <path d="M9 18l6-6-6-6"/>
            : <path d="M15 18l-6-6 6-6"/>
          }
        </svg>
      </button>

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
          justifyContent: collapsed ? "center" : "flex-start",
          gap: collapsed ? 0 : "12px",
          padding: collapsed ? "0" : "0 12px",
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
        {!collapsed && (
          <span style={{
            fontSize: "12px",
            fontFamily: "var(--font-mono)",
            color: "var(--muted)",
            letterSpacing: "0.03em",
          }}>
            [you]
          </span>
        )}
      </button>
    </aside>
  );
}
