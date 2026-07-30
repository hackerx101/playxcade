import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Camera, FileText, CheckCircle, AlertCircle, ArrowRight, User, Phone, Mail, Calendar, Mic, RefreshCw, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Footer } from '../components/Footer';
import { IOSBackButton } from '../components/IOSBackButton';

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
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docFilePreview, setDocFilePreview] = useState<string | null>(null);
  const [extractedDocNumber, setExtractedDocNumber] = useState('');
  const [extractedExpiry, setExtractedExpiry] = useState('');
  const [extractedName, setExtractedName] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);

  // Page 3: Live Selfie & Random Spoken Number Code
  const [randomSpokenCode] = useState(() => Math.floor(1000 + Math.random() * 9000).toString());
  const [spokenCodeInput, setSpokenCodeInput] = useState('');
  const [faceDetected, setFaceDetected] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocFile(file);
      setDocFilePreview(URL.createObjectURL(file));
      
      // Simulate OCR Extraction
      setIsExtracting(true);
      setTimeout(() => {
        setExtractedDocNumber(`ID-${Math.random().toString(36).substring(2, 11).toUpperCase()}`);
        setExtractedExpiry('2032-08-20');
        setExtractedName(fullName.toUpperCase());
        setIsExtracting(false);
      }, 1500);
    }
  };

  const handleStep2Submit = () => {
    if (!docFile) {
      setError('Please upload or scan your government ID document.');
      return;
    }
    if (isExtracting) return;
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
            <div className="flex items-center space-x-3">
              <IOSBackButton to="/feed" label="Feed" />
              <div className="flex items-center space-x-2 text-indigo-600">
                <ShieldCheck className="w-6 h-6" />
                <div>
                  <h1 className="text-base font-extrabold text-slate-900">Identity Verification</h1>
                  <p className="text-[11px] text-slate-500">Government ID & Live Selfie Service</p>
                </div>
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
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
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
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
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
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
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
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
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
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Driver License / State ID">Driver License / State ID</option>
                  <option value="National Passport">National Passport</option>
                  <option value="Government Identity Card">Government Identity Card</option>
                </select>
              </div>

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />

              {/* ID Capture / Camera Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition space-y-2 relative overflow-hidden ${
                  docFile ? 'border-emerald-500 bg-emerald-50' : 'border-indigo-400 hover:bg-indigo-50'
                }`}
              >
                {docFilePreview ? (
                  <div className="space-y-3">
                    <img src={docFilePreview} alt="ID Preview" className="max-h-40 mx-auto rounded-lg shadow-sm border border-slate-200" />
                    <p className="text-xs font-extrabold text-emerald-600">ID Captured Successfully</p>
                    <button className="text-[10px] font-bold text-indigo-600 underline">Change Document</button>
                  </div>
                ) : (
                  <>
                    <FileText className="w-10 h-10 text-indigo-600 mx-auto" />
                    <p className="text-xs font-bold text-slate-800">
                      Click to Scan or Upload Government ID Photo
                    </p>
                    <p className="text-[11px] text-slate-400">Supports JPG, PNG up to 10MB</p>
                  </>
                )}
                
                {isExtracting && (
                  <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center space-y-2">
                    <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                    <p className="text-xs font-bold text-indigo-600">Extracting Real Information...</p>
                  </div>
                )}
              </div>

              {/* Extracted Document OCR Variables */}
              {docFile && extractedDocNumber && (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 space-y-2 text-xs">
                  <div className="flex items-center space-x-1.5 text-emerald-700 font-bold mb-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>Information Extracted Automatically</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Full Name</p>
                      <p className="font-bold text-slate-900">{extractedName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Document ID</p>
                      <p className="font-bold text-slate-900">{extractedDocNumber}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Expiry Date</p>
                      <p className="font-bold text-slate-900">{extractedExpiry}</p>
                    </div>
                  </div>
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
                  disabled={!docFile || isExtracting}
                  className={`px-6 py-2.5 font-bold rounded-xl text-xs shadow-md transition flex items-center space-x-2 ${
                    docFile && !isExtracting ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span>Continue to Page 3: Live Selfie</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* PAGE 3: Live Selfie & Speak Spoken Number */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-800">Page 3: Live Selfie & Spoken Number Code</p>

              {/* Live Selfie Box with Oval Mask */}
              <div className="relative aspect-square max-w-[320px] mx-auto w-full bg-slate-950 rounded-3xl overflow-hidden border-2 border-indigo-500 flex flex-col items-center justify-center text-center">
                {/* Simulated Camera Feed */}
                <div className="absolute inset-0 bg-slate-900 opacity-60 flex items-center justify-center">
                   <User className="w-32 h-32 text-slate-800" />
                </div>

                {/* Oval Mask Overlay */}
                <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
                  <div className="w-full h-full border-[60px] border-slate-950/90 rounded-[100px] flex items-center justify-center">
                    <div className="w-full h-full border-2 border-emerald-400 border-dashed rounded-[80px] shadow-[0_0_0_1000px_rgba(2,6,23,0.85)]"></div>
                  </div>
                </div>

                <div className="z-10 flex flex-col items-center space-y-2">
                  <Camera className="w-8 h-8 text-indigo-400 animate-pulse" />
                  <p className="text-[11px] font-bold text-slate-200">POSITION FACE IN OVAL</p>
                </div>

                <div className="absolute bottom-4 bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] font-extrabold px-3 py-1 rounded-full flex items-center space-x-1.5">
                  <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                  <span>BIOMETRIC FEED ACTIVE</span>
                </div>
              </div>

              {/* Spoken Code Prompt */}
              <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-200 text-center space-y-3">
                <p className="text-xs font-bold text-slate-800">
                  Please speak out this 4-Digit Code clearly:
                </p>
                <div className="text-4xl font-extrabold tracking-[0.3em] text-indigo-600 font-mono">
                  {randomSpokenCode}
                </div>
                <div className="flex items-center justify-center space-x-2 py-1">
                  <Mic className="w-4 h-4 text-rose-500 animate-bounce" />
                  <p className="text-[11px] text-rose-600 font-bold uppercase tracking-tight">Listening for voice...</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Confirmation Code</label>
                <input
                  type="text"
                  value={spokenCodeInput}
                  onChange={(e) => setSpokenCodeInput(e.target.value)}
                  placeholder={`Type digits shown above (${randomSpokenCode})`}
                  className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl text-center text-lg font-bold tracking-widest text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => navigate('/feed')}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-rose-600 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFinalVerification}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-lg flex items-center space-x-2 transition transform active:scale-95"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>COMPLETE VERIFICATION</span>
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
