export default async function handler(req, res) {
  const query = req.query.q || "";

  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const DATABASE_ID = process.env.NOTION_DATABASE_ID;

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
        page_size: 5,
      }),
    }
  );

  const data = await response.json();

  const results = data.results
    .map((page) => {
      const title =
        page.properties?.이름?.title?.[0]?.plain_text || "제목없음";

      return {
        title,
        url: page.url,
      };
    })
    .filter((item) =>
      item.title.toLowerCase().includes(query.toLowerCase())
    );

  res.status(200).json({ results });
}
