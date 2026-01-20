# GitHub Actions 部署指南

## 概述

使用 GitHub Actions 自动构建 Docker 镜像并推送到阿里云容器镜像服务（ACR）。

## 前置准备

### 1. 阿里云容器镜像服务配置

1. 登录[阿里云容器镜像服务控制台](https://cr.console.aliyun.com/)
2. 创建命名空间（如果还没有）
3. 创建镜像仓库（如果需要）

### 2. 获取 ACR 凭证

需要以下信息：
- **Registry 地址**：如 `registry.cn-hangzhou.aliyuncs.com`
- **命名空间**：你的 ACR 命名空间名称
- **用户名**：阿里云账号 ID 或 RAM 用户账号 ID
- **密码**：容器镜像服务的登录密码

#### 获取登录密码

1. 在容器镜像服务控制台，点击右上角「访问凭证」
2. 设置或查看「登录密码」
3. 如果使用 RAM 用户，需要分配 `AliyunContainerRegistryFullAccess` 权限

## GitHub Secrets 配置

在 GitHub 仓库中配置以下 Secrets：

### 必需配置

进入仓库：`Settings` → `Secrets and variables` → `Actions` → `New repository secret`

添加以下 Secrets（所有都是必需的）：

| Secret 名称 | 说明 | 示例值 |
|------------|------|--------|
| `ACR_USERNAME` | 阿里云用户名或账号ID | `your-username` 或 `1234567890123456` |
| `ACR_PASSWORD` | 容器镜像服务登录密码 | `your-password` |
| `ACR_NAMESPACE` | ACR 命名空间名称 | `wushengyouhan` |
| `ACR_REPOSITORY` | 镜像仓库名称 | `weighin` |
| `ACR_REGISTRY` | Registry 地址 | `crpi-wzkmn99umn8syi28.cn-shanghai.personal.cr.aliyuncs.com` |

**配置说明：**
- `ACR_USERNAME`: 可以使用**阿里云用户名**（推荐）或**账号ID**（16位数字），RAM 用户使用 RAM 用户名
- `ACR_REGISTRY`: 完整的 Registry 地址，个人版格式如 `crpi-xxxxx.cn-shanghai.personal.cr.aliyuncs.com`
- `ACR_NAMESPACE`: 命名空间名称
- `ACR_REPOSITORY`: 镜像仓库名称

## Workflow 配置说明

### 触发条件

- **推送代码到 main/master 分支**：自动构建并推送
- **创建 tag**：构建并推送带版本标签的镜像
- **Pull Request**：只构建不推送（用于测试）
- **手动触发**：在 Actions 页面手动运行

### 镜像标签策略

- `latest`：main/master 分支的镜像
- `main-{commit-sha}`：基于 commit SHA 的标签
- `v1.0.0`：基于 tag 的版本标签
- `1.0`：主要版本标签

### 构建优化

- 使用 Docker Buildx 多平台构建
- 启用缓存加速构建（使用 ACR 作为缓存源）
- 指定平台为 `linux/amd64`

## 使用流程

### 1. 推送代码

```bash
git add .
git commit -m "feat: update code"
git push origin main
```

### 2. 查看构建状态

- 在 GitHub 仓库的 `Actions` 标签页查看构建进度
- 构建成功后，镜像会自动推送到 ACR

### 3. 查看镜像

在阿里云容器镜像服务控制台查看：
- 命名空间 → 镜像仓库 → 查看标签

## 镜像地址格式

```
registry.cn-hangzhou.aliyuncs.com/{namespace}/weighin:latest
```

示例：
```
registry.cn-hangzhou.aliyuncs.com/my-namespace/weighin:latest
registry.cn-hangzhou.aliyuncs.com/my-namespace/weighin:main-abc1234
registry.cn-hangzhou.aliyuncs.com/my-namespace/weighin:v1.0.0
```

## 拉取和使用镜像

```bash
# 登录 ACR（首次使用）
docker login --username=你的账号ID registry.cn-hangzhou.aliyuncs.com

# 拉取镜像
docker pull registry.cn-hangzhou.aliyuncs.com/{namespace}/weighin:latest

# 运行容器（需要配置环境变量）
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="..." \
  -e JWT_SECRET="..." \
  # ... 其他环境变量
  registry.cn-hangzhou.aliyuncs.com/{namespace}/weighin:latest
```

## 自定义配置

### 修改触发分支

在 `.github/workflows/docker-build.yml` 中修改：

```yaml
on:
  push:
    branches:
      - main        # 修改为你的分支名
      - develop     # 添加其他分支
```

### 修改 Registry 区域

如果使用其他区域的 ACR，修改 workflow 文件中的 `REGISTRY`：

```yaml
env:
  REGISTRY: registry.cn-beijing.aliyuncs.com  # 修改区域
```

### 添加构建参数

如果需要传递构建参数，在 `build-push-action` 中添加：

```yaml
build-args: |
  NODE_ENV=production
  BUILD_VERSION=${{ github.sha }}
```

## 故障排查

### 问题：推送失败，提示认证错误

**解决方案**：
1. 检查 `ACR_USERNAME` 和 `ACR_PASSWORD` 是否正确
2. 确认密码是「访问凭证」中的「登录密码」，不是阿里云账号密码
3. 如果使用 RAM 用户，确认已分配权限

### 问题：找不到命名空间

**解决方案**：
1. 确认 `ACR_NAMESPACE` 配置正确
2. 在 ACR 控制台创建命名空间
3. 确认命名空间名称大小写正确

### 问题：构建速度慢

**解决方案**：
1. 已启用缓存，首次构建会较慢
2. 后续构建会使用缓存，速度更快
3. 可以调整缓存策略

## 安全建议

1. ✅ **不要**在 workflow 文件中硬编码敏感信息
2. ✅ 使用 GitHub Secrets 管理凭证
3. ✅ 定期轮换 ACR 登录密码
4. ✅ 为 CI/CD 创建专用的 RAM 用户和权限
5. ✅ 限制 workflow 的触发权限

## 下一步

镜像构建完成后，你可以：
1. 在阿里云容器服务（ACK）中使用镜像
2. 在 ECS 上直接拉取运行
3. 配置自动部署流程

