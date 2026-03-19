"use client";

import { useState } from "react";

const TEMPLATES = [
  { id: "nda", name: "NDA (保密协议)" },
  { id: "resume", name: "个人简历" },
  { id: "report", name: "周报/月报" },
  { id: "receipt", name: "收据/发票" },
];

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [template, setTemplate] = useState("nda");
  const [previewHtml, setPreviewHtml] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt) {
      alert("请输入具体需求后再生成预览");
      return;
    }
    
    setIsGenerating(true);
    setPreviewHtml(""); 
    
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, template }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `生成失败: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8"); // 指定 UTF-8 解码
      let rawText = "";

      if (!reader) throw new Error("无法读取流数据");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // 关键点：使用 TextDecoder 对分块进行正确解码，不带流状态解码可能产生乱码
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (dataStr === "[DONE]") continue;
            try {
              const data = JSON.parse(dataStr);
              const content = data.choices[0].delta.content || "";
              rawText += content;
              
              // 增强实时清洗：过滤 Markdown 标识符和前导非 HTML 文本
              let displayHtml = rawText
                .replace(/```html|```|html/gi, "")
                .replace(/^[^<>]*(?=<)/, "") // 移除所有在第一个 < 之前的字符（通常是 LLM 的解释性文字）
                .trim();
              
              setPreviewHtml(displayHtml);
            } catch (e) {}
          }
        }
      }
      
    } catch (err: any) {
      console.error("生成失败:", err);
      alert(`生成失败: ${err.message || "未知错误"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>AI PDF Builder - Export</title>
            <style>
              @page { size: A4; margin: 0; }
              body { margin: 0; background: white; -webkit-print-color-adjust: exact; }
              .pdf-page { width: 210mm; min-height: 297mm; padding: 20mm; margin: 0 auto; background: white; }
            </style>
          </head>
          <body>
            <div class="pdf-page">${previewHtml}</div>
            <script>
              window.onload = () => {
                window.print();
                window.close();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans selection:bg-blue-100">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* 左侧：输入控制区 */}
        <div className="flex flex-col space-y-8 bg-white p-10 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100">
          <header className="space-y-2">
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tighter">AI PDF Builder <span className="text-sm font-bold text-white bg-blue-600 px-3 py-1 rounded-full ml-2 align-middle">PRO</span></h1>
            <p className="text-gray-400 font-medium">输入自然语言，自动为您生成精美、专业的 PDF 文档</p>
          </header>

          <div className="space-y-8 flex-1">
            <section>
              <label className="block text-sm font-bold text-gray-800 mb-4 ml-1">步骤 1：选择文档模板</label>
              <div className="grid grid-cols-2 gap-4">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTemplate(t.id)}
                    className={`py-4 px-6 rounded-2xl text-sm font-bold transition-all border-2 ${
                      template === t.id 
                        ? "bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-200" 
                        : "bg-white text-gray-500 border-gray-50 hover:border-gray-200"
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </section>

            <section className="flex-1 flex flex-col">
              <label className="block text-sm font-bold text-gray-800 mb-4 ml-1">步骤 2：详述文档要求</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="例如：帮我生成一份应聘『高级算法工程师』的简历，个人信息：张三，电话 138xxx，拥有五年 AI 经验，精通 Python、PyTorch。"
                className="w-full flex-1 min-h-[300px] p-6 bg-gray-50 border-none rounded-[1.5rem] focus:bg-white focus:ring-4 focus:ring-blue-100 outline-none transition-all resize-none text-gray-800 leading-relaxed shadow-inner font-medium text-lg"
              />
            </section>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`w-full py-6 rounded-2xl font-black text-xl text-white transition-all transform hover:scale-[1.01] active:scale-[0.98] ${
                isGenerating 
                  ? "bg-blue-300 cursor-not-allowed" 
                  : "bg-blue-600 hover:bg-blue-700 shadow-[0_15px_30px_rgba(37,99,235,0.3)]"
              }`}
            >
              {isGenerating ? "🧠 AI 正在极速排版中..." : "✨ 立即生成专业文档"}
            </button>
          </div>
        </div>

        {/* 右侧：预览区 */}
        <div className="flex flex-col space-y-6">
          <div className="flex justify-between items-end px-4">
            <div>
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">A4 Real-time Preview</h2>
              <p className="text-gray-900 font-bold text-lg">实时文档预览</p>
            </div>
            {previewHtml && (
              <button
                onClick={handleDownload}
                className="group flex items-center space-x-2 bg-black hover:bg-gray-800 text-white px-8 py-3.5 rounded-2xl font-black transition-all shadow-2xl"
              >
                <span>下载 PDF</span>
                <svg className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
              </button>
            )}
          </div>
          
          <div className="flex-1 bg-[#e2e8f0] rounded-[2.5rem] shadow-inner overflow-hidden relative border-[12px] border-white min-h-[800px]">
            {previewHtml ? (
              <div className="w-full h-full overflow-auto p-12 bg-[#cbd5e1]/30 scroll-smooth">
                <div 
                  className="bg-white shadow-[0_30px_60px_-12px_rgba(0,0,0,0.15)] mx-auto min-h-[1123px] w-[794px] p-[60px] transform origin-top scale-[0.9] lg:scale-[0.7] xl:scale-[0.8] transition-all duration-700 rounded-sm"
                  dangerouslySetInnerHTML={{ __html: previewHtml }} 
                />
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 space-y-6">
                <div className="w-24 h-24 bg-white/50 rounded-full flex items-center justify-center animate-pulse">
                  <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3m0 0a10.003 10.003 0 0110 10c0 1.033-.155 2.03-.44 2.962m-4.783 3.39L12 21m0-21a10.003 10.003 0 00-10 10c0 1.033.155 2.03.44 2.962m4.783 3.39L12 21" />
                  </svg>
                </div>
                <p className="font-bold text-gray-400 uppercase tracking-tighter">等待数据输入</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
