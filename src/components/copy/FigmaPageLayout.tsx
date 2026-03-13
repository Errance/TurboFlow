/**
 * 跟单页「设计图贴底 + 热区」布局
 * 设计稿基准 1920×1288，热区用百分比定位
 */
import type { ReactNode } from 'react'

const DEFAULT_ASPECT = 1920 / 1288

interface FigmaPageLayoutProps {
  /** 底图地址，如 /figma/copy-trader-detail.png 或占位 /figma/placeholder.svg */
  imageSrc: string
  /** 宽高比，默认 1920/1288 */
  aspectRatio?: number
  /** 热区层（绝对定位，用百分比） */
  children?: ReactNode
}

export default function FigmaPageLayout({
  imageSrc,
  aspectRatio = DEFAULT_ASPECT,
  children,
}: FigmaPageLayoutProps) {
  return (
    <div
      className="w-full max-w-[1920px] mx-auto overflow-hidden rounded-xl relative"
      style={{ aspectRatio: String(aspectRatio) }}
    >
      <img
        src={imageSrc}
        alt=""
        className="absolute inset-0 w-full h-full object-contain object-top pointer-events-none select-none"
      />
      {/* 热区层：绝对定位，覆盖在底图上 */}
      <div className="absolute inset-0">{children}</div>
    </div>
  )
}

/** 热区：百分比定位 (0–100)，点击区域 */
export function Hotspot({
  left,
  top,
  width,
  height,
  onClick,
  title,
}: {
  left: number
  top: number
  width: number
  height: number
  onClick?: () => void
  title?: string
}) {
  return (
    <button
      type="button"
      title={title}
      className="absolute cursor-pointer border-0 p-0 bg-transparent hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-[#0abab5]/50"
      style={{
        left: `${left}%`,
        top: `${top}%`,
        width: `${width}%`,
        height: `${height}%`,
      }}
      onClick={onClick}
    />
  )
}
