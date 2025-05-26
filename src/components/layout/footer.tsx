
export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="container py-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} ClipperConnect. All rights reserved.</p>
        <p className="mt-1">
          Made with <span className="text-destructive">&hearts;</span> for happy haircuts.
        </p>
      </div>
    </footer>
  );
}
