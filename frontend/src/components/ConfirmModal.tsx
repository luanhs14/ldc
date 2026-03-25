import { useState, useEffect } from 'react'

interface Config {
  msg: string
  confirmLabel: string
  resolve: (ok: boolean) => void
}

let _show: ((cfg: Config) => void) | null = null

export function confirmDialog(msg: string, confirmLabel = 'Excluir'): Promise<boolean> {
  return new Promise((resolve) => {
    _show?.({ msg, confirmLabel, resolve })
  })
}

export function ConfirmModal() {
  const [cfg, setCfg] = useState<Config | null>(null)

  useEffect(() => {
    _show = setCfg
    return () => { _show = null }
  }, [])

  if (!cfg) return null

  const handle = (ok: boolean) => {
    cfg.resolve(ok)
    setCfg(null)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
        <p className="text-sm text-gray-700 mb-6 leading-relaxed">{cfg.msg}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => handle(false)}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => handle(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            {cfg.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
