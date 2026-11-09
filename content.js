(() => {
  "use strict";

  // 個別作品ページ以外では何も変更しません。
  if (!/^\/photo\/\d+\/?$/.test(window.location.pathname)) return;
  if (document.getElementById("poet-vr-extension-host")) return;

  const host = document.createElement("div");
  host.id = "poet-vr-extension-host";
  document.documentElement.appendChild(host);
  const shadow = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = `
    :host { all: initial; color-scheme: light; }
    *, *::before, *::after { box-sizing: border-box; }
    button { font: inherit; cursor: pointer; }
    button:focus-visible, input:focus-visible { outline: 3px solid #4973ac; outline-offset: 3px; }
    #launch {
      position: fixed; right: 24px; bottom: 24px; z-index: 2147483644;
      display: flex; align-items: center; gap: 8px;
      background: #273b34; color: #fff; border: 0; border-radius: 999px;
      padding: 13px 19px; box-shadow: 0 4px 20px #0003;
      font-size: 14px; font-weight: 650; line-height: 1.35;
    }
    #launch:hover { background: #3a584d; }
    #veil { display:none; position: fixed; inset: 0; z-index: 2147483645;
      background: #f6f3eb; color: #292b27; font-family: "Yu Mincho", "Hiragino Mincho ProN", "Noto Serif JP", serif; }
    /* 画像を一画面に押し込まず、画像→縦書き本文の順に縦スクロールする。 */
    #veil.open { display:flex; flex-direction:column; overflow-x:hidden; overflow-y:auto;
      overscroll-behavior:contain; }
    #toolbar { position:sticky; top:0; z-index:3; }
    #toolbar { flex: 0 0 auto; display:flex; align-items:center; flex-wrap:wrap; gap: 10px;
      padding: 12px max(16px, env(safe-area-inset-left)); min-height: 60px;
      background: #fffdf8; border-bottom: 1px solid #dfd9c9;
      font-family: -apple-system, BlinkMacSystemFont, "Yu Gothic", "Meiryo", sans-serif;
      font-size: 13px; }
    #brand { font-weight: 700; margin-right: auto; white-space: nowrap; }
    #toolbar button { background:#fff; border:1px solid #aaa89e; border-radius:7px;
      padding:8px 12px; color:#30322f; }
    #toolbar button:hover { background:#ebe8dd; }
    #toolbar button.active { background:#354e42; color:#fff; border-color:#354e42; }
    #toolbar label { display:flex; align-items:center; gap:8px; white-space:nowrap; }
    #size { accent-color:#354e42; width:100px; cursor:pointer; }
    #size-label { display:inline-block; min-width:2.4em; font-variant-numeric:tabular-nums; }
    /* 画像がある場合も、v0.3.0 と同じくツールバーと操作欄を除く画面の高さを使う。 */
    #reader { flex:0 0 auto; height:calc(100dvh - var(--poet-ui-height, 114px));
      min-height:0; min-width:0; overflow:auto;
      overscroll-behavior:contain; scrollbar-color:#ad9f8a transparent; }
    /* 画像がない作品は、従来どおり読書画面を残りの高さで満たす。 */
    #image-panel[hidden] ~ #reader { flex:1 1 auto; height:auto; min-height:0; }
    /* 縦書きではページ下の進捗バーだけを表示し、ブラウザ標準のスクロールバーは隠す。 */
    #reader.vertical { direction:rtl; overflow-x:auto; overflow-y:hidden;
      scrollbar-width:none; -ms-overflow-style:none; }
    #reader.vertical::-webkit-scrollbar { display:none; width:0; height:0; }
    #page { color:#292b27; font-size:21px; line-height:1.95;
      font-family:"Yu Mincho", "Hiragino Mincho ProN", "Noto Serif JP", serif; }
    #reader.vertical #page { direction:ltr; writing-mode:vertical-rl; text-orientation:mixed;
      box-sizing:border-box; height:100%; width:max-content; min-width:100%;
      padding:clamp(24px, 6vh, 64px) clamp(26px, 7vw, 110px);
      overflow-wrap:anywhere; }
    #reader.fallback { direction:ltr; overflow:auto; }
    #reader.fallback #page { display:none; }
    #masthead { margin:0; }
    #title { margin:0; padding:0; font-size:1.5em; line-height:1.65; font-weight:600; letter-spacing:.11em; }
    #author { margin:0; padding:0; font-size:.76em; line-height:1.6; color:#676253; letter-spacing:.08em; }
    #author:empty { display:none; }
    #reader.vertical #masthead { margin-block-end:3.6em; }
    #reader.vertical #title { max-height:100%; }
    /* 縦書きの著者名はタイトルより下から始める。 */
    #reader.vertical #author { padding-inline-start:clamp(4.5em, 25vh, 11em); }
    #poem { white-space:pre-wrap; tab-size:4; font-weight:400; margin:0; }
    /* 画像は本来の表示幅を再現する。高さ制限・サムネイル化はしない。 */
    #image-panel { flex:0 0 auto; width:100%; direction:ltr; writing-mode:horizontal-tb;
      padding:26px 22px 42px; background:#f6f3eb; border-bottom:1px solid #dfd9c9;
      font-family:-apple-system, BlinkMacSystemFont, "Yu Gothic", "Meiryo", sans-serif; }
    #image-panel[hidden], #image-viewer[hidden] { display:none; }
    #image-panel-heading { display:none; }
    #image-strip { display:flex; flex-direction:column; gap:24px; align-items:center;
      width:100%; margin:0 auto; overflow:visible; }
    #image-strip button { display:block; flex:0 1 auto; max-width:100%; width:auto;
      padding:0; background:transparent; border:0; border-radius:0;
      cursor:zoom-in; overflow:visible; }
    #image-strip button:focus-visible { outline:3px solid #4973ac; outline-offset:3px; }
    #image-strip img { display:block; max-width:100%; max-height:none;
      width:auto; height:auto; object-fit:contain; border-radius:0; box-shadow:none; }
    #image-viewer { position:fixed; inset:0; z-index:10; display:flex; flex-direction:column;
      background:#141414f5; color:#fff; direction:ltr; writing-mode:horizontal-tb; }
    #image-viewer-bar { display:flex; align-items:center; justify-content:space-between;
      flex:0 0 auto; gap:15px; padding:12px 20px; font:14px/1.4 sans-serif; }
    #image-close { padding:8px 14px; border:1px solid #aaa; background:#242424;
      color:#fff; border-radius:8px; }
    #image-viewer-body { flex:1 1 auto; min-height:0; min-width:0; display:flex;
      align-items:center; justify-content:center; padding:15px; overflow:auto; }
    #image-full { display:block; max-width:100%; max-height:100%; width:auto; height:auto;
      object-fit:contain; }
    #scroll-controls { display:flex; align-items:center; gap:12px; flex:0 0 auto;
      min-height:54px; padding:9px 18px 10px; background:#ede8db;
      border-top:1px solid #d9d0bd;
      color:#4d4b42; font:13px/1.4 -apple-system, BlinkMacSystemFont, "Yu Gothic", sans-serif; }
    #scroll-controls[hidden] { display:none; }
    #scroll-controls button { flex:0 0 auto; border:1px solid #c5bba9; border-radius:7px;
      color:#34392f; background:#faf8f3; font:inherit; padding:7px 12px; }
    #scroll-controls button:hover:not(:disabled) { background:white; }
    #scroll-controls button:disabled { cursor:default; opacity:.40; }
    #progress { flex:1 1 auto; min-width:20px; height:24px; cursor:pointer;
      -webkit-appearance:none; appearance:none; background:transparent; }
    #progress::-webkit-slider-runnable-track { height:8px; border-radius:999px;
      background:#c7bdab; box-shadow:inset 0 1px 2px #0002; }
    #progress::-webkit-slider-thumb { -webkit-appearance:none; appearance:none;
      width:19px; height:19px; margin-top:-5.5px;
      background:#385749; border:3px solid #f5f1e8; border-radius:50%;
      box-shadow:0 1px 4px #0004; }
    #progress:disabled { cursor:default; opacity:.4; }
    #progress-label { min-width:4em; text-align:center; font-variant-numeric:tabular-nums; }
    #scroll-note { white-space:nowrap; color:#716b60; }
    #status { display:none; flex: 0 0 auto; padding:8px 18px; background:#fff9e6;
      border-top:1px solid #e2ce93; color:#6d4c10; font:13px/1.6 sans-serif; }
    #status.visible { display:block; }
    #edit-area { display:none; margin:20px auto; padding:16px; width:min(720px, 95%);
      min-height:230px; border:1px solid #b6a993; border-radius:8px;
      font:16px/1.7 "Yu Gothic", sans-serif; resize:vertical; }
    #edit-area.visible { display:block; }
    #apply-text { display:none; margin:0 auto 20px; padding:11px 22px;
      border:0; background:#354e42; color:white; border-radius:8px;
      font:600 14px/1.4 sans-serif; }
    #apply-text.visible { display:block; }
    @media (max-width:680px) {
      #launch { right:14px; bottom:14px; }
      #toolbar { gap:7px; padding:10px; }
      #brand { display:none; }
      #size { width:65px; }
      #reader.vertical #page { padding:20px 22px; }
      #scroll-controls { gap:6px; padding:7px 10px; }
      #scroll-controls button { padding:7px 8px; }
      #scroll-note { display:none; }
      #progress-label { min-width:3em; }
      #image-panel { padding:18px 10px 28px; }
    }
  `;
  shadow.appendChild(style);

  const launch = document.createElement("button");
  launch.id = "launch";
  launch.type = "button";
  launch.textContent = "縦書きで読む";
  launch.setAttribute("aria-label", "この詩を縦書きリーダーで開く");
  shadow.appendChild(launch);

  const veil = document.createElement("div");
  veil.id = "veil";
  veil.setAttribute("role", "dialog");
  veil.setAttribute("aria-modal", "true");
  veil.setAttribute("aria-label", "詩の読書画面");
  veil.innerHTML = `
    <div id="toolbar">
      <span id="brand">poet.jp 縦書きリーダー</span>
      <label for="size">文字 <input id="size" type="range" min="14" max="36" value="21" step="1"/><span id="size-label">21px</span></label>
      <button id="source" type="button">元のページを見る</button>
    </div>
    <section id="image-panel" hidden aria-label="作品の画像">
      <div id="image-panel-heading"><span id="image-count">作品の画像</span><span>クリックすると拡大</span></div>
      <div id="image-strip"></div>
    </section>
    <div id="reader" class="vertical" tabindex="0" aria-label="詩の本文をスクロールして読む">
      <div id="page"><header id="masthead"><h2 id="title"></h2><p id="author"></p></header><div id="poem"></div></div>
      <textarea id="edit-area" placeholder="抽出できない場合は、元のページの詩本文をコピーしてここに貼り付けてください。"></textarea>
      <button id="apply-text" type="button">入力した本文を縦書きで表示</button>
    </div>
    <div id="scroll-controls" aria-label="縦書きの読み進め操作">
      <button id="next" type="button" title="左へ進む">← 次へ</button>
      <input id="progress" type="range" dir="rtl" min="0" max="1000" value="0" step="1" aria-label="縦書きの読み進め位置" />
      <span id="progress-label" aria-live="off">冒頭</span>
      <button id="previous" type="button" title="右へ戻る">前へ →</button>
      <span id="scroll-note">右から左へ読む</span>
    </div>
    <div id="status" role="status"></div>
    <div id="image-viewer" role="dialog" aria-modal="true" aria-label="画像の拡大表示" hidden>
      <div id="image-viewer-bar"><span id="image-viewer-title">作品の画像</span>
        <button type="button" id="image-close">✕ 閉じる</button></div>
      <div id="image-viewer-body"><img id="image-full" alt="" /></div>
    </div>
  `;
  shadow.appendChild(veil);

  const $ = (id) => shadow.getElementById(id);
  const reader = $("reader");
  const page = $("page");
  const status = $("status");
  const editArea = $("edit-area");
  let mode = "vertical";
  let imageOpener = null;
  let size = 21;
  let lastFocused = null;
  let previousBodyOverflow = "";
  let previousDocumentOverflow = "";

  // v0.3.0 の flex:1 と同じ実効高さを、画像付きの縦スクロール画面でも再現する。
  // 折り返したツールバーやステータス欄の高さも実測して差し引く。
  function syncReaderHeight() {
    const occupied = [$("toolbar"), $("scroll-controls"), $("status")]
      .reduce((sum, el) => sum + el.getBoundingClientRect().height, 0);
    veil.style.setProperty("--poet-ui-height", `${occupied}px`);
    requestAnimationFrame(updateScrollControls);
  }
  const uiResizeObserver = new ResizeObserver(syncReaderHeight);
  [$("toolbar"), $("scroll-controls"), $("status")].forEach(el => uiResizeObserver.observe(el));

  chrome.storage.local.get({ poetVrSize: 21 }, (settings) => {
    const val = Number(settings.poetVrSize);
    if (Number.isFinite(val) && val >= 14 && val <= 36) {
      size = val;
      setFontSize(size, false);
    }
  });

  function setFontSize(value, persist = true) {
    size = Math.max(14, Math.min(36, Number(value) || 21));
    $("size").value = String(size);
    $("size-label").textContent = `${size}px`;
    page.style.fontSize = `${size}px`;
    if (persist) chrome.storage.local.set({ poetVrSize: size });
    requestAnimationFrame(updateScrollControls);
  }

  function maxHorizontalScroll() {
    return Math.max(0, reader.scrollWidth - reader.clientWidth);
  }

  function updateScrollControls() {
    const vertical = mode === "vertical";
    $("scroll-controls").hidden = !vertical;
    if (!vertical) return;
    const max = maxHorizontalScroll();
    const position = Math.min(max, Math.max(0, -reader.scrollLeft)); // RTLでのscrollLeftは0〜負数
    const value = max ? Math.round(position / max * 1000) : 0;
    $("progress").value = String(value);
    $("progress").disabled = max < 1;
    $("next").disabled = max < 1 || position >= max - 1;
    $("previous").disabled = max < 1 || position <= 1;
    $("progress-label").textContent = max < 1 ? "全体表示" : value === 0 ? "冒頭" : value === 1000 ? "末尾" : `${Math.round(value / 10)}%`;
  }

  function setMode(next) {
    mode = next;
    reader.className = mode;
    reader.scrollTop = 0;
    reader.scrollLeft = 0; // RTLは右端（読み始め）が0
    requestAnimationFrame(updateScrollControls);
  }

  function showStatus(message) {
    status.textContent = message;
    status.classList.toggle("visible", Boolean(message));
  }

  function getTitleElement() {
    return document.querySelector("main h1, article h1, .single-photo h1, h1.entry-title, h1");
  }

  function getAuthorName() {
    // poet.jpの投稿者欄は作品本文の後にあるため、「投稿者」という見出しを起点に探します。
    const headings = [...document.querySelectorAll("h2, h3, h4, h5")];
    const heading = headings.find(el => el.textContent.trim() === "投稿者");
    if (heading) {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
      let el, foundHeading = false;
      while ((el = walker.nextNode())) {
        if (el === heading) { foundHeading = true; continue; }
        if (!foundHeading) continue;
        if (/^H[1-6]$/.test(el.tagName) && /^(コメント|関連記事|おすすめ)/.test(el.textContent.trim())) break;
        if (el.tagName === "A") {
          const name = (el.innerText || el.textContent || "").trim();
          if (name && name.length <= 100 && !/^(フォローする|もっと見る|ログイン|プロフィール)$/.test(name)) return name;
        }
      }
      // リンクがなくても投稿者名が直接テキストで置かれている場合。
      const siblingText = (heading.nextElementSibling?.innerText || "").trim().split("\n")[0];
      if (siblingText && siblingText.length <= 100 && !/^(フォローする|コメント)$/.test(siblingText)) return siblingText;
    }
    const author = document.querySelector("[rel=author], .author-name, .user-name");
    return (author?.innerText || "").trim().slice(0, 100);
  }

  function candidateText(node) {
    return (node?.innerText || "").replace(/\r/g, "").replace(/\u00a0/g, " ").trim();
  }

  function cleanup(text) {
    return String(text || "")
      .replace(/\r/g, "")
      .replace(/\u00a0/g, " ")
      .replace(/[\t ]+\n/g, "\n")
      .replace(/\n{5,}/g, "\n\n\n\n")
      .trim();
  }

  function isSkippableElement(el) {
    if (!(el instanceof Element)) return false;
    if (["SCRIPT", "STYLE", "NOSCRIPT", "NAV", "BUTTON", "FORM", "IFRAME", "SVG"].includes(el.tagName)) return true;
    if (el.matches('[aria-hidden="true"], [hidden], .screen-reader-text')) return true;
    return false;
  }

  // HTML の <br>・段落を改行に変換し、全角スペースなどの詩の字下げを残します。
  function fragmentToText(root) {
    let out = "";
    const block = new Set(["DIV", "P", "SECTION", "ARTICLE", "PRE", "BLOCKQUOTE", "LI", "H2", "H3"]);
    const visit = (node, inPre) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const val = node.nodeValue || "";
        if (!inPre && /^\s+$/.test(val) && /\n/.test(val)) return;
        out += inPre ? val : val.replace(/\n[ \t]*/g, " ");
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;
      if (node.nodeType === Node.ELEMENT_NODE && isSkippableElement(node)) return;
      const tag = node.nodeType === Node.ELEMENT_NODE ? node.tagName : "";
      if (tag === "BR") { out += "\n"; return; }
      const boundary = block.has(tag);
      if (boundary && out.length && !out.endsWith("\n")) out += "\n";
      for (const child of node.childNodes) visit(child, inPre || tag === "PRE");
      if (boundary && out.length && !out.endsWith("\n")) out += "\n";
    };
    visit(root, false);
    return cleanup(out);
  }

  function fromBoundedRange(heading) {
    if (!heading) return "";
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    let started = false;
    let boundary = null;
    // 最初に見つかる本文後の日付を終端にする（投稿者欄やコメント欄を含めない）。
    while ((node = walker.nextNode())) {
      if (!started) {
        if (heading.contains(node)) started = true;
        continue;
      }
      if (node.parentElement?.closest("#poet-vr-extension-host, script, style, nav, footer")) continue;
      const value = (node.nodeValue || "").trim();
      if (/^20\d\d[.\/\-年]\s*\d{1,2}[.\/\-月]\s*\d{1,2}日?$/.test(value)) {
        boundary = node;
        break;
      }
      if (/^(投稿者|コメント)$/.test(value)) break;
    }
    if (!boundary) return "";
    try {
      const range = document.createRange();
      range.setStartAfter(heading);
      range.setEndBefore(boundary);
      const result = fragmentToText(range.cloneContents());
      return result.length >= 5 && result.length <= 30000 ? result : "";
    } catch (_) { return ""; }
  }

  function fromContentCandidates(heading) {
    const selectors = [
      ".photo-description", ".photo-content", ".photo-text", ".poem-content",
      ".post-content", ".entry-content", ".single-photo-content",
      ".single-content", ".article-content", ".wp-block-post-content",
      "[itemprop='articleBody']", ".post-description", ".content-text", "pre"
    ];
    const all = document.querySelectorAll(selectors.join(","));
    let best = null;
    let bestScore = -Infinity;
    for (const el of all) {
      if (heading && (el.contains(heading) || (heading.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING))) continue;
      if (el.closest("header, footer, nav, aside, #poet-vr-extension-host")) continue;
      const txt = candidateText(el);
      if (txt.length < 5 || txt.length > 30000 || /(?:^|\n)\s*(?:投稿者|コメント)\s*(?:\n|$)/.test(txt)) continue;
      if (el.querySelector("h1, h2, form, textarea, input")) continue;
      const nlines = (txt.match(/\n/g) || []).length;
      const nbreaks = el.querySelectorAll("br").length;
      const score = Math.min(28, nlines * 1.1) + Math.min(28, nbreaks * 2)
        + Math.min(15, txt.length / 100) + (/poem|photo-text|photo-content|entry-content/.test(el.className?.toString() || "") ? 20 : 0)
        - el.querySelectorAll("a").length * 6 - el.querySelectorAll("button").length * 10;
      if (score > bestScore) { bestScore = score; best = txt; }
    }
    return best || "";
  }

  function extractPoem() {
    const heading = getTitleElement();
    const title = cleanup(heading?.innerText || document.title.replace(/\s*[–|-]\s*poet\.jp.*$/i, "")) || "詩";
    // 選択中の文章を優先。自動認識が難しいレイアウトでも利用できます。
    const selection = cleanup(window.getSelection()?.toString() || "");
    const author = getAuthorName();
    if (selection.length >= 5 && selection.length < 30000) return { title, author, text: selection, selected: true };
    const bounded = fromBoundedRange(heading);
    const candidate = fromContentCandidates(heading);
    // 日付より前の本文を最優先。候補要素は日付を検出できない場合の予備手段。
    // ページ内に短い <pre> がある場合も、作品全体が途中で切れないようにします。
    const text = bounded || candidate;
    return { title, author, text: cleanup(text), selected: false };
  }

  // 画詩では画像がタイトルより前、または本文の途中に置かれることがあります。
  // 本文領域に近い画像だけを選び、プロフィール画像・関連記事の画像は除外します。
  function extractImages(heading, title) {
    if (!heading) return [];
    const scope = heading.closest("article, .single-photo, main, [role='main']")
      || document.querySelector("main") || document.body;
    const exclusions = "nav, footer, aside, form, #poet-vr-extension-host";
    const allImages = [...scope.querySelectorAll("img")];
    const dateNode = findDateAfterHeading(heading);

    const accepted = [];
    for (const img of allImages) {
      if (img.closest(exclusions)) continue;
      const header = img.closest("header");
      if (header && !header.contains(heading)) continue;
      if (img.closest("a[href*='/user/'], a[href*='/member/'], a[href*='/profile/']")) continue;
      if (img.getAttribute("role") === "presentation" || img.getAttribute("aria-hidden") === "true") continue;
      const cl = (img.className?.toString() || "") + " " + (img.parentElement?.className?.toString() || "");
      if (/avatar|profile|icon|logo|emoji|banner|advert/i.test(cl)) continue;
      const w = Number(img.getAttribute("width") || img.naturalWidth || 0);
      const h = Number(img.getAttribute("height") || img.naturalHeight || 0);
      if (w > 0 && h > 0 && (w < 90 || h < 75)) continue;
      const before = Boolean(heading.compareDocumentPosition(img) & Node.DOCUMENT_POSITION_PRECEDING);
      const after = Boolean(heading.compareDocumentPosition(img) & Node.DOCUMENT_POSITION_FOLLOWING);
      if (!before && !after) continue;
      if (after && dateNode && !(img.compareDocumentPosition(dateNode) & Node.DOCUMENT_POSITION_FOLLOWING)) continue;
      const alt = (img.getAttribute("alt") || "").trim();
      const matchTitle = alt === title || (title.length > 3 && alt.includes(title));
      const imageSrc = [img.currentSrc, img.getAttribute("src"), img.getAttribute("data-src"), img.getAttribute("data-lazy-src")]
        .map(safeImageUrl).find(Boolean);
      if (!imageSrc) continue;
      const link = img.closest("a[href]");
      const fullUrl = link && /\.(?:jpe?g|png|gif|webp|avif)(?:[?#]|$)/i.test(link.getAttribute("href") || "")
        ? safeImageUrl(link.getAttribute("href")) : null;
      // 画像の元ページ上の実際の表示幅を記録する（原画像のピクセル幅ではない）。
      const originalWidth = img.getBoundingClientRect().width;
      const attrWidth = Number(img.getAttribute("width") || 0);
      const displayWidth = originalWidth > 1 ? originalWidth : (attrWidth > 1 ? attrWidth : null);
      accepted.push({ img, src:fullUrl || imageSrc, alt: alt || title,
        before, matchTitle, displayWidth });
    }

    const before = accepted.filter(item => item.before);
    const after = accepted.filter(item => !item.before);
    // タイトル直前の画像（画詩）を優先。タイトルのaltが付いた画像は確実に拾います。
    const relevantBefore = before.filter(item => item.matchTitle);
    const chosen = [...(relevantBefore.length ? relevantBefore : before.slice(-1)), ...after];
    const seen = new Set();
    return chosen.filter(item => {
      if (seen.has(item.src)) return false;
      seen.add(item.src);
      return true;
    }).slice(0, 8).map(({src,alt,displayWidth}) => ({src,alt,displayWidth}));
  }

  function findDateAfterHeading(heading) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let started = false;
    let node;
    while ((node = walker.nextNode())) {
      if (!started) {
        if (heading.contains(node)) started = true;
        continue;
      }
      if (node.parentElement?.closest("#poet-vr-extension-host, script, style, nav, footer")) continue;
      const val = (node.nodeValue || "").trim();
      if (/^20\d\d[.\/\-年]\s*\d{1,2}[.\/\-月]\s*\d{1,2}日?$/.test(val)) return node;
      if (/^(投稿者|コメント)$/.test(val)) return node;
    }
    return null;
  }

  function safeImageUrl(raw) {
    if (!raw) return null;
    try {
      const url = new URL(raw, location.href);
      return ["https:", "http:"].includes(url.protocol) ? url.href : null;
    } catch (_) { return null; }
  }

  function renderImages(images) {
    const panel = $("image-panel");
    const strip = $("image-strip");
    strip.replaceChildren();
    $("image-viewer").hidden = true;
    $("image-full").removeAttribute("src");
    if (!images.length) {
      panel.hidden = true;
      return;
    }
    panel.hidden = false;
    $("image-count").textContent = images.length === 1 ? "作品の画像" : `作品の画像（${images.length}枚）`;
    strip.classList.toggle("multi", images.length > 1);
    images.forEach((item, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("aria-label", `画像${index + 1}を拡大`);
      const img = document.createElement("img");
      img.src = item.src;
      img.alt = item.alt;
      // 元ページでの表示幅を優先し、画面の幅を超える場合のみ縮める。
      // 高さは自動計算し、画像の下方が隠れないようにする。
      if (item.displayWidth) img.style.width = `${Math.round(item.displayWidth)}px`;
      img.loading = "lazy";
      img.referrerPolicy = "no-referrer-when-downgrade";
      button.appendChild(img);
      button.addEventListener("click", () => {
        imageOpener = button;
        $("image-full").src = item.src;
        $("image-full").alt = item.alt;
        $("image-viewer-title").textContent = images.length === 1 ? "作品の画像" : `画像 ${index + 1} / ${images.length}`;
        $("image-viewer").hidden = false;
        $("image-close").focus();
      });
      strip.appendChild(button);
    });
  }

  function closeImage() {
    if ($("image-viewer").hidden) return;
    $("image-viewer").hidden = true;
    $("image-full").removeAttribute("src");
    if (imageOpener?.isConnected) imageOpener.focus();
  }

  function openReader() {
    const poem = extractPoem();
    $("title").textContent = poem.title;
    $("author").textContent = poem.author;
    $("poem").textContent = poem.text;
    const images = extractImages(getTitleElement(), poem.title);
    renderImages(images);
    lastFocused = document.activeElement;
    previousBodyOverflow = document.body.style.overflow;
    previousDocumentOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    veil.classList.add("open");
    veil.scrollTop = 0;
    launch.style.display = "none";
    editArea.classList.remove("visible");
    $("apply-text").classList.remove("visible");
    editArea.value = "";
    if (!poem.text && !images.length) {
      showStatus("本文を自動で見つけられませんでした。元のページで詩本文を選択してから開き直すか、下の入力欄に貼り付けてください。");
      editArea.classList.add("visible");
      $("apply-text").classList.add("visible");
      $("poem").textContent = "";
    } else if (poem.selected) {
      showStatus("ページ内で選択されていた文章を表示しています。");
    } else if (!poem.text && images.length) {
      showStatus("画像を表示しています。作品に本文がない場合は、そのままご覧ください。");
    } else {
      showStatus("");
    }
    setMode(poem.text || images.length ? "vertical" : "fallback");
    syncReaderHeight();
    (poem.text || images.length ? $("source") : editArea).focus();
  }

  function closeReader() {
    closeImage();
    veil.classList.remove("open");
    launch.style.display = "flex";
    document.body.style.overflow = previousBodyOverflow;
    document.documentElement.style.overflow = previousDocumentOverflow;
    showStatus("");
    if (lastFocused && lastFocused.isConnected && typeof lastFocused.focus === "function") lastFocused.focus();
    else launch.focus();
  }

  launch.addEventListener("click", openReader);
  $("source").addEventListener("click", closeReader);
  $("image-close").addEventListener("click", closeImage);
  $("image-viewer").addEventListener("click", e => {
    if (e.target === $("image-viewer") || e.target === $("image-viewer-body")) closeImage();
  });
  $("size").addEventListener("input", (e) => setFontSize(e.target.value));
  $("apply-text").addEventListener("click", () => {
    if (!editArea.value.trim()) {
      showStatus("本文を貼り付けてから「入力した本文を縦書きで表示」を押してください。");
      editArea.focus();
      return;
    }
    $("poem").textContent = cleanup(editArea.value);
    editArea.classList.remove("visible");
    $("apply-text").classList.remove("visible");
    showStatus("貼り付けた本文を表示しています。");
    setMode("vertical");
  });
  reader.addEventListener("scroll", updateScrollControls, { passive: true });
  $("progress").addEventListener("input", (e) => {
    reader.scrollLeft = -maxHorizontalScroll() * Number(e.target.value) / 1000;
  });
  $("next").addEventListener("click", () => {
    reader.scrollBy({ left: -reader.clientWidth * 0.8, behavior: "smooth" });
  });
  $("previous").addEventListener("click", () => {
    reader.scrollBy({ left: reader.clientWidth * 0.8, behavior: "smooth" });
  });
  window.addEventListener("resize", syncReaderHeight);
  // 画像付き作品では、本文にカーソルを置いても通常のホイールで画像へ戻れるようにします。
  // 画像なし作品のホイール列送りは維持。画像付き作品の列送りは Shift+ホイール、
  // 下部の矢印ボタン、進捗スライダー、または横方向のトラックパッド操作で行います。
  reader.addEventListener("wheel", (e) => {
    if (mode !== "vertical" || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;

    const imagePresent = !$("image-panel").hidden;
    if (imagePresent && !e.shiftKey) {
      // reader 自体は横スクロール領域なので、親の縦スクロールへ明示的に転送。
      // deltaMode=1 は行単位、2 はページ単位（通常は 0 のピクセル単位）。
      const multiplier = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? veil.clientHeight : 1;
      e.preventDefault();
      veil.scrollTop += e.deltaY * multiplier;
      return;
    }

    // 画像なし作品、および画像付き作品での Shift+ホイール。
    if (reader.scrollWidth <= reader.clientWidth) return;
    const multiplier = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? reader.clientWidth : 1;
    e.preventDefault();
    reader.scrollLeft -= e.deltaY * multiplier;
  }, { passive: false });
  document.addEventListener("keydown", (e) => {
    if (veil.classList.contains("open") && e.key === "Escape") {
      e.preventDefault();
      if (!$("image-viewer").hidden) closeImage(); else closeReader();
    }
  });
})();
