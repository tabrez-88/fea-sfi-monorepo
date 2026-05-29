import type { ReactNode } from 'react';

type PageHeaderProps = Readonly<{
  /** Small eyebrow label above the title (Figma calls this the breadcrumb). */
  eyebrow?: string;
  title: string;
  actions?: ReactNode;
}>;

/**
 * Page header: small neutral eyebrow + 40px Light title. Matches the Figma
 * content-header (node 385:11470).
 */
export function PageHeader({ eyebrow, title, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col">
        {eyebrow && (
          <p className="px-1 text-[14px] font-medium leading-[20px] text-neutral">
            {eyebrow}
          </p>
        )}
        <h1 className="text-[28px] font-light leading-[34px] tracking-[-0.56px] text-foreground sm:text-[40px] sm:leading-[30px] sm:tracking-[-0.8px]">
          {title}
        </h1>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
