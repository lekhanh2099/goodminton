import type { PlayerPaymentStatus } from "@/lib/types";

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

export function calculatePlayerFees(
 input: FeeCalculationInput,
): CalculatedPlayer[] {
 const totalSharedFee = input.courtFee + input.shuttlecockFee + input.otherFee;
 const totalShares = input.players.reduce(
  (sum, player) => sum + player.shareCount,
  0,
 );

 if (totalShares <= 0) {
  throw new Error("Tổng lượt chia phải lớn hơn 0.");
 }

 const drinkPlayers = input.players.filter((player) => player.drinkShared);
 const allocatedDrinkFee = drinkPlayers.length > 0 ? input.drinkFee : 0;
 const drinkShare =
  drinkPlayers.length > 0 ? input.drinkFee / drinkPlayers.length : 0;
 const baseAmountPerShare = totalSharedFee / totalShares;
 const totalAdjustments = input.players.reduce(
  (sum, player) => sum + player.adjustment,
  0,
 );

 const rawPlayers = input.players.map((player, index) => {
  const rawAmount =
   baseAmountPerShare * player.shareCount +
   (player.drinkShared ? drinkShare : 0) +
   player.adjustment;

  return {
   ...player,
   index,
   rawAmount,
   amount: Math.round(rawAmount),
  };
 });

 const expectedTotal = Math.round(
  totalSharedFee + allocatedDrinkFee + totalAdjustments,
 );
 const roundedTotal = rawPlayers.reduce(
  (sum, player) => sum + player.amount,
  0,
 );
 let delta = expectedTotal - roundedTotal;

 if (delta !== 0 && rawPlayers.length > 0) {
  const orderedPlayers = [...rawPlayers].sort((a, b) => {
   const aFraction = a.rawAmount - Math.floor(a.rawAmount);
   const bFraction = b.rawAmount - Math.floor(b.rawAmount);

   return delta > 0 ? bFraction - aFraction : aFraction - bFraction;
  });

  let cursor = 0;

  while (delta !== 0) {
   const target = orderedPlayers[cursor % orderedPlayers.length];

   target.amount += delta > 0 ? 1 : -1;
   delta += delta > 0 ? -1 : 1;
   cursor += 1;
  }
 }

 return rawPlayers
  .sort((a, b) => a.index - b.index)
  .map(({ index: _index, rawAmount: _rawAmount, ...player }) => player);
}

export function getPlayerPaidAmount(player: PaymentPlayer) {
 return player.paid_amount ?? (player.paid ? player.amount : 0);
}

export function getPlayerPaymentStatus(
 player: PaymentPlayer,
): PlayerPaymentStatus {
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

export function withPlayerPaymentFields<T extends PaymentPlayer>(
 player: T,
): T & {
 paid_amount: number;
 remainingAmount: number;
 balanceAmount: number;
 paymentStatus: PlayerPaymentStatus;
} {
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
 const paidAmount = players.reduce(
  (sum, player) => sum + getPlayerPaidAmount(player),
  0,
 );
 const unpaidAmount = players.reduce(
  (sum, player) =>
   sum + Math.max(player.amount - getPlayerPaidAmount(player), 0),
  0,
 );
 const creditAmount = players.reduce(
  (sum, player) =>
   sum + Math.max(getPlayerPaidAmount(player) - player.amount, 0),
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
