interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: { label: string; href: string };
}

export default function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="section-header">
      <div className="section-header__text">
        <h2 className="section-header__title">{title}</h2>
        {subtitle && <p className="section-header__subtitle">{subtitle}</p>}
      </div>
      {action && (
        <a href={action.href} className="section-header__action">
          {action.label} →
        </a>
      )}
    </div>
  );
}
