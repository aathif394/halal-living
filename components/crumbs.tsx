export function Crumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav className="hl-crumbs" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`}>
          {index > 0 ? " / " : null}
          {item.href ? <a href={item.href}>{item.label}</a> : item.label}
        </span>
      ))}
    </nav>
  );
}
