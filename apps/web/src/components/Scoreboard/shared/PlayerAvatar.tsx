import { Avatar } from "@heroui/react";
import type { ComponentProps } from "react";

type PlayerAvatarProps = {
  isFrameWinner?: boolean;
  avatarColor: string;
  avatarColor2: string;
  initials: string;
  size?: ComponentProps<typeof Avatar>["size"];
};

export default function PlayerAvatar({
  isFrameWinner = false,
  avatarColor,
  avatarColor2,
  initials,
  size = "lg",
}: PlayerAvatarProps) {
  const fallbackTextSize = size === "sm" ? "text-xs" : "text-lg";

  return (
    <Avatar size={size} className={isFrameWinner ? "winner-avatar-glow" : ""}>
      <Avatar.Image />
      <Avatar.Fallback
        className={`font-sans font-medium transition-colors duration-500 ${fallbackTextSize}`}
        style={{
          background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor2})`,
          color: "#fff",
        }}
      >
        {initials}
      </Avatar.Fallback>
    </Avatar>
  );
}
