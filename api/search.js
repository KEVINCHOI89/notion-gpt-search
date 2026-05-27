export default async function handler(req, res) {
  try {
    const query = (req.query.q || "").toString().trim();

    const NOTION_TOKEN = process.env.NOTION_TOKEN;
    const DATABASE_ID = process.env.NOTION_DATABASE_ID;

    if (!NOTION_TOKEN || !DATABASE_ID) {
      return res.status(500).json({
        error: "Missing NOTION_TOKEN or NOTION_DATABASE_ID",
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
          page_size: 50,
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

    const results = (data.results || [])
      .map((page) => {
        const props = page.properties || {};

        let title = "제목없음";

        for (const key in props) {
          if (props[key].type === "title") {
            title =
              props[key].title?.map((t) => t.plain_text).join("") ||
              "제목없음";
            break;
          }
        }

        return {
          title,
          url: page.url,
          id: page.id,
        };
      })
      .filter((item) => {
        if (!query) return true;
        return item.title.toLowerCase().includes(query.toLowerCase());
      })
      .slice(0, 20);

    return res.status(200).json({
      query,
      count: results.length,
      results,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Server error",
      detail: error.message,
    });
  }
}
