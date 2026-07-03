import { useState, useRef } from "react";

const TOTAL_STEPS = 4;

const FORMAT_OPTIONS = [
  { value: "PDF/Checkliste", label: "PDF / Checkliste" },
  { value: "Video", label: "Video" },
  { value: "Quiz/Test", label: "Kurzer Quiz / Test" },
  { value: "bin mir nicht sicher", label: "Bin mir nicht sicher" },
];

const SpeechRecognitionAPI =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

function MicButton({ onResult }) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  if (!SpeechRecognitionAPI) {
    return (
      <button
        type="button"
        className="mic-btn"
        style={{ opacity: 0.4, cursor: "not-allowed" }}
        title="Spracheingabe wird von diesem Browser nicht unterstützt, bitte in Chrome öffnen"
      >
        <MicIcon />
      </button>
    );
  }

  const handleClick = () => {
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "de-DE";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <button
      type="button"
      className={"mic-btn" + (listening ? " listening" : "")}
      onClick={handleClick}
      title="Antwort einsprechen"
    >
      <MicIcon />
    </button>
  );
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3z" />
      <path d="M19 11a1 1 0 10-2 0 5 5 0 01-10 0 1 1 0 10-2 0 7 7 0 006 6.92V20H9a1 1 0 100 2h6a1 1 0 100-2h-2v-2.08A7 7 0 0019 11z" />
    </svg>
  );
}

export default function App() {
  const [step, setStep] = useState(0);
  const [branche, setBranche] = useState("");
  const [zielgruppe, setZielgruppe] = useState("");
  const [problem, setProblem] = useState("");
  const [ersterSchritt, setErsterSchritt] = useState("");
  const [format, setFormat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ideas, setIdeas] = useState(null);

  function currentValid() {
    if (step === 0) return branche.trim() && zielgruppe.trim();
    if (step === 1) return problem.trim();
    if (step === 2) return ersterSchritt.trim();
    if (step === 3) return !!format;
    return false;
  }

  function handleNext() {
    if (!currentValid()) {
      setError("Bitte beantworte die Frage, bevor du weitergehst.");
      return;
    }
    setError("");
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      generateIdeas();
    }
  }

  function handleBack() {
    setError("");
    if (step > 0) setStep(step - 1);
  }

  function handleReset() {
    setBranche("");
    setZielgruppe("");
    setProblem("");
    setErsterSchritt("");
    setFormat(null);
    setIdeas(null);
    setError("");
    setStep(0);
  }

  async function generateIdeas() {
    setError("");
    setLoading(true);

    const prompt = `Du bist eine Marketing-Strategin für Frauen, die einen Lead Magnet (Freebie) bauen wollen, um E-Mail-Adressen zu sammeln. Die Teilnehmerinnen kommen aus ganz unterschiedlichen Branchen, nicht nur aus dem Gesundheitsbereich.

Antworten der Nutzerin:
- Branche und Spezialisierung: ${branche}
- Zielgruppe: ${zielgruppe}
- Größtes Problem der Wunschkundin: ${problem}
- Erster kleiner Schritt, den sie anbieten würde: ${ersterSchritt}
- Bevorzugtes Format: ${format}

Generiere 5 konkrete Lead-Magnet-Konzepte basierend auf diesen Antworten. Jedes Konzept muss enthalten:
- Einen fertigen, klickstarken Titel (keine generischen Namen wie "Dein Guide zu...")
- Das Format (passend zur Antwort, außer bei "bin mir nicht sicher", dann variieren)
- Eine Zeile Beschreibung, was genau enthalten ist
- Einen Vorschlag für die erste Headline-Zeile auf der Landingpage, die dieses Freebie bewirbt

Bevorzuge konkrete Zahlen und Zeitrahmen im Titel (z.B. "3 Schritte", "5-Minuten-Test"), wenn es zur Spezialisierung passt.

Vermeide generische Formulierungen wie "Erhalte wertvolle Tipps" oder "Dein Weg zu...". Nutze stattdessen Sprache, die die eingegebene Zielgruppe selbst benutzen würde.

Antworte NUR mit einem JSON-Array, keine Einleitung, kein Fließtext, keine Markdown-Codeblöcke. Format:
[{"title": "...", "format": "...", "description": "...", "headline": "..."}]`;

    try {
      const response = await fetch("/.netlify/functions/generate-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || `Anfrage fehlgeschlagen (${response.status})`);
      }

      const data = await response.json();
      const textBlocks = data.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      const cleaned = textBlocks.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      setIdeas(parsed);
    } catch (err) {
      setError("Etwas ist schiefgelaufen: " + err.message + ". Bitte nochmal versuchen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <h1>Dein Lead-Magnet-Ideen-Generator</h1>
      <div className="sub">4 kurze Fragen. 5 fertige Freebie-Konzepte, direkt für deine Zielgruppe.</div>

      {!ideas && !loading && (
        <>
          <div className="progress">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={"dot" + (i === step ? " active" : "") + (i < step ? " done" : "")}
              />
            ))}
          </div>

          <div className="card">
            {step === 0 && (
              <div className="step">
                <div className="step-number">Frage 1 von 4</div>
                <label>In welcher Branche arbeitest du, und worauf genau hast du dich spezialisiert?</label>
                <div className="hint">Schreib, in welcher Branche du bist und was du genau machst</div>
                <div className="input-row">
                  <textarea
                    rows={3}
                    placeholder='z. B. "Physiotherapie, spezialisiert auf Rückenschmerzen nach der Geburt" oder "Ernährungsberatung für Frauen in den Wechseljahren"'
                    value={branche}
                    onChange={(e) => setBranche(e.target.value)}
                  />
                  <MicButton onResult={(t) => setBranche((v) => (v ? v.trim() + " " + t : t))} />
                </div>
                <div className="mic-note">Klick aufs Mikrofon, um die Antwort zu sprechen statt zu tippen.</div>

                <label style={{ marginTop: 20 }}>Wer ist deine Zielgruppe genau?</label>
                <div className="hint">Wer genau ist deine Wunschkundin?</div>
                <div className="input-row">
                  <textarea
                    rows={2}
                    placeholder='z. B. "Frauen zwischen 35-50, die seit Jahren mit Rückenschmerzen kämpfen" oder "frisch selbstständige Ernährungsberaterinnen"'
                    value={zielgruppe}
                    onChange={(e) => setZielgruppe(e.target.value)}
                  />
                  <MicButton onResult={(t) => setZielgruppe((v) => (v ? v.trim() + " " + t : t))} />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="step">
                <div className="step-number">Frage 2 von 4</div>
                <label>Was ist das größte Problem, das deine Wunschkundin hat, bevor sie überhaupt an dich denkt?</label>
                <div className="hint">Der Schmerzpunkt, nicht die Lösung</div>
                <div className="input-row">
                  <textarea
                    rows={3}
                    placeholder='z. B. "Sie fühlt sich erschöpft und weiß nicht, wie sie wieder Energie findet"'
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                  />
                  <MicButton onResult={(t) => setProblem((v) => (v ? v.trim() + " " + t : t))} />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="step">
                <div className="step-number">Frage 3 von 4</div>
                <label>Was ist der erste kleine Schritt, den du ihr geben würdest, wenn sie noch nicht bei dir buchen will?</label>
                <div className="hint">Zeigt, was als Freebie taugt statt als Bezahlangebot</div>
                <div className="input-row">
                  <textarea
                    rows={3}
                    placeholder='z. B. "Eine einfache Übung für die erste Woche"'
                    value={ersterSchritt}
                    onChange={(e) => setErsterSchritt(e.target.value)}
                  />
                  <MicButton onResult={(t) => setErsterSchritt((v) => (v ? v.trim() + " " + t : t))} />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="step">
                <div className="step-number">Frage 4 von 4</div>
                <label>Welches Format kannst du dir am ehesten vorstellen?</label>
                <div className="format-options">
                  {FORMAT_OPTIONS.map((opt) => (
                    <div
                      key={opt.value}
                      className={"format-option" + (format === opt.value ? " selected" : "")}
                      onClick={() => setFormat(opt.value)}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && <div className="error">{error}</div>}

            <div className="nav-row">
              <button
                className="nav back"
                onClick={handleBack}
                style={{ visibility: step === 0 ? "hidden" : "visible" }}
              >
                Zurück
              </button>
              <button className="nav next" onClick={handleNext}>
                {step === TOTAL_STEPS - 1 ? "5 Ideen generieren" : "Weiter"}
              </button>
            </div>
          </div>
        </>
      )}

      {loading && (
        <div className="loading">
          <div className="spinner" />
          Claude denkt sich deine Konzepte aus...
        </div>
      )}

      {ideas && !loading && (
        <>
          <div className="results">
            {ideas.map((idea, i) => (
              <div className="result-card" key={i}>
                <div className="result-meta">{idea.format}</div>
                <div className="result-title">{idea.title}</div>
                <div className="result-desc">{idea.description}</div>
                <div className="result-headline">
                  <b>Landingpage-Headline:</b> {idea.headline}
                </div>
              </div>
            ))}
          </div>
          <button className="reset" onClick={handleReset}>
            Neue Antworten eingeben
          </button>
        </>
      )}
    </div>
  );
}
