export type FeePlayerInput = {
  memberId?: string | null;
  memberName: string;
  shareCount: number;
  drinkShared: boolean;
  adjustment: number;
  note?: string | null;
};

export type FeeCalculationInput = {
  courtFee: number;
  shuttlecockFee: number;
  drinkFee: number;
  otherFee: number;
  players: FeePlayerInput[];
};

export type CalculatedPlayer = FeePlayerInput & {
  amount: number;
};

type PaymentPlayer = {
  amount: number;
  paid?: boolean;
  paid_amount?: number | null;
};

export function calculateShuttlecockFee(unitPrice: number, quantity: number) {
  if (unitPrice < 0) {
    throw new Error("Giá 1 trái cầu không được âm.");
  }

  if (quantity < 0) {
    throw new Error("Số trái cầu không được âm.");
  }

  if (!Number.isInteger(quantity)) {
    throw new Error("Số trái cầu phải là số nguyên.");
  }

  return unitPrice * quantity;
}

export function calculatePlayerFees(input: FeeCalculationInput): CalculatedPlayer[] {
  const totalSharedFee = input.courtFee + input.shuttlecockFee + input.otherFee;
  const totalShares = input.players.reduce((sum, player) => sum + player.shareCount, 0);

  if (totalShares <= 0) {
    throw new Error("Tổng lượt chia phải lớn hơn 0.");
  }

  const drinkPlayers = input.players.filter((player) => player.drinkShared);
  const drinkShare = drinkPlayers.length > 0 ? input.drinkFee / drinkPlayers.length : 0;
  const baseAmountPerShare = totalSharedFee / totalShares;

  return input.players.map((player) => ({
    ...player,
    amount: Math.round(
      baseAmountPerShare * player.shareCount +
        (player.drinkShared ? drinkShare : 0) +
        player.adjustment,
    ),
  }));
}

export function getPlayerPaidAmount(player: PaymentPlayer) {
  return player.paid_amount ?? (player.paid ? player.amount : 0);
}

export function getPlayerPaymentStatus(player: PaymentPlayer) {
  const paidAmount = getPlayerPaidAmount(player);

  if (paidAmount <= 0) {
    return "unpaid";
  }

  if (paidAmount < player.amount) {
    return "partial";
  }

  if (paidAmount === player.amount) {
    return "paid";
  }

  return "overpaid";
}

export function withPlayerPaymentFields<T extends PaymentPlayer>(player: T) {
  const paidAmount = getPlayerPaidAmount(player);
  return {
    ...player,
    paid_amount: paidAmount,
    remainingAmount: Math.max(player.amount - paidAmount, 0),
    balanceAmount: Math.max(paidAmount - player.amount, 0),
    paymentStatus: getPlayerPaymentStatus(player),
  };
}

export function summarizePlayers(players: PaymentPlayer[]) {
  const totalAmount = players.reduce((sum, player) => sum + player.amount, 0);
  const paidAmount = players.reduce((sum, player) => sum + getPlayerPaidAmount(player), 0);
  const unpaidAmount = players.reduce(
    (sum, player) => sum + Math.max(player.amount - getPlayerPaidAmount(player), 0),
    0,
  );
  const creditAmount = players.reduce(
    (sum, player) => sum + Math.max(getPlayerPaidAmount(player) - player.amount, 0),
    0,
  );

  return {
    totalAmount,
    paidAmount,
    unpaidAmount,
    creditAmount,
    playerCount: players.length,
    status:
      unpaidAmount === 0 && totalAmount > 0
        ? "paid"
        : paidAmount === 0
          ? "unpaid"
          : "partial",
  } as const;
}
