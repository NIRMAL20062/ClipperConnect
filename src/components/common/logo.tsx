
import type { SVGProps } from 'react';
import Link from 'next/link';

// A simple placeholder SVG logo. Replace with actual logo.
const DefaultLogoIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M7.207 7.207c.535-.535 1.236-.822 1.972-.822H14.82c.736 0 1.437.287 1.972.822.535.535.822 1.236.822 1.972V14.82c0 .736-.287 1.437-.822 1.972-.535.535-1.236.822-1.972.822H9.18c-.736 0-1.437-.287-1.972-.822-.535-.535-.822-1.236-.822-1.972V9.18c0-.736.287-1.437.822-1.972z" />
    <path d="M12 12l-2.5 2.5M12 12l2.5-2.5M12 12l2.5 2.5M12 12l-2.5-2.5" />
    <path d="M10 7L9 4" />
    <path d="M14 7l1-3" />
  </svg>
);


interface LogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showText?: boolean;
  href?: string;
}

export function Logo({ className, iconClassName, textClassName, showText = true, href = "/" }: LogoProps) {
  return (
    <Link href={href} className={cn("flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm", className)}>
      <DefaultLogoIcon className={cn("h-8 w-8 text-primary", iconClassName)} />
      {showText && <span className={cn("text-2xl font-bold text-foreground", textClassName)}>ClipperConnect</span>}
    </Link>
  );
}

// Helper for cn if not globally available (it should be via lib/utils)
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');
