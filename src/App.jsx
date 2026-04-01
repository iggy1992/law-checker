import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  TriangleAlert, 
  CheckCircle2, 
  MessageSquare, 
  Target, 
  Camera, 
  Globe, 
  Bell,
  Loader2,
  Trash2,
  Home
} from 'lucide-react';

const CONTENT_TYPES = [
  { id: 'crm', label: 'CRM/카카오 메시지', icon: MessageSquare },
  { id: 'ad', label: '퍼포먼스 광고', icon: Target },
  { id: 'sns', label: '인스타그램 캡션', icon: Camera },
  { id: 'web', label: '블로그/웹 콘텐츠', icon: Globe },
  { id: 'notice', label: '공지사항', icon: Bell },
];


function App() {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState(null);
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    setIsAnalyzing(true);
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: inputText, type: selectedType })
      });
      
      if (!response.ok) throw new Error('API request failed');
      
      const data = await response.json();
      setResults(data);
      setStep(3);
    } catch (error) {
      console.error('Analysis error:', error);
      alert('분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setStep(1); setSelectedType(null); setInputText(''); setResults(null);
  };

  return (
    <div className="container">
      <header>
        <h1>Law Checker Agent</h1>
        <p>8percent 금융소비자보호법 마케팅 문구 검토 시스템</p>
      </header>

      {step === 1 && (
        <div className="step-card">
          <h2>콘텐츠 유형을 선택해주세요</h2>
          <div className="type-grid">
            {CONTENT_TYPES.map(type => {
              const Icon = type.icon;
              return (
                <button 
                  key={type.id}
                  className={`type-btn ${selectedType === type.id ? 'active' : ''}`}
                  onClick={() => { setSelectedType(type.id); setStep(2); }}
                >
                  <Icon size={24} />
                  <p>{type.label}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="step-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>검토할 문구를 입력해주세요</h2>
            <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>유형 변경</button>
          </div>
          <textarea 
            placeholder="여기에 마케팅 문구를 붙여넣으세요..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button className="analyze-btn" onClick={handleAnalyze} disabled={isAnalyzing || !inputText.trim()}>
            {isAnalyzing ? <><Loader2 className="animate-spin" size={20} /> 검토 중...</> : <><ShieldCheck size={20} /> 무료 검토 시작하기</>}
          </button>
        </div>
      )}

      {step === 3 && results && (
        <div className="step-card glass">
          <div className="results-header">
            <div>
              <h2 style={{ color: 'var(--primary-navy)' }}>검토 결과</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <span className={`risk-badge risk-${results.risk_level}`}>{results.risk_level.toUpperCase()}</span>
                {results.risk_score !== undefined && (
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Risk Score: {results.risk_score}/100</span>
                )}
              </div>
            </div>
            <button onClick={reset} className="type-btn" style={{ padding: '0.5rem 1rem', flexDirection: 'row', gap: '0.5rem' }}><Trash2 size={16} /> 새 검토</button>
          </div>
          
          {results.issues && results.issues.length > 0 ? (
            <div className="issues-list">
              {results.issues.map((issue, idx) => {
                // Find fix from separate array or use the one inside if it exists
                const fixObj = results.suggested_fixes?.find(sf => sf.original === issue.original);
                const fixText = issue.fix || fixObj?.fix || "이 표현은 수정하거나 삭제하는 것이 좋습니다.";

                return (
                  <div key={idx} className={`issue-card ${issue.severity || 'caution'}`}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <TriangleAlert color={issue.severity === 'danger' ? 'var(--danger)' : 'var(--caution)'} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary-navy)' }}>{issue.reason || '규정 위반 소지가 있습니다.'}</p>
                        <div className="issue-grid">
                          <div className="issue-box"><strong>원본</strong><p className="issue-original">{issue.original}</p></div>
                          <div className="issue-box"><strong>수정 제안</strong><p className="issue-fix">{fixText}</p></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
              <CheckCircle2 size={64} color="var(--safe)" style={{ marginBottom: '1rem' }} />
              <p style={{ fontSize: '1.25rem', fontWeight: 600 }}>위반 항목이 없습니다!</p>
              <p style={{ color: 'var(--text-muted)' }}>이 문구는 즉시 사용 가능할 것으로 보입니다.</p>
            </div>
          )}
          
          <div className="summary-box"><p>💡 {results.summary || "검토가 완료되었습니다."}</p></div>
          
          {selectedType === 'ad' && inputText.includes('주택담보대출') && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#fff1f0', border: '1px solid var(--danger)', borderRadius: '8px', display: 'flex', gap: '0.75rem', color: '#cf1322' }}>
              <Home size={20} /><p style={{ fontSize: '0.875rem' }}><strong>[안내]</strong> 주택담보대출 광고는 온투협회 사전확인 의무가 있습니다.</p>
            </div>
          )}
        </div>
      )}

      <footer style={{ marginTop: '4rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <p>© 2026 8percent Compliance Team. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
