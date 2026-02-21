export function KeyboardHelp({ onClose }) {
  const shortcuts = [
    { keys: ['?'], desc: 'Toggle this help' },
    { keys: ['n'], desc: 'New entry' },
    { keys: ['/'], desc: 'Focus search' },
    { keys: ['Esc'], desc: 'Close form / blur search' },
    { keys: ['j', '\u2193'], desc: 'Next entry' },
    { keys: ['k', '\u2191'], desc: 'Previous entry' },
    { keys: ['\u21B5'], desc: 'Open selected entry' },
    { keys: ['1'], desc: 'Go to entries' },
    { keys: ['2'], desc: 'Go to tags' },
    { keys: ['3'], desc: 'Go to meditate' },
    { keys: ['4'], desc: 'Go to settings' },
    { keys: ['\u2318+\u21B5'], desc: 'Save entry' },
  ]

  return (
    <div class="confirm-overlay" onClick={onClose}>
      <div class="keyboard-help" onClick={(e) => e.stopPropagation()}>
        <h3>Keyboard Shortcuts</h3>
        <div class="divider" />
        <dl class="shortcut-list">
          {shortcuts.map((s) => (
            <div key={s.desc} class="shortcut-row">
              <dt>
                {s.keys.map((k, i) => (
                  <span key={i}>
                    {i > 0 && <span class="shortcut-or"> / </span>}
                    <kbd>{k}</kbd>
                  </span>
                ))}
              </dt>
              <dd>{s.desc}</dd>
            </div>
          ))}
        </dl>
        <div style={{ marginTop: '1rem', textAlign: 'right' }}>
          <button onClick={onClose}>close</button>
        </div>
      </div>
    </div>
  )
}
