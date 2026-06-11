"use client";

import { useMemo, useState, useActionState } from "react";
import Link from "next/link";

import { calculatePlayerFees, calculateShuttlecockFee } from "@/lib/calculations";
import { formatCurrency, todayInputValue } from "@/lib/format";
import type { Member, SessionFormState, SessionPlayer, SessionWithPlayers } from "@/lib/types";
import { SubmitButton } from "@/components/SubmitButton";

type PlayerDraft = {
  key: string;
  memberId: string;
  memberName: string;
  shareCount: number;
  drinkShared: boolean;
  adjustment: number;
  note: string;
};

type SessionFormProps = {
  members: Member[];
  action: (state: SessionFormState, formData: FormData) => Promise<SessionFormState>;
  session?: SessionWithPlayers;
  title: string;
};

function playerFromSession(player: SessionPlayer): PlayerDraft {
  return {
    key: player.id,
    memberId: player.member_id ?? "",
    memberName: player.member_name_snapshot,
    shareCount: Number(player.share_count),
    drinkShared: player.drink_shared,
    adjustment: player.adjustment,
    note: player.note ?? "",
  };
}

export function SessionForm({ members, action, session, title }: SessionFormProps) {
  const [state, formAction] = useActionState(action, { ok: true, message: "" });
  const [courtFee, setCourtFee] = useState(session?.court_fee ?? 0);
  const [shuttlecockUnitPrice, setShuttlecockUnitPrice] = useState(session?.shuttlecock_unit_price ?? 0);
  const [shuttlecockQuantity, setShuttlecockQuantity] = useState(session?.shuttlecock_quantity ?? 0);
  const [drinkFee, setDrinkFee] = useState(session?.drink_fee ?? 0);
  const [otherFee, setOtherFee] = useState(session?.other_fee ?? 0);
  const [players, setPlayers] = useState<PlayerDraft[]>(
    session?.session_players?.map(playerFromSession) ?? [],
  );
  const [selectedMemberId, setSelectedMemberId] = useState("");

  const shuttlecockFee = useMemo(() => {
    try {
      return calculateShuttlecockFee(shuttlecockUnitPrice, shuttlecockQuantity);
    } catch {
      return 0;
    }
  }, [shuttlecockQuantity, shuttlecockUnitPrice]);

  const calculatedPlayers = useMemo(() => {
    if (players.length === 0 || players.some((player) => player.shareCount <= 0)) {
      return [];
    }

    try {
      return calculatePlayerFees({
        courtFee,
        shuttlecockFee,
        drinkFee,
        otherFee,
        players,
      });
    } catch {
      return [];
    }
  }, [courtFee, drinkFee, otherFee, players, shuttlecockFee]);

  const totalAmount = calculatedPlayers.reduce((sum, player) => sum + player.amount, 0);

  function addMember() {
    const member = members.find((item) => item.id === selectedMemberId);
    if (!member || players.some((player) => player.memberId === member.id)) return;

    setPlayers((current) => [
      ...current,
      {
        key: member.id,
        memberId: member.id,
        memberName: member.name,
        shareCount: 1,
        drinkShared: false,
        adjustment: 0,
        note: "",
      },
    ]);
    setSelectedMemberId("");
  }

  function addGuest() {
    const guestNumber = players.filter((player) => !player.memberId).length + 1;
    setPlayers((current) => [
      ...current,
      {
        key: `guest-${Date.now()}`,
        memberId: "",
        memberName: `Khách vãng lai ${guestNumber}`,
        shareCount: 1,
        drinkShared: false,
        adjustment: 0,
        note: "",
      },
    ]);
  }

  function updatePlayer(key: string, patch: Partial<PlayerDraft>) {
    setPlayers((current) =>
      current.map((player) => (player.key === key ? { ...player, ...patch } : player)),
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {session ? <input name="session_id" type="hidden" value={session.id} /> : null}
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-col gap-1">
          <h1 className="text-xl font-black tracking-tight text-slate-950">{title}</h1>
          <p className="text-sm font-medium text-slate-500">Tự động chia tiền sân, cầu, nước và phụ phí.</p>
        </div>

        {!state.ok ? (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
            {state.message}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field-label">
            Ngày chơi
            <input className="input" defaultValue={session?.date ?? todayInputValue()} name="date" required type="date" />
          </label>
          <label className="field-label">
            Tiền sân
            <input className="input" min={0} name="court_fee" onChange={(event) => setCourtFee(Number(event.target.value))} type="number" value={courtFee} />
          </label>
          <label className="field-label">
            Giá 1 trái cầu
            <input
              className="input"
              min={0}
              name="shuttlecock_unit_price"
              onChange={(event) => setShuttlecockUnitPrice(Number(event.target.value))}
              type="number"
              value={shuttlecockUnitPrice}
            />
          </label>
          <label className="field-label">
            Số trái cầu
            <input
              className="input"
              min={0}
              name="shuttlecock_quantity"
              onChange={(event) => setShuttlecockQuantity(Number(event.target.value))}
              step={1}
              type="number"
              value={shuttlecockQuantity}
            />
          </label>
          <label className="field-label">
            Tiền cầu
            <input className="input bg-slate-50 text-slate-500" name="shuttlecock_fee" readOnly type="number" value={shuttlecockFee} />
          </label>
          <label className="field-label">
            Tiền nước
            <input className="input" min={0} name="drink_fee" onChange={(event) => setDrinkFee(Number(event.target.value))} type="number" value={drinkFee} />
          </label>
          <label className="field-label">
            Phụ phí
            <input className="input" min={0} name="other_fee" onChange={(event) => setOtherFee(Number(event.target.value))} type="number" value={otherFee} />
          </label>
          <label className="field-label">
            Ghi chú
            <input className="input" defaultValue={session?.note ?? ""} name="note" placeholder="Sân lẻ, phạt vắng..." />
          </label>
        </div>

        <div className="mt-5 rounded-2xl bg-indigo-50 p-4 text-right">
          <span className="text-sm font-black uppercase text-indigo-700">Tổng tiền: </span>
          <span className="text-xl font-black text-indigo-700">{formatCurrency(totalAmount)}</span>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="field-label flex-1">
            Người chơi
            <select className="input" onChange={(event) => setSelectedMemberId(event.target.value)} value={selectedMemberId}>
              <option value="">Chọn thành viên</option>
              {members.map((member) => (
                <option disabled={players.some((player) => player.memberId === member.id)} key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>
          <button className="button-secondary" onClick={addMember} type="button">
            Thêm
          </button>
          <button className="button-secondary" onClick={addGuest} type="button">
            Khách
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {players.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-center text-sm font-semibold text-slate-500">
              Chưa có ai chơi. Thêm thành viên hoặc khách vãng lai.
            </p>
          ) : null}

          {players.map((player, index) => {
            const calculated = calculatedPlayers[index];
            return (
              <div className="rounded-2xl border border-slate-200 p-4" key={player.key}>
                <input name="player_index" type="hidden" value={index} />
                <input name={`member_id_${index}`} type="hidden" value={player.memberId} />
                <div className="mb-3 flex items-start justify-between gap-3">
                  <label className="field-label flex-1">
                    Tên
                    <input
                      className="input"
                      name={`member_name_${index}`}
                      onChange={(event) => updatePlayer(player.key, { memberName: event.target.value })}
                      required
                      value={player.memberName}
                    />
                  </label>
                  <div className="pt-6 text-right">
                    <div className="font-black text-slate-950">{formatCurrency(calculated?.amount ?? 0)}</div>
                    <button className="mt-2 text-xs font-bold text-rose-600" onClick={() => setPlayers((current) => current.filter((item) => item.key !== player.key))} type="button">
                      Xóa
                    </button>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                  <label className="field-label">
                    Tập suất
                    <select
                      className="input"
                      name={`share_count_${index}`}
                      onChange={(event) => updatePlayer(player.key, { shareCount: Number(event.target.value) })}
                      value={player.shareCount}
                    >
                      <option value={0.5}>Half 0.5</option>
                      <option value={1}>Full 1.0</option>
                      <option value={1.5}>1.5</option>
                      <option value={2}>2.0</option>
                    </select>
                  </label>
                  <label className="field-label">
                    Chia nước
                    <span className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-3">
                      <input
                        checked={player.drinkShared}
                        name={`drink_shared_${index}`}
                        onChange={(event) => updatePlayer(player.key, { drinkShared: event.target.checked })}
                        type="checkbox"
                      />
                      Bật
                    </span>
                  </label>
                  <label className="field-label">
                    Phụ thu cá nhân
                    <input
                      className="input"
                      name={`adjustment_${index}`}
                      onChange={(event) => updatePlayer(player.key, { adjustment: Number(event.target.value) })}
                      type="number"
                      value={player.adjustment}
                    />
                  </label>
                  <label className="field-label">
                    Ghi chú
                    <input
                      className="input"
                      name={`note_${index}`}
                      onChange={(event) => updatePlayer(player.key, { note: event.target.value })}
                      value={player.note}
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="sticky bottom-4 flex justify-end gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur">
        <Link className="button-secondary" href="/sessions">
          Hủy
        </Link>
        <SubmitButton className="button-primary">Lưu</SubmitButton>
      </div>
    </form>
  );
}
