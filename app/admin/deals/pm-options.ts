// "use server" 파일에서 export const 하면 Server Action 으로 변환돼서
// 런타임에 .includes is not a function 터짐. 그래서 별도 파일.
export const PM_OPTIONS = [
  "박대성",
  "강영환",
  "허유나",
  "이지우",
  "조상우",
  "권도준",
] as const;
export type PM = (typeof PM_OPTIONS)[number];
