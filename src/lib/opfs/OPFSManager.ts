import type { EditParams, FileId } from '../../types'

export class OPFSManager {
  private root: FileSystemDirectoryHandle | null = null

  async init(): Promise<void> {
    this.root = await navigator.storage.getDirectory()
  }

  private async getFileDir(fileId: FileId): Promise<FileSystemDirectoryHandle> {
    if (!this.root) await this.init()
    const filesDir = await this.root!.getDirectoryHandle('files', { create: true })
    return filesDir.getDirectoryHandle(fileId, { create: true })
  }

  async writeRaw(fileId: FileId, buffer: ArrayBuffer): Promise<void> {
    const dir = await this.getFileDir(fileId)
    const fh = await dir.getFileHandle('raw', { create: true })
    const writable = await fh.createWritable()
    await writable.write(buffer)
    await writable.close()
  }

  async readRaw(fileId: FileId): Promise<ArrayBuffer> {
    const dir = await this.getFileDir(fileId)
    const fh = await dir.getFileHandle('raw')
    const file = await fh.getFile()
    return file.arrayBuffer()
  }

  async writeParams(fileId: FileId, params: EditParams): Promise<void> {
    const dir = await this.getFileDir(fileId)
    const fh = await dir.getFileHandle('params.json', { create: true })
    const writable = await fh.createWritable()
    await writable.write(JSON.stringify(params))
    await writable.close()
  }

  async readParams(fileId: FileId): Promise<EditParams | null> {
    try {
      const dir = await this.getFileDir(fileId)
      const fh = await dir.getFileHandle('params.json')
      const file = await fh.getFile()
      const text = await file.text()
      return JSON.parse(text) as EditParams
    } catch {
      return null
    }
  }

  async writeThumbnail(fileId: FileId, jpegBlob: Blob): Promise<void> {
    const dir = await this.getFileDir(fileId)
    const fh = await dir.getFileHandle('thumb.jpg', { create: true })
    const writable = await fh.createWritable()
    await writable.write(jpegBlob)
    await writable.close()
  }

  async readThumbnailURL(fileId: FileId): Promise<string | null> {
    try {
      const dir = await this.getFileDir(fileId)
      const fh = await dir.getFileHandle('thumb.jpg')
      const file = await fh.getFile()
      return URL.createObjectURL(file)
    } catch {
      return null
    }
  }

  async deleteFile(fileId: FileId): Promise<void> {
    if (!this.root) throw new Error('OPFSManager not initialized')
    const filesDir = await this.root.getDirectoryHandle('files')
    await filesDir.removeEntry(fileId, { recursive: true })
  }
}

export const opfsManager = new OPFSManager()
