interface LastUpdatedProps {
  at: number | null;
  className?: string;
  label?: string;
  showSeconds?: boolean;
}

export function LastUpdated({ at, className = "", label = "Last updated", showSeconds = false }: LastUpdatedProps) {
  if (at === null) return null;

  const formatted = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    ...(showSeconds ? { second: "2-digit" as const } : {}),
    timeZoneName: "short",
  }).format(at);

  return (
    <p className={`last-updated ${className}`}>
      {label}: <time dateTime={new Date(at).toISOString()}>{formatted}</time>
    </p>
  );
}
