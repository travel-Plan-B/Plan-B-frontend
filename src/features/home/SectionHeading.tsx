interface SectionHeadingProps {
  title: string;
}

export function SectionHeading({ title }: SectionHeadingProps) {
  return (
    <header className="mx-auto mb-9 max-w-3xl text-center sm:mb-12">
      <h2 className="text-[28px] font-bold tracking-tight text-neutral-900 sm:text-[32px]">
        {title}
      </h2>
    </header>
  );
}
