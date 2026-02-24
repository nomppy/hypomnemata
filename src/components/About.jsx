export function About() {
  return (
    <div class="about">
      <h2>What is a hypomnēmata?</h2>

      <p>
        The <em>hypomnēmata</em> (ὑπομνήματα) were personal notebooks kept
        in the ancient Greek and Roman world — not diaries or journals, but
        something closer to a commonplace book. A place to gather fragments:
        quotes encountered in reading, thoughts overheard in conversation,
        principles worth returning to, reflections born from experience.
      </p>

      <p>
        The Stoic philosophers practiced this most deliberately. Marcus
        Aurelius's <em>Meditations</em> began as hypomnēmata — private
        notes never meant for publication, written to remind himself how
        to live. Seneca urged his friend Lucilius to collect and revisit
        such passages daily. Epictetus's students recorded his teachings
        in the same spirit.
      </p>

      <p>
        Michel Foucault, writing about these notebooks in "Self Writing,"
        described them as tools for <em>self-formation</em>. The practice
        isn't about hoarding knowledge. It's about gathering what Foucault
        called "the already-said" — then letting those fragments work on
        you through rereading and meditation, shaping how you think, how
        you respond, who you become.
      </p>

      <p>
        The method is simple: collect what strikes you. Return to it later.
        Let time change what you see in it.
      </p>

      <div class="divider" />

      <h2>About this app</h2>

      <p>
        This is a quiet tool for a slow practice. There are no feeds, no
        followers, no algorithms deciding what you should see.
      </p>

      <dl class="about-features">
        <div class="about-feature">
          <dt>Fully local</dt>
          <dd>
            All your entries live in your browser's storage. Nothing is
            sent to any server, ever.
          </dd>
        </div>
        <div class="about-feature">
          <dt>Offline-first</dt>
          <dd>
            Once loaded, the app works without an internet connection.
            Your practice doesn't depend on anyone's uptime.
          </dd>
        </div>
        <div class="about-feature">
          <dt>Optional sync</dt>
          <dd>
            Sign in from <a href="#/settings">settings</a> to sync entries
            across devices. Your data stays local-first — syncing is
            optional, and everything works without an account.
          </dd>
        </div>
        <div class="about-feature">
          <dt>Your data is yours</dt>
          <dd>
            Export everything as JSON from settings, anytime. Import it
            elsewhere. Nothing is locked in.
          </dd>
        </div>
        <div class="about-feature">
          <dt>Open source</dt>
          <dd>
            View the code on{' '}
            <a
              href="https://github.com/nomppy/hypomnemata"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>.
          </dd>
        </div>
      </dl>

      <div class="divider" />

      <h2>Use as an app</h2>

      <p>
        Hypomnēmata works as a full app on your phone or computer — no app
        store needed. Once installed, it launches instantly and works offline.
      </p>

      <dl class="about-features">
        <div class="about-feature">
          <dt>iPhone / iPad</dt>
          <dd>
            In Safari, tap Share → Add to Home Screen → Add.
          </dd>
        </div>
        <div class="about-feature">
          <dt>Android</dt>
          <dd>
            In Chrome, tap Menu → Install app (or Add to Home screen).
          </dd>
        </div>
        <div class="about-feature">
          <dt>Desktop</dt>
          <dd>
            In Chrome or Edge, click the install icon in the address bar,
            or go to Menu → Install Hypomnēmata.
          </dd>
        </div>
      </dl>

      <div class="divider" />

      <h2>Keyboard shortcuts</h2>

      <p>
        Press <kbd>?</kbd> anywhere to see all shortcuts. Here are the essentials:
      </p>

      <dl class="about-features">
        <div class="about-feature">
          <dt><kbd>n</kbd></dt>
          <dd>Create a new entry</dd>
        </div>
        <div class="about-feature">
          <dt><kbd>/</kbd></dt>
          <dd>Focus search</dd>
        </div>
        <div class="about-feature">
          <dt><kbd>j</kbd> / <kbd>k</kbd></dt>
          <dd>Navigate entries, <kbd>Enter</kbd> to open</dd>
        </div>
        <div class="about-feature">
          <dt><kbd>{'\u2318'}+Enter</kbd></dt>
          <dd>Save entry</dd>
        </div>
        <div class="about-feature">
          <dt><kbd>{'\u2318'}+Backspace</kbd></dt>
          <dd>Delete entry (when editing)</dd>
        </div>
        <div class="about-feature">
          <dt><kbd>Esc</kbd></dt>
          <dd>Close form or blur search</dd>
        </div>
        <div class="about-feature">
          <dt><kbd>1</kbd>–<kbd>5</kbd></dt>
          <dd>Switch between tabs</dd>
        </div>
      </dl>

      <div class="divider" />

      <p style={{ fontSize: '0.85rem', color: 'var(--accent-slate)' }}>
        <a
          href="https://github.com/nomppy/hypomnemata"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
        {' \u00b7 '}
        <a href="mailto:feedback@sunken.site">Feedback</a>
      </p>
    </div>
  )
}
