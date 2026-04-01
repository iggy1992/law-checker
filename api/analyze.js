import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.0-flash",
  generationConfig: {
    responseMimeType: "application/json",
  }
});

const SYSTEM_PROMPT = `
당신은 에잇퍼센트(8percent)의 금소법(금융소비자보호법) 준수 검토 전문가입니다.
입력받은 마케팅 문구를 다음 6가지 항목을 바탕으로 엄격히 검토하세요:

1. 투자권유 여부 (적합성 원칙): "추천", "투자하세요", "지금 바로", "놓치지 마세요" 등 자제
2. 수익률/수익 보장 (불건전영업행위 금지): "확실히", "보장", "안전한 수익" 등 금지
3. 원금보장 암시 (불건전영업행위 금지): "원금 손실 없이", "절대 손해 없는" 등 금지
4. 과장·비교 광고 (허위·과장광고 금지): "최고", "유일한", "독보적" 등 근거 없는 표현 자제
5. 부당한 혜택 제공: 조건/한도 불명확한 리워드 언급 자제
6. 온투업권 주택담보대출 가이드라인: DSR/LTV 미적용 강조, 타업권 오인 비교, "누구나 대출" 등 자극적 광고 금지

채널별 특성:
- CRM/카카오: 투자권유 판단 엄격 적용
- SNS/광고: 과장·비교 광고 집중 검토
- 웹/블로그: 수익/원금보장 표현 집중 검토

반드시 아래 JSON 구조로만 응답하세요:
{
  "risk_level": "safe | caution | danger",
  "issues": [
    {
      "original": "문제가 된 표현",
      "reason": "위반 항목 및 이유",
      "severity": "danger | caution"
    }
  ],
  "suggested_fixes": [
    {
      "original": "문제가 된 표현",
      "fix": "수정 제안 문구"
    }
  ],
  "summary": "전체 검토 결과 요약 (한 줄)"
}
`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { content, type } = req.body;

  if (!content) {
    return res.status(400).json({ message: "Content is required" });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ 
      message: "Gemini API Key is not configured. Please set GEMINI_API_KEY in environment variables." 
    });
  }

  try {
    const prompt = `콘텐츠 유형: ${type}\n검토할 문구: "${content}"\n\n위 문구를 금소법 가이드라인에 따라 검토하고 결과 JSON을 출력하세요.`;
    
    const result = await model.generateContent([
      { text: SYSTEM_PROMPT },
      { text: prompt }
    ]);

    const responseText = result.response.text();
    const resultJson = JSON.parse(responseText);

    res.status(200).json(resultJson);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    res.status(500).json({ message: "분석 중 오류가 발생했습니다.", error: error.message });
  }
}
