"use client";

import { useTransition, useState } from "react";
import { toggleTodoStatusAction } from "./actions";

type Props = {
  todoId: number;
  currentStatus: string;
};

export function TodoCheckbox({ todoId, currentStatus }: Props) {
  const [pending, startTransition] = useTransition();
  const [localChecked, setLocalChecked] = useState(currentStatus === "done");

  const onToggle = () => {
    const newChecked = !localChecked;
    setLocalChecked(newChecked); // 낙관적 UI
    startTransition(async () => {
      const result = await toggleTodoStatusAction(todoId, currentStatus);
      if (result.error) {
        setLocalChecked(!newChecked); // 롤백
        alert("처리 실패: " + result.error);
      }
    });
  };

  return (
    <input
      type="checkbox"
      checked={localChecked}
      onChange={onToggle}
      disabled={pending}
      className="rounded border-zinc-300 cursor-pointer"
    />
  );
}
