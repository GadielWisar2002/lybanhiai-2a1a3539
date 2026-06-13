import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { AppHeader } from "@/components/AppHeader";
import { LEVELS } from "@/lib/topics";

const SUBJECTS = [
  { value: "math", label: "Matemáticas" },
  { value: "logic", label: "Lógica" },
  { value: "language", label: "Lenguaje" },
  { value: "chemistry", label: "Química" },
  { value: "toefl", label: "TOEFL" },
  { value: "cambridge", label: "Cambridge" },
  { value: "career", label: "Carrera" },
];
import { 
  listBooks, 
  createBookChapter, 
  updateBookChapter, 
  deleteBookChapter,
  getDashboard
} from "@/lib/quiz.functions";
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Edit2, 
  ChevronLeft, 
  Save, 
  Upload, 
  X,
  Lock,
  Search,
  BookMarked
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin-books")({
  head: () => ({ meta: [{ title: "Administración de Libros — Lybanhi" }] }),
  component: AdminBooks,
});

function AdminBooks() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, loading: loadingAuth } = useAuth();

  // Server functions
  const getDash = useServerFn(getDashboard);
  const getBooks = useServerFn(listBooks);
  const createChapter = useServerFn(createBookChapter);
  const updateChapter = useServerFn(updateBookChapter);
  const deleteChapter = useServerFn(deleteBookChapter);

  // Queries
  const { data: dash, isLoading: loadingDash } = useQuery({ 
    queryKey: ["dashboard"], 
    queryFn: () => getDash(),
    enabled: !!user
  });
  const { data: books, isLoading: loadingBooks } = useQuery({ 
    queryKey: ["admin-books"], 
    queryFn: () => getBooks(),
    enabled: !!user
  });

  // Developer check matching debanhivillanueva@colegiomaranatha
  const emailLower = user?.email?.toLowerCase() ?? "";
  const isDeveloper = emailLower === "debanhivillanueva@colegiomaranatha.edu.mx" ||
                      emailLower.includes("debanhivillanueva@colegiomaranatha") ||
                      emailLower.includes("debanhivillanuevacolegiomaranatha") ||
                      dash?.isDeveloper === true;

  // Local Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [grade, setGrade] = useState("");
  const [subject, setSubject] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Mutations
  const createMut = useMutation({
    mutationFn: (vars: { content: string; grade?: string | null; subject?: string | null }) => createChapter({ data: vars }),
    onSuccess: () => {
      toast.success("Texto guardado con éxito");
      resetForm();
      qc.invalidateQueries({ queryKey: ["admin-books"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error al guardar"),
  });

  const updateMut = useMutation({
    mutationFn: (vars: { id: string; content: string; grade?: string | null; subject?: string | null }) => updateChapter({ data: vars }),
    onSuccess: () => {
      toast.success("Texto actualizado con éxito");
      resetForm();
      qc.invalidateQueries({ queryKey: ["admin-books"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error al actualizar"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteChapter({ data: { id } }),
    onSuccess: () => {
      toast.success("Capítulo eliminado");
      qc.invalidateQueries({ queryKey: ["admin-books"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error al eliminar"),
  });

  // File Upload OCR handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".txt")) {
      toast.error("Solo se permiten archivos de texto plano (.txt)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setContent(text);
      toast.success("Texto cargado del archivo con éxito");
    };
    reader.readAsText(file);
  };

  const resetForm = () => {
    setEditingId(null);
    setContent("");
    setGrade("");
    setSubject("");
  };

  const handleEdit = async (bookId: string) => {
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase
        .from("books")
        .select("content, grade, subject")
        .eq("id", bookId)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        toast.error("El texto ya no está disponible");
        return;
      }
      setEditingId(bookId);
      setContent(data.content);
      setGrade(data.grade ?? "");
      setSubject(data.subject ?? "");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      toast.error("Error al cargar detalles del texto");
      console.error(err);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este texto de estudio?")) {
      deleteMut.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("Por favor completa el contenido de texto (OCR).");
      return;
    }
    if (editingId) {
      updateMut.mutate({ id: editingId, content, grade: grade.trim() || null, subject: subject.trim() || null });
    } else {
      createMut.mutate({ content, grade: grade.trim() || null, subject: subject.trim() || null });
    }
  };

  if (loadingAuth || loadingDash) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-muted-foreground">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isDeveloper) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-5">
        <div className="max-w-md text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-destructive/10 text-destructive">
            <Lock className="size-8" />
          </div>
          <h1 className="mt-6 font-display text-2xl font-bold text-foreground">Acceso Denegado</h1>
          <p className="mt-2 text-sm text-muted-foreground">Esta sección está restringida exclusivamente para administradores y desarrolladores de Lybanhi.</p>
          <Link to="/dashboard" className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-6 font-semibold text-primary-foreground transition hover:opacity-90 active:scale-95">
            Volver al inicio
          </Link>
        </div>
      </main>
    );
  }

  // Group books by Grade and Subject
  type Book = NonNullable<typeof books>[number];
  const groupedByGradeAndSubject: Record<string, Record<string, Book[]>> = {};
  
  (books ?? []).forEach(b => {
    const g = b.grade || "Sin grado";
    const s = b.subject || "Sin materia";
    if (!groupedByGradeAndSubject[g]) {
      groupedByGradeAndSubject[g] = {};
    }
    if (!groupedByGradeAndSubject[g][s]) {
      groupedByGradeAndSubject[g][s] = [];
    }
    groupedByGradeAndSubject[g][s].push(b);
  });

  // Filter grouped books by search query
  const filteredGroupedBooks = Object.keys(groupedByGradeAndSubject).reduce((accGrade, gradeKey) => {
    const subjectsMap = groupedByGradeAndSubject[gradeKey];
    const filteredSubjectsMap: Record<string, Book[]> = {};
    
    Object.keys(subjectsMap).forEach(subjectKey => {
      const textsList = subjectsMap[subjectKey];
      const matchedTexts = textsList.filter(txt => {
        const queryLower = searchQuery.toLowerCase();
        const matchesGrade = gradeKey.toLowerCase().includes(queryLower);
        const matchesSubject = subjectKey.toLowerCase().includes(queryLower);
        const subjectLabel = SUBJECTS.find(s => s.value === subjectKey)?.label || subjectKey;
        const matchesSubjectLabel = subjectLabel.toLowerCase().includes(queryLower);
        const gradeLabel = LEVELS["es"].find(l => l.value === gradeKey)?.label || gradeKey;
        const matchesGradeLabel = gradeLabel.toLowerCase().includes(queryLower);
        const matchesContent = txt.content.toLowerCase().includes(queryLower);
        return matchesGrade || matchesSubject || matchesSubjectLabel || matchesGradeLabel || matchesContent;
      });
      
      if (matchedTexts.length > 0) {
        filteredSubjectsMap[subjectKey] = matchedTexts;
      }
    });
    
    if (Object.keys(filteredSubjectsMap).length > 0) {
      accGrade[gradeKey] = filteredSubjectsMap;
    }
    return accGrade;
  }, {} as Record<string, Record<string, Book[]>>);

  return (
    <>
      <AppHeader />
      <div className="mx-auto max-w-4xl px-5 py-6">
        <div className="flex items-center gap-3">
          <Link to="/games" className="grid size-9 place-items-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground">
            <ChevronLeft className="size-5" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold flex items-center gap-2">
              <BookMarked className="size-6 text-primary" />
              Administrador de Libros
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">Sube los textos de tus libros (OCR) para generar quizzes dinámicos con la API de Gemini.</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-5">
          {/* Formulario */}
          <section className="md:col-span-2">
            <div className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sticky top-6">
              <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-1.5">
                {editingId ? <Edit2 className="size-4 text-primary" /> : <Plus className="size-4 text-primary" />}
                {editingId ? "Editar Texto de Estudio" : "Subir Texto de Estudio"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Grado y Materia */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground block px-1">GRADO</label>
                    <select
                      value={grade}
                      onChange={e => setGrade(e.target.value)}
                      className="h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm text-foreground focus:border-primary focus:outline-none cursor-pointer"
                    >
                      <option value="">-- Seleccionar grado --</option>
                      {LEVELS["es"].map(l => (
                        <option key={l.value} value={l.value}>{l.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground block px-1">MATERIA</label>
                    <select
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      className="h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm text-foreground focus:border-primary focus:outline-none cursor-pointer"
                    >
                      <option value="">-- Seleccionar materia --</option>
                      {SUBJECTS.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Contenido (Textarea) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-xs font-bold text-muted-foreground block">TEXTO COMPLETO (OCR)</label>
                    <label className="text-xs font-bold text-primary flex items-center gap-1 cursor-pointer hover:underline">
                      <Upload className="size-3" />
                      Cargar .txt
                      <input
                        type="file"
                        accept=".txt"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <textarea
                    required
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Pega aquí el texto extraído desde Google AI Studio..."
                    className="h-60 w-full rounded-xl border border-input bg-card p-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none font-mono text-xs leading-relaxed"
                  />
                  <div className="text-right text-[10px] text-muted-foreground px-1">
                    {content.length.toLocaleString()} caracteres
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-2 pt-2">
                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="h-11 flex-1 rounded-xl border border-input bg-card text-sm font-semibold text-foreground transition hover:bg-muted/30 cursor-pointer"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={createMut.isPending || updateMut.isPending || !content}
                    className="h-11 flex-1 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Save className="size-4" />
                    {editingId ? "Actualizar" : "Guardar"}
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* Listado de Libros */}
          <section className="md:col-span-3 space-y-4">
            {/* Buscador */}
            <div className="relative rounded-2xl border border-border bg-card px-3.5 h-11 flex items-center gap-2 shadow-sm">
              <Search className="size-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar por grado, materia o contenido..."
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="text-muted-foreground hover:text-foreground">
                  <X className="size-4" />
                </button>
              )}
            </div>

            {loadingBooks ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-2" />
                Cargando libros...
              </div>
            ) : Object.keys(filteredGroupedBooks).length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground shadow-sm">
                <BookOpen className="mx-auto size-12 text-muted-foreground/60 mb-2" />
                No se encontraron textos. ¡Agrega el primero en el formulario!
              </div>
            ) : (
              <div className="space-y-6">
                {Object.keys(filteredGroupedBooks).map(gradeKey => {
                  const gradeLabel = LEVELS["es"].find(l => l.value === gradeKey)?.label || gradeKey;
                  const subjectsMap = filteredGroupedBooks[gradeKey];
                  
                  return (
                    <div key={gradeKey} className="space-y-4">
                      <h3 className="font-display font-black text-xs uppercase text-slate-400 tracking-wider px-1">
                        {gradeLabel}
                      </h3>
                      
                      {Object.keys(subjectsMap).map(subjectKey => {
                        const subjectLabel = SUBJECTS.find(s => s.value === subjectKey)?.label || subjectKey;
                        const textsList = subjectsMap[subjectKey];
                        
                        return (
                          <div key={subjectKey} className="rounded-3xl border border-border bg-card overflow-hidden shadow-[var(--shadow-card)]">
                            <div className="bg-muted/40 px-4 py-2.5 border-b border-border flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <BookOpen className="size-4 text-primary" />
                                <h4 className="font-display font-bold text-sm text-foreground">{subjectLabel}</h4>
                              </div>
                              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                                {textsList.length} {textsList.length === 1 ? "texto" : "textos"}
                              </span>
                            </div>
                            
                            <ul className="divide-y divide-border">
                              {textsList.map((txt, index) => {
                                const contentSnippet = txt.content.length > 60 
                                  ? txt.content.slice(0, 60) + "..." 
                                  : txt.content;
                                return (
                                  <li key={txt.id} className="px-4 py-3 flex items-center justify-between gap-4 transition hover:bg-muted/10">
                                    <div className="min-w-0 flex-1">
                                      <p className="font-display text-sm font-semibold text-foreground truncate">
                                        Texto #{index + 1}
                                      </p>
                                      <p className="text-xs text-muted-foreground font-mono truncate mt-0.5 max-w-md">
                                        {contentSnippet}
                                      </p>
                                      <p className="text-[9px] text-slate-400 mt-1">
                                        Creado: {new Date(txt.created_at).toLocaleDateString()}
                                      </p>
                                    </div>
                                    
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button
                                        onClick={() => handleEdit(txt.id)}
                                        title="Editar texto"
                                        className="grid size-8 place-items-center rounded-lg border border-border bg-card text-muted-foreground hover:text-primary hover:border-primary/50 transition cursor-pointer"
                                      >
                                        <Edit2 className="size-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDelete(txt.id)}
                                        title="Eliminar texto"
                                        className="grid size-8 place-items-center rounded-lg border border-destructive/20 bg-card text-destructive hover:bg-destructive/5 transition cursor-pointer"
                                      >
                                        <Trash2 className="size-3.5" />
                                      </button>
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
