# Axon App — Protótipo do Aluno | Nexus

Protótipo front-end do **Axon App**, serviço da **Nexus**, focado na experiência do aluno para registro diário de estado emocional por meio da metáfora do clima.

Este diretório contém uma implementação navegável do fluxo do aluno, construída com **HTML, CSS e JavaScript puro**, sem framework, bundler ou backend. O protótipo inclui o check-in emocional, animações específicas para cada estado climático, comentário opcional, confirmação do registro, pedido de conversa com o psicólogo, histórico protegido por PIN e perfil do aluno.

> **Status do projeto:** protótipo funcional de interface e motion, adequado para demonstração, validação de UX e integração em materiais de pitch. **Não é uma aplicação pronta para produção** e não deve receber dados reais de alunos sem a implementação das camadas de segurança, autenticação, persistência, consentimento e backend descritas neste documento.

> O histórico de implementação de UI e a dívida visual atual são acompanhados em `docs/UI_PROGRESS.md`. Agentes que forem trabalhar na UI devem ler esse arquivo antes de qualquer alteração e adicionar uma entrada ao final do trabalho.

---

## Sumário

1. [Contexto do produto](#1-contexto-do-produto)
2. [Objetivo desta pasta](#2-objetivo-desta-pasta)
3. [Stack](#3-stack)
4. [Estrutura de diretórios](#4-estrutura-de-diretórios)
5. [Como executar](#5-como-executar)
6. [Dependências e requisitos](#6-dependências-e-requisitos)
7. [Arquitetura geral](#7-arquitetura-geral)
8. [Fluxos disponíveis](#8-fluxos-disponíveis)
9. [Estados climáticos](#9-estados-climáticos)
10. [Arquitetura do HTML](#10-arquitetura-do-html)
11. [Arquitetura do CSS](#11-arquitetura-do-css)
12. [Arquitetura do JavaScript](#12-arquitetura-do-javascript)
13. [Design System](#13-design-system)
14. [Motion e animações](#14-motion-e-animações)
15. [Acessibilidade](#15-acessibilidade)
16. [Responsividade](#16-responsividade)
17. [Dados de demonstração](#17-dados-de-demonstração)
18. [Segurança e limitações do protótipo](#18-segurança-e-limitações-do-protótipo)
19. [Integração com a landing page do pitch](#19-integração-com-a-landing-page-do-pitch)
20. [Diretrizes para evolução do código](#20-diretrizes-para-evolução-do-código)
21. [Checklist de QA](#21-checklist-de-qa)
22. [Troubleshooting](#22-troubleshooting)
23. [Deploy](#23-deploy)
24. [Próximos passos recomendados](#24-próximos-passos-recomendados)
25. [Créditos](#25-créditos)

---

# 1. Contexto do produto

O **Axon App** é uma das ferramentas do ecossistema Nexus voltadas ao acompanhamento emocional no ambiente escolar.

A proposta da experiência do aluno não é transformar sentimentos em diagnóstico nem classificar emoções como “certas” ou “erradas”. O check-in utiliza uma metáfora simples e acolhedora:

> **“Como está seu céu hoje?”**

O aluno escolhe entre cinco estados climáticos e pode complementar o registro com suas próprias palavras. Quando precisar de apoio mais imediato, também existe um fluxo dedicado para sinalizar que deseja conversar com o profissional responsável.

A interface do aluno prioriza:

- simplicidade;
- acolhimento;
- linguagem não diagnóstica;
- baixo atrito para registrar o dia;
- privacidade do histórico;
- acesso rápido ao pedido de conversa;
- leitura visual clara;
- acessibilidade;
- motion com função narrativa.

---

# 2. Objetivo desta pasta

Esta pasta representa a **experiência funcional do aluno** em formato de protótipo web.

Ela pode ser utilizada para:

- validar o fluxo de check-in;
- demonstrar o produto em reuniões;
- apresentar o Axon a pais e escolas;
- servir como referência de comportamento para implementação futura;
- testar microinterações e animações;
- integrar uma demonstração real do produto em uma landing page;
- gravar trechos para vídeos e motions;
- validar o Design System em contexto real.

Ela **não deve ser interpretada como backend, sistema de autenticação ou aplicação clínica pronta**.

---

# 3. Stack

A implementação atual utiliza apenas tecnologias web nativas:

- **HTML5** — estrutura e semântica;
- **CSS3** — layout, tokens, estados visuais, responsividade e animações;
- **JavaScript Vanilla** — estado, navegação, interação e renderização dinâmica;
- **SVG** — ícones e ilustrações climáticas;
- **Google Fonts** — carregamento da família Nunito no protótipo.

Não existe, nesta versão:

- React;
- Vue;
- Angular;
- Next.js;
- Vite;
- Webpack;
- npm obrigatório;
- banco de dados;
- API;
- autenticação real;
- servidor de aplicação.

A simplicidade da stack é intencional para facilitar demonstração, iteração visual e integração em uma landing estática.

---

# 4. Estrutura de diretórios

A estrutura esperada é:

```text
.
├── .claude/
│   └── ...
│
├── assets/
│   ├── icons/
│   │   ├── bell.svg
│   │   ├── clock.svg
│   │   ├── delete.svg
│   │   ├── house.svg
│   │   ├── lock.svg
│   │   ├── step-dot.svg
│   │   └── user-round.svg
│   │
│   ├── img/
│   │   └── avatar-maria.jpg
│   │
│   └── weather/
│       ├── clear-64.svg
│       ├── clear.svg
│       ├── cloudy.svg
│       ├── partly-cloud.svg
│       ├── partly-sun.svg
│       ├── partly.svg
│       ├── rain-cloud.svg
│       ├── storm-bolt.svg
│       ├── storm-cloud.svg
│       └── storm.svg
│
├── scripts/
│   └── app.js
│
├── styles/
│   └── app.css
│
├── theme/
│   ├── primitives.css
│   ├── semantic.css
│   ├── typography-app.css
│   └── illustration.css
│
├── index.html
└── README.md
```

## 4.1 `.claude/`

Diretório reservado ao fluxo de trabalho com Claude/Claude Design, quando utilizado pelo time.

Ele **não faz parte do runtime do navegador** a menos que algum processo externo do projeto dependa dele.

Como o conteúdo interno dessa pasta não faz parte desta documentação, qualquer configuração adicionada nela deve ser documentada separadamente caso passe a ser necessária para desenvolvimento ou deploy.

## 4.2 `assets/icons/`

Contém os ícones da interface.

Os SVGs são utilizados como **CSS masks** em `app.css`. Isso permite que a cor do ícone venha do token `currentColor`, em vez de depender de uma cor fixa embutida no arquivo.

Principais usos:

| Arquivo | Uso |
|---|---|
| `bell.svg` | notificações |
| `house.svg` | aba Início |
| `clock.svg` | aba Histórico |
| `user-round.svg` | aba Perfil |
| `lock.svg` | tela protegida do histórico |
| `delete.svg` | apagar dígito do PIN |
| `step-dot.svg` | asset de apoio do sistema/protótipo |

## 4.3 `assets/img/`

Contém imagens rasterizadas utilizadas no protótipo.

Atualmente:

- `avatar-maria.jpg` — avatar ilustrativo da aluna Maria.

Não utilizar fotografia real de aluno em demonstrações públicas sem autorização e política de uso adequada.

## 4.4 `assets/weather/`

Contém as ilustrações dos cinco estados climáticos e versões separadas em camadas quando a animação exige movimento independente.

Arquivos como `partly-sun.svg` + `partly-cloud.svg` e `storm-cloud.svg` + `storm-bolt.svg` existem para permitir que partes distintas da mesma ilustração tenham movimentos diferentes sem quebrar a composição original.

## 4.5 `theme/`

É a camada de **Design System**.

O `index.html` importa os arquivos nesta ordem:

```html
<link rel="stylesheet" href="theme/primitives.css" />
<link rel="stylesheet" href="theme/semantic.css" />
<link rel="stylesheet" href="theme/typography-app.css" />
<link rel="stylesheet" href="theme/illustration.css" />
<link rel="stylesheet" href="styles/app.css" />
```

A ordem é importante:

1. primitivas;
2. tokens semânticos;
3. tipografia da superfície do app;
4. tokens das ilustrações;
5. CSS específico do protótipo.

O arquivo `app.css` deve **consumir tokens**, não substituir a camada temática.

## 4.6 `styles/app.css`

Contém:

- estrutura do protótipo;
- componentes visuais;
- estados;
- responsividade;
- animações;
- motion dos climas;
- tela de confirmação;
- histórico;
- keypad;
- modal de SOS;
- regras de acessibilidade visual.

## 4.7 `scripts/app.js`

Contém toda a lógica interativa do protótipo.

Responsabilidades principais:

- estado climático atual;
- renderização das ilustrações;
- slider;
- navegação por abas;
- comentário opcional;
- confirmação do registro;
- histórico;
- PIN;
- SOS;
- acessibilidade dinâmica;
- atualização da sequência de registros.

## 4.8 `index.html`

É o ponto de entrada da aplicação.

Contém todas as telas do protótipo em uma única página e utiliza atributos `data-*` para controlar visualização, estado e ações.

---

# 5. Como executar

Não há etapa de build.

## Opção A — VS Code + Live Server

1. Abra a pasta no VS Code.
2. Instale a extensão **Live Server**, caso ainda não tenha.
3. Clique com o botão direito em `index.html`.
4. Escolha **Open with Live Server**.

## Opção B — servidor local com Python

Na raiz da pasta:

```bash
python -m http.server 5500
```

Depois acesse:

```text
http://localhost:5500
```

Em algumas instalações o comando pode ser:

```bash
python3 -m http.server 5500
```

## Opção C — abrir `index.html` diretamente

O protótipo pode funcionar em muitos navegadores abrindo o arquivo diretamente, porém o uso de um servidor local é recomendado para evitar diferenças de comportamento entre browsers e facilitar debugging.

---

# 6. Dependências e requisitos

## 6.1 Navegador

Recomendado utilizar versões modernas de:

- Google Chrome;
- Microsoft Edge;
- Firefox;
- Safari.

A implementação depende de recursos atuais como:

- CSS Custom Properties;
- `pointer` events;
- `Element.closest()`;
- `dataset`;
- `requestAnimationFrame()`;
- CSS masks;
- `env(safe-area-inset-*)`;
- `prefers-reduced-motion`.

## 6.2 Internet

A fonte Nunito é carregada pelo Google Fonts:

```html
https://fonts.googleapis.com
https://fonts.gstatic.com
```

Sem internet, o browser utilizará a pilha de fallback definida no tema.

Para uma versão totalmente offline, a fonte deve ser hospedada pelo próprio projeto respeitando sua licença. Não é necessário alterar a lógica do app para isso.

## 6.3 Arquivos obrigatórios

O protótipo depende da estrutura relativa de pastas.

Mover apenas `index.html`, `app.css` ou `app.js` isoladamente quebrará referências de:

- tema;
- ícones;
- clima;
- avatar.

Mantenha a estrutura do projeto ao copiar ou publicar.

---

# 7. Arquitetura geral

A aplicação é uma **SPA simples sem framework**.

Não há mudança real de rota. As telas permanecem no DOM e a navegação é feita mostrando ou ocultando seções.

Visão simplificada:

```text
index.html
   │
   ├── Screen: Início
   │      ├── View: Picker
   │      ├── View: Comment
   │      └── View: Done
   │
   ├── Screen: Histórico
   │      ├── Vault: Lock
   │      └── Vault: List
   │
   ├── Screen: Perfil
   │
   ├── Tab Bar
   │
   └── SOS Sheet
          │
          └── textarea + confirmação
```

O JavaScript mantém um estado simples em memória:

```text
state
├── step
├── registered
├── pin
├── unlocked
├── view
└── history[]
```

A principal decisão arquitetural é que **o clima selecionado possui uma única fonte de verdade**.

`state.step` define simultaneamente:

- ilustração grande;
- label textual;
- slider;
- fill do slider;
- botão climático selecionado;
- `aria-valuenow`;
- `aria-valuetext`;
- fundo climático do card;
- estado utilizado no registro.

Isso evita estados inconsistentes entre componentes.

---

# 8. Fluxos disponíveis

# 8.1 Fluxo principal de check-in

```text
Início
  ↓
Escolha do clima
  ↓
Registrar meu dia
  ↓
Comentário opcional
  ├── Enviar comentário
  └── Pular
  ↓
Confirmação
```

O registro só é efetivamente salvo no estado local quando a função `commit()` é chamada.

Isso acontece após:

- enviar comentário; ou
- pular a etapa de comentário.

Clicar apenas em **Registrar meu dia** não grava o registro imediatamente.

## 8.2 Seleção climática

O usuário pode alterar o clima por:

- clique/toque em um dos cinco ícones;
- clique/toque no slider;
- arrasto do slider;
- teclado.

Teclas suportadas:

```text
ArrowLeft   → estado anterior
ArrowDown   → estado anterior
ArrowRight  → próximo estado
ArrowUp     → próximo estado
Home        → primeiro estado
End         → último estado
```

## 8.3 Comentário opcional

Após clicar em **Registrar meu dia**, a etapa de comentário sobe sobre a tela anterior.

O aluno pode:

- escrever uma mensagem e enviar;
- pular a etapa.

Enquanto o campo estiver vazio:

- o botão de envio permanece desabilitado;
- uma mensagem explica por que o botão não está disponível.

## 8.4 Confirmação

Após o commit:

- o estado do dia entra no histórico;
- a ilustração correspondente aparece;
- a tela executa uma coreografia de confirmação;
- a sequência de dias é atualizada;
- o aluno pode retornar ou alterar o registro.

## 8.5 Alteração do registro

A ação **Mudar meu registro** retorna ao seletor.

Se o dia atual já estiver na primeira posição do histórico, um novo commit do mesmo dia substitui o estado existente em vez de duplicar a data.

## 8.6 Pedido de conversa / SOS

O botão **Preciso conversar agora** abre uma bottom sheet.

Fluxo:

```text
Preciso conversar agora
        ↓
Bottom sheet
        ↓
Aluno escreve contexto
        ↓
Enviar mensagem
        ↓
Confirmação simulada
```

O botão de envio nasce desabilitado e só é liberado quando existe conteúdo textual.

Na implementação atual, **nenhuma mensagem é realmente enviada**. O comportamento é apenas de protótipo.

## 8.7 Histórico

O histórico possui uma trava por PIN para demonstrar privacidade local.

PIN de demonstração:

```text
1234
```

O teclado possui:

- números de 0 a 9;
- apagar último dígito;
- validação automática ao quarto dígito.

Não existe botão “Confirmar”. O quarto número já dispara a validação.

Ao sair da aba Histórico, a aplicação volta a bloquear o conteúdo quando:

```js
RELOCK_ON_EXIT = true;
```

## 8.8 Esqueci minha senha

No protótipo, não existe recuperação automatizada.

A ação direciona o aluno a procurar a psicóloga responsável, reforçando que o fluxo de recuperação deve envolver uma pessoa e não um mecanismo inseguro no cliente.

## 8.9 Perfil

A aba Perfil demonstra:

- nome;
- turma;
- psicóloga responsável;
- próximo encontro;
- sequência de registros;
- atalho para pedido de conversa.

---

# 9. Estados climáticos

Os estados são definidos em `app.js` nesta ordem:

```text
1. Tempestade
2. Chuva
3. Nublado
4. Sol entre nuvens
5. Céu limpo
```

A aplicação inicia em:

```text
Nublado
```

O estado inicial é calculado pelo meio da lista:

```js
var START = Math.floor(WEATHER.length / 2);
```

A decisão evita iniciar o usuário automaticamente em um extremo positivo ou negativo.

## 9.1 Significado visual

A progressão não utiliza vermelho como indicador de “problema”.

O peso emocional é construído pela própria linguagem climática:

- céu limpo → mais luz e abertura;
- sol entre nuvens → luz parcial;
- nublado → atmosfera mais fechada;
- chuva → tom mais frio e denso;
- tempestade → azul-noite e relâmpago.

O significado nunca depende apenas da cor. O nome do estado permanece disponível em texto e em atributos de acessibilidade.

---

# 10. Arquitetura do HTML

# 10.1 `device`

```html
<div class="device">
```

Representa o aparelho durante a demonstração em desktop.

Em telas menores, o CSS remove a moldura e faz a experiência ocupar toda a viewport.

## 10.2 `app`

```html
<div class="app">
```

Container principal da aplicação.

## 10.3 Screens

Cada aba principal é uma `.screen`:

```html
<section class="screen" data-screen="inicio">
<section class="screen" data-screen="historico">
<section class="screen" data-screen="perfil">
```

A tela ativa recebe:

```html
data-active
```

## 10.4 Views da tela Início

Dentro de Início existem três views:

```html
data-view="picker"
data-view="comment"
data-view="done"
```

A troca é controlada por `setView()`.

## 10.5 Atributos de ação

Os botões usam um padrão declarativo:

```html
data-action="register"
data-action="sos"
data-action="comment-send"
data-action="comment-skip"
```

Um único listener global identifica a ação clicada e chama a função correspondente no mapa `actions`.

Essa abordagem evita vários listeners duplicados para botões comuns.

## 10.6 Tab Bar

As abas usam:

```html
data-tab="inicio"
data-tab="historico"
data-tab="perfil"
```

O estado ativo também é refletido semanticamente com:

```html
aria-current="page"
```

## 10.7 SOS

A folha de pedido de conversa usa:

```html
role="dialog"
aria-modal="true"
```

Ela permanece fora das screens para poder sobrepor a aplicação inteira.

---

# 11. Arquitetura do CSS

`styles/app.css` está organizado em blocos funcionais.

A ordem conceitual é aproximadamente:

```text
reset
↓
device
↓
estrutura de tela
↓
cabeçalho
↓
botões
↓
ícones
↓
check-in
↓
ilustrações climáticas
↓
animações por clima
↓
slider
↓
tab bar
↓
comentário
↓
confirmação
↓
histórico
↓
teclado PIN
↓
perfil
↓
SOS sheet
↓
reduced motion
```

## 11.1 Uso de tokens

A regra geral do protótipo é:

> medidas de sistema, cores, radius e tipografia devem vir da camada de tema.

Exemplos:

```css
background: var(--surface-page);
color: var(--text-primary);
border-radius: var(--radius-md);
gap: var(--space-stack-md);
```

Valores em pixels aparecem apenas quando representam geometria específica do componente ou da arte, por exemplo:

- dimensão do knob;
- percurso do slider;
- alvo mínimo de toque;
- enquadramento da ilustração;
- distância de partículas e efeitos.

## 11.2 Componentes globais

O CSS atual possui nomes relativamente genéricos, como:

```text
.btn
.icon
.screen
.device
.app
.textarea
```

Isso funciona bem enquanto o protótipo roda isolado.

**Ao integrar em uma landing page maior, esses seletores devem ser escopados** para evitar colisão com os estilos da landing. Ver a seção [Integração com a landing page do pitch](#19-integração-com-a-landing-page-do-pitch).

---

# 12. Arquitetura do JavaScript

Todo o script roda dentro de uma IIFE:

```js
(function () {
  "use strict";
  // ...
})();
```

Isso evita espalhar variáveis no escopo global.

## 12.1 Constantes principais

### `WEATHER`

Lista dos cinco estados e seus textos.

### `START`

Índice inicial do estado climático.

### `KNOB_W`

Largura geométrica do knob do slider.

### `EDGE`

Recuo do percurso do slider.

### `PIN`

PIN apenas de protótipo.

### `PIN_LENGTH`

Quantidade de dígitos.

### `RELOCK_ON_EXIT`

Define se o histórico deve voltar a bloquear ao trocar de aba.

## 12.2 `state`

É a fonte de verdade dos dados temporários da demonstração.

Exemplo conceitual:

```js
var state = {
  step: START,
  registered: false,
  pin: "",
  unlocked: false,
  history: []
};
```

Nada é persistido em servidor ou armazenamento permanente.

## 12.3 `el`

Agrupa referências aos elementos usados com frequência:

```js
var el = {
  slider: ...,
  knob: ...,
  fill: ...,
  row: ...,
  // ...
};
```

Isso reduz repetição de seletores durante a execução.

## 12.4 Renderização climática

Principais funções:

```text
art()
weatherMarkup()
paintWeather()
paintEscape()
```

Elas montam as diferentes camadas da ilustração conforme o estado.

Alguns climas precisam de SVGs separados:

```js
var SPLIT = {
  partly: [...],
  storm: [...]
};
```

Isso permite animar:

- nuvem independentemente do sol;
- raio independentemente da nuvem.

## 12.5 Construção dinâmica

Elementos montados pelo JavaScript:

```text
buildRow()
buildHistory()
buildKeypad()
```

## 12.6 Slider

O slider calcula sua posição pela largura real do elemento, permitindo adaptação ao tamanho disponível.

Fluxo:

```text
pointer X
   ↓
stepFromPointer()
   ↓
setStep()
   ↓
layoutSlider()
```

## 12.7 Navegação

```text
goToTab()
setView()
setVault()
```

Essas funções controlam, respectivamente:

- aba principal;
- etapa dentro da Home;
- estado da área protegida do Histórico.

## 12.8 Registro

`commit(comment)` é o ponto central da gravação simulada.

Responsabilidades:

- montar o objeto do registro;
- atualizar ou criar o dia atual;
- atualizar sequência;
- reconstruir histórico;
- pintar clima da confirmação;
- gerar partículas;
- abrir a view `done`;
- anunciar a mudança para tecnologia assistiva.

## 12.9 Event delegation

Há um listener central de clique:

```js
document.addEventListener("click", ...)
```

Ele procura:

```text
[data-action]
[data-tab]
```

Esse padrão deve ser preservado ao adicionar novas ações simples.

---

# 13. Design System

O protótipo foi construído para consumir o Design System Nexus por camadas.

## 13.1 Tipografia

A superfície do aluno utiliza **Nunito**.

Isso é diferente da superfície do psicólogo/dashboard, que deve utilizar a tipografia específica do Dashboard.

Não importar `typography-dashboard.css` na experiência do aluno apenas para obter um estilo isolado.

## 13.2 Cores semânticas principais

Os valores canônicos ficam na pasta `theme/` e são a fonte de verdade.

Como referência visual do sistema:

```text
surface/page          #FCFCFA
surface/default       #FFFFFF
surface/brand         #007B88
surface/brand-hover   #006E7A
surface/brand-active  #01616C
text/primary          #1E2120
text/secondary        #646767
text/brand            #006E7A
border/default        #D1D5D4
```

Não duplicar esses HEX em `app.css` se já existe token semântico correspondente.

## 13.3 Cores das ilustrações climáticas

As ilustrações possuem uma coleção própria, separada da UI:

```text
Sol               #E9C56D
Nuvem leve        #A7CCD2
Nublado            #8FA5A8
Chuva              #5A7A7D
Tempestade         #3D5467
```

Essas cores representam **ilustração**, não intenção de interface.

Portanto:

- não utilizar a cor da tempestade como cor de botão crítico;
- não utilizar vermelho para “punir” um estado emocional;
- não usar cor de ilustração como substituta de token semântico da UI.

## 13.4 Cards

O Design System da Nexus separa cards principalmente por borda.

Sombras não devem ser adicionadas indiscriminadamente.

A elevação existente no protótipo é usada em elementos que realmente flutuam, como o knob do slider e o aparelho de demonstração.

---

# 14. Motion e animações

O motion é parte importante do protótipo, mas não deve carregar informação indispensável sozinho.

Cada clima possui comportamento próprio.

## 14.1 Céu limpo

Características:

- respiração muito lenta;
- escala sutil;
- halo sincronizado;
- varredura de luz periódica.

Objetivo emocional:

> calma e abertura, sem transformar o sol em um elemento hiperativo.

## 14.2 Sol entre nuvens

Características:

- sol permanece estável;
- somente a nuvem se desloca;
- varredura de luz mais suave e espaçada.

Objetivo:

> mostrar passagem e leve oscilação sem mover toda a cena.

## 14.3 Nublado

Características:

- nuvem principal deriva lentamente;
- camadas fantasma cruzam em velocidades e sentidos diferentes;
- haze difuso respira ao fundo.

Objetivo:

> gerar peso e profundidade sem dramatização excessiva.

## 14.4 Chuva

Características:

- nuvem balança verticalmente;
- gotas caem de forma defasada;
- luz ambiente fica mais fraca.

## 14.5 Tempestade

Características:

- tremor curto;
- raio independente;
- glow do raio;
- flash em dois tempos;
- ausência de luz ambiente constante.

É propositalmente o movimento mais seco da sequência.

## 14.6 Transição para comentário

A view de comentário sobe de baixo para cima:

```text
~490 ms
```

A Tab Bar permanece acessível porque esta etapa é parte do fluxo, não um modal.

## 14.7 SOS Sheet

Entrada vertical de bottom sheet:

```text
~200 ms
```

## 14.8 Confirmação do registro

A tela `done` executa uma coreografia em cascata.

Ordem aproximada:

```text
0 ms      card entra
180 ms    ilustração voa e pousa
~520 ms   label começa a aparecer
620 ms    glow / luz
700 ms    partículas externas
820 ms    flutuação contínua
900 ms    ações entram
~1.4 s    coreografia principal concluída
```

As partículas também mudam conforme o clima:

| Clima | Partículas predominantes |
|---|---|
| Céu limpo | faíscas |
| Sol entre nuvens | faíscas + nuvem |
| Nublado | nuvens |
| Chuva | nuvem + gotas |
| Tempestade | faísca + nuvem + gotas |

Mesmo estados mais pesados recebem confirmação acolhedora. Nenhum estado é tratado como erro.

---

# 15. Acessibilidade

A implementação contém várias decisões importantes que devem ser preservadas.

## 15.1 Slider semântico

O controle usa:

```html
role="slider"
aria-valuemin="1"
aria-valuemax="5"
aria-valuenow="..."
aria-valuetext="..."
```

## 15.2 Estado não depende apenas de cor

O clima é representado por:

- ilustração;
- posição;
- texto;
- `aria-valuetext`.

## 15.3 Navegação por teclado

O slider e o PIN possuem suporte a teclado físico.

## 15.4 Focus visible

Botões, slider, itens climáticos, Tab Bar, textarea e keypad possuem estados de foco visíveis.

## 15.5 Live region

O elemento:

```html
<p class="visually-hidden" role="status" aria-live="polite" id="live"></p>
```

é utilizado para anunciar mudanças relevantes sem depender da animação.

## 15.6 PIN

O leitor de tela recebe apenas a quantidade de números digitados, não os valores.

Exemplo:

```text
“2 de 4 números digitados”
```

Isso evita expor a senha verbalmente.

## 15.7 Movimento reduzido

O CSS respeita:

```css
@media (prefers-reduced-motion: reduce)
```

Nesse modo:

- animações não essenciais são removidas;
- transições são reduzidas ou eliminadas;
- elementos decorativos que ficariam como manchas estáticas são escondidos;
- o significado da interface continua disponível.

**Não remover esse comportamento ao integrar o app à landing.**

---

# 16. Responsividade

O protótipo usa um aparelho de demonstração com:

```text
360 × 812 px
```

Em desktop, `.device` aparece como uma superfície isolada.

Quando a viewport atende:

```css
@media (max-width: 400px), (max-height: 840px)
```

ela passa a ocupar:

```text
100% × 100%
```

Também são utilizados:

```css
env(safe-area-inset-top)
env(safe-area-inset-bottom)
```

para acomodar áreas seguras de dispositivos móveis.

## Testes mínimos recomendados

- 360 × 812;
- 375 × 812;
- 390 × 844;
- 393 × 852;
- 412 × 915;
- desktop 1366 × 768;
- desktop 1920 × 1080.

---

# 17. Dados de demonstração

Todos os dados atuais são fictícios e existem apenas para visualização.

Exemplos:

```text
Maria Souza
9º ano · Turma B
Psicóloga: Ana Ribeiro
PIN: 1234
```

O histórico inicial também é preenchido localmente com registros fictícios.

Ao recarregar a página, o estado volta ao definido em `app.js`.

Não existe persistência em:

- localStorage;
- sessionStorage;
- cookies;
- banco de dados;
- API.

---

# 18. Segurança e limitações do protótipo

Esta é uma das seções mais importantes deste README.

## 18.1 O PIN não é segurança real

Atualmente:

```js
var PIN = "1234";
```

Qualquer pessoa com acesso ao código pode descobrir o PIN.

Isso é aceitável **somente para prototipagem visual**.

Em produção:

- o PIN não deve ser validado no cliente;
- nunca armazenar senha/PIN em texto puro;
- a validação deve ocorrer em backend seguro;
- armazenar apenas representação criptograficamente adequada;
- aplicar controle de tentativas;
- definir fluxo seguro de recuperação.

## 18.2 SOS não envia mensagem real

A ação atual apenas:

- fecha a sheet;
- limpa o campo;
- atualiza uma mensagem de acessibilidade.

Não existe integração com:

- psicólogo;
- SMS;
- push;
- e-mail;
- WhatsApp;
- sistema interno;
- protocolo de emergência.

**Nunca apresentar esse comportamento como funcional em produção sem deixar claro que é demonstração.**

## 18.3 Não existe autenticação

O nome “Maria” é fixo no HTML.

Não existe sessão real de usuário.

## 18.4 Não existe autorização

Não há controle de papéis ou permissões.

## 18.5 Não existe persistência

Recarregar a página restaura o estado original.

## 18.6 Dados sensíveis

Uma aplicação real desse tipo pode manipular informações altamente sensíveis de menores.

Antes de produção será necessário definir, entre outros pontos:

- base legal e consentimento aplicável;
- LGPD;
- minimização de dados;
- retenção;
- exclusão;
- auditoria;
- criptografia em trânsito e repouso;
- acesso por perfil;
- política de logs;
- tratamento de incidentes;
- fluxo de escalonamento;
- responsabilidades da escola, Nexus e profissionais;
- visibilidade de registros para família e equipe escolar.

Essas regras **não estão implementadas nesta pasta**.

---

# 19. Integração com a landing page do pitch

Este protótipo foi pensado para ser reaproveitável em uma experiência de apresentação do Axon aos pais.

A recomendação é **não desmontar o código funcional existente** para construir a landing.

Separe as responsabilidades.

Exemplo futuro:

```text
nexus-axon-pitch/
├── index.html
│
├── assets/
│   ├── axon/
│   ├── nexus/
│   ├── dashboard/
│   └── ...
│
├── theme/
│   └── ...
│
├── styles/
│   ├── landing.css
│   └── axon-app.css
│
└── scripts/
    ├── landing.js
    └── axon-app.js
```

## 19.1 Separar narrativa e produto

`landing.js` deve ser responsável por:

- scroll;
- reveals;
- storytelling;
- transições entre seções;
- hero;
- FAQ;
- CTAs;
- integração geral do pitch.

`app.js` deve continuar responsável por:

- estado do Axon;
- slider;
- check-in;
- comentário;
- histórico;
- SOS;
- interação interna.

Não misturar esses dois contextos sem necessidade.

## 19.2 Escopar o CSS antes de embutir

O `app.css` possui seletores globais como:

```css
body
button
.btn
.icon
.app
.screen
.textarea
```

Ao colocar tudo na mesma página, isso pode afetar a landing.

Antes da integração definitiva, recomenda-se envolver o protótipo com um namespace:

```html
<div class="axon-demo">
  <!-- app -->
</div>
```

E escopar seletores relevantes:

```css
.axon-demo .btn { ... }
.axon-demo .screen { ... }
.axon-demo .icon { ... }
```

Regras realmente globais devem ser revisadas separadamente.

## 19.3 Duas estratégias possíveis

### Estratégia A — integração direta no DOM

**Vantagens**

- transições da landing podem conversar com elementos internos;
- permite morph/reveal entre storytelling e app;
- melhor para um pitch premium.

**Desvantagens**

- exige escopo de CSS;
- maior cuidado com eventos e estilos globais.

### Estratégia B — `iframe`

**Vantagens**

- isolamento imediato;
- quase zero risco de conflito de CSS;
- ótima opção para demo rápida.

**Desvantagens**

- mais difícil sincronizar motion com scroll da página;
- aparência menos integrada;
- comunicação entre landing e app requer `postMessage`.

Para a landing narrativa planejada para o pitch, a tendência é preferir **integração direta após escopar os estilos**.

## 19.4 Não adicionar GSAP sem necessidade

O protótipo atual possui bastante motion apenas com CSS + JS.

A landing pode começar da mesma forma.

Adicionar GSAP/ScrollTrigger só se houver necessidade clara de:

- timelines complexas ligadas ao scroll;
- pinning sofisticado;
- sincronização de múltiplas seções;
- scrubbing;
- sequências difíceis de manter em CSS puro.

Se for adicionado, GSAP deve controlar **a narrativa externa**, sem substituir gratuitamente as animações climáticas já funcionando.

## 19.5 API pública futura para a landing

O `app.js` atual está encapsulado em uma IIFE, portanto suas funções internas não estão disponíveis globalmente.

Caso a landing precise controlar o protótipo — por exemplo, mudar automaticamente para “Chuva” durante o scroll — é melhor criar uma API explícita:

```js
window.AxonDemo = {
  setWeather: function (type) { ... },
  reset: function () { ... },
  openCheckin: function () { ... }
};
```

Evite controlar a aplicação externamente por seletores frágeis ou simulando cliques artificiais.

---

# 20. Diretrizes para evolução do código

## 20.1 Preserve a fonte única de verdade

Não crie um novo estado climático separado para cada componente.

Continue utilizando um estado central.

## 20.2 Use tokens semânticos

Evite:

```css
color: #01616C;
```

quando existir algo como:

```css
color: var(--text-brand);
```

## 20.3 Não transformar clima em erro

Tempestade e chuva são respostas válidas do aluno.

Não aplicar automaticamente:

- vermelho;
- ícone de erro;
- alerta agressivo;
- linguagem de falha.

## 20.4 Motion deve ter fallback

Qualquer animação nova precisa ser revisada em `prefers-reduced-motion`.

## 20.5 Informação não pode depender da animação

Se remover todo motion, o fluxo ainda deve ser compreensível.

## 20.6 Preserve semântica e ARIA

Ao trocar elementos ou refatorar componentes, confira se continuam existindo:

- labels;
- roles;
- estados ARIA;
- navegação por teclado;
- live announcements.

## 20.7 Evite dependências desnecessárias

A versão atual não precisa de framework para funcionar.

Adicionar biblioteca deve resolver um problema real.

## 20.8 Comente decisões, não o óbvio

O código atual possui comentários extensos que registram razões de UX, motion e acessibilidade.

Ao alterar uma decisão importante, atualize o comentário correspondente para não deixar documentação contraditória.

---

# 21. Checklist de QA

Antes de qualquer apresentação ou deploy, validar:

## Ambiente

- [ ] `index.html` abre sem erros no console.
- [ ] Todos os arquivos de `theme/` carregam.
- [ ] Nunito carrega corretamente.
- [ ] Avatar aparece.
- [ ] Todos os SVGs aparecem.
- [ ] Nenhuma requisição retorna 404.

## Check-in

- [ ] Tela inicia em Nublado.
- [ ] Os cinco ícones estão visíveis.
- [ ] Clique em cada ícone muda o estado.
- [ ] Slider responde a clique.
- [ ] Slider responde a arrasto.
- [ ] Slider responde às setas do teclado.
- [ ] `Home` vai ao primeiro estado.
- [ ] `End` vai ao último estado.
- [ ] Label acompanha o estado.
- [ ] Card muda o peso do céu corretamente.

## Motion climático

- [ ] Céu limpo respira suavemente.
- [ ] Sol entre nuvens move somente a camada de nuvem.
- [ ] Nublado possui profundidade sem cortes de loop aparentes.
- [ ] Chuva anima as gotas.
- [ ] Tempestade mostra raio e flash corretamente.
- [ ] Nenhum elemento ultrapassado fica “preso” após mudança de clima.

## Comentário

- [ ] `Registrar meu dia` abre comentário.
- [ ] View sobe corretamente.
- [ ] Campo recebe foco após a transição.
- [ ] Enviar inicia desabilitado.
- [ ] Digitar habilita Enviar.
- [ ] Apagar todo o conteúdo desabilita novamente.
- [ ] Pular conclui o registro sem comentário.
- [ ] Enviar conclui o registro com comentário.

## Confirmação

- [ ] Ilustração correta aparece.
- [ ] Label correto aparece.
- [ ] Partículas correspondem ao clima.
- [ ] Sequência é atualizada.
- [ ] `Retornar para o início` funciona.
- [ ] `Mudar meu registro` funciona.

## Histórico

- [ ] Histórico inicia bloqueado.
- [ ] PIN incorreto apresenta erro.
- [ ] Pontos não mudam layout ao exibir erro.
- [ ] PIN `1234` libera a lista.
- [ ] Registro atual aparece na lista.
- [ ] Comentário é sinalizado quando existe.
- [ ] Sair da aba bloqueia novamente.
- [ ] Teclado físico funciona.
- [ ] Backspace funciona.

## SOS

- [ ] Bottom sheet abre.
- [ ] Campo recebe foco após a entrada.
- [ ] Enviar inicia desabilitado.
- [ ] Texto habilita Enviar.
- [ ] Voltar preserva o texto digitado.
- [ ] Enviar limpa o campo.
- [ ] Clique no backdrop fecha.
- [ ] `Escape` fecha no desktop.

## Perfil

- [ ] Dados ilustrativos aparecem.
- [ ] Sequência acompanha o histórico atual.
- [ ] Atalho de pedido de conversa funciona.

## Acessibilidade

- [ ] Navegação principal funciona por teclado.
- [ ] Foco é visível.
- [ ] Slider possui `aria-valuetext` correto.
- [ ] Estado climático não depende só de cor.
- [ ] Live region anuncia mudanças relevantes.
- [ ] PIN não é lido em voz alta.
- [ ] `prefers-reduced-motion` remove motion decorativo.

## Responsividade

- [ ] 360 × 812 sem overflow inesperado.
- [ ] 390 × 844 sem conteúdo cortado.
- [ ] Desktop mantém aparelho centralizado.
- [ ] Mobile remove moldura externa do aparelho.
- [ ] Safe areas não cobrem conteúdo.

---

# 22. Troubleshooting

## Problema: a página aparece sem cores corretas

Verifique se existem e carregam:

```text
theme/primitives.css
theme/semantic.css
theme/typography-app.css
theme/illustration.css
```

Abra DevTools → Network e procure por 404.

## Problema: ícones não aparecem

Verifique:

- caminhos em `assets/icons/`;
- nomes e letras maiúsculas/minúsculas;
- suporte do navegador a CSS masks;
- `currentColor` do elemento.

Em hospedagem Linux, `Bell.svg` e `bell.svg` são arquivos diferentes.

## Problema: clima aparece sem arte

Confira os SVGs em:

```text
assets/weather/
```

Especialmente os arquivos divididos:

```text
partly-sun.svg
partly-cloud.svg
storm-cloud.svg
storm-bolt.svg
rain-cloud.svg
```

## Problema: app abre, mas o slider fica desalinhado

`layoutSlider()` depende da largura real do slider.

Confirme que:

- o elemento não está com `display:none` quando a medição é necessária;
- o CSS principal carregou;
- não houve sobrescrita da largura por outra folha de estilos.

## Problema: animações não acontecem

Verifique se o sistema operacional ou navegador está com **redução de movimento ativada**.

O protótipo respeita intencionalmente:

```css
prefers-reduced-motion: reduce
```

## Problema: fonte diferente da esperada

Verifique conexão com Google Fonts e a importação no `<head>`.

## Problema: histórico sempre volta ao PIN

Comportamento esperado quando:

```js
RELOCK_ON_EXIT = true;
```

Para uma apresentação específica, pode ser alterado temporariamente para `false`, mas não confundir isso com decisão de produto.

## Problema: ao atualizar a página, registros desaparecem

Comportamento esperado.

O protótipo usa apenas memória JavaScript e não possui persistência.

---

# 23. Deploy

Como o projeto é estático, pode ser hospedado sem servidor de aplicação.

## 23.1 GitHub Pages

Adequado para protótipos públicos simples.

Não existe build command.

Publicar a raiz contendo:

```text
index.html
assets/
styles/
scripts/
theme/
```

## 23.2 Vercel

Também pode servir o projeto como site estático.

Em uma configuração básica:

```text
Framework Preset: Other
Build Command: nenhum
Output: raiz do projeto
```

## 23.3 Cuidados antes de tornar público

Mesmo sendo protótipo:

- use apenas dados fictícios;
- não inserir chaves ou segredos no JS;
- não usar dados reais de menores;
- sinalizar claramente que ações como SOS são demonstrativas;
- testar paths em produção;
- verificar HTTPS;
- revisar metadados e título da página.

---

# 24. Próximos passos recomendados

## Curto prazo — pitch

1. Preservar esta versão do protótipo como baseline.
2. Criar a landing page em arquivos separados.
3. Escopar o CSS do Axon para integração sem conflito.
4. Reaproveitar as animações dos cinco céus no storytelling.
5. Incorporar o check-in funcional como demonstração interativa.
6. Adicionar recorte do dashboard do psicólogo em uma seção posterior.
7. Criar FAQ voltado aos pais.
8. Adicionar CTA e QR code da apresentação.
9. Testar toda a experiência em celular real.

## Médio prazo — MVP técnico

1. Definir arquitetura de autenticação.
2. Criar API.
3. Criar persistência segura.
4. Definir modelo de usuários e papéis.
5. Implementar fluxo real de pedido de conversa.
6. Definir política de consentimento e privacidade.
7. Implementar trilha de auditoria.
8. Criar painel do psicólogo conectado aos dados reais.
9. Testar acessibilidade formalmente.
10. Implementar observabilidade e tratamento de erros.

## Antes de produção

É obrigatório transformar decisões hoje demonstrativas em especificações formais, principalmente:

- quem vê cada informação;
- quando a família é envolvida;
- quando a escola é envolvida;
- como pedidos urgentes são escalonados;
- quais dados são armazenados;
- por quanto tempo;
- como são apagados;
- como incidentes são tratados;
- quais responsabilidades pertencem à Nexus, escola e profissionais.

---

# 25. Créditos

**Projeto:** Axon App / Nexus  
**Contexto:** acompanhamento emocional escolar  
**Superfície documentada:** experiência do aluno  
**Design e motion do protótipo:** Zé / Design  
**Tecnologias:** HTML, CSS e JavaScript puro

---

## Nota final

Esta pasta deve ser tratada como uma **referência funcional de UX + UI + motion**.

O valor do protótipo está justamente em manter alinhados:

```text
Design System
      +
comportamento
      +
acessibilidade
      +
motion
      +
fluxo de produto
```

Ao evoluir o projeto, preservar essas relações é mais importante do que simplesmente reproduzir a aparência das telas.

O objetivo não é transformar o protótipo em produção “adicionando um backend por cima”. O caminho correto é utilizar o que foi validado aqui como contrato de experiência e, a partir dele, projetar a arquitetura de produção com segurança, privacidade, dados e responsabilidades adequadas ao contexto escolar.
