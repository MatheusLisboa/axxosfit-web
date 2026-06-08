import { cn } from "./utils";
import { getDisplayInitials, resolveAvatarSrc } from "../../../lib/avatarUtils";

interface AvatarProps {
  src?: string;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  online?: boolean;
}

const sizes = {
  xs: "w-6 h-6 text-xs",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
};

const onlineSizes = {
  xs: "w-1.5 h-1.5",
  sm: "w-2 h-2",
  md: "w-2.5 h-2.5",
  lg: "w-3 h-3",
  xl: "w-3.5 h-3.5",
};

function getColor(name?: string) {
  const colors = [
    "from-indigo-500 to-violet-600",
    "from-violet-500 to-purple-600",
    "from-emerald-500 to-teal-600",
    "from-rose-500 to-pink-600",
    "from-amber-500 to-orange-600",
    "from-sky-500 to-blue-600",
    "from-fuchsia-500 to-pink-600",
  ];
  if (!name) return colors[0];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

export function Avatar({ src, name, size = "md", className, online }: AvatarProps) {
  const photoSrc = resolveAvatarSrc(src);

  return (
    <div className={cn("relative shrink-0", className)}>
      <div className={cn("rounded-full overflow-hidden flex items-center justify-center", sizes[size])}>
        {photoSrc ? (
          <img src={photoSrc} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className={cn("w-full h-full bg-gradient-to-br flex items-center justify-center text-white font-semibold", getColor(name))}>
            {getDisplayInitials(name)}
          </div>
        )}
      </div>
      {online !== undefined && (
        <span className={cn(
          "absolute bottom-0 right-0 rounded-full border-2 border-background",
          onlineSizes[size],
          online ? "bg-emerald-400" : "bg-muted-foreground"
        )} />
      )}
    </div>
  );
}
