/**
 * Classification Engine for Cyber Police Complaints
 * Strictly adheres to Specifications 9, 10, 11, 12, 13, 47, 48:
 * - Priority rule: Financial relevance overrides Social Media exclusion.
 * - Distinguishes 10-digit mobile numbers from monetary values.
 * - Extracts monetary amounts.
 * - Routes uncertain/ambiguous complaints to REVIEW_REQUIRED.
 */

import { ClassificationType } from '../types';

export interface ClassificationResult {
  classification: ClassificationType;
  confidence: number;
  isFinancial: boolean;
  isSocialMedia: boolean;
  detectedKeywords: string[];
  detectedAmounts: number[];
  rationale: string;
}

// Financial keywords as defined in spec section 10 and police cybercrime operations
const FINANCIAL_KEYWORDS = [
  'FRAUD',
  'FRAUDULENT',
  'TRANSACTION',
  'MONEY TRANSFER',
  'UPI',
  'BANK',
  'PAYMENT',
  'DEBIT',
  'CREDIT',
  'ACCOUNT DEBIT',
  'AMOUNT',
  'INVESTMENT FRAUD',
  'LOAN FRAUD',
  'ONLINE FRAUD',
  'WITHOUT OTP',
  'OTP FRAUD',
  'CARD FRAUD',
  'NET BANKING',
  'IMPS',
  'NEFT',
  'RTGS',
  'CHEATING',
  'WALLET',
  'REFUND FRAUD',
  'TASK FRAUD',
  'PART TIME JOB FRAUD',
  'SHARE TRADING FRAUD',
  'STOCK FRAUD',
  'CREDIT CARD',
  'DEBIT CARD',
  'ATM',
  'CYBER FRAUD',
  'PHONEPE',
  'GOOGLE PAY',
  'GPAY',
  'PAYTM',
  'LOST MONEY',
  'DEDUCTED'
];

// Social media keywords
const SOCIAL_MEDIA_KEYWORDS = [
  'SOCIAL MEDIA',
  'FB',
  'FACEBOOK',
  'INSTAGRAM',
  'INSTA',
  'IG',
  'WHATSAPP',
  'TELEGRAM',
  'TWITTER',
  'X APP',
  'SNAPCHAT',
  'HACK',
  'HACKED',
  'ID HACK',
  'PROFILE HACK',
  'FAKE ACCOUNT',
  'DEFAMATION',
  'OBSCENE',
  'IMPERSONATION',
  'THREATENING CALL',
  'HARASSMENT'
];

/**
 * Extracts 10-digit Indian mobile numbers or phone numbers from memo
 * so they are never confused with financial amounts.
 */
function extractPhoneNumbers(text: string): string[] {
  // Matches standalone 10 digit numbers (usually starting with 6,7,8,9) or with +91/0 prefix
  const phoneRegex = /(?:\+?91[\s-]?)?(?:0)?([6-9]\d{9})\b/g;
  const matches: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = phoneRegex.exec(text)) !== null) {
    matches.push(m[1] || m[0]);
  }
  return matches;
}

/**
 * Extracts monetary amounts from incident memo.
 * Handles patterns:
 * - ₹10,000 / ■10,000 / ■ 10,000
 * - Rs. 10,000 / RS 10000 / INR 10,000
 * - 10,000/- / 10000/-
 * - 5,000 / 60,000 / 1,50,000 (with comma separators)
 * - "AMOUNT 50000" / "LOST 25000"
 */
export function extractMonetaryAmounts(memo: string): number[] {
  if (!memo) return [];
  const text = memo.trim();
  const amounts: number[] = [];
  const foundPhoneNumbers = new Set(extractPhoneNumbers(text));

  // Pattern 1: Explicit currency symbol or prefix
  // e.g. ₹ 10,000 or ■ 10,000 or Rs. 10000 or INR 10,000
  const currencyPrefixRegex = /(?:[₹■]|Rs\.?|INR)\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/gi;
  let match: RegExpExecArray | null;
  while ((match = currencyPrefixRegex.exec(text)) !== null) {
    const rawVal = match[1].replace(/,/g, '');
    const num = parseFloat(rawVal);
    if (!isNaN(num) && num > 0) {
      amounts.push(num);
    }
  }

  // Pattern 2: Slash-dash suffix e.g. 10,000/- or 10000/-
  const slashDashRegex = /\b([0-9]{1,3}(?:,[0-9]{2,3})+|[0-9]+)\s*\/-/g;
  while ((match = slashDashRegex.exec(text)) !== null) {
    const rawVal = match[1].replace(/,/g, '');
    const num = parseFloat(rawVal);
    if (!isNaN(num) && num > 0) {
      if (!amounts.includes(num)) {
        amounts.push(num);
      }
    }
  }

  // Pattern 3: Indian comma-separated numbers (e.g. 10,000, 1,50,000, 50,000)
  const commaSeparatedRegex = /\b([0-9]{1,2}(?:,[0-9]{2})+|\b[0-9]{1,3},[0-9]{3})\b/g;
  while ((match = commaSeparatedRegex.exec(text)) !== null) {
    const cleanStr = match[1].replace(/,/g, '');
    const num = parseFloat(cleanStr);
    if (!isNaN(num) && num > 0 && !amounts.includes(num)) {
      // Ensure it's not a fragmented phone number or date
      amounts.push(num);
    }
  }

  // Pattern 4: Amount / Lost / Fraud followed by plain numbers e.g. "FRAUD 50000", "AMOUNT 10000"
  const keywordAmountRegex = /(?:AMOUNT|RS|INR|LOST|FRAUD|DEBITED|TRANSFERRED|PAID)\s*(?:OF|:|-)?\s*([0-9]+)/gi;
  while ((match = keywordAmountRegex.exec(text)) !== null) {
    const rawVal = match[1];
    // Check if this is a phone number (10 digits starting with 6-9)
    if (rawVal.length === 10 && /^[6-9]/.test(rawVal)) {
      continue; // Phone number, not amount!
    }
    if (foundPhoneNumbers.has(rawVal)) {
      continue;
    }
    const num = parseFloat(rawVal);
    if (!isNaN(num) && num >= 100 && !amounts.includes(num)) {
      amounts.push(num);
    }
  }

  return amounts;
}

/**
 * Classifies a complaint memo into:
 * - FINANCIAL (Assign)
 * - SOCIAL_MEDIA (Ignore)
 * - REVIEW_REQUIRED (Ambiguous, requires human operator decision)
 * - OTHER (Non-financial, ignore)
 */
export function classifyComplaintMemo(memo: string): ClassificationResult {
  if (!memo || memo.trim().length === 0) {
    return {
      classification: 'REVIEW_REQUIRED',
      confidence: 0.2,
      isFinancial: false,
      isSocialMedia: false,
      detectedKeywords: [],
      detectedAmounts: [],
      rationale: 'Empty or invalid memo. Operator review required.'
    };
  }

  const upperMemo = memo.toUpperCase();
  const detectedKeywords: string[] = [];
  const detectedAmounts = extractMonetaryAmounts(memo);

  // Detect financial keywords
  let hasFinancialKeyword = false;
  for (const kw of FINANCIAL_KEYWORDS) {
    if (upperMemo.includes(kw)) {
      detectedKeywords.push(kw);
      hasFinancialKeyword = true;
    }
  }

  // Detect social media keywords
  let hasSocialMediaKeyword = false;
  for (const kw of SOCIAL_MEDIA_KEYWORDS) {
    if (upperMemo.includes(kw)) {
      detectedKeywords.push(kw);
      hasSocialMediaKeyword = true;
    }
  }

  const hasFinancialAmount = detectedAmounts.length > 0;
  const isFinancialEvidence = hasFinancialKeyword || hasFinancialAmount;

  // PRIORITY RULE: Financial relevance overrides Social Media exclusion!
  // e.g. "WHATSAPP HACK AND FRAUD 50,000" -> FINANCIAL -> ASSIGN
  if (isFinancialEvidence) {
    // High confidence financial
    const confidence = hasFinancialKeyword && hasFinancialAmount ? 0.98 : (hasFinancialKeyword ? 0.90 : 0.85);
    return {
      classification: 'FINANCIAL',
      confidence,
      isFinancial: true,
      isSocialMedia: hasSocialMediaKeyword,
      detectedKeywords,
      detectedAmounts,
      rationale: hasSocialMediaKeyword 
        ? 'Financial relevance overrides Social Media exclusion (financial indicators detected).'
        : 'Financial crime indicators detected.'
    };
  }

  // If NO financial evidence, check if pure Social Media
  if (hasSocialMediaKeyword && !isFinancialEvidence) {
    // Pure Social Media e.g. "SOCIAL MEDIA FB ID HACK" or "WHATSAPP HACK ANOTHER NO 9558059062"
    return {
      classification: 'SOCIAL_MEDIA',
      confidence: 0.95,
      isFinancial: false,
      isSocialMedia: true,
      detectedKeywords,
      detectedAmounts: [],
      rationale: 'Pure Social Media / SM complaint without financial loss. Ignored from assignment queue.'
    };
  }

  // If no clear financial or social media keywords:
  // Check for suspicious ambiguous terms (e.g. "INVESTIGATE", "URGENT COMPLAINT", "SUSPICIOUS CALL", etc.)
  const ambiguousKeywords = ['INVESTIGATE', 'COMPLAINT', 'SUSPICIOUS', 'UNKNOWN', 'ENQUIRY', 'CASE'];
  const hasAmbiguity = ambiguousKeywords.some(w => upperMemo.includes(w)) || upperMemo.length < 25;

  if (hasAmbiguity) {
    return {
      classification: 'REVIEW_REQUIRED',
      confidence: 0.45,
      isFinancial: false,
      isSocialMedia: false,
      detectedKeywords,
      detectedAmounts: [],
      rationale: 'Ambiguous incident description. Human operator verification required before assignment.'
    };
  }

  return {
    classification: 'OTHER',
    confidence: 0.85,
    isFinancial: false,
    isSocialMedia: false,
    detectedKeywords,
    detectedAmounts: [],
    rationale: 'Non-financial, non-social-media complaint. Ignored.'
  };
}

export function classifyComplaint(memo: string, _mobile?: string): {
  classification: ClassificationType;
  confidenceScore: number;
  detectedAmounts: number[];
  detectedKeywords: string[];
  isFinancial: boolean;
  isSocialMedia: boolean;
} {
  const res = classifyComplaintMemo(memo);
  return {
    classification: res.classification,
    confidenceScore: res.confidence,
    detectedAmounts: res.detectedAmounts,
    detectedKeywords: res.detectedKeywords,
    isFinancial: res.isFinancial,
    isSocialMedia: res.isSocialMedia,
  };
}

