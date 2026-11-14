/* Quintal dos Moinhos — comportamento comum a todas as páginas */
(function () {
  'use strict';

  /* Tela de carregamento (celular e tablet). O <head> liga a classe "skel"; ela só aparece se a página
     demorar mais de 400 ms e fica pelo menos 350 ms, para não piscar em conexão boa.
     Para ver na revisão, abra a página com ?esqueleto no endereço (ela fica 4 s). */
  var raiz = document.documentElement;
  if (raiz.classList.contains('skel')) {
    var forcado = location.search.indexOf('esqueleto') !== -1;
    var mostradoEm = 0, saiu = false;
    var timerMostra = setTimeout(function () { mostradoEm = Date.now(); raiz.classList.add('skel-on'); }, forcado ? 0 : 400);
    var limpar = function () { raiz.classList.remove('skel', 'skel-on', 'skel-off'); };
    var sair = function () {
      if (saiu) return;
      saiu = true;
      clearTimeout(timerMostra);
      if (!mostradoEm) { limpar(); return; }
      setTimeout(function () { raiz.classList.add('skel-off'); setTimeout(limpar, 320); }, Math.max(0, 350 - (Date.now() - mostradoEm)));
    };
    var carregou = new Promise(function (ok) { if (document.readyState === 'complete') ok(); else window.addEventListener('load', ok, { once: true }); });
    var fontes = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.all([carregou, fontes]).then(function () { if (forcado) setTimeout(sair, 4000); else sair(); });
    setTimeout(sair, 8000); // segurança: nunca prende a tela
  }
  window.addEventListener('pageshow', function (e) { if (e.persisted) raiz.classList.remove('skel', 'skel-on', 'skel-off'); });

  // Número do WhatsApp do hotel (DDI + DDD + número, só dígitos). Número de exemplo: trocar aqui pelo real.
  var WHATSAPP = '5519900000000';

  function waLink(texto) {
    return 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(texto);
  }

  var brandLink = document.querySelector('a.brand');
  var base = brandLink ? brandLink.getAttribute('href').replace(/index\.html$/, '') : ''; // '' ou '/' (a 404 usa caminhos da raiz)

  /* Links diretos para o WhatsApp: <a data-wa="mensagem"> */
  document.querySelectorAll('[data-wa]').forEach(function (a) {
    var msg = a.getAttribute('data-wa') || 'Olá! Gostaria de fazer uma reserva.';
    a.href = waLink(msg);
    a.target = '_blank';
    a.rel = 'noopener';
  });

  /* Menu no celular */
  var toggle = document.querySelector('.nav__toggle');
  var links = document.querySelector('.nav__links');
  if (toggle && links) {
    var fechar = function () { links.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Abrir menu'); };
    toggle.addEventListener('click', function () {
      var aberto = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', aberto ? 'true' : 'false');
      toggle.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
    });
    links.addEventListener('click', function (e) { if (e.target.closest('a')) fechar(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fechar(); });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', fechar);
  }

  /* Botão do WhatsApp: só o ícone enquanto a página está no topo */
  var flutuante = document.querySelector('.wa-float');
  if (flutuante) {
    var compactar = function () { flutuante.classList.toggle('is-compact', window.scrollY < 120); };
    window.addEventListener('scroll', compactar, { passive: true });
    compactar();
  }

  /* Galeria com ampliação */
  var dlg = document.querySelector('dialog.lightbox');
  var todos = Array.prototype.slice.call(document.querySelectorAll('[data-lightbox]'));
  var itens = todos; // lista usada na ampliação: só as fotos visíveis (muda com o filtro)
  if (dlg && todos.length) {
    var holder = dlg.querySelector('.lightbox__stage');
    var contador = dlg.querySelector('.lightbox__count');
    var atual = 0;
    var mostrar = function (i) {
      atual = (i + itens.length) % itens.length;
      var el = itens[atual];
      holder.innerHTML = '';
      var img = new Image();
      img.className = 'lightbox__img';
      img.alt = el.getAttribute('data-alt') || '';
      img.src = el.getAttribute('data-full');
      holder.appendChild(img);
      if (contador) contador.textContent = (atual + 1) + ' de ' + itens.length;
    };
    todos.forEach(function (el) {
      el.addEventListener('click', function () {
        itens = todos.filter(function (x) { return !x.hidden; });
        mostrar(itens.indexOf(el));
        if (!dlg.open) dlg.showModal();
      });
    });
    dlg.querySelector('.lightbox__close').addEventListener('click', function () { dlg.close(); });
    dlg.querySelector('.lightbox__prev').addEventListener('click', function () { mostrar(atual - 1); });
    dlg.querySelector('.lightbox__next').addEventListener('click', function () { mostrar(atual + 1); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target.classList.contains('lightbox__inner')) dlg.close(); });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') mostrar(atual - 1);
      if (e.key === 'ArrowRight') mostrar(atual + 1);
    });
  }

  /* Filtro da galeria: botões com aria-pressed escondem as fotos de outras categorias */
  var filtros = Array.prototype.slice.call(document.querySelectorAll('[data-filtro]'));
  if (filtros.length) {
    var contagem = document.getElementById('galeria-contagem');
    filtros.forEach(function (b) {
      b.addEventListener('change', function () {
        var cat = b.getAttribute('data-filtro');
        var n = 0;
        todos.forEach(function (el) {
          var mostra = cat === 'todos' || el.getAttribute('data-cat') === cat;
          el.hidden = !mostra;
          if (mostra) n++;
        });
        if (contagem) contagem.textContent = n === 1 ? 'Mostrando 1 foto.' : 'Mostrando ' + n + ' fotos.';
        if (window.history && history.replaceState) history.replaceState(null, '', cat === 'todos' ? location.pathname + location.search : '#' + cat);
      });
    });
    var filtroDaUrl = function () {
      var cat = location.hash.replace('#', '') || 'todos';
      var alvo = filtros.filter(function (b) { return b.getAttribute('data-filtro') === cat; })[0];
      if (alvo && !alvo.checked) alvo.click();
    };
    filtroDaUrl();
    window.addEventListener('hashchange', filtroDaUrl);
  }

  /* Privacidade (LGPD). O site não usa analytics nem cookies de publicidade: nada de rastreamento carrega.
     A única coisa que pede escolha é o mapa do Google. A escolha fica só neste navegador e vale por 12 meses. */
  var CHAVE_CONSENT = 'qm-consentimento';
  function lerConsent() {
    try {
      var c = JSON.parse(localStorage.getItem(CHAVE_CONSENT));
      if (c && c.data && Date.now() - new Date(c.data).getTime() < 365 * 864e5) return c;
    } catch (err) {}
    return null;
  }
  function gravarConsent(mapa) {
    try { localStorage.setItem(CHAVE_CONSENT, JSON.stringify({ versao: 1, mapa: !!mapa, data: new Date().toISOString() })); } catch (err) {}
  }

  var mapaBox = document.querySelector('[data-map]');
  var mapaGate = mapaBox ? mapaBox.firstElementChild : null;
  function mostrarMapa() {
    if (!mapaBox || mapaBox.classList.contains('is-loaded')) return;
    var f = document.createElement('iframe');
    f.title = 'Mapa com a localização do Quintal dos Moinhos, no centro de Holambra';
    f.loading = 'lazy';
    f.referrerPolicy = 'no-referrer-when-downgrade';
    f.src = mapaBox.getAttribute('data-src');
    mapaBox.replaceChildren(f);
    mapaBox.classList.add('is-loaded');
  }
  function esconderMapa() {
    if (!mapaBox || !mapaBox.classList.contains('is-loaded')) return;
    mapaBox.classList.remove('is-loaded');
    mapaBox.replaceChildren(mapaGate);
  }

  var banner = null;
  function fecharBanner(volta) {
    if (banner) { banner.remove(); banner = null; }
    if (volta && volta.focus) volta.focus();
  }
  function abrirBanner(origem) {
    if (banner) return;
    banner = document.createElement('div');
    banner.className = 'cookie';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-modal', 'false');
    banner.setAttribute('aria-labelledby', 'cookie-t');
    banner.setAttribute('aria-describedby', 'cookie-d');
    banner.innerHTML =
      '<h2 id="cookie-t">Sua privacidade</h2>' +
      '<p id="cookie-d">Este site não usa cookies de publicidade nem de análise. O mapa do Google, que só aparece com a sua permissão, usa cookies do Google. ' +
      '<a href="' + base + 'privacidade.html#cookies">Saiba mais</a>.</p>' +
      '<div class="cookie__acoes">' +
      '<button class="btn btn--secondary" type="button" data-c="nao">Recusar</button>' +
      '<button class="btn btn--primary" type="button" data-c="sim">Aceitar</button>' +
      '</div>';
    banner.addEventListener('click', function (e) {
      var b = e.target.closest('[data-c]');
      if (!b) return;
      var sim = b.getAttribute('data-c') === 'sim';
      gravarConsent(sim);
      if (sim) mostrarMapa(); else esconderMapa();
      fecharBanner(origem);
    });
    banner.addEventListener('keydown', function (e) { if (e.key === 'Escape' && origem) fecharBanner(origem); });
    document.body.appendChild(banner);
    if (origem) banner.querySelector('[data-c]').focus();
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-map-load], [data-cookie-prefs]') : null;
    if (!t) return;
    if (t.hasAttribute('data-map-load')) mostrarMapa(); // só desta vez; a escolha guardada é a do aviso
    else abrirBanner(t);
  });
  var consent = lerConsent();
  if (consent && consent.mapa) mostrarMapa();
  if (!consent) abrirBanner(null);

  /* Datas: hoje como mínimo e saída sempre depois da entrada (barra da Home e formulário de reserva) */
  function hojeISO() {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function somarDia(iso, n) {
    var p = iso.split('-');
    var d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2] + n));
    return d.getUTCFullYear() + '-' + ('0' + (d.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + d.getUTCDate()).slice(-2);
  }
  function noites(entrada, saida) {
    var a = entrada.split('-'), b = saida.split('-');
    return Math.round((Date.UTC(+b[0], +b[1] - 1, +b[2]) - Date.UTC(+a[0], +a[1] - 1, +a[2])) / 864e5);
  }
  function br(iso) { var p = iso.split('-'); return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]))); }
  function reais(v) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }

  function ligarDatas(form) {
    var ent = form.elements.entrada, sai = form.elements.saida;
    if (!ent || !sai) return;
    var hoje = hojeISO();
    ent.min = hoje;
    sai.min = somarDia(hoje, 1);
    ent.addEventListener('change', function () {
      if (!ent.value) return;
      sai.min = somarDia(ent.value, 1);
      if (!sai.value || sai.value <= ent.value) sai.value = somarDia(ent.value, 1);
      sai.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }
  /* Barra de reserva da página inicial: datas, hóspedes e quarto, com prévia do valor */
  var barra = document.getElementById('barra-reserva');
  if (barra) {
    ligarDatas(barra);
    var hojeB = hojeISO();
    if (!barra.elements.entrada.value) barra.elements.entrada.value = somarDia(hojeB, 7); // datas iniciais: daqui a uma semana, 1 diária
    if (!barra.elements.saida.value) barra.elements.saida.value = somarDia(hojeB, 8);
    var resB = document.getElementById('b-resultado');
    var estadoB = function () {
      var e = barra.elements.entrada.value, s = barra.elements.saida.value, o = barra.elements.quarto.selectedOptions[0];
      var gente = +barra.elements.adultos.value;
      resB.classList.remove('is-erro');
      if (!o || !o.value) { resB.textContent = 'Escolha o quarto para ver o valor da estadia.'; return { ok: true }; }
      var cap = +o.getAttribute('data-cap'), preco = +o.getAttribute('data-preco');
      if (gente > cap) {
        resB.classList.add('is-erro');
        resB.textContent = 'Este quarto acomoda até ' + cap + ' pessoas. Escolha outro quarto ou menos hóspedes.';
        return { ok: false };
      }
      if (!e || !s || s <= e) { resB.textContent = 'Escolha as datas de entrada e saída.'; return { ok: true }; }
      var n = noites(e, s), total = n * preco;
      resB.innerHTML = '<span><strong>' + n + (n === 1 ? ' diária' : ' diárias') + '</strong> × ' + reais(preco) + ' = <span class="price">' + reais(total) + '</span></span>' +
        '<span class="estimate__small">Café incluso. Valor estimado, sujeito à confirmação pelo WhatsApp.</span>';
      return { ok: true };
    };
    ['entrada', 'saida', 'adultos', 'quarto'].forEach(function (nome) { barra.elements[nome].addEventListener('change', estadoB); });
    estadoB();
    barra.addEventListener('submit', function (ev) {
      var st = estadoB();
      if (!st.ok) { ev.preventDefault(); barra.elements.quarto.focus(); return; }
      if (!barra.elements.quarto.value) barra.elements.quarto.disabled = true; // sem quarto escolhido, não manda o parâmetro vazio
    });
  }

  /* Formulário de reserva: valida, estima o valor e abre o WhatsApp com a mensagem pronta */
  var form = document.getElementById('form-reserva');
  if (form) {
    ligarDatas(form);
    var out = document.getElementById('estimativa');
    var status = document.getElementById('form-status');

    function erro(campo, texto) {
      var el = document.getElementById(campo.id + '-erro');
      if (texto) { campo.setAttribute('aria-invalid', 'true'); if (el) el.textContent = texto; }
      else { campo.removeAttribute('aria-invalid'); if (el) el.textContent = ''; }
    }
    function quartoAtual() {
      var o = form.elements.quarto.selectedOptions[0];
      if (!o || !o.value) return null;
      return { nome: o.value, preco: +o.getAttribute('data-preco'), cap: +o.getAttribute('data-cap') };
    }
    function pessoas() { return (+form.elements.adultos.value || 0) + (+form.elements.criancas.value || 0); }

    function estimar() {
      var q = quartoAtual(), e = form.elements.entrada.value, s = form.elements.saida.value;
      if (!q || !e || !s || s <= e) {
        out.innerHTML = '<p>Escolha o quarto e as datas para ver uma estimativa do valor.</p>';
        return null;
      }
      var n = noites(e, s), total = n * q.preco;
      out.innerHTML =
        '<p><strong>' + n + (n === 1 ? ' diária' : ' diárias') + '</strong> × ' + reais(q.preco) + ' = <span class="price">' + reais(total) + '</span></p>' +
        '<p class="estimate__small">Café da manhã colonial incluso. Valor estimado, sujeito à disponibilidade e à confirmação pelo WhatsApp (em alta temporada os valores podem variar).</p>';
      return { n: n, total: total };
    }
    ['entrada', 'saida', 'adultos', 'criancas', 'quarto'].forEach(function (nome) {
      form.elements[nome].addEventListener('change', estimar);
    });

    // preenche a partir do que veio da barra da Home ou do botão de um quarto: ?entrada=...&saida=...&adultos=...&quarto=...
    var q = new URLSearchParams(location.search);
    ['entrada', 'saida', 'adultos', 'criancas', 'quarto'].forEach(function (nome) {
      var v = q.get(nome);
      if (v && form.elements[nome]) form.elements[nome].value = v;
    });
    estimar();

    var aceite = form.elements.aceite;
    if (aceite) aceite.addEventListener('change', function () { if (aceite.checked) erro(aceite, ''); });

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var f = form.elements, primeiro = null, hoje = hojeISO();
      function falha(campo, texto) { erro(campo, texto); primeiro = primeiro || campo; }
      ['nome', 'entrada', 'saida', 'adultos', 'quarto', 'aceite'].forEach(function (n) { erro(f[n], ''); });
      var qa = quartoAtual();

      if (!f.nome.value.trim()) falha(f.nome, 'Escreva o seu nome.');
      if (!f.entrada.value) falha(f.entrada, 'Escolha a data de entrada.');
      else if (f.entrada.value < hoje) falha(f.entrada, 'A entrada não pode ser uma data que já passou.');
      if (!f.saida.value) falha(f.saida, 'Escolha a data de saída.');
      else if (f.entrada.value && f.saida.value <= f.entrada.value) falha(f.saida, 'A saída precisa ser depois da entrada.');
      if (!(+f.adultos.value >= 1)) falha(f.adultos, 'Informe ao menos 1 adulto.');
      if (!qa) falha(f.quarto, 'Escolha o tipo de quarto.');
      else if (pessoas() > qa.cap) falha(f.quarto, 'Este quarto acomoda até ' + qa.cap + ' pessoas. Escolha outro ou reduza os hóspedes.');
      if (!f.aceite.checked) falha(f.aceite, 'Marque a caixa para concordar e enviar.');

      if (primeiro) { primeiro.focus(); status.textContent = 'Revise os campos marcados.'; return; }

      var est = estimar();
      var texto = 'Olá! Meu nome é ' + f.nome.value.trim() + '. Gostaria de reservar: ' + qa.nome + ', de ' + br(f.entrada.value) + ' a ' + br(f.saida.value) +
        ' (' + est.n + (est.n === 1 ? ' diária' : ' diárias') + '), para ' + f.adultos.value + (+f.adultos.value === 1 ? ' adulto' : ' adultos') +
        (+f.criancas.value ? ' e ' + f.criancas.value + (+f.criancas.value === 1 ? ' criança' : ' crianças') : '') + '.' +
        '\nEstimativa: ' + reais(est.total) + ' (café incluso).';
      if (f.mensagem.value.trim()) texto += '\n\n' + f.mensagem.value.trim();
      status.textContent = 'Abrindo o WhatsApp…';
      try { localStorage.setItem('qm-aceite', JSON.stringify({ privacidade: 1, termos: 1, cancelamento: 1, data: new Date().toISOString() })); } catch (err) {}
      window.open(waLink(texto), '_blank', 'noopener');
      setTimeout(function () { location.href = base + 'obrigado.html'; }, 350);
    });
  }

  /* Toque: o efeito de "apertar" e a ondulação aparecem mesmo em toques muito rápidos (o :active sozinho some em ~80 ms).
     Só para dedo e caneta; com o mouse valem apenas os estilos de :hover e :active. */
  var PRESSABLE = '.btn, .gallery__item, .nav__toggle, .nav__links a, .lightbox__btn, .wa-float, .link, .brand, .footer li a, .infos a, .footer__legal a, a.card';
  var RIPPLE = '.btn, .nav__toggle, .wa-float, .lightbox__btn';
  document.addEventListener('touchstart', function () {}, { passive: true }); // iOS: liga o :active
  function ripple(el, x, y) {
    var r = el.getBoundingClientRect();
    var d = Math.max(r.width, r.height) * 2.2;
    var s = document.createElement('i');
    s.className = 'ripple';
    s.setAttribute('aria-hidden', 'true');
    s.style.width = s.style.height = d + 'px';
    s.style.left = (x - r.left - d / 2) + 'px';
    s.style.top = (y - r.top - d / 2) + 'px';
    el.appendChild(s);
    setTimeout(function () { s.remove(); }, 650);
  }
  document.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse') return;
    var el = e.target.closest ? e.target.closest(PRESSABLE) : null;
    if (!el) return;
    var shownSince = 0;
    var timer = setTimeout(show, 45); // pequena espera: se o dedo começar a rolar a página, não aperta
    function show() {
      timer = null; shownSince = Date.now(); el.classList.add('is-pressed');
      if (el.matches(RIPPLE)) ripple(el, e.clientX, e.clientY);
    }
    function hide() { el.classList.remove('is-pressed'); }
    function release(ev) {
      el.removeEventListener('pointerup', release);
      el.removeEventListener('pointercancel', release);
      el.removeEventListener('pointerleave', release);
      if (ev.type !== 'pointerup') { clearTimeout(timer); hide(); return; }
      if (timer) { clearTimeout(timer); show(); }
      setTimeout(hide, Math.max(0, 150 - (Date.now() - shownSince)));
    }
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
    el.addEventListener('pointerleave', release);
  }, { passive: true });

  /* Ano no rodapé */
  document.querySelectorAll('[data-ano]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
