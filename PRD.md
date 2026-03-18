# AI PDF Builder - MVP 需求文档 (PRD)

## 1. 产品定位 (Value Proposition)
一个极简的单页面 Web 工具，用户输入自然语言需求，AI 自动生成排版精美的 PDF 文档（如：NDA、简历、周报、收据），支持即时预览和本地导出，无需注册，无需后端存储。

## 2. 核心用户场景 (User Stories)
1. **快速起草**：用户输入“我公司 A 和 B 签个保密协议”，AI 填充法律条款。
2. **即时预览**：用户在下载前看到 AI 生成的文档外观。
3. **本地导出**：点击下载，利用浏览器内核将内容精准保存为 A4 格式 PDF。

## 3. 功能需求 (Functional Requirements)

### 3.1 核心功能 (Must-Have)
* **输入模块**：一个文本域（Textarea），支持自然语言描述需求。
* **文档类型选择**：预设常用模板（NDA、商业计划书、个人简历、会议纪要）。
* **AI 生成引擎**：对接 DeepSeek API，将输入转化为带内联 CSS 的 HTML。
* **实时预览区**：一个 Iframe 或 Div，用于展示生成的 HTML 效果。
* **导出模块**：调用 `window.print()` 实现“打印到 PDF”。

### 3.2 性能与成本控制 (Efficiency)
* **无存储架构**：文档内容仅存在于内存，刷新即消失，保护隐私且零数据库成本。
* **边缘计算**：逻辑部署在 Cloudflare Workers，响应速度快且几乎免费。
* **内存图片处理**：若涉及图片，由 AI 生成 Data URI (Base64) 直接嵌入。

## 4. 技术架构 (Technical Stack)

| 组件 | 选型 | 理由 |
| :--- | :--- | :--- |
| **部署/后端** | Cloudflare Workers | 零维护成本，全球加速，极简部署。 |
| **AI 模型** | DeepSeek-Chat (V3) | 极致性价比，每 100 万 Token 仅约 0.1-0.2 美元。 |
| **PDF 渲染** | Browser Native Print | 最经济方案，无需付费 PDF API，完美支持 A4。 |
| **前端框架** | Vanilla JS / Tailwind CSS | 轻量化，单个 HTML 文件即可搞定，极致加载速度。 |

## 5. 交互流程 (Interaction Flow)
1. **用户操作**：打开网页 -> 选择文档类型 -> 输入需求 -> 点击“生成预览”。
2. **API 请求**：前端发送 POST 请求至 Cloudflare Worker。
3. **AI 处理**：Worker 调用 DeepSeek，返回带样式的 HTML。
4. **结果展示**：前端渲染 HTML 到预览窗口。
5. **导出结果**：用户点击“下载 PDF” -> 触发浏览器打印预览 -> 保存为 PDF。

## 6. MVP 衡量指标 (Success Metrics)
* **生成成功率**：AI 返回有效 HTML 的比例。
* **成本控制**：单次生成文档的 API 成本控制在 $0.001 以内。
* **用户满意度**：导出的 PDF 格式是否专业。
