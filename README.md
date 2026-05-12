# Time & Wealth（MVP）

一个“薪资实时计时器 + 目标规划/梦想墙”的本地化 MVP：

- 实时显示「已赚到」金额（按你设置的年薪/工作天数/工时换算）
- 里程碑进度（10k/25k/50k/100k）
- 目标规划（剩余金额、预计需要时长、预计达成时间 ETA、分类筛选、可新增/删除）
- **仅本地存储**（localStorage），不需要登录；离线可用（PWA）

## 本地运行

```bash
npm install
npm run dev
```

## 一键自动翻译（可选）

为了实现“给目标名称一键生成多语言翻译”，本项目提供了一个 **本地翻译代理服务**（不会把 Key 写进代码仓库）：

1) 在项目根目录新建文件：`.env.local`（你本地保存即可）

```bash
# DeepL API Key（free 或 pro 都可以）
DEEPL_API_KEY=你的_deepl_key

# 可选：自定义代理端口
# TRANSLATE_PROXY_PORT=8787
```

2) 启动（开两个终端任选其一）

```bash
# 方式 A：一个命令同时启动前端+代理（推荐）
npm run dev:full

# 方式 B：分别启动
npm run dev:api
npm run dev
```

启动后，在目标的“多语言名称”里点击「一键自动翻译」即可（会按你的选择覆盖重生成）。

## 语言（i18n）

右上角可切换语言（并会记住你的选择）：

- English / 中文（简体）/ 日本語 / Español / 한국어
- Français / Deutsch / Italiano / Português

## 桌面小组件（PWA 小窗）

在主界面右上角点击「桌面小组件」：

- 如果你的浏览器支持（Chrome/Edge 新版）：会打开一个**可置顶的浮窗**（类似真正桌面小组件）
- 否则会打开一个 `?widget=1` 的小窗口（可手动拖到屏幕角落）

你也可以直接打开这个小组件页面：

```
http://localhost:5173/?widget=1
```

## 一键生成分享海报

在主界面右上角点击「分享海报」：

1) 点「生成海报」
2) 然后选择「下载 PNG」或「复制图片」进行分享

## Pro 订阅（¥490/月）

当前版本为 **“模拟订阅”**（用于演示/走通解锁逻辑）：

- 免费版限制：用户自建目标最多 3 个、存钱目标最多 3 个
- 点击右上角「升级Pro」可模拟开通 Pro（¥490/月）
- Pro 解锁：无限目标/存钱目标、高级桌面小组件、一键自动翻译、导出备份（JSON）

## Stripe 真订阅（快速变现）

项目内置了 Vercel Functions（`/api`）用于 Stripe Checkout 订阅（**月付 / 年付 + 7 天试用**），并通过 webhook 把 Pro 权益写入 Supabase 表 `tw_entitlements`（前端按 `is_pro` 解锁）。

### 1) Supabase 建表（Pro 权益）

在 Supabase SQL Editor 运行：

```sql
create table if not exists public.tw_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_pro boolean not null default false,
  plan text,
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz
);

alter table public.tw_entitlements enable row level security;

create policy "tw_entitlements read own" on public.tw_entitlements
for select to authenticated
using (auth.uid() = user_id);
```

### 2) Vercel 环境变量（必须）

在 Vercel 项目 Settings → Environment Variables（Production + Preview）添加：

- `STRIPE_SECRET_KEY`（Stripe 的 secret key，测试环境通常 `sk_test_...`）
- `STRIPE_PRICE_MONTHLY`（月付 price id：`price_...`）
- `STRIPE_PRICE_YEARLY`（年付 price id：`price_...`）
- `STRIPE_WEBHOOK_SECRET`（webhook secret：`whsec_...`）
- `SUPABASE_SERVICE_ROLE_KEY`（Supabase 的 service_role key，仅服务端使用）

（前端仍然需要 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`）

## Supabase 云同步（Pro）

本项目已接入 **Supabase（邮箱魔法链接登录）**，用于手机/电脑同步与云备份。

### 1) 创建 Supabase 项目并建表

在 Supabase SQL Editor 运行：

```sql
create table if not exists public.tw_user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  device_id text,
  updated_at timestamptz not null default now()
);

alter table public.tw_user_data enable row level security;

create policy "tw_user_data read own" on public.tw_user_data
for select to authenticated
using (auth.uid() = user_id);

create policy "tw_user_data upsert own" on public.tw_user_data
for insert to authenticated
with check (auth.uid() = user_id);

create policy "tw_user_data update own" on public.tw_user_data
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

### 2) 配置环境变量

在项目根目录创建 `.env.local`：

```bash
VITE_SUPABASE_URL=你的_supabase_url
VITE_SUPABASE_ANON_KEY=你的_supabase_anon_key
# 可选：开发环境建议使用稳定的主机名，避免局域网 IP 变化导致魔法链接回跳失败
# 例如：http://MSI:5173
VITE_PUBLIC_SITE_URL=http://MSI:5173
```

### 3) 使用

打开页面右侧「云同步/云备份（Pro）」：
- 输入邮箱 → 发送登录链接 → 打开邮箱完成登录
- “同步到云端”：上传当前数据
- “从云端恢复”：拉取云端数据并覆盖本地

## Excel 导出（Pro）

在 Pro 弹窗里点击「导出 Excel」会下载 `.xlsx` 文件（包含 Summary / Goals / Savings / WageRules）。

## 构建与预览

```bash
npm run build
npm run preview
```

## 代码结构

- `src/components/TimerPanel.tsx`：计时器 + 参数设置
- `src/components/Milestones.tsx`：里程碑
- `src/components/GoalWall.tsx`：目标规划/梦想墙
- `src/store/useAppStore.ts`：zustand + 持久化（localStorage）
- `vite.config.ts`：PWA 配置（`vite-plugin-pwa`）

## 下一步可加的“更好”

- 多语言（i18n）+ 多币种/汇率策略
- 分享海报（PNG）/成就动效
- 更强的规划：储蓄率、税后口径、多收入流、净值曲线
- 桌面小组件（PWA shortcuts / widget-like UI）
