export default async function handler(req, res) {
  try {
    const query =
      typeof req.query.q === "string"
        ? req.query.q.trim()
        : "";

    const NOTION_TOKEN = process.env.NOTION_TOKEN;
    const DATABASE_ID = process.env.NOTION_DATABASE_ID;

    if (!NOTION_TOKEN || !DATABASE_ID) {
      return res.status(500).json({
        error: "Missing environment variables",
      });
    }

    const response = await fetch(
      `https://api.notion.com/v1/databases/${DATABASE_ID}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NOTION_TOKEN}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          page_size: 100,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Notion API error",
        detail: data,
      });
    }

    const results = [];

    for (const page of data.results || []) {
      try {
        const props = page.properties || {};
        let title = "제목없음";

        for (const key of Object.keys(props)) {
          const prop = props[key];

          if (prop && prop.type === "title") {
            title = Array.isArray(prop.title)
              ? prop.title.map((t) => t.plain_text || "").join("")
              : "제목없음";

            break;
          }
        }

        const safeTitle = String(title).toLowerCase();
        const safeQuery = String(query).toLowerCase();

        if (!query || safeTitle.includes(safeQuery)) {
          results.push({
            title,
            url: page.url || "",
            id: page.id || "",
          });
        }
      } catch (innerError) {
        console.error("Page parse error:", innerError);
      }
    }

    return res.status(200).json({
      success: true,
      query,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      success: false,
      error: error.message || "Unknown server error",
    });
  }
}
