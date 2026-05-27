"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTodoAction } from "./actions";

type Company = { id: number; name: string };

type Props = {
  companies: Company[];
  defaultCompanyId?: number;
};

export function NewTodoModal({ companies, defaultCompanyId }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await createTodoAction(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
      }
    });
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ 새 To-do</Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-zinc-900">새 To-do 추가</h3>
                <p className="text-xs text-zinc-500 mt-1">관련 기업·마감일을 선택해서 할 일을 추가하세요</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-900 text-xl leading-none">
                ×
              </button>
            </div>

            <form action={onSubmit} className="space-y-3">
              <div>
                <Label htmlFor="title" className="text-xs font-medium text-zinc-700 mb-1 block">
                  제목 *
                </Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="예: ㈜그린텍 IR Deck 검토"
                  required
                  autoFocus
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-xs font-medium text-zinc-700 mb-1 block">
                  설명 (선택)
                </Label>
                <textarea
                  id="description"
                  name="description"
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                  placeholder="추가 메모"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="company_id" className="text-xs font-medium text-zinc-700 mb-1 block">
                    관련 기업
                  </Label>
                  <select
                    id="company_id"
                    name="company_id"
                    defaultValue={defaultCompanyId ?? "none"}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white"
                  >
                    <option value="none">— 없음</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="due_date" className="text-xs font-medium text-zinc-700 mb-1 block">
                    마감일 (선택)
                  </Label>
                  <Input id="due_date" name="due_date" type="date" />
                </div>
              </div>

              {error ? (
                <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
                  {error}
                </div>
              ) : null}

              <div className="flex gap-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="flex-1"
                  disabled={pending}
                >
                  취소
                </Button>
                <Button type="submit" className="flex-1" disabled={pending}>
                  {pending ? "추가 중..." : "추가"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
