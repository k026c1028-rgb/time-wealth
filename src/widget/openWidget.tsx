import { createRoot, type Root } from 'react-dom/client'
import { WidgetView } from '../components/WidgetView'

function copyStylesTo(targetDoc: Document) {
  const head = targetDoc.head
  const nodes = document.querySelectorAll('style, link[rel="stylesheet"]')
  nodes.forEach((n) => {
    head.appendChild(n.cloneNode(true))
  })
}

async function openPictureInPictureWidget() {
  // Chrome/Edge: Document Picture-in-Picture（可“置顶”浮窗）
  const dpip = (document as any).pictureInPictureEnabled ? (document as any).pictureInPictureEnabled : true
  if (!dpip || !(document as any).documentPictureInPicture?.requestWindow) {
    return null
  }

  const pipWindow: Window = await (document as any).documentPictureInPicture.requestWindow({
    width: 360,
    height: 220,
  })

  pipWindow.document.title = 'Time & Wealth — Widget'
  copyStylesTo(pipWindow.document)

  const mount = pipWindow.document.createElement('div')
  mount.id = 'tw-widget-root'
  mount.style.margin = '0'
  pipWindow.document.body.style.margin = '0'
  pipWindow.document.body.appendChild(mount)

  let root: Root | null = createRoot(mount)
  root.render(
    <div className="min-h-dvh bg-transparent p-3">
      <WidgetView compact />
    </div>,
  )

  const cleanup = () => {
    try {
      root?.unmount()
    } catch {}
    root = null
  }

  pipWindow.addEventListener('pagehide', cleanup)
  return pipWindow
}

function openPopupWidget() {
  // 退化方案：开一个小窗（不能保证置顶/透明）
  const url = new URL(window.location.href)
  url.searchParams.set('widget', '1')
  const w = 380
  const h = 260
  const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - w) / 2))
  const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - h) / 2))
  window.open(
    url.toString(),
    'time_wealth_widget',
    `popup=yes,width=${w},height=${h},left=${left},top=${top}`,
  )
}

export async function openWidget() {
  try {
    const pip = await openPictureInPictureWidget()
    if (pip) return
  } catch {
    // ignore, fallback below
  }
  openPopupWidget()
}

