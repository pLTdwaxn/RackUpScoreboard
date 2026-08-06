import { Avatar } from "@heroui/react";
import type { ComponentProps } from "react";

type PlayerAvatarProps = {
  className?: string;
  avatarColor?: string;
  avatarColor2?: string;
  avatarAccentColor?: string;
  avatarBackground?: string;
  initials: string;
  size?: ComponentProps<typeof Avatar>["size"];
};

export default function PlayerAvatar({
  className = "",
  avatarColor,
  avatarColor2,
  avatarAccentColor,
  avatarBackground,
  initials,
  size = "lg",
}: PlayerAvatarProps) {
  const fallbackTextSize = size === "sm" ? "text-xs" : "text-lg";
  const fallbackBackground = avatarBackground
    ? avatarBackground
    : avatarAccentColor && avatarColor && avatarColor2
    ? `linear-gradient(135deg, ${avatarColor} 0%, ${avatarColor} 48%, ${avatarAccentColor} 62%, ${avatarColor2} 100%)`
    : avatarColor && avatarColor2
    ? `linear-gradient(135deg, ${avatarColor}, ${avatarColor2})`
    : "var(--player-avatar-background)";

  return (
    <Avatar size={size} className={className}>
      <Avatar.Image />
      <Avatar.Fallback
        className={`relative isolate overflow-hidden font-sans font-medium transition-colors duration-500 ${fallbackTextSize}`}
        style={{
          background: avatarColor ?? "var(--player-primary)",
          color: "#fff",
        }}
      >
        <span
          aria-hidden="true"
          className="absolute -inset-4 z-0 scale-125 blur-xl brightness-110 saturate-175"
          style={{ background: fallbackBackground }}
        />
        <span className="relative z-10">{initials}</span>
      </Avatar.Fallback>
    </Avatar>
  );
}
