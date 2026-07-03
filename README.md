# Lead-Magnet-Ideen-Generator (React/Vite-Version)

Gleiche App wie die Vanilla-HTML-Version, jetzt als React/Vite-Projekt (`src/App.jsx`, `src/main.jsx`),
damit die Struktur zu Katharinas Projekt passt und ihr Code gemeinsam pflegen könnt.

Gedacht zum Einbetten per `<iframe>` auf der Webinar-Landingpage und später auf der Kursplattform.

## Projektstruktur

```
├── index.html              Vite-Einstiegspunkt
├── src/
│   ├── main.jsx             React-Root, rendert App
│   ├── App.jsx               Komplette Wizard-Logik (4 Fragen, Spracheingabe, API-Call)
│   └── index.css             Styles (Rosa-Branding)
├── netlify/
│   └── functions/
│       └── generate-ideas.js Serverseitige Function, hält den API-Key sicher
├── netlify.toml               Build-Konfiguration für Netlify
└── package.json
```

## Deployment auf Netlify

1. Dieses gesamte Verzeichnis zu GitHub hochladen.
2. Auf [netlify.com](https://netlify.com) → **Add new site** → **Import an existing project** → Repo auswählen.
3. Build-Einstellungen werden automatisch aus `netlify.toml` übernommen (`npm run build`, Publish-Ordner `dist`).
4. **Site configuration → Environment variables → Add a variable**
   - Key: `ANTHROPIC_API_KEY`
   - Value: dein Anthropic-API-Key (von [console.anthropic.com](https://console.anthropic.com))
5. **Deploys → Trigger deploy → Clear cache and deploy site**

## Lokale Entwicklung

```bash
npm install
npm run dev
```

Für lokales Testen der Netlify Function zusätzlich:

```bash
npm install -g netlify-cli
netlify dev
```

## Als iframe einbetten

Sobald die App auf Netlify läuft (z. B. unter `https://dein-projekt.netlify.app`), auf der
Webinar-Landingpage oder Kursplattform einbetten mit:

```html
<iframe
  src="https://dein-projekt.netlify.app"
  width="100%"
  height="750"
  style="border: none; border-radius: 16px;"
  title="Lead-Magnet-Ideen-Generator"
></iframe>
```

**Hinweise zum iframe:**
- `height="750"` ist ein Startwert. Da die App je nach Ergebnis-Länge wächst (5 Konzepte
  unterscheiden sich in der Textlänge), empfiehlt sich testen und ggf. anpassen oder mit
  `height="100%"` plus einem festen Container auf der einbettenden Seite arbeiten.
- Manche Website-Baukästen (z. B. ältere WordPress-Page-Builder) blocken standardmäßig iframes
  von fremden Domains. Falls das Embed nicht erscheint, prüfen, ob der Elementor/WordPress-Block
  „Custom HTML" statt eines reinen Text-Blocks verwendet wird.
- Die Spracheingabe (Mikrofon) verlangt im iframe ggf. eine explizite `allow="microphone"`
  Berechtigung:
  ```html
  <iframe src="..." allow="microphone" ...></iframe>
  ```
  Ohne dieses Attribut kann der Browser den Mikrofonzugriff im eingebetteten Frame blockieren.

## API-Key-Sicherheit

Wie in der Vanilla-Version: Der Key steht ausschließlich in der Netlify-Umgebungsvariable, nie im
Frontend-Code. Der Browser sendet nur den Frage-Text an `/.netlify/functions/generate-ideas`,
diese Function ruft serverseitig `api.anthropic.com` mit dem Key aus `process.env.ANTHROPIC_API_KEY` auf.

## Farbschema

```
--blush: #fdf2f6
--lavender: #f7e9f1
--rose: #e793bb
--rose-deep: #d1548f
--plum: #4a2540
--plum-soft: #7a5570
--white: #ffffff
```
