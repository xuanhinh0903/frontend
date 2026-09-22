# Đánh giá Agent Base & Flow cập nhật

Ngày review: 2026-11-10  
Phạm vi: cấu hình agent (`.claude/` → `.cursor/`), rules/skills, docs đồng bộ với code, sẵn sàng chạy agent tự động.  
Mục tiêu: config phải **chính xác tuyệt đối** trước khi automation.

## 1. Kết luận ngắn

Base agent **có khung đúng hướng** (source of truth `.claude/`, sync gate, conventions rõ, auth reference tốt) nhưng **chưa sẵn sàng cho agent tự động tin cậy**.

Nguyên nhân chính:

1. Docs nguồn phủ nhận MSW trong khi code/test/E2E dựa vào MSW. -> done
2. Skill third-party (Vercel) always-apply, xung đột conventions repo.
3. Migration agent config còn dang dở trên git (nhiều file quan trọng chưa tracked).

Baseline đã chạy lúc review:

| Command             | Kết quả                       |
| ------------------- | ----------------------------- |
| `yarn agents:check` | In sync (106 generated files) |
| `yarn lint`         | Pass                          |
| `yarn test`         | 64/64 pass                    |
| `yarn format:check` | Pass                          |

---

## 2. Trạng thái hiện tại (ổn / giữ)

| Hạng mục                | Trạng thái | Ghi chú                                                                                 |
| ----------------------- | ---------- | --------------------------------------------------------------------------------------- |
| Sync script             | OK         | `scripts/sync-agents.mjs` + `yarn agents:sync` / `agents:check`                         |
| Gate trong `yarn check` | OK         | `lint && agents:check && build`                                                         |
| Conventions vs code     | OK         | Không relative import trong `src/`; `@/` + barrel; ESLint cấm inline fn / `@/app/store` |
| Auth reference          | OK         | login / refresh / logout / `callApi` / session storage nhất quán                        |
| `testing.md` vs tooling | OK         | Vitest projects, MSW `onUnhandledFrame` (MSW 3), Playwright e2e khớp                    |
| CI skeleton             | OK         | `.github/workflows/ci.yml` chạy `format:check`, `check`, `test:coverage`, e2e           |

---

## 3. Findings cần sửa (ưu tiên)

### P0 — Critical (agent sẽ làm sai)

| ID  | Finding                                                              | File / vùng                                                                                                                        | Tác hại nếu không sửa                                                                            |
| --- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| C1  | Docs nói “no mock server/backend” trong khi MSW là mock backend thật | `CLAUDE.md`, `.claude/rules/architecture.md` (và bản generate `.cursor/`)                                                          | Agent bỏ `src/mocks/handlers`, hardcode fetch, hoặc bịa mock server                              |
| C2  | ~~Skill Vercel always-apply xung đột repo rules~~ **DONE**           | Renamed to `REFERENCE.md`; sync forbids `AGENTS.md`; `CLAUDE.md` precedence + SKILL adapter                                        | Was: agent làm Next.js/RSC/SWR, “avoid barrels” trong khi repo bắt buộc barrel + Saga + Vite SPA |
| C3  | Agent base / mock / test chưa commit đủ                              | Untracked: `testing.md`, hầu hết skills, `.cursor/`, `scripts/`, `skills-lock.json`, `src/mocks/`, `src/test/`, `e2e/`, `.github/` | Clone sạch không có base agent đúng; CI/`agents:check` không phản ánh máy local                  |

### P1 — High (docs lệch → agent lệch nhẹ)

| ID  | Finding                                             | File / vùng                             | Tác hại nếu không sửa                                                        |
| --- | --------------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------- |
| H1  | Boot docs thiếu `enableMocking()`                   | `architecture.md`                       | Agent mount App trước MSW → race restoreSession / login fail trong mock mode |
| H2  | Mô tả `yarn check` thiếu `agents:check`             | `CLAUDE.md` Commands table, `README.md` | Agent bỏ qua sync gate khi verify                                            |
| H3  | `src/shared/auth/` rỗng                             | `src/shared/auth/`                      | Agent “điền” module lung tung vào chỗ trống                                  |
| H4  | Architecture map `shared/` phẳng, thiếu folder thật | `architecture.md`                       | Import sai path (`@/shared/lazyPage` thay vì `@/shared/routes`)              |

### P2 — Medium (làm sạch / cứng hóa)

| ID  | Finding                                             | File / vùng                                            | Tác hại nếu không sửa                                 |
| --- | --------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------- |
| M1  | ~~Chưa có rule precedence~~ **DONE**                | `CLAUDE.md` Conflicts + Agent config (`AGENTS.md` ban) | Repo rules thắng skill third-party                    |
| M2  | Commands table thiếu `agents:sync` / `agents:check` | `CLAUDE.md`                                            | Agent không biết workflow chỉnh rules                 |
| M3  | Conventions nhắc `shared/types/` chưa tồn tại       | `conventions.md`                                       | OK như convention tương lai; cần ghi rõ “tạo khi cần” |

---

## 4. Flow cập nhật (thứ tự bắt buộc)

```text
[0. Freeze] Không thêm feature mới cho đến khi P0 xong
        │
        ▼
[1. Sửa docs nguồn]  CLAUDE.md + .claude/rules/*
        │            (KHÔNG sửa tay .cursor/)
        ▼
[2. Sync]            yarn agents:sync && yarn agents:check
        │
        ▼
[3. Giảm nhiễu skill] Vercel AGENTS.md không always-apply;
        │             thêm precedence trong CLAUDE.md
        ▼
[4. Dọn code nhỏ]    Xóa/không để src/shared/auth rỗng
        │
        ▼
[5. Track đủ git]    Add rules/skills/.cursor/scripts/mocks/test/e2e/CI
        │
        ▼
[6. Verify]          yarn run check && yarn test
        │            (+ yarn test:e2e nếu đụng auth/routing/mock)
        ▼
[7. Commit]          Chỉ khi user yêu cầu; message tập trung "agent base accuracy"
```

### Chi tiết từng bước + lý do

#### Bước 1 — Sửa docs nguồn

| Việc                                                                                                     | File                                         | Lý do                       |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------------- | --------------------------- |
| Đổi “no mock server/backend” → backend thật qua `VITE_API_URL`; mock chỉ MSW khi `VITE_API_MOCK=true`    | `CLAUDE.md`, `.claude/rules/architecture.md` | Khớp README + code; hết C1  |
| Mô tả boot: `enableMocking()` rồi mới dynamic import App                                                 | `.claude/rules/architecture.md`              | Khớp `src/main.tsx`; hết H1 |
| `yarn check` = lint + agents:check + build; thêm `agents:sync` / `agents:check` vào bảng                 | `CLAUDE.md`, `README.md`                     | Hết H2/M2                   |
| Map `src/shared/` theo folder thật (`api/`, `routes/`, `pages/`, `components/`, `storage/`, …)           | `.claude/rules/architecture.md`              | Hết H4                      |
| Thêm dòng precedence: repo rules (architecture/conventions/testing) thắng skill third-party khi conflict | `CLAUDE.md`                                  | Hết một phần C2/M1          |

**Lý do làm trước:** `.cursor/` là generated. Sửa nguồn trước mới sync đúng; sửa tay `.cursor/` sẽ bị overwrite / fail `agents:check`.

#### Bước 2 — Sync

```bash
yarn agents:sync
yarn agents:check
```

**Lý do:** Cursor đọc `.cursor/rules` + `.cursor/skills`. Drift = agent Cursor và Claude Code nhận instruction khác nhau.

#### Bước 3 — Giảm nhiễu skill Vercel

| Việc                                                                                                   | Lý do                                                   |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| Không treat `AGENTS.md` trong skill Vercel như always-apply rule                                       | File này dạy Next.js/RSC/SWR/avoid-barrels — ngược repo |
| Giữ skill dạng on-demand (`SKILL.md` description) cho UI/perf                                          | Vẫn dùng được khi cần, không inject mọi turn            |
| (Tuỳ chọn) Thêm note trong `CLAUDE.md`: “ignore Next.js/RSC/SWR advice; follow conventions.md barrels” | Phòng Cursor vẫn auto-load `AGENTS.md`                  |

**Lý do:** Always-apply sai pattern nguy hiểm hơn thiếu skill — agent tự tin làm sai.

#### Bước 4 — Dọn nhỏ

| Việc                                                | Lý do                 |
| --------------------------------------------------- | --------------------- |
| Xóa `src/shared/auth/` nếu trống và không có plan   | Hết H3                |
| Hoặc thêm `index.ts` + note “reserved” nếu cố ý giữ | Tránh agent tự invent |

#### Bước 5 — Track đủ trên git

Phải vào repo (không chỉ local):

- `.claude/rules/testing.md`
- `.claude/skills/**` (kể cả third-party + impeccable)
- `.cursor/rules/**` + `.cursor/skills/**` (generated, cần cho Cursor clone)
- `scripts/sync-agents.mjs`
- `skills-lock.json`
- `src/mocks/**`, `src/test/**`, `e2e/**`, `playwright.config.ts`
- `.github/workflows/ci.yml`
- `.gitignore` (pattern `!.claude/rules/` / `!.claude/skills/` …)

**Lý do:** Agent automation trên máy khác / CI chỉ tin được những gì git có. Local “đúng” nhưng untracked = base giả.

#### Bước 6 — Verify

```bash
yarn run check    # lint + agents:check + tsc/build
yarn test
# yarn test:e2e  khi đụng mock/auth/routing
```

**Lý do:** Gate repo đã định nghĩa trong `review-code` / `implement-feature`. Pass mới coi là base khóa.

#### Bước 7 — Commit (chỉ khi được yêu cầu)

Gợi ý message:

```text
Align agent config with MSW mock and repo conventions.

Make CLAUDE/architecture describe the real mock path, sync Cursor
artifacts, and track the agent/test base so automation can trust a clean clone.
```

---

## 5. Checklist acceptance (Definition of Done)

Base agent được coi là “chính xác tuyệt đối” khi:

- [x] Không còn câu “no mock server/backend” trong `CLAUDE.md` / architecture (đã sửa: MSW là mock bắt buộc; không có Node mock server)
- [x] Architecture mô tả đúng boot + MSW + folder `shared/`
- [ ] `yarn agents:check` pass sau sync
- [x] Skill Vercel không còn luôn override conventions (`AGENTS.md` → `REFERENCE.md`, sync gate, precedence trong `CLAUDE.md`)
- [ ] Clone sạch: có rules, skills, sync script, mocks, tests
- [ ] `yarn run check` + `yarn test` pass trên clone sạch
- [ ] Agent chạy thử 1 task nhỏ (ví dụ “add endpoint X”) không đề xuất Next.js/SWR/relative import/bỏ barrel

---

## 6. Rủi ro nếu bỏ qua

| Bỏ qua | Hệ quả                                                               |
| ------ | -------------------------------------------------------------------- |
| C1     | Agent phá contract API / không thêm MSW handler                      |
| C2     | PR từ agent lệch architecture, tốn review/revert                     |
| C3     | “Chạy được trên máy tôi” — CI/agent cloud fail                       |
| H1     | Mock login flaky; khó debug session restore                          |
| H2     | Drift `.claude`/`.cursor` lọt qua vì agent không chạy `agents:check` |

---

## 7. Phạm vi ngoài review này

Không nằm trong flow trên (làm sau khi base khóa):

- Xác nhận backend contract thật với team BE (bảng README vẫn “assumed”)
- Bổ sung visual e2e baselines
- React Compiler / tối ưu perf ngoài conventions hiện tại
- Feature stock-market mới

---

## 8. Đề xuất thực thi tiếp theo

1. Thực hiện **Bước 1 → 4** (sửa docs + sync + giảm nhiễu skill + dọn `shared/auth`).
2. Thực hiện **Bước 5 → 6** (track git + verify).
3. Commit khi được yêu cầu (**Bước 7**).

File này là backlog điều khiển; sau mỗi bước, tick checklist mục 5.
