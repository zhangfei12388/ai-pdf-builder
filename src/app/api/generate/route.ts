import { NextRequest, NextResponse } from "next/server";

/**
 * AI PDF Builder - 万能 AI 代理接口
 * 支持切换不同的 Provider: deepseek, gemini, cloudflare, groq
 */
export async function POST(req: NextRequest) {
  try {
    const { prompt, template, provider = "deepseek" } = await req.json();

    const systemPrompt = `你是一个专业的 PDF 文档生成助手。
请根据用户的需求，生成一段排版精美的 HTML 内容。
要求：
1. 必须包含内联 CSS 样式，确保在 A4 纸张范围内（约 794px 宽）显示完美。
2. 仅返回 <div>...</div> 包装的 HTML 代码片段，不要包含 <html> 或 <body> 标签。
3. 样式风格需根据模板类型调整：${template}。
4. 内容必须专业且完整。`;

    let result = "";

    // --- Provider 路由逻辑 ---
    switch (provider) {
      case "deepseek":
        // 示例：DeepSeek V3
        result = await callDeepSeek(systemPrompt, prompt);
        break;
      case "gemini":
        // 示例：Gemini 1.5 Flash
        result = await callGemini(systemPrompt, prompt);
        break;
      case "cloudflare":
        // 示例：Cloudflare Workers AI (需在 CF 环境运行)
        result = "<div>[Cloudflare AI 模式暂需部署后激活]</div>";
        break;
      default:
        return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
    }

    return NextResponse.json({ html: result });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- 具体 Provider 实现函数 ---

async function callDeepSeek(system: string, user: string) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return "<div>请配置 DEEPSEEK_API_KEY 环境变量</div>";

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: window ? null : JSON.stringify({ // 仅在服务端运行
      model: "deepseek-chat",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "text" }
    }),
  });
  
  const data = await response.json();
  return data.choices[0].message.content;
}

async function callGemini(system: string, user: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return "<div>请配置 GEMINI_API_KEY 环境变量</div>";

  // Gemini 官方 SDK 的简单 REST 实现
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: `${system}\n\nUser Request: ${user}` }]
      }]
    }),
  });

  const data = await response.json();
  return data.candidates[0].content.parts[0].text.replace(/```html|```/g, "").trim();
}
