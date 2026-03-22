import type { APIRoute } from "astro";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const fontRegular = readFileSync(
  resolve(
    "./node_modules/@fontsource/inter/files/inter-latin-400-normal.woff",
  ),
);
const fontBold = readFileSync(
  resolve(
    "./node_modules/@fontsource/inter/files/inter-latin-700-normal.woff",
  ),
);

export const GET: APIRoute = async () => {
  const COLS = 25;
  const ROWS = 13;
  const dotSpacing = 48;
  const dots: { x: number; y: number }[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      dots.push({ x: c * dotSpacing, y: r * dotSpacing });
    }
  }

  const svg = await satori(
    {
      type: "div",
      props: {
        style: {
          width: "1200px",
          height: "630px",
          backgroundColor: "#1a2236",
          display: "flex",
          flexDirection: "column",
          fontFamily: "Inter",
          position: "relative",
          overflow: "hidden",
        },
        children: [
          // Dot grid
          {
            type: "div",
            props: {
              style: { position: "absolute", inset: "0", display: "flex" },
              children: dots.map(({ x, y }) => ({
                type: "div",
                props: {
                  style: {
                    position: "absolute",
                    left: `${x}px`,
                    top: `${y}px`,
                    width: "2px",
                    height: "2px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(250, 204, 21, 0.08)",
                  },
                },
              })),
            },
          },

          // Top accent bar
          {
            type: "div",
            props: {
              style: {
                position: "absolute",
                top: "0",
                left: "0",
                right: "0",
                height: "5px",
                background:
                  "linear-gradient(to right, #facc15, rgba(250,204,21,0.1))",
              },
            },
          },

          // Content
          {
            type: "div",
            props: {
              style: {
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                padding: "52px 64px",
                position: "relative",
                gap: "24px",
              },
              children: [
                // Terminal prompt
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    },
                    children: [
                      // ➜ as SVG
                      {
                        type: "svg",
                        props: {
                          width: "26",
                          height: "26",
                          viewBox: "0 0 24 24",
                          fill: "none",
                          children: {
                            type: "path",
                            props: {
                              d: "M5 12h14M13 6l6 6-6 6",
                              stroke: "#facc15",
                              "stroke-width": "2.5",
                              "stroke-linecap": "round",
                              "stroke-linejoin": "round",
                            },
                          },
                        },
                      },
                      {
                        type: "span",
                        props: {
                          style: {
                            color: "rgba(226,232,240,0.5)",
                            fontSize: "24px",
                          },
                          children: "~/yaayes.dev",
                        },
                      },
                      {
                        type: "span",
                        props: {
                          style: {
                            width: "12px",
                            height: "26px",
                            backgroundColor: "#facc15",
                            borderRadius: "1px",
                            opacity: 0.9,
                          },
                        },
                      },
                    ],
                  },
                },

                // Tagline
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: "68px",
                      fontWeight: 700,
                      color: "#e2e8f0",
                      lineHeight: 1.15,
                      letterSpacing: "-0.03em",
                    },
                    children: "DevOps, real talk.",
                  },
                },

                // Sub-tagline
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: "26px",
                      color: "rgba(226,232,240,0.45)",
                      fontFamily: "Inter",
                    },
                    children:
                      "Kubernetes, CI/CD, security, and tools that actually work.",
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Inter", data: fontRegular, weight: 400, style: "normal" },
        { name: "Inter", data: fontBold, weight: 700, style: "normal" },
      ],
    },
  );

  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } });
  const pngData = resvg.render();

  return new Response(pngData.asPng(), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
