export function PageHeader({ title, description, actions }: { title: string; description: string; actions?: React.ReactNode }) {
  return <div className="portal-page-header mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="portal-breadcrumb mb-2 text-xs font-bold uppercase tracking-[.16em]">VINAMILK HRM / {title}</p><h1 className="text-2xl font-black tracking-tight sm:text-3xl">{title}</h1><p className="portal-page-description mt-1 text-sm">{description}</p></div>{actions && <div className="flex gap-2">{actions}</div>}</div>;
}
