import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IOSBackButton } from '../components/IOSBackButton';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';

export const ReportPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');

  const handleReport = () => {
    // Save report to database (firestore)
    // For now, simple alert as in chat context
    alert('Report submitted.');
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20 font-sans">
      <Navbar showLiveIcon={false} />
      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        <div className="flex items-center space-x-2">
            <IOSBackButton onClick={() => navigate(-1)} label="Back" />
            <h1 className="font-bold text-lg">Report Post</h1>
        </div>
        <div className='p-4 bg-slate-50 rounded-2xl'>
            <p className='text-xs font-bold mb-2'>Why are you reporting this post?</p>
            <select value={reason} onChange={e => setReason(e.target.value)} className='w-full p-3 rounded-xl border border-slate-200 text-sm'>
                <option value=''>Select a reason</option>
                <option value='spam'>Spam</option>
                <option value='inappropriate'>Inappropriate content</option>
                <option value='harassment'>Harassment</option>
            </select>
            <textarea value={details} onChange={e => setDetails(e.target.value)} className='w-full p-3 mt-4 rounded-xl border border-slate-200 text-sm' placeholder='Additional details'></textarea>
            <button onClick={handleReport} className='w-full mt-4 py-3 bg-rose-600 text-white font-bold rounded-xl'>Submit Report</button>
        </div>
      </main>
    </div>
  );
};
