import { useEffect } from "react";

/**
 * Full-screen background video component.
 * The parent container is already absolutely positioned (absolute inset-0),
 * so this video just fills 100% width/height of it.
 */
export function BackgroundVideo() {
  useEffect(() => {
    const video = document.querySelector<HTMLVideoElement>("#background-video");
    if (video) {
      video.play().catch(() => {});
    }
  }, []);

  return (
    <video
      id="background-video"
      src="/backGroundcar.mp4"
      muted
      loop
      playsInline
      autoPlay
      preload="auto"
      className="h-full w-full object-cover"
      aria-hidden="true"
    />
  );
}
