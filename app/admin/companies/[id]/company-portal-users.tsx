"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, X, Users } from "lucide-react";
import { attachUserToCompany, detachUserFromCompany } from "./portal-actions";

export type PortalUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
};

export function CompanyPortalUsers({
  companyId,
  users,
}: {
  companyId: number;
  users: PortalUser[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const attach = () => {
    const e = email.trim().toLowerCase();
    if (!e) {
      setError("이메일을 입력해주세요.");
      return;
    }
    setError(null);
    start(async () => {
      const res = await attachUserToCompany(companyId, e);
      if (res.error) {
        setError(res.error);
        return;
      }
      setEmail("");
      setOpen(false);
      router.refresh();
    });
  };

  const detach = (userId: string, name: string) => {
    if (!confirm(`${name}님의 포털 접근을 해제하시겠습니까?`)) return;
    start(async () => {
      const res = await detachUserFromCompany(userId);
      if (res.error) {
        alert(res.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-900 inline-flex items-center gap-1.5">
          <Users className="w-4 h-4 text-brand" />
          기업 포털 접근 사용자
          <span className="text-[10.5px] text-zinc-400 font-normal">· {users.length}명</span>
        </h3>
        {!open ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1 h-7 px-2.5 rounded border border-zinc-300 text-[11.5px] text-zinc-700 hover:border-brand hover:text-brand"
          >
            <UserPlus className="w-3 h-3" /> 사용자 추가
          </button>
        ) : null}
      </div>

      {open ? (
        <div className="mb-3 p-3 rounded-lg bg-brand/5 border border-brand/15">
          <div className="text-[11px] font-semibold text-brand mb-2">
            Google 로그인 가능한 이메일 입력
          </div>
          <div className="flex items-center gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") attach(); }}
              autoFocus
              placeholder="ceo@company.com"
              disabled={pending}
              className="flex-1 h-8 px-2 rounded border border-zinc-300 text-[12.5px] focus:outline-none focus:border-brand"
            />
            <button
              type="button"
              onClick={attach}
              disabled={pending}
              className="h-8 px-3 rounded bg-brand text-white text-[12px] font-medium hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "..." : "연결"}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setEmail(""); setError(null); }}
              disabled={pending}
              className="h-8 px-2 rounded text-[12px] text-zinc-500 hover:text-zinc-900"
            >
              취소
            </button>
          </div>
          {error ? <div className="text-[11.5px] text-rose-600 mt-1.5">{error}</div> : null}
          <div className="text-[10.5px] text-zinc-500 mt-2">
            해당 이메일로 먼저 하임벤처투자 ERP(/)에 Google 로그인해둬야 합니다.
          </div>
        </div>
      ) : null}

      {users.length === 0 ? (
        <div className="text-[12px] text-zinc-400 py-3 text-center">
          포털 접근 가능한 사용자가 없습니다
        </div>
      ) : (
        <ul className="space-y-1.5">
          {users.map((u) => (
            <li key={u.id} className="flex items-center gap-2 p-2 rounded-lg bg-zinc-50/60 border border-zinc-100">
              <div className="w-7 h-7 rounded-full bg-brand/10 text-brand flex items-center justify-center text-[11.5px] font-semibold shrink-0">
                {(u.name || u.email).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-medium text-zinc-900 truncate">
                  {u.name || "(이름 없음)"}
                </div>
                <div className="text-[11px] text-zinc-500 truncate">{u.email}</div>
              </div>
              <button
                type="button"
                onClick={() => detach(u.id, u.name || u.email)}
                disabled={pending}
                className="p-1 rounded hover:bg-white text-zinc-400 hover:text-rose-600"
                title="연결 해제"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
