# Logging, auditoria e métricas de segurança

## Formato e correlação

A aplicação escreve um objeto JSON por linha em `stdout`. Registros `operational`
descrevem saúde e falhas HTTP; registros `audit` representam ações de segurança e
mudanças de estado. `event_code` é estável e próprio para alertas. Toda requisição
recebe `X-Request-ID` (um valor válido enviado pelo cliente é preservado) e o mesmo
identificador aparece na resposta e nos eventos. Usuário, sessão, IP, e-mail, URL
externa e identificadores de recursos são pseudonimizados por HMAC.

Configure `LOG_PSEUDONYM_KEY` com um segredo exclusivo e rotacione-o de forma
planejada. Os logs nunca recebem body ou resposta HTTP completos. Campos chamados
senha, access/refresh token, Authorization, cookie, chaves JWT ou URL de banco são
removidos; tokens Bearer e credenciais em URLs também são redigidos como defesa em
profundidade.

Os códigos estão em `security-events.ts`. Entre eles estão login/refresh/logout,
replay, throttling, negação de autorização, mudanças de conta/pesquisa, ciclo de
relatórios e bloqueio de recursos externos pelo renderer. `principal_id`,
`request_id`, `resource_id`, status, duração, razão e escopo permitem investigar
brute force, replay, tentativa cross-tenant, SSRF e abuso de capacidade sem expor
dados de pesquisa.

## Métricas e alertas

`GET /metrics` expõe contadores Prometheus de falha de login, 401/403/429, replay,
geração e timeout de relatório, bloqueio SSRF e 5xx. Restrinja essa rota à rede do
coletor no ingress/service mesh; ela não contém identificadores.

Alertas mínimos sugeridos (ajuste à linha de base):

- `increase(login_failures_total[5m]) > 20` por instância, correlacionando eventos
  por `principal_id`/`ip_id`, indica brute force.
- `increase(refresh_replay_total[5m]) > 0` é crítico e exige investigar/revogar a
  conta afetada.
- `increase(http_403_total[10m]) > 30` com recursos distintos para o mesmo
  `principal_id` sugere enumeração ou tentativa cross-tenant.
- `increase(ssrf_block_total[5m]) > 0` deve abrir incidente de tentativa SSRF.
- taxa de `report_timeout_total / report_generation_total > 0.05` por 15 minutos,
  ou muitos `AUD.REPORT.CAPACITY_REJECTED`, indica abuso/saturação.
- `increase(http_5xx_total[5m]) > 10` ou crescimento sustentado de 429 requer
  investigação operacional.

## Retenção e acesso

Retenha auditoria por no mínimo 180 dias em armazenamento imutável, com 30 dias
pesquisáveis; retenha logs operacionais e métricas por no mínimo 30 dias. Requisitos
legais locais podem ampliar esses prazos. Restrinja leitura ao time de segurança e
operações, registre acessos, criptografe em trânsito/repouso e valide restauração e
alertas trimestralmente. Nunca replique logs para ambientes de desenvolvimento sem
anonimização adicional.
