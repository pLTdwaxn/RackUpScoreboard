import { ScrollShadow } from "@heroui/react";

export default function MatchLog() {
  return (
    <ScrollShadow hideScrollBar className="px-2" size={20}>
      {Array.from({ length: 10 }).map((_, idx) => (
        <p key={`scroll-shadow-lorem-content-${idx}`}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam
          pulvinar risus non risus hendrerit venenatis. Pellentesque sit amet
          hendrerit risus, sed porttitor quam. Morbi accumsan cursus enim, sed
          ultricies sapien.
        </p>
      ))}
    </ScrollShadow>
  );
}
