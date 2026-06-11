"use client";

import Link from "next/link";
import { useActionState } from "react";

import { SubmitButton } from "@/components/SubmitButton";
import { loginMember, registerMember } from "@/lib/data";

const initialState = { ok: true, message: "" };

export function LoginForm() {
  const [state, formAction] = useActionState(loginMember, initialState);

  return (
    <form action={formAction} className="card mx-auto w-full max-w-md">
      <h1 className="text-2xl font-black tracking-tight text-slate-950">Đăng nhập</h1>
      <p className="mt-2 text-sm font-semibold text-slate-500">Dùng tên đăng nhập và mã PIN thành viên.</p>
      {!state.ok ? <ErrorMessage message={state.message} /> : null}
      <div className="mt-5 flex flex-col gap-4">
        <label className="field-label">
          Tên đăng nhập
          <input className="input" name="login_name" required />
        </label>
        <label className="field-label">
          Mã PIN
          <input className="input" name="pin_code" required type="password" />
        </label>
        <SubmitButton className="button-primary w-full">Đăng nhập</SubmitButton>
        <Link className="text-center text-sm font-black text-indigo-600" href="/register">
          Đăng ký thành viên
        </Link>
      </div>
    </form>
  );
}

export function RegisterForm() {
  const [state, formAction] = useActionState(registerMember, initialState);

  return (
    <form action={formAction} className="card mx-auto w-full max-w-md">
      <h1 className="text-2xl font-black tracking-tight text-slate-950">Đăng ký thành viên</h1>
      <p className="mt-2 text-sm font-semibold text-slate-500">Tạo hồ sơ thành viên đơn giản cho đội.</p>
      {!state.ok ? <ErrorMessage message={state.message} /> : null}
      <div className="mt-5 flex flex-col gap-4">
        <label className="field-label">
          Tên
          <input className="input" name="name" required />
        </label>
        <label className="field-label">
          Tên đăng nhập
          <input className="input" name="login_name" required />
        </label>
        <label className="field-label">
          Mã PIN
          <input className="input" name="pin_code" required type="password" />
        </label>
        <label className="field-label">
          Số điện thoại
          <input className="input" name="phone" />
        </label>
        <SubmitButton className="button-primary w-full">Đăng ký</SubmitButton>
        <Link className="text-center text-sm font-black text-indigo-600" href="/login">
          Đã có tài khoản? Đăng nhập
        </Link>
      </div>
    </form>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
      {message}
    </div>
  );
}
