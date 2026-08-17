/* Protótipo — App do aluno (Nexus)
 *
 * Um estado só: qual dos cinco climas está escolhido. O slider, a fila
 * de ícones, a ilustração grande e o rótulo são quatro vistas do mesmo
 * número — nenhum deles guarda estado próprio.
 * ------------------------------------------------------------------ */

(function () {
  "use strict";

  /* Os cinco estados do check-in, na ordem da fila: do mais escuro para
     o mais claro, tempestade à esquerda e céu limpo à direita — a rampa
     de severidade lida ao contrário, andando para a luz.
     O rótulo é o que carrega o significado: a cor da ilustração não
     obedece contraste de controle e nunca diz o valor sozinha. */
  var WEATHER = [
    { type: "storm", label: "Tempestade", note: "Hoje o seu céu está em tempestade." },
    { type: "rain", label: "Chuva", note: "Hoje está chovendo por aí." },
    { type: "cloudy", label: "Nublado", note: "Hoje o seu céu está nublado." },
    { type: "partly", label: "Sol entre nuvens", note: "Hoje tem sol entre nuvens." },
    { type: "clear", label: "Céu limpo", note: "Hoje o seu céu está limpo." }
  ];

  /* A página abre no meio da fila, não numa das pontas: o neutro é o
     ponto de partida honesto — nenhuma direção sugerida de antemão. */
  var START = Math.floor(WEATHER.length / 2);

  /* Geometria do Slider (158:71), em 328 de largura: recuo de 8 nas duas
     pontas, knob de 40, percurso 8..280, passo 68, centros em
     28/96/164/232/300. Aqui a mesma conta sai da largura real. */
  var KNOB_W = 40;
  var EDGE = 8;

  /* Senha do histórico — protótipo.
     Ela está aqui à vista de propósito: isto é a MAQUETE da trava, para
     desenhar e testar o fluxo, não a trava. Numa versão de verdade a
     senha não passa pelo cliente — quem confere é o servidor, e o que
     ele guarda é o hash dela. Qualquer pessoa com o inspetor aberto lê
     esta linha, então nada de dado real do aluno atrás dela. */
  var PIN = "1234";
  var PIN_LENGTH = 4;

  /* Sair da aba tranca de novo. É a razão de a trava existir: o celular
     que passa de mão em mão em geral já está aberto em outra tela. Vira
     false se atrapalhar a demonstração. */
  var RELOCK_ON_EXIT = true;

  var state = {
    step: START,
    registered: false,
    /* O que já foi digitado, e se o histórico está aberto nesta visita. */
    pin: "",
    unlocked: false,
    history: [
      { day: "Domingo, 20 de julho", type: "partly" },
      { day: "Sábado, 19 de julho", type: "clear" },
      { day: "Sexta, 18 de julho", type: "rain" },
      { day: "Quinta, 17 de julho", type: "cloudy" }
    ]
  };

  var el = {
    slider: document.getElementById("slider"),
    knob: document.getElementById("slider-knob"),
    fill: document.getElementById("slider-fill"),
    row: document.getElementById("weather-row"),
    checkinCard: document.querySelector(".checkin__card"),
    label: document.getElementById("weather-label"),
    doneStage: document.querySelector(".done__stage"),
    doneEscape: document.getElementById("done-escape"),
    doneLabel: document.getElementById("done-label"),
    doneStreak: document.getElementById("done-streak"),
    historyList: document.getElementById("history-list"),
    views: document.querySelectorAll("[data-view]"),
    vaults: document.querySelectorAll("[data-vault]"),
    pinDots: document.getElementById("pin-dots"),
    pinStatus: document.getElementById("pin-status"),
    keypad: document.getElementById("keypad"),
    commentInput: document.getElementById("comment-input"),
    commentSend: document.getElementById("comment-send"),
    commentStatus: document.getElementById("comment-status"),
    sos: document.getElementById("sos"),
    sosInput: document.getElementById("sos-input"),
    sosSend: document.getElementById("sos-send"),
    sosStatus: document.getElementById("sos-status"),
    live: document.getElementById("live"),
    today: document.getElementById("today"),
    streak: document.getElementById("streak")
  };

  /* ------------------------------------------------------------------
   * Illustration / Weather — 172:96
   *
   * A arte é o SVG exportado do Figma. Só a chuva é composta: as três
   * gotas são retângulos girados 15° no Figma, não vetor, e por isso
   * saem daqui na cor da rampa (weather/cloud/rain).
   * ------------------------------------------------------------------ */
  /* Camada de movimento por céu. Só entra na ilustração grande do
     check-in: a do "done" já tem coreografia própria e a da fila tem
     32px, onde enfeite vira sujeira. Nada aqui é informação — é tudo
     aria-hidden e some inteiro em prefers-reduced-motion.

     A chuva não aparece nesta lista porque a parte que se move nela já
     existe: são as três gotas do SVG abaixo. */
  var DECOR = {
    clear: '<span class="weather__halo" aria-hidden="true"></span>',
    cloudy: '<img class="weather__ghost" src="assets/weather/cloudy.svg" alt="" aria-hidden="true" />',
    storm: '<span class="weather__flash" aria-hidden="true"></span>'
  };

  /* Camada da FRENTE. Só o nublado tem uma: a nuvem que passa na frente
     do desenho, mais baixa e mais perto. Ela precisa vir depois da arte
     no documento — é a ordem que a coloca por cima, sem z-index. */
  var DECOR_FRONT = {
    cloudy:
      '<img class="weather__ghost weather__ghost--front" src="assets/weather/cloudy.svg" alt="" aria-hidden="true" />'
  };

  function art(src, extra) {
    return (
      '<img class="weather__art' +
      (extra ? " " + extra : "") +
      '" src="assets/weather/' +
      src +
      '.svg" alt="" />'
    );
  }

  /* Dois céus saem partidos em duas camadas no check-in, porque neles
     uma parte do desenho precisa de vida própria:

       partly  o sol fica parado e só a nuvem navega na frente dele
       storm   o raio precisa brilhar sozinho, sem levar a nuvem junto

     Os arquivos *-sun/-cloud/-bolt são o SVG do Figma partido, com o
     MESMO viewBox — é isso que faz as camadas caírem exatamente uma
     sobre a outra usando o mesmo inset. Fora do check-in continua
     valendo o arquivo inteiro, que é o que o Figma exporta. */
  var SPLIT = {
    partly: [["partly-sun"], ["partly-cloud", "weather__art--drift"]],
    storm: [["storm-cloud"], ["storm-bolt", "weather__bolt"]]
  };

  function weatherMarkup(type, decorated) {
    var layers = "";

    if (decorated && SPLIT[type]) {
      SPLIT[type].forEach(function (layer) {
        layers += art(layer[0], layer[1]);
      });
    } else {
      layers = art(type === "rain" ? "rain-cloud" : type);
    }

    /* A decoração vem antes da arte: halo, nuvem fantasma e clarão do
       raio ficam ATRÁS do desenho, e ordem de documento é o que decide
       isso sem precisar de z-index. */
    if (decorated && DECOR[type]) layers = DECOR[type] + layers;
    if (decorated && DECOR_FRONT[type]) layers = layers + DECOR_FRONT[type];

    if (type !== "rain") return layers;

    return (
      layers +
      '<svg class="weather__drops" viewBox="0 0 32 32" fill="none" aria-hidden="true">' +
      '<g stroke="currentColor" stroke-width="1.5" stroke-linecap="round">' +
      '<line x1="11.9" y1="20.4" x2="8.7" y2="27.6" />' +
      '<line x1="16.7" y1="20.4" x2="14.0" y2="25.6" />' +
      '<line x1="21.8" y1="20.4" x2="18.5" y2="27.6" />' +
      "</g></svg>"
    );
  }

  function paintWeather(node, type) {
    node.className = "weather weather--" + type + (node.dataset.size === "lg" ? " weather--lg" : "");
    node.innerHTML = weatherMarkup(type, node.dataset.weatherSlot === "current");
  }

  /* ------------------------------------------------------------------
   * O que estoura para fora do card na confirmação
   *
   * A mesma rampa de severidade, agora em partículas: a faísca (a luz)
   * vai cedendo lugar à nuvem e à gota conforme o céu fecha. Nenhum céu
   * fica sem nada — a celebração continua acontecendo para fora do
   * card, só muda do que ela é feita.
   *
   *   céu limpo          três faíscas, como antes
   *   sol entre nuvens   duas faíscas e uma nuvem
   *   nublado            três nuvens, nenhuma faísca
   *   chuva              uma nuvem e três gotas caindo
   *   tempestade         uma faísca (a do raio, a última luz que sobra),
   *                      uma nuvem e duas gotas
   *
   * O segundo item de cada par é o SLOT: posição e atrasos, quatro ao
   * todo, em alturas diferentes. Em linha ou simétricos viram enfeite
   * de banner. Nada aqui carrega informação — o container inteiro é
   * aria-hidden e some em prefers-reduced-motion.
   * ------------------------------------------------------------------ */
  var ESCAPE = {
    clear: [["spark", "a"], ["spark", "b"], ["spark", "c"]],
    partly: [["spark", "a"], ["puff", "b"], ["spark", "c"]],
    cloudy: [["puff", "a"], ["puff", "b"], ["puff", "c"]],
    rain: [["puff", "a"], ["drop", "b"], ["drop", "c"], ["drop", "d"]],
    storm: [["spark", "a"], ["puff", "b"], ["drop", "c"], ["drop", "d"]]
  };

  function paintEscape(type) {
    el.doneEscape.innerHTML = (ESCAPE[type] || ESCAPE.clear)
      .map(function (bit) {
        return '<i class="done__bit done__bit--' + bit[0] + " done__bit--" + bit[1] + '"></i>';
      })
      .join("");
  }

  /* ------------------------------------------------------------------
   * Fila de cinco — os centros batem com os passos do slider porque a
   * fila tem padding lateral 12 (ícone 32, metade 16, 28 − 16 = 12).
   * ------------------------------------------------------------------ */
  function buildRow() {
    WEATHER.forEach(function (item, i) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "weather-row__item";
      btn.dataset.step = String(i);
      btn.setAttribute("aria-pressed", "false");
      btn.setAttribute("aria-label", item.label);

      var art = document.createElement("span");
      art.dataset.size = "sm";
      paintWeather(art, item.type);
      btn.appendChild(art);

      btn.addEventListener("click", function () {
        setStep(i);
      });

      el.row.appendChild(btn);
    });
  }

  function buildHistory() {
    el.historyList.innerHTML = "";

    if (!state.history.length) {
      var empty = document.createElement("li");
      empty.className = "history__empty app-body-sm";
      empty.textContent = "Seus registros aparecem aqui.";
      el.historyList.appendChild(empty);
      return;
    }

    state.history.forEach(function (entry) {
      var item = WEATHER.filter(function (w) {
        return w.type === entry.type;
      })[0];

      var li = document.createElement("li");
      li.className = "history__item";

      var art = document.createElement("span");
      art.dataset.size = "sm";
      paintWeather(art, entry.type);

      var text = document.createElement("div");
      text.className = "history__text";
      text.innerHTML =
        '<span class="history__day app-body-md-bold"></span>' +
        '<span class="history__state app-body-sm"></span>';
      text.children[0].textContent = entry.day;
      text.children[1].textContent = entry.comment ? item.label + " · com comentário" : item.label;

      li.appendChild(art);
      li.appendChild(text);
      el.historyList.appendChild(li);
    });
  }

  /* ------------------------------------------------------------------
   * Trava do Histórico
   *
   * Um estado só, outra vez: quantos números já foram digitados. Os
   * pontos, o rótulo do leitor de tela e o momento de conferir a senha
   * saem todos de state.pin.
   *
   * Não há botão de confirmar. O quarto número JÁ é a confirmação — é
   * assim que a criança destrava o próprio celular, e pedir um toque a
   * mais aqui só ensinaria que este lugar é mais burocrático que o
   * resto do app.
   * ------------------------------------------------------------------ */
  var KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"];

  function buildKeypad() {
    KEYS.forEach(function (key) {
      /* O buraco do canto é <span>: botão desabilitado ali seria parada
         de tabulação e de leitura de tela para nada. */
      if (!key) {
        var hole = document.createElement("span");
        hole.className = "key key--empty";
        hole.setAttribute("aria-hidden", "true");
        return el.keypad.appendChild(hole);
      }

      var btn = document.createElement("button");
      btn.type = "button";

      if (key === "back") {
        btn.className = "key key--action";
        btn.setAttribute("aria-label", "Apagar último número");
        btn.innerHTML = '<span class="icon icon--md icon--delete" aria-hidden="true"></span>';
        btn.addEventListener("click", pinBack);
      } else {
        /* heading-1 (24) e não label: o número é o conteúdo da tecla, e
           é ele que precisa ser lido de relance com o polegar por cima. */
        btn.className = "key app-heading-1";
        btn.textContent = key;
        btn.addEventListener("click", function () {
          pinPush(key);
        });
      }

      el.keypad.appendChild(btn);
    });
  }

  function renderPin() {
    Array.prototype.forEach.call(el.pinDots.children, function (dot, i) {
      if (i < state.pin.length) dot.setAttribute("data-filled", "");
      else dot.removeAttribute("data-filled");
    });

    /* Quanto falta é informação, e cor não a carrega: ela sai também no
       rótulo dos pontos. O número digitado NÃO entra aqui — o leitor de
       tela costuma estar no viva-voz, e ler a senha em voz alta seria o
       contrário do que esta tela faz. */
    el.pinDots.setAttribute(
      "aria-label",
      state.pin.length === 0
        ? "Nenhum número digitado"
        : state.pin.length + " de " + PIN_LENGTH + " números digitados"
    );
  }

  function setPinStatus(message, tone) {
    el.pinStatus.textContent = message || "";
    if (tone) el.pinStatus.setAttribute("data-tone", tone);
    else el.pinStatus.removeAttribute("data-tone");
  }

  function pinPush(digit) {
    if (state.pin.length >= PIN_LENGTH) return;

    /* Digitar limpa o erro anterior: o aviso é do que acabou de
       acontecer, não um carimbo que fica na tela. */
    el.pinDots.removeAttribute("data-error");
    setPinStatus("");

    state.pin += digit;
    renderPin();

    if (state.pin.length === PIN_LENGTH) checkPin();
  }

  function pinBack() {
    if (!state.pin) return;
    el.pinDots.removeAttribute("data-error");
    setPinStatus("");
    state.pin = state.pin.slice(0, -1);
    renderPin();
  }

  function checkPin() {
    if (state.pin === PIN) return unlockVault();

    /* Errou: a sacudida e o aviso saem juntos, e os pontos se apagam
       depois dela — apagar no mesmo quadro tira da tela justamente o que
       está sendo sacudido. */
    el.pinDots.setAttribute("data-error", "");
    setPinStatus("Senha incorreta. Tente de novo.", "error");
    announce("Senha incorreta. Tente de novo.");

    setTimeout(function () {
      state.pin = "";
      renderPin();
    }, 420);
  }

  function unlockVault() {
    state.unlocked = true;
    state.pin = "";
    renderPin();
    setPinStatus("");
    setVault("list");
    announce("Histórico liberado.");
  }

  /* Trancar de novo é o ponto da tela inteira: o celular que passa de
     mão em mão quase sempre já está aberto em outro lugar. */
  function lockVault() {
    state.unlocked = false;
    state.pin = "";
    el.pinDots.removeAttribute("data-error");
    setPinStatus("");
    renderPin();
    setVault("lock");
  }

  function setVault(name) {
    Array.prototype.forEach.call(el.vaults, function (view) {
      view.hidden = view.dataset.vault !== name;
    });
  }

  /* ------------------------------------------------------------------
   * Estado
   * ------------------------------------------------------------------ */
  function setStep(i, silent) {
    state.step = Math.max(0, Math.min(WEATHER.length - 1, i));
    var current = WEATHER[state.step];

    paintWeather(document.querySelector('[data-weather-slot="current"]'), current.type);
    el.label.textContent = current.label;

    /* O card inteiro muda de céu junto com a ilustração: fundo mais
       pesado e menos luz conforme desce a rampa. Quem pinta é o CSS —
       aqui só passa o estado. */
    el.checkinCard.setAttribute("data-sky", current.type);

    Array.prototype.forEach.call(el.row.children, function (btn, index) {
      btn.setAttribute("aria-pressed", index === state.step ? "true" : "false");
    });

    /* Cor sozinha não diz o valor: o passo escolhido vai em texto no
       rótulo e em aria-valuetext. */
    el.slider.setAttribute("aria-valuenow", String(state.step + 1));
    el.slider.setAttribute("aria-valuetext", current.label);

    layoutSlider();
    if (!silent) announce(current.label);
  }

  function layoutSlider() {
    var width = el.slider.clientWidth;
    if (!width) return;

    var travel = width - EDGE * 2 - KNOB_W;
    var left = EDGE + (travel / (WEATHER.length - 1)) * state.step;

    el.knob.style.left = left + "px";
    el.fill.style.width = left + KNOB_W / 2 + "px";
  }

  function announce(message) {
    el.live.textContent = message;
  }

  /* ------------------------------------------------------------------
   * Slider: arrasto, clique e teclado
   * ------------------------------------------------------------------ */
  function stepFromPointer(clientX) {
    var box = el.slider.getBoundingClientRect();
    var travel = box.width - EDGE * 2 - KNOB_W;
    var gap = travel / (WEATHER.length - 1);
    var center = clientX - box.left - EDGE - KNOB_W / 2;
    return Math.round(center / gap);
  }

  function bindSlider() {
    var dragging = false;

    el.slider.addEventListener("pointerdown", function (event) {
      dragging = true;
      el.slider.setPointerCapture(event.pointerId);
      setStep(stepFromPointer(event.clientX));
    });

    el.slider.addEventListener("pointermove", function (event) {
      if (!dragging) return;
      var next = stepFromPointer(event.clientX);
      if (next !== state.step) setStep(next);
    });

    ["pointerup", "pointercancel"].forEach(function (name) {
      el.slider.addEventListener(name, function () {
        dragging = false;
      });
    });

    el.slider.addEventListener("keydown", function (event) {
      var delta = 0;
      if (event.key === "ArrowRight" || event.key === "ArrowUp") delta = 1;
      if (event.key === "ArrowLeft" || event.key === "ArrowDown") delta = -1;
      if (event.key === "Home") return event.preventDefault(), setStep(0);
      if (event.key === "End") return event.preventDefault(), setStep(WEATHER.length - 1);
      if (!delta) return;
      event.preventDefault();
      setStep(state.step + delta);
    });

    window.addEventListener("resize", layoutSlider);
  }

  /* ------------------------------------------------------------------
   * Navegação e ações
   * ------------------------------------------------------------------ */
  function goToTab(name) {
    /* Saiu do Histórico, trancou. Vale inclusive quando ele já estava
       aberto: quem empresta o celular não volta para fechar a aba. */
    if (RELOCK_ON_EXIT && name !== "historico" && state.unlocked) lockVault();

    Array.prototype.forEach.call(document.querySelectorAll("[data-screen]"), function (screen) {
      if (screen.dataset.screen === name) screen.setAttribute("data-active", "");
      else screen.removeAttribute("data-active");
    });

    Array.prototype.forEach.call(document.querySelectorAll("[data-tab]"), function (tab) {
      if (tab.dataset.tab === name) tab.setAttribute("aria-current", "page");
      else tab.removeAttribute("aria-current");
    });

    if (name === "inicio") layoutSlider();
  }

  /* Três vistas dentro da mesma tela: picker -> comment -> done.
     A de comentário é a única que entra animada, subindo. */
  function setView(name) {
    Array.prototype.forEach.call(el.views, function (view) {
      view.hidden = view.dataset.view !== name;
    });

    state.view = name;
    if (name === "picker") layoutSlider();
  }

  function openComment() {
    setView("comment");
    updateSendState();

    /* Foco depois da animação: mover o foco no meio dela faz o teclado
       do celular subir junto com a tela. */
    setTimeout(function () {
      el.commentInput.focus({ preventScroll: true });
    }, 490);

    announce("Comentário opcional. Você pode pular esta etapa.");
  }

  function updateSendState() {
    var empty = !el.commentInput.value.trim();
    el.commentSend.disabled = empty;
    el.commentStatus.hidden = !empty;
  }

  /* Só aqui o dia entra no histórico — nem "Registrar meu dia" nem
     "Pular" gravam sozinhos, os dois passam por este ponto. */
  function commit(comment) {
    var current = WEATHER[state.step];
    var today = el.today.textContent;
    var entry = { day: today, type: current.type, comment: comment };

    var existing = state.history[0];
    if (existing && existing.day === today) {
      existing.type = entry.type;
      existing.comment = entry.comment;
    } else {
      state.history.unshift(entry);
    }

    state.registered = true;
    el.streak.textContent = state.history.length + " dias";
    buildHistory();

    paintWeather(document.querySelector('[data-weather-slot="done"]'), current.type);
    el.doneLabel.textContent = current.label;

    /* A cena inteira da confirmação desce a mesma rampa do card de
       seleção: o peso do céu, a força do clarão e do que sai voando
       saem todos deste único atributo. Quem pinta é o CSS. */
    el.doneStage.setAttribute("data-sky", current.type);
    paintEscape(current.type);

    /* A sequência sai partida em três pedaços porque o número é o que o
       aluno veio ver: ele vira elemento próprio para ganhar destaque e
       o pique da coreografia. Continua uma frase só para o leitor de
       tela — <strong> não corta leitura. */
    var days = state.history.length;
    var count = document.createElement("strong");
    count.className = "done__count";
    count.textContent = days === 1 ? "primeiro" : days + " dias";

    el.doneStreak.textContent = "";
    if (days === 1) el.doneStreak.append("Esse é o seu ", count, " registro.");
    else el.doneStreak.append("Já são ", count, " de sequência.");
    el.doneStreak.append(document.createElement("br"), "Parabéns pela força!");

    setView("done");
    announce("Dia registrado: " + current.label);
  }

  function toggleSos(open) {
    if (open) el.sos.setAttribute("data-open", "");
    else el.sos.removeAttribute("data-open");
  }

  /* Mesma regra do comentário do check-in: sem texto não há envio, e o
     motivo fica escrito ao lado do botão desabilitado. */
  function updateSosState() {
    var empty = !el.sosInput.value.trim();
    el.sosSend.disabled = empty;
    el.sosStatus.hidden = !empty;
  }

  var actions = {
    register: openComment,
    "comment-send": function () {
      commit(el.commentInput.value.trim());
    },
    "comment-skip": function () {
      commit("");
    },
    /* Os dois voltam para a seleção; a diferença é o comentário.
       "Retornar para o início" fecha o assunto e limpa o campo;
       "Mudar meu registro" guarda o texto para o aluno continuar de
       onde parou. */
    home: function () {
      el.commentInput.value = "";
      updateSendState();
      setView("picker");
    },
    redo: function () {
      setView("picker");
    },
    notifications: function () {
      announce("Nenhuma notificação nova.");
    },
    /* Esquecer a senha não pode virar beco sem saída, e a saída aqui é
       uma pessoa — não um e-mail de recuperação que a criança talvez
       nem tenha. O aviso ocupa a mesma linha do erro: é resposta ao
       toque, no lugar onde ela já está olhando. */
    "pin-forgot": function () {
      var message = "Fale com a Ana, sua psicóloga. Ela cadastra uma senha nova com você.";
      setPinStatus(message);
      announce(message);
    },
    sos: function () {
      toggleSos(true);
      updateSosState();

      /* Foco depois da entrada da folha, pelo mesmo motivo do
         comentário: mover o foco no meio dela sobe o teclado junto com
         a animação. */
      setTimeout(function () {
        el.sosInput.focus({ preventScroll: true });
      }, 220);
    },
    /* "Voltar" guarda o texto: quem fechou sem querer volta de onde
       parou. Só o envio limpa o campo. */
    "sos-close": function () {
      toggleSos(false);
    },
    "sos-confirm": function () {
      toggleSos(false);
      el.sosInput.value = "";
      updateSosState();
      announce("Mensagem enviada. A Ana foi avisada e responde ainda hoje.");
    }
  };

  document.addEventListener("click", function (event) {
    var trigger = event.target.closest("[data-action]");
    if (trigger) return actions[trigger.dataset.action]();

    var tab = event.target.closest("[data-tab]");
    if (tab) goToTab(tab.dataset.tab);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") return toggleSos(false);

    /* Teclado físico digita a senha direto, sem passar pelas teclas da
       tela. Só quando a trava está à vista, o SOS fechado e o foco não
       está num campo de texto — senão o "1" do comentário viraria
       tentativa de senha. */
    var lockVisible =
      !state.unlocked &&
      !el.sos.hasAttribute("data-open") &&
      document.querySelector('[data-screen="historico"]').hasAttribute("data-active");

    if (!lockVisible) return;
    if (/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) return;

    if (/^[0-9]$/.test(event.key)) {
      event.preventDefault();
      pinPush(event.key);
    } else if (event.key === "Backspace") {
      event.preventDefault();
      pinBack();
    }
  });

  el.sos.addEventListener("click", function (event) {
    if (event.target === el.sos) toggleSos(false);
  });

  /* ------------------------------------------------------------------ */
  el.commentInput.addEventListener("input", updateSendState);
  el.sosInput.addEventListener("input", updateSosState);

  buildRow();
  buildKeypad();
  buildHistory();
  lockVault();
  setStep(START, true);
  bindSlider();
  requestAnimationFrame(layoutSlider);
})();
