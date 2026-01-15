declare module 'ali-oss' {
  export interface OSSConfig {
    accessKeyId: string
    accessKeySecret: string
    bucket: string
    region: string
    endpoint: string
    timeout?: number
  }

  export interface PutObjectResult {
    url: string
    name: string
    res: {
      status: number
      statusCode: number
      headers: Record<string, string>
    }
  }

  export default class OSS {
    constructor(config: OSSConfig)
    put(
      objectKey: string,
      file: Buffer | string,
      options?: {
        headers?: Record<string, string>
        [key: string]: any
      }
    ): Promise<PutObjectResult>
    [key: string]: any
  }
}

