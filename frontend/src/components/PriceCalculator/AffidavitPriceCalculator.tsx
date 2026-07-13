// This component is kept for backward compatibility but is no longer
// the primary calculator. Affidavits.tsx and Marriages.tsx use
// usePricing() + calcAffidavitTotal() directly for live rates.
// This file is only used if imported standalone.
import { PaperType, AuthorizerType } from '@/types';
import { PAPER_LABELS, AUTH_LABELS } from '@/constants';
import { usePricing, calcAffidavitTotal } from '@/hooks/usePricing';

interface Props {
  onAmountChange?: (amount: number) => void;
  defaultPaper?: PaperType;
  defaultAuth?: AuthorizerType;
}

export default function AffidavitPriceCalculator({
  onAmountChange,
  defaultPaper,
  defaultAuth,
}: Props) {
  const { pricing } = usePricing();
  const result =
    defaultPaper && defaultAuth ? calcAffidavitTotal(defaultPaper, defaultAuth, pricing) : null;

  if (result && onAmountChange) onAmountChange(result.total);

  return result ? (
    <div className="price-box">
      <div className="price-row">
        <span>Paper — {PAPER_LABELS[defaultPaper!]}</span>
        <span>{result.paperCost > 0 ? `₹${result.paperCost}` : '₹0'}</span>
      </div>
      <div className="price-row">
        <span>Service fee — {AUTH_LABELS[defaultAuth!]}</span>
        <span>₹{result.authFee}</span>
      </div>
      <div className="price-total">
        <span className="price-total-label">Total</span>
        <span className="price-total-value">₹{result.total}</span>
      </div>
    </div>
  ) : null;
}
