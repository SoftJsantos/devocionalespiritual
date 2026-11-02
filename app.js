(() => {
  const STORE_KEY = "despertar-espiritual:v1";
  const app = document.getElementById("app");
  const toast = document.getElementById("toast");
  let book;
  let toastTimer;
  let state = readState();

  function readState() {
    const base = { started: false, lastDay: 1, completed: [], notes: {}, commitment: "" };
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
      if (!saved || typeof saved !== "object") return base;
      return {
        ...base,
        ...saved,
        started: Boolean(saved.started),
        lastDay: Math.min(21, Math.max(1, Number(saved.lastDay) || 1)),
        completed: Array.isArray(saved.completed) ? [...new Set(saved.completed.map(Number).filter(n => n >= 1 && n <= 21))] : [],
        notes: saved.notes && typeof saved.notes === "object" ? saved.notes : {},
        commitment: typeof saved.commitment === "string" ? saved.commitment : ""
      };
    } catch (_) {
      return base;
    }
  }

  function saveState() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (_) { /* O app continua utilizável sem armazenamento persistente. */ }
  }

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  }

  function icon(name, extraClass = "") {
    return `<svg class="icon ${extraClass}" aria-hidden="true" focusable="false"><use href="#icon-${name}"></use></svg>`;
  }

  function paragraphs(text, className = "prose") {
    if (!text) return `<div class="${className}"><p class="empty-state">Este trecho não aparece no material desta edição.</p></div>`;
    const items = String(text).split(/\n\s*\n/).map(part => part.trim()).filter(Boolean);
    return `<div class="${className}">${items.map(part => `<p>${esc(part).replace(/\n/g, " ")}</p>`).join("")}</div>`;
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2100);
  }

  function completedCount() { return state.completed.length; }
  function completionPercent() { return Math.round((completedCount() / 21) * 100); }
  function isComplete(day) { return state.completed.includes(Number(day)); }
  function dayByNumber(number) { return book.days.find(day => day.number === Number(number)); }
  function weekNumber(day) { return Math.ceil(Number(day) / 7); }
  function nextOpenDay() { return book.days.find(day => !isComplete(day.number))?.number || 21; }

  function progressRing() {
    return `<div class="progress-ring" style="--progress:${completionPercent()}%" role="img" aria-label="${completedCount()} de 21 dias concluídos"><strong>${completedCount()}<small>/21</small></strong></div>`;
  }

  function dayCard(day) {
    const done = isComplete(day.number);
    return `<button class="day-card" type="button" data-day="${day.number}" data-complete="${done}" aria-label="Abrir Dia ${day.number}: ${esc(day.title)}${done ? ", concluído" : ""}">
      <span class="day-card-number">${String(day.number).padStart(2, "0")}</span>
      <span class="day-card-copy"><small>${done ? "Concluído" : `Dia ${String(day.number).padStart(2, "0")} · Semana ${weekNumber(day.number)}`}</small><strong>${esc(day.title)}</strong></span>
      <span class="day-card-action">${done ? icon("check") : icon("arrow-right")}</span>
    </button>`;
  }

  function dayGroups() {
    const groups = [
      { title: "Semana 1", range: "Dias 1–7", days: book.days.slice(0, 7) },
      { title: "Semana 2", range: "Dias 8–14", days: book.days.slice(7, 14) },
      { title: "Semana 3", range: "Dias 15–21", days: book.days.slice(14, 21) }
    ];
    return groups.map((group, index) => `<section class="week-block" aria-labelledby="week-${index + 1}">
      <h3 class="week-heading" id="week-${index + 1}">${esc(group.title)} <span>${esc(group.range)}</span></h3>
      <div class="day-grid">${group.days.map(dayCard).join("")}</div>
    </section>`).join("");
  }

  function setActiveNav(view) {
    document.querySelectorAll(".nav-link, .bottom-nav-item").forEach(button => {
      const active = button.dataset.view === view;
      button.classList.toggle("is-active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
  }

  function renderHome() {
    setActiveNav("home");
    const continueDay = state.started ? state.lastDay : 1;
    const actionText = state.started ? `Continuar no Dia ${continueDay}` : "Começar pelo Dia 1";
    app.innerHTML = `<div class="view-enter">
      <section class="hero" aria-labelledby="hero-title">
        <div class="hero-inner">
          <div class="hero-copy">
            <span class="eyebrow">Uma jornada devocional · 21 dias</span>
            <h1 id="hero-title">Um espaço para<br><em>renovar sua vida</em><br>com Deus.</h1>
            <p class="hero-description">Leitura, oração e pequenos passos práticos para reencontrar a quietude, fortalecer a fé e seguir com propósito — um dia de cada vez.</p>
            <div class="hero-actions">
              <button class="button button--gold" type="button" data-action="start">${actionText}${icon("arrow-right")}</button>
              <button class="text-link" type="button" data-view="index">Explorar os 21 dias ${icon("arrow-right")}</button>
            </div>
          </div>
          <aside class="hero-progress" aria-label="Seu progresso na jornada">
            <div class="hero-progress-top"><span>Sua jornada</span><span>${completionPercent()}%</span></div>
            ${progressRing()}
            <p><strong>${completedCount()} de 21 dias</strong>${completedCount() === 0 ? "Seu primeiro passo começa quando você quiser." : "Cada dia concluído é um passo cultivado."}</p>
          </aside>
        </div>
      </section>

      <section class="home-launchpad" aria-label="Atalhos da sua jornada"><div class="wrap launchpad-grid">
        <button class="launch-card launch-card--primary" type="button" data-action="start"><span class="launch-icon">${icon("journey")}</span><span><small>Retomar leitura</small><strong>${state.started ? `Dia ${continueDay} · ${esc(dayByNumber(continueDay)?.title || "Sua jornada")}` : "Começar pelo Dia 1"}</strong></span>${icon("arrow-right", "launch-arrow")}</button>
        <button class="launch-card" type="button" data-view="progress"><span class="launch-icon">${icon("progress")}</span><span><small>Seu percurso</small><strong>${completedCount()} de 21 dias concluídos</strong></span>${icon("arrow-right", "launch-arrow")}</button>
        <button class="launch-card" type="button" data-view="journal"><span class="launch-icon">${icon("journal")}</span><span><small>Seu espaço pessoal</small><strong>Abrir meu caderno</strong></span>${icon("arrow-right", "launch-arrow")}</button>
      </div></section>

      <section class="intro-band" aria-labelledby="intro-title">
        <div class="wrap intro-layout">
          <div class="intro-heading"><span class="eyebrow">Sobre esta jornada</span><h2 class="section-title" id="intro-title">Um convite à presença, à fé e ao recomeço.</h2></div>
          <div class="intro-copy">
            ${paragraphs(book.introduction)}
            <p class="source-attribution">José Cristovão · Despertar Espiritual</p>
            <details class="how-to"><summary>Como usar este livro</summary>${paragraphs(book.howToUse, "prose prose--small")}</details>
          </div>
        </div>
      </section>

      <section class="journey-section" aria-labelledby="journey-title"><div class="wrap">
        <div class="section-head"><div><span class="eyebrow">Seu percurso</span><h2 class="section-title" id="journey-title">Os 21 dias</h2></div><p>Caminhe no seu ritmo. Você pode abrir qualquer dia, voltar a uma leitura ou continuar de onde parou.</p></div>
        ${dayGroups()}
        <div class="journey-foot"><p>Seu progresso e suas anotações ficam salvos apenas neste dispositivo.</p><button class="text-link" type="button" data-view="index">Abrir índice completo ${icon("arrow-right")}</button></div>
      </div></section>

      <section class="ritual-section"><div class="wrap">
        <div class="ritual-head"><span class="eyebrow">Um ritmo simples</span><h2 class="section-title">Reserve um momento para estar.</h2><p>O livro sugere um caminho diário; transforme cada etapa em um espaço seu, sem pressa e sem cobrança.</p></div>
        <div class="ritual-list">
          <article class="ritual-item"><span class="ritual-number">01</span><h3>Leia</h3><p>Dedique um momento ao capítulo do dia e deixe a leitura acompanhar você.</p></article>
          <article class="ritual-item"><span class="ritual-number">02</span><h3>Silencie</h3><p>Reserve alguns minutos em um lugar tranquilo para refletir com Deus.</p></article>
          <article class="ritual-item"><span class="ritual-number">03</span><h3>Ore</h3><p>Use a oração como guia e fale com sinceridade, com suas próprias palavras.</p></article>
          <article class="ritual-item"><span class="ritual-number">04</span><h3>Pratique</h3><p>Experimente a ação do dia e, se desejar, anote o que ficou no coração.</p></article>
        </div>
      </div></section>
    </div>`;
    focusHeading("#hero-title");
  }

  function renderIndex() {
    setActiveNav("index");
    app.innerHTML = `<div class="view-enter">
      <section class="page-top"><div class="wrap">
        <div class="breadcrumb"><button type="button" data-view="home">Início</button><span aria-hidden="true">/</span><span>Índice da jornada</span></div>
        <div class="page-heading"><div><span class="eyebrow">Uma leitura por dia</span><h1 class="section-title">Os 21 dias</h1></div><p>${completedCount()} de 21 dias concluídos · ${completionPercent()}%</p></div>
        <div class="overall-progress" role="progressbar" aria-label="Progresso da jornada" aria-valuemin="0" aria-valuemax="21" aria-valuenow="${completedCount()}"><span style="width:${completionPercent()}%"></span></div>
      </div></section>
      <section class="index-content"><div class="wrap">
        <div class="index-intro-card"><span class="index-intro-icon">${icon("journey")}</span><p>Cada encontro reúne reflexão, versículo bíblico, ensinamento, oração e uma ação prática. A ordem é uma sugestão: você pode começar por qualquer tema.</p></div>
        ${dayGroups()}
        <div class="journey-foot"><p>As anotações são privadas neste navegador.</p><button class="text-link" type="button" data-view="closing">Ir ao encerramento ${icon("arrow-right")}</button></div>
      </div></section>
    </div>`;
    focusHeading(".page-heading h1");
  }

  function renderProgress() {
    setActiveNav("progress");
    const target = state.started ? state.lastDay : nextOpenDay();
    const weeks = [0, 1, 2].map(index => {
      const days = book.days.slice(index * 7, index * 7 + 7);
      const completed = days.filter(day => isComplete(day.number)).length;
      const percent = Math.round((completed / days.length) * 100);
      return `<article class="week-progress-card"><div class="week-progress-top"><span>Semana 0${index + 1}</span><strong>${completed} de ${days.length}</strong></div><div class="week-meter" role="progressbar" aria-label="Progresso da Semana ${index + 1}" aria-valuemin="0" aria-valuemax="${days.length}" aria-valuenow="${completed}"><span style="width:${percent}%"></span></div><p>${completed === days.length ? "Semana completa" : `${days.length - completed} ${days.length - completed === 1 ? "dia restante" : "dias restantes"}`}</p></article>`;
    }).join("");
    app.innerHTML = `<div class="view-enter app-view">
      <section class="page-top"><div class="wrap">
        <div class="breadcrumb"><button type="button" data-view="home">Início</button><span aria-hidden="true">/</span><span>Meu progresso</span></div>
        <div class="page-heading"><div><span class="eyebrow">Seu caminho, no seu ritmo</span><h1 class="section-title">Meu progresso</h1></div><p>Sem pressa e sem comparação: cada leitura conta.</p></div>
      </div></section>
      <section class="wrap progress-dashboard">
        <div class="progress-overview-card">
          ${progressRing()}
          <div class="progress-overview-copy"><span class="eyebrow">Sua jornada até aqui</span><h2>${completedCount() === 21 ? "Você percorreu os 21 dias." : `${completedCount()} ${completedCount() === 1 ? "dia cultivado" : "dias cultivados"}.`}</h2><p>${completedCount() === 0 ? "Marque um dia como concluído quando quiser registrar esse passo." : `${21 - completedCount()} ${21 - completedCount() === 1 ? "dia" : "dias"} disponível${21 - completedCount() === 1 ? "" : "eis"} para seguir explorando, no seu tempo.`}</p></div>
          <button class="button button--gold" type="button" data-day="${target}">${completedCount() === 21 ? "Revisitar o Dia 21" : state.started ? `Retomar o Dia ${target}` : "Começar pelo Dia 1"}${icon("arrow-right")}</button>
        </div>
        <section class="week-progress-section"><div class="dashboard-section-head"><div><span class="eyebrow">Passo a passo</span><h2 class="section-title">Visão por semana</h2></div><span class="week-progress-total">${completionPercent()}% no total</span></div><div class="week-progress-grid">${weeks}</div></section>
        <section class="progress-days-section"><div class="dashboard-section-head"><div><span class="eyebrow">Todos os encontros</span><h2 class="section-title">Sua trilha</h2></div><button type="button" class="text-link" data-view="index">Abrir jornada ${icon("arrow-right")}</button></div>${dayGroups()}</section>
      </section>
    </div>`;
    focusHeading(".page-heading h1");
  }

  function renderJournal() {
    setActiveNav("journal");
    const entries = book.days.map(day => ({ day, note: String(state.notes[String(day.number)] || "").trim() })).filter(entry => entry.note);
    const noteCards = entries.length ? entries.map(({ day, note }) => `<article class="journal-entry"><div class="journal-entry-top"><span class="journal-day">Dia ${String(day.number).padStart(2, "0")}</span><span class="journal-week">Semana ${weekNumber(day.number)}</span></div><h2>${esc(day.title)}</h2><p class="journal-note-preview">${esc(note)}</p><button type="button" class="text-link" data-day="${day.number}">Abrir leitura e editar ${icon("arrow-right")}</button></article>`).join("") : `<div class="journal-empty"><span class="empty-icon">${icon("journal")}</span><h2>Seu caderno começa com uma ideia.</h2><p>Registre uma frase, uma oração ou uma intenção em qualquer leitura. Suas anotações aparecem aqui e ficam salvas apenas neste dispositivo.</p><button class="button button--gold" type="button" data-day="${state.started ? state.lastDay : 1}">Abrir uma leitura ${icon("arrow-right")}</button></div>`;
    const commitment = state.commitment.trim();
    app.innerHTML = `<div class="view-enter app-view">
      <section class="page-top"><div class="wrap">
        <div class="breadcrumb"><button type="button" data-view="home">Início</button><span aria-hidden="true">/</span><span>Caderno</span></div>
        <div class="page-heading"><div><span class="eyebrow">Um lugar só seu</span><h1 class="section-title">Meu caderno</h1></div><p>${entries.length} ${entries.length === 1 ? "anotação salva" : "anotações salvas"}</p></div>
      </div></section>
      <section class="wrap journal-dashboard">
        <div class="journal-privacy">${icon("lock")}<p>Seu caderno é privado neste dispositivo. Nenhum texto é enviado para uma conta ou servidor.</p></div>
        ${commitment ? `<article class="journal-commitment"><span class="eyebrow">Compromisso de continuidade</span><p>${esc(commitment)}</p><button class="text-link" type="button" data-view="closing">Rever compromisso ${icon("arrow-right")}</button></article>` : `<article class="journal-commitment journal-commitment--empty"><span class="eyebrow">Compromisso de continuidade</span><p>Ao registrar um próximo passo no encerramento, você também poderá encontrá-lo aqui.</p><button class="text-link" type="button" data-view="closing">Escrever meu compromisso ${icon("arrow-right")}</button></article>`}
        <div class="journal-list-head"><h2>Anotações da jornada</h2><span>${entries.length} ${entries.length === 1 ? "registro" : "registros"}</span></div>
        <div class="journal-grid">${noteCards}</div>
      </section>
    </div>`;
    focusHeading(".page-heading h1");
  }

  const sectionLabels = {
    reflection: ["reflection", "Reflexão", "sunrise"],
    verse: ["verse", "Versículo Bíblico", "quote"],
    teaching: ["teaching", "Ensinamento", "spark"],
    prayer: ["prayer", "Oração do Dia", "prayer"],
    action: ["practical", "Ação Prática", "leaf"]
  };

  function renderReadingSection(key, text) {
    if (!text) return "";
    const [className, label, glyph] = sectionLabels[key];
    return `<section class="reading-section reading-section--${className}" id="section-${key}" aria-labelledby="heading-${key}">
      <h2 id="heading-${key}"><span class="section-glyph">${icon(glyph)}</span>${label}</h2>
      ${paragraphs(text)}
    </section>`;
  }

  function renderEditorialSupport(day) {
    const support = day.editorialSupport;
    if (!support) return "";
    const questions = Array.isArray(support.questions) ? support.questions : [];
    const steps = Array.isArray(support.practiceSteps) ? support.practiceSteps : [];
    return `<section class="editorial-support" id="section-deepening" aria-labelledby="deepening-title">
      <div class="editorial-support-head"><span class="editorial-kicker">${icon("spark")} Complemento editorial</span><h2 id="deepening-title">Leve a reflexão para o seu dia.</h2><p>Uma camada extra de leitura criada para esta experiência; não faz parte do texto original do e-book.</p></div>
      <article class="essence-panel"><span>Essência do dia</span><p>${esc(support.essence)}</p></article>
      <div class="editorial-columns">
        <section class="prompt-panel" aria-labelledby="prompt-title"><h3 id="prompt-title">Perguntas para o caderno</h3><ol>${questions.map(question => `<li>${esc(question)}</li>`).join("")}</ol></section>
        <section class="practice-panel" aria-labelledby="practice-title"><h3 id="practice-title">Prática guiada</h3><ol>${steps.map((step, index) => `<li><span class="practice-step-number">0${index + 1}</span><span>${esc(step)}</span></li>`).join("")}</ol></section>
      </div>
      <p class="integration-line"><span>Para levar com você</span>“${esc(support.integrationLine)}”</p>
    </section>`;
  }

  function renderDay(number) {
    const day = dayByNumber(number);
    if (!day) return renderIndex();
    state.lastDay = day.number;
    state.started = true;
    saveState();
    setActiveNav("index");
    const done = isComplete(day.number);
    const note = state.notes[String(day.number)] || "";
    const previous = day.number > 1 ? day.number - 1 : null;
    const next = day.number < 21 ? day.number + 1 : null;
    app.innerHTML = `<div class="view-enter">
      <section class="page-top"><div class="wrap">
        <div class="breadcrumb"><button type="button" data-view="home">Início</button><span aria-hidden="true">/</span><button type="button" data-view="index">Jornada</button><span aria-hidden="true">/</span><span>Dia ${day.number}</span></div>
        <div class="day-progress-meta"><span>Semana ${weekNumber(day.number)} · Dia ${String(day.number).padStart(2, "0")} de 21</span><span>${completionPercent()}% concluído</span></div>
        <div class="overall-progress" role="progressbar" aria-label="Progresso da jornada" aria-valuemin="0" aria-valuemax="21" aria-valuenow="${completedCount()}"><span style="width:${completionPercent()}%"></span></div>
      </div></section>
      <section class="reading-shell"><div class="wrap reading-layout">
        <aside class="reading-rail" aria-label="Atalhos dos dias"><p class="reading-rail-label">Sua jornada</p><div class="reading-rail-progress"><span>${completedCount()}/21</span><span class="rail-bar"><span style="width:${completionPercent()}%"></span></span></div>${book.days.map(item => `<button class="rail-day${item.number === day.number ? " is-current" : ""}${isComplete(item.number) ? " is-complete" : ""}" type="button" data-day="${item.number}" aria-current="${item.number === day.number ? "step" : "false"}"><span class="rail-dot" aria-hidden="true"></span>Dia ${String(item.number).padStart(2, "0")}</button>`).join("")}<button type="button" class="text-link rail-more" data-view="index">Índice completo ${icon("arrow-right")}</button></aside>
        <article class="reading-main">
          <div class="reading-day-meta">${icon("journey")} Dia ${String(day.number).padStart(2, "0")} <span aria-hidden="true">·</span> Semana ${weekNumber(day.number)}</div>
          <h1 class="reading-title" tabindex="-1">${esc(day.title)}</h1>
          <p class="reading-subtitle">Despertar Espiritual · José Cristovão</p>
          <nav class="reading-jumpbar" aria-label="Nesta leitura"><span>Ir para</span><button type="button" data-scroll="section-reflection">Reflexão</button><button type="button" data-scroll="section-verse">Versículo</button><button type="button" data-scroll="section-teaching">Ensinamento</button><button type="button" data-scroll="section-prayer">Oração</button><button type="button" data-scroll="section-practical">Ação</button><button type="button" data-scroll="section-deepening">Aprofundar</button></nav>
          <div class="source-content-label">${icon("journey")} Texto original do e-book</div>
          <div class="reading-divider" aria-hidden="true"></div>
          ${renderReadingSection("reflection", day.sections.reflection)}
          ${renderReadingSection("verse", day.sections.verse)}
          ${renderReadingSection("teaching", day.sections.teaching)}
          ${renderReadingSection("prayer", day.sections.prayer)}
          ${renderReadingSection("action", day.sections.action)}
          ${renderEditorialSupport(day)}
          <section class="note-card" aria-labelledby="notes-title">
            <div class="note-header"><div><span class="eyebrow">Seu caderno</span><h2 id="notes-title">O que ficou com você?</h2></div><span class="save-state" id="note-save-state">${note ? "Salvo neste dispositivo" : "Salvo automaticamente"}</span></div>
            <textarea data-note-day="${day.number}" aria-label="Anotações pessoais do Dia ${day.number}" placeholder="Escreva algumas palavras, uma oração, uma intenção ou uma pergunta para voltar a ela…">${esc(note)}</textarea>
            <div class="note-card-foot"><p class="private-note">${icon("lock")} Suas anotações ficam apenas neste navegador.</p><button class="text-link" type="button" data-view="journal">Ver meu caderno ${icon("arrow-right")}</button></div>
          </section>
          <div class="day-controls">
            <button class="complete-control" type="button" data-action="toggle-complete" data-day="${day.number}" aria-pressed="${done}"><span class="check" aria-hidden="true">${done ? icon("check") : ""}</span>${done ? "Dia concluído" : "Marcar dia como concluído"}</button>
            <div class="day-pagination">${previous ? `<button type="button" data-day="${previous}">${icon("arrow-right", "icon--back")} Dia anterior</button>` : `<button type="button" data-view="index">${icon("arrow-right", "icon--back")} Jornada</button>`}${next ? `<button type="button" data-day="${next}">Próximo dia ${icon("arrow-right")}</button>` : `<button type="button" data-view="closing">Encerrar jornada ${icon("arrow-right")}</button>`}</div>
          </div>
        </article>
      </div></section>
    </div>`;
    focusHeading(".reading-title");
  }

  function renderClosing() {
    setActiveNav("closing");
    app.innerHTML = `<div class="view-enter">
      <section class="closing-hero"><div class="wrap"><span class="eyebrow">Um caminho que continua</span><h1>O despertar não termina aqui.</h1><p>${completedCount()} de 21 dias concluídos. Leve consigo o que floresceu nesta jornada.</p></div></section>
      <section class="closing-content"><div class="wrap closing-layout">
        <article class="closing-text"><span class="eyebrow">Uma palavra de encerramento</span>${paragraphs(book.conclusion)}${book.finalMessage ? `<div class="reading-divider" aria-hidden="true"></div><h2>Mensagem final</h2>${paragraphs(book.finalMessage)}` : ""}
          <div class="safety-note">Este conteúdo é devocional. Para questões de saúde emocional, ele não substitui acompanhamento psicológico, médico ou outro apoio profissional qualificado.</div>
          <div class="closing-actions"><button class="button button--light" type="button" data-day="21">Rever o Dia 21</button><button class="text-link" type="button" data-view="index">Voltar à jornada ${icon("arrow-right")}</button></div>
        </article>
        <aside class="commitment-card"><span class="eyebrow">Seu próximo passo</span><h2>Um compromisso de continuidade.</h2><p>Escreva uma prática, uma área em que deseja crescer ou uma forma de servir. Você pode voltar a este compromisso quando quiser.</p><textarea id="commitment" aria-label="Meu compromisso pessoal de continuidade" placeholder="Com a ajuda de Deus, quero…">${esc(state.commitment)}</textarea><span class="save-state" id="commitment-save-state">${state.commitment ? "Salvo neste dispositivo" : "Salvo automaticamente"}</span><p class="private-note">${icon("lock")} Este compromisso fica salvo apenas neste dispositivo.</p></aside>
      </div></section>
    </div>`;
    focusHeading(".closing-hero h1");
  }

  function focusHeading(selector) {
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    window.scrollTo({ top: 0, behavior });
    requestAnimationFrame(() => {
      const heading = app.querySelector(selector);
      if (heading) heading.focus({ preventScroll: true });
    });
  }

  function navigateView(view) {
    if (view === "home") renderHome();
    else if (view === "index") renderIndex();
    else if (view === "progress") renderProgress();
    else if (view === "journal") renderJournal();
    else if (view === "closing") renderClosing();
  }

  document.addEventListener("click", event => {
    const jump = event.target.closest("[data-scroll]");
    if (jump) {
      const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
      document.getElementById(jump.dataset.scroll)?.scrollIntoView({ behavior, block: "start" });
      return;
    }
    const control = event.target.closest("[data-view], [data-day], [data-action]");
    if (!control) return;
    if (control.dataset.view) { navigateView(control.dataset.view); return; }
    if (control.dataset.day) {
      const number = Number(control.dataset.day);
      if (control.dataset.action === "toggle-complete") {
        state.completed = isComplete(number) ? state.completed.filter(item => item !== number) : [...state.completed, number].sort((a, b) => a - b);
        saveState();
        renderDay(number);
        showToast(isComplete(number) ? "Dia marcado como concluído." : "Conclusão atualizada.");
      } else renderDay(number);
      return;
    }
    if (control.dataset.action === "start") renderDay(state.started ? state.lastDay : 1);
  });

  document.addEventListener("input", event => {
    const noteField = event.target.closest("[data-note-day]");
    if (noteField) {
      const day = String(noteField.dataset.noteDay);
      state.notes[day] = noteField.value;
      saveState();
      const label = document.getElementById("note-save-state");
      if (label) label.textContent = "Salvo agora neste dispositivo";
      return;
    }
    if (event.target.id === "commitment") {
      state.commitment = event.target.value;
      saveState();
      const label = document.getElementById("commitment-save-state");
      if (label) label.textContent = "Salvo agora neste dispositivo";
    }
  });

  fetch("/data/devotional.json")
    .then(response => { if (!response.ok) throw new Error("Não foi possível carregar o conteúdo."); return response.json(); })
    .then(data => { book = data; renderHome(); })
    .catch(() => {
      app.innerHTML = `<section class="wrap page-top"><p class="eyebrow">Despertar Espiritual</p><h1 class="section-title">Não foi possível abrir a jornada.</h1><p class="lead">Atualize a página para tentar novamente.</p></section>`;
    });
})();
