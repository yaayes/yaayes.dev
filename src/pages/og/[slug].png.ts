import type { GetStaticPaths, APIRoute } from "astro";
import { getCollection } from "astro:content";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getReadingTime } from "../../utils/reading-time";

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getCollection("posts");
  return posts
    .filter((post) => !post.data.draft)
    .map((post) => ({
      params: { slug: post.slug },
      props: { post },
    }));
};

// Load fonts once — at build time via static generation
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

export const GET: APIRoute = async ({ props }) => {
  const { post } = props;

  const title = post.data.title;
  const description = post.data.description ?? "";
  const tags = post.data.tags?.slice(0, 4) ?? [];
  const author = post.data.author ?? "Yassine Sedrani";
  const readingTimeStr = getReadingTime(post.body ?? "");
  const date = post.data.pubDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Build a dot-grid background via repeated inline circles
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
          // ─── Dot grid background ───────────────────────────────────
          {
            type: "div",
            props: {
              style: {
                position: "absolute",
                inset: "0",
                display: "flex",
              },
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

          // ─── Amber top accent bar ───────────────────────────────────
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

          // ─── Main content ───────────────────────────────────────────
          {
            type: "div",
            props: {
              style: {
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "52px 64px 48px",
                position: "relative",
              },
              children: [
                // Top row: terminal logo + tags
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    },
                    children: [
                      // Terminal prompt logo — SVG arrow + ~/yaayes.dev + cursor
                      {
                        type: "div",
                        props: {
                          style: {
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          },
                          children: [
                            // ➜ rendered as SVG so it works regardless of font coverage
                            {
                              type: "svg",
                              props: {
                                width: "22",
                                height: "22",
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
                                  fontSize: "20px",
                                  fontFamily: "Inter",
                                  letterSpacing: "-0.01em",
                                },
                                children: "~/yaayes.dev",
                              },
                            },
                            {
                              type: "span",
                              props: {
                                style: {
                                  width: "10px",
                                  height: "22px",
                                  backgroundColor: "#facc15",
                                  borderRadius: "1px",
                                  opacity: 0.9,
                                },
                              },
                            },
                          ],
                        },
                      },

                      // Tag pills (right side)
                      {
                        type: "div",
                        props: {
                          style: {
                            display: "flex",
                            gap: "8px",
                            flexWrap: "wrap",
                            justifyContent: "flex-end",
                            maxWidth: "420px",
                          },
                          children: tags.map((tag) => ({
                            type: "div",
                            props: {
                              style: {
                                border: "1px solid rgba(250,204,21,0.4)",
                                borderRadius: "6px",
                                padding: "4px 12px",
                                fontSize: "14px",
                                color: "rgba(250,204,21,0.85)",
                                fontFamily: "Inter",
                                letterSpacing: "0.01em",
                              },
                              children: tag,
                            },
                          })),
                        },
                      },
                    ],
                  },
                },

                // Title + description block
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                    },
                    children: [
                      {
                        type: "div",
                        props: {
                          style: {
                            fontSize: title.length > 50 ? "52px" : "64px",
                            fontWeight: 700,
                            color: "#e2e8f0",
                            lineHeight: 1.15,
                            letterSpacing: "-0.03em",
                            maxWidth: "960px",
                          },
                          children: title,
                        },
                      },
                      {
                        type: "div",
                        props: {
                          style: {
                            fontSize: "22px",
                            color: "rgba(226,232,240,0.5)",
                            lineHeight: 1.4,
                            maxWidth: "900px",
                            fontFamily: "Inter",
                          },
                          children:
                            description.length > 120
                              ? description.slice(0, 117) + "..."
                              : description,
                        },
                      },
                    ],
                  },
                },

                // Bottom row: author/date | domain
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderTop: "1px solid rgba(250,204,21,0.15)",
                      paddingTop: "20px",
                    },
                    children: [
                      // Author · Date
                      {
                        type: "div",
                        props: {
                          style: {
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "18px",
                            color: "rgba(226,232,240,0.5)",
                            fontFamily: "Inter",
                          },
                          children: [
                            {
                              type: "span",
                              props: {
                                style: { color: "rgba(250,204,21,0.8)" },
                                children: author,
                              },
                            },
                            {
                              type: "span",
                              props: {
                                style: {
                                  color: "rgba(226,232,240,0.3)",
                                  fontWeight: 400,
                                },
                                children: "·",
                              },
                            },
                            {
                              type: "span",
                              props: { children: date },
                            },
                          ],
                        },
                      },

                      // Reading time
                      {
                        type: "span",
                        props: {
                          style: {
                            fontSize: "18px",
                            fontWeight: 700,
                            color: "#facc15",
                            letterSpacing: "-0.01em",
                            fontFamily: "Inter",
                          },
                          children: readingTimeStr,
                        },
                      },
                    ],
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
        {
          name: "Inter",
          data: fontRegular,
          weight: 400,
          style: "normal",
        },
        {
          name: "Inter",
          data: fontBold,
          weight: 700,
          style: "normal",
        },
      ],
    },
  );

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 1200 },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  return new Response(pngBuffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
