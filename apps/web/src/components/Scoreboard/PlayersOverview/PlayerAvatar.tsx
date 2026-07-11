import { Avatar } from "@heroui/react";

type PlayerAvatarProps = {
  isFrameWinner?: boolean;
  avatarColor: string;
  avatarColor2: string;
  initials: string;
};

export default function PlayerAvatar({
  isFrameWinner = false,
  avatarColor,
  avatarColor2,
  initials,
}: PlayerAvatarProps) {
  return (
    <Avatar size="lg" className={isFrameWinner ? "winner-avatar-glow" : ""}>
      <Avatar.Image />
      <Avatar.Fallback
        className="font-sans font-medium text-lg transition-colors duration-500"
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
