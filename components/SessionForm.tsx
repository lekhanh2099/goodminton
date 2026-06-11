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
   drinkShared: true,
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

 const [isPickerOpen, setIsPickerOpen] = useState(false);
 const [playerSearch, setPlayerSearch] = useState("");
 const [showOnlySelected, setShowOnlySelected] = useState(false);

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

 const selectedPlayers = players.filter((player) => player.included);
 const selectedPlayerCount = selectedPlayers.length;

 const normalizedPlayerSearch = playerSearch.trim().toLowerCase();

 const pickerPlayers = players.filter((player) => {
  if (showOnlySelected && !player.included) {
   return false;
  }

  if (!normalizedPlayerSearch) {
   return true;
  }

  return player.memberName.toLowerCase().includes(normalizedPlayerSearch);
 });

 const orderedPickerPlayers = [
  ...pickerPlayers.filter((player) => player.included),
  ...pickerPlayers.filter((player) => !player.included),
 ];

 function updatePlayer(key: string, patch: Partial<PlayerDraft>) {
  setPlayers((current) =>
   current.map((player) =>
    player.key === key ? { ...player, ...patch } : player,
   ),
  );
 }

 function setPlayerIncluded(player: PlayerDraft, included: boolean) {
  updatePlayer(player.key, {
   included,
   drinkShared: included ? true : player.drinkShared,
  });
 }

 function setAllPickerPlayersIncluded(included: boolean) {
  const visibleKeys = new Set(pickerPlayers.map((player) => player.key));

  setPlayers((current) =>
   current.map((player) =>
    visibleKeys.has(player.key)
     ? {
        ...player,
        included,
        drinkShared: included ? true : player.drinkShared,
       }
     : player,
   ),
  );
 }

 function setSelectedPickerPlayersWater(drinkShared: boolean) {
  const visibleSelectedKeys = new Set(
   pickerPlayers
    .filter((player) => player.included)
    .map((player) => player.key),
  );

  setPlayers((current) =>
   current.map((player) =>
    visibleSelectedKeys.has(player.key)
     ? {
        ...player,
        drinkShared,
       }
     : player,
   ),
  );
 }

 function addGuest() {
  const guestNumber = players.filter((player) => player.isGuest).length + 1;

  const guest: PlayerDraft = {
   key: `guest-${Date.now()}`,
   memberId: "",
   memberName: `Khách vãng lai ${guestNumber}`,
   included: true,
   isGuest: true,
   shareCount: 1,
   drinkShared: true,
   adjustment: "0",
   note: "",
  };

  setPlayers((current) => [...current, guest]);
  setIsPickerOpen(false);
 }

 return (
  <form
   action={formAction}
   className="flex flex-col gap-4 pb-28 sm:gap-5 sm:pb-0"
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
      Chọn người chơi bằng bảng chọn, không cần kéo qua toàn bộ danh sách.
     </p>
    </div>

    {!state.ok ? (
     <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
      {state.message}
     </div>
    ) : null}

    <div className="mb-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-3">
     <div className="flex items-center justify-between gap-3">
      <div>
       <div className="text-xs font-black uppercase tracking-wide text-indigo-600">
        Người chơi
       </div>
       <div className="mt-1 text-lg font-black text-indigo-700">
        {selectedPlayerCount} người tham gia
       </div>
      </div>

      <button
       className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-black text-white shadow-sm"
       onClick={() => setIsPickerOpen(true)}
       type="button"
      >
       Chọn người
      </button>
     </div>
    </div>

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
    <div className="mb-4 flex items-start justify-between gap-3">
     <div>
      <h2 className="text-lg font-black text-slate-950">Người đã chọn</h2>
      <p className="mt-1 text-sm font-semibold text-slate-500">
       Chỉ người đã tham gia mới hiện ở đây. Muốn thêm người thì bấm “Chọn
       người”.
      </p>
     </div>

     <button
      className="button-secondary shrink-0 px-3"
      onClick={() => setIsPickerOpen(true)}
      type="button"
     >
      Chọn người
     </button>
    </div>

    {selectedPlayers.length === 0 ? (
     <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-center text-sm font-semibold text-slate-500">
      Chưa chọn ai. Bấm “Chọn người” để tick thành viên tham gia.
     </p>
    ) : (
     <div className="flex flex-col gap-2">
      {selectedPlayers.map((player) => {
       const formIndex = includedIndexByKey.get(player.key);

       if (typeof formIndex !== "number") {
        return null;
       }

       const amount = amountByPlayerKey.get(player.key) ?? 0;
       const hasCustomSettings =
        player.shareCount !== 1 ||
        !player.drinkShared ||
        toNumber(player.adjustment) !== 0 ||
        player.note.trim().length > 0;

       return (
        <div
         className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-3"
         key={player.key}
        >
         <input name="player_index" type="hidden" value={formIndex} />
         <input
          name={`member_id_${formIndex}`}
          type="hidden"
          value={player.memberId}
         />
         <input
          name={`drink_shared_${formIndex}`}
          type="hidden"
          value={player.drinkShared ? "on" : ""}
         />

         <div className="flex items-center gap-3">
          <button
           className="grid size-9 shrink-0 place-items-center rounded-xl border border-rose-200 bg-white text-sm font-black text-rose-600"
           onClick={() => setPlayerIncluded(player, false)}
           type="button"
          >
           ×
          </button>

          <div className="min-w-0 flex-1">
           {player.isGuest ? (
            <input
             className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-950 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
             name={`member_name_${formIndex}`}
             onChange={(event) =>
              updatePlayer(player.key, {
               memberName: event.target.value,
              })
             }
             required
             value={player.memberName}
            />
           ) : (
            <>
             <div className="truncate text-sm font-black text-slate-950">
              {player.memberName}
             </div>
             <input
              name={`member_name_${formIndex}`}
              type="hidden"
              value={player.memberName}
             />
            </>
           )}

           <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-black text-indigo-700">
             Có tham gia
            </span>

            {player.drinkShared ? (
             <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-black text-emerald-700">
              Có nước
             </span>
            ) : (
             <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-black text-slate-500">
              Không nước
             </span>
            )}

            {hasCustomSettings ? (
             <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-black text-amber-700">
              Đã chỉnh
             </span>
            ) : null}
           </div>
          </div>

          <div className="shrink-0 text-right">
           <div className="text-sm font-black text-indigo-700">
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
             Xóa khách
            </button>
           ) : null}
          </div>
         </div>

         <details className="group mt-3">
          <summary className="flex h-10 cursor-pointer list-none items-center justify-between rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 [&::-webkit-details-marker]:hidden">
           <span>Tùy chỉnh</span>
           <span className="text-xs text-slate-400 group-open:hidden">Mở</span>
           <span className="hidden text-xs text-slate-400 group-open:inline">
            Đóng
           </span>
          </summary>

          <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
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
            <button
             className={
              player.drinkShared
               ? "flex h-11 w-full items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-sm font-black text-emerald-700"
               : "flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600"
             }
             onClick={() =>
              updatePlayer(player.key, {
               drinkShared: !player.drinkShared,
              })
             }
             type="button"
            >
             {player.drinkShared ? "Có nước" : "Không nước"}
            </button>
           </label>

           <label className="field-label">
            Phụ thu
            <input
             className="input"
             inputMode="numeric"
             name={`adjustment_${formIndex}`}
             onChange={(event) =>
              updatePlayer(player.key, {
               adjustment: event.target.value,
              })
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
              updatePlayer(player.key, {
               note: event.target.value,
              })
             }
             placeholder="..."
             value={player.note}
            />
           </label>
          </div>
         </details>
        </div>
       );
      })}
     </div>
    )}
   </section>

   {isPickerOpen ? (
    <div
     aria-modal="true"
     className="fixed inset-0 z-40 flex items-end bg-slate-950/40 p-0 sm:items-center sm:justify-center sm:p-4"
     role="dialog"
    >
     <div className="flex max-h-[88vh] w-full flex-col rounded-t-3xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-3xl">
      <div className="border-b border-slate-200 p-4">
       <div className="mb-3 flex items-start justify-between gap-3">
        <div>
         <h2 className="text-lg font-black text-slate-950">Chọn người chơi</h2>
         <p className="mt-1 text-sm font-semibold text-slate-500">
          {selectedPlayerCount} / {players.length} người đang được chọn
         </p>
        </div>

        <button
         className="grid size-10 place-items-center rounded-xl border border-slate-200 text-lg font-black text-slate-600"
         onClick={() => setIsPickerOpen(false)}
         type="button"
        >
         ×
        </button>
       </div>

       <input
        className="input"
        onChange={(event) => setPlayerSearch(event.target.value)}
        placeholder="Tìm tên thành viên..."
        type="search"
        value={playerSearch}
       />

       <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button
         className="button-secondary h-10 px-3 text-sm"
         onClick={() => setAllPickerPlayersIncluded(true)}
         type="button"
        >
         Chọn tất cả
        </button>

        <button
         className="button-secondary h-10 px-3 text-sm"
         onClick={() => setAllPickerPlayersIncluded(false)}
         type="button"
        >
         Bỏ chọn
        </button>

        <button
         className="button-secondary h-10 px-3 text-sm"
         disabled={pickerPlayers.every((player) => !player.included)}
         onClick={() => setSelectedPickerPlayersWater(true)}
         type="button"
        >
         Có nước
        </button>

        <button
         className="button-secondary h-10 px-3 text-sm"
         disabled={pickerPlayers.every((player) => !player.included)}
         onClick={() => setSelectedPickerPlayersWater(false)}
         type="button"
        >
         Không nước
        </button>
       </div>

       <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-500">
         {pickerPlayers.length} kết quả
        </span>

        <button
         className={
          showOnlySelected
           ? "rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-black text-white"
           : "rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-600"
         }
         onClick={() => setShowOnlySelected((value) => !value)}
         type="button"
        >
         Chỉ đã chọn
        </button>
       </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
       {orderedPickerPlayers.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-center text-sm font-semibold text-slate-500">
         Không tìm thấy thành viên phù hợp.
        </p>
       ) : (
        <div className="grid gap-2">
         {orderedPickerPlayers.map((player) => (
          <button
           className={
            player.included
             ? "flex items-center gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-3 text-left"
             : "flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left"
           }
           key={player.key}
           onClick={() => setPlayerIncluded(player, !player.included)}
           type="button"
          >
           <span
            className={
             player.included
              ? "grid size-6 shrink-0 place-items-center rounded-md bg-indigo-600 text-sm font-black text-white"
              : "grid size-6 shrink-0 place-items-center rounded-md border border-slate-300 bg-white"
            }
           >
            {player.included ? "✓" : ""}
           </span>

           <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-black text-slate-950">
             {player.memberName}
            </span>
            <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
             <span className="text-xs font-semibold text-slate-400">
              {player.isGuest ? "Khách vãng lai" : "Thành viên"}
             </span>

             {player.included ? (
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-black text-indigo-700">
               Đã chọn
              </span>
             ) : null}

             {player.included && player.drinkShared ? (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-black text-emerald-700">
               Có nước
              </span>
             ) : null}
            </span>
           </span>
          </button>
         ))}
        </div>
       )}
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-slate-200 p-3">
       <button
        className="button-secondary h-11"
        onClick={addGuest}
        type="button"
       >
        + Khách
       </button>

       <button
        className="button-primary h-11"
        onClick={() => setIsPickerOpen(false)}
        type="button"
       >
        Xong
       </button>
      </div>
     </div>
    </div>
   ) : null}

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
