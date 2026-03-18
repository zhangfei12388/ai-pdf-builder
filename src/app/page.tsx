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
    setPreviewHtml(""); // 清空旧内容
    
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          template,
          provider: "siliconflow", // 切换到 SiliconFlow
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setPreviewHtml(data.html);
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
              body { margin: 0; }
            </style>
          </head>
          <body>
            ${previewHtml}
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
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 左侧：输入控制区 */}
        <div className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <header>
            <h1 className="text-2xl font-bold text-gray-900">AI PDF Builder <span className="text-sm font-normal text-blue-600 bg-blue-50 px-2 py-1 rounded ml-2">MVP</span></h1>
            <p className="text-gray-500 mt-1">输入自然语言，AI 自动生成专业文档</p>
          </header>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">选择模版</label>
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTemplate(t.id)}
                    className={`py-2 px-4 rounded-lg text-sm transition-all border ${
                      template === t.id 
                        ? "bg-blue-600 text-white border-blue-600 shadow-md" 
                        : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">具体需求 (自然语言)</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="例如：我公司（甲方）和一家技术外包公司（乙方）签署一份为期两年的保密协议，乙方需对所有源代码保密。"
                className="w-full h-48 p-4 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none text-gray-700"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`w-full py-4 rounded-lg font-bold text-white transition-all ${
                isGenerating 
                  ? "bg-blue-400 cursor-not-allowed" 
                  : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98] shadow-lg shadow-blue-200"
              }`}
            >
              {isGenerating ? "AI 正在思考并生成中..." : "生成文档预览"}
            </button>
          </div>
        </div>

        {/* 右侧：预览区 */}
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">实时预览 (A4 格式)</h2>
            {previewHtml && (
              <button
                onClick={handleDownload}
                className="text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-md active:scale-95"
              >
                下载为 PDF
              </button>
            )}
          </div>
          
          <div className="flex-1 bg-white rounded-xl shadow-inner border border-gray-200 overflow-hidden relative min-h-[600px]">
            {previewHtml ? (
              <div 
                className="w-full h-full overflow-auto bg-gray-200 p-4"
              >
                <div 
                  className="bg-white shadow-2xl mx-auto min-h-[842px] w-full max-w-[595px]"
                  dangerouslySetInnerHTML={{ __html: previewHtml }} 
                />
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 space-y-2">
                <svg className="w-16 h-16 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>暂无预览内容，请在左侧输入需求并生成</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
