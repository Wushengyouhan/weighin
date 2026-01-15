# 使用多阶段构建优化镜像大小

# 阶段1: 安装依赖
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# 复制包管理文件
COPY package.json package-lock.json* ./
RUN npm ci

# 阶段2: 构建应用
FROM node:20-alpine AS builder
WORKDIR /app

# 从 deps 阶段复制 node_modules
COPY --from=deps /app/node_modules ./node_modules
# 复制所有源代码
COPY . .

# 生成 Prisma Client
RUN npx prisma generate

# 设置环境变量（构建时）
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# 构建应用
RUN npm run build

# 阶段3: 生产运行镜像
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 注意：敏感信息（数据库密码、密钥等）不在构建时写入镜像
# 这些环境变量应该在运行时通过容器编排平台（ACK/ECS）注入
# 或在 docker run 时通过 -e 参数传入

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制必要的文件
# 复制 public 目录
COPY --from=builder /app/public ./public

# 复制 .next/standalone 目录（需要先配置 next.config.ts）
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# 确保 Prisma Client 可用
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# 切换到非 root 用户
USER nextjs

# 暴露端口
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 启动命令
CMD ["node", "server.js"]

