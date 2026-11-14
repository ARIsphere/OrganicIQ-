import React, { useState, useEffect } from 'react';
import {
  PenTool,
  Loader2,
  FileText,
  Copy,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Check,
  Link as LinkIcon,
  Code2,
  Download,
  Send,
  AlertCircle,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import {
  streamArticleDraft,
  analyzeContent,
  publishToCms,
  CmsPublishResponse,
} from '../services/geminiService';
import { AutopilotArticle, ContentAnalysis, WorkspaceState } from '../types';
import { CMS_TARGETS, SUPPORTED_LANGUAGES } from '../services/workspaceStore';

interface ContentGeneratorProps {
  workspace: WorkspaceState;
  initialDraftContext: { topic: string; queueId?: string; language?: string; format?: string } | null;
  onClearDraftContext: () => void;
  onMarkArticlePublished: (queueId: string | undefined, article: Partial<AutopilotArticle>) => void;
}

const ContentGenerator: React.FC<ContentGeneratorProps> = ({
  workspace,
  initialDraftContext,
  onClearDraftContext,
  onMarkArticlePublished,
}) => {
  const [topic, setTopic] = useState(initialDraftContext?.topic || '');
  const [tone, setTone] = useState('Informative');
  const [language, setLanguage] = useState(
    initialDraftContext?.language || workspace.brandProfile.language || 'English'
  );
  const [format, setFormat] = useState(initialDraftContext?.format || 'Comprehensive Guide');
  const [useBrandVoice, setUseBrandVoice] = useState(true);
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState('');

  // SEO Analysis State
  const [activeTab, setActiveTab] = useState<'preview' | 'seo' | 'publish'>('preview');
  const [analysis, setAnalysis] = useState<ContentAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const [isCopied, setIsCopied] = useState(false);
  const [copiedSchemaIdx, setCopiedSchemaIdx] = useState<number | null>(null);
  const [copiedHtml, setCopiedHtml] = useState(false);

  // CMS Publishing State
  const [targetCms, setTargetCms] = useState<string>(
    workspace.brandProfile.connectedCms === 'None' ? 'WordPress' : workspace.brandProfile.connectedCms
  );
  const [webhookUrl, setWebhookUrl] = useState(workspace.brandProfile.webhookUrl || '');
  const [selectedMeta, setSelectedMeta] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<CmsPublishResponse | null>(null);
  const [publishError, setPublishError] = useState('');

  useEffect(() => {
    if (initialDraftContext?.topic) {
      setTopic(initialDraftContext.topic);
      if (initialDraftContext.language) setLanguage(initialDraftContext.language);
      if (initialDraftContext.format) setFormat(initialDraftContext.format);
    }
  }, [initialDraftContext]);

  const wordCount = content
    ? content
        .replace(/<[^>]+>/g, ' ')
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0).length
    : 0;

  const extractedTitle = (() => {
    const match = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (match?.[1]) return match[1].replace(/<[^>]+>/g, '').trim();
    return topic || 'Untitled Article';
  })();

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setGenError('');
    setContent('');
    setAnalysis(null);
    setPublishResult(null);
    setCheckedItems(new Set());
    setActiveTab('preview');

    try {
      await streamArticleDraft(
        {
          topic: topic.trim(),
          tone,
          language,
          format,
          brandProfile: useBrandVoice ? workspace.brandProfile : undefined,
        },
        (chunkText) => {
          setContent((prev) => prev + chunkText);
        }
      );
    } catch (error) {
      setGenError(error instanceof Error ? error.message : 'Article generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnalyze = async () => {
    if (!content || !topic) return;
    setIsAnalyzing(true);
    setAnalysisError('');
    try {
      const result = await analyzeContent(content, topic);
      setAnalysis(result);
      if (result.metaDescriptions?.[0] && !selectedMeta) {
        setSelectedMeta(result.metaDescriptions[0]);
      }
      setCheckedItems(new Set());
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : 'SEO analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePublish = async () => {
    if (!content) return;
    setIsPublishing(true);
    setPublishError('');
    setPublishResult(null);
    try {
      const res = await publishToCms({
        cms: targetCms,
        webhookUrl,
        title: extractedTitle,
        htmlContent: content,
        metaDescription: selectedMeta || analysis?.metaDescriptions?.[0] || '',
        keyword: topic,
      });
      setPublishResult(res);
      onMarkArticlePublished(initialDraftContext?.queueId, {
        title: extractedTitle,
        keyword: topic,
        targetCms,
        language,
        format,
        wordCount,
        htmlContent: content,
        metaDescription: selectedMeta,
        status: 'Published',
      });
      onClearDraftContext();
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Publishing failed.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDownloadHtml = () => {
    const fullDoc = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8" />\n<title>${extractedTitle}</title>\n<meta name="description" content="${selectedMeta || ''}" />\n</head>\n<body>\n${content}\n</body>\n</html>`;
    const blob = new Blob([fullDoc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${extractedTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJsonPayload = () => {
    const payload = {
      cms: targetCms,
      title: extractedTitle,
      focusKeyword: topic,
      language,
      metaDescription: selectedMeta || analysis?.metaDescriptions?.[0] || '',
      wordCount,
      htmlContent: content,
      schemaJsonLd: analysis?.structuredDataSuggestions?.map((s) => s.code) || [],
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${extractedTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${targetCms.toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleCheck = (index: number) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleCopyAnalysis = () => {
    if (!analysis) return;
    const report = [
      `SEO & AI-SEARCH ANALYSIS REPORT`,
      `Topic: ${topic}`,
      `Date: ${new Date().toLocaleDateString()}`,
      `================================================`,
      `\n1. READABILITY & AI SEARCH READINESS`,
      `Readability: ${analysis.readability.level}`,
      `Answer-First Readiness: ${analysis.aiSearchReadiness?.answerFirstScore || 'Evaluated'}`,
      ...analysis.readability.suggestions.map((s) => `- ${s}`),
      `\n2. KEYWORD DENSITY`,
      ...analysis.keywordAnalysis.map((k) => `- ${k.keyword}: ${k.count} uses (${k.status})`),
      `\n3. META DESCRIPTIONS`,
      ...analysis.metaDescriptions.map((d, i) => `${i + 1}. ${d}`),
      `\n4. INTERNAL LINKS`,
      ...analysis.internalLinks.map((l) => `- "${l.anchorText}" -> ${l.targetTopic} (${l.relevance})`),
      `\n5. CHECKLIST`,
      ...analysis.checklist.map((c, i) => `${checkedItems.has(i) ? '[x]' : '[ ]'} ${c}`),
    ].join('\n');

    navigator.clipboard.writeText(report);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleExportPDF = () => {
    if (!analysis) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let yPos = 20;

    const checkPageBreak = (heightNeeded: number) => {
      if (yPos + heightNeeded >= 280) {
        doc.addPage();
        yPos = 20;
      }
    };

    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42);
    doc.text('OrganicIQ Content SEO Report', margin, yPos);
    yPos += 8;

    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(`Article: ${extractedTitle}`, margin, yPos);
    yPos += 14;

    doc.setFontSize(13);
    doc.setTextColor(5, 150, 105);
    doc.text('Readability & AI Search Readiness', margin, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text(`Level: ${analysis.readability.level}`, margin, yPos);
    yPos += 6;
    if (analysis.aiSearchReadiness?.answerFirstScore) {
      doc.text(`AI Search Answer-First: ${analysis.aiSearchReadiness.answerFirstScore}`, margin, yPos);
      yPos += 6;
    }

    analysis.readability.suggestions.forEach((s) => {
      const lines = doc.splitTextToSize(`- ${s}`, contentWidth);
      checkPageBreak(lines.length * 5);
      doc.text(lines, margin, yPos);
      yPos += lines.length * 5 + 2;
    });
    yPos += 6;

    checkPageBreak(30);
    doc.setFontSize(13);
    doc.setTextColor(5, 150, 105);
    doc.text('Keyword Usage', margin, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    analysis.keywordAnalysis.forEach((k) => {
      checkPageBreak(6);
      doc.text(`- ${k.keyword}: ${k.count} uses (${k.status})`, margin, yPos);
      yPos += 6;
    });
    yPos += 6;

    checkPageBreak(30);
    doc.setFontSize(13);
    doc.setTextColor(5, 150, 105);
    doc.text('Optimization Checklist', margin, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    analysis.checklist.forEach((item, i) => {
      const checkbox = checkedItems.has(i) ? '[x]' : '[ ]';
      const lines = doc.splitTextToSize(`${checkbox} ${item}`, contentWidth);
      checkPageBreak(lines.length * 5);
      doc.text(lines, margin, yPos);
      yPos += lines.length * 5 + 2;
    });

    doc.save(`OrganicIQ-SEO-Report-${Date.now()}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Content Studio</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Draft brand-aligned articles for Google &amp; AI search engines and publish to your CMS.
          </p>
        </div>

        {content && (
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-medium text-slate-600 tabular-nums">
              {wordCount.toLocaleString()} words
            </span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(content);
                setCopiedHtml(true);
                setTimeout(() => setCopiedHtml(false), 1800);
              }}
              className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              {copiedHtml ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              {copiedHtml ? 'Copied HTML' : 'Copy HTML'}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Controls */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target Keyword or Article Topic
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Automated CI/CD rollback strategies"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-600 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Format</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-white focus:border-emerald-600 outline-none"
                >
                  <option>Comprehensive Guide</option>
                  <option>Technical How-To</option>
                  <option>Comparison</option>
                  <option>Listicle</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-white focus:border-emerald-600 outline-none"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tone of Voice</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-white focus:border-emerald-600 outline-none"
              >
                <option>Informative</option>
                <option>Authoritative</option>
                <option>Persuasive</option>
                <option>Technical</option>
                <option>Conversational</option>
              </select>
            </div>

            <label className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={useBrandVoice}
                onChange={(e) => setUseBrandVoice(e.target.checked)}
                className="mt-0.5 accent-emerald-600"
              />
              <span className="text-xs text-slate-700 leading-relaxed">
                Apply <span className="font-semibold">{workspace.brandProfile.brandName}</span> brand voice &amp; internal link pillars
              </span>
            </label>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !topic.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-3 rounded-lg text-sm font-semibold transition-colors flex justify-center items-center gap-2 cursor-pointer"
            >
              {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <PenTool size={16} />}
              {isGenerating ? 'Streaming Draft...' : 'Generate Article'}
            </button>

            {genError && (
              <p className="text-xs text-red-600 font-medium flex items-center gap-1.5">
                <AlertCircle size={14} /> {genError}
              </p>
            )}
          </div>
        </div>

        {/* Right Editor / Analyzer / Publish Workspace */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 flex flex-col min-h-[580px] overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 flex items-center justify-between px-4">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-4 py-3.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'preview'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Eye size={15} /> Article Preview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('seo')}
                className={`px-4 py-3.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'seo'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <CheckCircle2 size={15} /> SEO &amp; AI Readiness
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('publish')}
                className={`px-4 py-3.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'publish'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Send size={15} /> Publish &amp; Export
              </button>
            </div>

            {isGenerating && (
              <span className="text-xs font-mono text-emerald-700">Streaming...</span>
            )}
          </div>

          <div className="flex-1 p-6 lg:p-8 overflow-y-auto max-h-[720px]">
            {/* Tab 1: Preview */}
            {activeTab === 'preview' && (
              <div>
                {content ? (
                  <div className="space-y-6">
                    {/* Google SERP Preview */}
                    <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/70 space-y-1">
                      <p className="text-[11px] font-mono text-slate-400">
                        SERP Preview · {workspace.brandProfile.domain || 'yourdomain.com'} › blog
                      </p>
                      <p className="text-base font-semibold text-blue-700 leading-snug">
                        {extractedTitle}
                      </p>
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {selectedMeta ||
                          analysis?.metaDescriptions?.[0] ||
                          content.replace(/<[^>]+>/g, ' ').trim().slice(0, 155)}
                      </p>
                    </div>

                    <div
                      className="article-prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: content }}
                    />
                  </div>
                ) : (
                  <div className="h-96 flex flex-col items-center justify-center text-slate-400 text-center space-y-3">
                    <RefreshCw size={32} className="opacity-40" />
                    <p className="text-sm text-slate-500 max-w-sm">
                      Enter a target keyword on the left and click &ldquo;Generate Article&rdquo; to stream an SEO &amp; AI-search optimized post.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: SEO & GEO Analysis */}
            {activeTab === 'seo' && (
              <div className="space-y-6">
                {!content ? (
                  <div className="py-16 text-center text-sm text-slate-500">
                    Generate an article draft first to run keyword density, GEO readiness, and JSON-LD schema checks.
                  </div>
                ) : !analysis ? (
                  <div className="py-16 text-center space-y-4">
                    <p className="text-sm text-slate-600">
                      Evaluate keyword coverage, Google AI Overview readiness, internal link anchors, and Schema.org markup.
                    </p>
                    <button
                      type="button"
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-semibold rounded-lg inline-flex items-center gap-2 cursor-pointer"
                    >
                      {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                      {isAnalyzing ? 'Analyzing Article...' : 'Run SEO & AI Search Audit'}
                    </button>
                    {analysisError && <p className="text-xs text-red-600">{analysisError}</p>}
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">Optimization Report</h3>
                        <p className="text-xs text-slate-500">Target query: {topic}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleExportPDF}
                          className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Download size={14} /> PDF
                        </button>
                        <button
                          type="button"
                          onClick={handleCopyAnalysis}
                          className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                        >
                          {isCopied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                          {isCopied ? 'Copied' : 'Copy Report'}
                        </button>
                      </div>
                    </div>

                    {/* Readability & AI Search Readiness */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="p-5 rounded-xl border border-slate-200 space-y-3">
                        <h4 className="text-sm font-semibold text-slate-900">Readability Level</h4>
                        <p className="font-mono text-2xl font-bold text-emerald-700">{analysis.readability.level}</p>
                        <ul className="space-y-2">
                          {analysis.readability.suggestions.map((s, i) => (
                            <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                              <AlertTriangle size={13} className="text-amber-600 mt-0.5 shrink-0" />
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-5 rounded-xl border border-slate-200 space-y-3">
                        <h4 className="text-sm font-semibold text-slate-900">AI Search Citation Readiness</h4>
                        <p className="font-mono text-2xl font-bold text-slate-900">
                          {analysis.aiSearchReadiness?.answerFirstScore || 'Structured'}
                        </p>
                        <ul className="space-y-2">
                          {(analysis.aiSearchReadiness?.recommendations || []).map((rec, i) => (
                            <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                              <Check size={13} className="text-emerald-600 mt-0.5 shrink-0" />
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Keyword Density */}
                    <div className="p-5 rounded-xl border border-slate-200 space-y-3">
                      <h4 className="text-sm font-semibold text-slate-900">Keyword Density</h4>
                      <div className="divide-y divide-slate-100">
                        {analysis.keywordAnalysis.map((k, i) => (
                          <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-800">{k.keyword}</span>
                            <div className="flex items-center gap-4">
                              <span className="font-mono text-slate-500 tabular-nums">{k.count} uses</span>
                              <span
                                className={`font-semibold ${
                                  k.status === 'Optimal'
                                    ? 'text-emerald-700'
                                    : k.status === 'High'
                                    ? 'text-red-700'
                                    : 'text-amber-700'
                                }`}
                              >
                                {k.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Meta Descriptions */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <FileText size={16} className="text-slate-500" /> Select Active Meta Description
                      </h4>
                      <div className="space-y-2">
                        {analysis.metaDescriptions.map((desc, i) => (
                          <div
                            key={i}
                            onClick={() => setSelectedMeta(desc)}
                            className={`p-3.5 rounded-lg border text-xs flex items-start justify-between gap-3 cursor-pointer transition-colors ${
                              selectedMeta === desc
                                ? 'border-emerald-600 bg-emerald-50/40'
                                : 'border-slate-200 bg-slate-50 hover:bg-white'
                            }`}
                          >
                            <p className="text-slate-700 leading-relaxed">{desc}</p>
                            <span className="font-mono text-[11px] text-slate-400 shrink-0 tabular-nums">
                              {desc.length} chars
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Internal Links */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <LinkIcon size={16} className="text-slate-500" /> Internal Linking Recommendations
                      </h4>
                      <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                        {analysis.internalLinks.map((link, i) => (
                          <div key={i} className="p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <p className="text-xs font-semibold text-slate-900">
                                Anchor: &ldquo;{link.anchorText}&rdquo;
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">Target page: {link.targetTopic}</p>
                            </div>
                            <p className="text-xs text-slate-500 max-w-xs">{link.relevance}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Structured Data JSON-LD */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <Code2 size={16} className="text-slate-500" /> Schema.org JSON-LD Markup
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {analysis.structuredDataSuggestions.map((item, i) => (
                          <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900">{item.type}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(item.code);
                                  setCopiedSchemaIdx(i);
                                  setTimeout(() => setCopiedSchemaIdx(null), 1800);
                                }}
                                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                              >
                                {copiedSchemaIdx === i ? 'Copied JSON-LD' : 'Copy JSON-LD'}
                              </button>
                            </div>
                            <p className="text-xs text-slate-600">{item.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Interactive Checklist */}
                    <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-slate-900">Pre-Publish Checklist</h4>
                        <span className="font-mono text-xs text-slate-600 tabular-nums">
                          {checkedItems.size}/{analysis.checklist.length} completed
                        </span>
                      </div>
                      <div className="space-y-2">
                        {analysis.checklist.map((item, i) => {
                          const checked = checkedItems.has(i);
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => toggleCheck(i)}
                              className="w-full text-left flex items-start gap-3 p-3 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-xs cursor-pointer"
                            >
                              <span
                                className={`w-4 h-4 rounded border flex items-center justify-center mt-0.5 shrink-0 ${
                                  checked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'
                                }`}
                              >
                                {checked && <Check size={11} strokeWidth={3} />}
                              </span>
                              <span className={checked ? 'line-through text-slate-400' : 'text-slate-700'}>
                                {item}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Publish & CMS Export */}
            {activeTab === 'publish' && (
              <div className="space-y-6">
                {!content ? (
                  <div className="py-16 text-center text-sm text-slate-500">
                    Generate an article draft first to export or dispatch it to your CMS.
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="p-5 rounded-xl border border-slate-200 space-y-4">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">Direct CMS Dispatch</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Send this formatted post to a WordPress, Shopify, Webflow, or custom webhook endpoint, or download CMS-ready packages below.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">CMS Target</label>
                          <select
                            value={targetCms}
                            onChange={(e) => setTargetCms(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:border-emerald-600 outline-none"
                          >
                            {CMS_TARGETS.filter((c) => c !== 'None').map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Webhook URL (Optional)
                          </label>
                          <input
                            type="url"
                            value={webhookUrl}
                            onChange={(e) => setWebhookUrl(e.target.value)}
                            placeholder="https://yoursite.com/api/cms-webhook"
                            className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:border-emerald-600 outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={handlePublish}
                          disabled={isPublishing}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-2 cursor-pointer"
                        >
                          {isPublishing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                          {isPublishing ? 'Dispatching...' : `Publish to ${targetCms}`}
                        </button>

                        <button
                          type="button"
                          onClick={handleDownloadHtml}
                          className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                        >
                          <Download size={14} /> Download HTML
                        </button>

                        <button
                          type="button"
                          onClick={handleDownloadJsonPayload}
                          className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                        >
                          <Code2 size={14} /> Download {targetCms} JSON
                        </button>
                      </div>

                      {publishError && (
                        <p className="text-xs text-red-600 font-medium">{publishError}</p>
                      )}

                      {publishResult && (
                        <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50/60 space-y-2">
                          <p className="text-xs font-semibold text-emerald-900">{publishResult.message}</p>
                          <pre className="text-[11px] font-mono text-slate-700 bg-white p-3 rounded border border-slate-200 overflow-x-auto max-h-48">
                            {JSON.stringify(publishResult.payload, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentGenerator;