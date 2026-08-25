# CI de segurança e integridade

O workflow `.github/workflows/security-ci.yml` roda em pushes para `main`, pull
requests e execução manual. O token começa com apenas `contents: read`; somente o
job CodeQL recebe `security-events: write`, necessário para publicar o resultado.
Nenhum secret do repositório é usado, portanto pull requests de forks executam os
mesmos checks sem receber credenciais privilegiadas.

## Gates

Os jobs independentes verificam lint, tipos/build, testes unitários, testes E2E
com PostgreSQL, schema Prisma, CVEs de produção, secrets, SAST TypeScript, imagem
de infraestrutura e SBOM CycloneDX. Auditoria e Trivy retornam erro para achados
`HIGH` ou `CRITICAL`. Gitleaks não publica comentários, resumo ou artifact e usa
redação para evitar propagar um eventual secret. Relatórios preservados contêm
somente metadados de CVEs/SARIF e componentes da SBOM, com retenção limitada.

Node `20.19.4`, pnpm `10.14.0`, Actions por SHA e PostgreSQL por digest tornam a
execução reproduzível. Dependências são instaladas com `--frozen-lockfile`. O
cache nativo do `setup-node` usa o hash de `pnpm-lock.yaml` e armazena apenas o
store de pacotes, nunca arquivos `.env` ou credenciais.

## Execução local

Use exatamente Node 20.19.4 e pnpm 10.14.0:

```bash
corepack enable
corepack prepare pnpm@10.14.0 --activate
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm build
pnpm test
DATABASE_URL='postgresql://validation:validation@localhost:5432/validation?sslmode=disable' pnpm prisma:validate
pnpm security:audit
```

Para E2E, inicie o PostgreSQL fixado, usando valores exclusivamente locais:

```bash
POSTGRES_USER=ci_user POSTGRES_PASSWORD=ci_local_only_password POSTGRES_DB=pesquisa docker compose up -d postgres
DATABASE_URL='postgresql://ci_user:ci_local_only_password@127.0.0.1:5432/pesquisa?sslmode=disable' pnpm test:e2e
docker compose down
```

Gitleaks, CodeQL e Trivy são executados pela CI em versões imutáveis. Para uma
checagem local equivalente de secrets, instale Gitleaks 8.x por uma fonte
confiável e execute `gitleaks git --redact --config .gitleaks.toml`. Para validar
filesystem/imagem com Trivy, use `trivy fs --config trivy.yaml .` e
`trivy image --severity HIGH,CRITICAL --exit-code 1 <imagem@sha256:digest>`.

## Atualizações e revisão

Dependabot agrupa apenas atualizações minor/patch de produção, desenvolvimento e
Actions; majors permanecem isoladas. Imagens também são atualizadas separadamente.
O arquivo `CODEOWNERS` atribui os arquivos críticos a `@0xguidev`.

No GitHub, configure a ruleset da branch `main` para exigir:

- pull request antes do merge;
- pelo menos uma aprovação e aprovação de Code Owner;
- descarte de aprovações quando novos commits forem enviados;
- todos os jobs de `Security and integrity CI` como status checks obrigatórios;
- branch atualizada antes do merge e bloqueio de bypass.

Essa configuração administrativa não pode ser garantida apenas por arquivos do
repositório e deve ser aplicada em **Settings > Rules > Rulesets**.
