import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Contact form endpoint
      if (url.pathname === "/contact" && request.method === "POST") {
        return await handleContact(request, env, corsHeaders);
      }

      // Get popular posts
      if (url.pathname === "/popular-posts" && request.method === "GET") {
        return await getPopularPosts(env, corsHeaders);
      }

      return new Response("Not Found", { status: 404, headers: corsHeaders });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },

  // Scheduled task to update popular posts from Analytics API
  async scheduled(event, env, ctx) {
    try {
      await updatePopularPosts(env);
    } catch (error) {
      console.error("Failed to update popular posts:", error);
    }
  },
};

// Contact form handler
async function handleContact(request, env, corsHeaders) {
  const data = await request.json();
  const { name, email, message, website } = data;

  // Honeypot check
  if (website) {
    return new Response(JSON.stringify({ error: "Spam detected" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Validate inputs
  if (!name || !email || !message) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return new Response(JSON.stringify({ error: "Invalid email address" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Rate limiting (1 submission per IP per hour)
  const clientIP = request.headers.get("CF-Connecting-IP") || "unknown";
  const rateLimitKey = `ratelimit:${clientIP}`;
  const existing = await env.KV.get(rateLimitKey);

  if (existing) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // Store rate limit (1 hour TTL)
  await env.KV.put(rateLimitKey, "1", { expirationTtl: 3600 });

  // Send email via AWS SES
  try {
    const sesClient = new SESClient({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });

    const params = {
      Source: env.SES_FROM_EMAIL,
      Destination: {
        ToAddresses: [env.SES_TO_EMAIL],
      },
      Message: {
        Subject: {
          Data: `Contact Form: ${name}`,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: `
              <h2>New Contact Form Submission</h2>
              <p><strong>From:</strong> ${name} (${email})</p>
              <p><strong>Message:</strong></p>
              <p>${message.replace(/\n/g, "<br>")}</p>
            `,
            Charset: "UTF-8",
          },
        },
      },
      ReplyToAddresses: [email],
    };

    await sesClient.send(new SendEmailCommand(params));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("SES Error:", error);
    return new Response(JSON.stringify({ error: "Failed to send email" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

// Get popular posts
async function getPopularPosts(env, corsHeaders) {
  const data = await env.KV.get("popular-posts");
  const posts = data ? JSON.parse(data) : [];

  return new Response(JSON.stringify(posts), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Update popular posts from Cloudflare Analytics API
async function updatePopularPosts(env) {
  const query = `
    query {
      viewer {
        zones(filter: {zoneTag: "${env.CLOUDFLARE_ZONE_ID}"}) {
          httpRequestsAdaptiveGroups(
            filter: {
              datetime_geq: "${getWeekAgo()}"
              datetime_lt: "${getNow()}"
            }
            limit: 10
            orderBy: [sum_requests_DESC]
          ) {
            dimensions {
              clientRequestPath
            }
            sum {
              requests
            }
          }
        }
      }
    }
  `;

  const response = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch analytics data");
  }

  const result = await response.json();
  const httpGroups =
    result.data?.viewer?.zones?.[0]?.httpRequestsAdaptiveGroups || [];

  // Filter only blog posts and format
  const popularPosts = httpGroups
    .filter((group) => group.dimensions.clientRequestPath.startsWith("/blog/"))
    .map((group) => ({
      path: group.dimensions.clientRequestPath,
      views: group.sum.requests,
      title:
        group.dimensions.clientRequestPath
          .split("/blog/")[1]
          ?.replace(/-/g, " ") || "Unknown",
    }))
    .slice(0, 5);

  // Store in KV
  await env.KV.put("popular-posts", JSON.stringify(popularPosts));

  console.log(`Updated popular posts: ${popularPosts.length} posts`);
}

function getWeekAgo() {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return date.toISOString();
}

function getNow() {
  return new Date().toISOString();
}
