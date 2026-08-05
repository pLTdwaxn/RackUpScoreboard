import type { Preview } from "@storybook/nextjs-vite";
import type { CSSProperties } from "react";

import "../src/app/globals.css";
import "../src/styles/player-theme.css";

import Providers from "../src/app/providers";

const preview: Preview = {
  decorators: [
    (Story) => (
      <Providers>
        <div
          style={
            {
              "--font-geist-sans":
                'Geist, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              "--font-geist-mono":
                'Geist Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
            } as CSSProperties
          }
        >
          <Story />
        </div>
      </Providers>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: "centered",
  },
};

export default preview;
