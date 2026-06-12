import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import streakCap from "@/assets/streak-cap.png";
import { 
  Sparkles, 
  GraduationCap, 
  Trophy, 
  ArrowRight, 
  BookOpen, 
  Brain, 
  Compass, 
  Gamepad2, 
  Rocket, 
  Check, 
  User, 
  Laptop, 
  Globe, 
  Menu, 
  X, 
  Coins, 
  ChevronRight,
  Lightbulb,
  Hammer,
  Flame,
  Award
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lybanhi — Descubre qué estudiar" },
      { name: "description", content: "Encuentra tu carrera ideal, universidades según tu presupuesto y prepárate para exámenes de admisión e inglés con IA y gamificación." },
      { property: "og:title", content: "Lybanhi — Descubre qué estudiar" },
      { property: "og:description", content: "Orientación vocacional con IA, quizzes y gamificación en un universo interactivo." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { t, i18n } = useTranslation();
  const { user, loading } = useAuth();
  
  // Navigation State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Interactive Recommender State
  const [selectedSkills, setSelectedSkills] = useState<string[]>(["Creatividad", "Resolución de problemas"]);
  const [budget, setBudget] = useState(400);
  const [uniType, setUniType] = useState("public");
  
  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  // Interactive Quiz State
  const [quizOption, setQuizOption] = useState<string | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizState, setQuizState] = useState<"math" | "review">("math");
  const [reviewOption, setReviewOption] = useState<string | null>(null);
  const [reviewChecked, setReviewChecked] = useState(false);

  if (!loading && user) return <Navigate to="/dashboard" />;

  const setLang = (lng: string) => i18n.changeLanguage(lng);

  return (
    <main className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
      
      {/* ── MESH DEGRADADOS DE FONDO CLARO ── */}
      <div className="absolute top-0 left-1/4 w-[35rem] h-[35rem] bg-blue-100/40 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute top-[20%] right-1/4 w-[40rem] h-[40rem] bg-pink-100/30 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute top-[50%] left-10 w-[30rem] h-[30rem] bg-amber-100/30 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute top-[75%] right-10 w-[35rem] h-[35rem] bg-indigo-100/30 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* ── HEADER NAVBAR ── */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md transition-all">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <img src={streakCap} alt="Lybanhi logo" width={36} height={36} className="size-9" />
            <span className="font-display text-2xl font-extrabold text-primary tracking-tight">Lybanhi</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-muted-foreground">
            <a href="#orientacion" className="hover:text-primary transition-colors">{t("landing.navOrientation")}</a>
            <a href="#prep" className="hover:text-primary transition-colors">{t("landing.navExams")}</a>
            <a href="#juegos" className="hover:text-primary transition-colors">{t("landing.navGames")}</a>
          </nav>

          {/* User & Lang Options */}
          <div className="hidden md:flex items-center gap-4">
            {/* Lang Selector */}
            <div className="flex gap-1.5 rounded-full border border-border bg-card p-1 text-xs">
              {(["es", "en", "fr"] as const).map(l => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`rounded-full px-3 py-1 font-bold uppercase transition ${
                    i18n.language.startsWith(l)
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            <Link to="/login" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition">
              {t("landing.login")}
            </Link>
            <Link to="/signup" className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary-glow transition">
              {t("landing.cta")}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-foreground hover:bg-muted rounded-xl transition"
          >
            {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-lg px-6 py-6 space-y-4 shadow-lg animate-in fade-in slide-in-from-top duration-200">
            <nav className="flex flex-col gap-4 text-base font-semibold text-muted-foreground">
              <a href="#orientacion" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary">{t("landing.navOrientation")}</a>
              <a href="#prep" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary">{t("landing.navExams")}</a>
              <a href="#juegos" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary">{t("landing.navGames")}</a>
            </nav>

            <div className="h-px bg-border my-4" />

            <div className="flex flex-col gap-3">
              {/* Lang Selector Mobile */}
              <div className="flex justify-center gap-2 rounded-xl border border-border bg-card p-1 text-xs w-full">
                {(["es", "en", "fr"] as const).map(l => (
                  <button
                    key={l}
                    onClick={() => { setLang(l); setMobileMenuOpen(false); }}
                    className={`flex-1 rounded-lg py-2 font-bold uppercase transition ${
                      i18n.language.startsWith(l)
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>

              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="flex h-11 items-center justify-center rounded-xl border border-border bg-card font-semibold text-foreground">
                {t("landing.login")}
              </Link>
              <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="flex h-11 items-center justify-center rounded-xl bg-primary font-semibold text-primary-foreground">
                {t("landing.cta")}
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── SECTION 1: HERO SECTION ── */}
      <section className="mx-auto max-w-7xl px-6 pt-12 pb-20 md:py-24 lg:py-32 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Side: Headline Copy */}
        <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
          
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary animate-pulse">
            <Sparkles className="size-3.5 fill-current" />
            <span>{t("landing.tagline")}</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] text-foreground tracking-tight max-w-2xl mx-auto lg:mx-0">
            {t("landing.title")}
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
            {t("landing.subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
            <Link to="/signup" className="w-full sm:w-auto inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary px-8 font-bold text-primary-foreground shadow-[var(--shadow-elegant)] hover:bg-primary-glow hover:scale-[1.02] active:scale-[0.98] transition">
              <span>{t("landing.cta")}</span>
              <ArrowRight className="size-5" />
            </Link>
            <a href="#orientacion" className="w-full sm:w-auto inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-border bg-card px-8 font-bold text-foreground hover:bg-muted hover:scale-[1.02] transition">
              {t("landing.ctaDemo")}
            </a>
          </div>

          {/* Social Proof badge */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-8 text-xs text-muted-foreground font-semibold">
            <div className="flex items-center gap-2">
              <span className="flex size-2 rounded-full bg-emerald-500" />
              <span>Carrera Ideal con IA</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex size-2 rounded-full bg-indigo-500" />
              <span>Entrenamiento TOEFL / Cambridge</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex size-2 rounded-full bg-amber-500" />
              <span>Juegos y Recompensas</span>
            </div>
          </div>
        </div>

        {/* Right Side: Features/App Pillars Showcase (Balanced & Explained) */}
        <div className="lg:col-span-5 flex flex-col justify-center animate-fade-in">
          <div className="relative w-full max-w-md mx-auto rounded-[2rem] border border-border bg-card/75 backdrop-blur-sm p-6 md:p-8 shadow-xl flex flex-col gap-6 hover:shadow-2xl transition duration-300">
            
            {/* Soft background glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-indigo-50 rounded-[2rem] -z-10 pointer-events-none" />

            {/* Title / Heading inside the card */}
            <div className="space-y-1">
              <h3 className="font-display font-extrabold text-lg text-foreground">¿Cómo funciona Lybanhi?</h3>
              <p className="text-xs text-muted-foreground font-medium">Explora los tres pilares de nuestro ecosistema inteligente:</p>
            </div>

            <div className="space-y-4">
              {/* Pillar 1 */}
              <div className="flex gap-4 p-2.5 rounded-2xl hover:bg-muted/30 transition duration-200">
                <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 shadow-sm border border-blue-100/50">
                  <Compass className="size-6" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-foreground">{t("landing.heroFeature1Title")}</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed font-medium">
                    {t("landing.heroFeature1Desc")}
                  </p>
                </div>
              </div>

              {/* Pillar 2 */}
              <div className="flex gap-4 p-2.5 rounded-2xl hover:bg-muted/30 transition duration-200">
                <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100/50">
                  <Brain className="size-6" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-foreground">{t("landing.heroFeature2Title")}</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed font-medium">
                    {t("landing.heroFeature2Desc")}
                  </p>
                </div>
              </div>

              {/* Pillar 3 */}
              <div className="flex gap-4 p-2.5 rounded-2xl hover:bg-muted/30 transition duration-200">
                <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600 shadow-sm border border-amber-100/50">
                  <Gamepad2 className="size-6" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-foreground">{t("landing.heroFeature3Title")}</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed font-medium">
                    {t("landing.heroFeature3Desc")}
                  </p>
                </div>
              </div>
            </div>

            <div className="h-px bg-border/60 my-1" />

            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground px-2">
              <span className="flex items-center gap-1">✨ Acceso Completo</span>
              <span className="text-primary hover:text-primary-glow cursor-pointer transition">Comenzar Gratis</span>
            </div>

          </div>
        </div>
      </section>

      {/* ── SECTION 2: AI ORIENTATION INTERACTIVE MOCKUP ── */}
      <section id="orientacion" className="bg-muted/50 border-y border-border py-20 md:py-28 relative">
        <div className="mx-auto max-w-7xl px-6">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-primary font-bold text-sm uppercase tracking-wider">Descubre tu Carrera</span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              {t("landing.featuresTitle")}
            </h2>
            <p className="text-muted-foreground font-medium text-base">
              {t("landing.featuresSubtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Col 1: Interactive Onboarding Mockup Form */}
            <div className="lg:col-span-6 space-y-6">
              
              {/* Step 1 Box */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-foreground flex items-center gap-2">
                    <span className="grid size-6 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">1</span>
                    {t("landing.step1Title")}
                  </h3>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Paso Actual</span>
                </div>
                <p className="text-xs text-muted-foreground">{t("landing.step1Desc")}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {["Creatividad", "Resolución de problemas", "Liderazgo", "Análisis de datos", "Empatía"].map(skill => {
                    const active = selectedSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold border transition ${
                          active
                            ? "bg-primary border-primary text-primary-foreground shadow-sm"
                            : "bg-background border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {skill} {active && "✓"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2 Box */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
                <h3 className="font-display font-bold text-foreground flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">2</span>
                  {t("landing.step2Title")}
                </h3>
                <p className="text-xs text-muted-foreground">{t("landing.step2Desc")}</p>
                <div className="relative">
                  <input
                    type="text"
                    disabled
                    value="crear código de software, hacer videojuegos de rol, programar bots"
                    className="w-full h-10 rounded-xl border border-border bg-muted/30 px-3 text-xs text-foreground cursor-not-allowed"
                  />
                  <Brain className="absolute right-3 top-2.5 size-4 text-primary animate-pulse" />
                </div>
              </div>

              {/* Step 3 Box */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
                <h3 className="font-display font-bold text-foreground flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">3</span>
                  {t("landing.step3Title")}
                </h3>
                <p className="text-xs text-muted-foreground">{t("landing.step3Desc")}</p>
                
                {/* Budget Range Slider */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-foreground">
                    <span>Límite mensual:</span>
                    <span className="text-primary">${budget} USD</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="1000"
                    step="50"
                    value={budget}
                    onChange={e => setBudget(Number(e.target.value))}
                    className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </div>

            </div>

            {/* Col 2: Result recommendation Card preview */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-primary/10 text-primary text-[10px] font-extrabold uppercase px-4 py-1.5 rounded-bl-2xl">
                  {t("landing.resultTitle")}
                </div>

                <div className="flex items-start gap-4">
                  <div className="grid size-12 place-items-center rounded-2xl bg-indigo-50 text-primary">
                    <Laptop className="size-6" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-lg text-foreground">Ingeniería en Desarrollo de Software</h4>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 mt-1">
                      <Check className="size-3" />
                      {t("landing.resultMatch")}
                    </span>
                  </div>
                </div>

                <div className="h-px bg-border my-5" />

                <div className="space-y-4">
                  <div>
                    <h5 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground mb-1">¿Por qué es para ti?</h5>
                    <p className="text-sm text-foreground leading-relaxed">
                      Tu interés en <strong className="text-primary">programar videojuegos</strong> coincide al 98% con el perfil tecnológico. Tus habilidades en <strong className="text-primary">{selectedSkills.join(", ") || "Habilidades"}</strong> complementan el desarrollo creativo e ingeniería.
                    </p>
                  </div>

                  <div>
                    <h5 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground mb-1">Universidades Sugeridas</h5>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between rounded-xl border border-border/80 p-2.5 text-xs bg-muted/20">
                        <div>
                          <p className="font-bold text-foreground">Universidad Tecnológica Pública</p>
                          <p className="text-[10px] text-muted-foreground">Pública · Local</p>
                        </div>
                        <span className="font-bold text-emerald-600">$120 USD/mes</span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl border border-border/80 p-2.5 text-xs bg-muted/20">
                        <div>
                          <p className="font-bold text-foreground">Instituto Politécnico Nacional</p>
                          <p className="text-[10px] text-muted-foreground">Pública · Semi-presencial</p>
                        </div>
                        <span className="font-bold text-emerald-600">$80 USD/mes</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Link to="/signup" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground hover:bg-primary-glow transition">
                    <span>Obtener mi reporte completo</span>
                    <ChevronRight className="size-4" />
                  </Link>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── SECTION 3: ADAPTIVE PREP SMART QUIZZES ── */}
      <section id="prep" className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-primary font-bold text-sm uppercase tracking-wider">Prepárate y Aprueba</span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              {t("landing.prepTitle")}
            </h2>
            <p className="text-muted-foreground font-medium text-base">
              {t("landing.prepSubtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Side: Mock Quiz Board (Interactive!) */}
            <div className="lg:col-span-7 flex justify-center">
              <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-lg relative">
                
                {/* Header indicators */}
                <div className="flex items-center justify-between text-xs text-muted-foreground font-bold mb-4">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-primary font-extrabold uppercase text-[10px]">
                      {quizState === "math" ? "Matemáticas" : "Repaso IA (Álgebra)"}
                    </span>
                    <span>Pregunta 1 de 1</span>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-600">
                    <Flame className="size-4 animate-bounce" />
                    <span>Racha de 5 días</span>
                  </div>
                </div>

                {/* Question */}
                <h4 className="font-display font-bold text-lg text-foreground mb-4">
                  {quizState === "math" 
                    ? "¿Cuál es el valor de x en la ecuación de primer grado: 3x - 7 = 11?"
                    : "Repaso Adaptativo: ¿Cuál es el valor de y en la ecuación: 4y + 5 = 21?"
                  }
                </h4>

                {/* Options list */}
                <div className="space-y-2.5">
                  {quizState === "math" ? (
                    [
                      { id: "A", text: "x = 4" },
                      { id: "B", text: "x = 6" }, // Correct
                      { id: "C", text: "x = 8" },
                      { id: "D", text: "x = 18" },
                    ].map(opt => {
                      const selected = quizOption === opt.id;
                      const showResult = quizChecked;
                      const isCorrect = opt.id === "B";
                      
                      let optionStyle = "border-border hover:bg-muted/30";
                      if (selected) optionStyle = "border-primary bg-primary/5";
                      if (showResult) {
                        if (isCorrect) optionStyle = "border-emerald-500 bg-emerald-50 text-emerald-900";
                        else if (selected) optionStyle = "border-rose-500 bg-rose-50 text-rose-900";
                      }

                      return (
                        <button
                          key={opt.id}
                          disabled={quizChecked}
                          onClick={() => setQuizOption(opt.id)}
                          className={`w-full flex items-center justify-between rounded-xl border p-3.5 text-sm font-semibold transition text-left ${optionStyle}`}
                        >
                          <span>{opt.text}</span>
                          {showResult && isCorrect && <Check className="size-4 text-emerald-600" />}
                          {showResult && selected && !isCorrect && <X className="size-4 text-rose-600" />}
                        </button>
                      );
                    })
                  ) : (
                    [
                      { id: "A", text: "y = 3" },
                      { id: "B", text: "y = 4" }, // Correct
                      { id: "C", text: "y = 5" },
                      { id: "D", text: "y = 16" },
                    ].map(opt => {
                      const selected = reviewOption === opt.id;
                      const showResult = reviewChecked;
                      const isCorrect = opt.id === "B";
                      
                      let optionStyle = "border-border hover:bg-muted/30";
                      if (selected) optionStyle = "border-primary bg-primary/5";
                      if (showResult) {
                        if (isCorrect) optionStyle = "border-emerald-500 bg-emerald-50 text-emerald-900";
                        else if (selected) optionStyle = "border-rose-500 bg-rose-50 text-rose-900";
                      }

                      return (
                        <button
                          key={opt.id}
                          disabled={reviewChecked}
                          onClick={() => setReviewOption(opt.id)}
                          className={`w-full flex items-center justify-between rounded-xl border p-3.5 text-sm font-semibold transition text-left ${optionStyle}`}
                        >
                          <span>{opt.text}</span>
                          {showResult && isCorrect && <Check className="size-4 text-emerald-600" />}
                          {showResult && selected && !isCorrect && <X className="size-4 text-rose-600" />}
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Action panel & Feedback explanation */}
                <div className="mt-6 pt-4 border-t border-border/80">
                  {quizState === "math" ? (
                    !quizChecked ? (
                      <button
                        disabled={!quizOption}
                        onClick={() => setQuizChecked(true)}
                        className="w-full h-11 inline-flex items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm disabled:opacity-50 hover:bg-primary-glow transition"
                      >
                        Verificar respuesta
                      </button>
                    ) : (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top duration-300">
                        <div className="rounded-xl bg-emerald-50/50 border border-emerald-100 p-4 text-xs text-emerald-950">
                          <p className="font-bold flex items-center gap-1 text-emerald-800">
                            <Lightbulb className="size-4 fill-emerald-100" />
                            Explicación del ejercicio:
                          </p>
                          <p className="mt-1">
                            Sumamos 7 a ambos lados de la ecuación: 3x = 11 + 7 =&gt; 3x = 18. Dividimos por 3: x = 18 / 3 =&gt; <strong>x = 6</strong>. ¡Muy bien!
                          </p>
                        </div>
                        <button
                          onClick={() => setQuizState("review")}
                          className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-bold text-white hover:bg-indigo-700 transition"
                        >
                          <Brain className="size-4 animate-pulse" />
                          <span>Probar Repaso Inteligente con IA</span>
                        </button>
                      </div>
                    )
                  ) : (
                    !reviewChecked ? (
                      <button
                        disabled={!reviewOption}
                        onClick={() => setReviewChecked(true)}
                        className="w-full h-11 inline-flex items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm disabled:opacity-50 hover:bg-primary-glow transition"
                      >
                        Verificar respuesta de repaso
                      </button>
                    ) : (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top duration-300">
                        <div className="rounded-xl bg-indigo-50/50 border border-indigo-100 p-4 text-xs text-indigo-950">
                          <p className="font-bold flex items-center gap-1 text-indigo-800">
                            <Check className="size-4" />
                            ¡Repaso completado! +50 XP
                          </p>
                          <p className="mt-1 font-medium">
                            La IA generó una variación basada en tu anterior quiz para validar la comprensión de ecuaciones. Restamos 5: 4y = 16. Dividimos por 4: <strong>y = 4</strong>.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setQuizOption(null);
                            setQuizChecked(false);
                            setReviewOption(null);
                            setReviewChecked(false);
                            setQuizState("math");
                          }}
                          className="w-full h-11 inline-flex items-center justify-center rounded-xl border border-border bg-card text-sm font-bold text-foreground hover:bg-muted transition"
                        >
                          Reiniciar Demo
                        </button>
                      </div>
                    )
                  )}
                </div>

              </div>
            </div>

            {/* Right Side: Features cards */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Feature 1 */}
              <div className="flex gap-4 items-start p-4 rounded-2xl hover:bg-muted/40 transition">
                <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-amber-50 text-amber-600">
                  <GraduationCap className="size-6" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-foreground text-base">{t("landing.prep1Title")}</h4>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {t("landing.prep1Desc")}
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex gap-4 items-start p-4 rounded-2xl hover:bg-muted/40 transition">
                <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600">
                  <Globe className="size-6" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-foreground text-base">{t("landing.prep2Title")}</h4>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {t("landing.prep2Desc")}
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex gap-4 items-start p-4 rounded-2xl hover:bg-muted/40 transition">
                <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <Brain className="size-6" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-foreground text-base">{t("landing.prep3Title")}</h4>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {t("landing.prep3Desc")}
                  </p>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ── SECTION 4: THE GAMIFIED UNIVERSE ── */}
      <section id="juegos" className="bg-muted/50 border-y border-border py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-primary font-bold text-sm uppercase tracking-wider">Juegos y Premios</span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              {t("landing.gamesTitle")}
            </h2>
            <p className="text-muted-foreground font-medium text-base">
              {t("landing.gamesSubtitle")}
            </p>
          </div>

          {/* Games Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Game 1: Tycoon */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition duration-300 flex flex-col justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-800 uppercase">
                  Tycoon 2.5D
                </span>
                <h3 className="font-display font-bold text-lg text-foreground mt-3">{t("landing.game1Title")}</h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  {t("landing.game1Desc")}
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Gamepad2 className="size-3.5" />
                  Educativo
                </span>
                <span className="font-bold text-primary">Jugar ahora →</span>
              </div>
            </div>

            {/* Game 2: Gold Quest */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition duration-300 flex flex-col justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 uppercase">
                  Chest Multiplier
                </span>
                <h3 className="font-display font-bold text-lg text-foreground mt-3">{t("landing.game2Title")}</h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  {t("landing.game2Desc")}
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Trophy className="size-3.5" />
                  Multijugador
                </span>
                <span className="font-bold text-primary">Jugar ahora →</span>
              </div>
            </div>

            {/* Game 3: Space Rush */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition duration-300 flex flex-col justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-indigo-100 text-indigo-800 uppercase">
                  Trivia Rocket
                </span>
                <h3 className="font-display font-bold text-lg text-foreground mt-3">{t("landing.game3Title")}</h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  {t("landing.game3Desc")}
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Rocket className="size-3.5" />
                  Velocidad
                </span>
                <span className="font-bold text-primary">Jugar ahora →</span>
              </div>
            </div>

            {/* Game 4: Sandbox 3D */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition duration-300 flex flex-col justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-pink-100 text-pink-800 uppercase">
                  3D Sandbox
                </span>
                <h3 className="font-display font-bold text-lg text-foreground mt-3">{t("landing.game4Title")}</h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  {t("landing.game4Desc")}
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Hammer className="size-3.5" />
                  Creativo
                </span>
                <span className="font-bold text-primary">Jugar ahora →</span>
              </div>
            </div>

          </div>

          {/* Blooks Collectible Showcase */}
          <div className="mt-16 rounded-3xl border border-border bg-card p-8 shadow-sm flex flex-col lg:flex-row gap-8 items-center">
            <div className="space-y-4 max-w-md">
              <span className="text-primary font-bold text-xs uppercase tracking-widest">Blook Locker</span>
              <h3 className="font-display font-extrabold text-2xl text-foreground">
                Colecciona Blooks Legendarios
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Cada respuesta correcta te acerca a abrir nuevos paquetes de Blooks. ¡Úsalos como tu avatar y muéstralos en la arena multijugador! Hay comunes, raros, épicos y legendarios.
              </p>
              <div className="flex gap-4 pt-2">
                <div className="text-center bg-muted/50 border border-border/80 rounded-xl px-4 py-2">
                  <p className="font-extrabold text-lg text-foreground">25+</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Blooks</p>
                </div>
                <div className="text-center bg-muted/50 border border-border/80 rounded-xl px-4 py-2">
                  <p className="font-extrabold text-lg text-foreground">4</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Paquetes</p>
                </div>
                <div className="text-center bg-muted/50 border border-border/80 rounded-xl px-4 py-2">
                  <p className="font-extrabold text-lg text-foreground">4</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Rarezas</p>
                </div>
              </div>
            </div>

            {/* Blooks Icons Showcase row */}
            <div className="flex-1 flex flex-wrap justify-center gap-4">
              {[
                { name: "Cerebro Sabio", rarity: "legendary", bg: "bg-amber-500", text: "🏆" },
                { name: "Birrete", rarity: "epic", bg: "bg-indigo-500", text: "🎓" },
                { name: "Átomo", rarity: "rare", bg: "bg-blue-500", text: "⚛️" },
                { name: "Lápiz", rarity: "common", bg: "bg-slate-400", text: "✏️" },
              ].map(blook => (
                <div key={blook.name} className="flex flex-col items-center bg-background border border-border p-4 rounded-2xl w-28 shadow-sm hover:scale-105 transition">
                  <div className={`size-14 rounded-2xl ${blook.bg} flex items-center justify-center text-3xl shadow-inner`}>
                    {blook.text}
                  </div>
                  <span className="text-xs font-bold text-foreground mt-3 text-center">{blook.name}</span>
                  <span className={`text-[9px] font-extrabold uppercase mt-1 ${
                    blook.rarity === "legendary" ? "text-amber-600" :
                    blook.rarity === "epic" ? "text-indigo-600" :
                    blook.rarity === "rare" ? "text-blue-600" : "text-slate-500"
                  }`}>
                    {blook.rarity}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── SECTION 5: STUDENT ECONOMY FLOW ── */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-primary font-bold text-sm uppercase tracking-wider">Premios y Monedas</span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              {t("landing.economyTitle")}
            </h2>
            <p className="text-muted-foreground font-medium text-base">
              {t("landing.economySubtitle")}
            </p>
          </div>

          {/* Flow Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
            
            {/* Step 1 */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm relative flex flex-col items-center text-center space-y-4">
              <div className="size-12 rounded-2xl bg-indigo-50 text-primary flex items-center justify-center font-bold text-lg">
                <BookOpen className="size-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-foreground">{t("landing.economy1Title")}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t("landing.economy1Desc")}
              </p>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm relative flex flex-col items-center text-center space-y-4">
              <div className="size-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg">
                <Coins className="size-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-foreground">{t("landing.economy2Title")}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t("landing.economy2Desc")}
              </p>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm relative flex flex-col items-center text-center space-y-4">
              <div className="size-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center font-bold text-lg">
                <User className="size-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-foreground">{t("landing.economy3Title")}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t("landing.economy3Desc")}
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ── SECTION 6: FOOTER & FINAL CTA ── */}
      <section className="mx-auto max-w-7xl px-6 pb-16">
        
        {/* Banner Card */}
        <div className="rounded-[2.5rem] border border-primary/20 bg-gradient-to-tr from-primary/5 via-primary/10 to-indigo-100/30 p-12 text-center relative overflow-hidden shadow-md">
          
          {/* Subtle sparkles */}
          <div className="absolute top-10 left-10 size-2 bg-primary/20 rounded-full blur-sm" />
          <div className="absolute bottom-10 right-10 size-3 bg-pink-300/30 rounded-full blur-md" />

          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              {t("landing.footerTitle")}
            </h2>
            <p className="text-base text-muted-foreground font-medium">
              Únete a miles de estudiantes que ya están encontrando su carrera ideal y preparándose para su examen de admisión de forma interactiva y divertida.
            </p>
            <div className="pt-4 flex justify-center">
              <Link to="/signup" className="inline-flex h-14 items-center justify-center rounded-2xl bg-primary px-8 font-bold text-primary-foreground shadow-[var(--shadow-elegant)] hover:bg-primary-glow hover:scale-105 transition">
                {t("landing.footerCta")}
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-muted-foreground font-semibold">
          
          <div className="flex items-center gap-2">
            <img src={streakCap} alt="" className="size-5" />
            <span>&copy; {new Date().getFullYear()} Lybanhi AI. {t("landing.footerRights")}</span>
          </div>

          <div className="flex flex-wrap justify-center gap-6">
            <a href="#" className="hover:text-primary transition">Términos de Servicio</a>
            <a href="#" className="hover:text-primary transition">Política de Privacidad</a>
            <a href="#" className="hover:text-primary transition">Soporte</a>
          </div>

        </footer>

      </section>

    </main>
  );
}

