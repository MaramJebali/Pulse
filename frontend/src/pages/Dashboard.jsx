// src/pages/Dashboard.jsx
import React, { useState } from 'react';
import Badge from '../components/ui/Badge';
import Btn from '../components/ui/Btn';
import MassiveText from '../components/ui/MassiveText';
import { ArrowLeft } from '../components/ui/Icons';

function aggregateAnalysis(results) {
  if (!results || results.length === 0) return null;
  let totalComments = 0;
  let totalPositive = 0;
  let totalEmoji = 0;
  let totalQuestions = 0;
  let totalGaps = 0;
  let allSignals = [];
  let allStories = [];
  let allTrends = [];
  let allFreq = [];

  for (const r of results) {
    const ca = r.comment_analysis || {};
    totalComments += ca.total_comments || 0;
    const pos = ca.sentiment_totals?.positive || 0;
    totalPositive += pos;
    totalEmoji += ca.category_totals?.hype_emoji || 0;
    totalQuestions += ca.category_totals?.question || 0;
    totalGaps += ca.category_totals?.needs_support || 0;
    if (ca.flagged_signals) allSignals.push(...ca.flagged_signals);
    const ai = ca.ai_summary || {};
    if (ai.story) allStories.push(ai.story);
    if (ai.trends) allTrends.push(...ai.trends);
    if (ai.frequent_topics) allFreq.push(...ai.frequent_topics);
  }
  const avgPositive = totalComments ? Math.round((totalPositive / totalComments) * 100) : 0;
  return {
    avgPositive,
    totalComments,
    categoryBreakdown: { emoji: totalEmoji, questions: totalQuestions, gaps: totalGaps },
    flaggedSignals: allSignals.slice(0, 5),
    topStory: allStories[0] || "No story yet. Run an analysis.",
    topTrends: [...new Set(allTrends)].slice(0, 3),
    topFrequent: [...new Set(allFreq)].slice(0, 3),
  };
}

export default function Dashboard({ t, setRoute, store, setStore, triggerReveal }) {
  const results = store.analysisResults;
  const [expandedPosts, setExpandedPosts] = useState({});
  const [showAIInsights, setShowAIInsights] = useState(false);

  const togglePost = (shortcode) => {
    setExpandedPosts(prev => ({ ...prev, [shortcode]: !prev[shortcode] }));
  };

  if (!results || results.length === 0) {
    return (
      <div className="relative h-screen overflow-hidden">
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
          <MassiveText opacity={0.02}>NO DATA</MassiveText>
          <div className="text-center max-w-md">
            <p className="text-white/60 mb-6">No analysis data found. Please run an analysis first.</p>
            <Btn onClick={() => triggerReveal(() => setRoute('input'), false)} icon={<ArrowLeft />}>
              Start New Analysis
            </Btn>
          </div>
        </div>
      </div>
    );
  }

  const aggregated = aggregateAnalysis(results);
  const firstInfluencer = results[0];

  return (
    <div className="relative h-screen overflow-hidden page-in">
      <MassiveText opacity={0.02}>INSIGHTS</MassiveText>
      <div className="absolute inset-0 z-10 px-6 md:px-10 py-8 md:py-12 overflow-y-auto">
        <div className="max-w-[1500px] mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <Badge>{t('dash.kicker') || 'PULSE INSIGHTS'}</Badge>
              <h1 className="font-display leading-[0.82] tracking-tight mt-3">
                <div className="text-5xl md:text-7xl title-solid-white">WHAT THEY</div>
                <div className="text-5xl md:text-7xl title-solid-red -mt-1">REALLY SAY</div>
              </h1>
              <p className="mt-4 max-w-xl text-sm md:text-base text-white/50">
                Sentiment, gaps, and the exact actions to take.
              </p>
            </div>
            <div className="flex gap-2">
              <Btn variant="ghost" size="md" onClick={() => triggerReveal(() => setRoute('input'), false)}>
                {t('dash.again') || 'New analysis'}
              </Btn>
              <Btn variant="primary" size="md" onClick={() => alert('PDF export coming soon')}>
                {t('dash.export') || 'Export PDF'}
              </Btn>
            </div>
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column – posts and comments */}
            <div className="lg:col-span-2 space-y-6">
              {results.map((influencerData, idx) => {
                const totalComments = influencerData.brand_mention_timeline?.reduce(
                  (sum, post) => sum + (post.comments?.length || 0), 0
                ) || 0;
                const totalLikes = influencerData.brand_mention_timeline?.reduce(
                  (sum, post) => sum + (post.likes || 0), 0
                ) || 0;

                return (
                  <div key={idx} className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5 md:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-white/10">
                      <div>
                        <h2 className="font-display text-2xl md:text-3xl tracking-tight">
                          @{influencerData.profile}
                        </h2>
                        <p className="text-sm text-white/50">
                          {influencerData.posts_scanned} posts scanned • {influencerData.relevant_posts_found} relevant mentions
                        </p>
                      </div>
                      <div className="flex gap-4 font-mono text-[10px] tracking-[0.1em]">
                        <div className="text-center">
                          <div className="text-brand text-lg">{totalLikes.toLocaleString()}</div>
                          <div className="text-white/40 uppercase">likes</div>
                        </div>
                        <div className="text-center">
                          <div className="text-brand text-lg">{totalComments}</div>
                          <div className="text-white/40 uppercase">comments</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {influencerData.brand_mention_timeline?.map((post) => {
                        const isExpanded = expandedPosts[post.shortcode];
                        const commentCount = post.comments?.length || 0;
                        const classification = post.llm_classification;
                        const sentimentColor = classification?.relevant ? 'text-green-400' : 'text-yellow-400';

                        return (
                          <div key={post.shortcode} className="rounded-xl border border-white/10 bg-black/20 p-4">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <a
                                  href={post.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-mono text-xs text-brand hover:underline break-all"
                                >
                                  {post.shortcode}
                                </a>
                                <p className="text-white/80 text-sm mt-1 line-clamp-2">
                                  {post.caption || '(no caption)'}
                                </p>
                                <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-white/40">
                                  <span>{new Date(post.timestamp).toLocaleString()}</span>
                                  <span>❤️ {post.likes || 0}</span>
                                  <span>💬 {commentCount}</span>
                                  <span className={sentimentColor}>
                                    {classification?.relevant ? '✅ Relevant' : '⚠️ Low relevance'}
                                  </span>
                                </div>
                              </div>
                              {commentCount > 0 && (
                                <button
                                  onClick={() => togglePost(post.shortcode)}
                                  className="text-[10px] font-mono uppercase tracking-wide px-3 py-1 rounded-full border border-white/20 hover:bg-white/10 transition"
                                >
                                  {isExpanded ? 'Hide comments' : `Show ${commentCount} comments`}
                                </button>
                              )}
                            </div>

                            {isExpanded && post.comments && post.comments.length > 0 && (
                              <div className="mt-4 pl-3 border-l-2 border-brand/30 space-y-2 max-h-64 overflow-y-auto">
                                {post.comments.map((comment, cIdx) => (
                                  <div key={cIdx} className="text-xs bg-white/5 rounded-lg p-2">
                                    <span className="font-mono text-brand">@{comment.owner}</span>
                                    <p className="text-white/70 mt-0.5">{comment.text}</p>
                                    <div className="flex gap-2 mt-1 text-[9px] text-white/30">
                                      <span>{new Date(comment.timestamp).toLocaleString()}</span>
                                      <span>❤️ {comment.likes || 0}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right column – analysis cards + AI Insights button */}
            <div className="space-y-6">
              {/* Quick stats */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5">
                <div className="font-mono text-[10px] tracking-[0.28em] uppercase text-white/40 mb-2">OVERALL SENTIMENT</div>
                <div className="text-6xl font-display text-brand">{aggregated?.avgPositive || 0}%</div>
                <div className="text-white/40 text-sm mt-1">Positive engagement</div>
                <div className="mt-4 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${aggregated?.avgPositive || 0}%` }} />
                </div>
                <div className="grid grid-cols-2 gap-3 mt-5 text-center">
                  <div className="rounded-lg bg-white/5 p-2">
                    <div className="font-display text-xl">{aggregated?.categoryBreakdown?.emoji || 0}</div>
                    <div className="font-mono text-[9px] tracking-[0.2em] text-white/40">EMOJI ONLY</div>
                  </div>
                  <div className="rounded-lg bg-white/5 p-2">
                    <div className="font-display text-xl">{aggregated?.categoryBreakdown?.questions || 0}</div>
                    <div className="font-mono text-[9px] tracking-[0.2em] text-white/40">QUESTIONS</div>
                  </div>
                  <div className="rounded-lg bg-white/5 p-2">
                    <div className="font-display text-xl text-brand">{aggregated?.categoryBreakdown?.gaps || 0}</div>
                    <div className="font-mono text-[9px] tracking-[0.2em] text-white/40">NEEDS SUPPORT</div>
                  </div>
                </div>
              </div>

              {/* Flagged signals */}
              {aggregated?.flaggedSignals?.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5">
                  <div className="font-mono text-[10px] tracking-[0.28em] uppercase text-white/40 mb-2">FLAGGED SIGNALS</div>
                  <div className="space-y-2">
                    {aggregated.flaggedSignals.slice(0, 3).map((signal, i) => (
                      <div key={i} className="border-l-2 border-brand/50 pl-3 py-1">
                        <p className="text-xs text-white/80">“{signal.comment?.text || signal.text || signal.reason}”</p>
                        <p className="text-[10px] text-white/40 mt-0.5">{signal.reason || 'Potential gap'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ✨ BLUE BUTTON – See AI Insights */}
              <button
                onClick={() => setShowAIInsights(!showAIInsights)}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 transition text-white font-bold flex items-center justify-center gap-2 shadow-lg"
              >
                {showAIInsights ? 'Hide AI Insights' : '✨ See AI Insights'}
              </button>

              {/* AI Insights panel (conditionally shown) */}
              {showAIInsights && (
                <div className="rounded-2xl border border-blue-500/40 bg-gradient-to-b from-blue-900/20 to-black/40 backdrop-blur-md p-5 shadow-glow animate-fadeIn">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                    <div className="font-mono text-[10px] tracking-[0.28em] uppercase text-blue-300">AI Deep Analysis</div>
                  </div>

                  {/* Storytelling text */}
                  <div className="text-white/90 text-sm leading-relaxed mb-4">
                    {aggregated?.topStory || firstInfluencer?.comment_analysis?.ai_summary?.story || "No story generated yet."}
                  </div>

                  {/* Trends and frequent topics */}
                  <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                    <div className="bg-white/5 rounded-lg p-2">
                      <div className="font-mono text-[9px] text-blue-300 mb-1">📈 TRENDS</div>
                      <ul className="list-disc list-inside text-white/70 space-y-0.5">
                        {(aggregated?.topTrends || []).map((t, i) => <li key={i}>{t}</li>)}
                        {(!aggregated?.topTrends || aggregated.topTrends.length === 0) && <li>No trends detected</li>}
                      </ul>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2">
                      <div className="font-mono text-[9px] text-blue-300 mb-1">🔁 FREQUENT TOPICS</div>
                      <ul className="list-disc list-inside text-white/70 space-y-0.5">
                        {(aggregated?.topFrequent || []).map((f, i) => <li key={i}>{f}</li>)}
                        {(!aggregated?.topFrequent || aggregated.topFrequent.length === 0) && <li>No frequent topics</li>}
                      </ul>
                    </div>
                  </div>

                  {/* Most liked comment highlight */}
                  {firstInfluencer?.comment_analysis?.most_liked_comments?.[0] && (
                    <div className="mt-2 p-2 rounded-lg bg-white/10 border border-white/20">
                      <div className="font-mono text-[9px] text-yellow-300 mb-1">🔥 MOST LIKED COMMENT</div>
                      <p className="text-sm text-white/90 italic">“{firstInfluencer.comment_analysis.most_liked_comments[0].text}”</p>
                      <span className="text-[10px] text-white/40">❤️ {firstInfluencer.comment_analysis.most_liked_comments[0].likes} likes</span>
                    </div>
                  )}

                  {/* Recommendations */}
                  {firstInfluencer?.comment_analysis?.ai_summary?.recommendations?.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-blue-500/30">
                      <div className="font-mono text-[9px] text-blue-300 mb-2">💡 RECOMMENDATIONS</div>
                      <div className="space-y-2">
                        {firstInfluencer.comment_analysis.ai_summary.recommendations.map((rec, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-white/80">
                            <span className="text-blue-400 font-bold">{idx+1}.</span>
                            <span>{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="h-8" />
        </div>
      </div>
    </div>
  );
}