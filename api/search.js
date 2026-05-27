export default async function handler(req, res) {
  try {
    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";

    const NOTION_TOKEN = process.env.NOTION_TOKEN;
    const DATABASE_ID = process.env.NOTION_DATABASE_ID;

    if (!NOTION_TOKEN || !DATABASE_ID) {
      return res.status(500).json({ error: "Missing environment variables" });
    }

    const notionResponse = await fetch(
      `https://api.notion.com/v1/databases/${DATABASE_ID}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NOTION_TOKEN}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ page_size: 100 }),
      }
    );

    const notionData = await notionResponse.json();

    if (!notionResponse.ok) {
      return res.status(notionResponse.status).json({
        error: "Notion API error",
        detail: notionData,
      });
    }

    const results = [];
    const pages = Array.isArray(notionData.results) ? notionData.results : [];

    for (const page of pages) {
      const props = page.properties || {};
      let title = "제목없음";

      for (const key of Object.keys(props)) {
        const prop = props[key];

        if (prop && prop.type === "title" && Array.isArray(prop.title)) {
          let tempTitle = "";

          for (const t of prop.title) {
            tempTitle += t && t.plain_text ? t.plain_text : "";
          }

          title = tempTitle || "제목없음";
          break;
        }
      }

      const safeTitle = String(title).toLowerCase();
      const safeQuery = String(query).toLowerCase();

      if (!query || safeTitle.includes(safeQuery)) {
        results.push(title);
      }
    }

    return res.status(200).json({ results });
  } catch (error) {
    return res.status(500).json({
      error: "Server error",
      message: error && error.message ? error.message : "Unknown error",
    });
  }
}
