# WeighIn - 体重管理应用

基于 Next.js 16 开发的体重管理 H5 应用。

## 技术栈

- **框架**: Next.js 16 (App Router)
- **UI 库**: React 19
- **样式**: Tailwind CSS 4
- **组件库**: shadcn/ui
- **状态管理**: Zustand
- **表单处理**: React Hook Form + Zod
- **数据库**: MySQL + Prisma ORM

## 项目结构

```
weighin/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 首页
├── components/            # React 组件
│   └── ui/               # shadcn/ui 组件
├── lib/                  # 工具函数
│   ├── db.ts             # Prisma Client
│   ├── auth.ts           # 认证工具
│   └── utils.ts          # 通用工具
├── store/                # Zustand 状态管理
│   ├── auth-store.ts     # 认证状态
│   └── ui-store.ts       # UI 状态
├── types/                # TypeScript 类型定义
├── prisma/               # Prisma 配置
│   └── schema.prisma     # 数据库模型
└── public/               # 静态资源
```

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 启动生产服务器
npm start
```

## 数据库设置

1. 配置 `.env` 文件中的 `DATABASE_URL`
2. 运行数据库迁移：
   ```bash
   npx prisma migrate dev
   ```
3. 生成 Prisma Client：
   ```bash
   npx prisma generate
   ```

## 环境变量

在 `.env` 文件中配置：

```
DATABASE_URL="mysql://user:password@localhost:3306/weighin"
JWT_SECRET="your-secret-key-change-in-production"
```

## 更多信息

请参考 `/docs` 目录下的技术文档。
