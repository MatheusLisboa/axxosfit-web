# UI — Figma Make (fonte da verdade)

O visual do app vem do **Figma Make**, não do layout legado do GitHub.

- **Arquivo:** [SaaS Fitness App Design](https://www.figma.com/make/8rft0xtK5ogUf5dVpoEr6x/SaaS-Fitness-App-Design)
- **Código exportado:** `src/figma/` (componentes, páginas, tokens)
- **Tokens:** `src/figma/styles/theme.css` + `src/index.css`

## O que usa Figma

| Fluxo | Entrada |
|--------|---------|
| Login | `src/figma/FigmaAuthBridge.tsx` |
| Personal logado | `src/figma/TrainerFigmaApp.tsx` |
| Aluno logado | `src/figma/StudentFigmaApp.tsx` |

## O que não mudou

- `src/services/store.tsx` — Supabase Auth, dados, Mercado Pago
- `src/services/billing.ts`, `subscription.ts`
- `CheckoutPage`, `LandingPage`, `PasswordResetScreen`

## Legado (não usado no shell principal)

`src/components/TrainerDashboard.tsx`, `StudentDashboard.tsx`, `components/layout/`, `components/ui/` — mantidos só para referência ou telas auxiliares; o shell ativo é `src/figma/`.

## Re-sincronizar com Figma

1. Autentique o MCP Figma no Cursor.
2. Peça: *"exporte de novo o Make 8rft0xtK5ogUf5dVpoEr6x para src/figma"*.
