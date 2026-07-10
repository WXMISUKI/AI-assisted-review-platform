# MinIO 对象存储配置指南

## 1. 概述

MinIO 是一个高性能的 S3 兼容对象存储服务。本文档记录了 MinIO 的部署、配置和接入流程，供各项目参照使用。

### 1.1 当前部署信息

| 项目 | 值 |
|------|-----|
| 服务器地址 | 106.14.226.88 |
| API 端口 | 9000 |
| 控制台端口 | 9001 |
| 本项目 Bucket | construction-review-docs |
| 区域 | us-east-1 |

---

## 2. MinIO 服务部署

### 2.1 Docker 部署（推荐）

```bash
# 拉取镜像
docker pull minio/minio:latest

# 创建数据目录
mkdir -p /opt/minio/data

# 启动 MinIO
docker run -d \
  --name minio \
  --restart unless-stopped \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=<MINIO_ROOT_USER> \
  -e MINIO_ROOT_PASSWORD=<MINIO_ROOT_PASSWORD> \
  -v /opt/minio/data:/data \
  minio/minio server /data --console-address :9001
```

### 2.2 验证服务

```bash
# 检查容器状态
docker ps | grep minio

# 访问控制台
# 浏览器打开: http://106.14.226.88:9001
# 用户名/密码: 使用服务器当前 MinIO 容器的 MINIO_ROOT_USER / MINIO_ROOT_PASSWORD

# 健康检查
curl http://106.14.226.88:9000/minio/health/live
```

---

## 3. MinIO 客户端配置

### 3.1 安装 MinIO Client (mc)

```bash
# Linux
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/

# macOS
brew install minio/stable/mc

# 验证
mc --version
```

### 3.2 配置别名

```bash
# 添加 MinIO 服务别名
mc alias set review-minio http://106.14.226.88:9000 <MINIO_ROOT_USER> '<MINIO_ROOT_PASSWORD>'

# 验证连接
mc ls review-minio
```

---

## 4. Bucket 管理

### 4.1 创建 Bucket

```bash
# 创建 Bucket
mc mb review-minio/construction-review-docs

# 设置为公开读取（可选，适用于需要公开访问的场景）
mc anonymous set download review-minio/construction-review-docs

# 查看 Bucket 列表
mc ls review-minio
```

### 4.2 Bucket 策略说明

| 策略 | 说明 | 适用场景 |
|------|------|----------|
| none | 私有，需要签名访问 | 默认推荐，文件安全 |
| download | 公开读取，私有写入 | 静态资源、公开文件 |
| upload | 私有读取，公开写入 | 上传专用 |
| public | 公开读写 | 不推荐生产使用 |

```bash
# 查看当前策略
mc anonymous get review-minio/construction-review-docs

# 设置公开读取
mc anonymous set download review-minio/construction-review-docs

# 恢复私有
mc anonymous set none review-minio/construction-review-docs
```

---

## 5. 项目接入配置

### 5.1 环境变量配置

在项目的 `.env.local` 中添加以下配置：

```env
# MinIO 内网访问地址
MINIO_ENDPOINT=http://106.14.226.88:9000

# MinIO 公网访问地址（如果内网地址与公网地址不同，用于生成下载链接）
# 如果内外网地址相同，可以不设置此项
MINIO_PUBLIC_ENDPOINT=http://106.14.226.88:9000

# 访问凭证
MINIO_ACCESS_KEY=<MINIO_SERVICE_ACCESS_KEY>
MINIO_SECRET_KEY=<MINIO_SERVICE_SECRET_KEY>

# Bucket 名称
MINIO_BUCKET=construction-review-docs

# 区域（MinIO 默认为 us-east-1）
MINIO_REGION=us-east-1
```

### 5.2 Docker Compose 配置

```yaml
services:
  your-service:
    environment:
      - MINIO_ENDPOINT=http://106.14.226.88:9000
      - MINIO_PUBLIC_ENDPOINT=http://106.14.226.88:9000
      - MINIO_ACCESS_KEY=<MINIO_SERVICE_ACCESS_KEY>
      - MINIO_SECRET_KEY=<MINIO_SERVICE_SECRET_KEY>
      - MINIO_BUCKET=construction-review-docs
      - MINIO_REGION=us-east-1
```

---

## 6. Node.js/TypeScript 接入

### 6.1 安装依赖

```bash
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### 6.2 工具类封装

参考 `src/lib/minio-storage.ts`，核心代码如下：

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// 创建 S3 客户端
function createS3Client(): S3Client {
  return new S3Client({
    endpoint: process.env.MINIO_ENDPOINT,
    region: process.env.MINIO_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.MINIO_ACCESS_KEY || '',
      secretAccessKey: process.env.MINIO_SECRET_KEY || '',
    },
    forcePathStyle: true, // MinIO 必须使用 path style
  });
}

// 上传文件
export async function uploadFile(key: string, body: Buffer, contentType: string) {
  const client = createS3Client();
  const command = new PutObjectCommand({
    Bucket: process.env.MINIO_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  });
  return client.send(command);
}

// 生成预签名下载 URL
export async function generatePresignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const client = createS3Client();
  const command = new GetObjectCommand({
    Bucket: process.env.MINIO_BUCKET,
    Key: key,
  });
  // @smithy/types 版本冲突时使用 as any
  const url = await getSignedUrl(client as any, command as any, { expiresIn });

  // 如果配置了公网地址，替换内网地址
  const publicEndpoint = process.env.MINIO_PUBLIC_ENDPOINT;
  if (publicEndpoint) {
    const internalEndpoint = process.env.MINIO_ENDPOINT;
    return url.replace(internalEndpoint!, publicEndpoint);
  }

  return url;
}
```

### 6.3 关键配置说明

| 配置项 | 说明 | 必填 |
|--------|------|------|
| `MINIO_ENDPOINT` | MinIO 服务地址（含端口） | 是 |
| `MINIO_ACCESS_KEY` | 访问密钥 ID | 是 |
| `MINIO_SECRET_KEY` | 访问密钥密码 | 是 |
| `MINIO_BUCKET` | Bucket 名称 | 是 |
| `MINIO_REGION` | 区域，默认 `us-east-1` | 否 |
| `MINIO_PUBLIC_ENDPOINT` | 公网访问地址，用于替换内网地址生成下载链接 | 否 |

### 6.4 forcePathStyle 说明

MinIO **必须**使用 `forcePathStyle: true`，否则会导致请求路径错误：

```
# path style (正确): http://minio-server/bucket-name/key
# virtual host style (错误): http://bucket-name.minio-server/key
```

---

## 7. 常见问题排查

### 7.1 连接失败

```bash
# 检查 MinIO 是否运行
docker ps | grep minio

# 检查端口是否开放
curl http://106.14.226.88:9000/minio/health/live

# 检查防火墙
sudo ufw status
sudo ufw allow 9000/tcp
```

### 7.2 Access Denied

```bash
# 检查凭证是否正确
mc alias set test http://106.14.226.88:9000 <MINIO_ROOT_USER> '<MINIO_ROOT_PASSWORD>'
mc ls test

# 检查 Bucket 策略
mc anonymous get review-minio/construction-review-docs
```

### 7.3 文件上传成功但下载链接无法访问

```bash
# 检查 Bucket 是否设置了公开读取策略
mc anonymous set download review-minio/construction-review-docs

# 或者检查预签名 URL 是否使用了正确的公网地址
# 确认 MINIO_PUBLIC_ENDPOINT 配置正确
```

### 7.4 @smithy/types 版本冲突

如果遇到 TypeScript 类型错误：

```
Type 'S3Client' is not assignable to parameter of type 'Client<any, ...>'
```

这是因为 `@aws-sdk/client-s3` 和 `@aws-sdk/s3-request-presigner` 依赖了不同版本的 `@smithy/types`。解决方法：

```typescript
// 对 getSignedUrl 的参数加类型断言
const url = await getSignedUrl(client as any, command as any, { expiresIn });
```

---

## 8. 安全建议

### 8.1 生产环境配置

```bash
# 1. 修改默认密码
# 启动时设置强密码
docker run -d \
  -e MINIO_ROOT_USER=your-secure-username \
  -e MINIO_ROOT_PASSWORD=your-strong-password \
  ...

# 2. 限制 Bucket 权限
# 默认设置为私有
mc anonymous set none myminio/your-bucket

# 3. 配置 HTTPS（推荐使用 Nginx 反向代理）
```

### 8.2 Nginx 反向代理配置（HTTPS）

```nginx
server {
    listen 443 ssl;
    server_name minio.your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl;
    server_name minio-console.your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:9001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 9. 常用运维命令

```bash
# 查看所有 Bucket
mc ls review-minio

# 查看 Bucket 内文件
mc ls review-minio/construction-review-docs

# 上传文件
mc cp ./local-file.txt review-minio/construction-review-docs/

# 下载文件
mc cp review-minio/construction-review-docs/remote-file.txt ./

# 删除文件
mc rm review-minio/construction-review-docs/file.txt

# 查看 Bucket 使用情况
mc du review-minio/construction-review-docs

# 查看 MinIO 服务信息
mc admin info review-minio
```

---

## 10. 快速接入 Checklist

新项目接入 MinIO 时，按以下步骤操作：

- [ ] 确认 MinIO 服务地址和端口
- [ ] 确认访问凭证（Access Key / Secret Key）
- [ ] 确认 Bucket 名称（如需新建，使用 `mc mb`）
- [ ] 配置环境变量（`MINIO_ENDPOINT`、`MINIO_ACCESS_KEY`、`MINIO_SECRET_KEY`、`MINIO_BUCKET`）
- [ ] 如果需要公开下载链接，设置 Bucket 策略为 `download`
- [ ] 如果内外网地址不同，配置 `MINIO_PUBLIC_ENDPOINT`
- [ ] 在代码中使用 `forcePathStyle: true` 创建 S3Client
- [ ] 测试上传和下载功能
