/*
 * Student Tools — tool catalogue
 * ------------------------------------------------------------
 * To add a new tool, copy one object in the TOOLS list below,
 * change its fields, and (optionally) create a page in /tools/.
 *
 *   id        short unique name, used in links
 *   name      display name
 *   icon      an emoji shown on the card
 *   category  used by the filter buttons on the home page
 *   summary   one sentence shown on the card
 *   page      the guide page for this tool (relative to the site root)
 *   openUrl   where the "Open tool" button goes. For self-hosted tools
 *             this is your school's own server address.
 *   source    project homepage / source code
 */
const TOOLS = [
  {
    id: "stirling-pdf",
    name: "Stirling PDF",
    icon: "📄",
    category: "PDF & Documents",
    summary:
      "Merge, split, compress, convert, rotate and OCR PDF files — all in one place, without uploading your work to unknown websites.",
    page: "tools/stirling-pdf.html",
    // ⚠ Change this to the address where your school hosts Stirling PDF,
    //   e.g. "https://pdf.myschool.edu" or "http://192.168.1.20:8080".
    openUrl: "http://localhost:8080",
    source: "https://github.com/Stirling-Tools/stirling-pdf",
    tags: ["merge", "split", "compress", "convert", "ocr", "sign", "watermark"],
  },

  // Example of the next tool — remove the // to enable it.
  // {
  //   id: "my-next-tool",
  //   name: "My Next Tool",
  //   icon: "🧮",
  //   category: "Maths",
  //   summary: "What this tool helps students do.",
  //   page: "tools/my-next-tool.html",
  //   openUrl: "https://example.com",
  //   source: "https://github.com/...",
  //   tags: ["maths"],
  // },
];
