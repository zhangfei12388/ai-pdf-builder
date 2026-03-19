import { NextRequest } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { prompt, template } = await req.json();
    const apiKey = process.env.SILICONFLOW_API_KEY || process.env.NEXT_PUBLIC_SILICONFLOW_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ 
        error: "Missing SILICONFLOW_API_KEY. Please set it in Cloudflare Pages Settings -> Environment variables.",
        envKeysFound: Object.keys(process.env).filter(k => k.includes("API"))
      }), { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const templateGuides = {
      resume: "使用现代双栏布局。左侧侧边栏(30%)包含个人头像占位符、联系方式、教育背景和技能清单；右侧主栏(70%)包含自我总结、工作经历（按时间倒序）和项目经验。使用精美的字体图标（如 📧, 📱, 🔗）。工作经历必须包含公司名、职位、时间和详细描述。使用 .section-title 类区分模块。",
      nda: "使用正式的法律合同排版。标题『保密协议』居中大号加粗。条款按层级排列（一、二、... / 1.1, 1.2）。关键术语用加粗。包含明确的权利义务描述。结尾处提供规范的双方签字盖章区。",
      report: "使用高度可视化的模块化设计。顶部包含报告周期和摘要。中间使用 .item-row 展示关键指标（KPI）。本周工作和下周计划使用带检查框样式的列表。使用浅蓝背景色区分不同区域。",
      receipt: "使用仿真的票据排版。四周有虚线边框。顶部显著位置标明『收款收据』。包含日期、付款人、收款项目、人民币大写金额、小写金额、收款单位及经手人。金额部分建议使用表格呈现。"
    };

    const systemPrompt = `你是一个专业的 PDF 排版大师。
请根据需求生成一个极其精美的、符合 A4 格式的 HTML 片段。

【严格规范】：
1. 【只输出 HTML】：禁止输出 \`\`\`html 标签、markdown 标识符、代码块包装或任何解释性文字。输出必须直接以 <div 或 <style 开头。
2. 【样式补丁】：必须在开头包含一个 <style> 块，定义以下基础类并确保响应式 A4 布局：
   .a4-container { font-family: "Inter", "Source Han Sans CN", "Microsoft YaHei", sans-serif; color: #333; line-height: 1.6; width: 100%; box-sizing: border-box; }
   .section-title { border-bottom: 2px solid #2563eb; padding-bottom: 4px; margin-top: 20px; font-size: 18px; font-weight: bold; color: #1e40af; }
   .item-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
   .label { color: #666; font-weight: 500; }
3. 【避免乱码】：不要输出任何不可见字符、控制字符或非标准的 Unicode 符号。确保所有中文字符正确显示。
4. 【模板特定指南】：${templateGuides[template as keyof typeof templateGuides] || ""}
5. 【技术约束】：宽度固定在 100% (容器内部)。确保内容完整，不准截断。所有样式必须内联或在顶部的 <style> 标签中。`;

    const apiKey = process.env.SILICONFLOW_API_KEY;
    const response = await fetch("https://api.siliconflow.cn/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-ai/DeepSeek-V3",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `具体需求：${prompt}` },
        ],
        stream: true,
        max_tokens: 4000,
        temperature: 0.2,
      }),
    });

    return new Response(response.body, {
      headers: { "Content-Type": "text/event-stream" },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
