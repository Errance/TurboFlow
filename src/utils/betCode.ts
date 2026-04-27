/**
 * 注单编码生成。格式：TF-XXXXXXXX（8 位 Base36）
 *
 * 用 crypto.getRandomValues 保证前缀熵，避免 Date.now 冲突；
 * 回退到 Math.random 在非浏览器环境下可用。
 */

export function generateBetCode(): string {
  const bytes = new Uint8Array(6)
  try {
    if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
      crypto.getRandomValues(bytes)
    } else {
      for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256)
    }
  } catch {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256)
  }
  let v = 0
  for (const b of bytes) v = v * 256 + b
  const s = v.toString(36).toUpperCase().padStart(8, '0').slice(-8)
  return `TF-${s}`
}
