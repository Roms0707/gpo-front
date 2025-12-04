import { TournamentPrize, MonetaryPrize, PhysicalDigitalPrize, PrizeType } from '../types';
import i18n from '../locales/i18n';

export interface PrizePoolCalculation {
  total: number;
  isNumeric: boolean;
  firstPlacePrize: number | null;
  currency: string;
  breakdown: {
    position: number;
    amount: number;
    title: string;
    currency: string;
  }[];
}

export interface SegregatedPrizes {
  monetary: MonetaryPrize[];
  physicalDigital: PhysicalDigitalPrize[];
  hasMonetary: boolean;
  hasPhysicalDigital: boolean;
}

export const parseNumericPrize = (prizeString: string): number | null => {
  if (!prizeString || typeof prizeString !== 'string') {
    return null;
  }

  const cleaned = prizeString.trim().toUpperCase();

  let numericPart = cleaned.replace(/[^0-9.,KMB]/g, '');

  if (!numericPart) {
    return null;
  }

  let multiplier = 1;
  if (numericPart.includes('M')) {
    multiplier = 1000000;
    numericPart = numericPart.replace('M', '');
  } else if (numericPart.includes('K')) {
    multiplier = 1000;
    numericPart = numericPart.replace('K', '');
  } else if (numericPart.includes('B')) {
    multiplier = 1000000000;
    numericPart = numericPart.replace('B', '');
  }

  numericPart = numericPart.replace(/,/g, '');

  const amount = parseFloat(numericPart);

  if (isNaN(amount)) {
    return null;
  }

  return amount * multiplier;
};

export const segregatePrizesByType = (prizes: TournamentPrize[]): SegregatedPrizes => {
  const monetary: MonetaryPrize[] = [];
  const physicalDigital: PhysicalDigitalPrize[] = [];

  prizes.forEach((prize) => {
    if (prize.prize_type === 'monetary' && prize.monetary_amount && prize.currency) {
      monetary.push(prize as MonetaryPrize);
    } else if (prize.prize_type === 'physical_digital') {
      physicalDigital.push(prize as PhysicalDigitalPrize);
    }
  });

  return {
    monetary: monetary.sort((a, b) => a.position - b.position),
    physicalDigital: physicalDigital.sort((a, b) => a.position - b.position),
    hasMonetary: monetary.length > 0,
    hasPhysicalDigital: physicalDigital.length > 0
  };
};

export const calculateTotalPrizePool = (prizes: TournamentPrize[]): PrizePoolCalculation => {
  if (!prizes || prizes.length === 0) {
    return {
      total: 0,
      isNumeric: false,
      firstPlacePrize: null,
      currency: 'FCFA',
      breakdown: []
    };
  }

  const breakdown: { position: number; amount: number; title: string; currency: string }[] = [];
  let total = 0;
  let hasMonetaryPrizes = false;
  let firstPlacePrize: number | null = null;
  let primaryCurrency = 'FCFA';

  prizes.forEach((prize) => {
    if (prize.prize_type === 'monetary' && prize.monetary_amount && prize.currency) {
      hasMonetaryPrizes = true;
      total += prize.monetary_amount;

      if (prize.position === 1) {
        primaryCurrency = prize.currency;
      }

      breakdown.push({
        position: prize.position,
        amount: prize.monetary_amount,
        title: prize.title,
        currency: prize.currency
      });

      if (prize.position === 1) {
        firstPlacePrize = prize.monetary_amount;
      }
    } else {
      const parsed = parseNumericPrize(prize.prize_name);
      if (parsed !== null) {
        hasMonetaryPrizes = true;
        total += parsed;

        breakdown.push({
          position: prize.position,
          amount: parsed,
          title: prize.title,
          currency: prize.currency || 'FCFA'
        });

        if (prize.position === 1) {
          firstPlacePrize = parsed;
        }
      }
    }
  });

  return {
    total,
    isNumeric: hasMonetaryPrizes,
    firstPlacePrize,
    currency: primaryCurrency,
    breakdown: breakdown.sort((a, b) => a.position - b.position)
  };
};

export const formatMonetaryPrize = (amount: number, currency: string, compact: boolean = false): string => {
  if (amount === 0) {
    return `0 ${currency}`;
  }

  const formattedAmount = compact
    ? amount >= 1000000
      ? `${(amount / 1000000).toFixed(amount % 1000000 === 0 ? 0 : 1)}M`
      : amount >= 1000
      ? `${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}K`
      : amount.toLocaleString()
    : amount.toLocaleString();

  return `${formattedAmount} ${currency}`;
};

export const formatPrizeAmount = (amount: number, compact: boolean = false): string => {
  if (amount === 0) {
    return '0';
  }

  if (compact) {
    if (amount >= 1000000) {
      const millions = amount / 1000000;
      return `${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`;
    } else if (amount >= 1000) {
      const thousands = amount / 1000;
      return `${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)}K`;
    }
  }

  return amount.toLocaleString();
};

export const formatPrizePoolDisplay = (
  fullPrize: string | null,
  mainPrize: string | null,
  prizes: TournamentPrize[],
  compact: boolean = false
): {
  displayText: string;
  firstPlaceText: string | null;
  showBreakdown: boolean;
  hasPhysicalPrizes: boolean;
} => {
  const segregated = segregatePrizesByType(prizes);
  const firstPlaceInfo = getFirstPlacePrizeDisplay(prizes, compact);

  if (fullPrize) {
    const parsed = parseNumericPrize(fullPrize);
    if (parsed !== null) {
      const calculation = calculateTotalPrizePool(prizes);
      const displayText = formatMonetaryPrize(parsed, calculation.currency, compact);

      return {
        displayText,
        firstPlaceText: firstPlaceInfo.isEmpty ? null : firstPlaceInfo.displayText,
        showBreakdown: true,
        hasPhysicalPrizes: segregated.hasPhysicalDigital
      };
    }
  }

  const calculation = calculateTotalPrizePool(prizes);

  if (calculation.isNumeric && calculation.total > 0) {
    const displayText = formatMonetaryPrize(calculation.total, calculation.currency, compact);

    return {
      displayText,
      firstPlaceText: firstPlaceInfo.isEmpty ? null : firstPlaceInfo.displayText,
      showBreakdown: true,
      hasPhysicalPrizes: segregated.hasPhysicalDigital
    };
  }

  if (mainPrize) {
    return {
      displayText: mainPrize,
      firstPlaceText: firstPlaceInfo.isEmpty ? null : firstPlaceInfo.displayText,
      showBreakdown: false,
      hasPhysicalPrizes: segregated.hasPhysicalDigital
    };
  }

  return {
    displayText: firstPlaceInfo.isEmpty ? i18n.t('common.toBeDefined') : firstPlaceInfo.displayText,
    firstPlaceText: null,
    showBreakdown: false,
    hasPhysicalPrizes: segregated.hasPhysicalDigital
  };
};

export const isPrizeNumeric = (prizeString: string): boolean => {
  return parseNumericPrize(prizeString) !== null;
};

export const isPrizeMonetary = (prize: TournamentPrize): prize is MonetaryPrize => {
  return prize.prize_type === 'monetary' && !!prize.monetary_amount && !!prize.currency;
};

export const isPrizePhysicalDigital = (prize: TournamentPrize): prize is PhysicalDigitalPrize => {
  return prize.prize_type === 'physical_digital';
};

export interface FirstPlacePrizeInfo {
  displayText: string;
  isMonetary: boolean;
  isPhysicalDigital: boolean;
  currency?: string;
  amount?: number;
  isEmpty: boolean;
}

export const getFirstPlacePrizeDisplay = (prizes: TournamentPrize[], compact: boolean = false): FirstPlacePrizeInfo => {
  if (!prizes || prizes.length === 0) {
    return {
      displayText: i18n.t('common.toBeDefined'),
      isMonetary: false,
      isPhysicalDigital: false,
      isEmpty: true
    };
  }

  const firstPlacePrizes = prizes.filter(p => p.position === 1);

  if (firstPlacePrizes.length === 0) {
    return {
      displayText: i18n.t('common.toBeDefined'),
      isMonetary: false,
      isPhysicalDigital: false,
      isEmpty: true
    };
  }

  const monetaryFirst = firstPlacePrizes.find(p => p.prize_type === 'monetary' && p.monetary_amount && p.currency);

  if (monetaryFirst) {
    return {
      displayText: formatMonetaryPrize(monetaryFirst.monetary_amount!, monetaryFirst.currency!, compact),
      isMonetary: true,
      isPhysicalDigital: false,
      currency: monetaryFirst.currency,
      amount: monetaryFirst.monetary_amount,
      isEmpty: false
    };
  }

  const physicalDigitalFirst = firstPlacePrizes.find(p => p.prize_type === 'physical_digital' && p.prize_name);

  if (physicalDigitalFirst) {
    return {
      displayText: physicalDigitalFirst.prize_name,
      isMonetary: false,
      isPhysicalDigital: true,
      isEmpty: false
    };
  }

  return {
    displayText: i18n.t('common.toBeDefined'),
    isMonetary: false,
    isPhysicalDigital: false,
    isEmpty: true
  };
};
