/** Resize local uploads for display; keep their original Blob for portable backups. */
export async function resizeUploadedImage(blob: Blob): Promise<Map<number, Blob>> {
  const source = URL.createObjectURL(blob)
  try {
    const image = new Image()
    image.src = source
    await image.decode()
    const variants = new Map<number, Blob>()
    for (const width of [160, 320, 640]) {
      const canvas = document.createElement('canvas')
      canvas.width = Math.min(width, image.naturalWidth)
      canvas.height = Math.max(1, Math.round(canvas.width * image.naturalHeight / image.naturalWidth))
      const context = canvas.getContext('2d')
      if (!context) throw new Error('图片缩放不可用')
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      const output = await new Promise<Blob>((resolve, reject) => canvas.toBlob(
        (value) => value ? resolve(value) : reject(new Error('图片缩放失败')), 'image/webp', .88,
      ))
      variants.set(canvas.width, output)
    }
    return variants
  } finally { URL.revokeObjectURL(source) }
}
