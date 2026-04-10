# Contributing to EHealth

Thank you for your interest in contributing! This guide will help you get started.

## 🛠 Development Setup

```bash
# Clone & install
git clone https://github.com/minhquan2504/EHealth_Website.git
cd EHealth_Website
npm install

# Environment
cp .env.example .env.local

# Run
npm run dev
```

## 📐 Code Style

- **TypeScript** — strict mode, no `any` types
- **Constants-driven** — never hard-code routes, roles, statuses, colors, or API endpoints
- **Feature-based modules** — keep domain logic in `src/features/[feature]/`
- **Loading / Empty / Error states** — every data-fetching component must handle all three

## 🌿 Branch Naming

| Type | Format | Example |
|------|--------|---------|
| Feature | `feat/short-description` | `feat/video-consultation` |
| Bug fix | `fix/short-description` | `fix/queue-sorting` |
| Refactor | `refactor/short-description` | `refactor/service-layer` |
| Docs | `docs/short-description` | `docs/api-reference` |

## 📝 Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

# Examples
feat(doctor): add examination form with ICD-10 lookup
fix(auth): resolve token refresh race condition
docs(readme): update getting started section
refactor(services): migrate to centralized endpoint config
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## 🔀 Pull Request Process

1. Create a feature branch from `main`
2. Make your changes following the code style guide
3. Ensure `npm run lint` passes with no errors
4. Write a clear PR description explaining **what** and **why**
5. Request review from a maintainer

## 📁 Where to Put Things

| What | Where |
|------|-------|
| New page | `src/app/[portal]/[page]/page.tsx` |
| Shared component | `src/components/common/` |
| Portal-specific component | `src/components/portal/` or `src/components/admin/` |
| Feature module | `src/features/[feature]/` |
| API endpoint | `src/api/endpoints.ts` |
| Route constant | `src/constants/routes.ts` |
| Service (API call) | `src/services/[domain]Service.ts` |
| TypeScript types | `src/types/` or `src/features/[feature]/types/` |
