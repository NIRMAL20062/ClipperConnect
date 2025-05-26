
import { Logo } from "@/components/common/logo";

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "Loading ClipperConnect..." }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
      <Logo iconClassName="h-16 w-16 animate-pulse" showText={false} />
      <p className="mt-4 text-lg font-medium text-foreground">{message}</p>
    </div>
  );
}
