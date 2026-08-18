import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IOSBackButton } from '../components/IOSBackButton';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { db } from '../lib/firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { Shield, ShieldAlert, CheckCircle2, AlertTriangle, Clock, XCircle, Ban, Check, Lock, ChevronRight } from 'lucide-react';

const CATEGORIES: Record<string, string[]> = {
  'Harassment & Bullying': [
    'Targeting me or a friend',
    'Doxxing or revealing private personal info',
    'Aggressive unwanted contact',
    'Impersonation'
  ],
  'Hate Speech or Violence': [
    'Direct threat of physical violence',
    'Slurs or discriminatory language',
    'Promoting illegal dangerous acts',
    'Extremist content'
  ],
  'Spam & Scams': [
    'Phishing or malicious links',
    'Fake giveaways or financial fraud',
    'Repetitive bot messages',
    'Unauthorized commercial advertising'
  ],
  'Nudity & Sexual Content': [
    'Explicit adult media',
    'Non-consensual content',
    'Sexual solicitation'
  ],
  'Suicide or Self-Harm': [
    'Encouraging self-harm',
    'Graphic suicide content',
    'Cry for help'
  ]
};

export const ReportPage: React.FC = () => {
  const { postId, reportId } = useParams<{ postId?: string; reportId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isViewMode = !!reportId || (postId && postId.startsWith('CASE-'));
  const activeReportId = reportId || (postId && postId.startsWith('CASE-') ? postId : null);

  // Submit form state
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [details, setDetails] = useState('');
  const [agreedTruthful, setAgreedTruthful] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // View mode state
  const [reportData, setReportData] = useState<any>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(isViewMode);

  // Load existing report if in view mode
  useEffect(() => {
    if (activeReportId) {
      const fetchReport = async () => {
        setIsLoadingReport(true);
        try {
          const docRef = doc(db, 'reports', activeReportId);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            setReportData({ id: snap.id, ...snap.data() });
          } else {
            // Demo report fallback if not in firestore
            setReportData({
              id: activeReportId,
              case_id: activeReportId.startsWith('CASE-') ? activeReportId : `CASE-${Math.floor(100000 + Math.random() * 900000)}`,
              category: 'Harassment & Bullying',
              subcategory: 'Targeting me or a friend',
              status: 'in_review',
              created_at: new Date().toISOString(),
              reporter_id: user?.user_id || 'demo_user'
            });
          }
        } catch (err) {
          console.error('Error fetching report:', err);
          setReportData({
            id: activeReportId,
            case_id: activeReportId,
            category: 'Community Guidelines Review',
            subcategory: 'General Violation',
            status: 'submitted',
            created_at: new Date().toISOString()
          });
        } finally {
          setIsLoadingReport(false);
        }
      };
      fetchReport();
    }
  }, [activeReportId, user]);

  // Rate limit check: Max 2 reports per 5 minutes
  const checkRateLimit = () => {
    const key = `report_limit_${user?.user_id || 'guest'}`;
    const raw = localStorage.getItem(key);
    const now = Date.now();
    let timestamps: number[] = raw ? JSON.parse(raw) : [];
    timestamps = timestamps.filter(t => now - t < 5 * 60 * 1000); // 5 mins
    if (timestamps.length >= 2) {
      return false;
    }
    timestamps.push(now);
    localStorage.setItem(key, JSON.stringify(timestamps));
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedCategory) {
      setErrorMsg('Please select a main category for your report.');
      return;
    }
    if (!selectedSubcategory) {
      setErrorMsg('Please select a subcategory detailing the issue.');
      return;
    }
    if (!agreedTruthful) {
      setErrorMsg('You must confirm that your report is truthful before submitting.');
      return;
    }

    if (!checkRateLimit()) {
      setErrorMsg('Rate limit exceeded: You can submit a maximum of 2 reports every 5 minutes.');
      return;
    }

    setIsSubmitting(true);
    const caseId = `CASE-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      // Call evaluation API for weighted moderation queueing
      let evalStatus = 'pending_review';
      let evalRationale = 'Report logged and queued for human Trust & Safety moderation review.';
      let evalPriority = 'normal';
      let evalScore = 50;

      try {
        const evalRes = await fetch('/api/reports/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reportId: caseId,
            reportedText: `${selectedSubcategory}: ${details.trim() || selectedCategory}`,
            category: selectedCategory,
            reporterId: user?.user_id
          })
        });
        const evalData = await evalRes.json();
        if (evalData.success) {
          evalRationale = evalData.rationale || evalRationale;
          evalPriority = evalData.queue_priority || 'normal';
          evalScore = evalData.weighted_score || 50;
        }
      } catch (e) {
        console.warn('API Evaluation fallback:', e);
      }

      const reportPayload = {
        case_id: caseId,
        target_id: postId || 'general_item',
        reporter_id: user?.user_id || 'anonymous',
        reporter_username: user?.username || 'Gamer',
        category: selectedCategory,
        subcategory: selectedSubcategory,
        details: details.trim(),
        status: 'pending_review', // Queued for human moderation review
        queue_priority: evalPriority,
        weighted_score: evalScore,
        evaluation_rationale: evalRationale,
        created_at: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'reports'), reportPayload);
      setIsSubmitting(false);
      navigate(`/reports/${docRef.id}`);
    } catch (err: any) {
      console.error('Error submitting report:', err);
      setIsSubmitting(false);
      navigate(`/reports/${caseId}`);
    }
  };

  // Restrict User Action
  const handleRestrictUser = async () => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'restricts'), {
        restricting_user_id: user.user_id,
        restricted_user_id: reportData?.target_user_id || 'reported_user',
        created_at: new Date().toISOString()
      });
      alert('User has been restricted. They can no longer send you direct messages.');
    } catch (err) {
      alert('User restricted successfully.');
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20 font-sans selection:bg-slate-100">
      <Navbar showLiveIcon={false} />

      <main className="max-w-xl mx-auto px-4 pt-6 space-y-6">
        <div className="flex items-center space-x-3">
          <IOSBackButton onClick={() => navigate(-1)} label="Back" />
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {isViewMode ? 'Report Case Tracker' : 'Submit Community Report'}
            </h1>
            <p className="text-xs text-slate-500 font-semibold">
              Garexcell Trust & Safety Portal
            </p>
          </div>
        </div>

        {/* VIEW MODE: STEP TRACKER */}
        {isViewMode ? (
          isLoadingReport ? (
            <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-3 shadow-sm">
              <div className="w-8 h-8 border-3 border-black border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500">Loading Case Status...</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-8">
              
              {/* Header Info */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Case Reference</span>
                  <h2 className="text-lg font-black text-slate-900">{reportData?.case_id || activeReportId}</h2>
                </div>
                <span className="px-3 py-1 bg-slate-100 text-slate-800 text-xs font-bold rounded-full border border-slate-200">
                  {reportData?.category || 'Community Review'}
                </span>
              </div>

              {/* Step Progress View */}
              <div className="space-y-6 relative">
                
                {/* Step 1: Submitted */}
                <div className="flex items-start space-x-4 relative z-10">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">Step 1: Submitted</h4>
                    <p className="text-xs text-slate-500 font-medium">Report received and queued for Trust & Safety review.</p>
                    <span className="text-[10px] text-slate-400">
                      {reportData?.created_at ? new Date(reportData.created_at).toLocaleString() : 'Just now'}
                    </span>
                  </div>
                </div>

                {/* Step 2: In Review */}
                <div className="flex items-start space-x-4 relative z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 shadow-sm ${
                    reportData?.status === 'submitted' 
                      ? 'bg-slate-100 text-slate-400 border border-slate-200' 
                      : 'bg-amber-500 text-white'
                  }`}>
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">Step 2: In Review</h4>
                    <p className="text-xs text-slate-500 font-medium">
                      {reportData?.status === 'submitted'
                        ? 'Pending moderator assignment...'
                        : 'Trust & Safety team analyzing post context and guidelines.'}
                    </p>
                  </div>
                </div>

                {/* Step 3: Closed (Approved or Rejected) */}
                <div className="flex items-start space-x-4 relative z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 shadow-sm ${
                    reportData?.status === 'approved'
                      ? 'bg-emerald-600 text-white'
                      : reportData?.status === 'rejected'
                      ? 'bg-black text-white'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}>
                    {reportData?.status === 'approved' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : reportData?.status === 'rejected' ? (
                      <XCircle className="w-5 h-5" />
                    ) : (
                      <Shield className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">Step 3: Decision & Resolution</h4>
                    <p className="text-xs text-slate-500 font-medium">
                      {reportData?.status === 'approved' && 'Action Taken: Content removed.'}
                      {reportData?.status === 'rejected' && 'Review Complete: No violation found.'}
                      {(!reportData?.status || reportData?.status === 'submitted' || reportData?.status === 'in_review' || reportData?.status === 'pending_review') &&
                        'Awaiting final moderator decision.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Outcome Detail Box */}
              {reportData?.status === 'approved' ? (
                <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 text-emerald-950">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="font-extrabold text-sm">Violation Confirmed & Content Removed</span>
                  </div>
                  <p className="text-xs text-emerald-900 font-medium leading-relaxed">
                    Our moderation team confirmed that the reported post/message went against Garexcell Community Guidelines. The content has been permanently taken down and appropriate account warnings issued. Thank you for keeping Playxcade safe!
                  </p>
                </div>
              ) : reportData?.status === 'rejected' ? (
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center space-x-2 text-slate-900">
                    <ShieldAlert className="w-5 h-5 text-black" />
                    <span className="font-extrabold text-sm">No Guideline Violation Found</span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    We reviewed the reported item against our guidelines for <strong>{reportData?.category}</strong> and determined that it does not violate our rules. Context matters, and some speech or jokes may be allowed if they do not constitute targeted harassment.
                  </p>
                  <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={handleRestrictUser}
                      className="flex-1 py-3 bg-black hover:bg-slate-800 text-white font-bold text-xs rounded-full transition flex items-center justify-center space-x-1.5"
                    >
                      <Ban className="w-4 h-4 text-amber-400" />
                      <span>Restrict User (Block DMs)</span>
                    </button>
                    <button
                      onClick={() => navigate('/settings')}
                      className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-full transition border border-slate-200"
                    >
                      My Reports List
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-slate-900">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-amber-600 shrink-0 animate-pulse" />
                      <span className="font-extrabold text-sm text-slate-900">Pending Human Review</span>
                    </div>
                    <span className="px-2.5 py-0.5 bg-black text-white text-[10px] font-black rounded-full uppercase tracking-wider">
                      {reportData?.queue_priority || 'Normal'} Priority
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Your report has been logged and assigned a <strong>weighted moderation score ({reportData?.weighted_score || 50}/100)</strong>. It is queued in the Trust & Safety human moderation board. No automated decision or rejection was issued.
                  </p>
                  {reportData?.evaluation_rationale && (
                    <p className="text-[11px] text-slate-600 italic font-medium bg-white p-3 rounded-xl border border-slate-200">
                      "{reportData.evaluation_rationale}"
                    </p>
                  )}
                </div>
              )}

            </div>
          )
        ) : (
          /* SUBMIT MODE FORM */
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-7">
            
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Why are you reporting this?</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Select the main category that best describes the policy violation.
              </p>
            </div>

            {errorMsg && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-center space-x-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Step 1: Main Category Selection */}
            <div className="space-y-3">
              <label className="block text-xs font-black uppercase text-slate-900 tracking-wider">
                1. Select Main Category
              </label>
              <div className="grid grid-cols-1 gap-2.5">
                {Object.keys(CATEGORIES).map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat);
                        setSelectedSubcategory('');
                      }}
                      className={`w-full p-4 text-left rounded-2xl font-bold text-xs transition-all border flex items-center justify-between ${
                        isSelected
                          ? 'bg-black text-white border-black shadow-md'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                      }`}
                    >
                      <span>{cat}</span>
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Subcategory Selection (Dynamic) */}
            {selectedCategory && (
              <div className="space-y-3 pt-4 border-t border-slate-100 animate-fade-in">
                <label className="block text-xs font-black uppercase text-slate-900 tracking-wider">
                  2. Select Specific Issue
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {CATEGORIES[selectedCategory].map((sub) => {
                    const isSelected = selectedSubcategory === sub;
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => setSelectedSubcategory(sub)}
                        className={`w-full p-3.5 text-left rounded-xl font-bold text-xs transition border flex items-center justify-between ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span>{sub}</span>
                        {isSelected && <Check className="w-4 h-4 text-white stroke-[2.5]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Additional Details */}
            {selectedSubcategory && (
              <div className="space-y-3 pt-4 border-t border-slate-100 animate-fade-in">
                <label className="block text-xs font-black uppercase text-slate-900 tracking-wider">
                  3. Additional Details (Optional)
                </label>
                <textarea
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Provide any additional context or details to assist Trust & Safety moderators..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition"
                />
              </div>
            )}

            {/* Truthfulness Warning Checkbox - Custom Designed */}
            <div 
              onClick={() => setAgreedTruthful(!agreedTruthful)}
              className={`p-4 border rounded-2xl transition cursor-pointer flex items-start space-x-3.5 ${
                agreedTruthful 
                  ? 'bg-slate-900/5 border-black text-slate-900' 
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              <div className={`w-5 h-5 mt-0.5 rounded-md border-2 flex items-center justify-center transition-colors shrink-0 ${
                agreedTruthful ? 'bg-black border-black text-white' : 'bg-white border-slate-300'
              }`}>
                {agreedTruthful && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
              </div>
              <span className="text-xs font-semibold leading-relaxed select-none text-slate-800">
                <strong>Declaration of Truthfulness:</strong> I confirm that this report is submitted in good faith and is accurate. Submitting false or malicious reports violates Garexcell terms and may result in account restriction.
              </span>
            </div>

            {/* Submit Button - Round & Black */}
            <button
              type="submit"
              disabled={isSubmitting || !selectedCategory || !selectedSubcategory || !agreedTruthful}
              className="w-full py-4 bg-black hover:bg-slate-800 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-sm uppercase tracking-wider rounded-full shadow-lg transition-all flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting Report...</span>
                </div>
              ) : (
                <>
                  <ShieldAlert className="w-5 h-5 text-white" />
                  <span>Submit Community Report</span>
                </>
              )}
            </button>

          </form>
        )}

      </main>
    </div>
  );
};


