type ClassValue = string | undefined | null | false | Record<string, boolean>;

function clsx(...args: ClassValue[]): string {
  return args
    .flatMap((a) => {
      if (!a) return [];
      if (typeof a === 'string') return [a];
      return Object.entries(a)
        .filter(([, v]) => v)
        .map(([k]) => k);
    })
    .join(' ');
}

export function cn(...classes: ClassValue[]): string {
  return clsx(...classes);
}
