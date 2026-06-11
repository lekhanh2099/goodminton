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

export function summarizePlayers(players: { amount: number; paid: boolean }[]) {
  const totalAmount = players.reduce((sum, player) => sum + player.amount, 0);
  const paidAmount = players.reduce((sum, player) => sum + (player.paid ? player.amount : 0), 0);
  const unpaidAmount = totalAmount - paidAmount;

  return {
    totalAmount,
    paidAmount,
    unpaidAmount,
    playerCount: players.length,
    status:
      unpaidAmount === 0 && totalAmount > 0
        ? "paid"
        : paidAmount === 0
          ? "unpaid"
          : "partial",
  } as const;
}
