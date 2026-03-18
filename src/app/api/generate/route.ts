import { NextRequest, NextResponse } from "next/server";

/**
 * AI PDF Builder - 万能 AI 代理接口
 * 已更新：默认使用 SiliconFlow 提供的 DeepSeek-R1-0528 模型
 */
export async function POST(req: NextRequest) {
  try {
    const { prompt, template, provider = "siliconflow" } = await req.json();

    const systemPrompt = `你是一个专业的 PDF 文档生成助手。
请根据用户的需求，生成一段排版精美的 HTML 内容。
要求：
1. 必须包含内联 CSS 样式，确保在 A4 纸张范围内（约 794px 宽）显示完美。
2. 仅返回 <div>...</div> 包装的 HTML 代码片段，不要包含 <html> 或 <body> 标签。
3. 样式风格需根据模板类型调整：${template}。
4. 内容必须专业且完整。
5. 不要输出任何 Markdown 标签或解释性文字，只输出 HTML 代码本身。`;

    let result = "";

    // --- Provider 路由逻辑 ---
    switch (provider) {
      case "siliconflow":
        result = await callSiliconFlow(systemPrompt, prompt);
        break;
      case "deepseek":
        result = await callDeepSeek(systemPrompt, prompt);
        break;
      case "gemini":
        result = await callGemini(systemPrompt, prompt);
        break;
      default:
        return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
    }

    // 再次清理可能存在的 <think> 标签或 Markdown 块
    const cleanedHtml = result
      .replace(/<think>[\s\S]*?<\/think>/g, "") // 移除 R1 的思考过程
      .replace(/```html|```/g, "")
      .trim();

    return NextResponse.json({ html: cleanedHtml });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- SiliconFlow 实现 ---
async function callSiliconFlow(system: string, user: string) {
  const apiKey = process.env.SILICONFLOW_API_KEY;
  if (!apiKey) return "<div>请配置 SILICONFLOW_API_KEY 环境变量</div>";

  const response = await fetch("https://api.siliconflow.cn/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-ai/DeepSeek-R1", // 硅基流动上的 R1 模型标识
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      stream: false
    }),
  });
  
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices[0].message.content;
}

// --- 其他 Provider 保持现状 (略) ---
async function callDeepSeek(system: string, user: string) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return "<div>请配置 DEEPSEEK_API_KEY 环境变量</div>";
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "system", content: system }, { role: "user", content: user }]
    }),
  });
  const data = await response.json();
  return data.choices[0].message.content;
}

async function callGemini(system: string, user: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return "<div>请配置 GEMINI_API_KEY 环境变量</div>";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: `${system}\n\nRequest: ${user}` }] }] }),
  });
  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}
