"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ThreadType } from "@/lib/threads/threadPrompts";

interface SidebarProps {
  activeThread?: ThreadType
  onThreadSelect?: (t: ThreadType) => void
  intentSignal?: boolean
}

const navItems = [
  {
    href: "/conversation",
    threadType: "conversation" as ThreadType,
    label: "[conversation]",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    badge: false,
  },
  {
    href: "/about",
    threadType: "about" as ThreadType,
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
    href: "/connections",
    threadType: "connections" as ThreadType,
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
    href: "/notifications",
    threadType: "notifications" as ThreadType,
    label: "[notifications]",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
    badge: false,
  },
  {
    href: "/conversation?thread=messages",
    threadType: "messages" as ThreadType,
    label: "[messages]",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        <path d="M8 10h.01M12 10h.01M16 10h.01"/>
      </svg>
    ),
    badge: false,
  },
  {
    href: "/insights",
    threadType: "insights" as ThreadType,
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
    threadType: "journal" as ThreadType,
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
    href: "/profile",
    threadType: "profile" as ThreadType,
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

export default function Sidebar({ activeThread, onThreadSelect, intentSignal = false }: SidebarProps = {}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Read localStorage after mount and sync CSS variable
  useEffect(() => {
    const stored = localStorage.getItem("us_sidebar_collapsed") === "true";
    setCollapsed(stored);
  }, []);

  useEffect(() => {
    const width = collapsed ? "112px" : "430px";
    document.documentElement.style.setProperty("--sidebar-width", width);
  }, [collapsed]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("us_sidebar_collapsed", String(next));
      document.documentElement.style.setProperty("--sidebar-width", next ? "112px" : "430px");
      return next;
    });
  }

  const w = collapsed ? "112px" : "430px";

  const navContent = (isMobile: boolean) => (
    <>
      {/* Logo */}
      <button onClick={() => onThreadSelect?.("conversation")} aria-label="[us] home" style={{
        width: "100%",
        height: "110px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "4px",
        textDecoration: "none",
        color: "var(--amber)",
        fontFamily: "var(--font-sans)",
        flexShrink: 0,
        cursor: "pointer",
        background: "transparent",
        border: "none",
        gap: "6px",
      }}>
        {(!collapsed || isMobile) && (
          <>
            <span style={{
              fontSize: "64px",
              fontWeight: 300,
              letterSpacing: "-0.5px",
              lineHeight: 1,
            }}>
              [us]
            </span>
            <span style={{
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
              color: "var(--text)",
              letterSpacing: "0.08em",
              opacity: 0.85,
              fontWeight: 300,
            }}>
              authentic connections.
            </span>
          </>
        )}
        {collapsed && !isMobile && (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        )}
      </button>

      <div style={{ width: "100%", height: "1px", background: "var(--border)", margin: "4px auto" }} />

      {/* Nav items */}
      {navItems.map((item) => {
        const active = activeThread
          ? activeThread === item.threadType
          : pathname === item.href;
        const navItemStyle = {
          width: "100%",
          height: "72px",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: (collapsed && !isMobile) ? "center" : "flex-start",
          gap: (collapsed && !isMobile) ? 0 : "12px",
          padding: (collapsed && !isMobile) ? "0" : "0 12px",
          position: "relative" as const,
          background: active ? "var(--bg3)" : "transparent",
          color: active ? "var(--amber)" : "var(--muted)",
          transition: "background 0.15s, color 0.15s",
          textDecoration: "none",
          cursor: "pointer",
          border: "none",
          font: "inherit",
          textAlign: "left" as const,
          boxSizing: "border-box" as const,
        };
        const inner = (
          <>
            <span style={{ width: "28px", height: "28px", display: "flex", flexShrink: 0 }}>
              {item.icon}
            </span>
            {(!collapsed || isMobile) && (
              <span style={{
                fontSize: "18px",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.03em",
                whiteSpace: "nowrap",
              }}>
                {item.label}
              </span>
            )}
            {(!collapsed || isMobile) && item.badge && intentSignal && (
              <span aria-label="new" style={{
                marginLeft: "auto",
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "var(--amber)",
                flexShrink: 0,
                animation: "intentPulse 2s ease-in-out infinite",
              }} />
            )}
            {collapsed && !isMobile && item.badge && intentSignal && (
              <span aria-label="new" style={{
                position: "absolute",
                top: "8px",
                right: "10px",
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "var(--amber)",
                animation: "intentPulse 2s ease-in-out infinite",
              }} />
            )}
          </>
        );
        return onThreadSelect ? (
          <button
            key={item.href}
            onClick={() => onThreadSelect(item.threadType)}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            style={navItemStyle}
          >
            {inner}
          </button>
        ) : (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            style={navItemStyle}
          >
            {inner}
          </Link>
        );
      })}

      <div style={{ width: "100%", height: "1px", background: "var(--border)", margin: "4px auto" }} />

      {/* Settings */}
      <button
        onClick={() => onThreadSelect?.("settings")}
        aria-label="[settings]"
        aria-current={activeThread === "settings" ? "page" : undefined}
        style={{
          width: "100%",
          height: "48px",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: (collapsed && !isMobile) ? "center" : "flex-start",
          gap: (collapsed && !isMobile) ? 0 : "12px",
          padding: (collapsed && !isMobile) ? "0" : "0 12px",
          background: activeThread === "settings" ? "var(--bg3)" : "transparent",
          color: activeThread === "settings" ? "var(--amber)" : "var(--muted)",
          transition: "background 0.15s",
          cursor: "pointer",
          border: "none",
          font: "inherit",
          textAlign: "left",
          boxSizing: "border-box",
        }}
      >
        <span style={{ width: "28px", height: "28px", display: "flex", flexShrink: 0 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </span>
        {(!collapsed || isMobile) && (
          <span style={{
            fontSize: "18px",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.03em",
            whiteSpace: "nowrap",
          }}>
            [settings]
          </span>
        )}
      </button>

      <div style={{ flex: 1 }} />

      {/* [us plus] */}
      <button
        onClick={() => onThreadSelect?.("us-plus" as ThreadType)}
        style={{
          width: "100%",
          height: "44px",
          borderRadius: "10px",
          background: "transparent",
          border: "1px solid var(--amber)",
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          gap: collapsed ? 0 : "10px",
          padding: collapsed ? "0" : "0 12px",
          cursor: "pointer",
          marginBottom: "8px",
          transition: "background 0.15s",
        }}
      >
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: collapsed ? "10px" : "13px",
          color: "var(--amber)",
          letterSpacing: "0.06em",
          whiteSpace: "nowrap",
        }}>
          {collapsed ? "[+]" : "[us plus]"}
        </span>
      </button>

      {/* Collapse toggle — desktop only */}
      {!isMobile && (
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
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: "13px",
            color: "var(--muted)",
          }}>
            {collapsed ? "[>|<]" : "[<|>]"}
          </span>
        </button>
      )}
      <style>{`
        @keyframes intentPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </>
  );

  return (
    <>
      {/* Hamburger button — mobile only, hidden on desktop via CSS */}
      <button
        className="mobile-hamburger"
        onClick={() => setMobileOpen(true)}
        aria-label="open menu"
        style={{
          display: "none", // overridden by CSS media query
          position: "fixed",
          top: "16px",
          left: "16px",
          zIndex: 60,
          width: "44px",
          height: "44px",
          borderRadius: "10px",
          background: "var(--bg2)",
          border: "1px solid var(--border)",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "var(--text)",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12h18M3 6h18M3 18h18"/>
        </svg>
      </button>

      {/* Desktop sidebar — hidden on mobile via CSS */}
      <aside suppressHydrationWarning className="sidebar-desktop" style={{
        width: w,
        height: "100dvh",
        background: "var(--bg)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        padding: collapsed ? "36px 0" : "36px 20px",
        gap: "8px",
        flexShrink: 0,
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 50,
        transition: "width 0.2s ease",
        overflow: "hidden",
      }}>
        {navContent(false)}
      </aside>

      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 55,
          }}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className="sidebar-mobile-open"
        style={{
          display: mobileOpen ? "flex" : "none",
          width: "300px",
          height: "100dvh",
          background: "var(--bg)",
          borderRight: "1px solid var(--border)",
          flexDirection: "column",
          alignItems: "stretch",
          padding: "36px 20px",
          gap: "8px",
          flexShrink: 0,
          position: "fixed",
          left: 0,
          top: 0,
          zIndex: 60,
          overflow: "hidden",
        }}
      >
        {navContent(true)}
      </aside>
    </>
  );
}
