export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-6">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D9CFC3" strokeWidth="1.5" className="mb-4">
        <path d="M12 21s-7.5-4.6-10-9.1C.5 8.4 2 5 5.5 5c2 0 3.5 1.2 4.5 2.8C11 6.2 12.5 5 14.5 5 18 5 19.5 8.4 22 11.9 19.5 16.4 12 21 12 21z" />
      </svg>
      <p className="text-ink-soft text-[15px] max-w-xs">{message}</p>
    </div>
  );
}
