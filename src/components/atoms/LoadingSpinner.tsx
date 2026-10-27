import Image from "next/image";

export default function LoadingSpinner({ size = 48, fullScreen = true }: { size?: number; fullScreen?: boolean }) {
  return (
    <div className={`flex items-center justify-center ${fullScreen ? "flex-1 py-24" : "py-12"}`}>
      <Image src="/wakaline-icon.png" alt="Loading..." width={size} height={size} className="animate-pulse" />
    </div>
  );
}
