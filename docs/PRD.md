# Documento de Requisitos do Produto (PRD)

| Campo | Valor |
| --- | --- |
| Versão | 0.1 |
| Status | Rascunho inicial |
| Última atualização | 30 de agosto de 2026 |

## Propósito do documento

Este Documento de Requisitos do Produto (PRD) descreve o sistema conforme ele está atualmente implementado. Seu objetivo é consolidar, de forma verificável, o comportamento existente do produto, seu escopo, suas regras e suas restrições, servindo de referência para análise, manutenção, validação e evolução.

Comportamentos não suportados pela implementação atual, hipóteses, propostas e funcionalidades futuras não devem ser apresentados como recursos existentes. Quando necessário, esses itens devem ser identificados explicitamente como limitações, questões em aberto ou possibilidades futuras.

## Fonte oficial de verdade

Este PRD é a fonte oficial de verdade documental sobre os requisitos e comportamentos do produto atualmente implementado. Em caso de divergência entre este documento e o comportamento verificável do sistema, a implementação em execução e seus testes constituem a evidência primária do estado atual; o PRD deve ser corrigido para refletir essa realidade. Nenhuma descrição neste documento deve antecipar ou presumir comportamento ainda não implementado.

## Sumário

1. [Visão geral do produto](#1-visão-geral-do-produto)
2. [Escopo](#2-escopo)
3. [Modelo de domínio](#3-modelo-de-domínio)
4. [Requisitos funcionais](#4-requisitos-funcionais)
5. [Regras de negócio](#5-regras-de-negócio)
6. [Segurança](#6-segurança)
7. [Relatórios](#7-relatórios)
8. [Catálogo de APIs](#8-catálogo-de-apis)
9. [Requisitos não funcionais](#9-requisitos-não-funcionais)
10. [Limitações](#10-limitações)
11. [Questões em aberto](#11-questões-em-aberto)
12. [Critérios de aceitação](#12-critérios-de-aceitação)

## 1. Visão geral do produto

### 1.1 Resumo executivo

O Sistema de Pesquisa é uma API de backend para criar, conduzir e analisar pesquisas. Por meio de endpoints HTTP, uma pessoa autenticada pode estruturar uma pesquisa com perguntas e opções de resposta, registrar entrevistas e suas respostas e consultar ou exportar resultados consolidados.

Este repositório contém somente o backend do produto. Ele implementa regras de domínio, persistência, autenticação, autorização por titularidade, geração de relatórios e observabilidade, mas não contém interface web, aplicativo móvel ou qualquer outra experiência visual para usuários finais. O uso das capacidades descritas depende de um cliente de API externo, que não faz parte deste repositório.

### 1.2 Problema resolvido

O sistema centraliza o ciclo operacional de pesquisas estruturadas que usam perguntas com opções predefinidas. Ele resolve a necessidade de:

- manter a definição de cada pesquisa e de seu questionário;
- registrar aplicações da pesquisa na forma de entrevistas;
- associar a cada entrevista as opções selecionadas para suas perguntas;
- recuperar os dados registrados com isolamento entre contas;
- transformar as respostas coletadas em relatórios simples ou cruzados.

Sem presumir uma interface de operação, a API oferece os recursos de backend necessários para que um cliente autenticado organize questionários, faça a coleta estruturada e consuma os resultados.

### 1.3 Objetivos do produto

- Permitir a criação e a manutenção de pesquisas compostas por perguntas numeradas e opções de resposta numeradas.
- Permitir que pesquisas sejam criadas já com sua estrutura completa ou complementadas por operações específicas sobre perguntas e opções.
- Registrar entrevistas vinculadas a uma pesquisa e respostas vinculadas às respectivas perguntas e opções.
- Permitir a consulta dos dados pertencentes à conta autenticada, incluindo pesquisas, entrevistas e respostas.
- Produzir análises simples e cruzadas a partir das respostas registradas, com retorno de dados e opções de exportação implementadas.
- Proteger os dados de cada titular por autenticação, sessões e verificação de propriedade dos recursos.

### 1.4 Usuários-alvo

Os usuários diretamente representados pela implementação são:

- **Titular de conta:** pessoa registrada que autentica na API e possui suas próprias pesquisas e seus respectivos dados.
- **Operador autenticado:** uso funcional do mesmo titular de conta ao configurar questionários, registrar entrevistas e consultar resultados por meio de um cliente de API.
- **Sistema integrador:** aplicação externa que consome os endpoints da API em nome de uma conta autenticada.

Embora o modelo de dados preveja os papéis `USER` e `ADMIN`, não foram identificados fluxos administrativos específicos neste repositório. Portanto, administrador não é descrito neste PRD como uma persona com capacidades próprias.

### 1.5 Jornadas primárias

#### 1.5.1 Acessar a API de forma autenticada

1. A pessoa cria uma conta com nome, e-mail e senha.
2. Autentica-se e recebe tokens de acesso e renovação.
3. Usa o token de acesso para chamar os endpoints protegidos.
4. Quando necessário, renova a sessão, encerra a sessão atual ou revoga todas as suas sessões.

#### 1.5.2 Criar e estruturar uma pesquisa

1. A conta autenticada cria uma pesquisa informando título, local e tipo.
2. Na mesma operação, pode enviar perguntas, opções e referências de regras condicionais; alternativamente, pode manter perguntas e opções pelos endpoints específicos existentes.
3. A API persiste a estrutura sob a titularidade da conta autenticada.
4. A conta pode consultar, editar ou excluir os recursos que lhe pertencem.

#### 1.5.3 Conduzir uma pesquisa

1. Um cliente autenticado obtém a pesquisa e sua estrutura.
2. O cliente envia uma nova entrevista para a pesquisa, acompanhada das opções escolhidas para as perguntas respondidas.
3. A API registra a entrevista e as respostas sob a titularidade da conta autenticada.
4. A conta pode consultar entrevistas de uma pesquisa, consultar respostas e corrigir ou excluir respostas pelos endpoints implementados.

O participante da pesquisa não é uma identidade nem um ator autenticável no modelo atual. A condução é uma operação realizada pelo cliente autenticado da conta; não existe fluxo direto de participação anônima ou pública.

#### 1.5.4 Analisar resultados

1. A conta autenticada solicita um relatório de uma pesquisa própria.
2. A API consolida as respostas em relatório simples ou cruzado.
3. O resultado pode ser consumido como dados pela API ou, conforme o tipo de relatório, baixado em DOCX; o relatório simples também pode ser baixado em PDF.

## 2. Escopo

### 2.1 Natureza e limite do repositório

O escopo deste repositório é exclusivamente uma aplicação de backend exposta como API HTTP. A implementação utiliza NestJS, persiste dados em PostgreSQL por meio do Prisma e entrega respostas estruturadas ou arquivos gerados nos endpoints correspondentes.

Não há frontend neste repositório. Menus, páginas, formulários, visualizações gráficas interativas e experiências de navegação não devem ser inferidos a partir dos endpoints ou descritos como funcionalidades existentes. Da mesma forma, a presença de campos como `slug` não representa a existência de páginas ou links públicos.

### 2.2 Capacidades atualmente implementadas

#### Contas e sessões

- cadastro de conta com nome, e-mail e senha;
- autenticação por credenciais e emissão de token de acesso e token de renovação;
- rotação do token de renovação;
- encerramento da sessão atual e revogação de todas as sessões da conta;
- edição e exclusão da própria conta;
- proteção global dos endpoints, ressalvadas as rotas explicitamente públicas, como cadastro, autenticação, renovação e métricas.

#### Pesquisas e questionários

- criação de pesquisa com título, local e tipo;
- criação completa de pesquisa com perguntas, opções e regras condicionais no mesmo payload;
- listagem paginada das pesquisas da conta autenticada;
- consulta de pesquisa por identificador;
- edição e exclusão de pesquisa;
- criação, consulta, listagem por pesquisa, edição e exclusão de perguntas;
- criação, consulta, listagem por pergunta, edição e exclusão de opções de resposta;
- armazenamento de regras condicionais que referenciam uma pergunta e uma opção anteriores pelos respectivos números durante a montagem da pesquisa.

#### Coleta de respostas

- criação de entrevista vinculada a uma pesquisa da conta autenticada;
- envio de um conjunto de respostas junto à criação da entrevista;
- criação individual de resposta, associando entrevista, pergunta e opção de resposta;
- consulta individual de entrevista ou resposta;
- listagem paginada de entrevistas por pesquisa e listagem de respostas por entrevista;
- edição e exclusão de respostas;
- exclusão de entrevistas.

#### Análise e relatórios

- geração de relatório simples como dados retornados pela API;
- geração de relatório cruzado como dados retornados pela API;
- exportação de relatórios simples e cruzados em DOCX;
- exportação de relatório simples em PDF;
- limitação e proteção operacional das rotas de geração de relatórios.

#### Controles transversais

- validação de entradas nos controladores HTTP;
- autenticação com JWT e sessões persistidas;
- limitação de taxa para superfícies públicas e operações protegidas configuradas;
- isolamento dos recursos de pesquisa pela conta proprietária;
- registros e métricas de segurança e observabilidade;
- exclusão em cascata de dados dependentes em relações configuradas no banco de dados.

### 2.3 Itens explicitamente fora do escopo atual

Os itens abaixo não são capacidades existentes deste repositório:

- frontend web, aplicativo móvel ou qualquer interface gráfica;
- participação anônima em pesquisas;
- links públicos para preenchimento ou divulgação de pesquisas;
- identificação, cadastro ou autenticação do participante entrevistado;
- autopreenchimento direto pelo público sem uma conta autenticada operando a API;
- colaboração entre contas, equipes, organizações, convites, compartilhamento ou edição simultânea;
- transferência de propriedade de pesquisas ou acesso de uma conta aos recursos de outra;
- fluxos administrativos dedicados, como painel administrativo, gestão de usuários por administradores, moderação ou aprovação de pesquisas;
- publicação, agendamento, abertura ou encerramento de períodos de coleta;
- distribuição de pesquisas por e-mail, redes sociais ou outros canais;
- notificações e automações externas;
- construtor visual de questionários ou painel visual de análise;
- importação de participantes ou respostas por arquivo;
- exportação de dados brutos em CSV ou planilha;
- relatório cruzado em PDF;
- respostas em texto livre, múltipla escolha em uma mesma pergunta ou anexos, pois a resposta persistida referencia uma única opção predefinida;
- execução de comportamento futuro ou apenas proposto, ainda que o modelo contenha campos que possam vir a sustentá-lo.

### 2.4 Premissas documentais

- “Usuário” significa a conta autenticada que possui e opera os recursos, não a pessoa entrevistada.
- “Conduzir uma pesquisa” significa registrar, por um cliente autenticado, uma entrevista e suas respostas na API; não significa disponibilizar um formulário público.
- “Entrevista” representa uma aplicação da pesquisa e agrupa respostas, sem armazenar identidade ou perfil próprio do participante.
- “Resposta” representa a seleção de uma opção predefinida para uma pergunta dentro de uma entrevista.
- “Pesquisa própria” é aquela cujo identificador de proprietário corresponde à conta autenticada.
- Clientes externos são responsáveis pela apresentação da experiência ao operador e por transformar suas interações em chamadas válidas à API.
- A documentação considera implementada apenas a capacidade comprovável no código, no esquema de dados, nas migrações ou nos testes existentes.

### 2.5 Fronteiras da implementação

- A API é a fronteira de interação do produto neste repositório; qualquer interface consumidora é externa e não está especificada aqui.
- As operações de domínio, salvo as rotas marcadas como públicas, exigem uma sessão autenticada válida.
- A propriedade dos dados é vinculada a uma única conta. O escopo atual não define acesso compartilhado nem permissões por recurso entre contas.
- A estrutura de resposta é baseada em opções predefinidas. Não se deve inferir suporte a outros formatos de pergunta ou resposta.
- Regras condicionais fazem parte da estrutura persistida do questionário. Este documento não presume uma interface de exibição condicional nem afirma comportamento de navegação que não esteja implementado no backend.
- Os relatórios refletem os dados persistidos para a pesquisa solicitada e só podem ser gerados no âmbito da conta proprietária.
- PostgreSQL, Prisma, NestJS e os mecanismos de geração de DOCX/PDF são limites técnicos da implementação atual, não compromissos de compatibilidade com outros armazenamentos, frameworks ou formatos.
- Métricas e controles operacionais são recursos de infraestrutura da API; sua presença não constitui um fluxo administrativo de produto.

## 3. Modelo de domínio

> A preencher com entidades, relacionamentos, conceitos e terminologia observados na implementação atual.

## 4. Requisitos funcionais

> A preencher com requisitos funcionais verificáveis e rastreáveis ao comportamento existente.

## 5. Regras de negócio

> A preencher com validações, condições, cálculos, restrições e fluxos de decisão implementados.

## 6. Segurança

> A preencher com mecanismos e requisitos de autenticação, autorização, proteção de dados, auditoria e demais controles atualmente implementados.

## 7. Relatórios

> A preencher com os relatórios, indicadores, filtros, formatos e regras de acesso disponíveis no sistema atual.

## 8. Catálogo de APIs

> A preencher com endpoints, métodos, parâmetros, respostas, autenticação e erros das APIs atualmente disponíveis.

## 9. Requisitos não funcionais

> A preencher com requisitos verificáveis de desempenho, disponibilidade, confiabilidade, observabilidade, acessibilidade, compatibilidade e manutenibilidade existentes.

## 10. Limitações

> A preencher com limitações conhecidas e comportamentos que não são suportados pela implementação atual.

## 11. Questões em aberto

> A preencher com dúvidas que dependem de investigação ou decisão. Itens desta seção não representam funcionalidades existentes ou aprovadas.

## 12. Critérios de aceitação

> A preencher com critérios objetivos para validar os requisitos documentados contra o sistema atualmente implementado.
