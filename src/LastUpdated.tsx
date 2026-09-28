interface LastUpdatedProps {
  at: number | null;
  className?: string;
}

export function LastUpdated({ at, className = "" }: LastUpdatedProps) {
  if (at === null) return null;

  const formatted = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(at);

  return (
    <p className={`last-updated ${className}`}>
      Last updated: <time dateTime={new Date(at).toISOString()}>{formatted}</time>
    </p>
  );
}
