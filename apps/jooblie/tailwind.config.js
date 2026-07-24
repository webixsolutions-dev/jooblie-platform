import preset from "@jooblie/config/tailwind";

/** @type {import("tailwindcss").Config} */
export default {
  presets: [preset],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
};
