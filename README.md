# 🚀 PayPhrase AI: AI-Driven Natural Language Invoicing & Settlement Tool


**PayPhrase AI** 是一款将 AI 的自然语言交互与 Web3 链上清结算完美融合的智能发票工具。它允许全球自由职业者、外贸商家通过“说大白话”在几秒钟内生成合规发票、自动化交付给买家，并完成去中心化的加密货币自动结算与对账。

---

## 💡 核心痛点与解决方案

* **传统跨境开票繁琐**：商家需要手动填写大量表格，跨国打款周期长、手续费高。
* **Web3 支付门槛高**：非技术用户面对复杂的钱包地址和链上操作容易犯错，且缺乏合规的票据流。
* **解决方案**：**PayPhrase AI** 打造了“Chat-to-Invoice”的全新范式。AI 负责解析语义和自动化工作流，Web3 负责底层的即时清结算，为 Web2 商业进入 Web3 铺平道路。

---

## ✨ 核心特性 (Features)

* 💬 **AI 原生双模编辑 (Artifacts UI)**：左侧与 AI 机器人聊天开票，右侧发票卡片实时流式渲染。支持 AI 继续对话微调，也支持商家直接在发票表单上点击修改。
* 📄 **自动化票据与邮件分发**：一键确认，前端自动完成发票网页的 PDF 截图下载；同时后端通过 AI 自动向买家邮箱发送带专属支付链接的账单。
* 🔌 **无缝 Web3 链上支付**：买家无需翻看繁琐的链上历史，打开链接一键连接小狐狸 (MetaMask)，即可在 Base / ETH 上直接一键支付 USDC。
* 🔔 **闭环自动对账与收据**：系统实时监听链上交易状态，支付成功后，自动触发第二阶段工作流——更新账单状态，并为双方自动发送链上存证的收据邮件。

---

## 🛠️ 技术栈 (Tech Stack)

| 模块 | 采用技术 |
| :--- | :--- |
| **前端框架** | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| **UI 组件库** | shadcn/ui, Lucide React |
| **AI 核心** | Vercel AI SDK, Z.AI API (Structured Outputs) |
| **Web3 注入** | RainbowKit, Wagmi, Viem (Base Sepolia / ETH Testnet) |
| **邮件自动化** | Resend API |
| **PDF 生成** | html2canvas, jspdf |

---

## 🚀 快速开始 (Getting Started)

1. 克隆并安装依赖
```bash
git clone [https://github.com/yourusername/payphrase-ai.git](https://github.com/yourusername/payphrase-ai.git)
cd payphrase-ai
npm install

2. 配置环境变量
在项目根目录下创建 .env.local 文件：
Code snippet
OPENAI_API_KEY=your_openai_api_key
RESEND_API_KEY=your_resend_api_key
NEXT_PUBLIC_WC_PROJECT_ID=your_walletconnect_project_id

3. 启动开发服务器
Bash
npm run dev
打开 http://localhost:3000 即可体验。