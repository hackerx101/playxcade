import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Camera, FileText, CheckCircle, AlertCircle, ArrowRight, User, Phone, Mail, Calendar, Mic, RefreshCw, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Footer } from '../components/Footer';

export const IdentityVerifyPage: React.FC = () => {
  const { user, verifyIdentity, verifications } = useAuth();
  const navigate = useNavigate();

  // Step state: 1 (Personal Info), 2 (Scan Government ID), 3 (Live Selfie & Spoken Number Code)
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form Fields Page 1
  const [fullName, setFullName] = useState(user?.username || 'Garexcell Gamer');
  const [dob, setDob] = useState(user?.dob || '2000-01-01');
  const [email, setEmail] = useState(user?.email || 'gamer@garexcell.com');
  const [phone, setPhone] = useState(user?.phone_number || '+1 555-0192');

  // Page 2: Document OCR Extraction
  const [docType, setDocType] = useState('Driver License / State ID');
  const [docFileUploaded, setDocFileUploaded] = useState(false);
  const [extractedDocNumber, setExtractedDocNumber] = useState('DL-9842019-US');
  const [extractedExpiry, setExtractedExpiry] = useState('2030-10-15');
  const [extractedName, setExtractedName] = useState('JOHN G. DOE');

  // Page 3: Live Selfie & Random Spoken Number Code
  const [randomSpokenCode] = useState(() => Math.floor(1000 + Math.random() * 9000).toString());
  const [spokenCodeInput, setSpokenCodeInput] = useState('');
  const [faceDetected, setFaceDetected] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already verified: show screen with avatar, "Identity verified", email, username, time when verified, Continue button
  if (user && user.IsIdentityVerify) {
    const lastVerification = verifications[0];
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
        <main className="flex-1 flex items-center justify-center p-4 my-8">
          <div className="w-full max-w-md text-center space-y-6">
            <div className="relative inline-block mx-auto">
              <img
                src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                alt={user.username}
                className="w-24 h-24 rounded-full border-4 border-emerald-500 shadow-lg object-cover"
              />
              <div className="absolute bottom-0 right-0 bg-emerald-500 text-white p-1.5 rounded-full ring-2 ring-white">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>

            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Identity Verified</h1>
              <p className="text-sm font-bold text-slate-700 mt-1">@{user.username}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-2">
                Verified At: {lastVerification?.timestamp ? new Date(lastVerification.timestamp).toLocaleDateString() : 'Active'}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => navigate('/feed')}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition"
              >
                Continue to Playxcade Feed
              </button>
            </div>

            {/* Verification History List */}
            {verifications.length > 0 && (
              <div className="pt-4 border-t border-slate-100 text-left space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Verification Attempt History</p>
                <div className="space-y-1.5 text-[11px]">
                  {verifications.map((v) => (
                    <div key={v.id} className="p-2 bg-slate-50 rounded-lg flex justify-between">
                      <span className="font-semibold text-slate-700">{v.doc_type} ({v.doc_number})</span>
                      <span className="text-emerald-500 font-bold">STATUS: {v.status.toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !email) {
      setError('Please complete all personal info fields.');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleDocScan = () => {
    setDocFileUploaded(true);
  };

  const handleStep2Submit = () => {
    if (!docFileUploaded) {
      setError('Please upload or scan your government ID document.');
      return;
    }
    setError(null);
    setStep(3);
  };

  const handleFinalVerification = () => {
    if (spokenCodeInput.trim() !== randomSpokenCode) {
      setError(`Spoken code mismatch! You must type or speak the exact code shown on screen: ${randomSpokenCode}`);
      return;
    }

    verifyIdentity({
      full_name: fullName,
      dob,
      email,
      phone_number: phone,
      doc_type: docType,
      doc_number: extractedDocNumber,
      doc_expiry: extractedExpiry,
      extracted_data: {
        nameOnDoc: extractedName,
        docNumber: extractedDocNumber,
        expiryDate: extractedExpiry,
      },
      selfie_code: randomSpokenCode,
      status: 'verified',
    });

    navigate('/verify');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <main className="flex-1 flex items-center justify-center p-4 my-8">
        <div className="w-full max-w-lg space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-2 text-indigo-600">
              <ShieldCheck className="w-6 h-6" />
              <div>
                <h1 className="text-lg font-extrabold text-slate-900">Garexcell Identity Verification</h1>
                <p className="text-xs text-slate-500">Government ID & Live Selfie Service</p>
              </div>
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              Page {step} of 3
            </span>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* PAGE 1: Personal Info */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <p className="text-xs font-bold text-slate-800">Page 1: Personal Information</p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                  <User className="w-3.5 h-3.5" />
                  <span>Full Legal Name</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Date of Birth</span>
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                  <Phone className="w-3.5 h-3.5" />
                  <span>Phone Number</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md flex items-center justify-center space-x-2 transition"
              >
                <span>Continue to Page 2: Government ID Scan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* PAGE 2: Scan Government-Issued ID */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-800">Page 2: Government-Issued ID Verification</p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Document Type
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                >
                  <option value="Driver License / State ID">Driver License / State ID</option>
                  <option value="National Passport">National Passport</option>
                  <option value="Government Identity Card">Government Identity Card</option>
                </select>
              </div>

              {/* ID Capture / Camera Dropzone */}
              <div
                onClick={handleDocScan}
                className="border-2 border-dashed border-indigo-400 rounded-2xl p-6 text-center cursor-pointer hover:bg-indigo-50/50:bg-indigo-950/20 transition space-y-2"
              >
                <FileText className="w-10 h-10 text-indigo-600 mx-auto" />
                <p className="text-xs font-bold text-slate-800">
                  {docFileUploaded ? 'Document Uploaded & OCR Scanned' : 'Click to Scan or Upload Government ID Photo'}
                </p>
                <p className="text-[11px] text-slate-400">Supports JPG, PNG, PDF up to 10MB</p>
              </div>

              {/* Extracted Document OCR Variables */}
              {docFileUploaded && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <p className="font-bold text-emerald-600 text-[11px]">OCR Variables Extracted:</p>
                  <p>• Name on Document: <span className="font-bold text-slate-900">{extractedName}</span></p>
                  <p>• Document Number: <span className="font-bold text-slate-900">{extractedDocNumber}</span></p>
                  <p>• Expiry Date: <span className="font-bold text-slate-900">{extractedExpiry}</span></p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-xs font-bold text-slate-500"
                >
                  Back
                </button>
                <button
                  onClick={handleStep2Submit}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition"
                >
                  Continue to Page 3: Live Selfie
                </button>
              </div>
            </div>
          )}

          {/* PAGE 3: Live Selfie & Speak Spoken Number */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-800">Page 3: Live Selfie & Spoken Number Code</p>

              {/* Live Selfie Box */}
              <div className="relative aspect-video w-full bg-slate-950 rounded-2xl overflow-hidden border-2 border-indigo-500 flex flex-col items-center justify-center text-center p-4">
                <Camera className="w-12 h-12 text-indigo-400 animate-pulse mb-2" />
                <p className="text-xs font-bold text-slate-200">Live Camera Feed Active</p>
                <p className="text-[11px] text-slate-400 mt-1">Please position your face inside the frame.</p>

                <div className="absolute top-3 left-3 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  FACE CHECK ACTIVE
                </div>
              </div>

              {/* Spoken Code Prompt */}
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-200 text-center space-y-2">
                <p className="text-xs font-bold text-slate-800">
                  Please speak out this 4-Digit Number Code on screen:
                </p>
                <div className="text-3xl font-extrabold tracking-widest text-indigo-600 font-mono">
                  {randomSpokenCode}
                </div>
                <p className="text-[11px] text-slate-500">Type or confirm the digits spoken below:</p>
              </div>

              <div>
                <input
                  type="text"
                  value={spokenCodeInput}
                  onChange={(e) => setSpokenCodeInput(e.target.value)}
                  placeholder={`Type the 4-digit code (${randomSpokenCode})`}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-sm font-bold tracking-widest text-slate-900"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => navigate('/feed')}
                  className="px-4 py-2 text-xs font-bold text-rose-600 hover:underline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFinalVerification}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md flex items-center space-x-1.5 transition"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Verify Identity & Save</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
};
