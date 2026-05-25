import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KAIVert",
    short_name: "KAIVert",
    description: "Workout tracker",
    start_url: "/",
    display: "standalone",
    background_color: "#08080d",
    theme_color: "#0041C2",
    orientation: "portrait",
    icons: [
      { src: "/icon", sizes: "192x192", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
