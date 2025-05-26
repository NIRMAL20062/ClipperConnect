
"use client";

import { useState, useEffect } from 'react';

export function Footer() {
  // Initialize with the current year. This will be the server's year on SSR,
  // and client's year on initial client render.
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());

  useEffect(() => {
    // This effect runs only on the client, after the initial hydration.
    // It ensures the displayed year is definitively the client's current year.
    // If the server rendered a different year (e.g., if the request crossed midnight UTC),
    // this will update it. The `suppressHydrationWarning` on a parent (html/body)
    // should handle the minor text difference if it occurs.
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="border-t bg-card">
      <div className="container py-8 text-center text-sm text-muted-foreground">
        <p>&copy; {currentYear} ClipperConnect. All rights reserved.</p>
        <p className="mt-1">
          Made with <span className="text-destructive">&hearts;</span> for happy haircuts.
        </p>
      </div>
    </footer>
  );
}
