"use client";

import * as ReactNS from "react";
import * as ReactDOM from "react-dom";

// Same semantics as the mockup's template engine, so the ported views and logic render identically.

const A11Y_TAGS = new Set(["div", "span", "li", "p", "section", "article"]);

function a11yProps(type: unknown, props: Record<string, unknown> | null) {
  if (typeof type !== "string" || !props || !props.onClick || !A11Y_TAGS.has(type)) return props;
  if (props.role != null || props.tabIndex != null || props["aria-hidden"]) return props;
  const st = props.style as Record<string, unknown> | undefined;
  if (st && typeof st === "object" && st.position === "fixed") return props;
  const next: Record<string, unknown> = { ...props, role: "button", tabIndex: 0, onKeyDown: kb(props.onKeyDown as KeyHandler) };
  if (next["aria-label"] == null && next.title) next["aria-label"] = next.title;
  return next;
}

type KeyHandler = ((e: ReactNS.KeyboardEvent<HTMLElement>) => void) | undefined;

export function kb(own: KeyHandler) {
  return (e: ReactNS.KeyboardEvent<HTMLElement>) => {
    if (own) own(e);
    if (e.defaultPrevented || e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.click();
    }
  };
}

function createElementA11y(type: Parameters<typeof ReactNS.createElement>[0], props: Record<string, unknown> | null, ...children: ReactNS.ReactNode[]) {
  return ReactNS.createElement(type, a11yProps(type, props) as never, ...children);
}

export const React = { ...ReactNS, createElement: createElementA11y };

export const HL_GLOBALS = {
  logos: {
    chennai: "/icons/cities/chennai.jpg",
    mumbai: "/icons/cities/mumbai.jpg",
    bangalore: "/icons/cities/bangalore.jpg",
    hyderabad: "/icons/cities/hyderabad.jpg",
  } as Record<string, string>,
  appIcon: "/hl/f68a5293e0c0.png",
};

// Overlays (install sheet, ad form, subscribe card, viewers) are portals onto <body>. They only exist in the
// browser, so they render after hydration, which is also when the mockup's client-only runtime showed them.
let clientReady = false;

export function portalTarget() {
  return typeof document === "undefined" ? null : document.body;
}

export function hlPortal(node: ReactNS.ReactNode, target: Element | null) {
  return clientReady && target ? ReactDOM.createPortal(node, target) : null;
}

export function cssToObj(css: string) {
  const o: Record<string, string> = {};
  for (const decl of css.split(";")) {
    const i = decl.indexOf(":");
    if (i < 0) continue;
    const prop = decl.slice(0, i).trim();
    o[prop.startsWith("--") ? prop : prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] = decl.slice(i + 1).trim();
  }
  return o;
}

export const sx = cssToObj;

export function sxv(v: unknown) {
  return typeof v === "string" ? cssToObj(v) : (v as ReactNS.CSSProperties | undefined);
}

export function arr<T>(x: T[] | unknown): T[] {
  return Array.isArray(x) ? x : [];
}

export function cx(...names: unknown[]) {
  return names.filter(Boolean).join(" ");
}

export function ip(v: unknown): ReactNS.ReactNode {
  if (ReactNS.isValidElement(v) || Array.isArray(v)) return v as ReactNS.ReactNode;
  if (v === undefined || v === null || typeof v === "boolean") return null;
  return <span className="sc-interp">{String(v)}</span>;
}

type Host = { bump: (cb?: () => void) => void };

export class DCLogic<P extends object = Record<string, unknown>, S extends object = Record<string, unknown>> {
  props: P;
  state: S = {} as S;
  __host: Host | null = null;
  constructor(props: P) {
    this.props = props || ({} as P);
  }
  setState(update: Partial<S> | ((s: S) => Partial<S> | null), cb?: () => void) {
    const patch = typeof update === "function" ? update(this.state) : update;
    this.state = { ...this.state, ...(patch || {}) };
    this.__host?.bump(cb);
  }
  forceUpdate() {
    this.__host?.bump();
  }
  componentDidMount() {}
  componentDidUpdate(_prev: P) {}
  componentWillUnmount() {}
  renderVals(): Record<string, unknown> {
    return {};
  }
}

type LogicClass = new (props: Record<string, unknown>) => DCLogic;
type View = (v: Record<string, unknown>) => ReactNS.ReactNode;

export function makeHost(
  name: string,
  Logic: LogicClass,
  View: View,
  init?: (logic: DCLogic, props: Record<string, unknown>) => void,
  mounted?: (logic: DCLogic, props: Record<string, unknown>) => void,
) {
  class Host extends ReactNS.Component<Record<string, unknown>, { v: number }> {
    logic: DCLogic;
    state = { v: 0 };
    constructor(props: Record<string, unknown>) {
      super(props);
      this.logic = new Logic(props);
      init?.(this.logic, props);
      this.logic.__host = this;
    }
    bump(cb?: () => void) {
      this.setState((s) => ({ v: s.v + 1 }), cb);
    }
    componentDidMount() {
      clientReady = true;
      this.bump();
      try {
        this.logic.componentDidMount();
        mounted?.(this.logic, this.props);
      } catch (e) {
        console.error(e);
      }
    }
    componentDidUpdate(prev: Record<string, unknown>) {
      try {
        this.logic.componentDidUpdate(prev);
      } catch (e) {
        console.error(e);
      }
    }
    componentWillUnmount() {
      try {
        this.logic.componentWillUnmount();
      } catch (e) {
        console.error(e);
      }
    }
    render() {
      this.logic.props = this.props;
      const vals = { ...this.props, ...(this.logic.renderVals() || {}) };
      return (
        <div className="sc-host" data-sc-name={name}>
          {View(vals)}
        </div>
      );
    }
  }
  return Host;
}
