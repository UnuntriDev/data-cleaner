import { AnimatePresence, LayoutGroup, m } from "framer-motion";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { api } from "./api/client";
import { CleaningOptionCard } from "./components/CleaningOptionCard";
import { CleaningProgress } from "./components/CleaningProgress";
import { FileStatsCard } from "./components/FileStatsCard";
import { FileUploadCard } from "./components/FileUploadCard";
import { Hero } from "./components/Hero";
import { LandingFooter } from "./components/LandingFooter";
import { LandingNav } from "./components/LandingNav";
import { LandingFeatures, LandingWorkflow } from "./components/LandingSections";
import { PrimaryButton } from "./components/PrimaryButton";
import { HeroShowcase } from "./components/HeroShowcase";
import {
  issueKey,
  SmartSuggestions,
  SmartSuggestionsError,
  SmartSuggestionsLoading,
} from "./components/SmartSuggestions";
import { EmptyResultPanel, ErrorPanel } from "./components/StatePanels";
import { TrustBadges } from "./components/TrustBadges";
import { Download, Sparkles } from "./components/icons";
import dataLogo from "./assets/data-logo.webp";
import { createDemoFile } from "./demo";
import { PRESETS } from "./presets";
import { buildSmartFixSteps } from "./smartFix";
import type {
  CleaningJob,
  DataPreview,
  Dataset,
  DatasetStats,
  Insight,
  OperationStep,
  Report,
} from "./types";

const ease = [0.22, 1, 0.36, 1] as const;
const MIN_CLEANING_ANIMATION_MS = 1_300;
const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.35, ease },
};

// soft spring for the upload card layout animation
const uploadLayoutTransition = {
  type: "spring",
  stiffness: 120,
  damping: 20,
  mass: 1,
} as const;

// shared layoutId between landing and header; instant opacity so the
// crossfade never shows the empty state mid-flight
const uploadDockMotion = {
  initial: { opacity: 1 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0 } },
  transition: {
    layout: uploadLayoutTransition,
  },
};

const EMPTY_MANUAL_ENABLED: Record<string, boolean> = Object.fromEntries(
  PRESETS.map((p) => [p.key, false]),
);

// lazy-loaded so the landing page doesn't pay for workspace components
const DataPreviewTable = lazy(() =>
  import("./components/DataPreviewTable").then((mod) => ({
    default: mod.DataPreviewTable,
  })),
);
const ResultSummary = lazy(() =>
  import("./components/ResultSummary").then((mod) => ({
    default: mod.ResultSummary,
  })),
);

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export default function App() {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [rawPreview, setRawPreview] = useState<DataPreview | null>(null);
  const [stats, setStats] = useState<DatasetStats | null>(null);
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    EMPTY_MANUAL_ENABLED,
  );
  const actionPanelRef = useRef<HTMLDivElement | null>(null);
  const pendingActionPanelScrollRef = useRef(false);
  const uploadPanelRef = useRef<HTMLElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  // stale-request guards: bumped on new upload/cleaning, checked before
  // committing async results so old responses never overwrite newer state
  const uploadTokenRef = useRef(0);
  const cleaningTokenRef = useRef(0);
  const cleaningInFlightRef = useRef(false);
  const [smartOpen, setSmartOpen] = useState(true);
  const [manualOpen, setManualOpen] = useState(false);

  const [job, setJob] = useState<CleaningJob | null>(null);
  const [cleanPreview, setCleanPreview] = useState<DataPreview | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [cleanedDatasetId, setCleanedDatasetId] = useState<number | null>(null);
  const [insights, setInsights] = useState<Insight[] | null>(null);
  const [selectedInsightKeys, setSelectedInsightKeys] = useState<Set<string>>(
    () => new Set(),
  );

  const [uploading, setUploading] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [cleaningLabels, setCleaningLabels] = useState<string[]>([]);
  const [analyzingInsights, setAnalyzingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selected = PRESETS.filter((p) => enabled[p.key]);
  const selectedInsights =
    insights?.filter((ins) => selectedInsightKeys.has(issueKey(ins))) ?? [];
  const cleanedRows = cleanPreview?.total_rows ?? null;
  const successfulClean =
    !!job &&
    job.status === "completed" &&
    !!report &&
    !!cleanPreview &&
    cleanedRows !== null &&
    cleanedRows > 0;
  const emptyResult =
    !!job &&
    job.status === "completed" &&
    !!report &&
    !!cleanPreview &&
    cleanedRows === 0;
  const hasCleanedCurrentDataset =
    !!dataset && cleanedDatasetId === dataset.id;
  const previewToShow = successfulClean ? cleanPreview : rawPreview;
  const progressLabels =
    cleaningLabels.length > 0 ? cleaningLabels : selected.map((p) => p.label);
  const uploadedFileName = dataset?.original_filename ?? dataset?.name ?? null;

  function openFilePicker() {
    uploadInputRef.current?.click();
  }

  function scrollToHowItWorks() {
    document
      .getElementById("workflow")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function loadDemo() {
    if (uploading) return;
    void handleUpload(createDemoFile());
  }

  function goHome() {
    uploadTokenRef.current += 1;
    cleaningTokenRef.current += 1;
    cleaningInFlightRef.current = false;
    pendingActionPanelScrollRef.current = false;

    setUploading(false);
    setCleaning(false);
    setCleaningLabels([]);
    setAnalyzingInsights(false);
    setError(null);
    setDataset(null);
    setRawPreview(null);
    setStats(null);
    setCleanedDatasetId(null);
    setEnabled(EMPTY_MANUAL_ENABLED);
    setSmartOpen(true);
    setManualOpen(false);
    resetInsights();
    resetResults();

    window.history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search,
    );
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function scrollToActionPanel() {
    const target = actionPanelRef.current;
    if (!target) return;

    const top = target.getBoundingClientRect().top + window.scrollY - 24;
    window.scrollTo({
      top: Math.max(top, 0),
      behavior: "smooth",
    });
  }

  function scrollToApp() {
    const target = dataset ? actionPanelRef.current : uploadPanelRef.current;
    if (!target) return;

    const top = target.getBoundingClientRect().top + window.scrollY - 24;
    window.scrollTo({
      top: Math.max(top, 0),
      behavior: "smooth",
    });
  }

  useEffect(() => {
    if (!cleaning || !pendingActionPanelScrollRef.current) return;

    pendingActionPanelScrollRef.current = false;
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(scrollToActionPanel);
    });
  }, [cleaning]);

  function resetResults() {
    setJob(null);
    setCleanPreview(null);
    setReport(null);
  }

  function resetInsights() {
    setInsights(null);
    setSelectedInsightKeys(new Set());
    setInsightsError(null);
    setAnalyzingInsights(false);
  }

  async function handleUpload(file: File) {
    const token = ++uploadTokenRef.current;
    cleaningTokenRef.current += 1; // invalidate any in-flight cleaning run
    cleaningInFlightRef.current = false;
    const isCurrent = () => uploadTokenRef.current === token;

    setUploading(true);
    setError(null);
    setDataset(null);
    setRawPreview(null);
    setStats(null);
    setCleanedDatasetId(null);
    setEnabled(EMPTY_MANUAL_ENABLED);
    setSmartOpen(true);
    setManualOpen(false);
    // reset cleaning flags since the invalidated run won't clean up
    setCleaning(false);
    setCleaningLabels([]);
    resetInsights();
    resetResults();
    // preload workspace chunks while the upload is in flight
    void import("./components/DataPreviewTable");
    void import("./components/ResultSummary");
    try {
      const ds = await api.uploadDataset(file);
      if (!isCurrent()) return;
      setDataset(ds);
      setUploading(false);
      setAnalyzingInsights(true);
      const analysisRequest = api
        .analyzeDataset(ds.id)
        .then((response) => ({ ok: true as const, response }))
        .catch((analysisError: unknown) => ({
          ok: false as const,
          message:
            analysisError instanceof Error
              ? analysisError.message
              : String(analysisError),
        }));
      const [preview, datasetStats, analysis] = await Promise.all([
        api.previewDataset(ds.id),
        api.statsDataset(ds.id),
        analysisRequest,
      ]);
      if (!isCurrent()) return;
      setRawPreview(preview);
      setStats(datasetStats);
      if (!analysis.ok) {
        setInsights([]);
        setSelectedInsightKeys(new Set());
        setInsightsError(analysis.message);
      } else {
        setInsights(analysis.response.issues);
        setSelectedInsightKeys(
          new Set(
            analysis.response.issues
              .filter((ins) => ins.recommended)
              .map(issueKey),
          ),
        );
        setInsightsError(null);
      }
    } catch (e) {
      if (!isCurrent()) return;
      setError(e instanceof Error ? e.message : String(e));
      setDataset(null);
      setRawPreview(null);
      setStats(null);
      resetInsights();
    } finally {
      if (isCurrent()) {
        setUploading(false);
        setAnalyzingInsights(false);
      }
    }
  }

  function toggle(key: string) {
    if (cleaning || hasCleanedCurrentDataset) return;
    setError(null);
    resetResults();
    setEnabled((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function runCleaning(steps: OperationStep[], labels: string[]) {
    if (
      !dataset ||
      steps.length === 0 ||
      hasCleanedCurrentDataset ||
      cleaningInFlightRef.current
    ) {
      return;
    }
    cleaningInFlightRef.current = true;
    const token = ++cleaningTokenRef.current;
    const isCurrent = () => cleaningTokenRef.current === token;
    const minimumAnimation = wait(MIN_CLEANING_ANIMATION_MS);

    pendingActionPanelScrollRef.current = true;
    setCleaning(true);
    setCleaningLabels(labels);
    setError(null);
    resetResults();
    try {
      // create, then poll until terminal
      const created = await api.createJob(dataset.id, steps);
      if (!isCurrent()) return;
      const finished = await api.waitForJob(created.id, {
        shouldStop: () => !isCurrent(),
      });
      if (!isCurrent()) return;
      if (finished.status === "failed") {
        throw new Error(finished.error ?? "Czyszczenie nie powiodło się.");
      }
      const [preview, rep] = await Promise.all([
        api.previewJob(finished.id),
        api.getReport(finished.id),
      ]);
      await minimumAnimation;
      if (!isCurrent()) return;
      if (preview.total_rows > 0 && preview.rows.length === 0) {
        throw new Error("Nie udało się pobrać wierszy podglądu po czyszczeniu.");
      }
      setJob(finished);
      setCleanPreview(preview);
      setReport(rep);
      setCleanedDatasetId(finished.dataset_id);
    } catch (e) {
      await minimumAnimation;
      if (!isCurrent()) return;
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (isCurrent()) {
        cleaningInFlightRef.current = false;
        setCleaning(false);
        setCleaningLabels([]);
      }
    }
  }

  function handleDownload(format: string) {
    if (!job) return;
    const a = document.createElement("a");
    a.href = api.downloadUrl(job.id, format);
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function handlePrimaryAction() {
    if (successfulClean) {
      handleDownload("csv");
      return;
    }
    void runCleaning(
      selected.map((p) => p.step),
      selected.map((p) => p.label),
    );
  }

  function toggleInsight(key: string) {
    if (cleaning || hasCleanedCurrentDataset) return;
    setError(null);
    resetResults();
    setSelectedInsightKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function toggleAllInsights() {
    if (!insights || cleaning || hasCleanedCurrentDataset) return;
    setError(null);
    resetResults();
    const allKeys = insights.map(issueKey);
    setSelectedInsightKeys((prev) =>
      prev.size === allKeys.length ? new Set() : new Set(allKeys),
    );
  }

  function runSmartFixes() {
    if (hasCleanedCurrentDataset) return;
    const steps = buildSmartFixSteps(selectedInsights);
    const labels = selectedInsights.map((ins) => ins.title);
    void runCleaning(steps, labels);
  }

  const ctaLabel = cleaning
    ? "Czyszczenie danych..."
    : successfulClean
      ? "Pobierz wynik"
      : hasCleanedCurrentDataset
        ? "Plik już naprawiony"
      : selected.length === 0
      ? "Wybierz operacje ręczne"
      : `Wyczyść ręcznie — ${selected.length} operacji`;

  return (
    <div className="min-h-screen px-5 pb-10 pt-5 sm:px-8 lg:px-12 lg:pb-12 lg:pt-6">
      <div className="mx-auto max-w-7xl">
        <LayoutGroup id="upload-dock">
        {/* Top bar */}
        <m.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease }}
          className="mb-8 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-center sm:justify-between"
        >
          <button
            type="button"
            onClick={goHome}
            aria-label="Wróć na stronę główną"
            className="w-[10.5rem] max-w-full sm:w-[12rem]"
          >
            <img
              src={dataLogo}
              alt="Data Cleaner"
              className="w-full object-contain drop-shadow-[0_12px_24px_rgba(40,36,90,0.14)]"
            />
          </button>
          <AnimatePresence initial={false} mode="popLayout">
            {!uploadedFileName && (
              <m.div
                key="landing-nav"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                className="sm:ml-auto"
              >
                <LandingNav onStart={scrollToApp} />
              </m.div>
            )}
          </AnimatePresence>
          <AnimatePresence initial={false} mode="popLayout">
            {uploadedFileName && (
              <m.div
                key="header-upload"
                layoutId="upload-step-panel"
                {...uploadDockMotion}
                layout
                className="w-full transform-gpu sm:w-[clamp(20rem,34vw,26rem)]"
              >
                <FileUploadCard
                  onUpload={handleUpload}
                  busy={uploading}
                  fileName={uploadedFileName}
                />
              </m.div>
            )}
          </AnimatePresence>
        </m.header>

        {/* Global error banner */}
        <AnimatePresence>
          {error && (
            <m.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200">
                {error}
              </div>
            </m.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {!dataset ? (
            /* Landing page */
            <m.div
              key="welcome"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0 } }}
              className="space-y-24 sm:space-y-32"
            >
              <div className="relative grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
                <div className="aurora" />
                {/* Left: hero + upload */}
                <div className="relative z-10 space-y-7">
                  <Hero
                    onUpload={openFilePicker}
                    onHowItWorks={scrollToHowItWorks}
                  />
                  {/* scroll anchor outside popLayout to avoid React 18.3 ref warning */}
                  <span ref={uploadPanelRef} aria-hidden />
                  <AnimatePresence initial={false} mode="popLayout">
                    {!uploadedFileName && (
                      <m.div
                        key="main-upload"
                        layoutId="upload-step-panel"
                        {...uploadDockMotion}
                        layout
                        className="transform-gpu"
                      >
                        <FileUploadCard
                          onUpload={handleUpload}
                          busy={uploading}
                          fileName={uploadedFileName}
                          inputRef={uploadInputRef}
                        />
                      </m.div>
                    )}
                  </AnimatePresence>
                  <TrustBadges />
                </div>

                {/* Right: animated before/after showcase */}
                <div className="relative z-10">
                  <HeroShowcase />
                </div>
              </div>

              <LandingWorkflow onUpload={openFilePicker} onDemo={loadDemo} />
              <LandingFeatures />
              <LandingFooter onOpenApp={scrollToApp} />
            </m.div>
          ) : (
            <m.div {...fadeUp} key="workspace" className="space-y-8">
              {/* File summary */}
              <AnimatePresence>
                {stats && (
                  <m.div {...fadeUp} key="summary">
                    <Panel title="Podsumowanie pliku">
                      <FileStatsCard stats={stats} />
                    </Panel>
                  </m.div>
                )}
              </AnimatePresence>

              {/* Workspace: issues sidebar + data preview */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[350px_minmax(0,1fr)] lg:items-start">
                {/* Left: issues + manual mode */}
                <div className="space-y-6">
                  <section>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-400">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-coral-100 text-coral-600">
                          <Sparkles className="h-3 w-3" />
                        </span>
                        Wykryte problemy
                      </h2>
                      <button
                        type="button"
                        onClick={() => setSmartOpen((open) => !open)}
                        className="rounded-full bg-white/70 px-3 py-1.5 text-xs font-semibold text-ink-600 shadow-soft ring-1 ring-white/70 transition-colors hover:text-coral-700 hover:ring-coral-200"
                      >
                        {smartOpen ? "Zwiń" : "Rozwiń"}
                      </button>
                    </div>

                    <AnimatePresence initial={false}>
                      {smartOpen ? (
                        <m.div
                          key="smart-open"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          {analyzingInsights ? (
                            <SmartSuggestionsLoading />
                          ) : insightsError ? (
                            <SmartSuggestionsError message={insightsError} />
                          ) : insights ? (
                            <SmartSuggestions
                              insights={insights}
                              selected={selectedInsightKeys}
                              onToggle={toggleInsight}
                              onToggleAll={toggleAllInsights}
                              onFix={runSmartFixes}
                              running={cleaning}
                              locked={hasCleanedCurrentDataset}
                            />
                          ) : null}
                        </m.div>
                      ) : (
                        <m.div
                          key="smart-closed"
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="glass-strong rounded-2xl p-4 text-sm text-ink-500 shadow-soft ring-1 ring-white/70"
                        >
                          {analyzingInsights
                            ? "Analiza danych trwa w tle."
                            : insights
                              ? `${insights.length} wykrytych problemów, ${selectedInsightKeys.size} zaznaczonych poprawek. Rozwiń, aby zmienić wybór albo uruchomić Smart Fix.`
                              : "Rozwiń, aby zobaczyć automatycznie wykryte problemy i poprawki."}
                        </m.div>
                      )}
                    </AnimatePresence>
                  </section>

                  <section>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-400">
                        <span className="rounded-full bg-coral-100 px-2.5 py-1 text-[0.65rem] font-bold text-coral-600">
                          Opcjonalnie
                        </span>
                        Tryb ręczny
                      </h2>
                      <button
                        type="button"
                        onClick={() => setManualOpen((open) => !open)}
                        className="rounded-full bg-white/70 px-3 py-1.5 text-xs font-semibold text-ink-600 shadow-soft ring-1 ring-white/70 transition-colors hover:text-coral-700 hover:ring-coral-200"
                      >
                        {manualOpen ? "Ukryj" : "Pokaż"}
                      </button>
                    </div>

                    <AnimatePresence initial={false}>
                      {manualOpen ? (
                        <m.div
                          key="manual-open"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="grid grid-cols-1 gap-3">
                            {PRESETS.map((preset) => (
                              <CleaningOptionCard
                                key={preset.key}
                                preset={preset}
                                selected={!!enabled[preset.key]}
                                onToggle={() => toggle(preset.key)}
                                disabled={cleaning || hasCleanedCurrentDataset}
                              />
                            ))}
                          </div>
                          <div className="mt-5">
                            <PrimaryButton
                              onClick={handlePrimaryAction}
                              loading={cleaning}
                              disabled={
                                (!successfulClean && selected.length === 0) ||
                                (hasCleanedCurrentDataset && !successfulClean)
                              }
                              fullWidth
                              icon={
                                successfulClean ? (
                                  <Download className="h-4 w-4" />
                                ) : (
                                  <Sparkles className="h-4 w-4" />
                                )
                              }
                            >
                              {ctaLabel}
                            </PrimaryButton>
                          </div>
                        </m.div>
                      ) : (
                        <m.div
                          key="manual-closed"
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="glass-strong rounded-2xl p-4 text-sm text-ink-500 shadow-soft ring-1 ring-white/70"
                        >
                          {selected.length > 0
                            ? `${selected.length} ręczne operacje gotowe. Rozwiń, aby je zmienić albo uruchomić zamiast Smart Fix.`
                            : "Ręczne operacje są schowane. Użyj ich tylko, gdy chcesz pominąć sugestie Smart Fix albo ustawić własny zestaw."}
                        </m.div>
                      )}
                    </AnimatePresence>
                  </section>
                </div>

                {/* Right: action panel + data preview */}
                <div ref={actionPanelRef} className="space-y-6 scroll-mt-6">
                  <div className="lg:sticky lg:top-6 lg:z-20">
                    <AnimatePresence mode="wait">
                      {error ? (
                        <m.div {...fadeUp} key="error">
                          <ErrorPanel message={error} />
                        </m.div>
                      ) : cleaning ? (
                        <m.div {...fadeUp} key="progress">
                          <CleaningProgress
                            labels={progressLabels}
                            durationMs={MIN_CLEANING_ANIMATION_MS}
                          />
                        </m.div>
                      ) : emptyResult ? (
                        <m.div {...fadeUp} key="empty-result">
                          <EmptyResultPanel />
                        </m.div>
                      ) : successfulClean ? (
                        <m.div {...fadeUp} key="result">
                          <Suspense fallback={null}>
                            <ResultSummary
                              report={report!}
                              fileName={uploadedFileName}
                              onDownload={handleDownload}
                            />
                          </Suspense>
                        </m.div>
                      ) : null}
                    </AnimatePresence>
                  </div>

                  <AnimatePresence mode="wait">
                    {!cleaning && !emptyResult && previewToShow && (
                      <m.div
                        {...fadeUp}
                        key={successfulClean ? "clean-preview" : "raw-preview"}
                      >
                        <Suspense fallback={null}>
                          <DataPreviewTable
                            preview={previewToShow}
                            title={
                              successfulClean
                                ? "Podgląd po czyszczeniu"
                                : "Podgląd danych"
                            }
                            tone={successfulClean ? "clean" : "neutral"}
                          />
                        </Suspense>
                      </m.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </m.div>
          )}
        </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">
        {title}
      </h2>
      {children}
    </section>
  );
}
