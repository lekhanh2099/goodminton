"use client";

import Link from "next/link";
import { useActionState, useMemo, useState, type ReactNode } from "react";

import { SubmitButton } from "@/components/SubmitButton";
import {
 calculatePlayerFees,
 calculateShuttlecockFee,
} from "@/lib/calculations";
import { formatCurrency, todayInputValue } from "@/lib/format";
import type {
 Member,
 SessionFormState,
 SessionPlayer,
 SessionWithPlayers,
} from "@/lib/types";

type PlayerDraft = {
 key: string;
 memberId: string;
 memberName: string;
 included: boolean;
 isGuest: boolean;
 shareCount: number;
 drinkShared: boolean;
 adjustment: string;
 note: string;
};

type SessionFormProps = {
 members: Member[];
 action: (
  state: SessionFormState,
  formData: FormData,
 ) => Promise<SessionFormState>;
 session?: SessionWithPlayers;
 title: string;
};

const courtFeePresets = [
 { label: "240k", value: "240000" },
 { label: "480k", value: "480000" },
];

const shuttlecockUnitPricePresets = [
 { label: "28k", value: "28000" },
 { label: "30k", value: "30000" },
];

const shuttlecockQuantityPresets = ["8", "9", "10", "11", "12"];

const drinkFeePresets = [{ label: "40k", value: "40000" }];

function toInputValue(value: number | null | undefined) {
 return String(value ?? 0);
}

function toNumber(value: string) {
 if (value.trim() === "") return 0;

 const numberValue = Number(value);
 return Number.isFinite(numberValue) ? numberValue : 0;
}

function playerFromSession(player: SessionPlayer): PlayerDraft {
 return {
  key: player.id,
  memberId: player.member_id ?? "",
  memberName: player.member_name_snapshot,
  included: true,
  isGuest: !player.member_id,
  shareCount: Number(player.share_count),
  drinkShared: player.drink_shared,
  adjustment: toInputValue(player.adjustment),
  note: player.note ?? "",
 };
}

function buildInitialPlayers(
 members: Member[],
 session?: SessionWithPlayers,
): PlayerDraft[] {
 const sessionPlayers = session?.session_players?.map(playerFromSession) ?? [];
 const sessionPlayerByMemberId = new Map(
  sessionPlayers
   .filter((player) => player.memberId)
   .map((player) => [player.memberId, player]),
 );

 const memberRows = members.map((member) => {
  const existingPlayer = sessionPlayerByMemberId.get(member.id);

  if (existingPlayer) {
   return existingPlayer;
  }

  return {
   key: member.id,
   memberId: member.id,
   memberName: member.name,
   included: false,
   isGuest: false,
   shareCount: 1,
   drinkShared: false,
   adjustment: "0",
   note: "",
  };
 });

 const activeMemberIds = new Set(members.map((member) => member.id));
 const missingMemberRows = sessionPlayers.filter(
  (player) => player.memberId && !activeMemberIds.has(player.memberId),
 );
 const guestRows = sessionPlayers.filter((player) => !player.memberId);

 return [...memberRows, ...missingMemberRows, ...guestRows];
}

function PresetButton({
 children,
 onClick,
}: {
 children: ReactNode;
 onClick: () => void;
}) {
 return (
  <button
   className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-black text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
   onClick={onClick}
   type="button"
  >
   {children}
  </button>
 );
}

function PresetRow({ children }: { children: ReactNode }) {
 return <div className="mt-2 flex flex-wrap gap-1.5">{children}</div>;
}

export function SessionForm({
 members,
 action,
 session,
 title,
}: SessionFormProps) {
 const [state, formAction] = useActionState(action, { ok: true, message: "" });

 const [courtFeeInput, setCourtFeeInput] = useState(
  toInputValue(session?.court_fee),
 );
 const [shuttlecockUnitPriceInput, setShuttlecockUnitPriceInput] = useState(
  toInputValue(session?.shuttlecock_unit_price),
 );
 const [shuttlecockQuantityInput, setShuttlecockQuantityInput] = useState(
  toInputValue(session?.shuttlecock_quantity),
 );
 const [drinkFeeInput, setDrinkFeeInput] = useState(
  toInputValue(session?.drink_fee),
 );
 const [otherFeeInput, setOtherFeeInput] = useState(
  toInputValue(session?.other_fee),
 );
 const [players, setPlayers] = useState<PlayerDraft[]>(() =>
  buildInitialPlayers(members, session),
 );

 const courtFee = toNumber(courtFeeInput);
 const shuttlecockUnitPrice = toNumber(shuttlecockUnitPriceInput);
 const shuttlecockQuantity = toNumber(shuttlecockQuantityInput);
 const drinkFee = toNumber(drinkFeeInput);
 const otherFee = toNumber(otherFeeInput);

 const shuttlecockFee = useMemo(() => {
  try {
   return calculateShuttlecockFee(shuttlecockUnitPrice, shuttlecockQuantity);
  } catch {
   return 0;
  }
 }, [shuttlecockQuantity, shuttlecockUnitPrice]);

 const includedPlayers = useMemo(
  () =>
   players
    .filter((player) => player.included)
    .map((player) => ({
     ...player,
     adjustment: toNumber(player.adjustment),
    })),
  [players],
 );

 const includedIndexByKey = useMemo(() => {
  const map = new Map<string, number>();

  includedPlayers.forEach((player, index) => {
   map.set(player.key, index);
  });

  return map;
 }, [includedPlayers]);

 const calculatedPlayers = useMemo(() => {
  if (
   includedPlayers.length === 0 ||
   includedPlayers.some((player) => player.shareCount <= 0)
  ) {
   return [];
  }

  try {
   return calculatePlayerFees({
    courtFee,
    shuttlecockFee,
    drinkFee,
    otherFee,
    players: includedPlayers,
   });
  } catch {
   return [];
  }
 }, [courtFee, drinkFee, includedPlayers, otherFee, shuttlecockFee]);

 const amountByPlayerKey = useMemo(() => {
  const map = new Map<string, number>();

  includedPlayers.forEach((player, index) => {
   map.set(player.key, calculatedPlayers[index]?.amount ?? 0);
  });

  return map;
 }, [calculatedPlayers, includedPlayers]);

 const totalAmount = calculatedPlayers.reduce(
  (sum, player) => sum + player.amount,
  0,
 );
 const selectedPlayerCount = includedPlayers.length;

 function updatePlayer(key: string, patch: Partial<PlayerDraft>) {
  setPlayers((current) =>
   current.map((player) =>
    player.key === key ? { ...player, ...patch } : player,
   ),
  );
 }

 function addGuest() {
  const guestNumber = players.filter((player) => player.isGuest).length + 1;

  setPlayers((current) => [
   ...current,
   {
    key: `guest-${Date.now()}`,
    memberId: "",
    memberName: `Khách vãng lai ${guestNumber}`,
    included: true,
    isGuest: true,
    shareCount: 1,
    drinkShared: false,
    adjustment: "0",
    note: "",
   },
  ]);
 }

 return (
  <form
   action={formAction}
   className="flex flex-col gap-4 pb-24 sm:gap-5 sm:pb-0"
  >
   {session ? (
    <input name="session_id" type="hidden" value={session.id} />
   ) : null}

   <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
    <div className="mb-4 flex flex-col gap-1">
     <h1 className="text-xl font-black tracking-tight text-slate-950">
      {title}
     </h1>
     <p className="text-sm font-medium text-slate-500">
      Tick người chơi, nhập tiền, hệ thống tự chia.
     </p>
    </div>

    {!state.ok ? (
     <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
      {state.message}
     </div>
    ) : null}

    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
     <label className="field-label">
      Ngày chơi
      <input
       className="input"
       defaultValue={session?.date ?? todayInputValue()}
       name="date"
       required
       type="date"
      />
     </label>

     <label className="field-label">
      Tiền sân
      <input
       className="input"
       inputMode="numeric"
       min={0}
       name="court_fee"
       onChange={(event) => setCourtFeeInput(event.target.value)}
       placeholder="0"
       type="number"
       value={courtFeeInput}
      />
      <PresetRow>
       {courtFeePresets.map((preset) => (
        <PresetButton
         key={preset.value}
         onClick={() => setCourtFeeInput(preset.value)}
        >
         {preset.label}
        </PresetButton>
       ))}
      </PresetRow>
     </label>

     <label className="field-label">
      Giá 1 trái cầu
      <input
       className="input"
       inputMode="numeric"
       min={0}
       name="shuttlecock_unit_price"
       onChange={(event) => setShuttlecockUnitPriceInput(event.target.value)}
       placeholder="0"
       type="number"
       value={shuttlecockUnitPriceInput}
      />
      <PresetRow>
       {shuttlecockUnitPricePresets.map((preset) => (
        <PresetButton
         key={preset.value}
         onClick={() => setShuttlecockUnitPriceInput(preset.value)}
        >
         {preset.label}
        </PresetButton>
       ))}
      </PresetRow>
     </label>

     <label className="field-label">
      Số trái cầu
      <input
       className="input"
       inputMode="numeric"
       min={0}
       name="shuttlecock_quantity"
       onChange={(event) => setShuttlecockQuantityInput(event.target.value)}
       placeholder="0"
       step={1}
       type="number"
       value={shuttlecockQuantityInput}
      />
      <PresetRow>
       {shuttlecockQuantityPresets.map((quantity) => (
        <PresetButton
         key={quantity}
         onClick={() => setShuttlecockQuantityInput(quantity)}
        >
         {quantity}
        </PresetButton>
       ))}
      </PresetRow>
     </label>

     <label className="field-label">
      Tiền nước
      <input
       className="input"
       inputMode="numeric"
       min={0}
       name="drink_fee"
       onChange={(event) => setDrinkFeeInput(event.target.value)}
       placeholder="0"
       type="number"
       value={drinkFeeInput}
      />
      <PresetRow>
       {drinkFeePresets.map((preset) => (
        <PresetButton
         key={preset.value}
         onClick={() => setDrinkFeeInput(preset.value)}
        >
         {preset.label}
        </PresetButton>
       ))}
      </PresetRow>
     </label>

     <label className="field-label">
      Phụ phí
      <input
       className="input"
       inputMode="numeric"
       min={0}
       name="other_fee"
       onChange={(event) => setOtherFeeInput(event.target.value)}
       placeholder="0"
       type="number"
       value={otherFeeInput}
      />
     </label>

     <label className="field-label">
      Tiền cầu
      <input
       className="input bg-slate-50 text-slate-500"
       name="shuttlecock_fee"
       readOnly
       type="number"
       value={shuttlecockFee}
      />
      <span className="mt-1 text-xs font-bold normal-case tracking-normal text-slate-500">
       {formatCurrency(shuttlecockUnitPrice)} × {shuttlecockQuantity || 0} trái
      </span>
     </label>

     <label className="field-label">
      Ghi chú
      <input
       className="input"
       defaultValue={session?.note ?? ""}
       name="note"
       placeholder="Sân lẻ, phạt vắng..."
      />
     </label>
    </div>

    <div className="mt-4 rounded-2xl bg-indigo-50 p-4">
     <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-black text-indigo-700">
       {selectedPlayerCount > 0
        ? `${selectedPlayerCount} người tham gia`
        : "Chưa chọn người chơi"}
      </span>
      <span className="text-right">
       <span className="block text-xs font-black uppercase text-indigo-700">
        Tổng tiền
       </span>
       <span className="text-xl font-black text-indigo-700">
        {formatCurrency(totalAmount)}
       </span>
      </span>
     </div>
    </div>
   </section>

   <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
    <div className="mb-4 flex items-center justify-between gap-3">
     <div>
      <h2 className="text-lg font-black text-slate-950">Người chơi</h2>
      <p className="mt-1 text-sm font-semibold text-slate-500">
       Tick người có tham gia.
      </p>
     </div>

     <button
      className="button-secondary shrink-0"
      onClick={addGuest}
      type="button"
     >
      + Khách
     </button>
    </div>

    <div className="flex flex-col gap-2">
     {players.length === 0 ? (
      <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-center text-sm font-semibold text-slate-500">
       Chưa có thành viên. Vào trang Thành viên để thêm trước.
      </p>
     ) : null}

     {players.map((player) => {
      const formIndex = includedIndexByKey.get(player.key);
      const isIncluded = typeof formIndex === "number";
      const amount = amountByPlayerKey.get(player.key) ?? 0;

      return (
       <div
        className={
         isIncluded
          ? "rounded-2xl border border-indigo-200 bg-indigo-50/50 p-3"
          : "rounded-2xl border border-slate-200 bg-white p-3"
        }
        key={player.key}
       >
        {isIncluded ? (
         <>
          <input name="player_index" type="hidden" value={formIndex} />
          <input
           name={`member_id_${formIndex}`}
           type="hidden"
           value={player.memberId}
          />
         </>
        ) : null}

        <div className="flex items-center gap-3">
         <input
          checked={player.included}
          className="size-5 shrink-0 rounded border-slate-300 accent-indigo-600"
          onChange={(event) =>
           updatePlayer(player.key, { included: event.target.checked })
          }
          type="checkbox"
         />

         <div className="min-w-0 flex-1">
          {player.isGuest && isIncluded ? (
           <input
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-950 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            name={`member_name_${formIndex}`}
            onChange={(event) =>
             updatePlayer(player.key, { memberName: event.target.value })
            }
            required
            value={player.memberName}
           />
          ) : (
           <>
            <div
             className={
              isIncluded
               ? "truncate text-sm font-black text-slate-950"
               : "truncate text-sm font-bold text-slate-500"
             }
            >
             {player.memberName}
            </div>
            <div className="text-xs font-semibold text-slate-400">
             {player.isGuest ? "Khách vãng lai" : "Thành viên"}
            </div>
            {isIncluded ? (
             <input
              name={`member_name_${formIndex}`}
              type="hidden"
              value={player.memberName}
             />
            ) : null}
           </>
          )}
         </div>

         <div className="shrink-0 text-right">
          <div
           className={
            isIncluded
             ? "text-sm font-black text-indigo-700"
             : "text-sm font-black text-slate-300"
           }
          >
           {formatCurrency(amount)}
          </div>

          {player.isGuest ? (
           <button
            className="mt-1 text-xs font-bold text-rose-600"
            onClick={() =>
             setPlayers((current) =>
              current.filter((item) => item.key !== player.key),
             )
            }
            type="button"
           >
            Xóa
           </button>
          ) : null}
         </div>
        </div>

        {isIncluded ? (
         <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <label className="field-label">
           Tập suất
           <select
            className="input"
            name={`share_count_${formIndex}`}
            onChange={(event) =>
             updatePlayer(player.key, {
              shareCount: Number(event.target.value),
             })
            }
            value={player.shareCount}
           >
            <option value={0.5}>0.5</option>
            <option value={1}>1.0</option>
            <option value={1.5}>1.5</option>
            <option value={2}>2.0</option>
           </select>
          </label>

          <label className="field-label">
           Nước
           <span className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold normal-case tracking-normal text-slate-700">
            <input
             checked={player.drinkShared}
             className="size-4 accent-indigo-600"
             name={`drink_shared_${formIndex}`}
             onChange={(event) =>
              updatePlayer(player.key, { drinkShared: event.target.checked })
             }
             type="checkbox"
            />
            Có
           </span>
          </label>

          <label className="field-label">
           Phụ thu
           <input
            className="input"
            inputMode="numeric"
            name={`adjustment_${formIndex}`}
            onChange={(event) =>
             updatePlayer(player.key, { adjustment: event.target.value })
            }
            placeholder="0"
            type="number"
            value={player.adjustment}
           />
          </label>

          <label className="field-label">
           Ghi chú
           <input
            className="input"
            name={`note_${formIndex}`}
            onChange={(event) =>
             updatePlayer(player.key, { note: event.target.value })
            }
            placeholder="..."
            value={player.note}
           />
          </label>
         </div>
        ) : null}
       </div>
      );
     })}
    </div>
   </section>

   <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur sm:sticky sm:bottom-4 sm:rounded-2xl sm:border sm:p-3">
    <div className="mx-auto flex max-w-6xl items-center gap-3">
     <div className="min-w-0 flex-1">
      <div className="text-xs font-black uppercase text-slate-500">
       Tổng tiền
      </div>
      <div className="truncate text-lg font-black text-indigo-700">
       {formatCurrency(totalAmount)}
      </div>
     </div>

     <Link className="button-secondary shrink-0 px-4" href="/sessions">
      Hủy
     </Link>

     <SubmitButton className="button-primary shrink-0 px-5">Lưu</SubmitButton>
    </div>
   </div>
  </form>
 );
}
