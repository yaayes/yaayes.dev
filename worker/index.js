import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");

    // Only allow requests from your domain
    const allowedOrigins = [
      "https://yaayes.dev",
      "http://localhost:4321", // For local development
      "http://127.0.0.1:4321",
    ];

    const isAllowed = allowedOrigins.includes(origin);

    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": isAllowed ? origin : "https://yaayes.dev",
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

      // Manual trigger for popular posts update (for testing)
      if (url.pathname === "/trigger-update" && request.method === "POST") {
        try {
          const result = await updatePopularPosts(env);
          return new Response(
            JSON.stringify({ success: true, posts: result }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        } catch (error) {
          return new Response(
            JSON.stringify({ error: error.message, stack: error.stack }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }
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
  console.log("Starting popular posts update...");
  console.log("Zone ID:", env.CLOUDFLARE_ZONE_ID);
  console.log("Date range:", getWeekAgo(), "to", getNow());
  
  const query = `
    query {
      viewer {
        zones(filter: {zoneTag: "${env.CLOUDFLARE_ZONE_ID}"}) {
          httpRequestsAdaptiveGroups(
            filter: {
              datetime_geq: "${getWeekAgo()}"
              datetime_lt: "${getNow()}"
            }
            limit: 100
            orderBy: [count_DESC]
          ) {
            dimensions {
              clientRequestPath
            }
            count
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
    const errorText = await response.text();
    console.error("Analytics API error:", response.status, errorText);
    throw new Error(`Failed to fetch analytics data: ${response.status}`);
  }

  const result = await response.json();
  console.log("Analytics API result:", JSON.stringify(result, null, 2));

  if (result.errors) {
    console.error("GraphQL errors:", result.errors);
    throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
  }
  
  const httpGroups =
    result.data?.viewer?.zones?.[0]?.httpRequestsAdaptiveGroups || [];
  
  console.log(`Total requests found: ${httpGroups.length}`);

  // Log all paths to see what we're getting
  httpGroups.forEach((group, idx) => {
    if (idx < 20) {
      // Log first 20
      console.log(
        `Path ${idx + 1}: ${group.dimensions.clientRequestPath} (${group.count} requests)`,
      );
    }
  });

  // Filter only blog posts and format
  const popularPosts = httpGroups
    .filter((group) => {
      const path = group.dimensions.clientRequestPath;
      const isBlogPost =
        path.startsWith("/blog/") &&
        path !== "/blog/" &&
        !path.includes("/tag/");
      if (isBlogPost) {
        console.log(`Matched blog post: ${path}`);
      }
      return isBlogPost;
    })
    .map((group) => ({
      path: group.dimensions.clientRequestPath,
      views: group.count,
      title:
        group.dimensions.clientRequestPath
          .split("/blog/")[1]
          ?.replace(/\//g, "")
          ?.replace(/-/g, " ") || "Unknown",
    }))
    .slice(0, 5);

  // Store in KV
  await env.KV.put("popular-posts", JSON.stringify(popularPosts));

  console.log(`Updated popular posts: ${popularPosts.length} posts`);
  console.log("Popular posts:", JSON.stringify(popularPosts, null, 2));

  return popularPosts;
}

function getWeekAgo() {
  const date = new Date();
  date.setDate(date.getDate() - 1); // Changed from 7 to 1 day (24 hours max)
  return date.toISOString();
}

function getNow() {
  return new Date().toISOString();
}
